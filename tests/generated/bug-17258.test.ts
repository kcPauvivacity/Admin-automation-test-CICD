// Bug #17258: [App Editor] Global Settings > Tab Bar - Tab type selector changed from toggle buttons to dropdown
// ADO: https://dev.azure.com/vivacityapp/Viva/_workitems/edit/17258
// Auto-generated 2026-06-12
// REVIEW BEFORE MERGING — verify selectors and assertions

import { test, expect } from '@playwright/test';
import { loginToApp } from '../helpers/auth.helper';

test.setTimeout(120000);

test('Bug #17258 - Tab Bar tab type selector should be toggle buttons, not a dropdown', async ({ page }) => {
  await loginToApp(page, 90000, 'pau.kie.chee@fusioneta.com', 'PAOpaopao@9696');
  await page.goto('https://app-staging.vivacityapp.com/demo-student/app-editor', { waitUntil: 'load', timeout: 30000 });
  await page.waitForSelector('.v-application', { timeout: 15000 });
  await page.waitForTimeout(2000);

  // Navigate to App Editor
  await page.waitForSelector('.v-application', { timeout: 30000 });

  // Navigate to App Editor > Global Settings
  // Look for App Editor navigation item
  const appEditorLink = page.locator('a, [role="menuitem"], .v-list-item').filter({ hasText: /app editor/i }).first();
  await appEditorLink.waitFor({ timeout: 15000 });
  await appEditorLink.click();

  // Wait for App Editor to load
  await page.waitForLoadState('networkidle', { timeout: 20000 });

  // Look for Global Settings
  const globalSettingsLink = page.locator('a, [role="menuitem"], .v-list-item, button').filter({ hasText: /global settings/i }).first();
  await globalSettingsLink.waitFor({ timeout: 15000 });
  await globalSettingsLink.click();

  await page.waitForLoadState('networkidle', { timeout: 20000 });

  // Look for Tab Bar under CONFIGURATION section
  const tabBarLink = page.locator('a, [role="menuitem"], .v-list-item, button').filter({ hasText: /tab bar/i }).first();
  await tabBarLink.waitFor({ timeout: 15000 });
  await tabBarLink.click();

  await page.waitForLoadState('networkidle', { timeout: 20000 });

  // Wait for tab items to be visible
  // Tab items should contain toggle buttons for "Tab" and "Nav", not a dropdown
  await page.waitForSelector('[class*="tab"], [class*="Tab"]', { timeout: 15000 });

  // Check that there is NO dropdown (v-select) for tab type
  // Bug condition: dropdown selector exists for tab type
  const tabTypeDropdown = page.locator('.v-select, v-select, [role="combobox"]').filter({ hasText: /tab type/i });
  const tabTypeDropdownCount = await tabTypeDropdown.count();

  // Also check by looking for select elements near "tab type" label
  const tabTypeSelectNearLabel = page.locator('text=Tab type').locator('..').locator('.v-select, [role="combobox"]');
  const tabTypeSelectNearLabelCount = await tabTypeSelectNearLabel.count();

  // Check that toggle buttons exist for Tab and Nav
  // Expected: inline toggle buttons labeled "Tab" and "Nav"
  const tabToggleButtons = page.locator('.v-btn-toggle, [role="group"]').filter({
    has: page.locator('button, .v-btn').filter({ hasText: /^Tab$/i })
  });

  const navToggleButtons = page.locator('.v-btn-toggle, [role="group"]').filter({
    has: page.locator('button, .v-btn').filter({ hasText: /^Nav$/i })
  });

  const tabToggleCount = await tabToggleButtons.count();
  const navToggleCount = await navToggleButtons.count();

  // The test FAILS (bug present) if:
  // - A dropdown/combobox for "tab type" exists
  // - OR toggle buttons for "Tab"/"Nav" do not exist

  // If bug is present: dropdowns exist and toggle buttons don't
  // If bug is fixed: toggle buttons exist and dropdowns don't (for tab type)

  // Assert no dropdown for tab type is present
  expect(tabTypeDropdownCount + tabTypeSelectNearLabelCount).toBe(0);

  // Assert toggle button groups with "Tab" and "Nav" options exist
  expect(tabToggleCount).toBeGreaterThan(0);
  expect(navToggleCount).toBeGreaterThan(0);

  // Additional check: verify toggle buttons are visible
  const firstTabToggle = page.locator('.v-btn-toggle button, [role="group"] button').filter({ hasText: /^Tab$/i }).first();
  await expect(firstTabToggle).toBeVisible();

  const firstNavToggle = page.locator('.v-btn-toggle button, [role="group"] button').filter({ hasText: /^Nav$/i }).first();
  await expect(firstNavToggle).toBeVisible();
});