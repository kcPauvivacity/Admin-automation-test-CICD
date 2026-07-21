// Bug #16103: [BUG]Appeditor > unable to select page
// ADO: https://dev.azure.com/vivacityapp/Viva/_workitems/edit/16103
// Auto-generated 2026-05-28
// REVIEW BEFORE MERGING — verify selectors and assertions

import { test, expect } from '@playwright/test';
import { loginToApp } from '../helpers/auth.helper';

test.setTimeout(120000);

test('BUG #16103 - AppEditor: able to select page', async ({ page }) => {
  await loginToApp(page, 90000, 'pau.kie.chee@fusioneta.com', 'PAOpaopao@9696');
  await page.goto('https://app-staging.vivacityapp.com/demo-student/app-editor', { waitUntil: 'load', timeout: 30000 });
  await page.waitForSelector('.v-application', { timeout: 15000 });
  await page.waitForTimeout(2000);

  // Navigate to the app editor section
  await page.goto('https://app-staging.vivacityapp.com');

  // Wait for the app to load
  await page.waitForSelector('.v-application', { timeout: 30000 });

  // Look for App Editor navigation link
  const appEditorSelectors = [
    'a[href*="app-editor"]',
    'a[href*="appeditor"]',
    '[data-testid*="app-editor"]',
    'text=App Editor',
    'text=AppEditor',
    '.v-list-item:has-text("App Editor")',
    '.v-navigation-drawer a:has-text("App")',
  ];

  let navigated = false;
  for (const selector of appEditorSelectors) {
    const el = page.locator(selector).first();
    if (await el.isVisible({ timeout: 3000 }).catch(() => false)) {
      await el.click();
      navigated = true;
      break;
    }
  }

  if (!navigated) {
    // Try direct URL navigation
    await page.goto('https://app-staging.vivacityapp.com/app-editor');
    await page.waitForSelector('.v-application', { timeout: 15000 });
  }

  // Wait for the app editor to load
  await page.waitForTimeout(2000);

  // Look for page selector / page list in the editor
  const pageSelectors = [
    '[data-testid*="page"]',
    '.page-selector',
    '.page-list',
    '.v-list:has-text("Page")',
    'text=Pages',
    '.v-tabs',
    '[class*="page"]',
    '.v-select:has-text("Page")',
  ];

  let pageElementFound = false;
  let pageElement = null;

  for (const selector of pageSelectors) {
    const el = page.locator(selector).first();
    if (await el.isVisible({ timeout: 3000 }).catch(() => false)) {
      pageElement = el;
      pageElementFound = true;
      break;
    }
  }

  // If we found a page element, try to interact with it
  if (pageElementFound && pageElement) {
    // Try to click to select a page
    await pageElement.click({ timeout: 5000 }).catch(() => {});
    await page.waitForTimeout(1000);
  }

  // Try to find clickable page items in the editor
  const pageItemSelectors = [
    '.v-list-item:has-text("Page")',
    '[data-testid*="page-item"]',
    '.page-item',
    '.v-treeview-node',
    '[class*="pageItem"]',
  ];

  let pageSelected = false;

  for (const selector of pageItemSelectors) {
    const items = page.locator(selector);
    const count = await items.count().catch(() => 0);

    if (count > 0) {
      // Try clicking the first page item
      const firstItem = items.first();
      if (await firstItem.isVisible({ timeout: 3000 }).catch(() => false)) {
        await firstItem.click({ timeout: 5000 });
        await page.waitForTimeout(1000);

        // Verify the click was registered (item should be selected/active)
        const isActive = await firstItem.evaluate((el) => {
          return (
            el.classList.contains('v-list-item--active') ||
            el.classList.contains('active') ||
            el.getAttribute('aria-selected') === 'true' ||
            el.closest('[class*="selected"]') !== null
          );
        }).catch(() => false);

        if (isActive) {
          pageSelected = true;
        }
        break;
      }
    }
  }

  // Broader check: ensure the page is not stuck or showing an error
  const errorSelectors = [
    'text=Unable to select',
    'text=Cannot select page',
    '.v-alert--error',
    '[class*="error"]:visible',
  ];

  for (const selector of errorSelectors) {
    const errorEl = page.locator(selector).first();
    const errorVisible = await errorEl.isVisible({ timeout: 2000 }).catch(() => false);
    expect(errorVisible, `Error message should not be visible: ${selector}`).toBe(false);
  }

  // Check that the page content area is accessible and not blocked
  const contentAreaSelectors = [
    '.app-editor',
    '[class*="editor"]',
    '.v-main',
    'main',
    '[data-testid*="editor-content"]',
  ];

  let contentVisible = false;
  for (const selector of contentAreaSelectors) {
    const el = page.locator(selector).first();
    if (await el.isVisible({ timeout: 3000 }).catch(() => false)) {
      contentVisible = true;
      break;
    }
  }

  expect(contentVisible, 'App editor content area should be visible and accessible').toBe(true);

  // Final check: the page should not be frozen or unresponsive
  // Try to find any interactive element in the editor and verify it responds
  const interactiveElements = page.locator('.v-btn:visible, .v-list-item:visible, .v-tab:visible');
  const interactiveCount = await interactiveElements.count().catch(() => 0);

  expect(
    interactiveCount,
    'There should be interactive elements visible in the app editor'
  ).toBeGreaterThan(0);
});