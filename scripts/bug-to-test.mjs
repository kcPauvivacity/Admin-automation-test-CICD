/**
 * Bug → Test Generator + Verifier
 *
 * Two workflows:
 *
 * 1. NEW BUGS  → generate Playwright regression test
 *    - Fetches bugs created by YOU (@Me) that are Active/New
 *    - Filters to admin-app bugs only
 *    - Uses Claude to generate a test per bug
 *    - Saves to tests/generated/bug-{id}.test.ts
 *
 * 2. CLOSED BUGS → verify the fix
 *    - Checks tracked bugs that changed to Closed/Resolved
 *    - Runs the corresponding Playwright test
 *    - Reports pass/fail to Slack
 *
 * Usage:
 *   node scripts/bug-to-test.mjs               (full run: generate + verify)
 *   node scripts/bug-to-test.mjs --dry-run      (list bugs, no generation)
 *   node scripts/bug-to-test.mjs --id 12345     (force-process one bug)
 *   node scripts/bug-to-test.mjs --verify-only  (only run closed-bug checks)
 *
 * Required env vars:  ANTHROPIC_API_KEY, ADO_PAT
 * Optional:           GITHUB_TOKEN, SLACK_WEBHOOK_URL
 */

import fs from 'fs';
import path from 'path';
import { execSync, spawnSync } from 'child_process';

// ─── Config ───────────────────────────────────────────────────────────────────

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const ADO_PAT           = process.env.ADO_PAT;
const GITHUB_TOKEN      = process.env.GITHUB_TOKEN;
const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL;

const ADO_ORG     = 'https://dev.azure.com/vivacityapp';
const ADO_PROJECT = 'Viva';
const GITHUB_REPO = 'kcPauvivacity/Admin-automation-test-CICD';

const SCRIPT_DIR     = path.resolve('scripts');
const TESTS_DIR      = path.resolve('tests');
const GENERATED_DIR  = path.join(TESTS_DIR, 'generated');
const TRACKING_FILE  = path.join(SCRIPT_DIR, 'processed-bugs.json');

const DRY_RUN      = process.argv.includes('--dry-run');
const VERIFY_ONLY  = process.argv.includes('--verify-only');
const FORCE_ID     = process.argv.includes('--id')
  ? parseInt(process.argv[process.argv.indexOf('--id') + 1])
  : null;

// ─── Tracking file ────────────────────────────────────────────────────────────
// Structure:
// {
//   "processedIds": [123, 456],           ← skipped (not admin-app) or done
//   "bugs": {
//     "16788": {
//       "title": "...",
//       "testFile": "tests/generated/bug-16788.test.ts",
//       "lastState": "Active",
//       "verified": false
//     }
//   },
//   "lastRun": "2026-05-27T01:00:00Z"
// }

function loadTracking() {
  if (!fs.existsSync(TRACKING_FILE)) return { processedIds: [], bugs: {}, lastRun: null };
  const data = JSON.parse(fs.readFileSync(TRACKING_FILE, 'utf8'));
  if (!data.bugs) data.bugs = {};
  return data;
}

function saveTracking(data) {
  fs.writeFileSync(TRACKING_FILE, JSON.stringify(data, null, 2));
}

// ─── ADO API ──────────────────────────────────────────────────────────────────

function adoAuth() {
  return `Basic ${Buffer.from(`:${ADO_PAT}`).toString('base64')}`;
}

