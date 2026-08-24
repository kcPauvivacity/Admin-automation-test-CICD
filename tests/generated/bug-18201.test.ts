// Bug #18201: [Settings › Media Library] role="img" container wraps focusable children (WCAG 4.1.2)
// ADO: https://dev.azure.com/vivacityapp/Viva/_workitems/edit/18201
// Auto-generated 2026-08-18
// REVIEW BEFORE MERGING — verify selectors and assertions

import { test, expect } from '@playwright/test';
import { loginToApp } from '../helpers/auth.helper';

test.setTimeout(120000);

test('BUG #18201: role="img" container should not contain focusable children in Media Library', async ({ page }) => {
  await loginToApp(page);

  // Navigate to Settings › Media Library
  await page.goto('https://app-staging.vivacityapp.com/demo-student/settings/media-library');

  // Wait for media library to load
  await page.waitForSelector('.file-icon-container', { timeout: 30000 });

  // Find all elements with role="img" that have class file-icon-container
  const violatingContainers = await page.evaluate(() => {
    const imgContainers = document.querySelectorAll('[role="img"].file-icon-container, .file-icon-container[role="img"]');
    
    if (imgContainers.length === 0) {
      return { hasRoleImg: false, violations: [] };
    }

    const focusableSelectors = [
      'a[href]',
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
      'area[href]',
      'iframe',
      'object',
      'embed',
      '[contenteditable]',
    ].join(', ');

    const violations: Array<{ containerIndex: number; focusableCount: number; focusableElements: string[] }> = [];

    imgContainers.forEach((container, index) => {
      const focusableChildren = container.querySelectorAll(focusableSelectors);
      if (focusableChildren.length > 0) {
        const elements = Array.from(focusableChildren).map(el => {
          return `${el.tagName.toLowerCase()}${el.getAttribute('class') ? '.' + el.getAttribute('class')!.split(' ').join('.') : ''}`;
        });
        violations.push({
          containerIndex: index,
          focusableCount: focusableChildren.length,
          focusableElements: elements,
        });
      }
    });

    return { hasRoleImg: imgContainers.length > 0, violations };
  });

  // If there are no role="img" containers at all, check if media cards loaded
  if (!violatingContainers.hasRoleImg) {
    // Try waiting a bit longer and check again
    await page.waitForTimeout(3000);
    
    const retryCheck = await page.evaluate(() => {
      const imgContainers = document.querySelectorAll('[role="img"].file-icon-container, .file-icon-container[role="img"]');
      return imgContainers.length;
    });

    if (retryCheck === 0) {
      // No role="img" containers found at all — bug may already be fixed (role removed)
      // or the page structure is different; pass the test
      console.log('No .file-icon-container[role="img"] elements found — role may have been removed as part of fix');
      return;
    }
  }

  // The test FAILS if violations exist (bug is present)
  // The test PASSES if no focusable children are inside role="img" containers
  expect(
    violatingContainers.violations,
    `Found ${violatingContainers.violations.length} .file-icon-container[role="img"] element(s) containing focusable children. ` +
    `This violates WCAG 4.1.2 (nested-interactive). Violations: ${JSON.stringify(violatingContainers.violations, null, 2)}`
  ).toHaveLength(0);
});