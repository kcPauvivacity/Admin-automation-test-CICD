// Bug #17264: [App Editor] Global Settings > Window - No character limit or input sanitisation on Title Text
// ADO: https://dev.azure.com/vivacityapp/Viva/_workitems/edit/17264
// Auto-generated 2026-06-12
// REVIEW BEFORE MERGING — verify selectors and assertions

import { test, expect } from '@playwright/test';
import { loginToApp } from '../helpers/auth.helper';

test.setTimeout(120000);

test('BUG #17264 - Global Settings > Window > Title Text should have character limit and input sanitisation', async ({ page }) => {
  await loginToApp(page, 90000, 'pau.kie.chee@fusioneta.com', 'PAOpaopao@9696');

  // Navigate to App Editor
  await page.goto('https://app-staging.vivacityapp.com/demo-student/app-editor', { waitUntil: 'load', timeout: 30000 });
  await page.waitForSelector('.v-application', { timeout: 15000 });
  await page.waitForTimeout(2000);

  await page.waitForURL(/app-editor|appeditor/i, { timeout: 15000 }).catch(async () => {
    await page.goto('https://app-staging.vivacityapp.com/app-editor');
  });

  await page.waitForSelector('.v-application', { timeout: 15000 });

  // Navigate to Global Settings
  const globalSettingsLink = page.locator('a, [role="link"], .v-list-item, button').filter({ hasText: /global settings/i }).first();
  await globalSettingsLink.waitFor({ state: 'visible', timeout: 15000 });
  await globalSettingsLink.click();

  // Navigate to Window tab
  const windowTab = page.locator('[role="tab"], .v-tab, button').filter({ hasText: /window/i }).first();
  await windowTab.waitFor({ state: 'visible', timeout: 15000 });
  await windowTab.click();

  // Find the Title Text input field
  const titleTextInput = page.locator('input, textarea').filter({ }).nth(0);

  // Try to find a more specific input using label
  const titleTextLabel = page.locator('label, .v-label').filter({ hasText: /title text/i }).first();
  let inputField: import('@playwright/test').Locator;

  try {
    await titleTextLabel.waitFor({ state: 'visible', timeout: 10000 });
    // Find associated input
    const labelFor = await titleTextLabel.getAttribute('for');
    if (labelFor) {
      inputField = page.locator(`#${labelFor}`);
    } else {
      // Try sibling or parent input
      inputField = titleTextLabel.locator('..').locator('input, textarea').first();
    }
  } catch {
    // Fallback: find input near Title Text
    inputField = page.locator('.v-text-field').filter({ hasText: /title text/i }).locator('input').first();
  }

  await inputField.waitFor({ state: 'visible', timeout: 15000 });

  // Store original value
  const originalValue = await inputField.inputValue();

  try {
    // ---- Test 1: Character limit enforcement ----
    const longString = 'A'.repeat(150);
    await inputField.clear();
    await inputField.fill(longString);
    await inputField.dispatchEvent('input');

    const valueAfterLongInput = await inputField.inputValue();
    const inputLength = valueAfterLongInput.length;

    // The input should be limited to a reasonable max (e.g. <= 100 chars)
    // If bug is present, length will be 150 (no limit enforced)
    expect(inputLength, `BUG #17264: No character limit enforced. Input accepted ${inputLength} characters (150 entered). Expected a maximum limit <= 100.`).toBeLessThanOrEqual(100);

    // ---- Test 2: Character counter visibility ----
    // A counter like "X/50" should be visible
    const counterVisible = await page.locator('.v-counter, [class*="counter"], .v-field__details').filter({ hasText: /\d+\/\d+/ }).first().isVisible().catch(() => false);
    expect(counterVisible, 'BUG #17264: No character counter (e.g. "12/50") is displayed for Title Text input.').toBe(true);

    // ---- Test 3: XSS / HTML injection sanitisation ----
    const xssPayload = `<script>alert('xss')</script>`;
    await inputField.clear();
    await inputField.fill(xssPayload);
    await inputField.dispatchEvent('input');

    const valueAfterXss = await inputField.inputValue();

    // The input should either reject the script tag or sanitise it
    // If bug is present, the raw script tag is accepted as-is
    const containsScriptTag = valueAfterXss.toLowerCase().includes('<script>');
    expect(containsScriptTag, `BUG #17264: HTML/script injection not sanitised. Input accepted: ${valueAfterXss}`).toBe(false);

    // ---- Test 4: Validation error for long strings ----
    await inputField.clear();
    await inputField.fill(longString);
    await inputField.dispatchEvent('input');
    await inputField.blur();

    // Expect a validation error message to appear
    const errorMessage = page.locator('.v-messages, .v-input__details, [class*="error"]').filter({ hasText: /max|limit|character|too long/i }).first();
    const errorVisible = await errorMessage.isVisible().catch(() => false);
    expect(errorVisible, 'BUG #17264: No validation error message shown when title text exceeds character limit.').toBe(true);

  } finally {
    // Restore original value
    try {
      await inputField.clear();
      if (originalValue) {
        await inputField.fill(originalValue);
      }
      await inputField.dispatchEvent('input');

      // Save/apply if there's a save button
      const saveButton = page.locator('button').filter({ hasText: /save|apply/i }).first();
      const saveVisible = await saveButton.isVisible().catch(() => false);
      if (saveVisible) {
        await saveButton.click();
        await page.waitForTimeout(1000);
      }
    } catch {
      // Best effort cleanup
    }
  }
});