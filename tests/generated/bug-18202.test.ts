// Bug #18202: [Settings] Missing semantic heading hierarchy (h1-h6) on most list/form pages (WCAG 1.3.1)
// ADO: https://dev.azure.com/vivacityapp/Viva/_workitems/edit/18202
// Auto-generated 2026-08-18
// REVIEW BEFORE MERGING — verify selectors and assertions

import { test, expect } from '@playwright/test';
import { loginToApp } from '../helpers/auth.helper';

test.setTimeout(300000);

test('BUG #18202 - Settings pages must have semantic heading elements (h1-h6) in main content area', async ({ page }) => {
  await loginToApp(page);

  const settingsPages = [
    {
      name: 'Account Defaults - General Info',
      url: '/demo-student/settings/account-defaults',
    },
    {
      name: 'Users',
      url: '/demo-student/settings/users',
    },
    {
      name: 'Tags',
      url: '/demo-student/settings/tags',
    },
    {
      name: 'Attributes',
      url: '/demo-student/settings/attributes',
    },
    {
      name: 'Facilities',
      url: '/demo-student/settings/facilities',
    },
    {
      name: 'Cities',
      url: '/demo-student/settings/cities',
    },
    {
      name: 'Countries',
      url: '/demo-student/settings/countries',
    },
    {
      name: 'Universities',
      url: '/demo-student/settings/universities',
    },
    {
      name: 'Configurations',
      url: '/demo-student/settings/configurations',
    },
    {
      name: 'GDPR Fields',
      url: '/demo-student/settings/gdpr-fields',
    },
    {
      name: 'Media Library',
      url: '/demo-student/settings/media-library',
    },
    {
      name: 'Stations',
      url: '/demo-student/settings/stations',
    },
    {
      name: 'Analytics',
      url: '/demo-student/settings/analytics',
    },
    {
      name: 'Email Templates',
      url: '/demo-student/settings/email-templates',
    },
    {
      name: 'SMS Templates',
      url: '/demo-student/settings/sms-templates',
    },
  ];

  const failures: string[] = [];

  for (const settingsPage of settingsPages) {
    await page.goto(`https://app-staging.vivacityapp.com${settingsPage.url}`);

    // Wait for main content to load
    try {
      await page.waitForSelector('main, [role="main"], .v-main', { timeout: 15000 });
    } catch {
      // Try to wait for any content
      await page.waitForLoadState('domcontentloaded');
    }

    // Wait a bit for dynamic content to render
    await page.waitForSelector('.v-application', { timeout: 10000 });

    // Check if page actually loaded (not redirected to login)
    const currentUrl = page.url();
    if (currentUrl.includes('/login') || currentUrl.includes('/auth')) {
      failures.push(`${settingsPage.name}: Redirected to login, could not test`);
      continue;
    }

    // Look for semantic headings within the main content area
    const headingCount = await page.evaluate(() => {
      // Try to find main content area
      const mainContent =
        document.querySelector('main') ||
        document.querySelector('[role="main"]') ||
        document.querySelector('.v-main') ||
        document.querySelector('.v-main__wrap') ||
        document.body;

      if (!mainContent) return 0;

      const headings = mainContent.querySelectorAll('h1, h2, h3, h4, h5, h6');
      return headings.length;
    });

    if (headingCount === 0) {
      failures.push(
        `${settingsPage.name} (${settingsPage.url}): No semantic heading elements (h1-h6) found in main content area`
      );
    }
  }

  // Assert no failures - test FAILS when bug is present, PASSES when fixed
  expect(
    failures,
    `WCAG 1.3.1 violation: The following Settings pages are missing semantic headings:\n${failures.join('\n')}`
  ).toHaveLength(0);
});

test('BUG #18202 - Account Defaults tabs must have semantic headings', async ({ page }) => {
  await loginToApp(page);

  await page.goto('https://app-staging.vivacityapp.com/demo-student/settings/account-defaults');
  await page.waitForSelector('.v-application', { timeout: 15000 });

  const currentUrl = page.url();
  if (currentUrl.includes('/login') || currentUrl.includes('/auth')) {
    test.skip(true, 'Redirected to login');
  }

  const tabsToCheck = ['General Info', 'Sub Accounts', 'Pricing'];
  const failures: string[] = [];

  for (const tabName of tabsToCheck) {
    // Try to click on the tab if it exists
    const tabLocator = page.locator(`.v-tab, [role="tab"]`).filter({ hasText: tabName });
    const tabExists = await tabLocator.count();

    if (tabExists > 0) {
      await tabLocator.first().click();
      await page.waitForTimeout(1000);
    }

    const headingCount = await page.evaluate(() => {
      const mainContent =
        document.querySelector('main') ||
        document.querySelector('[role="main"]') ||
        document.querySelector('.v-main') ||
        document.querySelector('.v-main__wrap') ||
        document.body;

      if (!mainContent) return 0;

      const headings = mainContent.querySelectorAll('h1, h2, h3, h4, h5, h6');
      return headings.length;
    });

    if (headingCount === 0) {
      failures.push(
        `Account Defaults - "${tabName}" tab: No semantic heading elements (h1-h6) found`
      );
    }
  }

  expect(
    failures,
    `WCAG 1.3.1 violation on Account Defaults tabs:\n${failures.join('\n')}`
  ).toHaveLength(0);
});

test('BUG #18202 - Verify pages with correct headings still pass (control test)', async ({ page }) => {
  await loginToApp(page);

  const pagesWithCorrectHeadings = [
    {
      name: 'Notifications',
      url: '/demo-student/settings/notifications',
    },
  ];

  for (const settingsPage of pagesWithCorrectHeadings) {
    await page.goto(`https://app-staging.vivacityapp.com${settingsPage.url}`);
    await page.waitForSelector('.v-application', { timeout: 15000 });

    const currentUrl = page.url();
    if (currentUrl.includes('/login') || currentUrl.includes('/auth')) {
      test.skip(true, 'Redirected to login');
      continue;
    }

    const headingCount = await page.evaluate(() => {
      const mainContent =
        document.querySelector('main') ||
        document.querySelector('[role="main"]') ||
        document.querySelector('.v-main') ||
        document.querySelector('.v-main__wrap') ||
        document.body;

      if (!mainContent) return 0;

      const headings = mainContent.querySelectorAll('h1, h2, h3, h4, h5, h6');
      return headings.length;
    });

    expect(
      headingCount,
      `${settingsPage.name} should have semantic headings (it was listed as a page with correct heading hierarchy)`
    ).toBeGreaterThan(0);
  }
});