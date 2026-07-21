// Bug #17355: [App Editor] Integration > Tencent Cloud - "Create Cloud Environment" button missing
// ADO: https://dev.azure.com/vivacityapp/Viva/_workitems/edit/17355
// Auto-generated 2026-07-10
// REVIEW BEFORE MERGING — verify selectors and assertions

import { test, expect } from '@playwright/test';
import { loginToApp } from '../helpers/auth.helper';

test.setTimeout(120000);

test('BUG #17355: Create Cloud Environment button should be visible in Tencent Cloud tab', async ({ page }) => {
  await loginToApp(page, 90000, 'pau.kie.chee@fusioneta.com', 'PAOpaopao@9696');

  // Navigate to App Editor
  await page.goto('https://app-staging.vivacityapp.com/demo-student/app-editor', { waitUntil: 'load', timeout: 30000 });
  await page.waitForSelector('.v-application', { timeout: 15000 });
  await page.waitForTimeout(2000);

  // Wait for App Editor to load
  await page.waitForSelector('.v-application', { timeout: 15000 });

  // Look for Integration tab/menu item
  const integrationLink = page.locator('a, .v-list-item, .v-tab, .v-btn').filter({ hasText: /integration/i }).first();
  await integrationLink.waitFor({ state: 'visible', timeout: 30000 });
  await integrationLink.click();

  // Wait for Integration page to load
  await page.waitForLoadState('networkidle', { timeout: 30000 });

  // Click on Tencent Cloud tab
  const tencentCloudTab = page.locator('.v-tab, .v-btn, [role="tab"]').filter({ hasText: /tencent cloud/i }).first();
  await tencentCloudTab.waitFor({ state: 'visible', timeout: 30000 });
  await tencentCloudTab.click();

  // Wait for the tab content to render
  await page.waitForLoadState('networkidle', { timeout: 15000 });

  // Verify the description text is present
  const descriptionText = page.locator('text=/No cloud environment on this Mini Program/i');
  await expect(descriptionText).toBeVisible({ timeout: 15000 });

  // Verify the "Create Cloud Environment" button is present and visible
  // This assertion FAILS when the bug is present and PASSES when fixed
  const createButton = page.locator('.v-btn, button').filter({ hasText: /create cloud environment/i }).first();
  await expect(createButton).toBeVisible({ timeout: 15000 });

  // Also verify the button is not disabled (it should be clickable)
  await expect(createButton).toBeEnabled();
});