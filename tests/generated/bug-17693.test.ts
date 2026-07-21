// Bug #17693: [Admin] Universities — Page not found (route missing for demo-student tenant)
// ADO: https://dev.azure.com/vivacityapp/Viva/_workitems/edit/17693
// Auto-generated 2026-07-10
// REVIEW BEFORE MERGING — verify selectors and assertions

import { test, expect } from '@playwright/test';
import { loginToApp } from '../helpers/auth.helper';

test.setTimeout(120000);

test('BUG #17693 - Universities page should load for demo-student tenant without page not found error', async ({ page }) => {
  const consoleErrors: string[] = [];

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  await loginToApp(page);

  await page.goto('https://app-staging.vivacityapp.com/demo-student/universities', {
    waitUntil: 'networkidle',
  });

  // Check that the page does not show a "Page not found" error
  const pageNotFoundNuxt = consoleErrors.some(
    (err) => err.includes('Page not found') && err.includes('/demo-student/universities')
  );
  expect(pageNotFoundNuxt, 'Nuxt reported "Page not found" for /demo-student/universities').toBe(false);

  // Verify no generic nuxt initialization error is present
  const nuxtInitError = consoleErrors.some(
    (err) => err.includes('[nuxt] error caught during app initialization') && err.includes('Page not found')
  );
  expect(nuxtInitError, 'Nuxt reported an initialization error for /demo-student/universities').toBe(false);

  // Verify the page URL is correct (no redirect to error page)
  expect(page.url()).toContain('/demo-student/universities');

  // Verify the page does not show a 404 or error heading
  const errorHeading = page.locator('text=Page not found').or(page.locator('text=404')).first();
  const isErrorVisible = await errorHeading.isVisible().catch(() => false);
  expect(isErrorVisible, 'A "Page not found" or 404 message is visible on the page').toBe(false);

  // Verify the Vuetify application shell is rendered (page loaded successfully)
  await expect(page.locator('.v-application')).toBeVisible({ timeout: 30000 });

  // Verify universities content is visible (heading or data table)
  const universitiesContent = page.locator('text=Universities').or(page.locator('.v-data-table')).first();
  await expect(universitiesContent).toBeVisible({ timeout: 30000 });
});