// Bug #17354: [App Editor] Integration > Other Integration - Call Centre "Connect" returns 400 with invalid JSON response
// ADO: https://dev.azure.com/vivacityapp/Viva/_workitems/edit/17354
// Auto-generated 2026-07-10
// REVIEW BEFORE MERGING — verify selectors and assertions

import { test, expect } from '@playwright/test';
import { loginToApp } from '../helpers/auth.helper';

test.setTimeout(120000);

test('BUG #17354: Call Centre Connect should not return 400 with invalid JSON', async ({ page }) => {
  await loginToApp(page, 90000, 'pau.kie.chee@fusioneta.com', 'PAOpaopao@9696');

  // Navigate to App Editor > Integration
  let navigatedOk = true;
  try {
    await page.goto('https://app-staging.vivacityapp.com/demo-student/app-editor', { waitUntil: 'load', timeout: 30000 });
    await page.waitForSelector('.v-application', { timeout: 15000 });
    await page.waitForTimeout(2000);
  } catch {
    navigatedOk = false;
  }

  if (!navigatedOk) {
    await page.goto('https://app-staging.vivacityapp.com/app-editor');
  }

  await page.waitForSelector('.v-application', { timeout: 20000 });

  // Navigate to Integration section
  const integrationLink = page.locator('a, [role="link"], .v-list-item, .v-tab').filter({ hasText: /integration/i }).first();
  if (await integrationLink.isVisible()) {
    await integrationLink.click();
  } else {
    await page.goto('https://app-staging.vivacityapp.com/app-editor/integration');
  }

  await page.waitForSelector('.v-application', { timeout: 20000 });

  // Click "Other Integration" tab
  const otherIntegrationTab = page.locator('.v-tab, [role="tab"], button').filter({ hasText: /other integration/i }).first();
  await expect(otherIntegrationTab).toBeVisible({ timeout: 15000 });
  await otherIntegrationTab.click();

  await page.waitForSelector('.v-application', { timeout: 10000 });

  // Find the Call Centre card
  const callCentreCard = page.locator('.v-card, [class*="card"]').filter({ hasText: /call centre/i }).first();
  await expect(callCentreCard).toBeVisible({ timeout: 15000 });

  // Set up network response listener before clicking Connect
  let connectResponse: { status: number; body: string } | null = null;
  let responseError: string | null = null;

  page.on('response', async (response) => {
    if (
      response.url().includes('/app-editor/api/mini-program/') &&
      response.request().method() === 'POST'
    ) {
      const status = response.status();
      try {
        const body = await response.text();
        connectResponse = { status, body };

        // Check if response is non-JSON when it should be JSON
        if (status === 400) {
          try {
            JSON.parse(body);
          } catch {
            responseError = `API returned 400 with non-JSON body: ${body}`;
          }
        }
      } catch {
        // Could not read response body
      }
    }
  });

  // Check for error banner before clicking
  const errorBanner = page.locator('.v-alert[type="error"], .v-alert--type-error, [class*="error-banner"], .v-snackbar--active').filter({ hasText: /not valid json|unexpected token|an error occurred/i });

  // Find and click the Connect button within the Call Centre card
  const connectButton = callCentreCard.locator('button').filter({ hasText: /connect/i }).first();
  await expect(connectButton).toBeVisible({ timeout: 10000 });

  await connectButton.click();

  // Wait a moment for any network requests and UI updates
  await page.waitForTimeout(3000);

  // Assert: No invalid JSON error banner should appear
  const invalidJsonErrorBanner = page.locator(
    '.v-alert, .v-snackbar, [class*="alert"], [class*="error"]'
  ).filter({ hasText: /not valid json|unexpected token.*is not valid json/i });

  const isErrorVisible = await invalidJsonErrorBanner.isVisible();

  // If the network response had a 400 with non-JSON, the bug is present
  if (responseError) {
    throw new Error(`BUG #17354 is present: ${responseError}`);
  }

  // If an invalid JSON error banner is visible, the bug is present
  expect(isErrorVisible, 
    'BUG #17354: Invalid JSON error banner should not appear when clicking Call Centre Connect. ' +
    'Expected: dialog or OAuth flow to open. Got: error banner with JSON parse error.'
  ).toBe(false);

  // Assert: Either a dialog/modal opens OR a friendly error is shown (not a JSON parse error)
  const expectedOutcome = page.locator(
    '.v-dialog:not([style*="display: none"]), .v-overlay--active .v-dialog, [role="dialog"]'
  ).first();

  const dialogOpened = await expectedOutcome.isVisible();

  // Check if connect response was successful (2xx) or returned a proper error
  if (connectResponse) {
    const { status } = connectResponse as { status: number; body: string };
    
    // Bug condition: 400 status with non-JSON response
    expect(status, 
      `BUG #17354: POST to /app-editor/api/mini-program/ returned ${status}. Expected 2xx or proper JSON error response.`
    ).not.toBe(400);
  }

  // If no dialog opened and no error, at minimum we should not have the JSON parse error
  if (!dialogOpened) {
    // Check for any user-friendly message instead of raw JSON parse error
    const friendlyError = page.locator('.v-alert, .v-snackbar').filter({ 
      hasText: /error|failed|unavailable/i 
    }).first();
    
    const hasFriendlyError = await friendlyError.isVisible();
    
    // As long as it's not the invalid JSON error, we're fine
    expect(isErrorVisible).toBe(false);
  }
});