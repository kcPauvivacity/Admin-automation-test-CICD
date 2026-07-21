// Bug #17219: Appeditor > Release > click generate beta
// ADO: https://dev.azure.com/vivacityapp/Viva/_workitems/edit/17219
// Auto-generated 2026-06-11
// REVIEW BEFORE MERGING — verify selectors and assertions

import { test, expect } from '@playwright/test';
import { loginToApp } from '../helpers/auth.helper';

test.setTimeout(120000);

test('BUG #17219 - AppEditor Release: click generate beta should not error on select template id', async ({ page }) => {
  await loginToApp(page, 90000, 'pau.kie.chee@fusioneta.com', 'PAOpaopao@9696');

  // Navigate to App Editor
  await page.goto('https://app-staging.vivacityapp.com');

  // Wait for app to load
  await page.waitForSelector('.v-application', { timeout: 30000 });

  // Navigate to App Editor section
  const appEditorLink = page.locator('text=App Editor, [href*="app-editor"], [href*="appeditor"]').first();
  
  // Try direct navigation if link not found
  const currentUrl = page.url();
  if (!currentUrl.includes('app-editor')) {
    // Try to find app editor in nav
    const navItems = page.locator('.v-list-item, .v-navigation-drawer .v-list-item');
    const appEditorNavItem = navItems.filter({ hasText: /app.?editor/i });
    
    if (await appEditorNavItem.count() > 0) {
      await appEditorNavItem.first().click();
    } else {
      await page.goto('https://app-staging.vivacityapp.com/app-editor');
    }
  }

  await page.waitForSelector('.v-application', { timeout: 15000 });

  // Look for Release section or tab
  const releaseTab = page.locator('text=Release, [data-tab="release"], .v-tab').filter({ hasText: /release/i });
  
  if (await releaseTab.count() > 0) {
    await releaseTab.first().click();
    await page.waitForSelector('.v-application', { timeout: 10000 });
  } else {
    // Try navigating directly to release section
    await page.goto('https://app-staging.vivacityapp.com/app-editor/release');
    await page.waitForSelector('.v-application', { timeout: 15000 });
  }

  // Look for "Generate Beta" button
  const generateBetaBtn = page.locator('button, .v-btn').filter({ hasText: /generate.?beta/i });
  
  if (await generateBetaBtn.count() === 0) {
    // Try alternate navigation - look for any release-related content
    await page.goto('https://app-staging.vivacityapp.com/app-editor');
    await page.waitForSelector('.v-application', { timeout: 15000 });
    
    // Look for release in sidebar/tabs
    const releaseLink = page.locator('a, .v-list-item, .v-tab').filter({ hasText: /release/i });
    if (await releaseLink.count() > 0) {
      await releaseLink.first().click();
      await page.waitForTimeout(2000);
    }
  }

  // Find and click the Generate Beta button
  const generateBetaButton = page.locator('button, .v-btn').filter({ hasText: /generate.?beta/i });
  
  await expect(generateBetaButton.first()).toBeVisible({ timeout: 15000 });
  await generateBetaButton.first().click();

  // Wait for dialog or template selection to appear
  await page.waitForTimeout(2000);

  // Look for template ID selector/dropdown
  const templateSelector = page.locator(
    '.v-select, .v-autocomplete, [data-testid*="template"], select'
  ).filter({ hasText: /template/i }).or(
    page.locator('label').filter({ hasText: /template/i }).locator('..').locator('.v-select, .v-autocomplete')
  );

  // Check for error dialog/snackbar before interacting
  const errorBefore = page.locator('.v-snackbar--active, .v-alert--type-error, [class*="error"]').filter({ hasText: /error/i });
  const hasErrorBefore = await errorBefore.count() > 0;

  if (await templateSelector.count() > 0) {
    await templateSelector.first().click();
    await page.waitForTimeout(1500);
    
    // Check for error after clicking template selector
    const errorAfter = page.locator('.v-snackbar--active, .v-alert--type-error').filter({ hasText: /error/i });
    const snackbarError = page.locator('.v-snackbar').filter({ hasText: /error/i });
    
    // Bug: clicking select template id causes an error
    // Test FAILS if error appears (bug present), PASSES if no error (bug fixed)
    await expect(snackbarError).not.toBeVisible({ timeout: 5000 });
    await expect(errorAfter).not.toBeVisible({ timeout: 3000 });
  } else {
    // If no template selector visible, check for errors from generate beta click
    const snackbarError = page.locator('.v-snackbar').filter({ hasText: /error/i });
    const alertError = page.locator('.v-alert').filter({ hasText: /error/i });
    
    await expect(snackbarError).not.toBeVisible({ timeout: 5000 });
    await expect(alertError).not.toBeVisible({ timeout: 3000 });
    
    // Ensure some content appeared (dialog, form, etc.)
    const dialogOrContent = page.locator('.v-dialog--active, .v-overlay--active, [data-testid*="generate"], [data-testid*="beta"]');
    await expect(dialogOrContent.first()).toBeVisible({ timeout: 10000 });
  }

  // Close any open dialogs to restore state
  const closeBtn = page.locator('.v-dialog .v-btn').filter({ hasText: /close|cancel/i });
  if (await closeBtn.count() > 0) {
    await closeBtn.first().click();
  }
  
  const escapeKey = page.keyboard.press('Escape');
  await escapeKey;
});