// Bug #16915: [Admin] Venue > Menus > Dishes page cut off — cannot scroll to see all dishes
// ADO: https://dev.azure.com/vivacityapp/Viva/_workitems/edit/16915
// Auto-generated 2026-05-28
// REVIEW BEFORE MERGING — verify selectors and assertions

import { test, expect } from '@playwright/test';
import { loginToApp } from '../helpers/auth.helper';

test.setTimeout(120000);

test('BUG #16915: Venue > Menus > Dishes page should not be cut off and should allow scrolling to see all dishes', async ({ page }) => {
  await loginToApp(page);

  // Navigate to Venue > Menus section
  await page.waitForSelector('.v-application', { timeout: 30000 });

  // Navigate to the Menus/Dishes page
  // Try to find and click the Venue menu item in the navigation
  const venueNavItem = page.locator('text=Venue').first();
  await venueNavItem.waitFor({ state: 'visible', timeout: 15000 });
  await venueNavItem.click();

  // Look for Menus submenu item
  const menusNavItem = page.locator('text=Menus').first();
  await menusNavItem.waitFor({ state: 'visible', timeout: 10000 });
  await menusNavItem.click();

  // Look for Dishes submenu or tab
  const dishesItem = page.locator('text=Dishes').first();
  await dishesItem.waitFor({ state: 'visible', timeout: 10000 });
  await dishesItem.click();

  // Wait for the dishes page/content to load
  await page.waitForLoadState('networkidle', { timeout: 30000 });

  // Verify the page loaded with some content
  await page.waitForSelector('.v-application', { timeout: 10000 });

  // Check that the main content container is visible and not cut off
  // The page should have a scrollable container or proper layout
  const mainContent = page.locator('.v-main, main, [data-testid="main-content"]').first();
  await mainContent.waitFor({ state: 'visible', timeout: 10000 });

  // Get the viewport size
  const viewportSize = page.viewportSize();
  expect(viewportSize).not.toBeNull();

  // Check that the content area has proper overflow settings (not cut off)
  const mainContentOverflow = await mainContent.evaluate((el) => {
    const style = window.getComputedStyle(el);
    return {
      overflow: style.overflow,
      overflowY: style.overflowY,
      height: style.height,
      maxHeight: style.maxHeight,
    };
  });

  // The overflow should not be 'hidden' which would cut off content
  expect(mainContentOverflow.overflow).not.toBe('hidden');
  expect(mainContentOverflow.overflowY).not.toBe('hidden');

  // Check that the dishes list/table is present and visible
  const dishesListContainer = page.locator('.v-data-table, .v-list, [class*="dish"], [class*="menu-item"]').first();
  
  // Wait for some dish items to appear
  const dishItems = page.locator('.v-data-table tbody tr, .v-list-item, [class*="dish-item"]');
  
  // Check if there are dish items displayed
  const dishCount = await dishItems.count();
  
  // If dishes exist, verify pagination or scroll functionality works
  if (dishCount > 0) {
    // Verify pagination controls are present if there are multiple pages
    const paginationControls = page.locator('.v-pagination, [class*="pagination"], .v-data-table-footer');
    const paginationVisible = await paginationControls.isVisible().catch(() => false);
    
    if (paginationVisible) {
      // Verify pagination is functional - next page button should be accessible
      const nextPageBtn = page.locator('.v-pagination__next, button[aria-label="Next page"], [aria-label="next page"]').first();
      const nextBtnExists = await nextPageBtn.count() > 0;
      
      if (nextBtnExists) {
        // The next page button should be visible and clickable (not hidden behind cut-off content)
        await expect(nextPageBtn).toBeVisible();
        
        // Verify the button is within the viewport (not cut off)
        const nextBtnBoundingBox = await nextPageBtn.boundingBox();
        expect(nextBtnBoundingBox).not.toBeNull();
        
        if (nextBtnBoundingBox && viewportSize) {
          // Button should be within viewport height (not cut off below visible area)
          // Allow some tolerance for partially visible elements
          expect(nextBtnBoundingBox.y).toBeLessThan(viewportSize.height + 100);
        }
      }
    }

    // Verify that we can scroll to see all items
    // Get the scroll height of the page
    const scrollInfo = await page.evaluate(() => {
      const body = document.body;
      const html = document.documentElement;
      return {
        scrollHeight: Math.max(body.scrollHeight, html.scrollHeight),
        clientHeight: Math.max(body.clientHeight, html.clientHeight),
        scrollable: document.documentElement.scrollHeight > document.documentElement.clientHeight,
      };
    });

    // If content exceeds viewport, we should be able to scroll
    if (scrollInfo.scrollHeight > scrollInfo.clientHeight) {
      // Try to scroll to the bottom of the page
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      
      // Verify we can scroll - the page should respond to scroll
      const scrollPosition = await page.evaluate(() => window.scrollY);
      
      // If scrollHeight > clientHeight, scrollY should be > 0 after scrolling
      if (scrollInfo.scrollHeight > scrollInfo.clientHeight + 50) {
        expect(scrollPosition).toBeGreaterThan(0);
      }
      
      // Scroll back to top
      await page.evaluate(() => window.scrollTo(0, 0));
    }

    // Verify the last visible dish item is actually accessible
    const lastVisibleDish = dishItems.last();
    if (await lastVisibleDish.count() > 0) {
      // Scroll to the last item to ensure it's reachable
      await lastVisibleDish.scrollIntoViewIfNeeded();
      await expect(lastVisibleDish).toBeVisible();
    }
  }

  // Final check: verify the page container doesn't have a fixed height that cuts off content
  const pageContainers = page.locator('.v-container, .v-row, [class*="dishes-page"], [class*="menu-dishes"]');
  const containerCount = await pageContainers.count();
  
  for (let i = 0; i < Math.min(containerCount, 5); i++) {
    const container = pageContainers.nth(i);
    const containerStyle = await container.evaluate((el) => {
      const style = window.getComputedStyle(el);
      return {
        overflow: style.overflow,
        overflowY: style.overflowY,
        height: style.height,
      };
    });
    
    // No container should hide overflow in a way that cuts off the dishes list
    if (containerStyle.overflow === 'hidden' && containerStyle.height !== 'auto') {
      // Check if this container is the culprit - it has a fixed height with hidden overflow
      const containerBox = await container.boundingBox();
      if (containerBox && viewportSize && containerBox.height >= viewportSize.height * 0.8) {
        // A full-page-height container with hidden overflow is the bug
        expect(containerStyle.overflow).not.toBe('hidden');
      }
    }
  }
});