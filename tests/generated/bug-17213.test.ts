// Bug #17213: [App Editor] Releases - Step 2 and Step 3 circles should be filled, not outline
// ADO: https://dev.azure.com/vivacityapp/Viva/_workitems/edit/17213
// Auto-generated 2026-06-11
// REVIEW BEFORE MERGING — verify selectors and assertions

import { test, expect } from '@playwright/test';
import { loginToApp } from '../helpers/auth.helper';

test.setTimeout(120000);

test('BUG #17213 - All 3 step circles in Mini Program Release should be filled teal, not outline', async ({ page }) => {
  await loginToApp(page, 90000, 'pau.kie.chee@fusioneta.com', 'PAOpaopao@9696');

    await page.goto('https://app-staging.vivacityapp.com/demo-student/app-editor', { waitUntil: 'load', timeout: 30000 });
  await page.waitForSelector('.v-application', { timeout: 15000 });
  await page.waitForTimeout(2000);

  // Wait for App Editor to load
  await page.waitForURL(/app-editor|mini-program/i, { timeout: 20000 });

  // Find and click on a Mini Program
  const miniProgramItem = page.locator('.v-card, .v-list-item, [class*="program"], [class*="mini"]').first();
  await miniProgramItem.waitFor({ timeout: 20000 });
  await miniProgramItem.click();

  // Navigate to Releases section
  const releasesLink = page.locator('a, .v-tab, .v-list-item, button').filter({ hasText: /release/i }).first();
  await releasesLink.waitFor({ timeout: 20000 });
  await releasesLink.click();

  // Wait for releases page to load
  await page.waitForSelector('[class*="step"], .v-stepper, [class*="stepper"], [class*="circle"]', { timeout: 20000 });

  // Check that all 3 step circles are filled (not just outlines)
  // Filled circles should have a background color / filled style
  // Outline circles would typically have border styling with transparent/white background

  // Look for step indicators - they could be stepper items, circles, etc.
  const stepCircles = page.locator(
    '.v-stepper__step-number, [class*="step-circle"], [class*="step-number"], [class*="stepper"] .v-avatar, .v-stepper .v-icon'
  );

  const count = await stepCircles.count();

  if (count >= 3) {
    // Check each of the 3 step circles
    for (let i = 0; i < Math.min(count, 3); i++) {
      const circle = stepCircles.nth(i);
      await expect(circle).toBeVisible();

      const styles = await circle.evaluate((el) => {
        const computed = window.getComputedStyle(el);
        return {
          backgroundColor: computed.backgroundColor,
          background: computed.background,
          color: computed.color,
          borderColor: computed.borderColor,
          opacity: computed.opacity,
        };
      });

      // A filled circle should not have a transparent or white background
      // rgba(0,0,0,0) or empty indicates outline/unfilled
      const isFilled =
        styles.backgroundColor !== 'rgba(0, 0, 0, 0)' &&
        styles.backgroundColor !== 'transparent' &&
        styles.backgroundColor !== '' &&
        styles.backgroundColor !== 'rgb(255, 255, 255)';

      expect(
        isFilled,
        `Step circle ${i + 1} should be filled (teal background) but appears to be an outline. Background color: ${styles.backgroundColor}`
      ).toBe(true);
    }
  } else {
    // Alternative: check using page-specific selectors for stepper
    // Try Vuetify stepper component classes
    const vuetifySteppers = page.locator('.v-stepper__step');
    const stepperCount = await vuetifySteppers.count();

    expect(stepperCount, 'Should find at least 3 stepper steps on the releases page').toBeGreaterThanOrEqual(3);

    for (let i = 0; i < Math.min(stepperCount, 3); i++) {
      const step = vuetifySteppers.nth(i);
      const stepNumber = step.locator('.v-stepper__step-number, [class*="step-number"]').first();

      if (await stepNumber.isVisible()) {
        const bgColor = await stepNumber.evaluate((el) => {
          return window.getComputedStyle(el).backgroundColor;
        });

        const isFilledTeal =
          bgColor !== 'rgba(0, 0, 0, 0)' &&
          bgColor !== 'transparent' &&
          bgColor !== 'rgb(255, 255, 255)';

        expect(
          isFilledTeal,
          `Step ${i + 1} number circle should be filled with teal color but background is: ${bgColor}`
        ).toBe(true);
      }
    }
  }

  // Additional check: verify steps 2 and 3 match the filled state of step 1
  const allStepNumbers = page.locator('.v-stepper__step-number, [class*="step-circle"], [class*="step-number"]');
  const totalStepNumbers = await allStepNumbers.count();

  if (totalStepNumbers >= 3) {
    const step1BgColor = await allStepNumbers.nth(0).evaluate((el) => window.getComputedStyle(el).backgroundColor);
    const step2BgColor = await allStepNumbers.nth(1).evaluate((el) => window.getComputedStyle(el).backgroundColor);
    const step3BgColor = await allStepNumbers.nth(2).evaluate((el) => window.getComputedStyle(el).backgroundColor);

    // Steps 2 and 3 should have the same background color as Step 1 (all filled)
    expect(
      step2BgColor,
      `Step 2 circle background (${step2BgColor}) should match Step 1 (${step1BgColor}) - both should be filled teal`
    ).toBe(step1BgColor);

    expect(
      step3BgColor,
      `Step 3 circle background (${step3BgColor}) should match Step 1 (${step1BgColor}) - both should be filled teal`
    ).toBe(step1BgColor);
  }
});