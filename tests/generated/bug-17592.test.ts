// Bug #17592: [Admin] Dashboard total/all leading card not visible on some accounts - scroll indicator unclear
// ADO: https://dev.azure.com/vivacityapp/Viva/_workitems/edit/17592
// Auto-generated 2026-07-10
// REVIEW BEFORE MERGING — verify selectors and assertions

import { test, expect } from '@playwright/test';
import { loginToApp } from '../helpers/auth.helper';

test.setTimeout(120000);

test('BUG #17592 - Dashboard total/all leading card is visible without needing to scroll, or scroll indicator is obvious', async ({ page }) => {
  await loginToApp(page);

  // Navigate to the dashboard
  await page.goto('https://app-staging.vivacityapp.com');

  // Wait for the dashboard to load
  await page.waitForSelector('.v-application', { timeout: 30000 });

  // Wait for the page to settle
  await page.waitForLoadState('networkidle');

  // Look for the dashboard leading cards container
  // The cards are typically in a scrollable row/container
  const possibleCardContainerSelectors = [
    '[data-testid="leading-cards"]',
    '[data-testid="dashboard-cards"]',
    '.leading-cards',
    '.dashboard-cards',
    '.v-slide-group',
    '.cards-container',
  ];

  let cardContainer = null;
  for (const selector of possibleCardContainerSelectors) {
    const el = page.locator(selector).first();
    if (await el.count() > 0) {
      cardContainer = el;
      break;
    }
  }

  // Look for the "All" or "Total" leading card using various possible selectors
  const totalCardSelectors = [
    '[data-testid="all-card"]',
    '[data-testid="total-card"]',
    '[data-testid="leading-card-all"]',
    '[data-testid="leading-card-total"]',
    '.leading-card--all',
    '.leading-card--total',
    '.all-card',
    '.total-card',
  ];

  // Also look by text content
  const allCardByText = page.locator('.v-card, [class*="card"], [class*="Card"]').filter({ hasText: /^(All|Total)$/i }).first();
  const allCardByTextWider = page.locator('*').filter({ hasText: /^(All|Total)$/ }).first();

  let allCard = null;

  for (const selector of totalCardSelectors) {
    const el = page.locator(selector).first();
    if (await el.count() > 0) {
      allCard = el;
      break;
    }
  }

  if (!allCard) {
    // Try to find by text content within card-like elements
    const cardWithAllText = page.locator('.v-card:has-text("All"), .v-card:has-text("Total"), [class*="card"]:has-text("All"), [class*="card"]:has-text("Total")').first();
    if (await cardWithAllText.count() > 0) {
      allCard = cardWithAllText;
    }
  }

  if (!allCard) {
    // Fallback: look for any element with exactly "All" or "Total" text that looks like a metric card
    allCard = allCardByText;
  }

  // Assert the card exists in the DOM
  await expect(allCard ?? allCardByTextWider).toBeVisible({ timeout: 15000 });

  if (allCard) {
    // Check that the card is within the visible viewport (not hidden behind scroll)
    const boundingBox = await allCard.boundingBox();
    expect(boundingBox).not.toBeNull();

    if (boundingBox) {
      const viewportSize = page.viewportSize();
      expect(viewportSize).not.toBeNull();

      if (viewportSize) {
        // The card should be visible within the viewport width
        // Bug: the card is off-screen to the left or right
        const cardRight = boundingBox.x + boundingBox.width;
        const cardLeft = boundingBox.x;

        // Card left edge should be within viewport (not hidden off-screen to the left)
        expect(cardLeft).toBeGreaterThanOrEqual(-10); // allow minor tolerance

        // Card right edge should be within viewport (not hidden off-screen to the right with no indicator)
        // OR if it is off-screen, there should be a visible scroll indicator
        const isFullyVisible = cardLeft >= 0 && cardRight <= viewportSize.width;

        if (!isFullyVisible) {
          // If the card is not fully visible, there must be a clear scroll affordance
          // Check for visible scrollbar or scroll indicator
          const scrollIndicatorSelectors = [
            '[data-testid="scroll-indicator"]',
            '.scroll-indicator',
            '.scroll-arrow',
            '[class*="scroll-btn"]',
            '.v-slide-group__prev',
            '.v-slide-group__next',
            '[class*="scrollbar"]:visible',
          ];

          let hasScrollIndicator = false;
          for (const selector of scrollIndicatorSelectors) {
            const indicator = page.locator(selector).first();
            if (await indicator.count() > 0 && await indicator.isVisible()) {
              hasScrollIndicator = true;
              break;
            }
          }

          // The bug: card is hidden AND there's no clear scroll indicator
          // This assertion FAILS when the bug is present (card hidden, no indicator)
          // and PASSES when fixed (either card visible or scroll indicator present)
          expect(hasScrollIndicator).toBe(true);
        }
      }
    }
  }

  // Additional check: if there is a scrollable cards container, ensure it shows a scroll affordance
  // The bug is that the scrollbar only appears on hover — we verify it's always visible or there's another indicator
  const slideGroupNext = page.locator('.v-slide-group__next').first();
  const slideGroupPrev = page.locator('.v-slide-group__prev').first();

  // If slide group controls exist and the content overflows, the navigation arrows should be visible
  if (await slideGroupNext.count() > 0) {
    // The next/prev buttons should be clearly visible (not just on hover)
    // Check computed opacity or visibility
    const nextOpacity = await slideGroupNext.evaluate((el) => {
      const style = window.getComputedStyle(el);
      return parseFloat(style.opacity);
    });

    const prevOpacity = await slideGroupPrev.evaluate((el) => {
      const style = window.getComputedStyle(el);
      return parseFloat(style.opacity);
    });

    // At least one scroll control should have visible opacity (not hidden)
    // When the bug is present, these may be styled to appear only on hover
    const atLeastOneVisible = nextOpacity > 0 || prevOpacity > 0;
    expect(atLeastOneVisible).toBe(true);
  }

  // Verify the "All/Total" card text is in the visible area of the page
  // by checking if it's within the clipping bounds of its scroll container
  const totalTextLocator = page.locator('text=/^(All|Total)$/i').first();
  if (await totalTextLocator.count() > 0) {
    const isInViewport = await totalTextLocator.isVisible();
    // BUG FAIL: isInViewport is false (card hidden behind scroll with no indicator)
    // BUG PASS: isInViewport is true (card is shown directly or scroll is obvious)
    expect(isInViewport).toBe(true);
  }
});