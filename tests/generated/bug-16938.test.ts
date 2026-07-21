// Bug #16938: [Admin] University feature search not working — cannot search existing universities
// ADO: https://dev.azure.com/vivacityapp/Viva/_workitems/edit/16938
// Auto-generated 2026-05-29
// REVIEW BEFORE MERGING — verify selectors and assertions

import { test, expect } from '@playwright/test';
import { loginToApp } from '../helpers/auth.helper';

test.setTimeout(120000);

test('BUG #16938 - University feature search returns results for existing universities', async ({ page }) => {
  await loginToApp(page, 120000, 'pau.kie.chee@fusioneta.com', 'PAOpaopao@9696');

  // Navigate to system settings / university feature
  await page.goto('https://app-staging.vivacityapp.com/system-settings/university');
  await page.waitForSelector('.v-application', { timeout: 30000 });

  // Wait for the university page to load
  await expect(page.locator('h1, h2, .page-title, [class*="title"]').filter({ hasText: /university/i }).first()).toBeVisible({ timeout: 20000 });

  // Look for the search input field
  const searchInput = page.locator('input[type="text"], input[placeholder*="search" i], input[placeholder*="Search" i], .v-text-field input').first();
  await expect(searchInput).toBeVisible({ timeout: 15000 });

  // Type a common/generic search term that should return results
  await searchInput.click();
  await searchInput.fill('University');
  await page.waitForTimeout(1500); // wait for debounce/API call

  // Wait for results to appear - look for list items, rows, or result cards
  const resultSelectors = [
    '.v-list-item',
    '.v-data-table tbody tr',
    '[class*="university-item"]',
    '[class*="result"]',
    '.v-autocomplete__content .v-list-item',
    '.v-combobox__content .v-list-item',
  ];

  let resultsFound = false;
  for (const selector of resultSelectors) {
    const count = await page.locator(selector).count();
    if (count > 0) {
      resultsFound = true;
      break;
    }
  }

  // If no results found via the selectors above, check more broadly
  if (!resultsFound) {
    // Try a more specific search - look for any university name
    await searchInput.clear();
    await searchInput.fill('MIT');
    await page.waitForTimeout(2000);

    for (const selector of resultSelectors) {
      const count = await page.locator(selector).count();
      if (count > 0) {
        resultsFound = true;
        break;
      }
    }
  }

  // The bug causes no results to be returned - this assertion should FAIL when bug is present
  expect(resultsFound).toBe(true);
});

test('BUG #16938 - University search input is functional and returns DB results', async ({ page }) => {
  await loginToApp(page, 120000, 'pau.kie.chee@fusioneta.com', 'PAOpaopao@9696');

  await page.goto('https://app-staging.vivacityapp.com/system-settings/university');
  await page.waitForSelector('.v-application', { timeout: 30000 });

  // Wait for page content
  await page.waitForLoadState('networkidle', { timeout: 30000 });

  // Find search field - could be a text field, autocomplete, or combobox
  const searchField = page.locator([
    'input[placeholder*="search" i]',
    'input[placeholder*="university" i]',
    '.v-autocomplete input',
    '.v-combobox input',
    '.v-text-field input',
  ].join(', ')).first();

  await expect(searchField).toBeVisible({ timeout: 15000 });

  // Intercept the search API call to verify it's being made and returns data
  const searchResponsePromise = page.waitForResponse(
    (response) =>
      response.url().includes('university') &&
      response.request().method() === 'GET' &&
      response.status() === 200,
    { timeout: 10000 }
  ).catch(() => null);

  await searchField.click();
  await searchField.fill('University of');

  const searchResponse = await searchResponsePromise;

  // If API response is captured, verify it contains data
  if (searchResponse) {
    let responseBody: unknown;
    try {
      responseBody = await searchResponse.json();
    } catch {
      responseBody = null;
    }

    // Verify the response has data (not empty)
    if (Array.isArray(responseBody)) {
      expect(responseBody.length).toBeGreaterThan(0);
    } else if (responseBody && typeof responseBody === 'object') {
      const data = (responseBody as Record<string, unknown>).data || (responseBody as Record<string, unknown>).results || (responseBody as Record<string, unknown>).items;
      if (Array.isArray(data)) {
        expect(data.length).toBeGreaterThan(0);
      }
    }
  }

  // Wait for dropdown/results to appear
  await page.waitForTimeout(2000);

  // Check that dropdown results are visible
  const dropdownResults = page.locator([
    '.v-autocomplete__content .v-list-item',
    '.v-combobox__content .v-list-item',
    '.v-menu__content .v-list-item',
    '.v-overlay--active .v-list-item',
    '[role="option"]',
    '[role="listbox"] [role="option"]',
  ].join(', '));

  const resultCount = await dropdownResults.count();

  // Bug is present when no results are shown - this FAILS with bug, PASSES when fixed
  expect(resultCount).toBeGreaterThan(0);
});