// Bug #17347: [CRM Students] Unpublished cities still showing in Search Cities with blank property count
// ADO: https://dev.azure.com/vivacityapp/Viva/_workitems/edit/17347
// Auto-generated 2026-06-16
// REVIEW BEFORE MERGING — verify selectors and assertions

import { test, expect } from '@playwright/test';
import { loginToApp } from '../helpers/auth.helper';

test.setTimeout(300000);

test('BUG #17347 - Unpublished cities should not appear in Search Cities with blank property count', async ({ page }) => {
  await loginToApp(page);

  // Navigate to the CRM Students demo mini program cities search view
  await page.goto('https://app-staging.vivacityapp.com/demo-student/search-cities');

  // Wait for the page to load
  await page.waitForSelector('.v-application', { timeout: 30000 });

  // Check the Search Cities list
  // Look for city cards/items in the search cities view
  await page.waitForSelector('[data-testid="city-list"], .city-list, .search-cities', { timeout: 15000 }).catch(async () => {
    // If no specific selector, wait for general content to load
    await page.waitForLoadState('networkidle', { timeout: 15000 });
  });

  // Get all city items displayed
  const cityItems = page.locator('.city-item, [data-testid="city-item"], .v-card.city, .city-card');
  const cityCount = await cityItems.count();

  if (cityCount > 0) {
    // For each city item, check that it does NOT have a blank/empty property count
    for (let i = 0; i < cityCount; i++) {
      const cityItem = cityItems.nth(i);

      // Check for blank property count - this would be the bug
      // The property count should not be empty/blank
      const propertyCountEl = cityItem.locator('.property-count, [data-testid="property-count"], .count, .properties-count');
      const propCountExists = await propertyCountEl.count();

      if (propCountExists > 0) {
        const propertyCountText = await propertyCountEl.first().textContent();

        // Bug is present if property count is blank/empty
        expect(
          propertyCountText?.trim(),
          `City item ${i} has a blank property count - unpublished city is still showing`
        ).not.toBe('');

        expect(
          propertyCountText?.trim(),
          `City item ${i} has null/undefined property count - unpublished city is still showing`
        ).toBeTruthy();

        // The count should be a positive number (greater than 0)
        const countNumber = parseInt(propertyCountText?.trim() || '0', 10);
        expect(
          countNumber,
          `City item ${i} shows 0 properties - city with no published properties should not be visible`
        ).toBeGreaterThan(0);
      }
    }
  }

  // Now navigate to the mini program cities page via the app
  await page.goto('https://app-staging.vivacityapp.com/demo-student');
  await page.waitForLoadState('networkidle', { timeout: 30000 });

  // Look for search cities navigation
  const searchCitiesLink = page.locator('text=Search Cities, [data-testid="search-cities"], a[href*="search-cities"], a[href*="cities"]').first();
  const searchCitiesExists = await searchCitiesLink.count();

  if (searchCitiesExists > 0) {
    await searchCitiesLink.click();
    await page.waitForLoadState('networkidle', { timeout: 15000 });
  }

  // Collect all visible city entries
  const allCityEntries = page.locator('.city-item, [data-testid="city-item"], .v-card.city, .city-card, .v-list-item.city');
  const allCityCount = await allCityEntries.count();

  for (let i = 0; i < allCityCount; i++) {
    const entry = allCityEntries.nth(i);
    const entryText = await entry.textContent();

    // Check for blank property count patterns
    // Bug manifests as cities showing with blank/empty property count
    const hasBlankCount = entryText?.match(/^\s*[A-Za-z\s]+\s*$/) && !entryText?.match(/\d+/);

    expect(
      hasBlankCount,
      `City entry "${entryText?.trim()}" appears to show no property count (blank) - unpublished city should be hidden`
    ).toBeFalsy();
  }
});

