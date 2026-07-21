// Bug #17688: [Admin] Attributes — Page not found (route missing for demo-student tenant)
// ADO: https://dev.azure.com/vivacityapp/Viva/_workitems/edit/17688
// Auto-generated 2026-07-10
// REVIEW BEFORE MERGING — verify selectors and assertions

import { test, expect } from '@playwright/test';
import { loginToApp } from '../helpers/auth.helper';

test.setTimeout(120000);

test('BUG #17688 - Attributes page loads for demo-student tenant without Page not found error', async ({ page }) => {
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

  await page.goto('https://app-staging.vivacityapp.com/demo-student/attributes', {
    waitUntil: 'networkidle',
  });

  // Check that we are not on a 404 / error page
  const pageContent = await page.content();
  expect(pageContent).not.toContain('Page not found');
  expect(pageContent).not.toContain('404');

  // Verify no nuxt page-not-found console errors were emitted
  const pageNotFoundErrors = consoleErrors.filter((err) =>
    err.toLowerCase().includes('page not found')
  );
  expect(pageNotFoundErrors).toHaveLength(0);

  // Verify no nuxt initialization errors related to this route
  const initErrors = consoleErrors.filter(
    (err) =>
      err.toLowerCase().includes('error caught during app initialization') &&
      err.includes('/demo-student/attributes')
  );
  expect(initErrors).toHaveLength(0);

  // Verify the page renders meaningful content (not a blank/error shell)
  const appRoot = page.locator('.v-application');
  await expect(appRoot).toBeVisible({ timeout: 30000 });

  // The URL should remain at the attributes route (no redirect to error page)
  expect(page.url()).toContain('/demo-student/attributes');

  // Verify some attributes-related content is visible on the page
  // The page should have loaded and rendered actual content
  const mainContent = page.locator('main, .v-main, [role="main"]');
  await expect(mainContent).toBeVisible({ timeout: 30000 });
});