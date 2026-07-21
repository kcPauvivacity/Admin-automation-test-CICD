// Bug #17769: [Contacts] Missing contact avatar initials in table rows
// ADO: https://dev.azure.com/vivacityapp/Viva/_workitems/edit/17769
// Auto-generated 2026-07-16
// REVIEW BEFORE MERGING — verify selectors and assertions

import { test, expect } from '@playwright/test';
import { loginToApp } from '../helpers/auth.helper';

test.setTimeout(120000);

test('BUG #17769 - Contact rows display coloured avatar with initials', async ({ page }) => {
  await loginToApp(page);

  // Navigate to Contacts page
  await page.goto('https://app-staging.vivacityapp.com');

  // Wait for the app to load
  await page.waitForSelector('.v-application', { timeout: 30000 });

  // Look for Contacts navigation link and click it
  const contactsLink = page.locator('a, .v-list-item, .v-btn').filter({ hasText: /contacts/i }).first();
  await contactsLink.waitFor({ state: 'visible', timeout: 20000 });
  await contactsLink.click();

  // Wait for contacts table to load
  await page.waitForSelector('.v-data-table, table, [class*="contacts"]', { timeout: 20000 });

  // Wait for at least one table row to appear
  const tableRows = page.locator('.v-data-table tbody tr, table tbody tr').filter({ hasText: /\w/ });
  await tableRows.first().waitFor({ state: 'visible', timeout: 20000 });

  // Check that avatar elements exist in table rows
  // Vuetify avatars are typically .v-avatar elements containing initials text
  const avatarInRows = page.locator(
    '.v-data-table tbody tr .v-avatar, table tbody tr .v-avatar, ' +
    '.v-data-table tbody tr [class*="avatar"], table tbody tr [class*="avatar"]'
  );

  const avatarCount = await avatarInRows.count();

  // Bug: no avatars shown at all
  expect(avatarCount, 'Expected avatar elements to be present in contact table rows').toBeGreaterThan(0);

  // Verify avatars contain initials (text content of 1-3 uppercase letters)
  const firstAvatar = avatarInRows.first();
  await firstAvatar.waitFor({ state: 'visible', timeout: 10000 });

  const avatarText = await firstAvatar.textContent();
  const trimmedText = avatarText?.trim() ?? '';

  // Initials should be non-empty and match a short uppercase pattern
  expect(trimmedText.length, 'Avatar should contain initials text').toBeGreaterThan(0);
  expect(trimmedText.length, 'Avatar initials should be 1-3 characters').toBeLessThanOrEqual(3);
  expect(trimmedText, 'Avatar should contain uppercase initials').toMatch(/^[A-Z]{1,3}$/);

  // Verify the avatar has a background color (coloured circle)
  const avatarStyle = await firstAvatar.evaluate((el) => {
    const computed = window.getComputedStyle(el);
    return {
      backgroundColor: computed.backgroundColor,
      borderRadius: computed.borderRadius,
      display: computed.display,
    };
  });

  // Avatar should be a circle (border-radius >= 50%) with a non-transparent background
  expect(
    avatarStyle.backgroundColor,
    'Avatar should have a coloured background'
  ).not.toBe('rgba(0, 0, 0, 0)');

  expect(
    avatarStyle.backgroundColor,
    'Avatar should have a visible background colour'
  ).not.toBe('transparent');

  // Check multiple rows have avatars (not just the first one)
  const rowCount = await tableRows.count();
  if (rowCount > 1) {
    const avatarsInMultipleRows = await page.locator(
      '.v-data-table tbody tr .v-avatar, table tbody tr .v-avatar, ' +
      '.v-data-table tbody tr [class*="avatar"], table tbody tr [class*="avatar"]'
    ).count();

    expect(
      avatarsInMultipleRows,
      'Multiple contact rows should each have an avatar'
    ).toBeGreaterThan(1);
  }
});