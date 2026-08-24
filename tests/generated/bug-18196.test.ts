// Bug #18196: [Settings › FAQs] aria-selected on invalid role — 25 list items (WCAG 4.1.2)
// ADO: https://dev.azure.com/vivacityapp/Viva/_workitems/edit/18196
// Auto-generated 2026-08-18
// REVIEW BEFORE MERGING — verify selectors and assertions

import { test, expect } from '@playwright/test';
import { loginToApp } from '../helpers/auth.helper';

test.setTimeout(120000);

test('BUG #18196: FAQ group list items should not have aria-selected attribute', async ({ page }) => {
  await loginToApp(page, 90000, 'pau.kie.chee@fusioneta.com', 'PAOpaopao@9696');

  await page.goto('https://app-staging.vivacityapp.com/fusioneta/system-settings/faqs');

  await page.waitForSelector('.v-list-item', { timeout: 30000 });

  // Wait for FAQ group list items to be visible
  const listItems = page.locator('.v-list-item--link');
  await expect(listItems.first()).toBeVisible({ timeout: 30000 });

  const count = await listItems.count();
  expect(count).toBeGreaterThan(0);

  // Check each list item for the invalid aria-selected attribute
  const itemsWithAriaSelected: number[] = [];

  for (let i = 0; i < count; i++) {
    const item = listItems.nth(i);
    const ariaSelected = await item.getAttribute('aria-selected');
    if (ariaSelected !== null) {
      itemsWithAriaSelected.push(i);
    }
  }

  // The test FAILS if aria-selected is present on list items (bug present)
  // The test PASSES when aria-selected is removed (bug fixed)
  expect(
    itemsWithAriaSelected.length,
    `Found ${itemsWithAriaSelected.length} FAQ list item(s) with invalid aria-selected attribute at indices: [${itemsWithAriaSelected.join(', ')}]. ` +
    `aria-selected is not valid on elements without role option/row/gridcell/treeitem/tab (WCAG 4.1.2).`
  ).toBe(0);
});