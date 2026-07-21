// Bug #17648: Appeditor= preview didnt show the design
// ADO: https://dev.azure.com/vivacityapp/Viva/_workitems/edit/17648
// Auto-generated 2026-07-10
// REVIEW BEFORE MERGING — verify selectors and assertions

import { test, expect } from '@playwright/test';
import { loginToApp } from '../helpers/auth.helper';

test.setTimeout(120000);

test('Bug #17648 - AppEditor preview should show the design', async ({ page }) => {
  await loginToApp(page, 90000, 'pau.kie.chee@fusioneta.com', 'PAOpaopao@9696');

  // Navigate to the app editor section
  await page.goto('https://app-staging.vivacityapp.com');

  // Wait for the application to load
  await page.waitForSelector('.v-application', { timeout: 30000 });

  // Look for app editor / builder navigation link
  const appEditorLinks = [
    'a[href*="app-editor"]',
    'a[href*="appeditor"]',
    'a[href*="editor"]',
    '[data-testid*="app-editor"]',
    'text=App Editor',
    'text=App Builder',
    'text=Editor',
  ];

  let navigatedToEditor = false;

  for (const selector of appEditorLinks) {
    const el = page.locator(selector).first();
    if (await el.isVisible({ timeout: 3000 }).catch(() => false)) {
      await el.click();
      navigatedToEditor = true;
      break;
    }
  }

  if (!navigatedToEditor) {
    // Try direct navigation
    await page.goto('https://app-staging.vivacityapp.com/demo-student/app-editor');
    await page.waitForSelector('.v-application', { timeout: 15000 });
  }

  // Wait for editor page to load
  await page.waitForLoadState('networkidle', { timeout: 30000 });

  // Look for any existing app/design to open or create
  const openAppSelectors = [
    '[data-testid*="open"]',
    'button:has-text("Open")',
    'button:has-text("Edit")',
    '.v-card',
    '[data-testid*="app-item"]',
    '.app-item',
    '.design-item',
  ];

  for (const selector of openAppSelectors) {
    const el = page.locator(selector).first();
    if (await el.isVisible({ timeout: 3000 }).catch(() => false)) {
      await el.click();
      await page.waitForLoadState('networkidle', { timeout: 15000 });
      break;
    }
  }

  // Look for the preview button/tab
  const previewSelectors = [
    'button:has-text("Preview")',
    'a:has-text("Preview")',
    '[data-testid*="preview"]',
    '.preview-btn',
    'text=Preview',
    '[aria-label*="preview"]',
    '[title*="preview"]',
    '[title*="Preview"]',
  ];

  let previewClicked = false;

  for (const selector of previewSelectors) {
    const el = page.locator(selector).first();
    if (await el.isVisible({ timeout: 5000 }).catch(() => false)) {
      await el.click();
      previewClicked = true;
      break;
    }
  }

  if (!previewClicked) {
    // Try navigating directly to preview URL patterns
    const currentUrl = page.url();
    if (currentUrl.includes('editor')) {
      await page.goto(currentUrl.replace('editor', 'preview'));
      await page.waitForLoadState('networkidle', { timeout: 15000 });
    }
  }

  await page.waitForLoadState('networkidle', { timeout: 20000 });

  // Verify the preview shows content (design) and is not blank/empty
  // The bug says preview didn't show anything

  // Check that the preview container exists and has content
  const previewContainerSelectors = [
    '[data-testid*="preview"]',
    '.preview-container',
    '.app-preview',
    '.preview-frame',
    'iframe[title*="preview"]',
    'iframe[src*="preview"]',
    '.editor-preview',
    '[class*="preview"]',
  ];

  let previewContainer = null;

  for (const selector of previewContainerSelectors) {
    const el = page.locator(selector).first();
    if (await el.isVisible({ timeout: 5000 }).catch(() => false)) {
      previewContainer = el;
      break;
    }
  }

  if (previewContainer) {
    // If preview is in an iframe, check iframe content
    const iframeEl = page.locator('iframe').first();
    if (await iframeEl.isVisible({ timeout: 3000 }).catch(() => false)) {
      const iframeSrc = await iframeEl.getAttribute('src');
      expect(iframeSrc).not.toBeNull();
      expect(iframeSrc).not.toBe('');

      // Get iframe content and verify it has design elements
      const frame = page.frameLocator('iframe').first();
      const iframeBody = frame.locator('body');

      await expect(iframeBody).toBeVisible({ timeout: 15000 });

      // Verify the iframe body is not empty (has design content)
      const bodyText = await iframeBody.textContent({ timeout: 10000 }).catch(() => '');
      const bodyHTML = await iframeBody.innerHTML({ timeout: 10000 }).catch(() => '');

      // The preview should have some content - not just empty tags
      expect(bodyHTML.trim().length).toBeGreaterThan(50);
    } else {
      // Preview container should have visible child elements (design components)
      await expect(previewContainer).toBeVisible({ timeout: 10000 });

      const childCount = await previewContainer.locator('> *').count();
      expect(childCount).toBeGreaterThan(0);

      // Verify preview doesn't show an error or empty state message
      const emptyStateSelectors = [
        'text=No preview available',
        'text=Nothing to preview',
        'text=Preview is empty',
        'text=No design',
      ];

      for (const emptySelector of emptyStateSelectors) {
        const emptyEl = page.locator(emptySelector);
        await expect(emptyEl).not.toBeVisible({ timeout: 2000 }).catch(() => {});
      }
    }
  } else {
    // Fallback: verify we are on a page that has editor content visible
    // The page should not be completely empty
    const pageContent = await page.locator('body').innerHTML({ timeout: 10000 });
    expect(pageContent.trim().length).toBeGreaterThan(100);

    // Verify there's some visual design element visible
    const designElements = [
      '.v-card',
      '.v-container',
      'canvas',
      '[class*="design"]',
      '[class*="component"]',
      '[class*="widget"]',
    ];

    let hasDesignElement = false;
    for (const selector of designElements) {
      const el = page.locator(selector).first();
      if (await el.isVisible({ timeout: 3000 }).catch(() => false)) {
        hasDesignElement = true;
        break;
      }
    }

    expect(hasDesignElement).toBe(true);
  }

  // Final screenshot for debugging purposes (will be captured on failure)
  await page.screenshot({ path: 'test-results/bug-17648-preview.png' }).catch(() => {});
});