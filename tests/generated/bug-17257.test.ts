// Bug #17257: [App Editor] Global Settings > Tab Bar - "Top bar color" renamed to "Bar Color"
// ADO: https://dev.azure.com/vivacityapp/Viva/_workitems/edit/17257
// Auto-generated 2026-06-12
// REVIEW BEFORE MERGING — verify selectors and assertions

import { test, expect } from '@playwright/test';
import { loginToApp } from '../helpers/auth.helper';

test.setTimeout(120000);

test('BUG #17257 - Tab Bar "Top bar color" label should not be renamed to "Bar Color"', async ({ page }) => {
  await loginToApp(page, 90000, 'pau.kie.chee@fusioneta.com', 'PAOpaopao@9696');

  // Navigate to App Editor
  await page.goto('https://app-staging.vivacityapp.com/demo-student/app-editor', { waitUntil: 'load', timeout: 30000 });
  await page.waitForSelector('.v-application', { timeout: 15000 });
  await page.waitForTimeout(2000);

  // Wait for App Editor to load
  await page.waitForURL(/app-editor|appeditor/i, { timeout: 30000 });

  // Click on Global Settings
  const globalSettingsLink = page.locator('a, [role="link"], .nav-item, button').filter({ hasText: /global settings/i }).first();
  await globalSettingsLink.waitFor({ state: 'visible', timeout: 30000 });
  await globalSettingsLink.click();

  // Click on Tab Bar under CONFIGURATION
  const tabBarLink = page.locator('a, [role="link"], .nav-item, button, .v-list-item').filter({ hasText: /^tab bar$/i }).first();
  await tabBarLink.waitFor({ state: 'visible', timeout: 30000 });
  await tabBarLink.click();

  // Wait for TAB BAR STYLE section to load
  const tabBarStyleSection = page.locator('text=/tab bar style/i').first();
  await tabBarStyleSection.waitFor({ state: 'visible', timeout: 30000 });

  // Verify the label is "Top bar color" and NOT "Bar Color"
  // The bug: field is labelled "Bar Color" instead of "Top bar color"
  const topBarColorLabel = page.locator('label, .v-label, .field-label, span, div').filter({ hasText: /^top bar color$/i }).first();
  
  // Check that the incorrect label "Bar Color" is NOT present
  const barColorLabel = page.locator('label, .v-label, .field-label, span, div').filter({ hasText: /^bar color$/i });
  
  // Wait for page content to stabilize
  await page.waitForLoadState('networkidle', { timeout: 30000 });

  // The field should be labelled "Top bar color" - this should be visible when bug is fixed
  await expect(topBarColorLabel).toBeVisible({ timeout: 15000 });

  // The incorrect label "Bar Color" should NOT be present
  await expect(barColorLabel).not.toBeVisible({ timeout: 5000 });
});