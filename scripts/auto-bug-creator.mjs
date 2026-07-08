/**
 * Auto Bug Creator
 *
 * Detects recently merged PRs in admin-app-v3, generates Playwright tests
 * for the changes using Claude, runs them against staging, and auto-creates
 * ADO bugs for any failures.
 *
 * Usage:
 *   node scripts/auto-bug-creator.mjs               (full run)
 *   node scripts/auto-bug-creator.mjs --dry-run     (list PRs only, no generation)
 *   node scripts/auto-bug-creator.mjs --hours 48    (look back 48h instead of 24h)
 *
 * Required env: ADO_PAT, ANTHROPIC_API_KEY
 * Optional:     SLACK_WEBHOOK_URL
 */

import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';

// ─── Config ───────────────────────────────────────────────────────────────────

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const ADO_PAT           = process.env.ADO_PAT;
const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL;

const ADO_ORG     = 'https://dev.azure.com/vivacityapp';
const ADO_PROJECT = 'Viva';
const APP_REPO    = 'admin-app-v3';  // repo name in ADO

const SCRIPT_DIR    = path.resolve('scripts');
const TESTS_DIR     = path.resolve('tests');
const GENERATED_DIR = path.join(TESTS_DIR, 'generated');
const STATE_FILE    = path.join(SCRIPT_DIR, 'auto-bug-state.json');
const SUMMARY_FILE  = path.join(SCRIPT_DIR, 'last-auto-bug-summary.json');

const DRY_RUN  = process.argv.includes('--dry-run');
const HOURS_IDX = process.argv.indexOf('--hours');
const LOOK_BACK_HOURS = HOURS_IDX !== -1 ? parseInt(process.argv[HOURS_IDX + 1]) : 24;

// PR title keywords that indicate frontend/UI changes worth testing
const UI_KEYWORDS = [
  'feat', 'feature', 'fix', 'add', 'new', 'update', 'module',
  'page', 'component', 'menu', 'nav', 'view', 'form', 'modal',
  'dialog', 'panel', 'tab', 'table', 'list', 'crud', 'editor',
  'dashboard', 'settings', 'admin',
];

// PR title keywords to skip (backend/infra changes)
const SKIP_KEYWORDS = [
  'chore', 'deps', 'ci:', 'ci(', 'build:', 'build(',
  'refactor: lint', 'typo', 'comment', 'log:', 'bump',
  'migration', 'seed', 'schema', 'env', 'docker', 'k8s',
  'backend', 'api only', 'ms-', 'worker', 'queue', 'cron',
];

// ─── State ────────────────────────────────────────────────────────────────────

function loadState() {
  if (!fs.existsSync(STATE_FILE)) return { processedPrIds: [], createdBugs: {}, lastRun: null };
  return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
}

