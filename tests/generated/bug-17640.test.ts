// Bug #17640: [Admin] Chat Centre contact tab - cannot navigate back to enquiries list from a specific enquiry
// ADO: https://dev.azure.com/vivacityapp/Viva/_workitems/edit/17640
// Auto-generated 2026-07-10
// REVIEW BEFORE MERGING — verify selectors and assertions

import { test, expect } from '@playwright/test';
import { loginToApp } from '../helpers/auth.helper';

test.setTimeout(120000);

test('BUG #17640 - Chat Centre contact tab: back navigation available from specific enquiry to enquiries list', async ({ page }) => {
  await loginToApp(page);

  // Navigate to Chat Centre
  await page.waitForSelector('.v-application', { timeout: 30000 });

  // Look for Chat Centre navigation item
  const chatCentreLink = page.locator('a, .v-list-item, .nav-item').filter({ hasText: /chat\s*centre/i }).first();
  await chatCentreLink.waitFor({ state: 'visible', timeout: 20000 });
  await chatCentreLink.click();

  // Wait for Chat Centre page to load
  await page.waitForSelector('.v-application', { timeout: 15000 });

  // Click on the Contact tab
  const contactTab = page.locator('.v-tab, [role="tab"]').filter({ hasText: /contact/i }).first();
  await contactTab.waitFor({ state: 'visible', timeout: 20000 });
  await contactTab.click();

  // Wait for the contact/enquiries list to load
  await page.waitForTimeout(2000);

  // Find and click into a specific enquiry item
  // Look for enquiry list items - could be rows, cards, or list items
  const enquiryItem = page.locator(
    '.v-list-item, .enquiry-item, tr[class*="enquiry"], .contact-enquiry, [data-enquiry], .v-data-table tbody tr'
  ).first();

  await enquiryItem.waitFor({ state: 'visible', timeout: 20000 });

  // Store the current URL before clicking into enquiry
  const listUrl = page.url();

  await enquiryItem.click();

  // Wait for the specific enquiry detail view to load
  await page.waitForTimeout(2000);

  const detailUrl = page.url();

  // Verify we navigated to a detail view (URL should have changed or content changed)
  // Now check for back navigation option

  // Look for a back button, back link, or breadcrumb that allows returning to the enquiries list
  const backNavigation = page.locator(
    [
      'button[aria-label*="back" i]',
      'a[aria-label*="back" i]',
      '.back-button',
      '.back-link',
      '[data-testid*="back"]',
      '.v-btn:has(.v-icon[class*="arrow-left"])',
      '.v-btn:has(.v-icon[class*="chevron-left"])',
      '.v-btn:has(.mdi-arrow-left)',
      '.v-btn:has(.mdi-chevron-left)',
      'button:has-text("Back")',
      'a:has-text("Back")',
      '.breadcrumb a',
      '.v-breadcrumbs a',
      '.v-breadcrumbs-item--link',
      '[class*="breadcrumb"] a',
      'button:has-text("Enquiries")',
      'a:has-text("Enquiries")',
    ].join(', ')
  );

  // The test FAILS if bug is present (no back navigation found)
  // The test PASSES when fixed (back navigation is visible)
  await expect(
    backNavigation.first(),
    'Back navigation should be visible when viewing a specific enquiry in the Contact tab of Chat Centre'
  ).toBeVisible({ timeout: 10000 });

  // Additionally verify clicking back navigation returns to enquiries list
  const visibleBackNav = backNavigation.first();
  await visibleBackNav.click();

  // Wait for navigation back to list
  await page.waitForTimeout(2000);

  // Verify we're back on the contact/enquiries list view
  // Either URL changed back or list is visible again
  const enquiriesListVisible = page.locator(
    '.v-list-item, .enquiry-item, .v-data-table tbody tr, [class*="enquiry-list"]'
  ).first();

  await expect(
    enquiriesListVisible,
    'Enquiries list should be visible after clicking back navigation'
  ).toBeVisible({ timeout: 15000 });
});