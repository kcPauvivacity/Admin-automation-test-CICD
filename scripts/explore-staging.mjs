/**
 * Vivacity Staging Explorer
 *
 * Playwright-based autonomous E2E explorer that:
 * 1. Logs into staging and navigates all key modules
 * 2. Captures screenshots + console errors per page
 * 3. Sends findings to Claude API for analysis
 * 4. Auto-creates ADO bugs for real issues
 * 5. Sends Slack summary
 *
 * Usage:
 *   node scripts/explore-staging.mjs
 *   node scripts/explore-staging.mjs --module properties
 *   node scripts/explore-staging.mjs --dry-run
 */

import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const ADO_PAT           = process.env.ADO_PAT;
const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL;

const BASE_URL  = 'https://app-staging.vivacityapp.com';
const EMAIL     = 'kc@vivacityapp.com';
const PASSWORD  = 'PAOpaopao@9696';

const DRY_RUN      = process.argv.includes('--dry-run');
const MODULE_IDX   = process.argv.indexOf('--module');
const ONLY_MODULE  = MODULE_IDX !== -1 ? process.argv[MODULE_IDX + 1] : null;

const SCREENSHOTS_DIR = path.resolve('scripts/explore-screenshots');
const RESULTS_FILE    = path.resolve('scripts/explore-results.json');

// ─── Modules to explore ───────────────────────────────────────────────────────

const MODULES = [
  { name: 'dashboard',    slug: null,          check: ['Dashboard', 'Properties', 'Enquiries'] },
  { name: 'properties',   slug: 'properties',  check: ['Properties', 'Search'] },
  { name: 'contacts',     slug: 'contacts',    check: ['Contacts'] },
  { name: 'enquiries',    slug: 'enquiries',   check: ['Enquiries'] },
  { name: 'analytics',    slug: 'analytics',   check: ['Analytics'] },
  { name: 'attributes',   slug: 'attributes',  check: ['Attributes'] },
  { name: 'cities',       slug: 'cities',      check: ['Cities'] },
  { name: 'facilities',   slug: 'facilities',  check: ['Facilities'] },
  { name: 'faq',          slug: 'faq',         check: ['FAQ'] },
  { name: 'tags',         slug: 'tags',        check: ['Tags'] },
  { name: 'universities', slug: 'universities',check: ['Universities'] },
  { name: 'promotions',   slug: 'promotions',  check: ['Promotions'] },
  { name: 'surveys',      slug: 'surveys',     check: ['Surveys'] },
  { name: 'tracking',     slug: 'tracking',    check: ['Tracking'] },
];

// ─── Login ────────────────────────────────────────────────────────────────────

