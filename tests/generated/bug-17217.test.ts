// Bug #17217: [App Editor] EXT Json - Extra "Preview" button not in design
// ADO: https://dev.azure.com/vivacityapp/Viva/_workitems/edit/17217
// Auto-generated 2026-06-11
// REVIEW BEFORE MERGING — verify selectors and assertions

import { test, expect } from '@playwright/test';
import { loginToApp } from '../helpers/auth.helper';

test.setTimeout(120000);

test('BUG #17217 - EXT Json should only show Sync button, not Preview button', async ({ page }) => {
  await loginToApp(page, 90000, 'pau.kie.chee@fusioneta.com', 'PAOpaopao@9696');

  // Navigate to App Editor
  await page.waitForSelector('.v-application', { timeout: 30000 });

  // Navigate to App Editor section
  await page.goto('https://app-staging.vivacityapp.com/demo-student/app-editor', { waitUntil: 'load', timeout: 30000 });
  await page.waitForSelector('.v-application', { timeout: 15000 });
  await page.waitForTimeout(2000);

  await page.waitForURL(/.*app-editor.*/i, { timeout: 20000 }).catch(async () => {
    // Try direct navigation if click didn't work
    await page.goto('https://app-staging.vivacityapp.com/app-editor');
    await page.waitForSelector('.v-application', { timeout: 20000 });
  });

  // Open any Mini Program - look for a program card or list item
  const miniProgramItem = page.locator('.v-card, .v-list-item, [class*="program"]').first();
  await miniProgramItem.waitFor({ timeout: 20000 });
  await miniProgramItem.click();

  // Wait for program to load
  await page.waitForSelector('.v-application', { timeout: 15000 });

  // Navigate to EXT Json tab/section
  const extJsonTab = page.locator('.v-tab, .v-list-item, a, button').filter({ hasText: /ext\s*json/i }).first();
  await extJsonTab.waitFor({ timeout: 20000 });
  await extJsonTab.click();

  // Wait for EXT Json content to load
  await page.waitForTimeout(2000);

  // Check for Sync button - it should be present
  const syncButton = page.locator('.v-btn, button').filter({ hasText: /^sync$/i });
  await expect(syncButton.first()).toBeVisible({ timeout: 10000 });

  // Check for Preview button - it should NOT be present (this is the bug)
  const previewButton = page.locator('.v-btn, button').filter({ hasText: /^preview$/i });
  const previewCount = await previewButton.count();

  // The test FAILS when bug is present (preview button exists), PASSES when fixed (no preview button)
  expect(previewCount, 'Preview button should not be visible in EXT Json section - this is a bug (#17217)').toBe(0);
});