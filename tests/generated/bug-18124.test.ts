// Bug #18124: [Admin] University feature tab — 'Search' label overlaps bar above it
// ADO: https://dev.azure.com/vivacityapp/Viva/_workitems/edit/18124
// Auto-generated 2026-08-12
// REVIEW BEFORE MERGING — verify selectors and assertions

import { test, expect } from '@playwright/test';
import { loginToApp } from '../helpers/auth.helper';

test.setTimeout(120000);

test('BUG #18124 - University feature tab Search label should not overlap bar above it', async ({ page }) => {
  await loginToApp(page);

  // Navigate to the University section
  await page.waitForSelector('.v-application', { timeout: 30000 });

  // Look for University in the navigation
  const universityNavItem = page.locator('text=University').first();
  await universityNavItem.waitFor({ state: 'visible', timeout: 30000 });
  await universityNavItem.click();

  // Wait for the University page to load
  await page.waitForLoadState('networkidle', { timeout: 30000 });

  // Look for a "Features" tab within University
  const featuresTab = page.locator('[role="tab"]').filter({ hasText: /feature/i }).first();
  if (await featuresTab.isVisible()) {
    await featuresTab.click();
    await page.waitForLoadState('networkidle', { timeout: 15000 });
  }

  // Wait for Search label/input to be visible
  const searchLabel = page.locator('label').filter({ hasText: /^search$/i }).first();
  const searchInput = page.locator('.v-text-field, .v-input').filter({ hasText: /search/i }).first();

  // Try to find the search element
  let searchElement = searchLabel;
  if (!await searchLabel.isVisible()) {
    searchElement = searchInput;
  }

  await searchElement.waitFor({ state: 'visible', timeout: 20000 });

  // Get the bounding box of the search label
  const searchBox = await searchElement.boundingBox();
  expect(searchBox).not.toBeNull();

  if (!searchBox) {
    throw new Error('Could not get bounding box for search element');
  }

  // Find the bar/toolbar above the search element
  // Look for common bar elements like toolbar, header, or divider above the search
  const possibleBars = [
    page.locator('.v-toolbar').last(),
    page.locator('.v-app-bar').last(),
    page.locator('.v-sheet').first(),
    page.locator('[class*="bar"]').first(),
    page.locator('.v-card-title').first(),
    page.locator('.v-divider').first(),
  ];

  let barBox: { x: number; y: number; width: number; height: number } | null = null;
  let barElement = null;

  for (const bar of possibleBars) {
    if (await bar.isVisible()) {
      const box = await bar.boundingBox();
      if (box && box.y < searchBox.y) {
        // This bar is above the search element
        if (!barBox || box.y + box.height > (barBox.y + barBox.height)) {
          barBox = box;
          barElement = bar;
        }
      }
    }
  }

  if (barBox) {
    // The search label's top should be below the bottom of the bar above it
    // If they overlap, the search top (y) will be less than the bar bottom (y + height)
    // AND the search top (y) will be greater than the bar top (y)
    const barBottom = barBox.y + barBox.height;
    const searchTop = searchBox.y;

    // Bug is present when searchTop < barBottom (search overlaps with bar)
    // The search label top should be at or below the bar bottom
    expect(searchTop).toBeGreaterThanOrEqual(barBottom - 2); // Allow 2px tolerance
  } else {
    // If we can't find a bar above, at minimum verify the search label has a positive y position
    // and is fully visible in the viewport
    const viewportSize = page.viewportSize();
    expect(viewportSize).not.toBeNull();

    if (viewportSize) {
      expect(searchBox.y).toBeGreaterThanOrEqual(0);
      expect(searchBox.y + searchBox.height).toBeLessThanOrEqual(viewportSize.height);
    }
  }

  // Additional check: verify search element is not clipped or hidden behind another element
  // Take a screenshot for visual verification
  await page.screenshot({ path: 'test-results/bug-18124-university-search-label.png' });

  // Verify the search label/input is fully visible and not overlapping
  // by checking that no other element is positioned on top of it at its center point
  const centerX = searchBox.x + searchBox.width / 2;
  const centerY = searchBox.y + searchBox.height / 2;

  const elementAtCenter = await page.evaluate(({ x, y }) => {
    const el = document.elementFromPoint(x, y);
    if (!el) return null;
    return {
      tagName: el.tagName,
      className: el.className,
      textContent: el.textContent?.trim().substring(0, 50),
    };
  }, { x: centerX, y: centerY });

  // The element at the center of the search label should be related to search
  // (not some overlapping bar element)
  expect(elementAtCenter).not.toBeNull();

  if (elementAtCenter) {
    const isSearchRelated =
      elementAtCenter.textContent?.toLowerCase().includes('search') ||
      elementAtCenter.className?.toLowerCase().includes('search') ||
      elementAtCenter.className?.toLowerCase().includes('input') ||
      elementAtCenter.className?.toLowerCase().includes('field') ||
      elementAtCenter.className?.toLowerCase().includes('label') ||
      elementAtCenter.tagName?.toLowerCase() === 'input' ||
      elementAtCenter.tagName?.toLowerCase() === 'label';

    // The center of the search element should be occupied by a search-related element
    // If a bar is overlapping, it would show a non-search element at this position
    expect(isSearchRelated).toBe(true);
  }
});