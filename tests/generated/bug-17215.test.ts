// Bug #17215: [App Editor] Integration > Other Integration - Card title changed from "Chat Centre" to "Call Centre"
// ADO: https://dev.azure.com/vivacityapp/Viva/_workitems/edit/17215
// Auto-generated 2026-06-11
// REVIEW BEFORE MERGING — verify selectors and assertions

import { test, expect } from '@playwright/test';
import { loginToApp } from '../helpers/auth.helper';

test.setTimeout(120000);

test('BUG #17215 - Other Integration card title should be "Chat Centre" not "Call Centre"', async ({ page }) => {
  await loginToApp(page, 90000, 'pau.kie.chee@fusioneta.com', 'PAOpaopao@9696');

    await page.goto('https://app-staging.vivacityapp.com/demo-student/app-editor', { waitUntil: 'load', timeout: 30000 });
  await page.waitForSelector('.v-application', { timeout: 15000 });
  await page.waitForTimeout(2000);

  // Wait for App Editor to load and find a Mini Program to open
  await page.waitForSelector('.v-card, .mini-program, [class*="program"]', { timeout: 20000 });

  // Click on the first available mini program
  const miniProgram = page.locator('.v-card, .mini-program, [class*="program-card"]').first();
  await miniProgram.waitFor({ state: 'visible', timeout: 20000 });
  await miniProgram.click();

  // Navigate to Integration section
  const integrationNav = page.locator('a, .v-tab, .v-list-item, button').filter({ hasText: /integration/i }).first();
  await integrationNav.waitFor({ state: 'visible', timeout: 20000 });
  await integrationNav.click();

  // Click on "Other Integration" tab
  const otherIntegrationTab = page.locator('.v-tab, button, [role="tab"]').filter({ hasText: /other integration/i }).first();
  await otherIntegrationTab.waitFor({ state: 'visible', timeout: 20000 });
  await otherIntegrationTab.click();

  // Wait for the integration cards to load
  await page.waitForSelector('.v-card, .integration-card, [class*="integration"]', { timeout: 20000 });

  // Assert that "Chat Centre" is visible
  const chatCentreCard = page.locator('.v-card, .v-card-title, .integration-card, [class*="card"]').filter({ hasText: /chat centre/i }).first();
  await expect(chatCentreCard).toBeVisible({ timeout: 15000 });

  // Assert that "Call Centre" is NOT present as a card title (this is the bug condition)
  const callCentreCard = page.locator('.v-card-title, .card-title, [class*="card-title"], h3, h4').filter({ hasText: /call centre/i });
  await expect(callCentreCard).toHaveCount(0);
});