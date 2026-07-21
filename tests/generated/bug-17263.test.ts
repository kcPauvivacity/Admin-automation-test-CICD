// Bug #17263: [App Editor] Global Settings > Window - Empty Title Text can be saved without validation error
// ADO: https://dev.azure.com/vivacityapp/Viva/_workitems/edit/17263
// Auto-generated 2026-06-12
// REVIEW BEFORE MERGING — verify selectors and assertions

import { test, expect } from '@playwright/test';
import { loginToApp } from '../helpers/auth.helper';

test.setTimeout(120000);

test('Bug #17263: Empty Title Text in Global Settings > Window should show validation error and not save', async ({ page }) => {
  await loginToApp(page, 90000, 'pau.kie.chee@fusioneta.com', 'PAOpaopao@9696');

  // Navigate to App Editor
  await page.waitForSelector('.v-application', { timeout: 30000 });

  // Navigate to App Editor
  await page.goto('https://app-staging.vivacityapp.com/demo-student/app-editor', { waitUntil: 'load', timeout: 30000 });
  await page.waitForSelector('.v-application', { timeout: 15000 });
  await page.waitForTimeout(2000);

  await page.waitForLoadState('networkidle');

  // Navigate to Global Settings
  const globalSettingsLink = page.locator('a, .v-list-item, .v-btn').filter({ hasText: /global settings/i }).first();
  await globalSettingsLink.waitFor({ state: 'visible', timeout: 20000 });
  await globalSettingsLink.click();
  await page.waitForLoadState('networkidle');

  // Navigate to Window tab/section
  const windowLink = page.locator('a, .v-list-item, .v-btn, .v-tab').filter({ hasText: /^window$/i }).first();
  await windowLink.waitFor({ state: 'visible', timeout: 20000 });
  await windowLink.click();
  await page.waitForLoadState('networkidle');

  // Find the Title Text field
  const titleTextField = page.locator('input, .v-text-field input').filter({}).and(
    page.locator('[placeholder*="title" i], [label*="title" i]')
  ).first();

  // Try a broader selector for title text field
  const titleLabel = page.locator('.v-label, label').filter({ hasText: /title text/i }).first();
  await titleLabel.waitFor({ state: 'visible', timeout: 20000 });

  // Get the associated input field
  const titleInput = page.locator('.v-text-field').filter({ has: page.locator('.v-label, label', { hasText: /title text/i }) }).locator('input').first();
  await titleInput.waitFor({ state: 'visible', timeout: 10000 });

  // Store the original value for restoration
  const originalValue = await titleInput.inputValue();

  // Clear the Title Text field
  await titleInput.triple_click ? await titleInput.click({ clickCount: 3 }) : await titleInput.click();
  await titleInput.selectAll?.() ;
  await titleInput.fill('');
  await titleInput.press('Control+a');
  await titleInput.press('Delete');

  // Ensure field is empty
  await expect(titleInput).toHaveValue('');

  // Click Save button
  const saveButton = page.locator('.v-btn').filter({ hasText: /^save$/i }).first();
  await saveButton.waitFor({ state: 'visible', timeout: 10000 });
  await saveButton.click();

  // Check for validation error message
  const validationError = page.locator('.v-messages__message, .v-input__details .v-messages, [class*="error"], .error--text, .v-field--error').filter({
    hasText: /required|cannot be empty|title.*required|required.*title/i
  }).first();

  // Also check for generic required field messages
  const requiredMessage = page.locator('.v-messages__message').filter({ hasText: /required/i }).first();
  const errorMessage = page.locator('[class*="v-messages"]').filter({ hasText: /required/i }).first();

  // The test should FAIL (bug present) if no validation error is shown
  // The test should PASS (bug fixed) if validation error is shown
  const hasValidationError = await validationError.isVisible().catch(() => false) ||
    await requiredMessage.isVisible().catch(() => false) ||
    await errorMessage.isVisible().catch(() => false);

  // If bug is present: no error shown, save might succeed
  // If fixed: error is shown preventing save
  expect(hasValidationError, 'Expected a validation error when Title Text is empty, but none was shown').toBeTruthy();

  // Also verify the page did NOT navigate away or show success (bug present would allow saving)
  const successMessage = page.locator('.v-snackbar, [class*="snack"], [class*="toast"]').filter({ hasText: /success|saved/i }).first();
  const savedSuccessfully = await successMessage.isVisible().catch(() => false);

  // If saved successfully with empty title, the bug is present
  if (savedSuccessfully) {
    // Restore original value before failing
    if (originalValue) {
      await titleInput.fill(originalValue);
      await saveButton.click();
      await page.waitForLoadState('networkidle');
    }
    throw new Error('Bug #17263 is present: Empty Title Text was saved without validation error');
  }

  // Restore original value if it was changed
  if (originalValue) {
    await titleInput.fill(originalValue);
    await saveButton.click();
    await page.waitForLoadState('networkidle');
  }
});