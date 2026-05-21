import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { loginToApp } from './helpers/auth.helper';

// WCAG 2.1 AA Automated Accessibility Tests
// Uses axe-core to check for common accessibility violations
// Covers: WCAG 2.1 Level A and Level AA criteria

const EMAIL = 'pau.kie.chee@fusioneta.com';
const PASSWORD = 'PAOpaopao@9696';
const BASE = 'https://app-staging.vivacityapp.com';

// Pages to test (URL path → display name)
const PAGES = [
  { path: '/demo-student/dashboard',                    name: 'Dashboard' },
  { path: '/demo-student/properties',                   name: 'Properties' },
  { path: '/demo-student/contacts',                     name: 'Contacts' },
  { path: '/demo-student/enquiries',                    name: 'Enquiries' },
  { path: '/demo-student/promotions',                   name: 'Promotions' },
  { path: '/demo-student/universities',                 name: 'Universities' },
  { path: '/demo-student/cities',                       name: 'Cities' },
  { path: '/demo-student/facilities',                   name: 'Facilities' },
  { path: '/demo-student/attributes',                   name: 'Attributes' },
  { path: '/demo-student/tags',                         name: 'Tags' },
  { path: '/demo-student/articles',                     name: 'Articles' },
  { path: '/demo-student/surveys',                      name: 'Surveys' },
  { path: '/demo-student/faq',                          name: 'FAQ' },
  { path: '/demo-student/analytics',                    name: 'Analytics' },
  { path: '/demo-student/reports',                      name: 'Reports' },
  { path: '/demo-student/tracking',                     name: 'Tracking' },
  { path: '/system-settings/organizations',             name: 'System Settings - Organizations' },
  { path: '/system-settings/ai-agents',                 name: 'System Settings - AI Agents' },
  { path: '/system-settings/neighbourhoods',            name: 'System Settings - Neighbourhoods' },
  { path: '/system-settings/facilities',                name: 'System Settings - Facilities' },
];

// WCAG violations to ignore (known framework-level issues from Vuetify)
const IGNORE_RULES = [
  'color-contrast',       // Vuetify theme colors — handled by design team
];

async function navigateTo(page: any, path: string) {
  await page.goto(`${BASE}${path}`, { waitUntil: 'load', timeout: 30000 });
  await page.waitForTimeout(2000);
}

function formatViolations(violations: any[]) {
  return violations.map(v =>
    `[${v.impact?.toUpperCase()}] ${v.id}: ${v.description}\n` +
    `  Help: ${v.helpUrl}\n` +
    `  Affected elements: ${v.nodes.length}\n` +
    v.nodes.slice(0, 2).map((n: any) => `    • ${n.html?.slice(0, 120)}`).join('\n')
  ).join('\n\n');
}

// ─────────────────────────────────────────────────────────────
// Login page accessibility
// ─────────────────────────────────────────────────────────────

test('WCAG - Login page has no critical accessibility violations', async ({ page }) => {
  test.setTimeout(60000);
  await page.goto(BASE, { waitUntil: 'load', timeout: 30000 });
  await page.waitForTimeout(2000);

  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .disableRules(IGNORE_RULES)
    .analyze();

  const critical = results.violations.filter(v => v.impact === 'critical' || v.impact === 'serious');

  console.log(`\n📋 Login Page WCAG Results:`);
  console.log(`  ✅ Passes: ${results.passes.length}`);
  console.log(`  ❌ Violations: ${results.violations.length} (${critical.length} critical/serious)`);
  if (results.violations.length > 0) {
    console.log('\n' + formatViolations(results.violations));
  }

  expect(critical.length, `Critical/serious WCAG violations on Login:\n${formatViolations(critical)}`).toBe(0);
});

// ─────────────────────────────────────────────────────────────
// Main app pages — loop through all pages
// ─────────────────────────────────────────────────────────────

for (const { path, name } of PAGES) {
  test(`WCAG - ${name} has no critical accessibility violations`, async ({ page }) => {
    test.setTimeout(120000);
    await loginToApp(page, 90000, EMAIL, PASSWORD);
    await navigateTo(page, path);

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .disableRules(IGNORE_RULES)
      .analyze();

    const critical = results.violations.filter(v => v.impact === 'critical' || v.impact === 'serious');
    const moderate = results.violations.filter(v => v.impact === 'moderate' || v.impact === 'minor');

    console.log(`\n📋 ${name} WCAG Results:`);
    console.log(`  ✅ Passes: ${results.passes.length}`);
    console.log(`  ❌ Violations: ${results.violations.length}`);
    console.log(`     🔴 Critical/Serious: ${critical.length}`);
    console.log(`     🟡 Moderate/Minor:   ${moderate.length}`);

    if (critical.length > 0) {
      console.log('\n🔴 Critical violations:\n' + formatViolations(critical));
    }
    if (moderate.length > 0) {
      console.log('\n🟡 Moderate violations:\n' + formatViolations(moderate));
    }

    expect(critical.length, `Critical/serious WCAG violations on ${name}:\n${formatViolations(critical)}`).toBe(0);
  });
}

// ─────────────────────────────────────────────────────────────
// Specific WCAG checks
// ─────────────────────────────────────────────────────────────

test('WCAG - Dashboard images have alt text', async ({ page }) => {
  test.setTimeout(120000);
  await loginToApp(page, 90000, EMAIL, PASSWORD);
  await navigateTo(page, '/demo-student/dashboard');

  const results = await new AxeBuilder({ page })
    .withRules(['image-alt'])
    .analyze();

  console.log(`\n🖼️ Image alt text violations: ${results.violations.length}`);
  results.violations.forEach(v => console.log(`  - ${v.nodes.length} images missing alt`));

  expect(results.violations.length).toBe(0);
});

test('WCAG - Dashboard buttons have accessible names', async ({ page }) => {
  test.setTimeout(120000);
  await loginToApp(page, 90000, EMAIL, PASSWORD);
  await navigateTo(page, '/demo-student/dashboard');

  const results = await new AxeBuilder({ page })
    .withRules(['button-name', 'aria-allowed-attr', 'aria-required-attr'])
    .analyze();

  console.log(`\n🔘 Button/ARIA violations: ${results.violations.length}`);
  results.violations.forEach(v => {
    console.log(`  - ${v.id}: ${v.nodes.length} element(s)`);
  });

  expect(results.violations.length).toBe(0);
});

test('WCAG - Forms have proper labels', async ({ page }) => {
  test.setTimeout(120000);
  await loginToApp(page, 90000, EMAIL, PASSWORD);
  await navigateTo(page, '/demo-student/properties');

  const results = await new AxeBuilder({ page })
    .withRules(['label', 'label-content-name-mismatch', 'form-field-multiple-labels'])
    .analyze();

  console.log(`\n📝 Form label violations: ${results.violations.length}`);
  results.violations.forEach(v => {
    console.log(`  - ${v.id}: ${v.nodes.length} element(s)`);
  });

  expect(results.violations.length).toBe(0);
});

test('WCAG - Keyboard navigation works on Dashboard', async ({ page }) => {
  test.setTimeout(120000);
  await loginToApp(page, 90000, EMAIL, PASSWORD);
  await navigateTo(page, '/demo-student/dashboard');

  const results = await new AxeBuilder({ page })
    .withRules(['keyboard', 'focus-order-semantics', 'tabindex', 'scrollable-region-focusable'])
    .analyze();

  console.log(`\n⌨️ Keyboard navigation violations: ${results.violations.length}`);
  results.violations.forEach(v => {
    console.log(`  - ${v.id}: ${v.description}`);
  });

  expect(results.violations.length).toBe(0);
});
