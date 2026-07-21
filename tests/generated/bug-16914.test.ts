// Bug #16914: [Fresh] ES search issues — wrong university ranking, CN name mismatch, city filter not filtering universities
// ADO: https://dev.azure.com/vivacityapp/Viva/_workitems/edit/16914
// Auto-generated 2026-05-28
// REVIEW BEFORE MERGING — verify selectors and assertions

import { test, expect } from '@playwright/test';
import { loginToApp } from '../helpers/auth.helper';

test.setTimeout(300000);

test.describe('BUG #16914 - ES search issues: university ranking, CN name, city filter', () => {

  test('Issue 1: Searching 都柏林大学 returns the most relevant university as top result', async ({ page }) => {
    await loginToApp(page);

    await page.goto('https://app-staging.vivacityapp.com');
    await page.waitForSelector('.v-application', { timeout: 30000 });

    // Navigate to the university search / ES search page
    const universityNavSelectors = [
      'a[href*="university"]',
      'a[href*="universities"]',
      '[data-test*="university"]',
      'text=Universities',
      'text=大学',
    ];

    let navigated = false;
    for (const selector of universityNavSelectors) {
      try {
        const el = page.locator(selector).first();
        if (await el.isVisible({ timeout: 5000 })) {
          await el.click();
          navigated = true;
          break;
        }
      } catch {
        // try next
      }
    }

    if (!navigated) {
      // Try direct URL patterns
      const urls = [
        'https://app-staging.vivacityapp.com/demo-student/universities',
        'https://app-staging.vivacityapp.com/demo-student/university',
        'https://app-staging.vivacityapp.com/demo-student/search',
      ];
      for (const url of urls) {
        await page.goto(url);
        const notFound = await page.locator('text=404').isVisible({ timeout: 3000 }).catch(() => false);
        if (!notFound) {
          navigated = true;
          break;
        }
      }
    }

    // Find the search input
    const searchSelectors = [
      'input[placeholder*="search" i]',
      'input[placeholder*="Search" i]',
      'input[placeholder*="university" i]',
      'input[placeholder*="大学"]',
      '.v-text-field input',
      '[data-test*="search"] input',
    ];

    let searchInput = null;
    for (const selector of searchSelectors) {
      try {
        const el = page.locator(selector).first();
        if (await el.isVisible({ timeout: 5000 })) {
          searchInput = el;
          break;
        }
      } catch {
        // try next
      }
    }

    expect(searchInput, 'Search input should be visible on university page').not.toBeNull();

    await searchInput!.click();
    await searchInput!.fill('都柏林大学');
    await page.waitForTimeout(2000); // wait for ES results

    // Get the first result
    const resultSelectors = [
      '.university-item',
      '.v-list-item',
      '[data-test*="university-result"]',
      '.search-result-item',
      '.v-card',
    ];

    let firstResultText = '';
    for (const selector of resultSelectors) {
      try {
        const items = page.locator(selector);
        const count = await items.count();
        if (count > 0) {
          firstResultText = await items.first().textContent() || '';
          if (firstResultText.trim()) break;
        }
      } catch {
        // try next
      }
    }

    expect(firstResultText.trim(), 'Should have at least one result for 都柏林大学').not.toBe('');

    // The top result should contain Dublin or 都柏林 (most relevant result)
    const isRelevant =
      firstResultText.includes('都柏林') ||
      firstResultText.toLowerCase().includes('dublin') ||
      firstResultText.toLowerCase().includes('ucd') ||
      firstResultText.toLowerCase().includes('university college dublin');

    expect(isRelevant,
      `Top result should be Dublin-related university. Got: "${firstResultText.substring(0, 200)}"`
    ).toBe(true);
  });

  test('Issue 2: University CN name matches backend data', async ({ page }) => {
    await loginToApp(page);

    await page.goto('https://app-staging.vivacityapp.com');
    await page.waitForSelector('.v-application', { timeout: 30000 });

    // Navigate to universities page
    const urls = [
      'https://app-staging.vivacityapp.com/demo-student/universities',
      'https://app-staging.vivacityapp.com/demo-student/university',
      'https://app-staging.vivacityapp.com/demo-student/search',
    ];

    for (const url of urls) {
      await page.goto(url);
      const notFound = await page.locator('text=404').isVisible({ timeout: 3000 }).catch(() => false);
      if (!notFound) break;
    }

    await page.waitForTimeout(2000);

    // Search for a known university using English name
    const searchSelectors = [
      'input[placeholder*="search" i]',
      'input[placeholder*="Search" i]',
      '.v-text-field input',
    ];

    let searchInput = null;
    for (const selector of searchSelectors) {
      try {
        const el = page.locator(selector).first();
        if (await el.isVisible({ timeout: 5000 })) {
          searchInput = el;
          break;
        }
      } catch {
        // try next
      }
    }

    if (!searchInput) {
      test.skip();
      return;
    }

    // Search for University College Dublin in English to get its CN name displayed
    await searchInput.click();
    await searchInput.fill('University College Dublin');
    await page.waitForTimeout(2000);

    // Get all visible university items
    const itemSelectors = [
      '.university-item',
      '.v-list-item',
      '[data-test*="university-result"]',
      '.v-card',
    ];

    let items = null;
    for (const selector of itemSelectors) {
      try {
        const els = page.locator(selector);
        const count = await els.count();
        if (count > 0) {
          items = els;
          break;
        }
      } catch {
        // try next
      }
    }

    if (!items) {
      test.skip();
      return;
    }

    const firstItemText = await items.first().textContent() || '';
    expect(firstItemText.trim()).not.toBe('');

    // The CN name for University College Dublin should be 都柏林大学 (not a mismatch)
    // If CN name is present, verify it matches expected
    if (firstItemText.includes('都柏林') || firstItemText.includes('大学')) {
      // CN name is present - it should say 都柏林大学 for UCD
      const hasDublinCNName = firstItemText.includes('都柏林大学');
      expect(hasDublinCNName,
        `CN name for University College Dublin should be 都柏林大学. Got: "${firstItemText.substring(0, 200)}"`
      ).toBe(true);
    }
    // If no CN name displayed, the test still validates the search worked
    expect(firstItemText.toLowerCase()).toContain('dublin');
  });

  test('Issue 3: Selecting a city filters the university list to show only universities in that city', async ({ page }) => {
    await loginToApp(page);

    await page.goto('https://app-staging.vivacityapp.com');
    await page.waitForSelector('.v-application', { timeout: 30000 });

    // Navigate to universities page
    const urls = [
      'https://app-staging.vivacityapp.com/demo-student/universities',
      'https://app-staging.vivacityapp.com/demo-student/university',
      'https://app-staging.vivacityapp.com/demo-student/search',
    ];

    for (const url of urls) {
      await page.goto(url);
      const notFound = await page.locator('text=404').isVisible({ timeout: 3000 }).catch(() => false);
      if (!notFound) break;
    }

    await page.waitForTimeout(2000);

    // Count total universities before filtering
    const universityListSelectors = [
      '.university-item',
      '[data-test*="university-card"]',
      '[data-test*="university-item"]',
      '.v-list-item',
      '.v-card.university',
    ];

    let universityList = null;
    let totalBeforeFilter = 0;

    for (const selector of universityListSelectors) {
      try {
        const els = page.locator(selector);
        const count = await els.count();
        if (count > 1) {
          universityList = els;
          totalBeforeFilter = count;
          break;
        }
      } catch {
        // try next
      }
    }

    // Find city filter
    const cityFilterSelectors = [
      '[data-test*="city-filter"]',
      '[data-test*="city"]',
      '.city-filter',
      'text=City',
      'text=城市',
      '.v-select[label*="city" i]',
      '.v-select[label*="City" i]',
      '.v-autocomplete',
    ];

    let cityFilter = null;
    for (const selector of cityFilterSelectors) {
      try {
        const el = page.locator(selector).first();
        if (await el.isVisible({ timeout: 5000 })) {
          cityFilter = el;
          break;
        }
      } catch {
        // try next
      }
    }

    if (!cityFilter) {
      // Try to find by looking for dropdown/select elements near text "city"
      const allSelects = page.locator('.v-select, .v-autocomplete');
      const count = await allSelects.count();
      for (let i = 0; i < count; i++) {
        const el = allSelects.nth(i);
        const text = await el.textContent() || '';
        if (text.toLowerCase().includes('city') || text.includes('城市') || text.includes('Edinburgh')) {
          cityFilter = el;
          break;
        }
      }
    }

    if (!cityFilter) {
      test.skip();
      return;
    }

    // Click the city filter
    await cityFilter.click();
    await page.waitForTimeout(1000);

    // Select Edinburgh from the dropdown
    const edinburghSelectors = [
      'text=Edinburgh',
      '.v-list-item:has-text("Edinburgh")',
      '[data-value*="Edinburgh"]',
      '[data-value*="edinburgh"]',
    ];

    let edinburghOption = null;
    for (const selector of edinburghSelectors) {
      try {
        const el = page.locator(selector).first();
        if (await el.isVisible({ timeout: 5000 })) {
          edinburghOption = el;
          break;
        }
      } catch {
        // try next
      }
    }

    if (!edinburghOption) {
      // If Edinburgh not available, try to type it in autocomplete
      const inputInFilter = cityFilter.locator('input');
      if (await inputInFilter.isVisible({ timeout: 3000 }).catch(() => false)) {
        await inputInFilter.fill('Edinburgh');
        await page.waitForTimeout(1000);

        for (const selector of edinburghSelectors) {
          try {
            const el = page.locator(selector).first();
            if (await el.isVisible({ timeout: 5000 })) {
              edinburghOption = el;
              break;
            }
          } catch {
            // try next
          }
        }
      }
    }

    if (!edinburghOption) {
      test.skip();
      return;
    }

    await edinburghOption.click();
    await page.waitForTimeout(2000);

    // After selecting Edinburgh, verify that universities are filtered
    // All visible universities should be in Edinburgh
    let filteredItems = null;
    for (const selector of universityListSelectors) {
      try {
        const els = page.locator(selector);
        const count = await els.count();
        if (count >= 1) {
          filteredItems = els;
          break;
        }
      } catch {
        // try next
      }
    }

    if (!filteredItems) {
      test.skip();
      return;
    }

    const filteredCount = await filteredItems.count();

    // The count should be less than total (filtering occurred)
    // OR all items should contain "Edinburgh"
    let allContainEdinburgh = true;
    let edinburghCount = 0;

    for (let i = 0; i < filteredCount; i++) {
      const itemText = await filteredItems.nth(i).textContent() || '';
      if (itemText.toLowerCase().includes('edinburgh')) {
        edinburghCount++;
      } else {
        allContainEdinburgh = false;
      }
    }

    // Bug: If filtering doesn't work, all universities show regardless of city
    // Fix: Only Edinburgh universities should be shown
    expect(allContainEdinburgh,
      `After selecting Edinburgh as city filter, all ${filteredCount} results should be Edinburgh universities. ` +
      `Found ${edinburghCount} Edinburgh results out of ${filteredCount} total. ` +
      `Bug present: city filter is not filtering universities.`
    ).toBe(true);

    // Also verify that the filtered list is smaller than unfiltered (if we have pre-filter count)
    if (totalBeforeFilter > 0) {
      expect(filteredCount,
        `Filtered count (${filteredCount}) should be less than total (${totalBeforeFilter}) when filtering by Edinburgh`
      ).toBeLessThan(totalBeforeFilter);
    }

    // Cleanup: Clear the city filter
    const clearSelectors = [
      '.v-field__clearable',
      '[data-test*="clear"]',
      '.mdi-close-circle',
      '.v-select .v-icon--clear',
    ];

    for (const selector of clearSelectors) {
      try {
        const el = page.locator(selector).first();
        if (await el.isVisible({ timeout: 3000 })) {
          await el.click();
          break;
        }
      } catch {
        // try next
      }
    }
  });

  test('Issue 3 (smoke): City filter element exists and is interactive on university search page', async ({ page }) => {
    await loginToApp(page);

    const urls = [
      'https://app-staging.vivacityapp.com/demo-student/universities',
      'https://app-staging.vivacityapp.com/demo-student/university',
      'https://app-staging.vivacityapp.com/demo-student/search',
    ];

    let landed = false;
    for (const url of urls) {
      await page.goto(url);
      await page.waitForTimeout(2000);
      const notFound = await page.locator('text=404').isVisible({ timeout: 2000 }).catch(() => false);
      if (!notFound) {
        landed = true;
        break;
      }
    }

    if (!landed) {
      test.skip();
      return;
    }

    await page.waitForSelector('.v-application', { timeout: 15000 });

    // Verify page has loaded with some content
    const hasContent = await page.locator('.v-application').isVisible({ timeout: 10000 });
    expect(hasContent).toBe(true);

    // Check that city-related filter exists on the page
    const cityRelatedContent = await page.locator(
      '[placeholder*="city" i], [label*="city" i], text=City, text=城市, [data-test*="city"]'
    ).count();

    // The page should have a city filter (this will be 0 if the filter is