// Bug #17690: [Admin] Facilities — Page not found (route missing for demo-student tenant)
// ADO: https://dev.azure.com/vivacityapp/Viva/_workitems/edit/17690
// Auto-generated 2026-07-10
// REVIEW BEFORE MERGING — verify selectors and assertions

import { test, expect } from '@playwright/test';
import { loginToApp } from '../helpers/auth.helper';

test('Bug #17690 - Facilities page should render for demo-student tenant without 404', async ({ page }) => {
  test.setTimeout(120000);

  const consoleErrors: string[] = [];

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  await loginToApp(page);

  await page.goto('https://app-staging.vivacityapp.com/demo-student/facilities', {
    waitUntil: 'networkidle',
  });

  // Verify no "Page not found" Nuxt error in console
  const nuxtPageNotFoundErrors = consoleErrors.filter(
    (err) => err.includes('Page not found') && err.includes('/demo-student/facilities')
  );
  expect(nuxtPageNotFoundErrors, `Nuxt reported page not found errors: ${nuxtPageNotFoundErrors.join(', ')}`).toHaveLength(0);

  // Verify the URL did not redirect away from the facilities page (e.g., to a 404 or error page)
  expect(page.url()).toContain('/demo-student/facilities');

  // Verify the page does not show a 404 or error state
  const errorPageText = await page.locator('body').innerText();
  expect(errorPageText.toLowerCase()).not.toContain('page not found');
  expect(errorPageText.toLowerCase()).not.toContain('404');

  // Verify a meaningful page element is visible (the app rendered successfully)
  await expect(page.locator('.v-application')).toBeVisible();

  // Ensure no generic nuxt error boundary is shown
  const nuxtErrorEl = page.locator('[data-v-inspector], #__nuxt-error, .error-page');
  const nuxtErrorCount = await nuxtErrorEl.count();
  if (nuxtErrorCount > 0) {
    const nuxtErrorVisible = await nuxtErrorEl.first().isVisible();
    expect(nuxtErrorVisible, 'A Nuxt error page is visible, indicating the route failed').toBe(false);
  }
});