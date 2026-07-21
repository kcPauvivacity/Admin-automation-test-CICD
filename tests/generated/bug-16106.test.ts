// Bug #16106: [BUG]Appeditor > disable the configure until the user select the card
// ADO: https://dev.azure.com/vivacityapp/Viva/_workitems/edit/16106
// Auto-generated 2026-05-28
// REVIEW BEFORE MERGING — verify selectors and assertions

import { test, expect } from '@playwright/test';
import { loginToApp } from '../helpers/auth.helper';

test.setTimeout(120000);

test('BUG #16106: AppEditor configure button should be disabled until a card is selected', async ({ page }) => {
  await loginToApp(page, 90000, 'pau.kie.chee@fusioneta.com', 'PAOpaopao@9696');

  // Navigate to App Editor
  await page.goto('https://app-staging.vivacityapp.com/demo-student/app-editor', { waitUntil: 'load', timeout: 30000 });
  await page.waitForSelector('.v-application', { timeout: 15000 });
  await page.waitForTimeout(2000);

  // Wait for App Editor page to load
  await page.waitForURL(/app-editor|appeditor/i, { timeout: 20000 });
  await page.waitForSelector('.v-application', { timeout: 15000 });

  // Find the Configure button/element - it should be disabled before any card is selected
  const configureButton = page.locator(
    'button, .v-btn, [role="button"]'
  ).filter({ hasText: /configure/i }).first();

  await configureButton.waitFor({ state: 'visible', timeout: 20000 });

  // BUG: Configure button/control should be disabled when no card is selected
  // If bug is present, it will be enabled even without a card selected
  // Test FAILS if configure is enabled (bug present), PASSES if disabled (bug fixed)
  const isDisabled = await configureButton.isDisabled();
  expect(isDisabled, 'Configure button should be disabled before any card is selected').toBe(true);

  // Also check for disabled attribute or aria-disabled
  const ariaDisabled = await configureButton.getAttribute('aria-disabled');
  const disabledAttr = await configureButton.getAttribute('disabled');

  const isEffectivelyDisabled = isDisabled || ariaDisabled === 'true' || disabledAttr !== null;
  expect(isEffectivelyDisabled, 'Configure control should be disabled/inaccessible before card selection').toBe(true);

  // Now select a card and verify configure becomes enabled
  const cards = page.locator('.v-card, [class*="card"]').filter({ hasText: /.+/ });
  const cardCount = await cards.count();

  if (cardCount > 0) {
    // Click the first available card
    await cards.first().click();
    await page.waitForTimeout(1000);

    // After selecting a card, configure should become enabled
    const isDisabledAfterSelection = await configureButton.isDisabled();
    expect(
      isDisabledAfterSelection,
      'Configure button should be enabled after a card is selected'
    ).toBe(false);
  }
});