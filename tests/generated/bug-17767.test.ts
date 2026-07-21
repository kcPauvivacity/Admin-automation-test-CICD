// Bug #17767: [Properties] Missing 'Status' column (Renting / Sold Out)
// ADO: https://dev.azure.com/vivacityapp/Viva/_workitems/edit/17767
// Auto-generated 2026-07-16
// REVIEW BEFORE MERGING — verify selectors and assertions

import { test, expect } from '@playwright/test';
import { loginToApp } from '../helpers/auth.helper';

test.setTimeout(120000);

test('BUG #17767 - Properties table should have a Status column', async ({ page }) => {
  await loginToApp(page);

  // Navigate to Properties page
  await page.goto('https://app-staging.vivacityapp.com');

  // Wait for the app to load
  await page.waitForSelector('.v-application', { timeout: 30000 });

  // Look for Properties navigation link and click it
  const propertiesLink = page.locator('a, .v-list-item, .v-btn').filter({ hasText: /properties/i }).first();
  await propertiesLink.waitFor({ state: 'visible', timeout: 20000 });
  await propertiesLink.click();

  // Wait for the properties table to load
  await page.waitForSelector('.v-data-table, table', { timeout: 30000 });

  // Check that the Status column header is present in the table
  const tableHeaders = page.locator('.v-data-table th, table th, .v-data-table-header th');

  // Wait for headers to be visible
  await tableHeaders.first().waitFor({ state: 'visible', timeout: 20000 });

  // Find the Status column header
  const statusHeader = page.locator(
    '.v-data-table th, table th, .v-data-table-header th'
  ).filter({ hasText: /^status$/i });

  // Also check for broader header text match
  const allHeaderTexts = await page.locator('.v-data-table th, table th, .v-data-table-header th').allTextContents();
  
  console.log('Found table headers:', allHeaderTexts);

  // Verify Status column exists - this FAILS when bug is present, PASSES when fixed
  const statusColumnCount = allHeaderTexts.filter(text => /status/i.test(text.trim())).length;
  
  expect(
    statusColumnCount,
    `Expected a "Status" column in the Properties table, but found headers: [${allHeaderTexts.join(', ')}]`
  ).toBeGreaterThan(0);

  // Additionally verify expected columns are present to confirm we're on the right page
  const hasStagesOrFeatured = allHeaderTexts.some(text => /stages|featured|type|city/i.test(text.trim()));
  expect(hasStagesOrFeatured, 'Should be on the Properties table page with expected columns').toBe(true);

  // Verify Status column shows relevant values (Renting / Sold Out) in table rows
  const statusCells = page.locator('.v-data-table td, table td').filter({ hasText: /renting|sold out/i });
  const statusCellCount = await statusCells.count();
  
  console.log(`Found ${statusCellCount} cells with status values (Renting/Sold Out)`);
  
  // If there are rows in the table, at least some should have status values
  const tableRows = await page.locator('.v-data-table tbody tr, table tbody tr').count();
  if (tableRows > 0) {
    expect(
      statusCellCount,
      `Properties table has ${tableRows} rows but no cells showing "Renting" or "Sold Out" status values`
    ).toBeGreaterThan(0);
  }
});