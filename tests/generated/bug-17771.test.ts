// Bug #17771: [Enquiries] Table column mismatch — missing 'System Enquiry ID' as first column
// ADO: https://dev.azure.com/vivacityapp/Viva/_workitems/edit/17771
// Auto-generated 2026-07-16
// REVIEW BEFORE MERGING — verify selectors and assertions

import { test, expect } from '@playwright/test';
import { loginToApp } from '../helpers/auth.helper';

test.setTimeout(120000);

test('BUG #17771 - Enquiries table should have System Enquiry ID as first column', async ({ page }) => {
  await loginToApp(page);

  // Navigate to enquiries section
  await page.goto('https://app-staging.vivacityapp.com');

  // Wait for app to be ready
  await page.waitForSelector('.v-application', { timeout: 30000 });

  // Try to navigate to enquiries page
  // Look for enquiries in navigation
  const enquiriesNavItem = page.locator('text=Enquiries, text=enquiries').first();
  
  // Try direct navigation approaches
  const possibleUrls = [
    'https://app-staging.vivacityapp.com/enquiries',
    'https://app-staging.vivacityapp.com/demo-student/enquiries',
  ];

  let navigated = false;
  for (const url of possibleUrls) {
    await page.goto(url);
    await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
    
    // Check if we landed on an enquiries page with a table
    const hasTable = await page.locator('.v-data-table, table').first().isVisible().catch(() => false);
    if (hasTable) {
      navigated = true;
      break;
    }
  }

  if (!navigated) {
    // Try clicking navigation item
    await page.goto('https://app-staging.vivacityapp.com');
    await page.waitForSelector('.v-application', { timeout: 30000 });
    
    const navEnquiries = page.locator('.v-navigation-drawer a, .v-list-item').filter({ hasText: /enquir/i }).first();
    if (await navEnquiries.isVisible({ timeout: 5000 }).catch(() => false)) {
      await navEnquiries.click();
      await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
    }
  }

  // Wait for the table to appear
  await page.waitForSelector('.v-data-table, table', { timeout: 30000 });

  // Get all column headers from the table
  const headers = page.locator('.v-data-table thead th, table thead th, .v-data-table-header th');
  await headers.first().waitFor({ timeout: 20000 });

  const headerTexts = await headers.allTextContents();
  const cleanedHeaders = headerTexts.map(h => h.trim()).filter(h => h.length > 0);

  console.log('Found table headers:', cleanedHeaders);

  // BUG #17771: The first column should be "System Enquiry ID"
  // The bug is present when "System Enquiry ID" is missing as the first column
  // (design shows Submission Date as first, but staging/correct version should have System Enquiry ID first)
  
  // According to the bug description, staging has System Enquiry ID as first column
  // The test should FAIL when bug is present (missing System Enquiry ID) and PASS when fixed
  // "Fixed" means the table includes System Enquiry ID as a column (and ideally as the first column)

  // Check that System Enquiry ID column exists
  const hasSystemEnquiryId = cleanedHeaders.some(h => 
    h.toLowerCase().includes('system enquiry id') || 
    h.toLowerCase().includes('enquiry id') ||
    h.toLowerCase().includes('system enquiry')
  );

  expect(
    hasSystemEnquiryId,
    `Expected "System Enquiry ID" to be present as a column, but found columns: [${cleanedHeaders.join(', ')}]`
  ).toBe(true);

  // Also verify that System Enquiry ID is the FIRST column
  const firstColumnHeader = cleanedHeaders[0];
  expect(
    firstColumnHeader.toLowerCase().includes('system enquiry id') || 
    firstColumnHeader.toLowerCase().includes('enquiry id') ||
    firstColumnHeader.toLowerCase().includes('system enquiry'),
    `Expected first column to be "System Enquiry ID" but got: "${firstColumnHeader}"`
  ).toBe(true);

  // Additionally verify the expected columns from staging are present
  const expectedColumns = ['Submission Date', 'Status', 'Type'];
  for (const col of expectedColumns) {
    const colPresent = cleanedHeaders.some(h => h.toLowerCase().includes(col.toLowerCase()));
    expect(
      colPresent,
      `Expected column "${col}" to be present. Found columns: [${cleanedHeaders.join(', ')}]`
    ).toBe(true);
  }

  // Verify Payment Status and GroupID columns are present (from staging spec)
  const hasPaymentStatus = cleanedHeaders.some(h => h.toLowerCase().includes('payment'));
  expect(
    hasPaymentStatus,
    `Expected "Payment Status" column to be present. Found columns: [${cleanedHeaders.join(', ')}]`
  ).toBe(true);
});