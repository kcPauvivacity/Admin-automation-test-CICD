// Bug #17765: [Properties] Missing property thumbnail images in table
// ADO: https://dev.azure.com/vivacityapp/Viva/_workitems/edit/17765
// Auto-generated 2026-07-16
// REVIEW BEFORE MERGING — verify selectors and assertions

import { test, expect } from '@playwright/test';
import { loginToApp } from '../helpers/auth.helper';

test.setTimeout(120000);

test('BUG #17765 - Properties table should display thumbnail images next to property names', async ({ page }) => {
  await loginToApp(page);

  // Navigate to the Properties page
  await page.goto('https://app-staging.vivacityapp.com');

  // Wait for the app to load
  await page.waitForSelector('.v-application', { timeout: 30000 });

  // Look for a Properties link/menu item in the navigation
  const propertiesLink = page.locator('text=Properties').first();
  await propertiesLink.waitFor({ state: 'visible', timeout: 20000 });
  await propertiesLink.click();

  // Wait for the properties table to load
  await page.waitForSelector('.v-data-table, [class*="v-table"]', { timeout: 20000 });

  // Wait for table rows to be populated
  const tableRows = page.locator('.v-data-table tbody tr, [class*="v-table"] tbody tr');
  await tableRows.first().waitFor({ state: 'visible', timeout: 20000 });

  // Find the Name column cells in the table
  // The Name column should contain both an image (thumbnail) and text
  const nameCells = page.locator('.v-data-table tbody tr td:first-child, [class*="v-table"] tbody tr td:first-child');
  const firstNameCell = nameCells.first();
  await firstNameCell.waitFor({ state: 'visible', timeout: 10000 });

  // Check that thumbnail images exist within the name column cells
  // Images should be present as img elements or v-img components
  const thumbnailImages = page.locator(
    '.v-data-table tbody tr td img, [class*="v-table"] tbody tr td img, ' +
    '.v-data-table tbody tr td .v-img, [class*="v-table"] tbody tr td .v-img, ' +
    '.v-data-table tbody tr td [class*="thumbnail"], [class*="v-table"] tbody tr td [class*="thumbnail"]'
  );

  // Verify that at least one thumbnail image is visible in the table
  const imageCount = await thumbnailImages.count();

  // The test should FAIL if no images are present (bug present)
  // and PASS when images are shown (bug fixed)
  expect(imageCount).toBeGreaterThan(0);

  // Additionally verify the first visible image is actually rendered
  if (imageCount > 0) {
    await expect(thumbnailImages.first()).toBeVisible();
  }
});

test('BUG #17765 - Properties table Name column should contain img elements for thumbnails', async ({ page }) => {
  await loginToApp(page);

  await page.goto('https://app-staging.vivacityapp.com');

  await page.waitForSelector('.v-application', { timeout: 30000 });

  // Try multiple possible navigation paths to Properties
  let navigated = false;

  // Try sidebar/nav menu
  const navItems = [
    page.locator('[href*="propert"]').first(),
    page.locator('a:has-text("Properties")').first(),
    page.locator('.v-list-item:has-text("Properties")').first(),
    page.locator('[class*="nav"]:has-text("Properties")').first(),
  ];

  for (const navItem of navItems) {
    const isVisible = await navItem.isVisible().catch(() => false);
    if (isVisible) {
      await navItem.click();
      navigated = true;
      break;
    }
  }

  if (!navigated) {
    // Try direct URL navigation
    await page.goto('https://app-staging.vivacityapp.com/demo-student/properties');
  }

  // Wait for the table to appear
  await page.waitForSelector('table, .v-data-table, [class*="v-table"]', { timeout: 20000 });

  // Allow time for data to load
  await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => {});

  // Count rows to ensure data is loaded
  const rows = page.locator('tbody tr');
  await rows.first().waitFor({ state: 'visible', timeout: 15000 });

  const rowCount = await rows.count();
  expect(rowCount).toBeGreaterThan(0);

  // Check for images within table cells (thumbnails in Name column)
  const cellImages = page.locator('tbody tr td img');
  const vImgElements = page.locator('tbody tr td .v-img__img, tbody tr td .v-responsive');

  const imgCount = await cellImages.count();
  const vImgCount = await vImgElements.count();

  const totalImageElements = imgCount + vImgCount;

  // Bug is present when totalImageElements === 0 (no thumbnails shown)
  // Test PASSES when images are present (bug fixed)
  expect(totalImageElements).toBeGreaterThan(0);
});