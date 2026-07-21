// Bug #17773: [Sidebar] Missing 'Chat Centre' navigation item under CRM
// ADO: https://dev.azure.com/vivacityapp/Viva/_workitems/edit/17773
// Auto-generated 2026-07-16
// REVIEW BEFORE MERGING — verify selectors and assertions

import { test, expect } from '@playwright/test';
import { loginToApp } from '../helpers/auth.helper';

test.setTimeout(120000);

test('BUG #17773 - Chat Centre navigation item should be visible under CRM in sidebar', async ({ page }) => {
  await loginToApp(page);

  // Wait for the application to fully load
  await page.waitForSelector('.v-application', { timeout: 30000 });

  // Look for the CRM section in the sidebar
  // Try to find and expand the CRM section if it's collapsible
  const crmSection = page.locator('.v-navigation-drawer').filter({ hasText: 'CRM' });
  
  // Wait for the sidebar/navigation drawer to be visible
  await page.waitForSelector('.v-navigation-drawer', { timeout: 30000 });

  // Check if CRM nav group exists and click it to expand if needed
  const crmNavGroup = page.locator('.v-navigation-drawer').getByText('CRM', { exact: false }).first();
  
  if (await crmNavGroup.isVisible()) {
    await crmNavGroup.click().catch(() => {
      // CRM might already be expanded or not collapsible
    });
  }

  // Wait a moment for any expansion animation
  await page.waitForTimeout(1000);

  // Verify the four CRM items are present: AI Chat, Contacts, Enquiries, Chat Centre
  const sidebar = page.locator('.v-navigation-drawer');

  // Verify existing items are present (these should pass even with the bug)
  await expect(sidebar.getByText('AI Chat', { exact: false })).toBeVisible({ timeout: 10000 });
  await expect(sidebar.getByText('Contacts', { exact: false })).toBeVisible({ timeout: 10000 });
  await expect(sidebar.getByText('Enquiries', { exact: false })).toBeVisible({ timeout: 10000 });

  // This assertion FAILS when the bug is present (Chat Centre is missing)
  // and PASSES when the bug is fixed (Chat Centre is added back)
  await expect(sidebar.getByText('Chat Centre', { exact: false })).toBeVisible({ timeout: 10000 });
});