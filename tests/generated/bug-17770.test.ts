// Bug #17770: [Enquiries] Stat cards mismatch — design shows 'New Enquiries', staging has extra cards
// ADO: https://dev.azure.com/vivacityapp/Viva/_workitems/edit/17770
// Auto-generated 2026-07-16
// REVIEW BEFORE MERGING — verify selectors and assertions

import { test, expect } from '@playwright/test';
import { loginToApp } from '../helpers/auth.helper';

test.setTimeout(120000);

test('BUG #17770 - Enquiries stat cards match design spec: 4 cards with correct labels', async ({ page }) => {
  await loginToApp(page);

  // Navigate to Enquiries page
  await page.goto('https://app-staging.vivacityapp.com');

  // Wait for the app to load
  await page.waitForSelector('.v-application', { timeout: 30000 });

  // Navigate to Enquiries section
  await page.goto('https://app-staging.vivacityapp.com/demo-student/enquiries');

  await page.waitForSelector('.v-application', { timeout: 30000 });

  // Wait for stat cards to be visible
  await page.waitForSelector('.v-card', { timeout: 30000 });

  // Define the expected stat cards per design spec
  const expectedCards = [
    'Total Enquiries',
    'New Enquiries',
    'Booking Enquiries',
    'Waiting List',
  ];

  // Define cards that should NOT be present (present in staging but not in design)
  const unexpectedCards = [
    'Concurrent Booking',
    'Lead Form',
    'Rebook',
  ];

  // Check that all expected cards are present
  for (const cardLabel of expectedCards) {
    const cardLocator = page.locator('.v-card', { hasText: cardLabel }).first();
    await expect(cardLocator).toBeVisible({
      timeout: 15000,
    });
  }

  // Check that unexpected cards are NOT present
  for (const cardLabel of unexpectedCards) {
    const cardLocator = page.locator('.v-card', { hasText: cardLabel }).first();
    await expect(cardLocator).not.toBeVisible({
      timeout: 5000,
    });
  }

  // Verify exact count of stat cards
  // Attempt to find stat cards in the stats/summary section
  // Stat cards are typically in a row/grid at the top of the page
  const statCardContainer = page.locator('.v-row').filter({
    has: page.locator('.v-card'),
  }).first();

  await statCardContainer.waitFor({ timeout: 15000 });

  const statCards = statCardContainer.locator('.v-card');
  const cardCount = await statCards.count();

  // The design specifies exactly 4 stat cards
  expect(cardCount).toBe(4);

  // Double-check 'New Enquiries' is specifically visible (key missing card from bug)
  const newEnquiriesCard = page.locator('text=New Enquiries').first();
  await expect(newEnquiriesCard).toBeVisible({ timeout: 10000 });
});