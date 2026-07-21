// Bug #17798: [WCAG 4.1.2] Dashboard icon-only buttons missing aria-label
// ADO: https://dev.azure.com/vivacityapp/Viva/_workitems/edit/17798
// Auto-generated 2026-07-17
// REVIEW BEFORE MERGING — verify selectors and assertions

import { test, expect } from '@playwright/test';
import { loginToApp } from '../helpers/auth.helper';

test.setTimeout(120000);

test('BUG #17798: Dashboard icon-only buttons must have aria-label or title for WCAG 4.1.2', async ({ page }) => {
  await loginToApp(page);

  await page.goto('https://app-staging.vivacityapp.com/demo-student/dashboard');

  await page.waitForSelector('.v-application', { timeout: 30000 });

  // Wait for dashboard content to load
  await page.waitForLoadState('networkidle', { timeout: 30000 });

  // Find all icon-only buttons that are missing an accessible name
  const unnamedIconButtons = await page.evaluate(() => {
    const results: Array<{
      outerHTML: string;
      classes: string;
      textContent: string;
    }> = [];

    const buttons = document.querySelectorAll('button');

    buttons.forEach((btn) => {
      // Check if it's an icon-only button (Vuetify icon button class or has no visible text)
      const isIconButton =
        btn.classList.contains('v-btn--icon') ||
        btn.querySelector('svg') !== null ||
        btn.querySelector('.v-icon') !== null;

      if (!isIconButton) return;

      const visibleText = (btn.textContent || '').trim();
      const ariaLabel = btn.getAttribute('aria-label');
      const title = btn.getAttribute('title');
      const ariaLabelledBy = btn.getAttribute('aria-labelledby');

      // Check if aria-labelledby references a valid element with text
      let labelledByText = '';
      if (ariaLabelledBy) {
        const labelEl = document.getElementById(ariaLabelledBy);
        labelledByText = labelEl ? (labelEl.textContent || '').trim() : '';
      }

      const hasAccessibleName =
        (ariaLabel && ariaLabel.trim().length > 0) ||
        (title && title.trim().length > 0) ||
        labelledByText.length > 0 ||
        visibleText.length > 0;

      if (!hasAccessibleName) {
        results.push({
          outerHTML: btn.outerHTML.substring(0, 300),
          classes: btn.className,
          textContent: visibleText,
        });
      }
    });

    return results;
  });

  // Log the unnamed buttons for debugging
  if (unnamedIconButtons.length > 0) {
    console.log(`Found ${unnamedIconButtons.length} icon-only button(s) missing accessible name:`);
    unnamedIconButtons.forEach((btn, i) => {
      console.log(`  [${i + 1}] classes: "${btn.classes}"`);
      console.log(`       outerHTML: ${btn.outerHTML}`);
    });
  }

  // This assertion FAILS when bug is present (unnamed buttons found),
  // and PASSES when fixed (all icon-only buttons have accessible names)
  expect(
    unnamedIconButtons.length,
    `Found ${unnamedIconButtons.length} icon-only button(s) on Dashboard without accessible name (aria-label, title, or visible text). ` +
      `WCAG 4.1.2 requires all UI components to have a programmatically determinable name. ` +
      `Unnamed buttons: ${JSON.stringify(unnamedIconButtons.map(b => b.classes))}`
  ).toBe(0);
});

test('BUG #17798: Specifically verify Vuetify v-btn--icon buttons have aria-label on Dashboard', async ({ page }) => {
  await loginToApp(page);

  await page.goto('https://app-staging.vivacityapp.com/demo-student/dashboard');

  await page.waitForSelector('.v-application', { timeout: 30000 });
  await page.waitForLoadState('networkidle', { timeout: 30000 });

  // Wait for any lazy-loaded components
  await page.waitForSelector('button', { timeout: 15000 });

  // Target Vuetify icon-only buttons specifically
  const vuetifyIconButtons = page.locator('button.v-btn--icon');
  const count = await vuetifyIconButtons.count();

  console.log(`Found ${count} Vuetify icon-only button(s) on Dashboard`);

  const violations: string[] = [];

  for (let i = 0; i < count; i++) {
    const btn = vuetifyIconButtons.nth(i);

    const ariaLabel = await btn.getAttribute('aria-label');
    const title = await btn.getAttribute('title');
    const ariaLabelledBy = await btn.getAttribute('aria-labelledby');
    const textContent = (await btn.textContent() || '').trim();

    let hasAccessibleName = false;

    if (ariaLabel && ariaLabel.trim().length > 0) {
      hasAccessibleName = true;
    } else if (title && title.trim().length > 0) {
      hasAccessibleName = true;
    } else if (textContent.length > 0) {
      hasAccessibleName = true;
    } else if (ariaLabelledBy) {
      // Check if the referenced element exists and has text
      const labelText = await page.evaluate((id) => {
        const el = document.getElementById(id);
        return el ? (el.textContent || '').trim() : '';
      }, ariaLabelledBy);
      if (labelText.length > 0) hasAccessibleName = true;
    }

    if (!hasAccessibleName) {
      const outerHTML = await btn.evaluate((el) => el.outerHTML.substring(0, 200));
      violations.push(`Button [${i}]: ${outerHTML}`);
    }
  }

  if (violations.length > 0) {
    console.log('Violations found:');
    violations.forEach((v) => console.log(' -', v));
  }

  expect(
    violations.length,
    `WCAG 4.1.2 violation: ${violations.length} Vuetify icon-only button(s) on Dashboard are missing aria-label or title. ` +
      `Each icon-only button must have a descriptive aria-label so screen readers can announce its purpose. ` +
      `Violations:\n${violations.join('\n')}`
  ).toBe(0);
});