function stripHtml(html) {
  if (!html) return '';
  return html
    .replace(/<br\s*\/?>/gi, '\n').replace(/<\/p>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&')
    .replace(/\n{3,}/g, '\n\n').trim();
}

async function fetchMyBugIds(states = ['Active', 'New']) {
  const stateList = states.map(s => `'${s}'`).join(', ');
  const wiql = {
    query: `
      SELECT [System.Id]
      FROM WorkItems
      WHERE [System.WorkItemType] = 'Bug'
        AND [System.TeamProject] = '${ADO_PROJECT}'
        AND [System.CreatedBy] = @Me
        AND [System.State] IN (${stateList})
      ORDER BY [System.CreatedDate] DESC
    `
  };

  const res = await fetch(`${ADO_ORG}/${ADO_PROJECT}/_apis/wit/wiql?api-version=7.0`, {
    method: 'POST',
    headers: { Authorization: adoAuth(), 'Content-Type': 'application/json' },
    body: JSON.stringify(wiql),
  });
  if (!res.ok) throw new Error(`ADO WIQL error: ${res.status} ${await res.text()}`);
  const data = await res.json();
  return (data.workItems || []).map(wi => wi.id);
}

async function fetchBugState(id) {
  const res = await fetch(
    `${ADO_ORG}/${ADO_PROJECT}/_apis/wit/workitems/${id}?fields=System.State&api-version=7.0`,
    { headers: { Authorization: adoAuth() } }
  );
  if (!res.ok) return null;
  const data = await res.json();
  return data.fields?.['System.State'] || null;
}

async function fetchBugDetails(id) {
  const fields = [
    'System.Id', 'System.Title', 'System.Description',
    'Microsoft.VSTS.TCM.ReproSteps', 'System.State', 'System.CreatedDate', 'System.Tags',
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
    tags: f['System.Tags'] || '',
  };
}

// ─── Admin-app bug filter ─────────────────────────────────────────────────────

const SKIP_KEYWORDS = [
  'miniprogram', 'mini-program', 'mini program',
  'homepage:', 'room detail', 'property detail', 'property listing',
  'search results', 'map page', 'filter:', 'banner carousel',
  'backend', 'backend-testing', 'cf-workers', 'cf_workers',
  'elastic', 'elasticsearch', 'ms-ai', 'ms-scheduler', 'ms-securities',
  'vertex ai', 'yardi', 'hubspot', '[bug][p',
  'data quality', 'dimension update', 'infra', 'test -', 'test:',
];

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
  return false;
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

async function generateTest(bug) {
  const systemPrompt = `You are an expert QA automation engineer for Vivacity, a Vue.js admin dashboard (Vuetify 3).
Write Playwright TypeScript tests that FAIL when the bug is present and PASS when fixed.
Write clean, minimal, focused tests.`;

  const prompt = `Generate a Playwright TypeScript regression test for this ADO bug.

BUG #${bug.id}: ${bug.title}
URL: ${bug.url}

DESCRIPTION:
${bug.description || '(none)'}

REPRO STEPS:
${bug.reproSteps || '(none)'}

CONTEXT:
- App URL: https://app-staging.vivacityapp.com
- Import loginToApp from '../helpers/auth.helper'
- loginToApp(page) → kc@vivacityapp.com (org modules: /demo-student/*)
- loginToApp(page, 90000, 'pau.kie.chee@fusioneta.com', 'PAOpaopao@9696') → fusioneta (system-settings/*)
- Vuetify 3: .v-application.v-theme--DARK_BLUE_THEME (dark), .v-theme--BLUE_THEME (light)

REQUIREMENTS:
- test.setTimeout(120000) for simple tests, 300000 for multi-page tests
- The test FAILS if bug is present, PASSES when fixed
- If repro steps are vague, write a best-effort smoke test navigating to the relevant page
- Prefer waitForSelector/expect.toBeVisible over waitForTimeout
- Restore any state changes at the end

Return ONLY valid TypeScript. No markdown fences, no explanation.`;

  const code = await callClaude(prompt, systemPrompt);
  return code
    .replace(/^```typescript?\n?/m, '').replace(/^```\n?/m, '').replace(/\n?```$/m, '')
    .trim();
}

// ─── Run Playwright test ───────────────────────────────────────────────────────

function runTest(testFile) {
  console.log(`  🎭 Running: ${testFile}`);
  const result = spawnSync(
    'npx', ['playwright', 'test', testFile, '--workers=1', '--reporter=line'],
    { cwd: process.cwd(), timeout: 180000, encoding: 'utf8', stdio: 'pipe' }
  );
  const output = (result.stdout || '') + (result.stderr || '');
  const passed = result.status === 0;
  return { passed, output: output.slice(-2000) }; // last 2000 chars
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

// ─── GitHub PR ────────────────────────────────────────────────────────────────

async function createGitHubPR(newFiles) {
  const mainSha = execSync('git rev-parse HEAD').toString().trim();
  const branch = `qa-bot/bug-tests-${Date.now()}`;

  await fetch(`https://api.github.com/repos/${GITHUB_REPO}/git/refs`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${GITHUB_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ ref: `refs/heads/${branch}`, sha: mainSha }),
  });

  for (const filePath of newFiles) {
    const content = fs.readFileSync(filePath, 'utf8');
    const repoPath = path.relative(process.cwd(), filePath);
    await fetch(`https://api.github.com/repos/${GITHUB_REPO}/contents/${repoPath}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${GITHUB_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'test: auto-generate regression test from ADO bug',
        content: Buffer.from(content).toString('base64'),
        branch,
      }),
    });
  }

  const prRes = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/pulls`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${GITHUB_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: `[QA Bot] Regression tests for ${newFiles.length} bug(s)`,
      body: `Auto-generated regression tests from ADO bugs.\n\nFiles: ${newFiles.map(f => path.basename(f)).join(', ')}\n\n> Review selectors/assertions before merging.`,
      head: branch,
      base: 'master',
    }),
  });
  if (!prRes.ok) throw new Error(`Create PR failed: ${await prRes.text()}`);
  return (await prRes.json()).html_url;
}

