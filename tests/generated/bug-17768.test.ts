// Bug #17768: [Contacts] Missing 'Import' button and 'Create Contact' button in toolbar
// ADO: https://dev.azure.com/vivacityapp/Viva/_workitems/edit/17768
// Auto-generated 2026-07-16
// REVIEW BEFORE MERGING — verify selectors and assertions

import { test, expect } from '@playwright/test';
import { loginToApp } from '../helpers/auth.helper';

test.setTimeout(120000);

test('BUG #17768 - Contacts toolbar should have Import, Export, and Create Contact buttons', async ({ page }) => {
  await loginToApp(page);

  // Navigate to Contacts page
  await page.goto('https://app-staging.vivacityapp.com');

  // Wait for app to load
  await page.waitForSelector('.v-application', { timeout: 30000 });

  // Navigate to Contacts
  await page.goto('https://app-staging.vivacityapp.com/demo-student/contacts');

  // Wait for contacts page to load
  await page.waitForSelector('.v-application', { timeout: 30000 });

  // Wait for toolbar to be visible
  await page.waitForSelector('.v-toolbar, [class*="toolbar"], .v-data-table__top, .toolbar', { timeout: 30000 });

  // Check for Import button
  const importButton = page.getByRole('button', { name: /import/i });
  await expect(importButton).toBeVisible({ timeout: 15000 });

  // Check for Export button
  const exportButton = page.getByRole('button', { name: /export/i });
  await expect(exportButton).toBeVisible({ timeout: 15000 });

  // Check for Create Contact button
  const createContactButton = page.getByRole('button', { name: /create contact/i });
  await expect(createContactButton).toBeVisible({ timeout: 15000 });
});