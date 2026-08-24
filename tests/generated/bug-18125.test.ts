// Bug #18125: [Admin] Features tab — Refresh button missing tooltip label and not functioning correctly
// ADO: https://dev.azure.com/vivacityapp/Viva/_workitems/edit/18125
// Auto-generated 2026-08-12
// REVIEW BEFORE MERGING — verify selectors and assertions

import { test, expect } from '@playwright/test';
import { loginToApp } from '../helpers/auth.helper';

test.setTimeout(120000);

test('BUG #18125 - Features tab Refresh button has tooltip and functions correctly', async ({ page }) => {
  await loginToApp(page);

  // Navigate to a page that contains a Features tab
  // Based on standard org modules under /demo-student/*
  await page.goto('https://app-staging.vivacityapp.com/demo-student/system-settings/features');
  await page.waitForLoadState('networkidle');

  // Try alternative navigation paths if the direct URL doesn't land on Features tab
  const featuresTab = page.locator('[role="tab"]').filter({ hasText: /features/i });
  const featuresTabVisible = await featuresTab.isVisible().catch(() => false);

  if (!featuresTabVisible) {
    // Try navigating via settings or admin area
    await page.goto('https://app-staging.vivacityapp.com/demo-student/settings');
    await page.waitForLoadState('networkidle');

    const settingsFeaturesTab = page.locator('[role="tab"]').filter({ hasText: /features/i });
    const settingsFeaturesVisible = await settingsFeaturesTab.isVisible().catch(() => false);

    if (settingsFeaturesVisible) {
      await settingsFeaturesTab.click();
      await page.waitForLoadState('networkidle');
    }
  } else {
    await featuresTab.click();
    await page.waitForLoadState('networkidle');
  }

  // Locate the Refresh button on the Features tab
  // It should be near the Edit Column button for comparison
  const refreshButton = page.locator('button').filter({ hasText: /refresh/i })
    .or(page.locator('[aria-label*="refresh" i]'))
    .or(page.locator('.v-btn').filter({ has: page.locator('.mdi-refresh') }))
    .first();

  await expect(refreshButton).toBeVisible({ timeout: 15000 });

  // TEST 1: Verify the Refresh button has a tooltip label
  // Hover over the Refresh button to trigger tooltip
  await refreshButton.hover();

  // Wait for tooltip to appear (Vuetify 3 uses v-tooltip which renders in overlay)
  const tooltip = page.locator('.v-tooltip .v-overlay__content')
    .or(page.locator('[role="tooltip"]'))
    .filter({ hasText: /refresh/i });

  await expect(tooltip).toBeVisible({ timeout: 5000 });

  // Also verify the tooltip has meaningful text (not empty)
  const tooltipText = await tooltip.textContent();
  expect(tooltipText?.trim().length).toBeGreaterThan(0);
  expect(tooltipText?.toLowerCase()).toContain('refresh');

  // Move away to dismiss tooltip
  await page.mouse.move(0, 0);
  await expect(tooltip).toBeHidden({ timeout: 3000 }).catch(() => {
    // Tooltip may have already hidden, that's fine
  });

  // TEST 2: Verify the Refresh button functions correctly
  // Intercept network requests to verify a data refresh call is made
  let refreshRequestMade = false;

  page.on('request', (request) => {
    const url = request.url();
    // Check for API calls that would indicate a data refresh
    if (
      url.includes('/features') ||
      url.includes('/api/') ||
      url.includes('/graphql')
    ) {
      refreshRequestMade = true;
    }
  });

  // Click the Refresh button
  await refreshButton.click();

  // Wait briefly for any network activity
  await page.waitForLoadState('networkidle').catch(() => {});
  await page.waitForTimeout(2000);

  // Verify that clicking Refresh triggered some network activity OR
  // that the UI shows some loading indicator
  // The button should at minimum trigger a data reload
  const loadingIndicator = page.locator('.v-progress-circular, .v-progress-linear, [aria-busy="true"]');
  const loadingVisible = await loadingIndicator.isVisible().catch(() => false);

  // Either a network request was made or a loading indicator was shown
  // If neither happened, the refresh is not functioning
  expect(refreshRequestMade || loadingVisible).toBe(true);

  // Verify the page/table still renders correctly after refresh (not broken state)
  const dataTable = page.locator('.v-data-table, .v-table, table');
  await expect(dataTable.first()).toBeVisible({ timeout: 10000 });

  // Verify no error state is shown after refresh
  const errorMessage = page.locator('[class*="error"], .v-alert--type-error').filter({ hasText: /error/i });
  const errorVisible = await errorMessage.isVisible().catch(() => false);
  expect(errorVisible).toBe(false);
});