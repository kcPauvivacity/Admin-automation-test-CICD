// Bug #16936: [Quintain Living] Portal loading slow / failing when accessing Properties tab
// ADO: https://dev.azure.com/vivacityapp/Viva/_workitems/edit/16936
// Auto-generated 2026-05-29
// REVIEW BEFORE MERGING — verify selectors and assertions

import { test, expect } from '@playwright/test';
import { loginToApp } from '../helpers/auth.helper';

test.setTimeout(120000);

test('BUG #16936 - Properties tab loads within acceptable time for Quintain Living user', async ({ page }) => {
  await loginToApp(page);

  // Navigate to Properties tab
  await page.goto('https://app-staging.vivacityapp.com');

  // Wait for the app to be ready
  await page.waitForSelector('.v-application', { timeout: 30000 });

  // Look for Properties navigation item and click it
  const propertiesNav = page.locator('text=Properties').first();
  await propertiesNav.waitFor({ state: 'visible', timeout: 15000 });

  const navigationStart = Date.now();
  await propertiesNav.click();

  // Wait for the Properties tab content to be visible
  // The bug manifests as slow loading or failure - we check it loads within reasonable time
  await page.waitForURL(/.*propert.*/i, { timeout: 30000 }).catch(async () => {
    // URL might not change, so also try waiting for content
  });

  // Wait for data table to be visible - this is specifically mentioned as slow in the bug
  const dataTable = page.locator('.v-data-table, [data-testid="properties-table"], .v-table').first();

  await expect(dataTable).toBeVisible({ timeout: 30000 });

  const loadTime = Date.now() - navigationStart;

  // Properties tab should load within 15 seconds - if it takes longer, the bug is present
  expect(loadTime).toBeLessThan(15000);

  // Ensure no loading spinner is still visible (indicating failed/stuck load)
  const loadingSpinner = page.locator('.v-progress-circular, .v-progress-linear[aria-valuenow]').first();
  const isStillLoading = await loadingSpinner.isVisible().catch(() => false);
  expect(isStillLoading).toBe(false);

  // Verify the data table has actually loaded content (rows or a no-data message)
  const tableContent = page.locator(
    '.v-data-table tbody tr, .v-table tbody tr, [data-testid="no-data-text"], .v-data-table__empty-wrapper'
  ).first();
  await expect(tableContent).toBeVisible({ timeout: 10000 });
});

test('BUG #16936 - Properties tab pricing page loads without failure', async ({ page }) => {
  await loginToApp(page);

  await page.goto('https://app-staging.vivacityapp.com');

  await page.waitForSelector('.v-application', { timeout: 30000 });

  // Navigate directly to properties URL patterns if available
  const currentUrl = page.url();

  // Try to navigate to properties section
  const propertiesLink = page.locator('a, .v-list-item').filter({ hasText: /properties/i }).first();

  await propertiesLink.waitFor({ state: 'visible', timeout: 15000 });
  await propertiesLink.click();

  // Verify page doesn't show an error state
  const errorIndicators = page.locator(
    '[data-testid="error-message"], .error-page, text=Failed to load, text=Error loading'
  );

  // Wait a moment to see if error appears
  await page.waitForTimeout(3000);

  const errorVisible = await errorIndicators.isVisible().catch(() => false);
  expect(errorVisible).toBe(false);

  // Verify main content area is visible
  const mainContent = page.locator('.v-main, main, [data-testid="properties-content"]').first();
  await expect(mainContent).toBeVisible({ timeout: 10000 });

  // Check for any network errors by verifying API responses
  let apiFailureDetected = false;
  page.on('response', (response) => {
    if (response.url().includes('/properties') && response.status() >= 500) {
      apiFailureDetected = true;
    }
  });

  // Reload to capture fresh network activity
  const reloadStart = Date.now();
  await page.reload({ timeout: 30000 });

  await page.waitForSelector('.v-application', { timeout: 30000 });

  const reloadTime = Date.now() - reloadStart;

  // Page reload should complete within 20 seconds
  expect(reloadTime).toBeLessThan(20000);

  // No server errors should have occurred
  expect(apiFailureDetected).toBe(false);
});