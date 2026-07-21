// Bug #17689: [Admin] Cities — Page not found (route missing for demo-student tenant)
// ADO: https://dev.azure.com/vivacityapp/Viva/_workitems/edit/17689
// Auto-generated 2026-07-10
// REVIEW BEFORE MERGING — verify selectors and assertions

import { test, expect } from '@playwright/test';
import { loginToApp } from '../helpers/auth.helper';

test('Bug #17689 - Cities page should load for demo-student tenant without Page not found error', async ({ page }) => {
  test.setTimeout(120000);

  const consoleErrors: string[] = [];

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  page.on('pageerror', (err) => {
    consoleErrors.push(err.message);
  });

  await loginToApp(page);

  await page.goto('https://app-staging.vivacityapp.com/demo-student/cities', {
    waitUntil: 'networkidle',
  });

  const pageNotFoundErrors = consoleErrors.filter(
    (error) =>
      error.includes('Page not found') ||
      error.includes('/demo-student/cities')
  );

  expect(
    pageNotFoundErrors,
    `Console errors indicating route missing: ${pageNotFoundErrors.join(', ')}`
  ).toHaveLength(0);

  const nuxtErrorVisible = await page.locator('text=Page not found').isVisible().catch(() => false);
  expect(nuxtErrorVisible, 'Page should not show "Page not found" error').toBe(false);

  const errorPageVisible = await page.locator('[data-error], .error-page, #error-page').isVisible().catch(() => false);
  expect(errorPageVisible, 'Error page should not be visible').toBe(false);

  await expect(
    page.locator('.v-application'),
    'Vuetify application container should be visible'
  ).toBeVisible({ timeout: 30000 });

  const currentUrl = page.url();
  expect(currentUrl).toContain('/demo-student/cities');

  const citiesPageContent = page.locator(
    'text=Cities, [data-testid="cities"], .cities-page, h1, h2, .v-data-table, .v-list'
  );
  await expect(citiesPageContent.first()).toBeVisible({ timeout: 30000 });
});