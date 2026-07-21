// Bug #17078: [Admin] Popup covers dropdown list when entering tasks in Managed Service Hours
// ADO: https://dev.azure.com/vivacityapp/Viva/_workitems/edit/17078
// Auto-generated 2026-06-04
// REVIEW BEFORE MERGING — verify selectors and assertions

import { test, expect } from '@playwright/test';
import { loginToApp } from '../helpers/auth.helper';

test.setTimeout(120000);

test('BUG #17078 - Popup should not cover dropdown list when clicking task input in Managed Service Hours', async ({ page }) => {
  await loginToApp(page);

  // Navigate to Managed Service Hours
  await page.goto('https://app-staging.vivacityapp.com');

  // Wait for the app to load
  await page.waitForSelector('.v-application', { timeout: 30000 });

  // Look for Managed Service Hours in navigation
  const managedServiceHoursLink = page.locator('text=Managed Service Hours').first();
  
  // Try to find in sidebar navigation
  const sidebarNav = page.locator('.v-navigation-drawer');
  await sidebarNav.waitFor({ timeout: 15000 }).catch(() => {});

  // Navigate to managed service hours - try different possible routes
  const possibleLinks = [
    page.locator('a, .v-list-item').filter({ hasText: /managed service hours/i }).first(),
    page.locator('[href*="managed-service"]').first(),
    page.locator('[href*="service-hours"]').first(),
  ];

  let navigated = false;
  for (const link of possibleLinks) {
    const isVisible = await link.isVisible().catch(() => false);
    if (isVisible) {
      await link.click();
      navigated = true;
      break;
    }
  }

  if (!navigated) {
    // Try direct URL navigation
    await page.goto('https://app-staging.vivacityapp.com/managed-service-hours', { waitUntil: 'networkidle' }).catch(() => {});
    await page.goto('https://app-staging.vivacityapp.com/service-hours', { waitUntil: 'networkidle' }).catch(() => {});
  }

  // Wait for page content to load
  await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => {});

  // Look for task input field in the page
  const taskInputSelectors = [
    '.v-autocomplete input',
    '.v-combobox input',
    '.v-select input',
    'input[placeholder*="task" i]',
    'input[placeholder*="Task" i]',
    '.v-field input',
  ];

  let taskInput = null;
  for (const selector of taskInputSelectors) {
    const elements = page.locator(selector);
    const count = await elements.count();
    if (count > 0) {
      taskInput = elements.first();
      const isVisible = await taskInput.isVisible().catch(() => false);
      if (isVisible) {
        break;
      }
      taskInput = null;
    }
  }

  if (!taskInput) {
    // If we can't find a task input, look for any input that might be task-related
    taskInput = page.locator('.v-field input').first();
  }

  // Ensure the task input is visible
  await expect(taskInput).toBeVisible({ timeout: 15000 });

  // Click on the task input field
  await taskInput.click();

  // Wait a moment for any popup/dropdown to appear
  await page.waitForTimeout(1000);

  // Check if a dropdown list appeared (expected behavior)
  const dropdownSelectors = [
    '.v-autocomplete__content',
    '.v-combobox__content', 
    '.v-select__content',
    '.v-menu__content',
    '.v-overlay__content .v-list',
    '[role="listbox"]',
    '.v-menu .v-list',
  ];

  let dropdownVisible = false;
  let dropdownLocator = null;

  for (const selector of dropdownSelectors) {
    const dropdown = page.locator(selector).first();
    const isVisible = await dropdown.isVisible().catch(() => false);
    if (isVisible) {
      dropdownVisible = true;
      dropdownLocator = dropdown;
      break;
    }
  }

  // Check for popup/dialog overlays that might cover the dropdown
  const popupSelectors = [
    '.v-dialog:visible',
    '.v-overlay.v-overlay--active:not(.v-menu):visible',
    '[role="dialog"]:visible',
    '.v-bottom-sheet:visible',
    '.popup-overlay:visible',
  ];

  let blockingPopupVisible = false;
  let blockingPopupLocator = null;

  for (const selector of popupSelectors) {
    const popup = page.locator(selector).first();
    const isVisible = await popup.isVisible().catch(() => false);
    if (isVisible) {
      // Check if this popup appeared immediately after clicking the task input
      // and if it might be covering the dropdown
      const popupZIndex = await popup.evaluate(el => {
        const style = window.getComputedStyle(el);
        return parseInt(style.zIndex || '0', 10);
      }).catch(() => 0);

      if (popupZIndex > 0) {
        blockingPopupVisible = true;
        blockingPopupLocator = popup;
        break;
      }
    }
  }

  // The bug: a popup appears immediately when clicking the task input field
  // This popup covers/overlays the dropdown list
  // Test FAILS if bug is present (popup appears and covers dropdown)
  // Test PASSES when fixed (only dropdown appears, no blocking popup)

  if (dropdownVisible && blockingPopupVisible) {
    // Both dropdown and a popup appeared - check if popup is covering dropdown
    const dropdownBounds = await dropdownLocator!.boundingBox();
    const popupBounds = await blockingPopupLocator!.boundingBox();

    if (dropdownBounds && popupBounds) {
      // Check if the popup overlaps with the dropdown area
      const overlaps = !(
        popupBounds.x + popupBounds.width < dropdownBounds.x ||
        popupBounds.x > dropdownBounds.x + dropdownBounds.width ||
        popupBounds.y + popupBounds.height < dropdownBounds.y ||
        popupBounds.y > dropdownBounds.y + dropdownBounds.height
      );

      expect(overlaps, 'Bug #17078: A popup is overlapping the dropdown list when task input is clicked').toBe(false);
    }
  } else if (blockingPopupVisible && !dropdownVisible) {
    // Popup appeared but dropdown is not visible - this is the bug
    expect(blockingPopupVisible, 'Bug #17078: A popup appeared immediately when clicking task input, covering the dropdown list').toBe(false);
  }

  // If we have a dropdown visible without a blocking popup, the bug is not present
  if (dropdownVisible) {
    // Verify the dropdown is accessible (has list items or is interactable)
    const dropdownItems = page.locator('[role="listbox"] [role="option"], .v-list-item').first();
    // The dropdown should be the topmost interactive element in that area
    await expect(dropdownLocator!).toBeVisible();
  }

  // Close any open dropdowns/overlays to restore state
  await page.keyboard.press('Escape');
  await page.waitForTimeout(500);
});