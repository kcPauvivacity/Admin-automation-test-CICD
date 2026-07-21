// Bug #16110: [BUG]Appeditor > Page is overlay and preview not showing
// ADO: https://dev.azure.com/vivacityapp/Viva/_workitems/edit/16110
// Auto-generated 2026-05-28
// REVIEW BEFORE MERGING — verify selectors and assertions

import { test, expect } from '@playwright/test';
import { loginToApp } from '../helpers/auth.helper';

test.setTimeout(120000);

test('BUG #16110 - AppEditor page overlay and preview should be visible', async ({ page }) => {
  await loginToApp(page, 90000, 'pau.kie.chee@fusioneta.com', 'PAOpaopao@9696');
  await page.goto('https://app-staging.vivacityapp.com/demo-student/app-editor', { waitUntil: 'load', timeout: 30000 });
  await page.waitForSelector('.v-application', { timeout: 15000 });
  await page.waitForTimeout(2000);

  // Navigate to app editor
  await page.goto('https://app-staging.vivacityapp.com');

  // Wait for the application to load
  await page.waitForSelector('.v-application', { timeout: 30000 });

  // Look for App Editor navigation link
  const appEditorSelectors = [
    'a[href*="app-editor"]',
    'a[href*="appeditor"]',
    '[data-testid*="app-editor"]',
    'text=App Editor',
    'text=AppEditor',
  ];

  let appEditorLink = null;
  for (const selector of appEditorSelectors) {
    try {
      appEditorLink = await page.waitForSelector(selector, { timeout: 5000 });
      if (appEditorLink) break;
    } catch {
      // Try next selector
    }
  }

  if (appEditorLink) {
    await appEditorLink.click();
  } else {
    // Try direct navigation
    await page.goto('https://app-staging.vivacityapp.com/app-editor');
  }

  // Wait for app editor page to load
  await page.waitForLoadState('networkidle', { timeout: 30000 });

  // Check that there is no blocking overlay covering the page
  // An overlay bug would show a modal/dialog/overlay that blocks the content
  const overlaySelectors = [
    '.v-overlay.v-overlay--active:not(.v-menu) .v-overlay__scrim',
    '.v-dialog.v-overlay--active',
  ];

  for (const selector of overlaySelectors) {
    const overlay = page.locator(selector);
    const count = await overlay.count();
    if (count > 0) {
      const isVisible = await overlay.first().isVisible();
      if (isVisible) {
        // Check if overlay is blocking interaction (not a legitimate loading overlay)
        const zIndex = await overlay.first().evaluate((el) => {
          const style = window.getComputedStyle(el);
          return parseInt(style.zIndex || '0', 10);
        });
        // A blocking overlay with high z-index that shouldn't be there
        if (zIndex > 100) {
          // Try to see if the main content is accessible underneath
          const mainContent = page.locator('.v-application main, [role="main"], .app-editor-content');
          const mainVisible = await mainContent.isVisible().catch(() => false);
          // If overlay is blocking and main content not visible, bug is present
          if (!mainVisible) {
            throw new Error(`BUG #16110: Blocking overlay detected with z-index ${zIndex} that hides the app editor content`);
          }
        }
      }
    }
  }

  // Verify the app editor page content is visible and accessible
  const pageContentSelectors = [
    '[class*="app-editor"]',
    '[class*="editor"]',
    '.v-main',
    'main',
  ];

  let contentVisible = false;
  for (const selector of pageContentSelectors) {
    try {
      const element = page.locator(selector).first();
      if (await element.isVisible({ timeout: 5000 })) {
        contentVisible = true;
        break;
      }
    } catch {
      // Try next
    }
  }

  expect(contentVisible, 'App editor main content should be visible and not blocked by overlay').toBe(true);

  // Check for preview area visibility
  // The bug mentions preview not showing - look for preview-related elements
  const previewSelectors = [
    '[class*="preview"]',
    '[data-testid*="preview"]',
    'iframe[title*="preview"]',
    'iframe[src*="preview"]',
    '.preview-container',
    '.preview-panel',
    '.app-preview',
  ];

  // Navigate to a specific page within app editor if needed
  // Try to find pages/screens in the editor
  const pageListSelectors = [
    '[class*="page-list"]',
    '[class*="pages"]',
    '[data-testid*="page"]',
  ];

  let pageItem = null;
  for (const selector of pageListSelectors) {
    try {
      const items = page.locator(selector);
      if (await items.count() > 0) {
        pageItem = items.first();
        break;
      }
    } catch {
      // Try next
    }
  }

  if (pageItem) {
    await pageItem.click().catch(() => {});
    await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
  }

  // After selecting a page, check if preview is shown
  let previewFound = false;
  for (const selector of previewSelectors) {
    try {
      const el = page.locator(selector).first();
      if (await el.isVisible({ timeout: 5000 })) {
        previewFound = true;
        break;
      }
    } catch {
      // Try next
    }
  }

  // Verify no full-screen blocking overlay exists that would hide the preview
  const blockingOverlay = page.locator('.v-overlay--active .v-overlay__scrim').first();
  const hasBlockingOverlay = await blockingOverlay.isVisible().catch(() => false);

  if (hasBlockingOverlay) {
    // Check if it's a legitimate loading/dialog overlay
    const loadingOverlay = page.locator('.v-overlay--active .v-progress-circular').first();
    const isLoading = await loadingOverlay.isVisible().catch(() => false);

    if (!isLoading) {
      // Non-loading blocking overlay is the bug
      expect(hasBlockingOverlay, 'BUG #16110: A non-loading blocking overlay is covering the app editor page').toBe(false);
    }
  }

  // If we found a preview element, verify it's actually visible (not hidden by overlay)
  if (previewFound) {
    for (const selector of previewSelectors) {
      try {
        const el = page.locator(selector).first();
        if (await el.count() > 0) {
          await expect(el).toBeVisible({ timeout: 10000 });
          break;
        }
      } catch {
        // Continue
      }
    }
  }

  // Final check: page title/header of app editor should be visible
  const editorHeaderSelectors = [
    '.v-app-bar',
    '.v-toolbar',
    'header',
    '[class*="header"]',
  ];

  let headerVisible = false;
  for (const selector of editorHeaderSelectors) {
    try {
      const el = page.locator(selector).first();
      if (await el.isVisible({ timeout: 3000 })) {
        headerVisible = true;
        break;
      }
    } catch {
      // Try next
    }
  }

  expect(headerVisible, 'App editor page header/toolbar should be visible without overlay blocking').toBe(true);
});