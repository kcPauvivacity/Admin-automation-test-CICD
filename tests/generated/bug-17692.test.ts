// Bug #17692: [Admin] Tags — Page not found (route missing for demo-student tenant)
// ADO: https://dev.azure.com/vivacityapp/Viva/_workitems/edit/17692
// Auto-generated 2026-07-10
// REVIEW BEFORE MERGING — verify selectors and assertions

import { test, expect } from '@playwright/test';
import { loginToApp } from '../helpers/auth.helper';

test.setTimeout(120000);

test('BUG #17692 - Tags page should load for demo-student tenant without Page not found error', async ({ page }) => {
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

  await page.goto('https://app-staging.vivacityapp.com/demo-student/tags', {
    waitUntil: 'networkidle',
  });

  const pageNotFoundErrors = consoleErrors.filter(
    (err) =>
      err.includes('Page not found') ||
      err.includes('/demo-student/tags') ||
      err.includes('error caught during app initialization')
  );

  expect(
    pageNotFoundErrors,
    `Console errors indicating route missing: ${pageNotFoundErrors.join('\n')}`
  ).toHaveLength(0);

  const url = page.url();
  expect(url).toContain('/demo-student/tags');

  const errorPage = page.locator('text=Page not found');
  await expect(errorPage).not.toBeVisible();

  const nuxtErrorPage = page.locator('[data-error], .error-page, .nuxt-error-page');
  await expect(nuxtErrorPage).not.toBeVisible();

  const appRoot = page.locator('.v-application');
  await expect(appRoot).toBeVisible();

  const tagsPageIndicator = page.locator(
    'h1, h2, [class*="tag"], [data-testid*="tag"], .v-card, .v-data-table, .v-list'
  );
  await expect(tagsPageIndicator.first()).toBeVisible({ timeout: 30000 });
});