// Bug #17252: [App Editor] Global Settings - "Sales" item missing from CONTENT sidebar
// ADO: https://dev.azure.com/vivacityapp/Viva/_workitems/edit/17252
// Auto-generated 2026-06-12
// REVIEW BEFORE MERGING — verify selectors and assertions

import { test, expect } from '@playwright/test';
import { loginToApp } from '../helpers/auth.helper';

test.setTimeout(120000);

test('BUG #17252 - Global Settings CONTENT sidebar should show both Pages and Sales items', async ({ page }) => {
  await loginToApp(page, 90000, 'pau.kie.chee@fusioneta.com', 'PAOpaopao@9696');

    await page.goto('https://app-staging.vivacityapp.com/demo-student/app-editor', { waitUntil: 'load', timeout: 30000 });
  await page.waitForSelector('.v-application', { timeout: 15000 });
  await page.waitForTimeout(2000);

  // Wait for App Editor to load
  await page.waitForLoadState('networkidle', { timeout: 30000 });

  // Find and open a Mini Program - look for any mini program card or list item
  const miniProgram = page.locator('.v-card, .v-list-item, [class*="mini-program"], [class*="program"]')
    .filter({ hasText: /mini program|program/i })
    .first();

  // If mini program selector doesn't work, try clicking the first available program/project
  const firstProgram = page.locator('.v-card').first();
  
  try {
    await miniProgram.waitFor({ timeout: 10000 });
    await miniProgram.click();
  } catch {
    await firstProgram.waitFor({ timeout: 10000 });
    await firstProgram.click();
  }

  await page.waitForLoadState('networkidle', { timeout: 30000 });

  // Navigate to Global Settings
  const globalSettingsLink = page.locator('a, .v-list-item, button, [class*="nav"]')
    .filter({ hasText: /global settings/i })
    .first();

  await globalSettingsLink.waitFor({ timeout: 20000 });
  await globalSettingsLink.click();

  await page.waitForLoadState('networkidle', { timeout: 30000 });

  // Wait for the sidebar to be visible
  await page.waitForSelector('[class*="sidebar"], .v-navigation-drawer, aside, [class*="left"]', {
    timeout: 20000
  });

  // Look for the CONTENT section header in the sidebar
  const contentSection = page.locator('text=CONTENT, .v-list-subheader, .sidebar-section-header')
    .filter({ hasText: /content/i })
    .first();

  await contentSection.waitFor({ timeout: 20000 });

  // Verify "Pages" is present in the CONTENT sidebar section
  const pagesItem = page.locator('.v-list-item, .sidebar-item, li, a')
    .filter({ hasText: /^pages$/i })
    .first();

  await expect(pagesItem).toBeVisible({ timeout: 15000 });

  // Verify "Sales" is present in the CONTENT sidebar section - this will FAIL if bug is present
  const salesItem = page.locator('.v-list-item, .sidebar-item, li, a')
    .filter({ hasText: /^sales$/i })
    .first();

  await expect(salesItem).toBeVisible({ timeout: 15000 });

  // Additional assertion: both items should exist in the same CONTENT section
  // Get the parent container of the CONTENT section and verify both children exist
  const contentSectionContainer = page.locator('[class*="sidebar"], .v-navigation-drawer, aside')
    .first();

  await expect(contentSectionContainer.locator('text=Pages')).toBeVisible({ timeout: 10000 });
  await expect(contentSectionContainer.locator('text=Sales')).toBeVisible({ timeout: 10000 });
});