// Bug #18200: [Settings › GDPR Fields] Nested interactive element in drag list (WCAG 4.1.2)
// ADO: https://dev.azure.com/vivacityapp/Viva/_workitems/edit/18200
// Auto-generated 2026-08-18
// REVIEW BEFORE MERGING — verify selectors and assertions

import { test, expect } from '@playwright/test';
import { loginToApp } from '../helpers/auth.helper';

test.setTimeout(120000);

test('BUG #18200 - GDPR Fields Enquiries tab: drag handle should not be independently focusable inside interactive list item (WCAG 4.1.2 nested-interactive)', async ({ page }) => {
  await loginToApp(page, 90000, 'pau.kie.chee@fusioneta.com', 'PAOpaopao@9696');

  await page.goto('https://app-staging.vivacityapp.com/fusioneta/system-settings/gdpr-fields');
  await page.waitForSelector('.v-application', { timeout: 30000 });

  // Navigate to Enquiries tab
  const enquiriesTab = page.locator('[role="tab"]').filter({ hasText: /enquiries/i });
  await expect(enquiriesTab).toBeVisible({ timeout: 15000 });
  await enquiriesTab.click();

  // Wait for form fields panel to load
  await page.waitForTimeout(2000);

  // Find the Wechat User row in the Form Fields panel
  const wechatUserRow = page.locator('text=Wechat User').first();
  await expect(wechatUserRow).toBeVisible({ timeout: 15000 });

  // Find the parent list item containing "Wechat User"
  const listItem = page.locator('[id^="option-"]').filter({ has: page.locator('text=Wechat User') }).first();

  // If no id^="option-" found, fall back to list item role
  const listItemFallback = page.locator('[role="listitem"], li').filter({ has: page.locator('text=Wechat User') }).first();

  const targetListItem = await listItem.count() > 0 ? listItem : listItemFallback;

  await expect(targetListItem).toBeVisible({ timeout: 10000 });

  // Check that the list item itself is interactive (has tabindex or role that makes it focusable)
  const listItemTabIndex = await targetListItem.getAttribute('tabindex');
  const listItemRole = await targetListItem.getAttribute('role');
  const isListItemInteractive = listItemTabIndex !== null || listItemRole === 'option' || listItemRole === 'button';

  // Find checkbox inside the list item
  const checkboxInsideListItem = targetListItem.locator('input[type="checkbox"], [role="checkbox"]').first();
  const hasCheckbox = await checkboxInsideListItem.count() > 0;

  // Find drag handle inside the list item - typically a focusable element with drag icon
  const dragHandleSelectors = [
    '[draggable="true"]',
    '[aria-label*="drag" i]',
    '[class*="drag"]',
    '[tabindex]:not(input):not([role="checkbox"])',
    'button[class*="drag"]',
    '.drag-handle',
    '[data-drag-handle]',
  ];

  let dragHandleFound = false;
  let dragHandleIsFocusable = false;
  let dragHandleElement = null;

  for (const selector of dragHandleSelectors) {
    const handles = targetListItem.locator(selector);
    const count = await handles.count();
    if (count > 0) {
      for (let i = 0; i < count; i++) {
        const handle = handles.nth(i);
        const tagName = await handle.evaluate(el => el.tagName.toLowerCase());
        const tabindex = await handle.getAttribute('tabindex');
        const role = await handle.getAttribute('role');
        const ariaLabel = await handle.getAttribute('aria-label') || '';
        const className = await handle.getAttribute('class') || '';

        // Skip if this is the checkbox itself
        if (tagName === 'input' || role === 'checkbox') continue;

        // Check if it looks like a drag handle (has drag-related text, icon, or class)
        const textContent = await handle.textContent();
        const isDragHandle = 
          ariaLabel.toLowerCase().includes('drag') ||
          className.toLowerCase().includes('drag') ||
          (textContent && (textContent.includes('⋮') || textContent.includes('⠿') || textContent.includes('≡'))) ||
          selector.includes('drag');

        if (isDragHandle || selector === '[draggable="true"]') {
          dragHandleFound = true;
          // Drag handle is independently focusable if it has tabindex >= 0 or is a button/anchor
          dragHandleIsFocusable = 
            (tabindex !== null && tabindex !== '-1') ||
            tagName === 'button' ||
            tagName === 'a';
          break;
        }
      }
    }
    if (dragHandleFound) break;
  }

  // Additional check: look for any focusable element (tabindex >= 0) inside the list item
  // that is not the checkbox - these would be nested interactive elements
  const allFocusableInside = await targetListItem.locator('[tabindex]:not([tabindex="-1"]), button, a').all();
  
  let nestedInteractiveCount = 0;
  const nestedInteractiveDetails: string[] = [];
  
  for (const el of allFocusableInside) {
    const tagName = await el.evaluate(el => el.tagName.toLowerCase());
    const tabindex = await el.getAttribute('tabindex');
    const role = await el.getAttribute('role');
    const type = await el.getAttribute('type');
    const ariaLabel = await el.getAttribute('aria-label') || '';
    const className = await el.getAttribute('class') || '';

    // Skip hidden elements
    const isVisible = await el.isVisible();
    if (!isVisible) continue;

    nestedInteractiveCount++;
    nestedInteractiveDetails.push(`${tagName}[tabindex="${tabindex}"][role="${role}"][class="${className}"]`);
  }

  // The WCAG violation exists when:
  // 1. The list item is interactive AND
  // 2. It contains multiple focusable descendants (checkbox + drag handle)
  // Bug is PRESENT when there are nested interactive elements (drag handle focusable inside interactive list item)
  // Bug is FIXED when drag handle is not independently focusable (tabindex="-1" or restructured)

  console.log('List item interactive:', isListItemInteractive);
  console.log('Has checkbox:', hasCheckbox);
  console.log('Drag handle found:', dragHandleFound);
  console.log('Drag handle is focusable:', dragHandleIsFocusable);
  console.log('Nested interactive count:', nestedInteractiveCount);
  console.log('Nested interactive details:', nestedInteractiveDetails);

  // Use axe-core style check: if there are multiple focusable elements inside the list item,
  // and the list item itself is interactive, then we have a nested-interactive violation

  if (isListItemInteractive && nestedInteractiveCount > 1) {
    // Bug is PRESENT: multiple nested interactive elements inside an interactive list item
    // This assertion will FAIL (because the test should FAIL when bug is present)
    expect(nestedInteractiveCount, 
      `WCAG 4.1.2 violation: Found ${nestedInteractiveCount} nested interactive elements inside the "Wechat User" list item. ` +
      `Elements: ${nestedInteractiveDetails.join(', ')}. ` +
      `Drag handle should not be independently focusable inside an interactive list item.`
    ).toBeLessThanOrEqual(1);
  } else if (dragHandleFound && dragHandleIsFocusable && hasCheckbox) {
    // Alternative check: drag handle is explicitly focusable alongside a checkbox
    expect(dragHandleIsFocusable,
      `WCAG 4.1.2 violation: Drag handle is independently focusable (has tabindex >= 0 or is a button) ` +
      `inside an interactive list item that also contains a checkbox. ` +
      `This creates a nested-interactive accessibility violation.`
    ).toBe(false);
  } else {
    // Bug appears to be fixed: no nested interactive violation detected
    expect(true).toBe(true);
  }
});