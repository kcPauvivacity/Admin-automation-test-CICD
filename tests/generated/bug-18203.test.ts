// Bug #18203: [Settings › User Profile] Personal Security email input has white background in dark mode
// ADO: https://dev.azure.com/vivacityapp/Viva/_workitems/edit/18203
// Auto-generated 2026-08-18
// REVIEW BEFORE MERGING — verify selectors and assertions

import { test, expect } from '@playwright/test';
import { loginToApp } from '../helpers/auth.helper';

test.setTimeout(120000);

test('BUG #18203: Personal Security email input should not have white background in dark mode', async ({ page }) => {
  await loginToApp(page);

  // Enable dark mode via user preferences
  await page.goto('https://app-staging.vivacityapp.com');
  await page.waitForLoadState('networkidle');

  // Navigate to Settings > User Profile
  await page.goto('https://app-staging.vivacityapp.com/demo-student/settings/user-profile');
  await page.waitForLoadState('networkidle');

  // Wait for the page to render
  await page.waitForSelector('.v-application', { timeout: 30000 });

  // Enable dark mode if not already enabled
  // Look for theme toggle or check current theme
  const isDarkTheme = await page.evaluate(() => {
    const app = document.querySelector('.v-application');
    return app?.classList.contains('v-theme--VIVA_DARK_THEME') || 
           app?.classList.contains('v-theme--DARK_BLUE_THEME') ||
           app?.getAttribute('data-theme') === 'dark';
  });

  if (!isDarkTheme) {
    // Try to find and click theme toggle button
    const themeToggle = page.locator('[data-testid="theme-toggle"], [aria-label*="dark"], [aria-label*="theme"], .theme-toggle').first();
    const themeToggleVisible = await themeToggle.isVisible().catch(() => false);
    
    if (themeToggleVisible) {
      await themeToggle.click();
      await page.waitForTimeout(1000);
    } else {
      // Try navigating with dark theme query param or find another way to toggle
      // Check for a settings or appearance option
      const appearanceLink = page.locator('text=/appearance|theme|dark mode/i').first();
      const appearanceLinkVisible = await appearanceLink.isVisible().catch(() => false);
      if (appearanceLinkVisible) {
        await appearanceLink.click();
        await page.waitForTimeout(500);
      }
    }
  }

  // Re-navigate to ensure we're on user profile with dark mode active
  await page.goto('https://app-staging.vivacityapp.com/demo-student/settings/user-profile');
  await page.waitForLoadState('networkidle');
  await page.waitForSelector('.v-application', { timeout: 30000 });

  // Check if dark theme is applied
  const appHasDarkTheme = await page.evaluate(() => {
    const app = document.querySelector('.v-application');
    if (!app) return false;
    const classes = Array.from(app.classList);
    return classes.some(c => c.toLowerCase().includes('dark'));
  });

  // If we can't enable dark mode, skip with a note but try our best
  // Look for Personal Security section
  const personalSecuritySection = page.locator('text=/personal security/i').first();
  await expect(personalSecuritySection).toBeVisible({ timeout: 30000 });

  // Scroll to Personal Security section
  await personalSecuritySection.scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);

  // Find the email input field within the Personal Security section
  // Look for input fields near the "Personal Security" heading
  const emailInput = page.locator('.v-field input[type="email"], .v-field input[type="text"]')
    .filter({ hasText: '' })
    .first();

  // Try a more specific selector for the Personal Security email field
  const securitySection = page.locator('text=/personal security/i').locator('../..');
  
  // Find email input in the Personal Security card/section
  const emailInputInSection = page.locator([
    '[data-testid="security-email"]',
    '[data-testid="personal-security"] input',
    '.personal-security input[type="email"]',
    '.personal-security input[type="text"]',
  ].join(', ')).first();

  // Broader search: find all v-field inputs near "Personal Security" text
  const allInputs = page.locator('.v-field');
  const inputCount = await allInputs.count();

  // Find the Personal Security section card
  const securityCard = page.locator('.v-card, .v-sheet').filter({ hasText: /personal security/i }).last();
  const securityCardVisible = await securityCard.isVisible().catch(() => false);

  if (securityCardVisible) {
    await securityCard.scrollIntoViewIfNeeded();
    
    // Get all v-field elements within the personal security card
    const fieldsInCard = securityCard.locator('.v-field');
    const fieldCount = await fieldsInCard.count();

    expect(fieldCount).toBeGreaterThan(0);

    // Check each field's background color - looking specifically for the email input
    for (let i = 0; i < fieldCount; i++) {
      const field = fieldsInCard.nth(i);
      const fieldVisible = await field.isVisible().catch(() => false);
      
      if (!fieldVisible) continue;

      // Check if this field contains an email input
      const inputEl = field.locator('input[type="email"], input[placeholder*="email" i], input[autocomplete*="email" i]');
      const hasEmailInput = await inputEl.count() > 0;

      if (hasEmailInput || i === 0) {
        // Get the computed background color of the field
        const bgColor = await field.evaluate((el) => {
          return window.getComputedStyle(el).backgroundColor;
        });

        // In dark mode, the field should NOT have a pure white background
        // rgb(255, 255, 255) is white
        if (appHasDarkTheme) {
          expect(bgColor).not.toBe('rgb(255, 255, 255)');
          expect(bgColor).not.toBe('rgba(255, 255, 255, 1)');
          expect(bgColor).not.toBe('#ffffff');
          expect(bgColor).not.toBe('#fff');
        }

        // Also check the input element itself
        const inputBgColor = await field.evaluate((el) => {
          const input = el.querySelector('input');
          if (!input) return null;
          return window.getComputedStyle(input).backgroundColor;
        });

        if (inputBgColor && appHasDarkTheme) {
          // The input background should not be pure white in dark mode
          // Allow transparent or dark colors
          const isWhite = inputBgColor === 'rgb(255, 255, 255)' || 
                          inputBgColor === 'rgba(255, 255, 255, 1)';
          expect(isWhite).toBe(false);
        }
      }
    }
  } else {
    // Fallback: search the entire page for email inputs in dark mode
    const allVFields = page.locator('.v-field');
    const totalFields = await allVFields.count();

    let foundEmailField = false;

    for (let i = 0; i < totalFields; i++) {
      const field = allVFields.nth(i);
      const hasEmail = await field.locator('input[type="email"]').count();
      
      if (hasEmail > 0) {
        foundEmailField = true;
        
        if (appHasDarkTheme) {
          const bgColor = await field.evaluate((el) => {
            return window.getComputedStyle(el).backgroundColor;
          });
          
          expect(bgColor).not.toBe('rgb(255, 255, 255)');
        }
      }
    }

    // If we found no email fields but dark mode is on, check CSS variables usage
    if (!foundEmailField && appHasDarkTheme) {
      // Check if any solo variant fields exist that bypass theme
      const soloFields = page.locator('.v-field--variant-solo');
      const soloCount = await soloFields.count();
      
      if (soloCount > 0) {
        for (let i = 0; i < soloCount; i++) {
          const field = soloFields.nth(i);
          const bgColor = await field.evaluate((el) => {
            return window.getComputedStyle(el).backgroundColor;
          });
          
          // Solo variant in dark mode should use surface color, not white
          expect(bgColor).not.toBe('rgb(255, 255, 255)');
        }
      }
    }
  }

  // Additional check: verify the dark theme is actually applied to the application
  // and the CSS variable --v-theme-surface is being respected
  if (appHasDarkTheme) {
    const surfaceVariableCheck = await page.evaluate(() => {
      const app = document.querySelector('.v-application');
      if (!app) return null;
      
      const computedStyle = window.getComputedStyle(app);
      const surfaceVar = computedStyle.getPropertyValue('--v-theme-surface');
      return surfaceVar.trim();
    });

    // In dark mode, surface should not be pure white (255, 255, 255)
    if (surfaceVariableCheck) {
      expect(surfaceVariableCheck).not.toBe('255, 255, 255');
      expect(surfaceVariableCheck).not.toBe('#ffffff');
    }
  }
});