async function login(page) {
  console.log('  Logging in...');
  await page.goto(BASE_URL, { waitUntil: 'load', timeout: 60000 });
  await page.waitForSelector('input[name="username"]', { timeout: 30000 });
  await page.fill('input[name="username"]', EMAIL);
  await page.click('button[type="submit"]');
  await page.waitForSelector('input[name="password"]', { timeout: 15000 });
  await page.fill('input[name="password"]', PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForLoadState('load', { timeout: 30000 });
  await page.waitForTimeout(3000);

  // Handle passkey enrollment
  const continueBtn = page.locator('button:has-text("Continue"), a:has-text("Continue")').first();
  if (await continueBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
    await continueBtn.click();
    await page.waitForLoadState('load', { timeout: 15000 });
    await page.waitForTimeout(2000);
  }

  // Wait for redirect away from /auth to the actual app (e.g. /demo-student/dashboard)
  await page.waitForURL(url => !url.pathname.startsWith('/auth') && !url.pathname.startsWith('/login'), {
    timeout: 30000,
  }).catch(() => {});
  await page.waitForTimeout(3000);

  // Extract org slug from URL (e.g. "demo-student" from /demo-student/dashboard)
  const url = page.url();
  const match = url.match(/app-staging\.vivacityapp\.com\/([^/?#]+)/);
  const orgSlug = (match && match[1] !== 'auth' && match[1] !== 'login') ? match[1] : 'demo-student';
  console.log(`  Logged in. Org slug: ${orgSlug} (URL: ${url})`);
  return orgSlug;
}

// ─── Explore a module ─────────────────────────────────────────────────────────

async function exploreModule(page, mod, orgSlug) {
  const consoleErrors = [];
  const networkErrors = [];

  page.on('console', msg => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  page.on('response', res => {
    if (res.status() >= 400) networkErrors.push(`${res.status()} ${res.url()}`);
  });

  const url = mod.slug
    ? `${BASE_URL}/${orgSlug}/${mod.slug}`
    : `${BASE_URL}/${orgSlug}`;

  console.log(`  → ${mod.name}: ${url}`);

  let loadedOk = false;
  let pageTitle = '';
  let screenshotPath = null;

  try {
    await page.goto(url, { waitUntil: 'load', timeout: 30000 });
    await page.waitForTimeout(3000);

    // Wait for Vue app
    await page.waitForSelector('.v-application', { timeout: 8000 }).catch(() => {});

    pageTitle = await page.title();

    // Take screenshot
    const ssFile = path.join(SCREENSHOTS_DIR, `${mod.name}.png`);
    await page.screenshot({ path: ssFile, fullPage: false });
    screenshotPath = ssFile;

    // Check expected elements
    for (const keyword of mod.check) {
      const visible = await page.locator(`text=${keyword}`).first()
        .isVisible({ timeout: 5000 }).catch(() => false);
      if (visible) { loadedOk = true; break; }
    }

    // Check for error indicators
    const has404 = await page.locator('text=404, text=Not Found, text=Page not found').first()
      .isVisible({ timeout: 2000 }).catch(() => false);
    const has500 = await page.locator('text=500, text=Server Error, text=Internal Server').first()
      .isVisible({ timeout: 2000 }).catch(() => false);
    const hasSpinner = await page.locator('.v-progress-circular, .v-skeleton-loader').first()
      .isVisible({ timeout: 2000 }).catch(() => false);

    return {
      name: mod.name,
      url,
      loadedOk,
      pageTitle,
      screenshotPath,
      consoleErrors: [...consoleErrors],
      networkErrors: networkErrors.filter(e => !e.includes('favicon') && !e.includes('analytics')).slice(0, 5),
      has404,
      has500,
      hasSpinner,
    };
  } catch (err) {
    return {
      name: mod.name,
      url,
      loadedOk: false,
      pageTitle: '',
      screenshotPath,
      consoleErrors: [...consoleErrors],
      networkErrors: networkErrors.slice(0, 5),
      error: err.message,
    };
  }
}

// ─── Claude analysis ──────────────────────────────────────────────────────────

async function analyzeWithClaude(results) {
  if (!ANTHROPIC_API_KEY) {
    console.log('No ANTHROPIC_API_KEY — skipping Claude analysis');
    return results.map(r => ({
      ...r,
      isBug: !r.loadedOk || r.has404 || r.has500 || r.consoleErrors.length > 0,
      bugTitle: `[Admin] ${r.name} page not loading correctly`,
      bugSeverity: 'medium',
    }));
  }

  const summary = results.map(r => ({
    module: r.name,
    url: r.url,
    loaded: r.loadedOk,
    has404: r.has404,
    has500: r.has500,
    hasSpinner: r.hasSpinner,
    consoleErrors: r.consoleErrors.slice(0, 3),
    networkErrors: r.networkErrors.slice(0, 3),
    error: r.error || null,
  }));

  const prompt = `You are a QA engineer reviewing automated E2E exploration results for the Vivacity admin app.

Here are the results for each module visited:

${JSON.stringify(summary, null, 2)}

For each module that appears broken (page didn't load, has 404/500, or has a loading error):
- Determine if it's a REAL UI bug worth filing (not a backend/CORS/network issue)
- Only flag as isBug=true if: the page failed to load, returned 404/500, has a render error, or shows a blank/broken UI
- SKIP: CORS errors, network timeouts to external APIs, analytics tracking failures — these are backend issues
- Write a short bug title: "[Admin] {module} — {what's wrong}"
- Rate severity: critical / high / medium / low

Respond as JSON array:
[
  {
    "module": "name",
    "isBug": true/false,
    "bugTitle": "...",
    "bugSeverity": "high",
    "reason": "one line explanation"
  }
]

Only include modules where isBug is true. Skip modules that loaded fine.`;

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  const data = await res.json();
  const text = data.content?.[0]?.text || '[]';
  const jsonMatch = text.match(/\[[\s\S]*\]/);
  const bugs = jsonMatch ? JSON.parse(jsonMatch[0]) : [];

  return results.map(r => {
    const analysis = bugs.find(b => b.module === r.name);
    return { ...r, ...analysis, isBug: analysis?.isBug || false };
  });
}

// ─── Create ADO bug ───────────────────────────────────────────────────────────

async function createAdoBug({ title, reproSteps }) {
  const auth = Buffer.from(`:${ADO_PAT}`).toString('base64');
  const patchDoc = [
    { op: 'add', path: '/fields/System.Title',                  value: title },
    { op: 'add', path: '/fields/Microsoft.VSTS.TCM.ReproSteps', value: reproSteps },
    { op: 'add', path: '/fields/System.Tags',                   value: 'auto-generated; e2e-bot' },
    { op: 'add', path: '/fields/System.AreaPath',               value: 'Viva' },
  ];

  const res = await fetch(
    'https://dev.azure.com/vivacityapp/Viva/_apis/wit/workitems/$Bug?api-version=7.0',
    {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/json-patch+json',
      },
      body: JSON.stringify(patchDoc),
    }
  );

  if (!res.ok) throw new Error(`ADO bug creation failed: ${res.status} ${await res.text()}`);
  const d = await res.json();
  return { id: d.id, url: `https://dev.azure.com/vivacityapp/Viva/_workitems/edit/${d.id}` };
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
  console.log(`\n=== Vivacity E2E Explorer ${DRY_RUN ? '(DRY RUN)' : ''} ===\n`);

  if (!ADO_PAT) { console.error('ADO_PAT not set'); process.exit(1); }

  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });

  const modulesToRun = ONLY_MODULE
    ? MODULES.filter(m => m.name === ONLY_MODULE)
    : MODULES;

  if (modulesToRun.length === 0) {
    console.error(`Unknown module: ${ONLY_MODULE}. Available: ${MODULES.map(m => m.name).join(', ')}`);
    process.exit(1);
  }

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page    = await context.newPage();

  let orgSlug;
  try {
    orgSlug = await login(page);
  } catch (err) {
    console.error('Login failed:', err.message);
    await browser.close();
    process.exit(1);
  }

  // ── Explore each module ────────────────────────────────────────────────────
  console.log(`\nExploring ${modulesToRun.length} module(s)...\n`);
  const rawResults = [];

  for (const mod of modulesToRun) {
    const result = await exploreModule(page, mod, orgSlug);
    rawResults.push(result);

    const status = result.loadedOk ? '✅' : result.has404 ? '❌ 404' : result.has500 ? '❌ 500' : result.error ? '❌ ERROR' : '⚠️ ?';
    console.log(`  ${status} ${result.name}`);
    if (result.consoleErrors.length) console.log(`    Console errors: ${result.consoleErrors[0]}`);
    if (result.error) console.log(`    Error: ${result.error}`);
  }

  await browser.close();

  // ── Analyze with Claude ────────────────────────────────────────────────────
  console.log('\nAnalyzing results with Claude...');
  const analyzed = await analyzeWithClaude(rawResults);
  const bugs = analyzed.filter(r => r.isBug);

  console.log(`\nFound ${bugs.length} issue(s).\n`);

  // ── Create ADO bugs ────────────────────────────────────────────────────────
  const createdBugs = [];

  for (const bug of bugs) {
    console.log(`  Bug: ${bug.bugTitle}`);
    if (DRY_RUN) {
      console.log('  (dry run — skipping ADO creation)');
      continue;
    }

    const reproSteps = `<ol>
<li>Navigate to <a href="${bug.url}">${bug.url}</a></li>
<li>Observe: ${bug.reason || 'page did not load correctly'}</li>
</ol>
${bug.consoleErrors?.length ? `<p><strong>Console errors:</strong><br>${bug.consoleErrors.join('<br>')}</p>` : ''}
${bug.networkErrors?.length ? `<p><strong>Network errors:</strong><br>${bug.networkErrors.join('<br>')}</p>` : ''}
<p><em>Auto-detected by E2E Explorer (explore-staging.mjs)</em></p>`;

    try {
      const created = await createAdoBug({ title: bug.bugTitle, reproSteps });
      console.log(`  → Created ADO #${created.id}: ${created.url}`);
      createdBugs.push({ ...bug, adoId: created.id, adoUrl: created.url });
    } catch (err) {
      console.error(`  → Failed to create ADO bug: ${err.message}`);
    }
  }

  // ── Save results ──────────────────────────────────────────────────────────
  const report = {
    date: new Date().toISOString(),
    orgSlug,
    modulesChecked: rawResults.length,
    passed: rawResults.filter(r => r.loadedOk).length,
    failed: bugs.length,
    bugsCreated: createdBugs,
    details: analyzed,
  };
  fs.writeFileSync(RESULTS_FILE, JSON.stringify(report, null, 2));
  console.log(`\nResults saved to scripts/explore-results.json`);

  // ── Console summary ───────────────────────────────────────────────────────
  console.log('\n══════════════════════════════════════');
  console.log(`✅ Passed: ${report.passed}/${report.modulesChecked}`);
  if (bugs.length) {
    console.log(`❌ Issues found:`);
    bugs.forEach(b => console.log(`   • ${b.name}: ${b.bugTitle}`));
  }
  if (createdBugs.length) {
    console.log(`\n🐛 ADO bugs created:`);
    createdBugs.forEach(b => console.log(`   #${b.adoId} — ${b.adoUrl}`));
  }
  console.log('══════════════════════════════════════\n');

  // ── Slack ─────────────────────────────────────────────────────────────────
  if (createdBugs.length > 0) {
    const bugList = createdBugs.map(b =>
      `• *Bug #${b.adoId}* ${b.bugTitle}\n  ${b.adoUrl}`
    ).join('\n');

    await sendSlack(
      `*QA Bot — E2E Explorer Report*\n\n` +
      `Checked ${report.modulesChecked} modules: ${report.passed} passed, ${bugs.length} issues found\n\n` +
      `*Bugs auto-created:*\n${bugList}`
    );
    console.log('Slack notification sent.');
  }
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
