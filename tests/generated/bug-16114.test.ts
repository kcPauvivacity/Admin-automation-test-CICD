// Bug #16114: [BUG]Appeditor > Unable to save
// ADO: https://dev.azure.com/vivacityapp/Viva/_workitems/edit/16114
// Auto-generated 2026-05-27
// REVIEW BEFORE MERGING — verify selectors and assertions

import { test, expect } from '@playwright/test';
import { loginToApp } from '../helpers/auth.helper';

test.setTimeout(120000);

test('BUG #16114 - AppEditor: Unable to save', async ({ page }) => {
  await loginToApp(page, 90000, 'pau.kie.chee@fusioneta.com', 'PAOpaopao@9696');

  // Navigate to the app editor section
  await page.goto('https://app-staging.vivacityapp.com');

  // Wait for the application to load
  await page.waitForSelector('.v-application', { timeout: 30000 });

  // Look for App Editor in navigation
  const appEditorNavSelectors = [
    'a[href*="app-editor"]',
    'a[href*="appeditor"]',
    '[data-testid*="app-editor"]',
    'text=App Editor',
    'text=AppEditor',
  ];

  let navigated = false;
  for (const selector of appEditorNavSelectors) {
    try {
      const el = page.locator(selector).first();
      if (await el.isVisible({ timeout: 3000 })) {
        await el.click();
        navigated = true;
        break;
      }
    } catch {
      // Try next selector
    }
  }

  if (!navigated) {
    // Try direct navigation to common app editor URLs
    const possibleUrls = [
      'https://app-staging.vivacityapp.com/app-editor',
      'https://app-staging.vivacityapp.com/appeditor',
      'https://app-staging.vivacityapp.com/demo-student/app-editor',
      'https://app-staging.vivacityapp.com/demo-student/appeditor',
    ];

    for (const url of possibleUrls) {
      await page.goto(url);
      await page.waitForTimeout(2000);
      const currentUrl = page.url();
      if (!currentUrl.includes('login') && !currentUrl.includes('error')) {
        navigated = true;
        break;
      }
    }
  }

  // Wait for app editor page to load
  await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => {});

  // Look for editable elements in the app editor
  const editableSelectors = [
    'input[type="text"]',
    'textarea',
    '.v-text-field input',
    '[contenteditable="true"]',
    '.app-editor input',
    '[data-testid*="editor"] input',
  ];

  let inputField = null;
  for (const selector of editableSelectors) {
    try {
      const el = page.locator(selector).first();
      if (await el.isVisible({ timeout: 3000 })) {
        inputField = el;
        break;
      }
    } catch {
      // Try next selector
    }
  }

  // If we found an input field, make a change to trigger save functionality
  if (inputField) {
    await inputField.click();
    await inputField.fill('Test edit for save ' + Date.now());
  }

  // Look for a Save button
  const saveButtonSelectors = [
    'button:has-text("Save")',
    'button:has-text("SAVE")',
    '[data-testid*="save"]',
    '.v-btn:has-text("Save")',
    'button[type="submit"]',
  ];

  let saveButton = null;
  for (const selector of saveButtonSelectors) {
    try {
      const el = page.locator(selector).first();
      if (await el.isVisible({ timeout: 3000 })) {
        saveButton = el;
        break;
      }
    } catch {
      // Try next selector
    }
  }

  // The bug states unable to save, so we verify save button exists and is clickable
  expect(saveButton, 'Save button should be visible in App Editor').not.toBeNull();

  if (saveButton) {
    // Verify the save button is not disabled
    const isDisabled = await saveButton.isDisabled();
    expect(isDisabled, 'Save button should not be disabled').toBe(false);

    // Set up network listener to detect save API call
    let saveRequestMade = false;
    let saveRequestFailed = false;

    page.on('request', (request) => {
      const url = request.url();
      const method = request.method();
      if (
        (method === 'POST' || method === 'PUT' || method === 'PATCH') &&
        (url.includes('app') || url.includes('editor') || url.includes('save'))
      ) {
        saveRequestMade = true;
      }
    });

    page.on('response', (response) => {
      const url = response.url();
      const status = response.status();
      if (
        (url.includes('app') || url.includes('editor') || url.includes('save')) &&
        status >= 400
      ) {
        saveRequestFailed = true;
      }
    });

    // Click save button
    await saveButton.click();

    // Wait a moment for the save operation to complete
    await page.waitForTimeout(3000);

    // Check for error messages that might indicate save failed
    const errorSelectors = [
      '.v-alert--type-error',
      '[class*="error"]:visible',
      'text=Unable to save',
      'text=Error saving',
      'text=Save failed',
      '.error-message:visible',
    ];

    let errorVisible = false;
    for (const selector of errorSelectors) {
      try {
        const el = page.locator(selector).first();
        if (await el.isVisible({ timeout: 1000 })) {
          errorVisible = true;
          break;
        }
      } catch {
        // No error found with this selector
      }
    }

    // Verify no error occurred during save
    expect(errorVisible, 'No error message should appear after saving').toBe(false);

    // Verify save request did not fail with error status
    expect(saveRequestFailed, 'Save API request should not return an error status').toBe(false);

    // Look for success indication
    const successSelectors = [
      '.v-alert--type-success',
      '[class*="success"]:visible',
      'text=Saved',
      'text=Save successful',
      '.v-snackbar:visible',
      '.v-snackbar__content:visible',
    ];

    let successVisible = false;
    for (const selector of successSelectors) {
      try {
        const el = page.locator(selector).first();
        if (await el.isVisible({ timeout: 5000 })) {
          successVisible = true;
          break;
        }
      } catch {
        // No success message found with this selector
      }
    }

    // If a save request was made, verify it succeeded
    if (saveRequestMade) {
      expect(saveRequestFailed, 'Save request should complete successfully').toBe(false);
    }
  }
});