test('BUG #17347 - Settings Cities list should not be empty for CRM Students', async ({ page }) => {
  await loginToApp(page);

  // Navigate to Settings for CRM Students
  await page.goto('https://app-staging.vivacityapp.com/demo-student/settings');
  await page.waitForLoadState('networkidle', { timeout: 30000 });

  await page.waitForSelector('.v-application', { timeout: 30000 });

  // Look for Cities section in settings
  const citiesNavItem = page.locator('text=Cities, [data-testid="cities-nav"], a[href*="cities"]').first();
  const citiesNavExists = await citiesNavItem.count();

  if (citiesNavExists > 0) {
    await citiesNavItem.click();
    await page.waitForLoadState('networkidle', { timeout: 15000 });
  } else {
    // Try direct navigation
    await page.goto('https://app-staging.vivacityapp.com/demo-student/settings/cities');
    await page.waitForLoadState('networkidle', { timeout: 15000 });
  }

  // The cities list should NOT be empty
  // Bug reports that Cities list under Settings is empty for CRM Students
  const emptyState = page.locator('[data-testid="empty-state"], .empty-state, .v-empty-state, text=No cities found, text=No data available');
  const emptyStateCount = await emptyState.count();

  // Cities list items should exist
  const cityListItems = page.locator('.v-list-item.city, [data-testid="city-list-item"], .city-row, .v-data-table tr.city, .cities-list .v-list-item');
  const cityListCount = await cityListItems.count();

  // If empty state is shown AND no city items, the bug is present
  if (emptyStateCount > 0 && cityListCount === 0) {
    // This is the bug - settings cities list is empty
    expect(
      cityListCount,
      'BUG #17347: Settings Cities list is empty for CRM Students - this is the reported bug'
    ).toBeGreaterThan(0);
  }

  // Verify that the page has loaded and shows content
  const pageContent = await page.content();
  const hasSettingsContent = pageContent.includes('Cities') || pageContent.includes('city');
  expect(hasSettingsContent, 'Settings page should contain Cities content').toBeTruthy();
});

test('BUG #17347 - Cities with only unpublished properties hidden from Search Cities API response', async ({ page }) => {
  // Intercept the API call for cities search to validate response
  const citiesApiResponse: { name: string; propertyCount: number | null | undefined }[] = [];

  await page.route('**/api/**/cities**', async (route) => {
    const response = await route.fetch();
    const body = await response.json().catch(() => null);

    if (body && Array.isArray(body)) {
      body.forEach((city: { name?: string; propertyCount?: number; properties_count?: number; count?: number }) => {
        citiesApiResponse.push({
          name: city.name || 'Unknown',
          propertyCount: city.propertyCount ?? city.properties_count ?? city.count
        });
      });
    } else if (body?.data && Array.isArray(body.data)) {
      body.data.forEach((city: { name?: string; propertyCount?: number; properties_count?: number; count?: number }) => {
        citiesApiResponse.push({
          name: city.name || 'Unknown',
          propertyCount: city.propertyCount ?? city.properties_count ?? city.count
        });
      });
    }

    await route.fulfill({ response });
  });

  await loginToApp(page);
  await page.goto('https://app-staging.vivacityapp.com/demo-student/search-cities');
  await page.waitForLoadState('networkidle', { timeout: 30000 });

  // If we captured API responses, validate them
  if (citiesApiResponse.length > 0) {
    for (const city of citiesApiResponse) {
      expect(
        city.propertyCount,
        `City "${city.name}" has null/undefined property count in API response - unpublished city should not be returned`
      ).not.toBeNull();

      expect(
        city.propertyCount,
        `City "${city.name}" has undefined property count in API response`
      ).not.toBeUndefined();

      expect(
        city.propertyCount,
        `City "${city.name}" has 0 published properties but is still appearing in Search Cities`
      ).toBeGreaterThan(0);
    }
  }

  // Verify no blank property count displayed in UI
  await page.waitForSelector('.v-application', { timeout: 30000 });

  // Check for any elements that show city names but have blank/empty counts
  const cityElements = await page.$$('.city-item, [data-testid="city-item"], .v-card[class*="city"]');

  for (const cityEl of cityElements) {
    const countEl = await cityEl.$('.property-count, [data-testid="property-count"], .count');
    if (countEl) {
      const countText = await countEl.textContent();
      expect(
        countText?.trim(),
        'City in Search Cities list has blank property count - indicates unpublished city is showing'
      ).toBeTruthy();
    }
  }
});