// ─── Phase 1: Generate tests for new bugs ─────────────────────────────────────

async function generatePhase(tracking) {
  const alreadyDone = new Set(tracking.processedIds);

  let bugIds;
  if (FORCE_ID) {
    bugIds = [FORCE_ID];
    console.log(`🔍 Processing single bug: #${FORCE_ID}\n`);
  } else {
    console.log('🔍 Fetching YOUR Active/New bugs from ADO...');
    bugIds = await fetchMyBugIds(['Active', 'New']);
    console.log(`Found ${bugIds.length} bug(s) you created\n`);
  }

  const unprocessedIds = FORCE_ID ? bugIds : bugIds.filter(id => !alreadyDone.has(id));
  if (unprocessedIds.length === 0) {
    console.log('✅ No new bugs to process.');
    return [];
  }

  // Fetch details and filter
  console.log(`🔎 Fetching details for ${unprocessedIds.length} bug(s)...`);
  const allBugs = [];
  for (const id of unprocessedIds) allBugs.push(await fetchBugDetails(id));

  const bugs = FORCE_ID ? allBugs : allBugs.filter(bug => isAdminAppBug(bug.title));
  const skippedCount = allBugs.length - bugs.length;

  if (!FORCE_ID && skippedCount > 0) {
    console.log(`  ⏭️  Skipped ${skippedCount} non-admin-app bugs`);
    for (const bug of allBugs) {
      if (!bugs.includes(bug)) alreadyDone.add(bug.id);
    }
  }

  if (bugs.length === 0) {
    console.log('✅ No admin-app bugs to generate tests for.');
    tracking.processedIds = [...alreadyDone];
    return [];
  }

  console.log(`\n📋 ${bugs.length} admin-app bug(s) to process${DRY_RUN ? ' (dry run)' : ''}:\n`);
  for (const bug of bugs) console.log(`  #${bug.id} [${bug.state}] ${bug.title}`);

  if (DRY_RUN) {
    console.log('\n⏭️  Dry run — skipping test generation.');
    return [];
  }

  console.log('\n🤖 Generating tests with Claude...\n');
  fs.mkdirSync(GENERATED_DIR, { recursive: true });

  const generatedFiles = [];

  for (const bug of bugs) {
    const outFile = path.join(GENERATED_DIR, `bug-${bug.id}.test.ts`);

    if (fs.existsSync(outFile) && !FORCE_ID) {
      console.log(`  ⏭️  #${bug.id} — test already exists`);
      alreadyDone.add(bug.id);
      if (!tracking.bugs[bug.id]) {
        tracking.bugs[bug.id] = { title: bug.title, testFile: path.relative(process.cwd(), outFile), lastState: bug.state, verified: false };
      }
      continue;
    }

    console.log(`  ⚙️  #${bug.id}: ${bug.title}`);
    try {
      const testCode = await generateTest(bug);
      const header = `// Bug #${bug.id}: ${bug.title}\n// ADO: ${bug.url}\n// Auto-generated ${new Date().toISOString().slice(0, 10)}\n// REVIEW BEFORE MERGING — verify selectors and assertions\n\n`;
      fs.writeFileSync(outFile, header + testCode);

      console.log(`  ✅ Saved: tests/generated/bug-${bug.id}.test.ts`);
      generatedFiles.push(outFile);
      alreadyDone.add(bug.id);
      tracking.bugs[bug.id] = {
        title: bug.title,
        testFile: path.relative(process.cwd(), outFile),
        lastState: bug.state,
        verified: false,
      };
    } catch (err) {
      console.error(`  ❌ Failed for #${bug.id}: ${err.message}`);
    }
  }

  tracking.processedIds = [...alreadyDone];

  if (generatedFiles.length > 0) {
    // Send Slack summary — skip AppEditor bugs (too noisy, batch bugs)
    const notifyFiles = generatedFiles.filter(f => {
      const id = path.basename(f).replace('bug-', '').replace('.test.ts', '');
      const title = (tracking.bugs[id]?.title || '').toLowerCase();
      return !title.includes('appeditor');
    });

    if (notifyFiles.length > 0) {
      const bugList = notifyFiles.map(f => {
        const id = path.basename(f).replace('bug-', '').replace('.test.ts', '');
        const info = tracking.bugs[id];
        return `• *#${id}* ${info?.title || ''}\n  ADO: https://dev.azure.com/vivacityapp/Viva/_workitems/edit/${id}`;
      }).join('\n');

      const slackMsg = `🤖 *QA Bot* — Auto-generated regression tests for the following bugs:\n\n${bugList}\n\n_Tests will automatically run when the bug is closed to verify the fix._`;
      await sendSlack(slackMsg);
    }

    if (GITHUB_TOKEN) {
      console.log('\n🚀 Creating GitHub PR...');
      try {
        const prUrl = await createGitHubPR(generatedFiles);
        console.log(`  ✅ PR: ${prUrl}`);
        await sendSlack(`🔗 PR ready for review: ${prUrl}`);
      } catch (err) {
        console.error('  ❌ PR creation failed:', err.message);
      }
    }
  }

  return generatedFiles;
}

