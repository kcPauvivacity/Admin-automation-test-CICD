// Bug #17687: [Admin] Analytics — Page not found (route missing for demo-student tenant)
// ADO: https://dev.azure.com/vivacityapp/Viva/_workitems/edit/17687
// Auto-generated 2026-07-10
// REVIEW BEFORE MERGING — verify selectors and assertions

import { test, expect } from '@playwright/test';
import { loginToApp } from '../helpers/auth.helper';

test.setTimeout(120000);

test('BUG #17687 - Analytics page should load for demo-student tenant without page not found error', async ({ page }) => {
  const nuxtErrors: string[] = [];
  const consoleErrors: string[] = [];

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      const text = msg.text();
      consoleErrors.push(text);
      if (text.includes('Page not found') || text.includes('error caught during app initialization')) {
        nuxtErrors.push(text);
      }
    }
  });

  page.on('pageerror', (err) => {
    const message = err.message;
    if (message.includes('Page not found') || message.includes('error caught during app initialization')) {
      nuxtErrors.push(message);
    }
  });

  await loginToApp(page);

  await page.goto('https://app-staging.vivacityapp.com/demo-student/analytics', {
    waitUntil: 'networkidle',
    timeout: 60000,
  });

  // Verify the page did not throw a Nuxt "Page not found" error
  expect(
    nuxtErrors,
    `Nuxt reported "Page not found" errors: ${nuxtErrors.join(', ')}`
  ).toHaveLength(0);

  // Verify the URL still contains the analytics path (no redirect to error page)
  expect(page.url()).toContain('/demo-student/analytics');

  // Verify we are NOT on a 404 or error page
  const pageNotFoundVisible = await page.locator('text=Page not found').isVisible().catch(() => false);
  expect(pageNotFoundVisible, 'Page displayed "Page not found" text').toBe(false);

  const nuxtErrorVisible = await page.locator('[data-error], .nuxt-error, .error-page').isVisible().catch(() => false);
  expect(nuxtErrorVisible, 'A Nuxt error page/component is visible').toBe(false);

  // Verify the Vuetify app wrapper is present and rendered correctly
  const appWrapper = page.locator('.v-application');
  await expect(appWrapper).toBeVisible({ timeout: 30000 });

  // Verify some meaningful analytics content is rendered (not a blank/error state)
  // Wait for the main content area to appear
  const mainContent = page.locator('.v-main, main, [role="main"]');
  await expect(mainContent).toBeVisible({ timeout: 30000 });
});