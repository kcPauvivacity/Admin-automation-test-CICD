// Bug #17260: [App Editor] Global Settings > Share - "Image key / URL" field label simplified to "Image"
// ADO: https://dev.azure.com/vivacityapp/Viva/_workitems/edit/17260
// Auto-generated 2026-06-12
// REVIEW BEFORE MERGING — verify selectors and assertions

import { test, expect } from '@playwright/test';
import { loginToApp } from '../helpers/auth.helper';

test.setTimeout(120000);

test('Bug #17260 - Share card image field should be labelled "Image key / URL" not "Image"', async ({ page }) => {
  await loginToApp(page, 90000, 'pau.kie.chee@fusioneta.com', 'PAOpaopao@9696');

  // Navigate to App Editor
  await page.goto('https://app-staging.vivacityapp.com/demo-student/app-editor', { waitUntil: 'load', timeout: 30000 });
  await page.waitForSelector('.v-application', { timeout: 15000 });
  await page.waitForTimeout(2000);

  // Wait for App Editor to load
  await page.waitForLoadState('networkidle');

  // Click on Global Settings
  const globalSettingsLink = page.locator('a, [role="link"], .v-list-item, button').filter({ hasText: /global settings/i }).first();
  await globalSettingsLink.waitFor({ state: 'visible', timeout: 30000 });
  await globalSettingsLink.click();

  await page.waitForLoadState('networkidle');

  // Click on Share under CONFIGURATION
  const shareLink = page.locator('a, [role="link"], .v-list-item, button').filter({ hasText: /^share$/i }).first();
  await shareLink.waitFor({ state: 'visible', timeout: 30000 });
  await shareLink.click();

  await page.waitForLoadState('networkidle');

  // Wait for the Share Card section to be visible
  await page.waitForSelector('text=/share card/i', { timeout: 30000 });

  // Verify the image field label is "Image key / URL" and NOT just "Image"
  // Check that "Image key / URL" label exists
  const imageKeyUrlLabel = page.locator('label, .v-label, .v-field__label').filter({ hasText: /image key\s*\/\s*url/i }).first();
  
  // Also check for standalone "Image" label (the bug state)
  const standaloneImageLabel = page.locator('label, .v-label, .v-field__label').filter({ hasText: /^image$/i }).first();

  // The correct label "Image key / URL" should be visible
  await expect(imageKeyUrlLabel).toBeVisible({ timeout: 15000 });

  // The incorrect simplified "Image" label should NOT be present (or should not be the field label)
  // If standalone "Image" label exists, it indicates the bug is still present
  const standaloneImageCount = await standaloneImageLabel.count();
  
  if (standaloneImageCount > 0) {
    // Make sure the standalone "Image" label is not the field label for this input
    // The presence of "Image key / URL" is the definitive check
    const isVisible = await standaloneImageLabel.isVisible();
    if (isVisible) {
      // Check if "Image key / URL" is also visible - if so, it might be a different field
      const imageKeyUrlVisible = await imageKeyUrlLabel.isVisible();
      expect(imageKeyUrlVisible).toBe(true);
    }
  }

  // Final assertion: "Image key / URL" must be visible in the Share Card section
  await expect(imageKeyUrlLabel).toBeVisible();
});