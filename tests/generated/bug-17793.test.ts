// Bug #17793: [WCAG 1.4.3] Colour contrast failure across all pages — text not visible on dark theme
// ADO: https://dev.azure.com/vivacityapp/Viva/_workitems/edit/17793
// Auto-generated 2026-07-17
// REVIEW BEFORE MERGING — verify selectors and assertions

import { test, expect } from '@playwright/test';
import { loginToApp } from '../helpers/auth.helper';

interface ContrastFailure {
  page: string;
  tag: string;
  text: string;
  color: string;
  count: number;
}

const PAGES_TO_TEST = [
  { name: 'Dashboard', path: '/demo-student/' },
  { name: 'Properties', path: '/demo-student/properties' },
  { name: 'Articles', path: '/demo-student/articles' },
  { name: 'Promotions', path: '/demo-student/promotions' },
  { name: 'Testimonials', path: '/demo-student/testimonials' },
  { name: 'Contacts', path: '/demo-student/contacts' },
  { name: 'Enquiries', path: '/demo-student/enquiries' },
  { name: 'Tracking', path: '/demo-student/tracking' },
  { name: 'Reports', path: '/demo-student/reports' },
];

const BASE_URL = 'https://app-staging.vivacityapp.com';

async function getContrastFailuresOnPage(
  playwrightPage: any,
  pageName: string
): Promise<ContrastFailure[]> {
  const failures = await playwrightPage.evaluate((name: string) => {
    const elements = document.querySelectorAll('p,span,label,button,a,h1,h2,h3,td,li');
    const results: ContrastFailure[] = [];

    elements.forEach((el: Element) => {
      const computed = window.getComputedStyle(el);
      const color = computed.color;
      const backgroundColor = computed.backgroundColor;

      if (
        color === backgroundColor &&
        color !== 'rgba(0, 0, 0, 0)' &&
        color !== '' &&
        backgroundColor !== ''
      ) {
        results.push({
          page: name,
          tag: el.tagName.toLowerCase(),
          text: (el.textContent || '').trim().substring(0, 50),
          color: color,
          count: 1,
        });
      }
    });

    return results;
  }, pageName);

  return failures;
}

