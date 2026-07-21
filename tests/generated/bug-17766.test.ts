// Bug #17766: [Properties] Missing expandable hierarchical rows (parent/child units)
// ADO: https://dev.azure.com/vivacityapp/Viva/_workitems/edit/17766
// Auto-generated 2026-07-16
// REVIEW BEFORE MERGING — verify selectors and assertions

import { test, expect } from '@playwright/test';
import { loginToApp } from '../helpers/auth.helper';

test.setTimeout(120000);

test('BUG #17766 - Properties table should support expandable hierarchical rows (parent/child units)', async ({ page }) => {
  await loginToApp(page);

  // Navigate to Properties page
  await page.goto('https://app-staging.vivacityapp.com');

  // Look for Properties link in navigation
  const propertiesNavItem = page.locator('a, .v-list-item, .v-btn').filter({ hasText: /properties/i }).first();
  await propertiesNavItem.waitFor({ state: 'visible', timeout: 30000 });
  await propertiesNavItem.click();

  // Wait for properties table to load
  await page.waitForSelector('.v-data-table, .v-table, [data-testid="properties-table"]', { timeout: 30000 });

  // Wait for table rows to be visible
  const tableRows = page.locator('.v-data-table tbody tr, .v-table tbody tr');
  await tableRows.first().waitFor({ state: 'visible', timeout: 30000 });

  // Check for expand/collapse toggle buttons in the table
  // These are typically represented by expand icons, chevrons, or toggle buttons
  const expandToggle = page.locator(
    '.v-data-table__expand-icon, ' +
    '[data-testid="expand-row"], ' +
    '.expand-icon, ' +
    '.v-icon--expand, ' +
    'button.v-btn--icon .mdi-chevron-right, ' +
    'button.v-btn--icon .mdi-chevron-down, ' +
    '.mdi-chevron-right, ' +
    '.mdi-unfold-more-horizontal, ' +
    '[aria-label*="expand"], ' +
    'td button[aria-expanded]'
  ).first();

  // The bug: expand toggles should exist but don't (flat rows only)
  // This assertion FAILS when bug is present (no expand toggles found)
  // and PASSES when fixed (expand toggles are present)
  await expect(expandToggle).toBeVisible({ timeout: 15000 });

  // Additionally verify that clicking an expand toggle reveals child rows
  await expandToggle.click();

  // After clicking expand, there should be child/sub rows visible
  const childRows = page.locator(
    '.v-data-table__expanded__content tr, ' +
    'tr.child-row, ' +
    'tr[class*="child"], ' +
    'tr[class*="unit"], ' +
    'tr[data-depth="1"], ' +
    '.v-data-table tbody tr.expanded-row, ' +
    '[data-testid="child-row"]'
  );

  // Wait a moment for expand animation
  await page.waitForTimeout(1000);

  // Verify child rows are now visible after expanding
  const childRowCount = await childRows.count();

  // FAILS if bug is present (no child rows revealed), PASSES when fixed
  expect(childRowCount).toBeGreaterThan(0);

  // Verify the expanded row contains unit information
  const firstChildRow = childRows.first();
  await expect(firstChildRow).toBeVisible();

  // Collapse the row to restore state
  await expandToggle.click();
  await page.waitForTimeout(500);
});

test('BUG #17766 - Properties table expand icon column should be present in table header/structure', async ({ page }) => {
  await loginToApp(page);

  // Navigate to Properties page
  await page.goto('https://app-staging.vivacityapp.com');

  const propertiesNavItem = page.locator('a, .v-list-item, .v-btn').filter({ hasText: /properties/i }).first();
  await propertiesNavItem.waitFor({ state: 'visible', timeout: 30000 });
  await propertiesNavItem.click();

  // Wait for properties table to load
  await page.waitForSelector('.v-data-table, .v-table, [data-testid="properties-table"]', { timeout: 30000 });

  // Wait for content to stabilize
  await page.locator('.v-data-table tbody tr, .v-table tbody tr').first().waitFor({ state: 'visible', timeout: 30000 });

  // Check that the table has an expand column (usually a small column before data columns)
  // Vuetify's data table with expand slots adds a specific class or structure
  const expandColumn = page.locator(
    'th.v-data-table__th--expand, ' +
    'col.expand-col, ' +
    '[data-testid="expand-column"], ' +
    '.v-data-table-column--expand, ' +
    'th:has(.v-data-table__expand-icon)'
  );

  // Verify at least one row has hierarchical expand capability
  const anyExpandButton = page.locator(
    '.v-data-table tbody tr td button .mdi-chevron-right, ' +
    '.v-data-table tbody tr td button .mdi-chevron-down, ' +
    '.v-data-table tbody tr td .v-data-table__expand-icon, ' +
    '.v-data-table tbody tr td [aria-expanded]'
  );

  // Check if either expand column header or expand buttons exist
  const expandColumnCount = await expandColumn.count();
  const expandButtonCount = await anyExpandButton.count();

  // FAILS when bug is present (both counts are 0), PASSES when fixed
  expect(expandColumnCount + expandButtonCount).toBeGreaterThan(0);
});