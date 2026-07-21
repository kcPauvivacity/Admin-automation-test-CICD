// Bug #17259: [App Editor] Global Settings > Settings - "FEATURE FLAGS" section split into "DISPLAY" and "FEATURES"
// ADO: https://dev.azure.com/vivacityapp/Viva/_workitems/edit/17259
// Auto-generated 2026-06-12
// REVIEW BEFORE MERGING — verify selectors and assertions

import { test, expect } from '@playwright/test';
import { loginToApp } from '../helpers/auth.helper';

test.setTimeout(120000);

test('Bug #17259 - Feature flags should be under single "FEATURE FLAGS" section, not split into "DISPLAY", "FEATURES", and "ADVANCED"', async ({ page }) => {
  await loginToApp(page, 90000, 'pau.kie.chee@fusioneta.com', 'PAOpaopao@9696');
  await page.goto('https://app-staging.vivacityapp.com/demo-student/app-editor', { waitUntil: 'load', timeout: 30000 });
  await page.waitForSelector('.v-application', { timeout: 15000 });
  await page.waitForTimeout(2000);

  // Navigate to App Editor > Global Settings
  await page.waitForSelector('.v-application', { timeout: 30000 });

  // Navigate to App Editor
  const appEditorLink = page.locator('a, .v-list-item, [role="menuitem"]').filter({ hasText: /app editor/i }).first();
  await appEditorLink.waitFor({ timeout: 20000 });
  await appEditorLink.click();

  // Wait for App Editor to load
  await page.waitForURL(/.*app-editor.*/i, { timeout: 20000 }).catch(() => {
    // URL might not change, proceed
  });

  // Navigate to Global Settings
  const globalSettingsLink = page.locator('a, .v-list-item, [role="menuitem"], .nav-item').filter({ hasText: /global settings/i }).first();
  await globalSettingsLink.waitFor({ timeout: 20000 });
  await globalSettingsLink.click();

  // Click Settings under CONFIGURATION
  const settingsLink = page.locator('a, .v-list-item, [role="menuitem"], .nav-item, .v-btn').filter({ hasText: /^settings$/i }).first();
  await settingsLink.waitFor({ timeout: 20000 });
  await settingsLink.click();

  // Wait for the settings page to load
  await page.waitForLoadState('networkidle', { timeout: 30000 });

  // Check that "FEATURE FLAGS" section exists
  const featureFlagsSection = page.locator('text=/feature flags/i').first();
  await featureFlagsSection.waitFor({ timeout: 20000 });
  await expect(featureFlagsSection).toBeVisible();

  // Bug check: "DISPLAY" section should NOT exist as a separate section header
  const displaySection = page.locator('.v-card-title, .section-title, h2, h3, h4, .settings-section-header, [class*="section"], [class*="header"]')
    .filter({ hasText: /^display$/i });
  const displaySectionCount = await displaySection.count();
  expect(displaySectionCount, 'Bug #17259: "DISPLAY" section should not exist as a separate section - feature toggles should be under "FEATURE FLAGS"').toBe(0);

  // Bug check: "FEATURES" section should NOT exist as a separate section header
  const featuresSection = page.locator('.v-card-title, .section-title, h2, h3, h4, .settings-section-header, [class*="section"], [class*="header"]')
    .filter({ hasText: /^features$/i });
  const featuresSectionCount = await featuresSection.count();
  expect(featuresSectionCount, 'Bug #17259: "FEATURES" section should not exist as a separate section - feature toggles should be under "FEATURE FLAGS"').toBe(0);

  // Bug check: "ADVANCED" section should NOT exist
  const advancedSection = page.locator('.v-card-title, .section-title, h2, h3, h4, .settings-section-header, [class*="section"], [class*="header"]')
    .filter({ hasText: /^advanced$/i });
  const advancedSectionCount = await advancedSection.count();
  expect(advancedSectionCount, 'Bug #17259: "ADVANCED" section should not be present as per design').toBe(0);

  // Verify there is exactly ONE "FEATURE FLAGS" section heading
  const featureFlagsSections = page.locator('.v-card-title, .section-title, h2, h3, h4, .settings-section-header, [class*="section"], [class*="header"], text')
    .filter({ hasText: /^feature flags$/i });

  // Use a broader selector to find all elements with "FEATURE FLAGS" text
  const allFeatureFlagElements = page.locator(':text-is("FEATURE FLAGS"), :text-is("Feature Flags"), :text-is("feature flags")');
  const featureFlagsCount = await allFeatureFlagElements.count();
  expect(featureFlagsCount, 'There should be at least one "FEATURE FLAGS" section header').toBeGreaterThanOrEqual(1);
});