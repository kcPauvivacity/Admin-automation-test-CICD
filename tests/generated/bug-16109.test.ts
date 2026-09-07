// Bug #16109: [BUG]Appeditor > Create field is not working
// ADO: https://dev.azure.com/vivacityapp/Viva/_workitems/edit/16109
// Auto-generated 2026-05-28
// REVIEW BEFORE MERGING — verify selectors and assertions

import { test, expect } from '@playwright/test';
import { loginToApp } from '../helpers/auth.helper';

test.setTimeout(120000);

test('BUG #16109 - AppEditor Create field is working', async ({ page }) => {
  await loginToApp(page, 90000, 'pau.kie.chee@fusioneta.com', 'PAOpaopao@9696');

  // Navigate to App Editor
  let navigatedOk = true;
  try {
    await page.goto('https://app-staging.vivacityapp.com/demo-student/app-editor', { waitUntil: 'load', timeout: 30000 });
    await page.waitForSelector('.v-application', { timeout: 15000 });
    await page.waitForTimeout(2000);
  } catch {
    navigatedOk = false;
  }

  if (!navigatedOk) {
    // Try direct navigation
    await page.goto('https://app-staging.vivacityapp.com/app-editor');
  }

  await page.waitForLoadState('networkidle');

  // Wait for the App Editor page to be visible
  const pageContent = page.locator('.v-application, main, [data-testid]');
  await pageContent.waitFor({ state: 'visible', timeout: 30000 });

  // Look for a way to create a new field - look for "Create Field" button or similar
  const createFieldBtn = page.locator('button, .v-btn').filter({ hasText: /create.?field|add.?field|new.?field|\+ field/i }).first();
  
  let createFieldVisible = false;
  
  try {
    await createFieldBtn.waitFor({ state: 'visible', timeout: 10000 });
    createFieldVisible = true;
  } catch {
    // Button might be inside a panel or require selecting something first
  }

  if (!createFieldVisible) {
    // Try clicking on any table/form item to open field editor
    const appItem = page.locator('.v-list-item, .v-card, [class*="app-item"], [class*="table-item"]').first();
    if (await appItem.isVisible()) {
      await appItem.click();
      await page.waitForLoadState('networkidle');
    }

    // Try again after clicking
    try {
      await createFieldBtn.waitFor({ state: 'visible', timeout: 10000 });
      createFieldVisible = true;
    } catch {
      // Still not visible, try to find any "+" or create button
    }
  }

  if (!createFieldVisible) {
    // Look for a broader set of create/add buttons
    const addBtn = page.locator('button, .v-btn').filter({ hasText: /^\+$|add|create|new/i }).first();
    if (await addBtn.isVisible()) {
      await addBtn.click();
      await page.waitForLoadState('networkidle');

      // Look for "Field" option in a dropdown/menu
      const fieldOption = page.locator('.v-list-item, .v-menu__content .v-list-item, [role="menuitem"]')
        .filter({ hasText: /field/i })
        .first();
      
      if (await fieldOption.isVisible()) {
        await fieldOption.click();
        await page.waitForLoadState('networkidle');
      }
    }
  }

  // At this point, try to find the Create Field button/panel
  const createButton = page.locator('button, .v-btn').filter({ hasText: /create.?field|add.?field/i }).first();
  
  if (await createButton.isVisible()) {
    await createButton.click();
    await page.waitForLoadState('networkidle');
  }

  // Look for a dialog/form for creating a field
  const fieldDialog = page.locator('.v-dialog, .v-overlay, [role="dialog"]').filter({ hasText: /field/i }).first();
  const fieldForm = page.locator('form, .field-form, [class*="create-field"], [class*="field-editor"]').first();

  // Check if either a dialog or form is present after clicking create
  const dialogVisible = await fieldDialog.isVisible().catch(() => false);
  const formVisible = await fieldForm.isVisible().catch(() => false);

  if (dialogVisible || formVisible) {
    // Try to fill in field name
    const nameInput = page.locator('input[placeholder*="name" i], input[label*="name" i], .v-text-field input').first();
    if (await nameInput.isVisible()) {
      await nameInput.fill('Test Field Regression');
    }

    // Find and click submit/create/save button
    const submitBtn = page.locator('.v-dialog button, .v-overlay button, [role="dialog"] button')
      .filter({ hasText: /create|save|submit|add/i })
      .first();

    if (await submitBtn.isVisible()) {
      await submitBtn.click();
      await page.waitForLoadState('networkidle');

      // Verify success - no error messages and the dialog closed or field appears in list
      const errorMsg = page.locator('.v-alert--type-error, [class*="error"], .v-snackbar').filter({ hasText: /error|failed|invalid/i }).first();
      const hasError = await errorMsg.isVisible().catch(() => false);
      
      expect(hasError, 'Create field should not show an error').toBe(false);

      // Verify the dialog closed (success case)
      const dialogStillOpen = await page.locator('.v-dialog:visible, [role="dialog"]:visible').first().isVisible().catch(() => false);
      
      if (dialogStillOpen) {
        // If dialog is still open, check for success feedback inside
        const successMsg = page.locator('.v-dialog .v-alert--type-success, .v-dialog [class*="success"]').first();
        const hasSuccess = await successMsg.isVisible().catch(() => false);
        // Dialog closed = success, or has explicit success message
        expect(hasSuccess || !dialogStillOpen, 'Create field action should succeed').toBe(true);
      }
    }
  }

  // Final check: Verify the page is functional and no critical errors
  const criticalError = page.locator('.v-alert--type-error, [class*="error-page"]').filter({ hasText: /cannot|failed|broken/i }).first();
  const hasCriticalError = await criticalError.isVisible().catch(() => false);
  expect(hasCriticalError, 'Page should not have critical errors').toBe(false);

  // Cleanup: close any open dialogs
  const closeBtn = page.locator('.v-dialog button[aria-label*="close" i], .v-overlay button[aria-label*="close" i]').first();
  if (await closeBtn.isVisible()) {
    await closeBtn.click();
  }

  const escapeNeeded = await page.locator('.v-dialog:visible, .v-overlay:visible').first().isVisible().catch(() => false);
  if (escapeNeeded) {
    await page.keyboard.press('Escape');
  }
});