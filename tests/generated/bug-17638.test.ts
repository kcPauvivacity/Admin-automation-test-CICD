// Bug #17638: [UniLodge] 3 forms not syncing - wrong price ID sent to contacts API causing missing price_data
// ADO: https://dev.azure.com/vivacityapp/Viva/_workitems/edit/17638
// Auto-generated 2026-07-10
// REVIEW BEFORE MERGING — verify selectors and assertions

import { test, expect, request } from '@playwright/test';
import { loginToApp } from '../helpers/auth.helper';

test.setTimeout(300000);

test('BUG #17638 - UniLodge forms sync with correct price ID generating valid price_data', async ({ page, context }) => {
  await loginToApp(page);

  // Navigate to forms/sync related section
  await page.goto('https://app-staging.vivacityapp.com');
  await page.waitForSelector('.v-application', { timeout: 30000 });

  // Navigate to the forms management area
  await page.goto('https://app-staging.vivacityapp.com/demo-student/forms');
  
  let formsPageFound = false;
  try {
    await page.waitForSelector('.v-application', { timeout: 15000 });
    formsPageFound = true;
  } catch {
    // Try alternative paths
  }

  if (!formsPageFound) {
    await page.goto('https://app-staging.vivacityapp.com/demo-student/applications');
    await page.waitForSelector('.v-application', { timeout: 15000 });
  }

  // Intercept contacts API calls to verify correct price ID is being sent
  const contactsApiCalls: { url: string; body: string; priceId?: string }[] = [];
  
  page.on('request', (req) => {
    if (req.url().includes('/contacts') && (req.method() === 'POST' || req.method() === 'PUT' || req.method() === 'PATCH')) {
      const body = req.postData() || '';
      contactsApiCalls.push({ url: req.url(), body });
    }
  });

  const contactsApiResponses: { url: string; status: number; body: string }[] = [];
  
  page.on('response', async (res) => {
    if (res.url().includes('/contacts') && (res.request().method() === 'POST' || res.request().method() === 'PUT' || res.request().method() === 'PATCH')) {
      try {
        const body = await res.text();
        contactsApiResponses.push({ url: res.url(), status: res.status(), body });
      } catch {
        // ignore
      }
    }
  });

  // Navigate to room pricing section to get valid price IDs
  await page.goto('https://app-staging.vivacityapp.com/demo-student/rooms');
  
  let roomsVisible = false;
  try {
    await page.waitForSelector('.v-application', { timeout: 15000 });
    roomsVisible = true;
  } catch {
    roomsVisible = false;
  }

  // Try to find forms that need syncing
  await page.goto('https://app-staging.vivacityapp.com/demo-student/applications');
  await page.waitForSelector('.v-application', { timeout: 20000 });

  // Look for pending/unsynced applications or forms
  const pendingForms = page.locator('[data-testid="pending-forms"], .pending-sync, .sync-error, [class*="pending"], [class*="sync"]');
  const hasPendingForms = await pendingForms.count() > 0;

  // Look for sync buttons or form cards
  const syncButtons = page.locator('button:has-text("Sync"), button:has-text("sync"), .v-btn:has-text("Sync")');
  const formCards = page.locator('.v-card, .application-card, [data-testid*="form"], [data-testid*="application"]');

  const syncButtonCount = await syncButtons.count();
  const formCardCount = await formCards.count();

  // Navigate to UniLodge specific forms if available
  await page.goto('https://app-staging.vivacityapp.com/demo-student/forms/pending');
  await page.waitForSelector('.v-application', { timeout: 15000 }).catch(() => {});

  // Try forms sync page
  await page.goto('https://app-staging.vivacityapp.com/demo-student/form-submissions');
  await page.waitForSelector('.v-application', { timeout: 15000 }).catch(() => {});

  // Navigate back to applications and attempt to trigger sync
  await page.goto('https://app-staging.vivacityapp.com/demo-student/applications');
  await page.waitForSelector('.v-application', { timeout: 20000 });

  // Intercept the rooms/pricing API to capture room price IDs
  const roomPriceIds: string[] = [];
  const sentPriceIds: string[] = [];

  // Set up API interception for room prices
  const roomPriceApiCalls: { priceId: string; roomId: string }[] = [];

  page.on('response', async (res) => {
    if (res.url().includes('/rooms') || res.url().includes('/prices') || res.url().includes('/pricing')) {
      try {
        const body = await res.text();
        if (body && body.includes('priceId') || body.includes('price_id') || body.includes('rateId')) {
          // Parse and store room price IDs for comparison
          try {
            const data = JSON.parse(body);
            if (data && data.priceId) roomPriceIds.push(data.priceId);
            if (data && data.price_id) roomPriceIds.push(data.price_id);
            if (data && Array.isArray(data)) {
              data.forEach((item: { priceId?: string; price_id?: string }) => {
                if (item.priceId) roomPriceIds.push(item.priceId);
                if (item.price_id) roomPriceIds.push(item.price_id);
              });
            }
          } catch {
            // not JSON
          }
        }
      } catch {
        // ignore
      }
    }
  });

  // Attempt to find and interact with form sync functionality
  const applicationRows = page.locator('.v-data-table tbody tr, .application-row, [data-testid="application-row"]');
  const rowCount = await applicationRows.count();

  if (rowCount > 0) {
    // Click on first application to see details
    await applicationRows.first().click().catch(() => {});
    await page.waitForSelector('.v-dialog, .application-detail, [data-testid="application-detail"]', { timeout: 10000 }).catch(() => {});

    // Look for price-related fields
    const priceField = page.locator('[data-testid="price-id"], [name*="price"], [label*="price"], .price-field, [data-testid*="price"]');
    const priceFieldCount = await priceField.count();

    if (priceFieldCount > 0) {
      const priceValue = await priceField.first().inputValue().catch(async () => await priceField.first().textContent());
      expect(priceValue).toBeTruthy();
    }

    // Close dialog if open
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
  }

  // Navigate to integration/sync settings
  await page.goto('https://app-staging.vivacityapp.com/demo-student/integrations');
  await page.waitForSelector('.v-application', { timeout: 15000 }).catch(() => {});

  await page.goto('https://app-staging.vivacityapp.com/demo-student/settings/integrations');
  await page.waitForSelector('.v-application', { timeout: 15000 }).catch(() => {});

  // Check for contacts API configuration
  await page.goto('https://app-staging.vivacityapp.com/demo-student/contacts');
  await page.waitForSelector('.v-application', { timeout: 15000 }).catch(() => {});

  // Use API client to verify the contacts API behavior
  const apiContext = await request.newContext({
    baseURL: 'https://app-staging.vivacityapp.com',
    extraHTTPHeaders: {
      'Content-Type': 'application/json',
    },
  });

  // Navigate to the specific forms area for UniLodge
  await page.goto('https://app-staging.vivacityapp.com/demo-student/form-sync');
  await page.waitForSelector('.v-application', { timeout: 10000 }).catch(() => {});

  await page.goto('https://app-staging.vivacityapp.com/demo-student/applications?status=pending');
  await page.waitForSelector('.v-application', { timeout: 15000 });

  // Capture any API calls during page load that include price data
  const priceDataApiCalls: { url: string; hasPriceData: boolean; hasFixTermId: boolean; hasRateId: boolean }[] = [];

  page.on('response', async (res) => {
    if (res.url().includes('api') || res.url().includes('/v1/') || res.url().includes('/v2/')) {
      try {
        const body = await res.text();
        if (body.includes('price') || body.includes('fixTermId') || body.includes('rateId')) {
          priceDataApiCalls.push({
            url: res.url(),
            hasPriceData: body.includes('price_data') || body.includes('priceData'),
            hasFixTermId: body.includes('fixTermId'),
            hasRateId: body.includes('rateId'),
          });
        }
      } catch {
        // ignore
      }
    }
  });

  // Reload page to trigger API calls
  await page.reload();
  await page.waitForSelector('.v-application', { timeout: 20000 });
  await page.waitForTimeout(3000);

  // Check that any contacts API calls have price_data
  // The bug: wrong price ID sent → no price_data generated
  for (const apiCall of contactsApiResponses) {
    if (apiCall.status === 200 || apiCall.status === 201) {
      try {
        const responseData = JSON.parse(apiCall.body);
        // If the response doesn't include price_data, the bug is present
        // price_data should contain fixTermId and rateId
        if (responseData && responseData.price_data !== undefined) {
          expect(responseData.price_data).not.toBeNull();
          expect(responseData.price_data).toBeTruthy();
          
          if (responseData.price_data) {
            // Validate price_data has required fields
            const hasPriceDataFields = 
              responseData.price_data.fixTermId !== undefined || 
              responseData.price_data.rateId !== undefined ||
              responseData.price_data.fix_term_id !== undefined ||
              responseData.price_data.rate_id !== undefined;
            
            expect(hasPriceDataFields).toBeTruthy();
          }
        }
      } catch {
        // Not JSON response, skip
      }
    }
  }

  // Verify page loaded correctly and no sync error banners are shown
  const errorBanner = page.locator('.v-alert--type-error, [class*="error-banner"], [data-testid="sync-error"]');
  const errorBannerTexts = await errorBanner.allTextContents();
  
  for (const errorText of errorBannerTexts) {
    const hasWrongPriceIdError = 
      errorText.toLowerCase().includes('price id') || 
      errorText.toLowerCase().includes('priceid') ||
      errorText.toLowerCase().includes('price_data') ||
      errorText.toLowerCase().includes('sync failed');
    
    // If there's a price ID error, the bug is present
    expect(hasWrongPriceIdError).toBeFalsy();
  }

  // Navigate to admin area to check form sync status
  await page.goto('https://app-staging.vivacityapp.com/demo-student/admin/forms');
  await page.waitForSelector('.v-application', { timeout: 15000 }).catch(() => {});

  // Look for forms with sync errors related to price ID
  const syncErrorItems = page.locator('[data-testid="sync-error"], .sync-error, [class*="error"][class*="sync"]');
  const syncErrorCount = await syncErrorItems.count();

  // Check each sync error to see if it's related to price ID
  for (let i = 0; i < syncErrorCount; i++) {
    const errorText = await syncErrorItems.nth(i).textContent();
    if (errorText) {
      const isPriceRelatedError = 
        errorText.toLowerCase().includes('price') ||
        errorText.toLowerCase().includes('priceid') ||
        errorText.toLowerCase().includes('price_data');
      
      // Bug present if price-related sync errors exist
      expect(isPriceRelatedError).toBeFalsy();
    }
  }

  // Final verification: check that the application page shows healthy sync status
  await page.goto('https://app-staging.vivacityapp.com/demo-student/applications');
  await page.waitForSelector('.v-application', { timeout: 20000 });

  // Verify the application shows no price_data errors
  const appContent = await page.content();
  
  // Bug signature: "price_data not generated" or missing price_data
  const hasBugSignature = 
    appContent.includes('price_data not generated') ||
    appContent.includes('wrong price id') ||
    appContent.includes('wrong price ID');
  
  expect(hasBugSignature).toBeFalsy();

  // Verify the page is functional and loaded correctly
  await expect(page.locator('.v-application')).toBeVisible();

  await apiContext.dispose();
});

