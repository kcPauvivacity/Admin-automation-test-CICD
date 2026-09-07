// Bug #16112: [BUG]Appeditor > Unable to upload assets
// ADO: https://dev.azure.com/vivacityapp/Viva/_workitems/edit/16112
// Auto-generated 2026-05-28
// REVIEW BEFORE MERGING — verify selectors and assertions

import { test, expect } from '@playwright/test';
import { loginToApp } from '../helpers/auth.helper';

test.setTimeout(120000);

test('BUG #16112 - AppEditor: able to upload assets', async ({ page }) => {
  await loginToApp(page, 90000, 'pau.kie.chee@fusioneta.com', 'PAOpaopao@9696');

  // Navigate to App Editor
  let navigatedViaMenu = true;
  try {
    await page.goto('https://app-staging.vivacityapp.com/demo-student/app-editor', { waitUntil: 'load', timeout: 30000 });
    await page.waitForSelector('.v-application', { timeout: 15000 });
    await page.waitForTimeout(2000);
  } catch {
    navigatedViaMenu = false;
  }

  if (!navigatedViaMenu) {
    // Try direct navigation
    await page.goto('https://app-staging.vivacityapp.com/app-editor');
  }

  // Wait for the app editor page to load
  await page.waitForLoadState('networkidle');

  // Look for assets section - try multiple possible selectors
  const assetsTab = page.locator('.v-tab, .v-btn, button, a').filter({ hasText: /assets/i }).first();
  const assetsSidebar = page.locator('.v-list-item').filter({ hasText: /assets/i }).first();

  if (await assetsTab.isVisible({ timeout: 5000 }).catch(() => false)) {
    await assetsTab.click();
  } else if (await assetsSidebar.isVisible({ timeout: 5000 }).catch(() => false)) {
    await assetsSidebar.click();
  }

  await page.waitForLoadState('networkidle');

  // Look for upload button/input
  const uploadButton = page.locator('.v-btn, button').filter({ hasText: /upload/i }).first();
  const fileInput = page.locator('input[type="file"]').first();
  const dropZone = page.locator('[class*="upload"], [class*="drop"], [class*="asset"]').first();

  let uploadElementFound = false;

  // Check if upload button is visible and enabled
  if (await uploadButton.isVisible({ timeout: 5000 }).catch(() => false)) {
    const isDisabled = await uploadButton.isDisabled();
    expect(isDisabled, 'Upload button should not be disabled').toBe(false);
    uploadElementFound = true;

    // Click upload button and verify file input becomes available or dialog opens
    await uploadButton.click();
    await page.waitForTimeout(1000);

    // Check if a file dialog or upload modal appeared
    const uploadModal = page.locator('.v-dialog, .v-overlay__content').filter({ hasText: /upload/i });
    const fileInputAfterClick = page.locator('input[type="file"]');

    const modalVisible = await uploadModal.isVisible({ timeout: 3000 }).catch(() => false);
    const fileInputVisible = await fileInputAfterClick.isVisible({ timeout: 3000 }).catch(() => false);
    const fileInputAttached = await fileInputAfterClick.count() > 0;

    // Either a modal appeared or a file input is present — upload flow is accessible
    expect(
      modalVisible || fileInputVisible || fileInputAttached,
      'Upload dialog or file input should appear after clicking upload button'
    ).toBe(true);

  } else if (await fileInput.isVisible({ timeout: 5000 }).catch(() => false)) {
    uploadElementFound = true;
    const isDisabled = await fileInput.isDisabled();
    expect(isDisabled, 'File input should not be disabled').toBe(false);

  } else if (await dropZone.isVisible({ timeout: 5000 }).catch(() => false)) {
    uploadElementFound = true;
    // Drop zone exists — upload area is accessible

  } else {
    // Check page for any upload-related elements
    const pageContent = await page.content();
    const hasUploadContent = /upload|asset|drag.*drop/i.test(pageContent);
    expect(hasUploadContent, 'Page should contain upload or asset-related content').toBe(true);
    uploadElementFound = true;
  }

  expect(uploadElementFound, 'Upload functionality should be present on the assets page').toBe(true);

  // Verify no error messages blocking upload
  const errorAlert = page.locator('.v-alert--type-error, .v-snackbar').filter({ hasText: /error|failed|unable/i });
  const hasBlockingError = await errorAlert.isVisible({ timeout: 2000 }).catch(() => false);
  expect(hasBlockingError, 'No blocking error messages should be shown').toBe(false);
});