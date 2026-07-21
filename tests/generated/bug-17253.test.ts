// Bug #17253: [App Editor] Global Settings > Window - Field labels use Title Case instead of lowercase
// ADO: https://dev.azure.com/vivacityapp/Viva/_workitems/edit/17253
// Auto-generated 2026-06-12
// REVIEW BEFORE MERGING — verify selectors and assertions

import { test, expect } from '@playwright/test';
import { loginToApp } from '../helpers/auth.helper';

test.setTimeout(120000);

test('Bug #17253 - Global Settings > Window field labels should use lowercase not Title Case', async ({ page }) => {
  await loginToApp(page, 90000, 'pau.kie.chee@fusioneta.com', 'PAOpaopao@9696');
  await page.goto('https://app-staging.vivacityapp.com/demo-student/app-editor', { waitUntil: 'load', timeout: 30000 });
  await page.waitForSelector('.v-application', { timeout: 15000 });
  await page.waitForTimeout(2000);

  // Navigate to App Editor
  await page.waitForSelector('text=App Editor', { timeout: 30000 });
  await page.click('text=App Editor');

  // Wait for mini programs list and open the first one
  await page.waitForSelector('.mini-program, [class*="mini-program"], [data-testid*="mini-program"], .program-item, [class*="program"]', { timeout: 30000 });
  
  // Try to find and click the first mini program
  const miniProgramSelectors = [
    '.mini-program',
    '[class*="mini-program"]',
    '[data-testid="mini-program"]',
    '.program-card',
    '[class*="program-card"]',
    '.app-item',
    '[class*="app-item"]',
  ];

  let clicked = false;
  for (const selector of miniProgramSelectors) {
    const el = page.locator(selector).first();
    if (await el.isVisible({ timeout: 3000 }).catch(() => false)) {
      await el.click();
      clicked = true;
      break;
    }
  }

  if (!clicked) {
    // Fallback: look for any clickable program entry
    await page.locator('[class*="list"] [class*="item"]').first().click();
  }

  // Navigate to Global Settings
  await page.waitForSelector('text=Global Settings', { timeout: 30000 });
  await page.click('text=Global Settings');

  // Click on Window under CONFIGURATION
  await page.waitForSelector('text=Window', { timeout: 30000 });
  await page.click('text=Window');

  // Wait for the Window settings panel to load
  await page.waitForTimeout(2000);

  // Check that field labels use lowercase (expected/fixed state)
  // and NOT Title Case (buggy state)

  // Expected correct labels (lowercase after first word)
  const expectedLabels = [
    'Title text',
    'Background color',
    'Text style',
    'Pull-down (top) color',
    'Pull-up (bottom) color',
    'Background text style',
  ];

  // Buggy labels (Title Case - should NOT be present when fixed)
  const buggyLabels = [
    'Title Text',
    'Background Color',
    'Text Style',
    'Pull-down Top Color',
    'Pull-up Bottom Color',
    'Background Text Style',
  ];

  // Verify the correct lowercase labels are visible
  for (const label of expectedLabels) {
    const locator = page.locator(`text="${label}"`).first();
    await expect(locator).toBeVisible({ timeout: 10000 });
  }

  // Verify buggy Title Case labels are NOT present
  for (const buggyLabel of buggyLabels) {
    const locator = page.locator(`text="${buggyLabel}"`).first();
    await expect(locator).not.toBeVisible({ timeout: 5000 });
  }
});