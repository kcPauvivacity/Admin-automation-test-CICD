/**
 * QA AI Agent
 *
 * Analyzes pipeline test failures and:
 * 1. Auto-fixes test issues (selector/text changes) → creates GitHub PR
 * 2. Reports real bugs → creates ADO bug ticket + Slack notification
 * 3. Detects new features → generates new test script → creates GitHub PR
 *
 * Usage:
 *   node scripts/qa-agent.mjs [--results path/to/test-results.json]
 *
 * Required env vars:
 *   ANTHROPIC_API_KEY   - Claude API key
 *   GITHUB_TOKEN        - GitHub PAT (repo scope)
 *   ADO_PAT             - Azure DevOps PAT
 *   SLACK_WEBHOOK_URL   - Slack incoming webhook URL (optional)
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

// ─── Config ───────────────────────────────────────────────────────────────────

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const GITHUB_TOKEN      = process.env.GITHUB_TOKEN;
const ADO_PAT           = process.env.ADO_PAT;
const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL;

const GITHUB_REPO  = 'kcPauvivacity/Admin-automation-test-CICD';
const ADO_ORG      = 'https://dev.azure.com/vivacityapp';
const ADO_PROJECT  = 'Viva';

const TESTS_DIR    = path.resolve('tests');
const RESULTS_FILE = process.argv.includes('--results')
  ? process.argv[process.argv.indexOf('--results') + 1]
  : 'test-results.json';

// ─── Claude API ───────────────────────────────────────────────────────────────

async function callClaude(prompt, systemPrompt = '') {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      system: systemPrompt || 'You are a QA automation expert. Be concise and precise.',
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!response.ok) {
    throw new Error(`Claude API error: ${response.status} ${await response.text()}`);
  }

  const data = await response.json();
  return data.content[0].text;
}

// ─── Parse test results ────────────────────────────────────────────────────────

function parseFailures(resultsFile) {
  if (!fs.existsSync(resultsFile)) {
    console.log(`⚠️ Results file not found: ${resultsFile}`);
    return [];
  }

  const results = JSON.parse(fs.readFileSync(resultsFile, 'utf8'));
  const failures = [];

  function walk(suites) {
    for (const suite of suites || []) {
      for (const test of suite.specs || []) {
        for (const result of test.tests || []) {
          for (const r of result.results || []) {
            if (r.status === 'failed' || r.status === 'unexpected') {
              failures.push({
                file: suite.file || suite.title,
                title: test.title,
                error: r.error?.message || r.error?.value || 'Unknown error',
                duration: r.duration,
              });
            }
          }
        }
      }
      walk(suite.suites);
    }
  }

  walk(results.suites);
  return failures;
}

// ─── Read test file ────────────────────────────────────────────────────────────

function readTestFile(filePath) {
  const candidates = [
    filePath,
    path.join(TESTS_DIR, filePath),
    path.join(TESTS_DIR, path.basename(filePath)),
  ];

  for (const c of candidates) {
    if (fs.existsSync(c)) return { path: c, content: fs.readFileSync(c, 'utf8') };
  }
  return null;
}

// ─── Classify failures with Claude ────────────────────────────────────────────

async function classifyFailures(failures) {
  const grouped = {};
  for (const f of failures) {
    const key = f.file || 'unknown';
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(f);
  }

  const results = [];

  for (const [file, fileFails] of Object.entries(grouped)) {
    const testFile = readTestFile(file);
    const fileContent = testFile ? testFile.content.slice(0, 8000) : '(file not found)';

    const prompt = `
You are analyzing Playwright test failures for a Vue.js admin dashboard app (staging: https://app-staging.vivacityapp.com).

TEST FILE: ${file}
\`\`\`typescript
${fileContent}
\`\`\`

FAILURES:
${fileFails.map(f => `- Test: "${f.title}"\n  Error: ${f.error}`).join('\n\n')}

For each failure, classify it as ONE of:
1. TEST_FIX - The test code is wrong/outdated (selector changed, text changed, menu item removed, etc.)
2. REAL_BUG - The app has a genuine bug (feature broken, data missing, crash)
3. FLAKY - Timing/network issue, could retry

For TEST_FIX failures, also provide the exact code fix as a unified diff or replacement.

Respond in this JSON format:
{
  "classifications": [
    {
      "testTitle": "test title",
      "type": "TEST_FIX" | "REAL_BUG" | "FLAKY",
      "reason": "brief explanation",
      "fix": "if TEST_FIX: the corrected test code block (just the changed lines)",
      "bugDescription": "if REAL_BUG: clear description for the dev team"
    }
  ]
}`;

    const response = await callClaude(prompt);

    let parsed;
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      parsed = JSON.parse(jsonMatch[0]);
    } catch {
      console.error('Failed to parse Claude response:', response.slice(0, 200));
      continue;
    }

    results.push({
      file,
      filePath: testFile?.path,
      failures: fileFails,
      classifications: parsed.classifications,
    });
  }

  return results;
}

// ─── Apply test fixes ──────────────────────────────────────────────────────────

async function applyFix(fileResult, classification) {
  if (!fileResult.filePath || !classification.fix) return false;

  const prompt = `
Apply this fix to the test file.

CURRENT FILE CONTENT:
\`\`\`typescript
${fs.readFileSync(fileResult.filePath, 'utf8')}
\`\`\`

FIX TO APPLY (for test "${classification.testTitle}"):
${classification.fix}

Return ONLY the complete updated file content with the fix applied. No explanation, no markdown code fences.`;

  const updatedContent = await callClaude(prompt);

  // Remove any markdown fences if Claude added them
  const clean = updatedContent.replace(/^```typescript?\n?/m, '').replace(/\n?```$/m, '').trim();

  fs.writeFileSync(fileResult.filePath, clean);
  console.log(`  ✅ Applied fix to ${fileResult.filePath}`);
  return true;
}

// ─── Create GitHub PR ──────────────────────────────────────────────────────────

async function createGitHubPR(branchName, title, body, files) {
  // Get current branch SHA
  const mainSha = execSync('git rev-parse HEAD').toString().trim();

  // Create branch
  await fetch(`https://api.github.com/repos/${GITHUB_REPO}/git/refs`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${GITHUB_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ ref: `refs/heads/${branchName}`, sha: mainSha }),
  });

  // Update files on branch
  for (const filePath of files) {
    const content = fs.readFileSync(filePath, 'utf8');
    const repoPath = path.relative(process.cwd(), filePath);

    // Get current file SHA
    const getRes = await fetch(
      `https://api.github.com/repos/${GITHUB_REPO}/contents/${repoPath}?ref=${branchName}`,
      { headers: { Authorization: `Bearer ${GITHUB_TOKEN}` } }
    );
    const current = await getRes.json();

    await fetch(`https://api.github.com/repos/${GITHUB_REPO}/contents/${repoPath}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: title,
        content: Buffer.from(content).toString('base64'),
        sha: current.sha,
        branch: branchName,
      }),
    });
  }

  // Create PR
  const prRes = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/pulls`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${GITHUB_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      title,
      body,
      head: branchName,
      base: 'master',
    }),
  });

  const pr = await prRes.json();
  return pr.html_url;
}

// ─── Create ADO Bug ────────────────────────────────────────────────────────────

async function createAdoBug(title, description) {
  const auth = Buffer.from(`:${ADO_PAT}`).toString('base64');

  const body = [
    { op: 'add', path: '/fields/System.Title', value: title },
    { op: 'add', path: '/fields/System.Description', value: description },
    { op: 'add', path: '/fields/System.WorkItemType', value: 'Bug' },
    { op: 'add', path: '/fields/Microsoft.VSTS.Common.Priority', value: 2 },
    { op: 'add', path: '/fields/System.Tags', value: 'qa-agent; automated-detection' },
  ];

  const res = await fetch(
    `${ADO_ORG}/${ADO_PROJECT}/_apis/wit/workitems/$Bug?api-version=7.0`,
    {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/json-patch+json',
      },
      body: JSON.stringify(body),
    }
  );

  const data = await res.json();
  return data.id ? `${ADO_ORG}/${ADO_PROJECT}/_workitems/edit/${data.id}` : null;
}

// ─── Send Slack notification ───────────────────────────────────────────────────

async function sendSlack(message) {
  if (!SLACK_WEBHOOK_URL) return;
  await fetch(SLACK_WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: message }),
  });
}

// ─── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log('🤖 QA Agent starting...\n');

  if (!ANTHROPIC_API_KEY) {
    console.error('❌ ANTHROPIC_API_KEY not set');
    process.exit(1);
  }

  // Parse failures
  const failures = parseFailures(RESULTS_FILE);
  if (failures.length === 0) {
    console.log('✅ No failures found. Nothing to do.');
    return;
  }

  console.log(`📋 Found ${failures.length} failures. Analyzing...\n`);

  // Classify
  const classified = await classifyFailures(failures);

  const fixes = [];
  const bugs = [];
  const flaky = [];

  for (const fileResult of classified) {
    for (const c of fileResult.classifications) {
      console.log(`[${c.type}] ${fileResult.file} — "${c.testTitle}"`);
      console.log(`  Reason: ${c.reason}\n`);

      if (c.type === 'TEST_FIX') fixes.push({ fileResult, classification: c });
      else if (c.type === 'REAL_BUG') bugs.push({ fileResult, classification: c });
      else flaky.push({ fileResult, classification: c });
    }
  }

  // ── Handle TEST_FIX ──────────────────────────────────────────────────────────
  if (fixes.length > 0) {
    console.log(`\n🔧 Applying ${fixes.length} test fix(es)...`);
    const fixedFiles = new Set();

    for (const { fileResult, classification } of fixes) {
      const applied = await applyFix(fileResult, classification);
      if (applied) fixedFiles.add(fileResult.filePath);
    }

    if (fixedFiles.size > 0 && GITHUB_TOKEN) {
      const branch = `qa-agent/fix-tests-${Date.now()}`;
      const prTitle = `[QA Agent] Auto-fix ${fixes.length} test issue(s)`;
      const prBody = fixes.map(f =>
        `- **${f.fileResult.file}** — "${f.classification.testTitle}"\n  ${f.classification.reason}`
      ).join('\n');

      try {
        const prUrl = await createGitHubPR(branch, prTitle, prBody, [...fixedFiles]);
        console.log(`\n✅ PR created: ${prUrl}`);
        await sendSlack(`🤖 *QA Agent* fixed ${fixes.length} test issue(s)\nPR ready for review: ${prUrl}`);
      } catch (e) {
        console.error('Failed to create PR:', e.message);
      }
    }
  }

  // ── Handle REAL_BUG ──────────────────────────────────────────────────────────
  if (bugs.length > 0) {
    console.log(`\n🐛 Found ${bugs.length} real bug(s). Creating tickets...`);

    for (const { fileResult, classification } of bugs) {
      const title = `[QA] ${classification.testTitle}`;
      const desc = `
<b>Detected by QA Agent</b><br>
<b>Test file:</b> ${fileResult.file}<br>
<b>Test:</b> ${classification.testTitle}<br><br>
<b>Description:</b><br>${classification.bugDescription}<br><br>
<b>Error:</b><br>${fileResult.failures.find(f => f.title === classification.testTitle)?.error || ''}
`;
      if (ADO_PAT) {
        const url = await createAdoBug(title, desc);
        console.log(`  🐛 Bug ticket: ${url}`);
        await sendSlack(`🐛 *QA Agent* detected a real bug: "${classification.testTitle}"\nTicket: ${url}`);
      } else {
        console.log(`  🐛 Bug (no ADO_PAT): ${title}`);
        console.log(`     ${classification.bugDescription}`);
        await sendSlack(`🐛 *QA Agent* detected a real bug: "${classification.testTitle}"\n${classification.bugDescription}`);
      }
    }
  }

  // ── Summary ───────────────────────────────────────────────────────────────────
  console.log('\n─────────────────────────────────');
  console.log(`✅ Done. TEST_FIX: ${fixes.length} | REAL_BUG: ${bugs.length} | FLAKY: ${flaky.length}`);
}

main().catch(err => {
  console.error('❌ Agent error:', err);
  process.exit(1);
});
