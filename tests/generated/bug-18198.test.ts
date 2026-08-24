// Bug #18198: [Settings › Email Notifications] aria-owns references non-existent element on combobox (WCAG 4.1.2)
// ADO: https://dev.azure.com/vivacityapp/Viva/_workitems/edit/18198
// Auto-generated 2026-08-18
// REVIEW BEFORE MERGING — verify selectors and assertions

import { test, expect } from '@playwright/test';
import { loginToApp } from '../helpers/auth.helper';

test.setTimeout(120000);

test('BUG #18198: aria-owns on Email Notifications combobox references a valid DOM element', async ({ page }) => {
  await loginToApp(page);

  // Navigate to Settings › Email Notifications
  await page.goto('https://app-staging.vivacityapp.com/demo-student/settings/email-notifications');

  // Wait for the page to fully load
  await page.waitForLoadState('networkidle');

  // Wait for a combobox element to appear on the page
  const combobox = page.locator('[role="combobox"]').first();
  await expect(combobox).toBeVisible({ timeout: 30000 });

  // Get the aria-owns attribute from the combobox
  const ariaOwns = await combobox.getAttribute('aria-owns');

  // If there's no aria-owns attribute, check aria-controls as Vuetify may use either
  let referencedId = ariaOwns;

  if (!referencedId) {
    const ariaControls = await combobox.getAttribute('aria-controls');
    referencedId = ariaControls;
  }

  // The combobox must have either aria-owns or aria-controls
  expect(
    referencedId,
    'Combobox must have aria-owns or aria-controls attribute referencing the listbox'
  ).toBeTruthy();

  if (referencedId) {
    // Check all referenced IDs (aria-owns can contain multiple space-separated IDs)
    const ids = referencedId.trim().split(/\s+/);

    for (const id of ids) {
      if (!id) continue;

      // Verify that each referenced element actually exists in the DOM
      const referencedElement = await page.$(`#${CSS.escape(id)}`);

      expect(
        referencedElement,
        `aria-owns/aria-controls references id="${id}" but no element with that id exists in the DOM. ` +
        `This breaks WCAG 4.1.2 Name, Role, Value (axe rule: aria-valid-attr-value).`
      ).not.toBeNull();
    }
  }

  // Additionally, open the combobox dropdown and verify the aria-owns target is present and visible
  await combobox.click();

  // Wait for the dropdown to appear
  await page.waitForTimeout(500);

  // Re-check aria-owns after interaction (the menu may render lazily)
  const ariaOwnsAfterClick = await combobox.getAttribute('aria-owns');
  const ariaControlsAfterClick = await combobox.getAttribute('aria-controls');
  const referencedIdAfterClick = ariaOwnsAfterClick || ariaControlsAfterClick;

  if (referencedIdAfterClick) {
    const idsAfterClick = referencedIdAfterClick.trim().split(/\s+/);

    for (const id of idsAfterClick) {
      if (!id) continue;

      const elementExists = await page.evaluate((elementId) => {
        return document.getElementById(elementId) !== null;
      }, id);

      expect(
        elementExists,
        `After opening dropdown: aria-owns/aria-controls references id="${id}" but document.getElementById('${id}') returns null. ` +
        `Bug #18198: The Vuetify-generated menu element has a different dynamic ID at runtime, so the aria-owns reference is broken.`
      ).toBe(true);
    }
  }
});