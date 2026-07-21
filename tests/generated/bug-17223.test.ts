// Bug #17223: Appeditor > Reset and save changes is missing
// ADO: https://dev.azure.com/vivacityapp/Viva/_workitems/edit/17223
// Auto-generated 2026-06-11
// REVIEW BEFORE MERGING — verify selectors and assertions

import { test, expect } from '@playwright/test';
import { loginToApp } from '../helpers/auth.helper';

test.setTimeout(120000);

test('BUG #17223: AppEditor - Reset and Save Changes buttons are visible', async ({ page }) => {
  await loginToApp(page, 90000, 'pau.kie.chee@fusioneta.com', 'PAOpaopao@9696');

  // Navigate to the app editor section
  await page.goto('https://app-staging.vivacityapp.com');

  // Wait for the application to load
  await page.waitForSelector('.v-application', { timeout: 30000 });

  // Look for app editor navigation link
  const appEditorSelectors = [
    'a[href*="app-editor"]',
    'a[href*="appeditor"]',
    '[data-testid="app-editor"]',
    'text=App Editor',
    'text=AppEditor',
  ];

  let navigatedToEditor = false;

  for (const selector of appEditorSelectors) {
    try {
      const element = await page.$(selector);
      if (element) {
        await element.click();
        navigatedToEditor = true;
        break;
      }
    } catch {
      // continue trying
    }
  }

  if (!navigatedToEditor) {
    // Try direct URL navigation
    const editorUrls = [
      'https://app-staging.vivacityapp.com/app-editor',
      'https://app-staging.vivacityapp.com/appeditor',
      'https://app-staging.vivacityapp.com/demo-student/app-editor',
      'https://app-staging.vivacityapp.com/demo-student/appeditor',
    ];

    for (const url of editorUrls) {
      await page.goto(url);
      await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
      const hasContent = await page.$('.v-application');
      if (hasContent) {
        navigatedToEditor = true;
        break;
      }
    }
  }

  // Wait for page to settle
  await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});

  // Check for Reset button visibility
  const resetButtonSelectors = [
    'button:has-text("Reset")',
    '[data-testid="reset-button"]',
    'button:has-text("Reset Changes")',
    '.v-btn:has-text("Reset")',
  ];

  let resetButtonFound = false;
  for (const selector of resetButtonSelectors) {
    try {
      const element = await page.$(selector);
      if (element) {
        const isVisible = await element.isVisible();
        if (isVisible) {
          resetButtonFound = true;
          break;
        }
      }
    } catch {
      // continue
    }
  }

  // Check for Save Changes button visibility
  const saveButtonSelectors = [
    'button:has-text("Save Changes")',
    'button:has-text("Save")',
    '[data-testid="save-button"]',
    '[data-testid="save-changes-button"]',
    '.v-btn:has-text("Save Changes")',
    '.v-btn:has-text("Save")',
  ];

  let saveButtonFound = false;
  for (const selector of saveButtonSelectors) {
    try {
      const element = await page.$(selector);
      if (element) {
        const isVisible = await element.isVisible();
        if (isVisible) {
          saveButtonFound = true;
          break;
        }
      }
    } catch {
      // continue
    }
  }

  // Assert both buttons are present - this will FAIL if the bug is present
  expect(resetButtonFound, 'Reset button should be visible in App Editor').toBe(true);
  expect(saveButtonFound, 'Save Changes button should be visible in App Editor').toBe(true);
});

test('BUG #17223: AppEditor - Reset and Save Changes buttons visible after making changes', async ({ page }) => {
  await loginToApp(page, 90000, 'pau.kie.chee@fusioneta.com', 'PAOpaopao@9696');

  await page.goto('https://app-staging.vivacityapp.com');
  await page.waitForSelector('.v-application', { timeout: 30000 });

  // Try to navigate to app editor
  const editorUrls = [
    'https://app-staging.vivacityapp.com/app-editor',
    'https://app-staging.vivacityapp.com/appeditor',
    'https://app-staging.vivacityapp.com/demo-student/app-editor',
    'https://app-staging.vivacityapp.com/demo-student/appeditor',
  ];

  for (const url of editorUrls) {
    await page.goto(url);
    await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
    const currentUrl = page.url();
    if (currentUrl.includes('app-editor') || currentUrl.includes('appeditor')) {
      break;
    }
  }

  await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});

  // Look for any editable field in the app editor and make a change
  const editableSelectors = [
    'input[type="text"]:not([readonly])',
    '.v-text-field input',
    '[contenteditable="true"]',
  ];

  let madeChange = false;
  for (const selector of editableSelectors) {
    try {
      const element = await page.$(selector);
      if (element) {
        const isVisible = await element.isVisible();
        if (isVisible) {
          await element.click();
          await element.press('End');
          await element.type(' ');
          madeChange = true;
          break;
        }
      }
    } catch {
      // continue
    }
  }

  // After making a change (or on initial load), check for Reset and Save Changes buttons
  // These buttons should be present in the App Editor toolbar area
  await page.waitForTimeout(1000);

  // Check the toolbar/action area for Reset and Save Changes
  const toolbarResetSelectors = [
    'button:has-text("Reset")',
    '.v-btn:has-text("Reset")',
    '[class*="toolbar"] button:has-text("Reset")',
    '[class*="header"] button:has-text("Reset")',
    '[class*="action"] button:has-text("Reset")',
  ];

  const toolbarSaveSelectors = [
    'button:has-text("Save Changes")',
    'button:has-text("Save")',
    '.v-btn:has-text("Save Changes")',
    '[class*="toolbar"] button:has-text("Save")',
    '[class*="header"] button:has-text("Save")',
    '[class*="action"] button:has-text("Save")',
  ];

  let resetVisible = false;
  for (const selector of toolbarResetSelectors) {
    try {
      const locator = page.locator(selector).first();
      const count = await locator.count();
      if (count > 0) {
        const visible = await locator.isVisible();
        if (visible) {
          resetVisible = true;
          break;
        }
      }
    } catch {
      // continue
    }
  }

  let saveVisible = false;
  for (const selector of toolbarSaveSelectors) {
    try {
      const locator = page.locator(selector).first();
      const count = await locator.count();
      if (count > 0) {
        const visible = await locator.isVisible();
        if (visible) {
          saveVisible = true;
          break;
        }
      }
    } catch {
      // continue
    }
  }

  // Restore state if a change was made - look for Reset button to undo
  if (madeChange && resetVisible) {
    try {
      await page.click('button:has-text("Reset")');
    } catch {
      // ignore restoration errors
    }
  }

  // These assertions will FAIL if the bug is present (buttons missing)
  expect(resetVisible, 'Reset button must be visible in App Editor - Bug #17223').toBe(true);
  expect(saveVisible, 'Save Changes button must be visible in App Editor - Bug #17223').toBe(true);
});