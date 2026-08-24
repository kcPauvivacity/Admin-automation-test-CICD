// Bug #18199: [Settings › AI Agent] 5 toggle switches have no accessible name (WCAG 4.1.2)
// ADO: https://dev.azure.com/vivacityapp/Viva/_workitems/edit/18199
// Auto-generated 2026-08-18
// REVIEW BEFORE MERGING — verify selectors and assertions

import { test, expect } from '@playwright/test';
import { loginToApp } from '../helpers/auth.helper';

test.setTimeout(120000);

test('BUG #18199: AI Agent toggle switches must have accessible names (WCAG 4.1.2)', async ({ page }) => {
  await loginToApp(page);

  // Navigate to Settings > AI Agent
  await page.goto('https://app-staging.vivacityapp.com/demo-student/system-settings/ai-agent');
  await page.waitForLoadState('networkidle');

  // Click the Details tab if it exists
  const detailsTab = page.locator('[role="tab"]', { hasText: /details/i });
  if (await detailsTab.isVisible()) {
    await detailsTab.click();
    await page.waitForLoadState('networkidle');
  }

  // Wait for toggle switches to appear
  await page.waitForSelector('input[role="switch"]', { timeout: 30000 });

  // Get all toggle switches on the page
  const switches = page.locator('input[role="switch"]');
  const switchCount = await switches.count();

  expect(switchCount).toBeGreaterThan(0);

  const unlabelledSwitches: string[] = [];

  for (let i = 0; i < switchCount; i++) {
    const switchEl = switches.nth(i);
    const switchId = await switchEl.getAttribute('id');
    const ariaLabel = await switchEl.getAttribute('aria-label');
    const ariaLabelledBy = await switchEl.getAttribute('aria-labelledby');

    // Check if there's a <label for="..."> element pointing to this switch
    let hasAssociatedLabel = false;
    if (switchId) {
      const associatedLabel = page.locator(`label[for="${switchId}"]`);
      const labelCount = await associatedLabel.count();
      hasAssociatedLabel = labelCount > 0;
    }

    // Check if aria-labelledby points to an element with non-empty text
    let ariaLabelledByHasText = false;
    if (ariaLabelledBy) {
      const ids = ariaLabelledBy.split(' ').filter(id => id.trim() !== '');
      for (const id of ids) {
        const labelEl = page.locator(`#${id}`);
        const count = await labelEl.count();
        if (count > 0) {
          const text = await labelEl.first().textContent();
          if (text && text.trim().length > 0) {
            ariaLabelledByHasText = true;
            break;
          }
        }
      }
    }

    // Check if aria-label has non-empty text
    const hasAriaLabel = ariaLabel !== null && ariaLabel.trim().length > 0;

    const hasAccessibleName = hasAriaLabel || ariaLabelledByHasText || hasAssociatedLabel;

    if (!hasAccessibleName) {
      unlabelledSwitches.push(switchId || `switch-index-${i}`);
    }
  }

  // The test FAILS if any switches lack accessible names (bug present)
  // The test PASSES when all switches have accessible names (bug fixed)
  expect(
    unlabelledSwitches,
    `The following toggle switches have no accessible name (violates WCAG 4.1.2): ${unlabelledSwitches.join(', ')}`
  ).toHaveLength(0);
});