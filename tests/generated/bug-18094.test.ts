// Bug #18094: [Admin] QR code popup not working when generating QR on Vivacity > Venue
// ADO: https://dev.azure.com/vivacityapp/Viva/_workitems/edit/18094
// Auto-generated 2026-08-11
// REVIEW BEFORE MERGING — verify selectors and assertions

import { test, expect } from '@playwright/test';
import { loginToApp } from '../helpers/auth.helper';

test.setTimeout(120000);

test('BUG #18094 - QR code popup should open and display correctly on Venue page', async ({ page }) => {
  await loginToApp(page);

  // Navigate to Vivacity > Venue
  await page.goto('https://app-staging.vivacityapp.com');

  // Wait for the app to load
  await page.waitForSelector('.v-application', { timeout: 30000 });

  // Navigate to Venue section - try sidebar navigation
  const venueNavItem = page.locator('text=Venue').first();
  
  // Try to find Venue in navigation
  const vivacityNav = page.locator('.v-navigation-drawer, .v-list').filter({ hasText: 'Vivacity' });
  
  // Look for Venue menu item - may need to expand Vivacity section first
  const vivacityMenuItem = page.locator('.v-list-item, .v-btn').filter({ hasText: /vivacity/i }).first();
  
  if (await vivacityMenuItem.isVisible()) {
    await vivacityMenuItem.click();
    await page.waitForTimeout(1000);
  }

  // Try direct URL navigation to venue page
  const currentUrl = page.url();
  const baseMatch = currentUrl.match(/https:\/\/app-staging\.vivacityapp\.com\/([^/]+)/);
  const orgSlug = baseMatch ? baseMatch[1] : 'demo-student';

  await page.goto(`https://app-staging.vivacityapp.com/${orgSlug}/venue`);
  await page.waitForSelector('.v-application', { timeout: 30000 });

  // Check if we landed on a venue-related page
  const pageContent = page.locator('.v-main, main');
  await expect(pageContent).toBeVisible({ timeout: 15000 });

  // Look for QR code generate button
  const qrButton = page.locator('button, .v-btn').filter({ hasText: /qr|qr code|generate/i }).first();
  
  // If QR button not found on this URL, try alternative routes
  if (!await qrButton.isVisible({ timeout: 5000 }).catch(() => false)) {
    // Try demo-student path
    await page.goto('https://app-staging.vivacityapp.com/demo-student/venue');
    await page.waitForSelector('.v-application', { timeout: 15000 });
  }

  // Wait for page content to fully load
  await page.waitForLoadState('networkidle', { timeout: 20000 });

  // Look for QR code button with various possible selectors
  const qrCodeButton = page.locator([
    'button:has-text("QR")',
    'button:has-text("QR Code")',
    'button:has-text("Generate QR")',
    '.v-btn:has-text("QR")',
    '[data-testid*="qr"]',
    'button[title*="QR" i]',
    '.v-btn[title*="QR" i]',
  ].join(', ')).first();

  // Also look for QR icon buttons
  const qrIconButton = page.locator('button').filter({ has: page.locator('[class*="qr"], [data-icon*="qr"]') }).first();

  const hasQrButton = await qrCodeButton.isVisible({ timeout: 5000 }).catch(() => false);
  const hasQrIconButton = await qrIconButton.isVisible({ timeout: 2000 }).catch(() => false);

  if (!hasQrButton && !hasQrIconButton) {
    // Try to find any table rows or venue items that might have QR actions
    const tableRows = page.locator('.v-data-table tbody tr, .v-list-item').first();
    const hasTableRows = await tableRows.isVisible({ timeout: 5000 }).catch(() => false);
    
    if (hasTableRows) {
      // Look for action buttons within rows
      const rowQrButton = page.locator('.v-data-table tbody tr button, .v-data-table tbody tr .v-btn').first();
      const hasRowButton = await rowQrButton.isVisible({ timeout: 3000 }).catch(() => false);
      
      if (hasRowButton) {
        await rowQrButton.click();
      }
    }
  } else {
    const buttonToClick = hasQrButton ? qrCodeButton : qrIconButton;
    await buttonToClick.click();
  }

  // After clicking QR button, verify the popup/dialog opens correctly
  const dialog = page.locator('.v-dialog, .v-overlay__content, [role="dialog"]').filter({ isVisible: true }).first();
  
  await expect(dialog).toBeVisible({ timeout: 10000 });

  // Verify the QR code popup contains expected content
  const qrCodeImage = dialog.locator('img, canvas, svg, [class*="qr"]');
  const dialogTitle = dialog.locator('.v-card-title, .v-toolbar-title, h2, h3').filter({ hasText: /qr/i });
  
  // The dialog should contain either a QR image or a title related to QR
  const hasQrContent = await qrCodeImage.isVisible({ timeout: 5000 }).catch(() => false);
  const hasQrTitle = await dialogTitle.isVisible({ timeout: 3000 }).catch(() => false);

  expect(hasQrContent || hasQrTitle).toBeTruthy();

  // Verify dialog is interactive - not frozen or broken
  // Check that dialog has proper structure (not empty/broken)
  const dialogContent = dialog.locator('.v-card, .v-sheet');
  await expect(dialogContent).toBeVisible({ timeout: 5000 });

  // Close the dialog to restore state
  const closeButton = dialog.locator('button').filter({ hasText: /close|cancel|×/i }).first();
  const hasCloseButton = await closeButton.isVisible({ timeout: 3000 }).catch(() => false);
  
  if (hasCloseButton) {
    await closeButton.click();
  } else {
    // Press Escape to close
    await page.keyboard.press('Escape');
  }

  // Verify dialog is closed
  await expect(dialog).not.toBeVisible({ timeout: 5000 });
});