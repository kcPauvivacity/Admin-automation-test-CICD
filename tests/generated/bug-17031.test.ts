// Bug #17031: [Admin] Promotion 'Save & Publish' button not working — requires manual publish workaround via listing
// ADO: https://dev.azure.com/vivacityapp/Viva/_workitems/edit/17031
// Auto-generated 2026-06-02
// REVIEW BEFORE MERGING — verify selectors and assertions

import { test, expect } from '@playwright/test';
import { loginToApp } from '../helpers/auth.helper';

test.setTimeout(300000);

test('BUG #17031 - Promotion Save & Publish button publishes promotion without manual workaround', async ({ page }) => {
  await loginToApp(page);

  // Navigate to Promotions page
  await page.goto('https://app-staging.vivacityapp.com');
  await page.waitForSelector('.v-application', { timeout: 30000 });

  // Look for Promotions in navigation
  const promotionsNavLink = page.locator('a, .v-list-item, .v-btn').filter({ hasText: /promotion/i }).first();
  await promotionsNavLink.waitFor({ state: 'visible', timeout: 20000 });
  await promotionsNavLink.click();

  await page.waitForURL(/.*promotion.*/i, { timeout: 20000 }).catch(async () => {
    // Try direct navigation if nav click didn't work
    await page.goto('https://app-staging.vivacityapp.com/promotions');
  });

  await page.waitForSelector('.v-application', { timeout: 15000 });

  // Click Create / Add new promotion button
  const createBtn = page.locator('.v-btn').filter({ hasText: /create|add|new promotion/i }).first();
  await createBtn.waitFor({ state: 'visible', timeout: 20000 });
  await createBtn.click();

  // Wait for promotion form to appear
  await page.waitForSelector('form, .v-form, [data-testid="promotion-form"]', { timeout: 20000 });

  // Fill in promotion name/title
  const promoName = `Test Promotion BUG17031 ${Date.now()}`;
  const titleInput = page
    .locator('input[type="text"], .v-text-field input, textarea')
    .filter({ hasText: '' })
    .first();

  // Try to find a name/title field specifically
  const nameField = page
    .locator('.v-text-field')
    .filter({ has: page.locator('label').filter({ hasText: /name|title/i }) })
    .first();

  const nameInput = nameField.locator('input').first();
  await nameInput.waitFor({ state: 'visible', timeout: 15000 }).catch(async () => {
    // Fallback to first text input
    await titleInput.waitFor({ state: 'visible', timeout: 15000 });
  });

  const inputToFill = (await nameInput.isVisible()) ? nameInput : titleInput;
  await inputToFill.fill(promoName);

  // Fill other required fields if present
  // Try to fill description if visible
  const descField = page
    .locator('.v-text-field, .v-textarea')
    .filter({ has: page.locator('label').filter({ hasText: /description|desc/i }) })
    .first();

  if (await descField.isVisible().catch(() => false)) {
    await descField.locator('input, textarea').first().fill('Test promotion description for bug regression');
  }

  // Fill discount/value fields if present
  const discountField = page
    .locator('.v-text-field')
    .filter({ has: page.locator('label').filter({ hasText: /discount|value|amount|percentage/i }) })
    .first();

  if (await discountField.isVisible().catch(() => false)) {
    await discountField.locator('input').first().fill('10');
  }

  // Look for date fields and fill if required
  const startDateField = page
    .locator('.v-text-field')
    .filter({ has: page.locator('label').filter({ hasText: /start date|from/i }) })
    .first();

  if (await startDateField.isVisible().catch(() => false)) {
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0];
    await startDateField.locator('input').first().fill(dateStr);
  }

  const endDateField = page
    .locator('.v-text-field')
    .filter({ has: page.locator('label').filter({ hasText: /end date|to|expiry/i }) })
    .first();

  if (await endDateField.isVisible().catch(() => false)) {
    const futureDate = new Date();
    futureDate.setMonth(futureDate.getMonth() + 1);
    const dateStr = futureDate.toISOString().split('T')[0];
    await endDateField.locator('input').first().fill(dateStr);
  }

  // Take screenshot before clicking Save & Publish
  await page.screenshot({ path: 'before-save-publish.png' });

  // Find and click "Save & Publish" button
  const savePublishBtn = page
    .locator('.v-btn')
    .filter({ hasText: /save\s*&\s*publish|save and publish/i })
    .first();

  await savePublishBtn.waitFor({ state: 'visible', timeout: 20000 });
  expect(await savePublishBtn.isVisible()).toBeTruthy();
  expect(await savePublishBtn.isDisabled()).toBeFalsy();

  await savePublishBtn.click();

  // Wait for the action to complete — expect a success notification or redirect
  // The bug is that Save & Publish does NOT actually publish
  // A fix should result in a success toast/snackbar indicating published state

  const successIndicator = page.locator(
    '.v-snackbar, .v-alert, [class*="toast"], [class*="notification"], [class*="success"]'
  ).filter({ hasText: /publish|success|saved/i }).first();

  // Wait for success notification (this should appear if the button works)
  await successIndicator.waitFor({ state: 'visible', timeout: 30000 }).catch(() => {
    // If no toast, maybe the page redirects back to listing
  });

  // Navigate back to promotions listing to verify the promotion is published
  const promotionsListLink = page.locator('a, .v-btn, .v-breadcrumbs-item').filter({ hasText: /promotion/i }).first();
  if (await promotionsListLink.isVisible().catch(() => false)) {
    await promotionsListLink.click();
  } else {
    await page.goto('https://app-staging.vivacityapp.com/promotions');
  }

  await page.waitForSelector('.v-application', { timeout: 15000 });

  // Wait for listings to load
  await page.waitForSelector('.v-data-table, .v-list, [class*="table"], [class*="list"]', { timeout: 20000 }).catch(() => {});

  // Take screenshot of listing page
  await page.screenshot({ path: 'promotions-listing-after-publish.png' });

  // Find the created promotion in the listing
  const promotionRow = page.locator('tr, .v-list-item, [class*="row"]').filter({ hasText: promoName }).first();
  await promotionRow.waitFor({ state: 'visible', timeout: 20000 });

  // Check that the promotion shows "Published" status
  // BUG: If the bug is present, the status will NOT be "Published"
  const publishedStatus = promotionRow.locator('text=/published/i, .v-chip, [class*="status"]').filter({ hasText: /published/i }).first();

  await publishedStatus.waitFor({ state: 'visible', timeout: 15000 });
  expect(await publishedStatus.isVisible()).toBeTruthy();

  // --- Cleanup: Delete the test promotion ---
  // Click on the promotion row to open it
  await promotionRow.click();
  await page.waitForSelector('form, .v-form, [class*="detail"]', { timeout: 15000 });

  // Look for delete button
  const deleteBtn = page
    .locator('.v-btn')
    .filter({ hasText: /delete|remove/i })
    .first();

  if (await deleteBtn.isVisible().catch(() => false)) {
    await deleteBtn.click();

    // Confirm deletion dialog if present
    const confirmBtn = page
      .locator('.v-dialog .v-btn, .v-overlay .v-btn')
      .filter({ hasText: /confirm|yes|delete|ok/i })
      .first();

    if (await confirmBtn.isVisible().catch(() => false)) {
      await confirmBtn.click();
    }

    // Wait for deletion to complete
    await page.waitForSelector('.v-application', { timeout: 15000 });
  }
});