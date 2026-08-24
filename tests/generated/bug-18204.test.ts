// Bug #18204: [Settings › Users] Duplicate "Invite" CTAs with inconsistent singular/plural naming
// ADO: https://dev.azure.com/vivacityapp/Viva/_workitems/edit/18204
// Auto-generated 2026-08-18
// REVIEW BEFORE MERGING — verify selectors and assertions

import { test, expect } from '@playwright/test';
import { loginToApp } from '../helpers/auth.helper';

test.setTimeout(120000);

test('BUG #18204 - Settings › Users should have exactly one invite button with consistent naming', async ({ page }) => {
  await loginToApp(page);

  // Navigate to Settings › Users
  await page.goto('https://app-staging.vivacityapp.com/demo-student/settings/users');

  // Wait for the page to load
  await page.waitForSelector('.v-application', { timeout: 30000 });

  // Wait for the invite button(s) to appear
  await page.waitForSelector('button', { timeout: 30000 });

  // Find all buttons that contain "Invite" text (case-insensitive)
  const inviteButtons = page.locator('button').filter({ hasText: /invite/i });

  // Also check for any clickable elements (links, v-btn) with invite text
  const inviteElements = page.locator('.v-btn, button, a').filter({ hasText: /invite/i });

  const inviteCount = await inviteElements.count();

  // BUG: Two invite buttons are shown simultaneously
  // FIX: Should be exactly one invite button
  expect(inviteCount, `Expected exactly 1 invite button, but found ${inviteCount}. Duplicate invite CTAs are present.`).toBe(1);

  // Additionally verify consistent naming - should not have both singular and plural variants
  const pluralButton = page.locator('.v-btn, button, a').filter({ hasText: /invite new users/i });
  const singularButton = page.locator('.v-btn, button, a').filter({ hasText: /invite new user(?!s)/i });

  const pluralCount = await pluralButton.count();
  const singularCount = await singularButton.count();

  // BUG: Both "Invite New Users" (plural) and "Invite New User" (singular) appear simultaneously
  // FIX: Only one consistent label should exist
  const hasBothVariants = pluralCount > 0 && singularCount > 0;
  expect(hasBothVariants, 'Both singular ("Invite New User") and plural ("Invite New Users") invite buttons are present simultaneously. Naming is inconsistent.').toBe(false);
});

test('BUG #18204 - Settings › Users invite button should not have both ghost and filled styles', async ({ page }) => {
  await loginToApp(page);

  // Navigate to Settings › Users
  await page.goto('https://app-staging.vivacityapp.com/demo-student/settings/users');

  // Wait for the page to load
  await page.waitForSelector('.v-application', { timeout: 30000 });

  // Wait for invite buttons to appear
  await page.waitForSelector('.v-btn', { timeout: 30000 });

  // Find the invite buttons
  const inviteButtons = page.locator('.v-btn').filter({ hasText: /invite/i });
  const inviteCount = await inviteButtons.count();

  // BUG: Two invite buttons present (ghost/outline near search + filled primary top-right)
  // FIX: Only one invite button should be present
  expect(inviteCount, `Expected 1 invite button, found ${inviteCount}`).toBe(1);

  if (inviteCount === 1) {
    // The single button should be the primary filled style (not ghost/outlined)
    const singleButton = inviteButtons.first();
    await expect(singleButton).toBeVisible();

    // Check it's not an outlined/ghost button (bug had ghost button near search bar)
    const isOutlined = await singleButton.evaluate((el) => {
      return el.classList.contains('v-btn--variant-outlined') || 
             el.classList.contains('v-btn--variant-text') ||
             el.classList.contains('v-btn--variant-plain');
    });

    // The remaining single button should be the primary teal button, not the ghost one
    // (If only one remains, it should be the proper primary button)
    expect(isOutlined).toBe(false);
  }
});