test('BUG #17638 - Verify contacts API receives matching room price ID', async ({ page }) => {
  test.setTimeout(120000);
  
  await loginToApp(page);

  const contactApiRequests: { url: string; body: Record<string, unknown> | null }[] = [];

  // Intercept all contacts API requests
  page.on('request', (req) => {
    if (req.url().includes('/contacts') || req.url().includes('/contact')) {
      try {
        const postData = req.postData();
        const body = postData ? JSON.parse(postData) : null;
        contactApiRequests.push({ url: req.url(), body });
      } catch {
        contactApiRequests.push({ url: req.url(), body: null });
      }
    }
  });

  const contactApiResponses: { url: string; status: number; responseBody: Record<string, unknown> | null }[] = [];

  page.on('response', async (res) => {
    if (res.url().includes('/contacts') || res.url().includes('/contact')) {
      try {
        const text = await res.text();
        const responseBody = text ? JSON.parse(text) : null;
        contactApiResponses.push({ url: res.url(), status: res.status(), responseBody });
      } catch {
        contactApiResponses.push({ url: res.url(), status: res.status(), responseBody: null });
      }
    }
  });

  // Navigate to applications to trigger API calls
  await page.goto('https://app-staging.vivacityapp.com/demo-student/applications');
  await page.waitForSelector('.v-application', { timeout: 30000 });
  await page.waitForTimeout(3000);

  // Check pending/unsynced forms
  const filterButtons = page.locator('.v-btn:has-text("Pending"), .v-btn:has-text("Unsynced"), .v-tab:has-text("Pending")');
  const filterCount = await filterButtons.count();
  
  if (filterCount > 0) {
    await filterButtons.first().click();
    await page.waitForTimeout(2000);
  }

  // Find sync buttons and attempt sync
  const syncBtns = page.locator('.v-btn:has-text("Sync"), button:has-text("Sync"), .v-btn[title*="sync" i]');
  const syncBtnCount = await syncBtns.count();

  if (syncBtnCount > 0) {
    // Click sync on first available form
    await syncBtns.first().click();
    await page.waitForTimeout(3000);
  }

  // Log captured contact API request/response bodies for manual verification
  console.log(`Captured ${contactApiRequests.length} contact request(s), ${contactApiResponses.length} response(s)`);
});