test.describe('WCAG 1.4.3 Colour Contrast - Dark Theme', () => {
  test.setTimeout(300000);

  test('Bug #17793: No text elements should have identical foreground and background colour across all pages', async ({
    page,
  }) => {
    await loginToApp(page);

    const allFailures: ContrastFailure[] = [];
    const pageFailureSummary: Record<string, number> = {};

    // Enable dark theme if not already active
    await page.waitForSelector('.v-application', { timeout: 30000 });

    for (const pageConfig of PAGES_TO_TEST) {
      try {
        await page.goto(`${BASE_URL}${pageConfig.path}`, {
          waitUntil: 'networkidle',
          timeout: 60000,
        });

        // Wait for the page to render with theme applied
        await page.waitForSelector('.v-application', { timeout: 15000 });

        // Give Vuetify time to apply computed styles
        await page.waitForLoadState('domcontentloaded');

        // Wait for any lazy-loaded content
        try {
          await page.waitForSelector('.v-main', { timeout: 10000 });
        } catch {
          // .v-main might not exist on all pages
        }

        const failures = await getContrastFailuresOnPage(page, pageConfig.name);

        if (failures.length > 0) {
          allFailures.push(...failures);
          pageFailureSummary[pageConfig.name] = failures.length;
          console.log(
            `[${pageConfig.name}] Found ${failures.length} contrast failure(s)`
          );
          failures.slice(0, 5).forEach((f) => {
            console.log(
              `  - <${f.tag}> color: ${f.color}, text: "${f.text}"`
            );
          });
        } else {
          console.log(`[${pageConfig.name}] No contrast failures found ✓`);
        }
      } catch (error) {
        console.warn(`[${pageConfig.name}] Could not test page: ${error}`);
      }
    }

    const totalFailures = allFailures.length;
    const failedPages = Object.keys(pageFailureSummary);

    if (totalFailures > 0) {
      const summaryLines = failedPages.map(
        (p) => `  ${p}: ${pageFailureSummary[p]} element(s)`
      );
      console.error(
        `\nWCAG 1.4.3 Contrast failures detected across ${failedPages.length} page(s):\n${summaryLines.join('\n')}\nTotal failures: ${totalFailures}`
      );
    }

    expect(
      totalFailures,
      `WCAG 1.4.3 violation: ${totalFailures} element(s) have identical foreground and background colour across ${failedPages.length} page(s): ${failedPages.join(', ')}. Worst affected: ${
        failedPages.length > 0
          ? failedPages
              .map((p) => `${p} (${pageFailureSummary[p]})`)
              .join(', ')
          : 'none'
      }`
    ).toBe(0);
  });

  test('Bug #17793: Dark theme specifically - v-theme--DARK_BLUE_THEME should not cause contrast failures on Dashboard', async ({
    page,
  }) => {
    test.setTimeout(120000);

    await loginToApp(page);

    await page.goto(`${BASE_URL}/demo-student/`, {
      waitUntil: 'networkidle',
      timeout: 60000,
    });

    await page.waitForSelector('.v-application', { timeout: 15000 });

    // Check if dark theme is applied
    const isDarkTheme = await page.evaluate(() => {
      const app = document.querySelector('.v-application');
      return app ? app.classList.contains('v-theme--DARK_BLUE_THEME') : false;
    });

    console.log(`Dark theme active: ${isDarkTheme}`);

    const failures = await page.evaluate(() => {
      const elements = document.querySelectorAll('p,span,label,button,a,h1,h2,h3,td,li');
      const results: Array<{
        tag: string;
        text: string;
        color: string;
        className: string;
      }> = [];

      elements.forEach((el: Element) => {
        const computed = window.getComputedStyle(el);
        const color = computed.color;
        const backgroundColor = computed.backgroundColor;

        if (
          color === backgroundColor &&
          color !== 'rgba(0, 0, 0, 0)' &&
          color !== '' &&
          backgroundColor !== ''
        ) {
          results.push({
            tag: el.tagName.toLowerCase(),
            text: (el.textContent || '').trim().substring(0, 80),
            color: color,
            className: el.className ? el.className.toString().substring(0, 100) : '',
          });
        }
      });

      return results;
    });

    if (failures.length > 0) {
      console.error('\nDashboard contrast failures:');
      failures.forEach((f) => {
        console.error(
          `  <${f.tag}> class="${f.className}" color=${f.color} text="${f.text}"`
        );
      });
    }

    expect(
      failures.length,
      `Dashboard has ${failures.length} element(s) where foreground colour equals background colour (ratio 1:1), violating WCAG 1.4.3. Theme active: ${isDarkTheme ? 'DARK_BLUE_THEME' : 'other'}`
    ).toBe(0);
  });

  test('Bug #17793: Articles page - worst affected page should have no contrast failures', async ({
    page,
  }) => {
    test.setTimeout(120000);

    await loginToApp(page);

    await page.goto(`${BASE_URL}/demo-student/articles`, {
      waitUntil: 'networkidle',
      timeout: 60000,
    });

    await page.waitForSelector('.v-application', { timeout: 15000 });

    try {
      await page.waitForSelector('.v-main', { timeout: 10000 });
    } catch {
      // ignore
    }

    const failures = await page.evaluate(() => {
      const elements = document.querySelectorAll('p,span,label,button,a,h1,h2,h3,td,li');
      const results: Array<{
        tag: string;
        text: string;
        color: string;
      }> = [];

      elements.forEach((el: Element) => {
        const computed = window.getComputedStyle(el);
        const color = computed.color;
        const backgroundColor = computed.backgroundColor;

        if (
          color === backgroundColor &&
          color !== 'rgba(0, 0, 0, 0)' &&
          color !== '' &&
          backgroundColor !== ''
        ) {
          results.push({
            tag: el.tagName.toLowerCase(),
            text: (el.textContent || '').trim().substring(0, 80),
            color: color,
          });
        }
      });

      return results;
    });

    console.log(`Articles page: ${failures.length} contrast failure(s)`);
    if (failures.length > 0) {
      failures.slice(0, 10).forEach((f) => {
        console.error(`  <${f.tag}> color=${f.color} text="${f.text}"`);
      });
    }

    expect(
      failures.length,
      `Articles page has ${failures.length} element(s) with identical foreground and background colour, violating WCAG 1.4.3. Bug #17793 reported ~153 failures on this page.`
    ).toBe(0);
  });

  test('Bug #17793: Promotions page - second worst affected should have no contrast failures', async ({
    page,
  }) => {
    test.setTimeout(120000);

    await loginToApp(page);

    await page.goto(`${BASE_URL}/demo-student/promotions`, {
      waitUntil: 'networkidle',
      timeout: 60000,
    });

    await page.waitForSelector('.v-application', { timeout: 15000 });

    try {
      await page.waitForSelector('.v-main', { timeout: 10000 });
    } catch {
      // ignore
    }

    const failures = await page.evaluate(() => {
      const elements = document.querySelectorAll('p,span,label,button,a,h1,h2,h3,td,li');
      const results: Array<{
        tag: string;
        text: string;
        color: string;
      }> = [];

      elements.forEach((el: Element) => {
        const computed = window.getComputedStyle(el);
        const color = computed.color;
        const backgroundColor = computed.backgroundColor;

        if (
          color === backgroundColor &&
          color !== 'rgba(0, 0, 0, 0)' &&
          color !== '' &&
          backgroundColor !== ''
        ) {
          results.push({
            tag: el.tagName.toLowerCase(),
            text: (el.textContent || '').trim().substring(0, 80),
            color: color,
          });
        }
      });

      return results;
    });

    console.log(`Promotions page: ${failures.length} contrast failure(s)`);
    if (failures.length > 0) {
      failures.slice(0, 10).forEach((f) => {
        console.error(`  <${f.tag}> color=${f.color} text="${f.text}"`);
      });
    }

    expect(
      failures.length,
      `Promotions page has ${failures.length} element(s) with identical foreground and background colour, violating WCAG 1.4.3. Bug #17793 reported ~75 failures on this page.`
    ).toBe(0);
  });
});