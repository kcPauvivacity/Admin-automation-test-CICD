// Bug #17299: [App Editor] Assets - "Rename" option in context menu has no effect
// ADO: https://dev.azure.com/vivacityapp/Viva/_workitems/edit/17299
// Auto-generated 2026-06-15
// REVIEW BEFORE MERGING — verify selectors and assertions

import { test, expect } from '@playwright/test';
import { loginToApp } from '../helpers/auth.helper';

test.setTimeout(120000);

test('BUG #17299 - Rename option in Assets context menu should open rename UI', async ({ page }) => {
  await loginToApp(page, 90000, 'pau.kie.chee@fusioneta.com', 'PAOpaopao@9696');

  // Navigate to App Editor > Assets
  await page.goto('https://app-staging.vivacityapp.com/demo-student/app-editor', { waitUntil: 'load', timeout: 30000 });
  await page.waitForSelector('.v-application', { timeout: 15000 });
  await page.waitForTimeout(2000);

  // Navigate to Assets section
  const assetsLink = page.locator('a, .v-list-item, .v-tab, .v-btn').filter({ hasText: /^assets$/i }).first();
  await assetsLink.waitFor({ state: 'visible', timeout: 30000 });
  await assetsLink.click();

  // Wait for asset cards to load
  const assetCard = page.locator('.v-card, [class*="asset-card"], [class*="asset-item"]').first();
  await assetCard.waitFor({ state: 'visible', timeout: 30000 });

  // Find the "..." (more options / context menu) button on the first asset card
  const moreOptionsBtn = assetCard.locator('button').filter({ hasText: /^\.\.\.$/ }).first()
    .or(assetCard.locator('[aria-label*="more"], [aria-label*="options"], [aria-label*="menu"], .v-btn--icon').first())
    .or(page.locator('.v-card').first().locator('button.v-btn--icon, [data-testid*="menu"], [aria-label*="more"]').first());

  // Try multiple selectors for the context menu trigger
  let menuTrigger = page.locator('.v-card').first().locator('button').filter({ hasText: '...' }).first();

  if (!(await menuTrigger.isVisible().catch(() => false))) {
    menuTrigger = page.locator('.v-card').first().locator('.v-btn--icon').last();
  }

  if (!(await menuTrigger.isVisible().catch(() => false))) {
    // Try to hover to reveal the button
    await assetCard.hover();
    menuTrigger = page.locator('.v-card').first().locator('button').last();
  }

  await menuTrigger.waitFor({ state: 'visible', timeout: 15000 });
  await menuTrigger.click();

  // Wait for context menu / dropdown to appear
  const contextMenu = page.locator('.v-menu, .v-list, [role="menu"]').filter({ isVisible: true }).first();
  await contextMenu.waitFor({ state: 'visible', timeout: 10000 });

  // Click "Rename" option
  const renameOption = contextMenu.locator('[role="menuitem"], .v-list-item').filter({ hasText: /rename/i }).first();
  await renameOption.waitFor({ state: 'visible', timeout: 10000 });
  await renameOption.click();

  // After clicking Rename, verify that SOMETHING happens:
  // Either an inline input appears, or a dialog/modal opens

  // Check for inline input on the card
  const inlineInput = page.locator('.v-card input[type="text"], .v-card .v-text-field input, [data-testid*="rename"] input').first();
  
  // Check for a dialog
  const renameDialog = page.locator('.v-dialog, [role="dialog"]').filter({ isVisible: true }).first();

  // Check for any text field that appeared after clicking rename
  const anyTextField = page.locator('.v-text-field input, input[type="text"]').filter({ isVisible: true }).first();

  // The bug is: nothing happens after clicking Rename
  // The fix should show either an inline input or a dialog
  // We give it a moment for the UI to react
  await page.waitForTimeout(1000);

  const inlineInputVisible = await inlineInput.isVisible().catch(() => false);
  const dialogVisible = await renameDialog.isVisible().catch(() => false);
  const textFieldVisible = await anyTextField.isVisible().catch(() => false);

  // At least one of these should be true when the bug is fixed
  const renameUIAppeared = inlineInputVisible || dialogVisible || textFieldVisible;

  expect(
    renameUIAppeared,
    'Clicking "Rename" should show an input field or dialog to rename the asset, but nothing appeared (bug #17299)'
  ).toBe(true);

  // Cleanup: if a dialog is open, close it
  if (dialogVisible) {
    const cancelBtn = page.locator('.v-dialog button').filter({ hasText: /cancel|close|dismiss/i }).first();
    if (await cancelBtn.isVisible().catch(() => false)) {
      await cancelBtn.click();
    } else {
      await page.keyboard.press('Escape');
    }
  } else if (inlineInputVisible || textFieldVisible) {
    // Press Escape to cancel the rename
    await page.keyboard.press('Escape');
  }
});