// ─── Phase 2: Verify closed bugs ─────────────────────────────────────────────

async function verifyPhase(tracking) {
  const trackedBugs = Object.entries(tracking.bugs).filter(([, info]) => !info.verified);
  if (trackedBugs.length === 0) {
    console.log('✅ No pending verifications.');
    return;
  }

  console.log(`\n🔎 Checking state of ${trackedBugs.length} tracked bug(s)...`);

  const CLOSED_STATES = ['Closed', 'Resolved', 'Done'];

  for (const [idStr, info] of trackedBugs) {
    const id = parseInt(idStr);
    const currentState = await fetchBugState(id);
    if (!currentState) continue;

    // Update stored state
    tracking.bugs[idStr].lastState = currentState;

    if (!CLOSED_STATES.includes(currentState)) {
      console.log(`  #${id} still ${currentState} — skipping`);
      continue;
    }

    // Bug was closed! Run the test.
    const testFile = info.testFile;
    if (!fs.existsSync(testFile)) {
      console.log(`  #${id} closed but test file not found: ${testFile}`);
      tracking.bugs[idStr].verified = true;
      continue;
    }

    console.log(`\n  🐛 Bug #${id} is now ${currentState}: "${info.title}"`);
    const { passed, output } = runTest(testFile);

    tracking.bugs[idStr].verified = true;
    tracking.bugs[idStr].verifyResult = passed ? 'pass' : 'fail';
    tracking.bugs[idStr].verifyDate = new Date().toISOString().slice(0, 10);

    const adoUrl = `https://dev.azure.com/vivacityapp/Viva/_workitems/edit/${id}`;

    if (passed) {
      console.log(`  ✅ VERIFIED FIXED — bug #${id} passes the regression test`);
      await sendSlack(`✅ *Bug #${id} VERIFIED FIXED*\n"${info.title}"\nRegression test passed after closing.\nADO: ${adoUrl}`);
    } else {
      console.log(`  ❌ NOT FIXED — bug #${id} regression test still FAILS`);
      console.log(`\n--- Test output ---\n${output}\n---`);
      await sendSlack(`❌ *Bug #${id} NOT FIXED*\n"${info.title}"\nBug was closed but regression test still FAILS.\nADO: ${adoUrl}`);
    }
  }
}

// ─── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log('🐛 Bug → Test Generator starting...\n');

  if (!ADO_PAT) { console.error('❌ ADO_PAT not set'); process.exit(1); }
  if (!ANTHROPIC_API_KEY && !DRY_RUN && !VERIFY_ONLY) {
    console.error('❌ ANTHROPIC_API_KEY not set'); process.exit(1);
  }

  const tracking = loadTracking();

  if (!VERIFY_ONLY) {
    await generatePhase(tracking);
  }

  await verifyPhase(tracking);

  tracking.lastRun = new Date().toISOString();
  saveTracking(tracking);

  console.log('\n✅ Done.');
}

main().catch(err => {
  console.error('❌ Fatal error:', err);
  process.exit(1);
});
