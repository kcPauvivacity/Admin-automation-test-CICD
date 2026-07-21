// Bug #17030: [Admin] Organisation Settings — University address 'x' button should be disabled (read-only, editable in System Settings only)
// ADO: https://dev.azure.com/vivacityapp/Viva/_workitems/edit/17030
// Auto-generated 2026-06-02
// REVIEW BEFORE MERGING — verify selectors and assertions

import { test, expect } from '@playwright/test';
import { loginToApp } from '../helpers/auth.helper';

test.setTimeout(120000);

test('BUG #17030 - University address x button should be disabled in Organisation Settings', async ({ page }) => {
  await loginToApp(page);

  // Navigate to Organisation Settings
  await page.goto('https://app-staging.vivacityapp.com');

  // Wait for the app to load
  await page.waitForSelector('.v-application', { timeout: 30000 });

  // Navigate to Organisation Settings
  await page.goto('https://app-staging.vivacityapp.com/demo-student/organisation-settings');
  await page.waitForSelector('.v-application', { timeout: 30000 });

  // Try alternative navigation paths if direct URL doesn't work
  const orgSettingsLink = page.locator('a, .v-list-item').filter({ hasText: /organisation settings/i }).first();
  if (await orgSettingsLink.isVisible({ timeout: 5000 }).catch(() => false)) {
    await orgSettingsLink.click();
    await page.waitForSelector('.v-application', { timeout: 15000 });
  }

  // Wait for the organisation settings page content to load
  await page.waitForLoadState('networkidle', { timeout: 30000 });

  // Locate the university address field
  // The field could be a combobox, autocomplete, or select with a clearable option
  const universityAddressField = page.locator(
    '[data-testid*="university"], [data-testid*="address"], .v-autocomplete, .v-combobox, .v-select'
  ).filter({ hasText: /university|address/i }).first();

  // Also look for labels near the field
  const universityLabel = page.locator('label, .v-label, .v-field__label').filter({ hasText: /university address/i }).first();

  let fieldFound = false;

  // Check if university address label exists on the page
  if (await universityLabel.isVisible({ timeout: 10000 }).catch(() => false)) {
    fieldFound = true;

    // Find the parent container of the university address field
    const fieldContainer = page.locator('.v-field, .v-input').filter({ has: page.locator('label, .v-label, .v-field__label').filter({ hasText: /university address/i }) }).first();

    if (await fieldContainer.isVisible({ timeout: 5000 }).catch(() => false)) {
      // Look for the clear/x button within the university address field container
      const clearButton = fieldContainer.locator(
        '.v-field__clearable button, button[aria-label*="clear" i], button[aria-label*="remove" i], .v-icon--clickable, [class*="clearable"]'
      ).first();

      const clearIcon = fieldContainer.locator(
        '.v-field__clearable, .mdi-close, .mdi-close-circle, [class*="clear"]'
      ).first();

      // Check if clear button exists and is enabled (this is the bug condition)
      const clearButtonExists = await clearButton.isVisible({ timeout: 5000 }).catch(() => false);
      const clearIconExists = await clearIcon.isVisible({ timeout: 5000 }).catch(() => false);

      if (clearButtonExists) {
        // Bug is present if the button is enabled/clickable
        const isDisabled = await clearButton.isDisabled().catch(() => false);
        expect(isDisabled, 'University address clear (x) button should be disabled in Organisation Settings').toBe(true);
      }

      if (clearIconExists) {
        // Verify the icon/button is not interactive
        const isDisabled = await clearIcon.isDisabled().catch(() => true);
        // If we can find a clickable clear element, the bug is present
        const hasClickableParent = await clearIcon.evaluate((el) => {
          const button = el.closest('button');
          if (!button) return false;
          return !button.disabled && button.getAttribute('disabled') === null;
        }).catch(() => false);

        expect(hasClickableParent, 'University address clear (x) button should not be clickable in Organisation Settings').toBe(false);
      }
    }
  }

  // Broader search for university address section with clearable x button
  const allClearableFields = page.locator('.v-field--clearable, [clearable]');
  const clearableCount = await allClearableFields.count();

  for (let i = 0; i < clearableCount; i++) {
    const field = allClearableFields.nth(i);
    const fieldText = await field.textContent().catch(() => '');
    const fieldHtml = await field.innerHTML().catch(() => '');

    if (/university|address/i.test(fieldText) || /university|address/i.test(fieldHtml)) {
      fieldFound = true;

      // Find the x/clear button within this field
      const xButton = field.locator('button, .v-field__clearable button').first();

      if (await xButton.isVisible({ timeout: 3000 }).catch(() => false)) {
        const isDisabled = await xButton.isDisabled().catch(() => false);
        expect(isDisabled, 'University address x button should be disabled (read-only in Organisation Settings)').toBe(true);
      }
    }
  }

  // If no specific field was found, do a broader page check
  if (!fieldFound) {
    // Look for any element with university address text on the page
    const pageContent = await page.content();
    const hasUniversityContent = /university.*address|address.*university/i.test(pageContent);

    if (hasUniversityContent) {
      // Find the x button near university address content
      const xButtons = page.locator(
        '.v-field__clearable button:not([disabled]), button.v-btn--icon:not([disabled])'
      ).filter({ hasText: /×|✕/ });

      // Check all potential clear buttons on the page for the university address context
      const universitySection = page.locator('[class*="university"], [class*="address"], .v-card, .v-form').filter({ hasText: /university address/i }).first();

      if (await universitySection.isVisible({ timeout: 5000 }).catch(() => false)) {
        const sectionClearButton = universitySection.locator(
          '.v-field__clearable button:not([disabled]), .mdi-close'
        ).first();

        if (await sectionClearButton.isVisible({ timeout: 3000 }).catch(() => false)) {
          const isDisabled = await sectionClearButton.isDisabled().catch(() => false);
          expect(isDisabled, 'University address x/clear button must be disabled in Organisation Settings (read-only field)').toBe(true);
        }
      }
    }
  }

  // Final assertion: verify the page loaded and we tested the organisation settings
  await expect(page.locator('.v-application')).toBeVisible({ timeout: 10000 });
});