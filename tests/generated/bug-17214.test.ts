// Bug #17214: [App Editor] Integration > Tencent Cloud - Extra "Back" link shown, missing Refresh/Disconnect buttons
// ADO: https://dev.azure.com/vivacityapp/Viva/_workitems/edit/17214
// Auto-generated 2026-06-11
// REVIEW BEFORE MERGING — verify selectors and assertions

import { test, expect } from '@playwright/test';
import { loginToApp } from '../helpers/auth.helper';

test.setTimeout(120000);

test('BUG #17214: Tencent Cloud tab - no Back link, Refresh and Disconnect buttons visible', async ({ page }) => {
  await loginToApp(page, 90000, 'pau.kie.chee@fusioneta.com', 'PAOpaopao@9696');

    await page.goto('https://app-staging.vivacityapp.com/demo-student/app-editor', { waitUntil: 'load', timeout: 30000 });
  await page.waitForSelector('.v-application', { timeout: 15000 });
  await page.waitForTimeout(2000);

  // Wait for mini programs list to load
  await page.waitForSelector('.v-card, .v-list-item, [class*="mini-program"], [class*="miniprogram"]', { timeout: 20000 });

  // Click on the first Mini Program
  const miniProgramItem = page.locator('.v-card, .v-list-item').filter({ hasText: /mini program|miniprogram/i }).first();
  const firstProgram = page.locator('.v-card[href], .v-list-item[href], .v-card button, .mini-program-item').first();

  // Try to find any clickable mini program entry
  const programCards = page.locator('.v-card').filter({ hasText: /./ });
  const cardCount = await programCards.count();

  if (cardCount > 0) {
    await programCards.first().click();
  } else {
    // Fallback: look for list items in app editor
    const listItems = page.locator('.v-list-item').filter({ hasText: /./ });
    await listItems.first().click();
  }

  // Wait for the mini program editor to load
  await page.waitForSelector('.v-tabs, [role="tablist"], .v-tab', { timeout: 20000 });

  // Navigate to Integration tab
  const integrationTab = page.locator('.v-tab, [role="tab"]').filter({ hasText: /integration/i });
  await integrationTab.waitFor({ state: 'visible', timeout: 20000 });
  await integrationTab.click();

  // Wait for Integration section to load
  await page.waitForSelector('.v-card, .integration-section, [class*="integration"]', { timeout: 20000 });

  // Click on Tencent Cloud tab
  const tencentTab = page.locator('.v-tab, [role="tab"], .v-btn, .v-list-item').filter({ hasText: /tencent cloud/i });
  await tencentTab.waitFor({ state: 'visible', timeout: 20000 });
  await tencentTab.click();

  // Wait for Tencent Cloud section to load
  await page.waitForSelector('.v-card', { timeout: 20000 });

  // Give the page a moment to fully render
  await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});

  // BUG CHECK 1: "< Back" link should NOT be present
  const backLink = page.locator('a, .v-btn, [class*="back"]').filter({ hasText: /^\s*<?\s*back\s*>?\s*$/i });
  const backLinkByArrow = page.locator('a, .v-btn').filter({ hasText: /←|‹|<\s*back/i });

  const backVisible = await backLink.isVisible().catch(() => false);
  const backArrowVisible = await backLinkByArrow.isVisible().catch(() => false);

  // This assertion FAILS if bug is present (Back link is shown)
  expect(backVisible, '"< Back" link should NOT be visible on Tencent Cloud tab').toBe(false);
  expect(backArrowVisible, '"< Back" navigation link should NOT be visible on Tencent Cloud tab').toBe(false);

  // BUG CHECK 2: "Refresh Cloud Environment" button should be visible
  const refreshButton = page.locator('.v-btn').filter({ hasText: /refresh cloud environment/i });
  // This assertion FAILS if bug is present (Refresh button is missing)
  await expect(refreshButton.first(), '"Refresh Cloud Environment" button should be visible').toBeVisible({ timeout: 10000 });

  // BUG CHECK 3: "Disconnect" button should be visible
  const disconnectButton = page.locator('.v-btn').filter({ hasText: /disconnect/i });
  // This assertion FAILS if bug is present (Disconnect button is missing)
  await expect(disconnectButton.first(), '"Disconnect" button should be visible').toBeVisible({ timeout: 10000 });
});