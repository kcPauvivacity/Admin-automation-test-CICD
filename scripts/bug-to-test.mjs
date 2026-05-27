/**
 * Bug → Test Generator
 *
 * Daily script that:
 * 1. Fetches Active/New bugs from Azure DevOps
 * 2. Skips bugs already processed (tracked in processed-bugs.json)
 * 3. Uses Claude to generate a Playwright test for each new bug
 * 4. Saves tests to tests/generated/bug-{id}.test.ts
 * 5. Creates a GitHub PR with the new tests
 * 6. Sends Slack notification
 *
 * Usage:
 *   node scripts/bug-to-test.mjs
 *   node scripts/bug-to-test.mjs --dry-run   (show bugs, don't generate)
 *   node scripts/bug-to-test.mjs --id 12345  (process one specific bug)
 *
 * Required env vars:
 *   ANTHROPIC_API_KEY   - Claude API key
 *   ADO_PAT             - Azure DevOps PAT
 * Optional:
 *   GITHUB_TOKEN        - GitHub PAT (for auto PR creation)
 *   SLACK_WEBHOOK_URL   - Slack incoming webhook
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

// ─── Config ───────────────────────────────────────────────────────────────────

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const ADO_PAT           = process.env.ADO_PAT;
const GITHUB_TOKEN      = process.env.GITHUB_TOKEN;
const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL;

const ADO_ORG     = 'https://dev.azure.com/vivacityapp';
const ADO_PROJECT = 'Viva';
const APP_URL     = 'https://app-staging.vivacityapp.com';
const GITHUB_REPO = 'kcPauvivacity/Admin-automation-test-CICD';

const SCRIPT_DIR      = path.resolve('scripts');
const TESTS_DIR       = path.resolve('tests');
const GENERATED_DIR   = path.join(TESTS_DIR, 'generated');
const PROCESSED_FILE  = path.join(SCRIPT_DIR, 'processed-bugs.json');

const DRY_RUN  = process.argv.includes('--dry-run');
const FORCE_ID = process.argv.includes('--id')
  ? parseInt(process.argv[process.argv.indexOf('--id') + 1])
  : null;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function loadProcessed() {
  if (!fs.existsSync(PROCESSED_FILE)) return { processedIds: [], lastRun: null };
  return JSON.parse(fs.readFileSync(PROCESSED_FILE, 'utf8'));
}

function saveProcessed(data) {
  fs.writeFileSync(PROCESSED_FILE, JSON.stringify(data, null, 2));
}

function stripHtml(html) {
  if (!html) return '';
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

// ─── ADO API ──────────────────────────────────────────────────────────────────

function adoAuth() {
  return `Basic ${Buffer.from(`:${ADO_PAT}`).toString('base64')}`;
}

async function fetchBugs() {
  // WIQL query: Active/New bugs from last 90 days
  const wiql = {
    query: `
      SELECT [System.Id], [System.Title], [System.State], [System.CreatedDate]
      FROM WorkItems
      WHERE [System.WorkItemType] = 'Bug'
        AND [System.TeamProject] = '${ADO_PROJECT}'
        AND [System.State] IN ('Active', 'New')
      ORDER BY [System.CreatedDate] DESC
    `
  };

  const res = await fetch(
    `${ADO_ORG}/${ADO_PROJECT}/_apis/wit/wiql?api-version=7.0`,
    {
      method: 'POST',
      headers: {
        Authorization: adoAuth(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(wiql),
    }
  );

  if (!res.ok) throw new Error(`ADO WIQL error: ${res.status} ${await res.text()}`);
  const data = await res.json();
  return (data.workItems || []).map(wi => wi.id);
}

async function fetchBugDetails(id) {
  const fields = [
    'System.Id',
    'System.Title',
    'System.Description',
    'Microsoft.VSTS.TCM.ReproSteps',
    'System.State',
    'System.CreatedDate',
    'System.AssignedTo',
    'System.Tags',
  ].join(',');

  const res = await fetch(
    `${ADO_ORG}/${ADO_PROJECT}/_apis/wit/workitems/${id}?fields=${fields}&api-version=7.0`,
    { headers: { Authorization: adoAuth() } }
  );

  if (!res.ok) throw new Error(`ADO fetch bug ${id}: ${res.status}`);
  const data = await res.json();
  const f = data.fields;

  return {
    id,
    url: `https://dev.azure.com/vivacityapp/Viva/_workitems/edit/${id}`,
    title: f['System.Title'] || '',
    description: stripHtml(f['System.Description'] || ''),
    reproSteps: stripHtml(f['Microsoft.VSTS.TCM.ReproSteps'] || ''),
    state: f['System.State'] || '',
    createdDate: f['System.CreatedDate'] || '',
    tags: f['System.Tags'] || '',
  };
}

// ─── Claude API ───────────────────────────────────────────────────────────────

async function callClaude(prompt, systemPrompt) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      system: systemPrompt,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!res.ok) throw new Error(`Claude API error: ${res.status} ${await res.text()}`);
  const data = await res.json();
  return data.content[0].text;
}

// ─── Filter: is this bug testable in the admin web app? ───────────────────────

// Keywords in titles that indicate NON-admin-app bugs (skip these)
const SKIP_KEYWORDS = [
  'miniprogram', 'mini-program', 'mini program',
  'homepage:', 'room detail', 'property detail', 'property listing',
  'search results', 'map page', 'filter:', 'banner carousel',
  'backend', 'backend-testing', 'cf-workers', 'cf_workers',
  'elastic', 'elasticsearch', 'ms-ai', 'ms-scheduler', 'ms-securities',
  'vertex ai', 'yardi', 'hubspot',
  '[bug][p', // automated error monitoring bugs (not UI bugs)
  'data quality', 'dimension update', 'infra',
  'test -', 'test:', // test bugs / PAT verification
];

// Keywords that confirm it IS an admin app bug
const ADMIN_KEYWORDS = [
  'admin', '[admin]', 'e2e', 'admin-app',
  'settings', 'dashboard', 'articles', 'contacts', 'enquiries',
  'surveys', 'reports', 'tracking', 'properties', 'promotions',
  'facilities', 'attributes', 'tags', 'cities', 'universities',
  'app editor', 'appeditor', 'form builder', 'formbuilder',
  'dark theme', 'light theme', 'user profile', 'billing',
  'integrations', 'system-settings', 'ai agents', 'ai chat',
  'managed services', 'sales consultant', 'chat centre',
];

function isAdminAppBug(title) {
  const lower = title.toLowerCase();
  if (SKIP_KEYWORDS.some(kw => lower.includes(kw))) return false;
  if (ADMIN_KEYWORDS.some(kw => lower.includes(kw))) return true;
  // Default: uncertain — include to be safe (Claude will generate best-effort test)
  return false;
}

// ─── Generate test from bug ────────────────────────────────────────────────────

const AUTH_HELPER_EXAMPLE = `
import { test, expect } from '@playwright/test';
import { loginToApp } from '../helpers/auth.helper';

// loginToApp(page) — logs in as kc@vivacityapp.com (default, org-scoped modules)
// loginToApp(page, 90000, 'pau.kie.chee@fusioneta.com', 'PAOpaopao@9696') — fusioneta (system-settings)

// Common URL patterns:
// https://app-staging.vivacityapp.com/demo-student/<module>   ← org-scoped pages
// https://app-staging.vivacityapp.com/system-settings/<module> ← system settings (fusioneta)

// Theme classes:
// .v-application.v-theme--BLUE_THEME       = light theme
// .v-application.v-theme--DARK_BLUE_THEME  = dark theme

// Useful selectors:
// button[aria-label*="User profile menu"]       ← avatar button
// button[aria-label="Open theme selector"]      ← expand theme panel
// button[aria-label="Dark theme"]               ← switch dark
// button[aria-label*="Light theme"]             ← switch light
`;

async function generateTest(bug) {
  const systemPrompt = `You are an expert QA automation engineer for Vivacity, a Vue.js admin dashboard (Vuetify 3).
Your job is to write Playwright TypeScript tests that FAIL when a bug is present and PASS when it is fixed.
Write clean, minimal, focused tests. No comments unless logic is non-obvious.`;

  const prompt = `Generate a Playwright TypeScript regression test for this ADO bug.

BUG #${bug.id}: ${bug.title}
URL: ${bug.url}

DESCRIPTION:
${bug.description || '(none)'}

REPRO STEPS:
${bug.reproSteps || '(none)'}

CONTEXT:
${AUTH_HELPER_EXAMPLE}

REQUIREMENTS:
- Import test, expect from @playwright/test and loginToApp from ../helpers/auth.helper
- Use loginToApp to log in before navigating (kc account for org modules, fusioneta for system-settings)
- test.setTimeout(120000) for simple tests, 300000 for tests covering multiple pages
- The test should FAIL if the bug is still present, PASS when fixed
- If repro steps are vague or incomplete, write a best-effort smoke test that at least navigates to the relevant page and checks basic functionality
- Do NOT use page.waitForTimeout() unnecessarily — use waitForSelector or expect.toBeVisible()
- End the test by restoring any state changed (e.g. reset theme to light if changed)

Return ONLY valid TypeScript code. No markdown fences, no explanation.`;

  const code = await callClaude(prompt, systemPrompt);

  // Strip markdown fences if Claude added them
  return code
    .replace(/^```typescript?\n?/m, '')
    .replace(/^```\n?/m, '')
    .replace(/\n?```$/m, '')
    .trim();
}

// ─── GitHub PR ────────────────────────────────────────────────────────────────

async function createGitHubPR(newFiles) {
  const mainSha = execSync('git rev-parse HEAD').toString().trim();
  const branch = `qa-bot/bug-tests-${Date.now()}`;

  // Create branch
  const branchRes = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/git/refs`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${GITHUB_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ ref: `refs/heads/${branch}`, sha: mainSha }),
  });
  if (!branchRes.ok) throw new Error(`Create branch failed: ${await branchRes.text()}`);

  // Push each new file
  for (const filePath of newFiles) {
    const content = fs.readFileSync(filePath, 'utf8');
    const repoPath = path.relative(process.cwd(), filePath);

    await fetch(`https://api.github.com/repos/${GITHUB_REPO}/contents/${repoPath}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${GITHUB_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: `test: auto-generate regression test from ADO bug`,
        content: Buffer.from(content).toString('base64'),
        branch,
      }),
    });
  }

  // Create PR
  const titles = newFiles.map(f => path.basename(f)).join(', ');
  const prRes = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/pulls`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${GITHUB_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: `[QA Bot] Regression tests for ${newFiles.length} bug(s)`,
      body: `Auto-generated regression tests from ADO bugs.\n\nFiles: ${titles}\n\n> Review and adjust selectors/assertions before merging.`,
      head: branch,
      base: 'master',
    }),
  });
  if (!prRes.ok) throw new Error(`Create PR failed: ${await prRes.text()}`);
  const pr = await prRes.json();
  return pr.html_url;
}

// ─── Slack ────────────────────────────────────────────────────────────────────

async function sendSlack(text) {
  if (!SLACK_WEBHOOK_URL) return;
  await fetch(SLACK_WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });
}

// ─── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log('🐛 Bug → Test Generator starting...\n');

  if (!ADO_PAT) { console.error('❌ ADO_PAT not set'); process.exit(1); }
  if (!ANTHROPIC_API_KEY && !DRY_RUN) { console.error('❌ ANTHROPIC_API_KEY not set'); process.exit(1); }

  // Fetch bug IDs
  let bugIds;
  if (FORCE_ID) {
    bugIds = [FORCE_ID];
    console.log(`🔍 Processing single bug: #${FORCE_ID}\n`);
  } else {
    console.log('🔍 Fetching Active/New bugs from ADO...');
    bugIds = await fetchBugs();
    console.log(`Found ${bugIds.length} active bug(s)\n`);
  }

  // Load processed history
  const processed = loadProcessed();
  const alreadyDone = new Set(processed.processedIds);

  // Filter new bugs (not yet processed)
  const unprocessedIds = FORCE_ID
    ? bugIds
    : bugIds.filter(id => !alreadyDone.has(id));

  if (unprocessedIds.length === 0) {
    console.log('✅ No new bugs to process.');
    processed.lastRun = new Date().toISOString();
    saveProcessed(processed);
    return;
  }

  // Fetch details and filter to admin-app bugs only
  console.log(`🔎 Fetching details for ${unprocessedIds.length} unprocessed bug(s)...`);
  const allBugs = [];
  for (const id of unprocessedIds) {
    const bug = await fetchBugDetails(id);
    allBugs.push(bug);
  }

  const bugs = FORCE_ID ? allBugs : allBugs.filter(bug => isAdminAppBug(bug.title));
  const skippedCount = allBugs.length - bugs.length;

  if (!FORCE_ID && skippedCount > 0) {
    console.log(`  ⏭️  Skipped ${skippedCount} non-admin-app bugs`);
    // Mark skipped bugs as processed so we don't re-check them daily
    for (const bug of allBugs) {
      if (!bugs.includes(bug)) alreadyDone.add(bug.id);
    }
  }

  if (bugs.length === 0) {
    console.log('✅ No admin-app bugs to generate tests for.');
    processed.processedIds = [...alreadyDone];
    processed.lastRun = new Date().toISOString();
    saveProcessed(processed);
    return;
  }

  console.log(`\n📋 ${bugs.length} admin-app bug(s) to process${DRY_RUN ? ' (dry run)' : ''}:\n`);
  for (const bug of bugs) {
    console.log(`  #${bug.id} [${bug.state}] ${bug.title}`);
  }

  if (DRY_RUN) {
    console.log('\n⏭️  Dry run — skipping test generation.');
    return;
  }

  // Generate tests
  console.log('\n🤖 Generating tests with Claude...\n');
  fs.mkdirSync(GENERATED_DIR, { recursive: true });

  const generatedFiles = [];

  for (const bug of bugs) {
    const outFile = path.join(GENERATED_DIR, `bug-${bug.id}.test.ts`);

    // Skip if file already exists (manual re-run protection)
    if (fs.existsSync(outFile) && !FORCE_ID) {
      console.log(`  ⏭️  #${bug.id} — file already exists, skipping`);
      alreadyDone.add(bug.id);
      continue;
    }

    console.log(`  ⚙️  Generating test for #${bug.id}: ${bug.title}`);
    try {
      const testCode = await generateTest(bug);

      // Prepend a comment header with bug info
      const header = `// Bug #${bug.id}: ${bug.title}\n// ADO: ${bug.url}\n// Auto-generated by bug-to-test.mjs on ${new Date().toISOString().slice(0, 10)}\n// REVIEW BEFORE MERGING — verify selectors and assertions match current UI\n\n`;
      fs.writeFileSync(outFile, header + testCode);

      console.log(`  ✅ Saved: tests/generated/bug-${bug.id}.test.ts`);
      generatedFiles.push(outFile);
      alreadyDone.add(bug.id);
    } catch (err) {
      console.error(`  ❌ Failed for #${bug.id}: ${err.message}`);
    }
  }

  // Update processed list
  processed.processedIds = [...alreadyDone];
  processed.lastRun = new Date().toISOString();
  saveProcessed(processed);

  if (generatedFiles.length === 0) {
    console.log('\n⚠️  No files generated.');
    return;
  }

  console.log(`\n📁 Generated ${generatedFiles.length} test file(s)`);

  // Create GitHub PR
  if (GITHUB_TOKEN && generatedFiles.length > 0) {
    console.log('\n🚀 Creating GitHub PR...');
    try {
      const prUrl = await createGitHubPR(generatedFiles);
      console.log(`  ✅ PR: ${prUrl}`);
      await sendSlack(`🤖 *QA Bot* generated ${generatedFiles.length} regression test(s) from ADO bugs\nPR ready for review: ${prUrl}`);
    } catch (err) {
      console.error('  ❌ PR creation failed:', err.message);
    }
  } else if (generatedFiles.length > 0) {
    console.log('\n💡 Set GITHUB_TOKEN to auto-create a PR.');
    const list = generatedFiles.map(f => `  - ${path.relative(process.cwd(), f)}`).join('\n');
    await sendSlack(`🤖 *QA Bot* generated ${generatedFiles.length} regression test(s) from ADO bugs\nFiles:\n${list}`);
  }

  console.log('\n✅ Done.');
}

main().catch(err => {
  console.error('❌ Fatal error:', err);
  process.exit(1);
});