function saveState(state) {
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

// ─── ADO Auth ─────────────────────────────────────────────────────────────────

function adoAuth() {
  return `Basic ${Buffer.from(`:${ADO_PAT}`).toString('base64')}`;
}

function adoHeaders() {
  return { Authorization: adoAuth(), 'Content-Type': 'application/json' };
}

// ─── ADO Git API ──────────────────────────────────────────────────────────────

async function getRepoId() {
  const res = await fetch(
    `${ADO_ORG}/${ADO_PROJECT}/_apis/git/repositories?api-version=7.0`,
    { headers: adoHeaders() }
  );
  if (!res.ok) throw new Error(`Failed to list repos: ${res.status}`);
  const data = await res.json();
  const repo = (data.value || []).find(r => r.name === APP_REPO);
  if (!repo) throw new Error(`Repo "${APP_REPO}" not found in project ${ADO_PROJECT}`);
  return repo.id;
}

async function fetchRecentMergedPRs(repoId, lookbackHours) {
  const since = new Date(Date.now() - lookbackHours * 60 * 60 * 1000).toISOString();

  const res = await fetch(
    `${ADO_ORG}/${ADO_PROJECT}/_apis/git/repositories/${repoId}/pullrequests` +
    `?status=completed&$top=50&api-version=7.0`,
    { headers: adoHeaders() }
  );
  if (!res.ok) throw new Error(`Failed to fetch PRs: ${res.status}`);
  const data = await res.json();

  return (data.value || []).filter(pr => {
    const closedDate = pr.closedDate || pr.completionQueueTime;
    return closedDate && new Date(closedDate) >= new Date(since);
  });
}

async function fetchPrChangedFiles(repoId, prId) {
  const res = await fetch(
    `${ADO_ORG}/${ADO_PROJECT}/_apis/git/repositories/${repoId}/pullrequests/${prId}/iterations?api-version=7.0`,
    { headers: adoHeaders() }
  );
  if (!res.ok) return [];
  const data = await res.json();
  const iterations = data.value || [];
  if (iterations.length === 0) return [];

  const lastIteration = iterations[iterations.length - 1].id;
  const changesRes = await fetch(
    `${ADO_ORG}/${ADO_PROJECT}/_apis/git/repositories/${repoId}/pullrequests/${prId}/iterations/${lastIteration}/changes?api-version=7.0`,
    { headers: adoHeaders() }
  );
  if (!changesRes.ok) return [];
  const changesData = await changesRes.json();
  return (changesData.changeEntries || []).map(c => c.item?.path || '').filter(Boolean);
}

// ─── PR filtering ─────────────────────────────────────────────────────────────

function isUiRelatedPr(pr, changedFiles) {
  const title = (pr.title || '').toLowerCase();
  const desc  = (pr.description || '').toLowerCase();

  if (SKIP_KEYWORDS.some(kw => title.startsWith(kw) || title.includes(kw))) return false;

  // Check file extensions — at least one .vue or .ts in src/pages or src/views
  const hasUiFile = changedFiles.some(f =>
    (f.endsWith('.vue') || f.endsWith('.ts')) &&
    (f.includes('/pages/') || f.includes('/views/') || f.includes('/components/') || f.includes('/modules/'))
  );

  const hasUiKeyword = UI_KEYWORDS.some(kw => title.includes(kw) || desc.includes(kw));

  return hasUiFile || hasUiKeyword;
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

async function generateTestForPr(pr, changedFiles) {
  const system = `You are an expert QA automation engineer for Vivacity, a Vue.js admin dashboard (Vuetify 3).
Write Playwright TypeScript tests that verify the feature described in the PR works correctly.
The test should FAIL if the feature is broken and PASS when it works.
Write clean, minimal, focused smoke tests.`;

  const filesSummary = changedFiles
    .filter(f => f.endsWith('.vue') || f.endsWith('.ts'))
    .slice(0, 20)
    .join('\n');

  const prompt = `Generate a Playwright TypeScript smoke test for this merged PR in admin-app-v3.

PR #${pr.pullRequestId}: ${pr.title}
URL: ${ADO_ORG}/${ADO_PROJECT}/_git/${APP_REPO}/pullrequest/${pr.pullRequestId}
Merged: ${pr.closedDate}
Author: ${pr.createdBy?.displayName || 'unknown'}

DESCRIPTION:
${pr.description || '(none)'}

CHANGED FILES (UI-relevant):
${filesSummary || '(none listed)'}

CONTEXT:
- App URL: https://app-staging.vivacityapp.com
- Import loginToApp from '../helpers/auth.helper'
- loginToApp(page) → kc@vivacityapp.com (standard org modules under /demo-student/*)
- loginToApp(page, 90000, 'pau.kie.chee@fusioneta.com', 'PAOpaopao@9696') → fusioneta (system-settings/*)
- Vuetify 3, Vue SPA — wait for .v-application before asserting

REQUIREMENTS:
- test.setTimeout(120000)
- Navigate to the relevant page based on the PR description
- Verify the key feature/fix works: page loads, element visible, action succeeds
- If repro is unclear, write a best-effort smoke test for the affected area
- Use waitForSelector / expect.toBeVisible — avoid long waitForTimeout
- Return ONLY valid TypeScript, no markdown fences, no explanation`;

  const code = await callClaude(prompt, system);
  return code
    .replace(/^```typescript?\n?/m, '').replace(/^```\n?/m, '').replace(/\n?```$/m, '')
    .trim();
}

// ─── Run test ─────────────────────────────────────────────────────────────────

function runTest(testFile) {
  console.log(`  Running: ${testFile}`);
  const result = spawnSync(
    'npx', ['playwright', 'test', testFile, '--workers=1', '--reporter=line'],
    { cwd: process.cwd(), timeout: 180000, encoding: 'utf8', stdio: 'pipe' }
  );
  const output = (result.stdout || '') + (result.stderr || '');
  const passed = result.status === 0;
  return { passed, output: output.slice(-3000) };
}

// ─── ADO Bug creation ─────────────────────────────────────────────────────────

async function createAdoBug({ title, description, reproSteps, tags }) {
  const patchDoc = [
    { op: 'add', path: '/fields/System.Title',                          value: title },
    { op: 'add', path: '/fields/System.Description',                    value: description },
    { op: 'add', path: '/fields/Microsoft.VSTS.TCM.ReproSteps',         value: reproSteps },
    { op: 'add', path: '/fields/System.AreaPath',                       value: ADO_PROJECT },
    { op: 'add', path: '/fields/System.Tags',                           value: tags || 'auto-generated; qa-bot' },
  ];

  const res = await fetch(
    `${ADO_ORG}/${ADO_PROJECT}/_apis/wit/workitems/$Bug?api-version=7.0`,
    {
      method: 'POST',
      headers: { ...adoHeaders(), 'Content-Type': 'application/json-patch+json' },
      body: JSON.stringify(patchDoc),
    }
  );

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Failed to create ADO bug: ${res.status} ${errText}`);
  }

  const data = await res.json();
  return {
    id: data.id,
    url: `${ADO_ORG}/${ADO_PROJECT}/_workitems/edit/${data.id}`,
  };
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
  console.log('Auto Bug Creator starting...\n');

  if (!ADO_PAT)           { console.error('ADO_PAT not set'); process.exit(1); }
  if (!ANTHROPIC_API_KEY && !DRY_RUN) {
    console.error('ANTHROPIC_API_KEY not set'); process.exit(1);
  }

  const state   = loadState();
  const done    = new Set(state.processedPrIds);
  const summary = { date: new Date().toISOString(), prs: [], bugsCreated: [] };

  // ── 1. Find the repo ──────────────────────────────────────────────────────
  console.log(`Looking up "${APP_REPO}" repo in ADO...`);
  let repoId;
  try {
    repoId = await getRepoId();
    console.log(`  Repo ID: ${repoId}\n`);
  } catch (err) {
    console.error(`  Failed: ${err.message}`);
    process.exit(1);
  }

  // ── 2. Fetch recent merged PRs ────────────────────────────────────────────
  console.log(`Fetching PRs merged in the last ${LOOK_BACK_HOURS}h...`);
  const allPrs = await fetchRecentMergedPRs(repoId, LOOK_BACK_HOURS);
  console.log(`  Found ${allPrs.length} merged PR(s)\n`);

  // ── 3. Filter to UI-relevant, unprocessed PRs ─────────────────────────────
  const toProcess = [];
  for (const pr of allPrs) {
    if (done.has(pr.pullRequestId)) {
      console.log(`  #${pr.pullRequestId} already processed — skip`);
      continue;
    }

    const changedFiles = await fetchPrChangedFiles(repoId, pr.pullRequestId);
    if (!isUiRelatedPr(pr, changedFiles)) {
      console.log(`  #${pr.pullRequestId} not UI-related — skip (${pr.title})`);
      done.add(pr.pullRequestId);
      continue;
    }

    toProcess.push({ pr, changedFiles });
  }

  if (toProcess.length === 0) {
    console.log('No new UI-related PRs to process.');
    state.processedPrIds = [...done];
    state.lastRun = new Date().toISOString();
    saveState(state);
    fs.writeFileSync(SUMMARY_FILE, JSON.stringify(summary, null, 2));
    return;
  }

  console.log(`\n${toProcess.length} PR(s) to test${DRY_RUN ? ' (dry run)' : ''}:\n`);
  for (const { pr } of toProcess) {
    console.log(`  #${pr.pullRequestId} by ${pr.createdBy?.displayName}: ${pr.title}`);
  }

  if (DRY_RUN) {
    console.log('\nDry run — skipping test generation.');
    return;
  }

  // ── 4. Generate test → run → create bug if fail ───────────────────────────
  fs.mkdirSync(GENERATED_DIR, { recursive: true });
  console.log('\nGenerating and running tests...\n');

  for (const { pr, changedFiles } of toProcess) {
    const prId = pr.pullRequestId;
    const outFile = path.join(GENERATED_DIR, `pr-${prId}.test.ts`);
    const prUrl = `${ADO_ORG}/${ADO_PROJECT}/_git/${APP_REPO}/pullrequest/${prId}`;

    console.log(`PR #${prId}: ${pr.title}`);

    let testCode;
    try {
      testCode = await generateTestForPr(pr, changedFiles);
      const header = `// PR #${prId}: ${pr.title}\n// ${prUrl}\n// Auto-generated ${new Date().toISOString().slice(0, 10)}\n// REVIEW BEFORE MERGING\n\n`;
      fs.writeFileSync(outFile, header + testCode);
      console.log(`  Saved: tests/generated/pr-${prId}.test.ts`);
    } catch (err) {
      console.error(`  Failed to generate test: ${err.message}`);
      done.add(prId);
      continue;
    }

    const { passed, output } = runTest(outFile);
    done.add(prId);

    const prSummary = {
      prId,
      title: pr.title,
      prUrl,
      testFile: path.relative(process.cwd(), outFile),
      passed,
    };

    if (passed) {
      console.log(`  PASS — PR #${prId} looks good on staging`);
    } else {
      console.log(`  FAIL — creating ADO bug for PR #${prId}`);

      const bugTitle = `[QA Bot] Regression: ${pr.title}`;
      const bugDesc  = `Auto-detected regression from PR <a href="${prUrl}">#${prId}</a>.<br><br>` +
                       `Merged by: ${pr.createdBy?.displayName || 'unknown'}<br>` +
                       `Test file: tests/generated/pr-${prId}.test.ts`;
      const reproSteps = `<ol>
<li>Deploy build from PR <a href="${prUrl}">#${prId}</a></li>
<li>Run test: <code>npx playwright test tests/generated/pr-${prId}.test.ts</code></li>
<li>Observe test failure</li>
</ol>
<pre>${output.slice(0, 2000)}</pre>`;

      try {
        const bug = await createAdoBug({
          title: bugTitle,
          description: bugDesc,
          reproSteps,
          tags: 'auto-generated; qa-bot; regression',
        });

        console.log(`  Bug created: #${bug.id} — ${bug.url}`);
        prSummary.bugId  = bug.id;
        prSummary.bugUrl = bug.url;
        summary.bugsCreated.push({ prId, title: pr.title, bugId: bug.id, bugUrl: bug.url });

        state.createdBugs[`pr-${prId}`] = {
          bugId: bug.id, bugUrl: bug.url, testFile: prSummary.testFile, passed: false,
        };
      } catch (err) {
        console.error(`  Failed to create ADO bug: ${err.message}`);
      }
    }

    summary.prs.push(prSummary);
  }

  // ── 5. Save state & send Slack ────────────────────────────────────────────
  state.processedPrIds = [...done];
  state.lastRun = new Date().toISOString();
  saveState(state);
  fs.writeFileSync(SUMMARY_FILE, JSON.stringify(summary, null, 2));

  console.log('\nDone.');

  if (summary.bugsCreated.length > 0 || summary.prs.length > 0) {
    const passCount = summary.prs.filter(p => p.passed).length;
    const failCount = summary.prs.filter(p => !p.passed).length;

    const bugList = summary.bugsCreated.map(b =>
      `• *Bug #${b.bugId}* ${b.title}\n  ADO: ${b.bugUrl}`
    ).join('\n');

    const slackMsg = summary.bugsCreated.length > 0
      ? `*QA Bot — Auto PR Regression Check*\n\n` +
        `Tested ${summary.prs.length} merged PR(s): ${passCount} passed, ${failCount} failed\n\n` +
        `*Bugs auto-created:*\n${bugList}`
      : `*QA Bot — Auto PR Regression Check*\n\n` +
        `Tested ${summary.prs.length} merged PR(s): all passed. No new bugs.`;

    await sendSlack(slackMsg);
    console.log('\nSummary saved to scripts/last-auto-bug-summary.json');
    console.log('Ask Claude to send the Slack notification if needed.');
  }
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
