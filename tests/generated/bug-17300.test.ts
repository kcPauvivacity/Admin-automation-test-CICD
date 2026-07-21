// Bug #17300: [App Editor] Assets - Asset thumbnail shows broken image icon instead of preview
// ADO: https://dev.azure.com/vivacityapp/Viva/_workitems/edit/17300
// Auto-generated 2026-06-15
// REVIEW BEFORE MERGING — verify selectors and assertions

import { test, expect } from '@playwright/test';
import { loginToApp } from '../helpers/auth.helper';

test.setTimeout(120000);

test('BUG #17300 - Asset thumbnail should display image preview instead of broken image icon', async ({ page }) => {
  await loginToApp(page, 90000, 'pau.kie.chee@fusioneta.com', 'PAOpaopao@9696');

  // Navigate to App Editor > Assets
  await page.goto('https://app-staging.vivacityapp.com/demo-student/app-editor', { waitUntil: 'load', timeout: 30000 });
  await page.waitForSelector('.v-application', { timeout: 15000 });
  await page.waitForTimeout(2000);

  // Navigate to Assets section within App Editor
  const assetsLink = page.locator('a, .v-list-item, .v-tab, .v-btn').filter({ hasText: /assets/i }).first();
  await assetsLink.waitFor({ state: 'visible', timeout: 15000 });
  await assetsLink.click();

  // Wait for Assets page/section to load
  await page.waitForSelector('.v-card, [class*="asset"]', { timeout: 20000 });

  // Look for the "logo" asset card in Grid view
  const logoAssetCard = page.locator('.v-card, [class*="asset-card"], [class*="asset"]').filter({ hasText: /logo/i }).first();
  await logoAssetCard.waitFor({ state: 'visible', timeout: 15000 });

  // Find the thumbnail image within the logo asset card
  const thumbnailImg = logoAssetCard.locator('img').first();
  await thumbnailImg.waitFor({ state: 'visible', timeout: 15000 });

  // Verify the image has a valid src attribute (not empty or placeholder)
  const imgSrc = await thumbnailImg.getAttribute('src');
  expect(imgSrc).toBeTruthy();
  expect(imgSrc).not.toBe('');
  expect(imgSrc).not.toMatch(/^data:image\/gif/); // common broken image placeholder

  // Verify the image has loaded successfully (naturalWidth > 0 means image loaded)
  const isImageLoaded = await thumbnailImg.evaluate((img: HTMLImageElement) => {
    return img.complete && img.naturalWidth > 0 && img.naturalHeight > 0;
  });

  expect(isImageLoaded).toBe(true);

  // Additionally verify the IMG badge is present (as mentioned in bug context)
  const imgBadge = logoAssetCard.locator('.v-chip, .v-badge, [class*="badge"], [class*="type"]').filter({ hasText: /img/i }).first();
  await expect(imgBadge).toBeVisible();

  // Verify no broken image indicator (alt text shown as fallback) is visible in an unexpected way
  // The image should not have naturalWidth of 0 which indicates broken image
  const naturalWidth = await thumbnailImg.evaluate((img: HTMLImageElement) => img.naturalWidth);
  expect(naturalWidth).toBeGreaterThan(0);
});