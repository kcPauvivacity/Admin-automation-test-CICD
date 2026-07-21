// Bug #17254: [App Editor] Global Settings > Window - "Reset" button missing
// ADO: https://dev.azure.com/vivacityapp/Viva/_workitems/edit/17254
// Auto-generated 2026-06-12
// REVIEW BEFORE MERGING — verify selectors and assertions

import { test, expect } from '@playwright/test';
import { loginToApp } from '../helpers/auth.helper';

test.setTimeout(120000);

test('BUG #17254 - Global Settings > Window should have a Reset button alongside Save Changes', async ({ page }) => {
  await loginToApp(page, 90000, 'pau.kie.chee@fusioneta.com', 'PAOpaopao@9696');
  await page.goto('https://app-staging.vivacityapp.com/demo-student/app-editor', { waitUntil: 'load', timeout: 30000 });
  await page.waitForSelector('.v-application', { timeout: 15000 });
  await page.waitForTimeout(2000);

  // Navigate to App Editor
  await page.waitForSelector('.v-application', { timeout: 30000 });

  // Find and navigate to App Editor
  const appEditorLink = page.locator('a[href*="app-editor"], [data-testid*="app-editor"], .nav-item').filter({ hasText: /app editor/i }).first();
  
  // Try direct navigation to app editor
  await page.goto('https://app-staging.vivacityapp.com/app-editor', { waitUntil: 'networkidle', timeout: 30000 }).catch(async () => {
    // If direct navigation fails, try finding it in the nav
    await appEditorLink.click();
  });

  await page.waitForSelector('.v-application', { timeout: 30000 });

  // Look for a Mini Program to open
  const miniProgramItem = page.locator('.mini-program-item, [data-testid*="mini-program"], .program-card, .v-card').first();
  
  // Wait for mini programs to load
  await page.waitForSelector('.v-card, .mini-program, [class*="program"]', { timeout: 20000 }).catch(() => {
    // Continue even if not found, we'll try to navigate
  });

  // Try to click on a mini program if available
  const hasMiniProgram = await miniProgramItem.isVisible().catch(() => false);
  if (hasMiniProgram) {
    await miniProgramItem.click();
    await page.waitForLoadState('networkidle', { timeout: 15000 });
  }

  // Navigate to Global Settings
  const globalSettingsLink = page.locator('text=Global Settings, [data-testid*="global-settings"], .nav-item').filter({ hasText: /global settings/i }).first();
  
  const hasGlobalSettings = await globalSettingsLink.isVisible({ timeout: 10000 }).catch(() => false);
  if (hasGlobalSettings) {
    await globalSettingsLink.click();
    await page.waitForLoadState('networkidle', { timeout: 15000 });
  } else {
    // Try URL-based navigation
    const currentUrl = page.url();
    const baseUrl = currentUrl.split('/app-editor')[0];
    await page.goto(`${baseUrl}/app-editor/global-settings`, { waitUntil: 'networkidle', timeout: 20000 }).catch(() => {});
  }

  // Click on Window under CONFIGURATION
  const windowConfigItem = page.locator('text=Window').filter({ hasText: /^Window$/i }).first();
  
  const hasWindowItem = await windowConfigItem.isVisible({ timeout: 10000 }).catch(() => false);
  if (hasWindowItem) {
    await windowConfigItem.click();
    await page.waitForLoadState('networkidle', { timeout: 15000 });
  } else {
    // Try alternative selectors
    const altWindowItem = page.locator('.config-item, .v-list-item, .sidebar-item').filter({ hasText: /window/i }).first();
    const hasAlt = await altWindowItem.isVisible({ timeout: 5000 }).catch(() => false);
    if (hasAlt) {
      await altWindowItem.click();
      await page.waitForLoadState('networkidle', { timeout: 15000 });
    }
  }

  // Wait for the content area to load
  await page.waitForSelector('.v-btn, button', { timeout: 15000 });

  // Check for the Reset button - this is the core assertion for the bug
  // The Reset button should be visible in the top right of the content area
  const resetButton = page.locator('button, .v-btn').filter({ hasText: /^reset$/i });
  
  // Also check for Save Changes button to confirm we're on the right page
  const saveChangesButton = page.locator('button, .v-btn').filter({ hasText: /save changes/i });
  
  // Verify Save Changes button is present (confirms we're on the Window config page)
  await expect(saveChangesButton.first()).toBeVisible({ timeout: 15000 });

  // The key assertion: Reset button must be present
  // This FAILS when bug is present (no Reset button) and PASSES when fixed
  await expect(resetButton.first()).toBeVisible({ timeout: 10000 });
});