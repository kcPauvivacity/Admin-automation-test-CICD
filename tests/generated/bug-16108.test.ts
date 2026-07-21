// Bug #16108: [BUG]Appeditor > unable to preview
// ADO: https://dev.azure.com/vivacityapp/Viva/_workitems/edit/16108
// Auto-generated 2026-05-28
// REVIEW BEFORE MERGING — verify selectors and assertions

import { test, expect } from '@playwright/test';
import { loginToApp } from '../helpers/auth.helper';

test.setTimeout(120000);

test('BUG #16108: AppEditor - able to preview app', async ({ page }) => {
  await loginToApp(page, 90000, 'pau.kie.chee@fusioneta.com', 'PAOpaopao@9696');

  // Navigate to App Editor
  await page.goto('https://app-staging.vivacityapp.com');

  // Wait for the application to load
  await page.waitForSelector('.v-application', { timeout: 30000 });

  // Look for App Editor navigation link
  const appEditorLink = page.locator('a[href*="app-editor"], a[href*="appeditor"], [data-testid*="app-editor"]').first();
  
  // Try to find app editor in navigation
  const navItems = page.locator('.v-list-item, .v-navigation-drawer .v-list-item');
  
  // Navigate directly to app editor if possible
  await page.goto('https://app-staging.vivacityapp.com/demo-student/app-editor');
  
  // Wait for page to load
  await page.waitForLoadState('networkidle', { timeout: 30000 });

  // Check if app editor loaded
  const pageContent = page.locator('.v-application');
  await expect(pageContent).toBeVisible({ timeout: 15000 });

  // Look for app editor content - list of apps or app items
  const appEditorContent = page.locator(
    '[class*="app-editor"], [data-testid*="app-editor"], .app-editor, ' +
    '[class*="appeditor"], [data-testid*="appeditor"]'
  ).first();

  // Look for app items in the editor
  const appItems = page.locator(
    '.v-card, .app-item, [class*="app-card"], [data-testid*="app-item"]'
  );

  // Wait for any app cards/items to appear
  await page.waitForSelector('.v-card, .v-list, [class*="app"]', { timeout: 20000 });

  // Find preview button or preview functionality
  const previewButton = page.locator(
    'button:has-text("Preview"), ' +
    '[data-testid*="preview"], ' +
    '.v-btn:has-text("Preview"), ' +
    'button[title*="preview" i], ' +
    '[aria-label*="preview" i]'
  ).first();

  // Check if there are any apps listed to preview
  const hasApps = await appItems.count() > 0;

  if (hasApps) {
    // Click on first app to open it if needed
    const firstApp = appItems.first();
    await expect(firstApp).toBeVisible({ timeout: 10000 });

    // Check for preview button within the app card
    const appPreviewBtn = firstApp.locator(
      'button:has-text("Preview"), [data-testid*="preview"], .v-btn:has-text("Preview")'
    ).first();

    const hasPreviewInCard = await appPreviewBtn.isVisible().catch(() => false);
    
    if (!hasPreviewInCard) {
      // Try clicking on the app first to open editor
      await firstApp.click();
      await page.waitForLoadState('networkidle', { timeout: 20000 });
    }
  }

  // After navigation, look for preview button
  const previewBtn = page.locator(
    'button:has-text("Preview"), ' +
    '.v-btn:has-text("Preview"), ' +
    '[data-testid*="preview"], ' +
    'button[title*="preview" i], ' +
    '[aria-label*="preview" i], ' +
    '.preview-button, ' +
    '[class*="preview"]'
  ).first();

  // The preview button should be visible and not disabled
  await expect(previewBtn).toBeVisible({ timeout: 20000 });

  // Verify the preview button is enabled (not disabled - which would indicate the bug)
  const isDisabled = await previewBtn.isDisabled();
  expect(isDisabled).toBe(false);

  // Click the preview button to verify it actually works
  await previewBtn.click();

  // After clicking preview, we should see a preview modal, new tab, or preview content
  // Wait for some indication that preview opened successfully
  const previewContent = page.locator(
    '[class*="preview-modal"], ' +
    '[data-testid*="preview-modal"], ' +
    '.v-dialog:visible, ' +
    '[class*="preview-content"], ' +
    'iframe[src*="preview"]'
  ).first();

  // Check if a new page/tab was opened or preview dialog appeared
  const dialogVisible = await previewContent.isVisible().catch(() => false);
  
  if (!dialogVisible) {
    // Check if navigation happened (preview in new page)
    const currentUrl = page.url();
    const isPreviewUrl = currentUrl.includes('preview') || currentUrl !== 'https://app-staging.vivacityapp.com/demo-student/app-editor';
    
    // Either a dialog should be visible or URL should change indicating preview loaded
    expect(dialogVisible || isPreviewUrl).toBe(true);
  } else {
    await expect(previewContent).toBeVisible({ timeout: 15000 });
  }

  // Close any open dialogs to restore state
  const closeButton = page.locator(
    'button[aria-label*="close" i], ' +
    '.v-dialog .v-btn--icon, ' +
    '[data-testid*="close"]'
  ).first();
  
  const closeVisible = await closeButton.isVisible().catch(() => false);
  if (closeVisible) {
    await closeButton.click();
  }
});