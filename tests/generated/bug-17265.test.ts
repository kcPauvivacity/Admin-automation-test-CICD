// Bug #17265: [App Editor] Global Settings > Tab Bar - No confirmation dialog when deleting a tab item
// ADO: https://dev.azure.com/vivacityapp/Viva/_workitems/edit/17265
// Auto-generated 2026-06-12
// REVIEW BEFORE MERGING — verify selectors and assertions

import { test, expect } from '@playwright/test';
import { loginToApp } from '../helpers/auth.helper';

test.setTimeout(120000);

test('BUG #17265 - Confirmation dialog should appear when deleting a tab item in Tab Bar', async ({ page }) => {
  await loginToApp(page, 90000, 'pau.kie.chee@fusioneta.com', 'PAOpaopao@9696');

  // Navigate to App Editor > Global Settings > Tab Bar
  await page.goto('https://app-staging.vivacityapp.com/demo-student/app-editor', { waitUntil: 'load', timeout: 30000 });
  await page.waitForSelector('.v-application', { timeout: 15000 });
  await page.waitForTimeout(2000);

  // Wait for App Editor to load
  await page.waitForLoadState('networkidle', { timeout: 20000 });

  // Navigate to Global Settings
  const globalSettingsLink = page.locator('a, .v-list-item, [role="listitem"], button').filter({ hasText: /global settings/i }).first();
  await globalSettingsLink.waitFor({ timeout: 20000 });
  await globalSettingsLink.click();

  await page.waitForLoadState('networkidle', { timeout: 20000 });

  // Navigate to Tab Bar section
  const tabBarLink = page.locator('a, .v-list-item, [role="listitem"], button, .v-tab').filter({ hasText: /tab bar/i }).first();
  await tabBarLink.waitFor({ timeout: 20000 });
  await tabBarLink.click();

  await page.waitForLoadState('networkidle', { timeout: 20000 });

  // Wait for tab items to be visible
  // Look for delete/trash icons on tab items
  const deleteButton = page.locator('button[aria-label*="delete" i], button[aria-label*="remove" i], .v-btn .mdi-delete, .v-btn .mdi-trash-can, [data-testid*="delete"], .mdi-delete, .mdi-trash-can-outline').first();
  
  // Try alternative selectors if needed
  const trashIcon = page.locator('.mdi-delete, .mdi-trash-can, .mdi-trash-can-outline').first();
  
  let deleteButtonFound = false;
  
  try {
    await deleteButton.waitFor({ timeout: 10000 });
    deleteButtonFound = true;
  } catch {
    try {
      await trashIcon.waitFor({ timeout: 10000 });
      deleteButtonFound = true;
    } catch {
      // Try broader selector
    }
  }

  if (!deleteButtonFound) {
    // Try to find any delete-related button in the tab bar area
    const anyDeleteBtn = page.locator('button').filter({ has: page.locator('.mdi-delete, .mdi-trash-can, .mdi-trash-can-outline') }).first();
    await anyDeleteBtn.waitFor({ timeout: 15000 });
  }

  // Get the count of tab items before deletion attempt
  const tabItemsBefore = await page.locator('.v-list-item, [class*="tab-item"], [data-testid*="tab"]').count();

  // Click the first delete/trash button
  const deleteTarget = page.locator('button').filter({ has: page.locator('.mdi-delete, .mdi-trash-can, .mdi-trash-can-outline') }).first();
  
  // If the above doesn't work, try icon buttons near tab items
  let clickedDelete = false;
  
  try {
    await deleteTarget.waitFor({ timeout: 5000 });
    await deleteTarget.click();
    clickedDelete = true;
  } catch {
    // Try alternative approach
    const iconBtn = page.locator('.mdi-delete').first();
    const parentBtn = iconBtn.locator('xpath=ancestor::button[1]');
    await parentBtn.click();
    clickedDelete = true;
  }

  // After clicking delete, check if a confirmation dialog appeared
  // The bug is that NO confirmation dialog appears - item is immediately deleted
  // The fix should show a dialog like "Are you sure you want to delete this tab?"
  
  // Wait a moment for dialog to potentially appear
  await page.waitForTimeout(1000);

  // Check for confirmation dialog
  const confirmationDialog = page.locator(
    '.v-dialog:visible, [role="dialog"]:visible, .v-overlay:visible'
  ).filter({
    hasText: /are you sure|confirm|delete|cannot be undone/i
  }).first();

  // Also check for any dialog overlay
  const anyDialog = page.locator('.v-dialog--active, .v-overlay--active[role="dialog"]').first();
  
  // Check if confirmation text is visible
  const confirmText = page.locator('text=/are you sure/i, text=/confirm/i, text=/cannot be undone/i').first();

  let dialogVisible = false;
  
  try {
    await confirmationDialog.waitFor({ timeout: 3000 });
    dialogVisible = true;
  } catch {
    try {
      await anyDialog.waitFor({ timeout: 2000 });
      dialogVisible = true;
    } catch {
      try {
        await confirmText.waitFor({ timeout: 2000 });
        dialogVisible = true;
      } catch {
        dialogVisible = false;
      }
    }
  }

  if (dialogVisible) {
    // If dialog appeared, dismiss it to restore state (press Cancel/No)
    const cancelBtn = page.locator('button').filter({ hasText: /cancel|no|dismiss/i }).first();
    try {
      await cancelBtn.waitFor({ timeout: 3000 });
      await cancelBtn.click();
    } catch {
      // Try pressing Escape to close dialog
      await page.keyboard.press('Escape');
    }
    await page.waitForTimeout(500);
  }

  // Assert that a confirmation dialog appeared - this will FAIL if bug is present (no dialog shown)
  expect(dialogVisible, 
    'A confirmation dialog should appear when clicking delete on a tab item. ' +
    'Bug #17265: Tab is deleted immediately without any confirmation prompt.'
  ).toBe(true);
});