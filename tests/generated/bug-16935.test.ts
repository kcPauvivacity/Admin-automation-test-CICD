// Bug #16935: [Admin] Dark theme display issue
// ADO: https://dev.azure.com/vivacityapp/Viva/_workitems/edit/16935
// Auto-generated 2026-05-29
// REVIEW BEFORE MERGING — verify selectors and assertions

import { test, expect } from '@playwright/test';
import { loginToApp } from '../helpers/auth.helper';

test.setTimeout(120000);

test('BUG #16935 - Dark theme displays correctly in admin', async ({ page }) => {
  await loginToApp(page);

  // Navigate to admin/settings area where theme can be toggled
  await page.goto('https://app-staging.vivacityapp.com');
  await page.waitForLoadState('networkidle');

  // Check if there's a theme toggle button and switch to dark theme
  const themeToggle = page.locator('[data-testid="theme-toggle"], button[aria-label*="theme" i], button[aria-label*="dark" i], .theme-toggle');

  let wasAlreadyDark = false;

  // Check current theme
  const appRoot = page.locator('.v-application');
  await appRoot.waitFor({ state: 'visible', timeout: 30000 });

  const isDarkThemeActive = await appRoot.evaluate((el) => {
    return el.classList.contains('v-theme--DARK_BLUE_THEME');
  });

  wasAlreadyDark = isDarkThemeActive;

  if (!isDarkThemeActive) {
    // Try to find and click a theme toggle
    const toggleVisible = await themeToggle.first().isVisible().catch(() => false);
    if (toggleVisible) {
      await themeToggle.first().click();
      await page.waitForTimeout(1000);
    }
  }

  // Verify dark theme class is applied
  const darkThemeApplied = await appRoot.evaluate((el) => {
    return el.classList.contains('v-theme--DARK_BLUE_THEME');
  });

  if (darkThemeApplied) {
    // Bug check: verify dark theme renders correctly
    // The dark theme should have appropriate background colors (not white/light backgrounds)
    const appBackground = await appRoot.evaluate((el) => {
      const style = window.getComputedStyle(el);
      return style.backgroundColor;
    });

    // Dark theme background should NOT be white (rgb(255, 255, 255))
    expect(appBackground).not.toBe('rgb(255, 255, 255)');

    // Verify the sidebar/navigation has correct dark theme styling
    const sidebar = page.locator('.v-navigation-drawer, [data-testid="sidebar"], nav');
    const sidebarVisible = await sidebar.first().isVisible().catch(() => false);

    if (sidebarVisible) {
      const sidebarBg = await sidebar.first().evaluate((el) => {
        const style = window.getComputedStyle(el);
        return style.backgroundColor;
      });

      // Sidebar in dark mode should not be white
      expect(sidebarBg).not.toBe('rgb(255, 255, 255)');
    }

    // Verify v-theme--DARK_BLUE_THEME is properly scoped (not mixed with light theme)
    const lightThemeOnDark = await page.locator('.v-application.v-theme--DARK_BLUE_THEME .v-theme--BLUE_THEME').count();
    // There should be no conflicting light theme applied inside dark theme at the root level
    expect(lightThemeOnDark).toBe(0);

    // Check that main content area has dark theme colors
    const mainContent = page.locator('.v-main, main, [data-testid="main-content"]');
    const mainVisible = await mainContent.first().isVisible().catch(() => false);

    if (mainVisible) {
      const mainBg = await mainContent.first().evaluate((el) => {
        const style = window.getComputedStyle(el);
        return style.backgroundColor;
      });

      // Main content in dark mode should not be white
      expect(mainBg).not.toBe('rgb(255, 255, 255)');
    }

    // Verify cards/panels also use dark theme
    const cards = page.locator('.v-card');
    const cardCount = await cards.count();

    if (cardCount > 0) {
      const firstCardBg = await cards.first().evaluate((el) => {
        const style = window.getComputedStyle(el);
        return style.backgroundColor;
      });

      // Cards in dark mode should not have pure white background
      expect(firstCardBg).not.toBe('rgb(255, 255, 255)');
    }
  }

  // Restore original theme state if we changed it
  if (!wasAlreadyDark && darkThemeApplied) {
    const toggleVisible = await themeToggle.first().isVisible().catch(() => false);
    if (toggleVisible) {
      await themeToggle.first().click();
      await page.waitForTimeout(1000);

      // Verify restored to light theme
      const restoredToLight = await appRoot.evaluate((el) => {
        return el.classList.contains('v-theme--BLUE_THEME');
      });
      expect(restoredToLight).toBe(true);
    }
  }
});

test('BUG #16935 - Dark theme consistency across admin pages', async ({ page }) => {
  await loginToApp(page, 90000, 'pau.kie.chee@fusioneta.com', 'PAOpaopao@9696');

  await page.goto('https://app-staging.vivacityapp.com/system-settings');
  await page.waitForLoadState('networkidle');

  const appRoot = page.locator('.v-application');
  await appRoot.waitFor({ state: 'visible', timeout: 30000 });

  // Check current theme state
  const isDarkThemeActive = await appRoot.evaluate((el) => {
    return el.classList.contains('v-theme--DARK_BLUE_THEME');
  });

  const wasAlreadyDark = isDarkThemeActive;

  // Try to activate dark theme if not already active
  if (!isDarkThemeActive) {
    const themeToggle = page.locator('[data-testid="theme-toggle"], button[aria-label*="theme" i], button[aria-label*="dark" i], .theme-toggle');
    const toggleVisible = await themeToggle.first().isVisible().catch(() => false);
    if (toggleVisible) {
      await themeToggle.first().click();
      await page.waitForTimeout(1000);
    }
  }

  const darkThemeNowActive = await appRoot.evaluate((el) => {
    return el.classList.contains('v-theme--DARK_BLUE_THEME');
  });

  if (darkThemeNowActive) {
    // Verify no CSS variable leakage from light theme
    const hasIncorrectColorVars = await appRoot.evaluate((el) => {
      const style = window.getComputedStyle(el);
      // In dark theme, --v-theme-background should be dark
      const bg = style.getPropertyValue('--v-theme-background').trim();
      // Parse the RGB values
      if (bg) {
        const parts = bg.split(',').map((s) => parseInt(s.trim()));
        if (parts.length >= 3) {
          const brightness = (parts[0] * 299 + parts[1] * 587 + parts[2] * 114) / 1000;
          // Dark theme should have low brightness (dark background)
          return brightness > 200; // Returns true if bug is present (too bright for dark theme)
        }
      }
      return false;
    });

    // This should be false (dark background) when theme is working correctly
    expect(hasIncorrectColorVars).toBe(false);

    // Verify system-settings page renders with dark theme
    await expect(page.locator('.v-application.v-theme--DARK_BLUE_THEME')).toBeVisible();
  }

  // Restore state
  if (!wasAlreadyDark && darkThemeNowActive) {
    const themeToggle = page.locator('[data-testid="theme-toggle"], button[aria-label*="theme" i], button[aria-label*="dark" i], .theme-toggle');
    const toggleVisible = await themeToggle.first().isVisible().catch(() => false);
    if (toggleVisible) {
      await themeToggle.first().click();
      await page.waitForTimeout(1000);
    }
  }
});