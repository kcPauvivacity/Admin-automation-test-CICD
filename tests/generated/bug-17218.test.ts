// Bug #17218: [App Editor] Sidebar - Extra "Widget" navigation item not in design
// ADO: https://dev.azure.com/vivacityapp/Viva/_workitems/edit/17218
// Auto-generated 2026-06-11
// REVIEW BEFORE MERGING — verify selectors and assertions

import { test, expect } from '@playwright/test';
import { loginToApp } from '../helpers/auth.helper';

test.setTimeout(120000);

test('BUG #17218 - No extra "Widget" navigation item under SETTINGS in App Editor sidebar', async ({ page }) => {
  await loginToApp(page, 90000, 'pau.kie.chee@fusioneta.com', 'PAOpaopao@9696');

  // Navigate to App Editor
  await page.goto('https://app-staging.vivacityapp.com/demo-student/app-editor', { waitUntil: 'load', timeout: 30000 });
  await page.waitForSelector('.v-application', { timeout: 15000 });
  await page.waitForTimeout(2000);

  await page.waitForURL(/app-editor|appeditor/i, { timeout: 30000 });

  // Wait for App Editor to load and find a Mini Program to open
  await page.waitForSelector('.v-application', { timeout: 15000 });

  // Look for a mini program item to click
  const miniProgramItem = page.locator('.v-list-item, .v-card, [role="listitem"]').filter({ hasText: /mini program|program/i }).first();
  
  const miniProgramExists = await miniProgramItem.isVisible().catch(() => false);
  
  if (miniProgramExists) {
    await miniProgramItem.click();
    await page.waitForTimeout(3000);
  }

  // Wait for sidebar to be visible
  await page.waitForSelector('.v-navigation-drawer, .v-list, aside', { timeout: 15000 });

  // Look for the SETTINGS section in the sidebar
  const settingsSection = page.locator('.v-list, .v-navigation-drawer, aside').filter({ hasText: /settings/i }).first();
  
  // Check that "Widget" item does NOT appear under SETTINGS in the sidebar
  // The bug is that a "Widget" nav item appears under SETTINGS section
  
  // Find sidebar nav items specifically under SETTINGS
  const sidebarNav = page.locator('.v-navigation-drawer, aside, .sidebar, [class*="sidebar"]').first();
  
  // Look for Widget nav item within the sidebar
  const widgetNavItem = sidebarNav.locator('.v-list-item, [role="listitem"], a').filter({ hasText: /^widget$/i });
  
  const widgetNavItemCount = await widgetNavItem.count();
  
  // The test FAILS if the bug is present (Widget item exists), PASSES when fixed (Widget item absent)
  expect(widgetNavItemCount, 'Extra "Widget" navigation item should not appear in the sidebar under SETTINGS').toBe(0);
});

test('BUG #17218 - Verify SETTINGS section items do not include "Widget" in App Editor', async ({ page }) => {
  await loginToApp(page, 90000, 'pau.kie.chee@fusioneta.com', 'PAOpaopao@9696');

  await page.goto('https://app-staging.vivacityapp.com');
  await page.waitForSelector('.v-application', { timeout: 30000 });

  // Try direct navigation to app editor
  await page.goto('https://app-staging.vivacityapp.com/app-editor');
  await page.waitForSelector('.v-application', { timeout: 30000 });

  // Wait for page content
  await page.waitForLoadState('networkidle', { timeout: 30000 });

  // Find and click on a mini program if available
  const miniProgramItems = page.locator('.v-list-item, .v-card').filter({ hasText: /mini/i });
  const count = await miniProgramItems.count();
  
  if (count > 0) {
    await miniProgramItems.first().click();
    await page.waitForLoadState('networkidle', { timeout: 15000 });
  }

  // Wait for sidebar
  await page.waitForSelector('.v-navigation-drawer, nav, aside', { timeout: 15000 }).catch(() => {});

  // Find the SETTINGS heading/section in the sidebar
  const settingsHeading = page.locator('.v-list-subheader, .v-subheader, [class*="subheader"], span, div').filter({ hasText: /^settings$/i });
  
  const settingsVisible = await settingsHeading.first().isVisible().catch(() => false);

  if (settingsVisible) {
    // Get all nav items in the navigation drawer
    const allNavItems = page.locator('.v-navigation-drawer .v-list-item__title, .v-navigation-drawer [class*="list-item"] span, aside .v-list-item__title');
    
    const navTexts = await allNavItems.allTextContents();
    
    // Check none of the nav items is exactly "Widget"
    const hasWidgetItem = navTexts.some(text => text.trim().toLowerCase() === 'widget');
    
    expect(hasWidgetItem, `Sidebar should not contain a "Widget" navigation item under SETTINGS. Found nav items: ${navTexts.join(', ')}`).toBe(false);
  } else {
    // If we can't find settings section, do a broader check on the entire page sidebar
    const allSidebarText = page.locator('.v-navigation-drawer, aside, nav[class*="sidebar"]').first();
    
    const sidebarExists = await allSidebarText.isVisible().catch(() => false);
    
    if (sidebarExists) {
      // Look for any list item with text "Widget" (case insensitive exact match)
      const widgetItems = allSidebarText.locator('.v-list-item, [role="menuitem"], [role="listitem"]').filter({ hasText: /^widget$/i });
      const widgetCount = await widgetItems.count();
      
      expect(widgetCount, 'No "Widget" navigation item should appear in the sidebar').toBe(0);
    }
  }
});