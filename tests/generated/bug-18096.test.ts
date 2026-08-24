// Bug #18096: [Admin] Settings > Universities search does not filter results
// ADO: https://dev.azure.com/vivacityapp/Viva/_workitems/edit/18096
// Auto-generated 2026-08-11
// REVIEW BEFORE MERGING — verify selectors and assertions

import { test, expect } from '@playwright/test';
import { loginToApp } from '../helpers/auth.helper';

test.setTimeout(120000);

test('BUG #18096: Universities search filters table results', async ({ page }) => {
  await loginToApp(page);

  await page.goto('https://app-staging.vivacityapp.com/demo-student/settings/universities');

  // Wait for the universities table to load
  await page.waitForSelector('.v-data-table', { timeout: 30000 });

  // Wait for rows to be visible
  await page.waitForSelector('.v-data-table tbody tr', { timeout: 30000 });

  // Count initial rows
  const initialRows = await page.locator('.v-data-table tbody tr').count();
  expect(initialRows).toBeGreaterThan(0);

  // Find the search input
  const searchInput = page.locator('input[type="text"]').first();
  await searchInput.waitFor({ state: 'visible', timeout: 15000 });

  // Try a more specific search input selector if the first doesn't work
  const searchBox = page.locator('[placeholder*="Search"], [placeholder*="search"], input.v-field__input').first();

  // Type a nonsense value that should match no records
  const nonsenseValue = 'zzz-no-such-record-12345';

  // Use the search input - try multiple selectors
  const searchInputLocator = page.locator('input').filter({ hasText: '' }).first();

  // Find search field more reliably
  const searchField = page.locator('.v-text-field input, input[type="text"]').first();
  await searchField.waitFor({ state: 'visible', timeout: 15000 });
  await searchField.click();
  await searchField.fill(nonsenseValue);

  // Wait for the table to react to the search
  await page.waitForTimeout(1500);

  // After filtering, rows should be reduced to 0 or show empty state
  const filteredRows = await page.locator('.v-data-table tbody tr').count();

  // Check for empty state text as an alternative
  const emptyStateVisible = await page.locator(
    '.v-data-table__empty-wrapper, [class*="empty"], td:has-text("No data"), td:has-text("No results"), td:has-text("no matching")'
  ).isVisible().catch(() => false);

  // Bug is present if rows remain the same as initial count after nonsense search
  // Test FAILS when bug is present (all rows still showing), PASSES when fixed (0 rows or empty state)
  const searchIsWorking = filteredRows === 0 || emptyStateVisible || filteredRows < initialRows;

  expect(searchIsWorking).toBe(true);

  // Restore state: clear the search input
  await searchField.clear();
  await page.waitForTimeout(1000);

  // Verify table is restored
  const restoredRows = await page.locator('.v-data-table tbody tr').count();
  expect(restoredRows).toBe(initialRows);
});