// Bug #18197: [Settings › FAQs] Right-panel drag handles aria-hidden + focusable — 25 items (WCAG 4.1.2)
// ADO: https://dev.azure.com/vivacityapp/Viva/_workitems/edit/18197
// Auto-generated 2026-08-18
// REVIEW BEFORE MERGING — verify selectors and assertions

import { test, expect } from '@playwright/test';
import { loginToApp } from '../helpers/auth.helper';

test.setTimeout(120000);

test('BUG #18197: FAQ right-panel drag handles should not be aria-hidden and focusable simultaneously', async ({ page }) => {
  await loginToApp(page);

  // Navigate to Settings › FAQs
  await page.goto('https://app-staging.vivacityapp.com/demo-student/settings/faqs');

  // Wait for the page to load and FAQ items to be visible
  await page.waitForSelector('.v-application', { timeout: 30000 });

  // Wait for FAQ items to render in the right panel
  // Look for the right panel content to be present
  await page.waitForTimeout(3000);

  // Check for drag handle elements that violate WCAG 4.1.2
  // Bug: <i role="button" aria-hidden="true" tabindex="0" aria-label="Drag to reorder FAQ: ...">
  // These are the broken right-panel FAQ item drag handles

  // Find all elements that have both aria-hidden="true" AND tabindex="0" (the violation)
  const violatingElements = await page.locator('[aria-hidden="true"][tabindex="0"]').all();

  // Also specifically check for i elements with role="button" and aria-hidden="true"
  const brokenDragHandles = await page.locator('i[role="button"][aria-hidden="true"][tabindex="0"]').all();

  // The fix should result in proper <button> elements for drag handles
  // Check that no drag handles in the right panel FAQ table are aria-hidden AND focusable
  const faqDragHandleViolations = await page.locator(
    'i[aria-hidden="true"][tabindex="0"], i[role="button"][aria-hidden="true"]'
  ).count();

  // If bug is present, there will be violations (25 instances per bug report)
  // Test should FAIL when bug is present (violations > 0) and PASS when fixed (violations = 0)
  expect(faqDragHandleViolations, 
    `Found ${faqDragHandleViolations} FAQ drag handle(s) with aria-hidden="true" and tabindex="0" — violates WCAG 4.1.2 (aria-hidden-focus). These elements are keyboard-focusable but invisible to screen readers.`
  ).toBe(0);

  // Additionally verify that drag handles now use proper <button> elements (the fix)
  // or that aria-hidden is removed if they remain as <i> elements
  const properDragHandles = await page.locator(
    '[aria-label*="Drag to reorder FAQ"]'
  ).all();

  for (const handle of properDragHandles) {
    const tagName = await handle.evaluate(el => el.tagName.toLowerCase());
    const ariaHidden = await handle.getAttribute('aria-hidden');
    const tabIndex = await handle.getAttribute('tabindex');

    // If aria-hidden is true, it should NOT be focusable (tabindex should not be 0 or positive)
    if (ariaHidden === 'true') {
      const tabIndexNum = tabIndex !== null ? parseInt(tabIndex, 10) : -1;
      expect(tabIndexNum, 
        `Drag handle element <${tagName}> with aria-label "Drag to reorder FAQ" has aria-hidden="true" but tabindex="${tabIndex}" — this is a WCAG 4.1.2 violation (aria-hidden-focus)`
      ).toBeLessThan(0);
    }

    // If it's focusable (tabindex >= 0), it should NOT be aria-hidden
    if (tabIndex !== null && parseInt(tabIndex, 10) >= 0) {
      expect(ariaHidden, 
        `Focusable drag handle element <${tagName}> should not have aria-hidden="true" — screen reader users can tab to it but nothing is announced`
      ).not.toBe('true');
    }
  }
});