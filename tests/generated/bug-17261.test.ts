// Bug #17261: [App Editor] Global Settings > Settings - "Google Analytics debug" renamed to "GA Debug"
// ADO: https://dev.azure.com/vivacityapp/Viva/_workitems/edit/17261
// Auto-generated 2026-06-12
// REVIEW BEFORE MERGING — verify selectors and assertions

import { test, expect } from '@playwright/test';
import { loginToApp } from '../helpers/auth.helper';

test.setTimeout(120000);

test('Bug #17261 - Google Analytics debug toggle should be labelled "Google Analytics debug" not "GA Debug"', async ({ page }) => {
  await loginToApp(page, 90000, 'pau.kie.chee@fusioneta.com', 'PAOpaopao@9696');

  // Navigate to App Editor > Global Settings
  await page.goto('https://app-staging.vivacityapp.com/demo-student/app-editor', { waitUntil: 'load', timeout: 30000 });
  await page.waitForSelector('.v-application', { timeout: 15000 });
  await page.waitForTimeout(2000);

  // Wait for App Editor to load
  await page.waitForLoadState('networkidle');

  // Navigate to Global Settings
  const globalSettingsLink = page.locator('a, [role="menuitem"], .nav-item, .v-list-item').filter({ hasText: /global settings/i }).first();
  await globalSettingsLink.waitFor({ state: 'visible', timeout: 30000 });
  await globalSettingsLink.click();

  await page.waitForLoadState('networkidle');

  // Click on Settings under CONFIGURATION
  const settingsLink = page.locator('a, [role="menuitem"], .v-list-item').filter({ hasText: /^settings$/i }).first();
  await settingsLink.waitFor({ state: 'visible', timeout: 30000 });
  await settingsLink.click();

  await page.waitForLoadState('networkidle');

  // Look for the DEVELOPER section
  const developerSection = page.locator('text=/developer/i').first();
  await developerSection.waitFor({ state: 'visible', timeout: 30000 });

  // Verify the toggle is NOT labelled "GA Debug" (bug state)
  const gaDebugWrongLabel = page.locator('text="GA Debug"');
  const wrongLabelVisible = await gaDebugWrongLabel.isVisible();
  expect(wrongLabelVisible, 'Toggle should NOT be labelled "GA Debug" - this is the bug').toBe(false);

  // Verify the toggle IS labelled "Google Analytics debug" (fixed state)
  const googleAnalyticsDebugLabel = page.locator('text="Google Analytics debug"');
  await expect(googleAnalyticsDebugLabel).toBeVisible({ timeout: 10000 });
});