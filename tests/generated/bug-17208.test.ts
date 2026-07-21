// Bug #17208: [App Editor] Assets - Table view missing SIZE and LAST MODIFIED columns
// ADO: https://dev.azure.com/vivacityapp/Viva/_workitems/edit/17208
// Auto-generated 2026-06-11
// REVIEW BEFORE MERGING — verify selectors and assertions

import { test, expect } from '@playwright/test';
import { loginToApp } from '../helpers/auth.helper';

test.setTimeout(120000);

test('Bug #17208 - Assets table view should show NAME, TYPE, SIZE and LAST MODIFIED columns', async ({ page }) => {
  await loginToApp(page, 90000, 'pau.kie.chee@fusioneta.com', 'PAOpaopao@9696');

  // Navigate to App Editor
  await page.goto('https://app-staging.vivacityapp.com/demo-student/app-editor', { waitUntil: 'load', timeout: 30000 });
  await page.waitForSelector('.v-application', { timeout: 15000 });
  await page.waitForTimeout(2000);

  // Wait for App Editor to load and find a Mini Program to open
  await page.waitForSelector('.v-application', { timeout: 15000 });

  // Look for a mini program item to click
  const miniProgram = page.locator('.v-card, .program-item, [class*="mini-program"], .v-list-item').first();
  await miniProgram.waitFor({ timeout: 20000 });
  await miniProgram.click();

  // Navigate to Assets tab/section
  const assetsTab = page.locator('a, .v-tab, .v-list-item, button').filter({ hasText: /assets/i }).first();
  await assetsTab.waitFor({ timeout: 20000 });
  await assetsTab.click();

  // Wait for Assets section to load
  await page.waitForSelector('.v-application', { timeout: 10000 });

  // Switch to Table view - look for table view toggle button
  const tableViewButton = page.locator('button, .v-btn, [class*="view-toggle"], .v-icon').filter({ hasText: /table/i }).first();
  
  // Try icon-based table view toggle if text-based not found
  const tableViewIcon = page.locator('[aria-label*="table" i], [title*="table" i], .mdi-table, .mdi-format-list-bulleted, [class*="table-view"]').first();
  
  try {
    await tableViewButton.waitFor({ timeout: 10000 });
    await tableViewButton.click();
  } catch {
    await tableViewIcon.waitFor({ timeout: 10000 });
    await tableViewIcon.click();
  }

  // Wait for table to render
  await page.waitForSelector('table, .v-data-table, [class*="data-table"]', { timeout: 15000 });

  // Get all column headers from the table
  const tableHeaders = page.locator('table th, .v-data-table th, .v-data-table-header th, [class*="data-table"] th');
  await tableHeaders.first().waitFor({ timeout: 10000 });

  const headerTexts = await tableHeaders.allTextContents();
  const normalizedHeaders = headerTexts.map(h => h.trim().toUpperCase());

  // Assert that NAME column is present
  const hasName = normalizedHeaders.some(h => h.includes('NAME'));
  expect(hasName, `Expected NAME column but found headers: ${normalizedHeaders.join(', ')}`).toBe(true);

  // Assert that TYPE column is present
  const hasType = normalizedHeaders.some(h => h.includes('TYPE'));
  expect(hasType, `Expected TYPE column but found headers: ${normalizedHeaders.join(', ')}`).toBe(true);

  // Assert that SIZE column is present - this will FAIL when bug is present
  const hasSize = normalizedHeaders.some(h => h.includes('SIZE'));
  expect(hasSize, `Expected SIZE column but found headers: ${normalizedHeaders.join(', ')}`).toBe(true);

  // Assert that LAST MODIFIED column is present - this will FAIL when bug is present
  const hasLastModified = normalizedHeaders.some(h => h.includes('MODIFIED') || h.includes('LAST MODIFIED') || h.includes('DATE'));
  expect(hasLastModified, `Expected LAST MODIFIED column but found headers: ${normalizedHeaders.join(', ')}`).toBe(true);

  // Verify total column count is at least 4
  const relevantHeaders = normalizedHeaders.filter(h => h.trim().length > 0);
  expect(
    relevantHeaders.length,
    `Expected at least 4 columns (NAME, TYPE, SIZE, LAST MODIFIED) but found ${relevantHeaders.length}: ${relevantHeaders.join(', ')}`
  ).toBeGreaterThanOrEqual(4);
});