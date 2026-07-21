// Bug #17751: [Admin] Booking status not available as column option in Enquiries table
// ADO: https://dev.azure.com/vivacityapp/Viva/_workitems/edit/17751
// Auto-generated 2026-07-15
// REVIEW BEFORE MERGING — verify selectors and assertions

import { test, expect } from '@playwright/test';
import { loginToApp } from '../helpers/auth.helper';

test.setTimeout(120000);

test('BUG #17751 - Booking Status should be available as a column option in Enquiries table', async ({ page }) => {
  await loginToApp(page);

  // Navigate to Enquiries section
  await page.goto('https://app-staging.vivacityapp.com');

  // Wait for app to load
  await page.waitForSelector('.v-application', { timeout: 30000 });

  // Navigate to Enquiries - try sidebar navigation
  const enquiriesLink = page.locator('a, .v-list-item, .nav-item').filter({ hasText: /enquir/i }).first();
  await enquiriesLink.waitFor({ timeout: 20000 });
  await enquiriesLink.click();

  // Wait for Enquiries table to load
  await page.waitForSelector('.v-data-table, table, [class*="enquir"]', { timeout: 20000 });

  // Look for Edit Columns button
  const editColumnsButton = page.locator('button, .v-btn').filter({ hasText: /edit\s*col/i }).first();
  await editColumnsButton.waitFor({ timeout: 15000 });
  await editColumnsButton.click();

  // Wait for the edit column panel/dialog to open
  const columnPanel = page.locator('.v-navigation-drawer, .v-dialog, [class*="column-panel"], [class*="edit-col"]').first();
  await columnPanel.waitFor({ timeout: 10000 });

  // Check that "Booking Status" is present in the column options list
  const bookingStatusOption = page.locator('.v-navigation-drawer, .v-dialog, [class*="column-panel"], [class*="edit-col"]')
    .locator('text=/booking\s*status/i').first();

  // This assertion FAILS when bug is present (option missing), PASSES when fixed
  await expect(bookingStatusOption).toBeVisible({ timeout: 10000 });

  // Close the panel if it's open (restore state)
  const closeButton = columnPanel.locator('button').filter({ hasText: /close|cancel|×/i }).first();
  const closeButtonVisible = await closeButton.isVisible().catch(() => false);
  if (closeButtonVisible) {
    await closeButton.click();
  } else {
    // Try pressing Escape to close
    await page.keyboard.press('Escape');
  }
});