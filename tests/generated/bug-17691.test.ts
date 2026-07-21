// Bug #17691: [Admin] FAQ — Page not found (route missing for demo-student tenant)
// ADO: https://dev.azure.com/vivacityapp/Viva/_workitems/edit/17691
// Auto-generated 2026-07-10
// REVIEW BEFORE MERGING — verify selectors and assertions

import { test, expect } from '@playwright/test';
import { loginToApp } from '../helpers/auth.helper';

test('BUG #17691 - FAQ route exists for demo-student tenant', async ({ page }) => {
  test.setTimeout(120000);

  const consoleErrors: string[] = [];

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  await loginToApp(page);

  await page.goto('https://app-staging.vivacityapp.com/demo-student/faq', {
    waitUntil: 'networkidle',
  });

  // Verify no "Page not found" Nuxt error in console
  const nuxtPageNotFoundErrors = consoleErrors.filter(
    (err) => err.includes('Page not found') && err.includes('/demo-student/faq')
  );

  expect(
    nuxtPageNotFoundErrors,
    `Nuxt reported "Page not found" for /demo-student/faq: ${nuxtPageNotFoundErrors.join('\n')}`
  ).toHaveLength(0);

  // Verify the page does not show a 404 or error page
  const pageContent = await page.content();
  expect(pageContent).not.toContain('Page not found');
  expect(pageContent).not.toContain('404');

  // Verify the URL did not redirect away from the FAQ page (i.e. route exists)
  expect(page.url()).toContain('/demo-student/faq');

  // Verify the app rendered correctly (Vuetify application shell is present)
  await expect(page.locator('.v-application')).toBeVisible();

  // Verify there is no error/not-found component visible
  const notFoundElement = page.locator('[data-testid="not-found"], .nuxt-error, .error-page');
  await expect(notFoundElement).toHaveCount(0);

  // Verify FAQ content is rendered (some meaningful content on the page)
  const mainContent = page.locator('main, .v-main, #app');
  await expect(mainContent).toBeVisible();
});