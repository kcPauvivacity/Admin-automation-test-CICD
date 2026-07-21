// Bug #17262: [App Editor] Global Settings - Change counter always shows "You've changed 0 setting" regardless of actual changes
// ADO: https://dev.azure.com/vivacityapp/Viva/_workitems/edit/17262
// Auto-generated 2026-06-12
// REVIEW BEFORE MERGING — verify selectors and assertions

import { test, expect } from '@playwright/test';
import { loginToApp } from '../helpers/auth.helper';

test.setTimeout(120000);

test('BUG #17262 - Global Settings change counter reflects actual number of changes', async ({ page }) => {
  await loginToApp(page, 90000, 'pau.kie.chee@fusioneta.com', 'PAOpaopao@9696');

  // Navigate to App Editor > Global Settings > Window
  await page.waitForSelector('.v-application', { timeout: 30000 });

  // Navigate to App Editor
  await page.goto('https://app-staging.vivacityapp.com/demo-student/app-editor', { waitUntil: 'load', timeout: 30000 });
  await page.waitForSelector('.v-application', { timeout: 15000 });
  await page.waitForTimeout(2000);

  // Wait for App Editor to load
  await page.waitForSelector('.v-application', { timeout: 15000 });

  // Navigate to Global Settings
  const globalSettingsLink = page.locator('text=Global Settings').first();
  await globalSettingsLink.waitFor({ timeout: 15000 });
  await globalSettingsLink.click();

  // Navigate to Window settings
  const windowLink = page.locator('text=Window').first();
  await windowLink.waitFor({ timeout: 15000 });
  await windowLink.click();

  // Wait for the Window settings page to load
  await page.waitForSelector('input, textarea', { timeout: 15000 });

  // Ensure no footer bar is visible before making changes
  const footerBar = page.locator('.v-footer, [class*="footer"], [class*="change-bar"], [class*="changes"]').first();

  // Find the Title Text field
  const titleTextField = page.locator('input[placeholder*="Title"], input[label*="Title"], label:has-text("Title") + input, label:has-text("Title") ~ * input').first();
  
  // Try a more general approach to find title-related input
  const titleInput = page.locator('input').filter({ hasText: '' }).first();
  
  // Look for a field labeled "Title Text" specifically
  const titleTextLabel = page.locator('text=Title Text').first();
  await titleTextLabel.waitFor({ timeout: 15000 });

  // Find the input associated with Title Text label
  const titleTextInput = page.locator('.v-text-field').filter({ has: page.locator('text=Title Text') }).locator('input').first();
  await titleTextInput.waitFor({ timeout: 10000 });

  // Store the original value
  const originalValue = await titleTextInput.inputValue();

  // Make a change to the Title Text field
  await titleTextInput.click();
  await titleTextInput.triple_click?.() || await titleTextInput.click({ clickCount: 3 });
  await titleTextInput.fill(`${originalValue} Modified`);
  await titleTextInput.blur();

  // Wait for the footer/change bar to appear
  await page.waitForTimeout(1000);

  // Look for the change counter text - should show "You've changed 1 setting" not "0 setting"
  const changeCounterZero = page.locator('text=/You\'ve changed 0 setting/i').first();
  const changeCounterOne = page.locator('text=/You\'ve changed 1 setting/i').first();

  // Wait for the footer bar with the counter to appear
  const footerWithCounter = page.locator('text=/You\'ve changed/i').first();
  await footerWithCounter.waitFor({ timeout: 15000 });

  // Get the actual text displayed
  const counterText = await footerWithCounter.textContent();

  // The bug: counter shows "0" even after changes
  // This assertion FAILS when bug is present (shows 0), PASSES when fixed (shows 1)
  expect(counterText).not.toMatch(/You've changed 0 setting/i);
  expect(counterText).toMatch(/You've changed [1-9]\d* setting/i);

  // Additional explicit check that it shows exactly 1 change
  await expect(changeCounterZero).not.toBeVisible();
  await expect(changeCounterOne).toBeVisible({ timeout: 5000 });

  // Restore original state by clicking Cancel/Discard if available
  const cancelButton = page.locator('button:has-text("Cancel"), button:has-text("Discard"), button:has-text("Reset")').first();
  if (await cancelButton.isVisible()) {
    await cancelButton.click();
    // Confirm discard if dialog appears
    const confirmButton = page.locator('button:has-text("Confirm"), button:has-text("Yes"), button:has-text("Discard")').first();
    if (await confirmButton.isVisible({ timeout: 3000 })) {
      await confirmButton.click();
    }
  } else {
    // Try to restore by filling original value back
    await titleTextInput.click({ clickCount: 3 });
    await titleTextInput.fill(originalValue);
    const saveButton = page.locator('button:has-text("Save")').first();
    if (await saveButton.isVisible()) {
      await saveButton.click();
    }
  }
});

test('BUG #17262 - Global Settings Tab Bar change counter reflects actual number of changes', async ({ page }) => {
  await loginToApp(page, 90000, 'pau.kie.chee@fusioneta.com', 'PAOpaopao@9696');

  await page.waitForSelector('.v-application', { timeout: 30000 });
  await page.goto('https://app-staging.vivacityapp.com');
  await page.waitForSelector('.v-application', { timeout: 30000 });

  // Navigate to App Editor
  const appEditorLink = page.locator('text=App Editor').first();
  await appEditorLink.waitFor({ timeout: 15000 });
  await appEditorLink.click();

  // Navigate to Global Settings
  const globalSettingsLink = page.locator('text=Global Settings').first();
  await globalSettingsLink.waitFor({ timeout: 15000 });
  await globalSettingsLink.click();

  // Navigate to Tab Bar settings
  const tabBarLink = page.locator('text=Tab Bar').first();
  await tabBarLink.waitFor({ timeout: 15000 });
  await tabBarLink.click();

  // Wait for Tab Bar settings to load
  await page.waitForSelector('.v-application', { timeout: 15000 });

  // Look for "Add" button to add a new Tab Item
  const addButton = page.locator('button:has-text("Add"), button[aria-label*="add" i], .v-btn:has-text("Add")').first();
  await addButton.waitFor({ timeout: 15000 });
  await addButton.click();

  // Wait for the footer/change bar to appear
  await page.waitForTimeout(1000);

  // Look for the change counter
  const footerWithCounter = page.locator('text=/You\'ve changed/i').first();
  await footerWithCounter.waitFor({ timeout: 15000 });

  // Get the actual text displayed
  const counterText = await footerWithCounter.textContent();

  // The bug: counter shows "0" even after adding a tab item
  // This assertion FAILS when bug is present, PASSES when fixed
  expect(counterText).not.toMatch(/You've changed 0 setting/i);
  expect(counterText).toMatch(/You've changed [1-9]\d* setting/i);

  // Restore state - discard changes
  const cancelButton = page.locator('button:has-text("Cancel"), button:has-text("Discard"), button:has-text("Reset")').first();
  if (await cancelButton.isVisible()) {
    await cancelButton.click();
    const confirmButton = page.locator('button:has-text("Confirm"), button:has-text("Yes"), button:has-text("Discard")').first();
    if (await confirmButton.isVisible({ timeout: 3000 })) {
      await confirmButton.click();
    }
  }
});