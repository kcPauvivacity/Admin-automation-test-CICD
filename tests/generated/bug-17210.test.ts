// Bug #17210: [App Editor] Integration - "Chatwoot Integration" tab renamed to "Other Integration"
// ADO: https://dev.azure.com/vivacityapp/Viva/_workitems/edit/17210
// Auto-generated 2026-06-11
// REVIEW BEFORE MERGING — verify selectors and assertions

import { test, expect } from '@playwright/test';
import { loginToApp } from '../helpers/auth.helper';

test.setTimeout(120000);

test('BUG #17210 - Integration second tab should be labelled "Chatwoot Integration" not "Other Integration"', async ({ page }) => {
  await loginToApp(page, 90000, 'pau.kie.chee@fusioneta.com', 'PAOpaopao@9696');

  // Navigate to App Editor
  await page.waitForSelector('.v-application', { timeout: 30000 });

  // Navigate to App Editor section
  await page.goto('https://app-staging.vivacityapp.com/demo-student/app-editor', { waitUntil: 'load', timeout: 30000 });
  await page.waitForSelector('.v-application', { timeout: 15000 });
  await page.waitForTimeout(2000);

  // Wait for App Editor page to load
  await page.waitForLoadState('networkidle', { timeout: 30000 });

  // Find and click on a Mini Program
  const miniProgramItem = page.locator('.v-list-item, .v-card, [class*="program"], [class*="mini"]').first();
  await miniProgramItem.waitFor({ timeout: 30000 });
  await miniProgramItem.click();

  await page.waitForLoadState('networkidle', { timeout: 20000 });

  // Navigate to Integration tab/section
  const integrationNav = page.locator('a, .v-tab, .v-list-item, .v-btn').filter({ hasText: /^integration$/i }).first();
  await integrationNav.waitFor({ timeout: 30000 });
  await integrationNav.click();

  await page.waitForLoadState('networkidle', { timeout: 20000 });

  // Wait for tabs to be visible
  await page.waitForSelector('.v-tab, [role="tab"]', { timeout: 30000 });

  // Get all tabs in the Integration section
  const tabs = page.locator('.v-tab, [role="tab"]');
  await tabs.first().waitFor({ timeout: 20000 });

  // Check that the second tab is NOT labelled "Other Integration"
  const secondTab = tabs.nth(1);
  await secondTab.waitFor({ timeout: 20000 });

  const secondTabText = await secondTab.textContent();

  // Assert the second tab is NOT "Other Integration" (bug condition)
  expect(secondTabText?.trim()).not.toMatch(/other integration/i);

  // Assert the second tab IS "Chatwoot Integration" (expected condition)
  expect(secondTabText?.trim()).toMatch(/chatwoot integration/i);
});