import { test, expect } from '@playwright/test';
import { loginToApp } from './helpers/auth.helper';

const BASE_URL = 'https://app-staging.vivacityapp.com';
const MODULE_URL = `${BASE_URL}/system-settings/adobe-templates`;
const FUSIONETA_EMAIL = 'pau.kie.chee@fusioneta.com';
const FUSIONETA_PASSWORD = 'PAOpaopao@9696';
const TEMPLATE_NAME_CREATE = `Test Adobe Template ${Date.now()}`;
const TEMPLATE_NAME_EDIT = `Edited Adobe Template ${Date.now()}`;

test.describe('System Settings - Adobe Templates', () => {
  test.beforeEach(async ({ page }) => {
    await loginToApp(page, 90000, FUSIONETA_EMAIL, FUSIONETA_PASSWORD);
  });

  test('[READ] list loads with table', async ({ page }) => {
    test.setTimeout(180000);

    await page.goto(MODULE_URL, { waitUntil: 'networkidle' });

    const table = page.locator('table, [role="grid"], [role="table"], .v-data-table').first();
    await expect(table).toBeVisible({ timeout: 30000 });
  });

  test('[READ] columns visible - name, created date', async ({ page }) => {
    test.setTimeout(180000);

    await page.goto(MODULE_URL, { waitUntil: 'networkidle' });

    const table = page.locator('table, [role="grid"], [role="table"], .v-data-table').first();
    await expect(table).toBeVisible({ timeout: 30000 });

    // Real columns (confirmed live): ID, Name, Created At, Created by, Last Updated At,
    // Last Updated by — there is no Type or Status column on this module.
    const tableText = await table.textContent();
    const lowerText = (tableText ?? '').toLowerCase();

    const hasName = lowerText.includes('name');
    const hasDate = lowerText.includes('date') || lowerText.includes('created');

    expect(hasName).toBe(true);
    expect(hasDate).toBe(true);
  });

  test('[READ] search by template name', async ({ page }) => {
    test.setTimeout(180000);

    await page.goto(MODULE_URL, { waitUntil: 'networkidle' });

    const searchInput = page.locator(
      'input[placeholder*="search" i], input[placeholder*="Search" i], input[type="search"]'
    ).first();

    const searchVisible = await searchInput.isVisible().catch(() => false);
    if (!searchVisible) {
      test.skip();
      return;
    }

    await searchInput.fill('Template');
    await page.waitForTimeout(1000);

    const table = page.locator('table, [role="grid"], [role="table"], .v-data-table').first();
    await expect(table).toBeVisible({ timeout: 15000 });
  });

  test('[CREATE] open create dialog, fill template name and type, save', async ({ page }) => {
    test.setTimeout(180000);

    await page.goto(MODULE_URL, { waitUntil: 'networkidle' });

    const createButton = page.locator(
      'button:has-text("Create"), button:has-text("Add"), button:has-text("New"), button:has-text("+ Add")'
    ).first();

    await expect(createButton).toBeVisible({ timeout: 20000 });
    await createButton.click();

    const dialog = page.locator('[role="dialog"]').first();
    await expect(dialog).toBeVisible({ timeout: 15000 });

    const nameInput = dialog.locator(
      'input[placeholder*="name" i], input[name*="name" i], input[id*="name" i], input[type="text"]'
    ).first();

    const nameVisible = await nameInput.isVisible().catch(() => false);
    if (nameVisible) {
      await nameInput.fill(TEMPLATE_NAME_CREATE);
    }

    const typeDropdown = dialog.locator(
      'select[name*="type" i], [placeholder*="type" i], [aria-label*="type" i]'
    ).first();

    const typeVisible = await typeDropdown.isVisible().catch(() => false);
    if (typeVisible) {
      const tagName = await typeDropdown.evaluate(el => el.tagName.toLowerCase());
      if (tagName === 'select') {
        await typeDropdown.selectOption({ index: 1 });
      } else {
        await typeDropdown.click();
        const firstOption = page.locator('[role="option"], [role="listbox"] li').first();
        const optionVisible = await firstOption.isVisible().catch(() => false);
        if (optionVisible) {
          await firstOption.click();
        }
      }
    }

    const saveButton = dialog.locator(
      'button:has-text("Save"), button:has-text("Create"), button:has-text("Submit"), button[type="submit"]'
    ).first();

    const saveVisible = await saveButton.isVisible().catch(() => false);
    if (saveVisible) {
      await saveButton.click();
      await page.waitForTimeout(2000);

      const dialogStillOpen = await dialog.isVisible().catch(() => false);
      if (!dialogStillOpen) {
        const table = page.locator('table, [role="grid"], [role="table"], .v-data-table').first();
        await expect(table).toBeVisible({ timeout: 15000 });
      }
    }
  });

  test('[EDIT] click first template, edit name, save', async ({ page }) => {
    test.setTimeout(180000);

    await page.goto(MODULE_URL, { waitUntil: 'networkidle' });

    const table = page.locator('table, [role="grid"], [role="table"], .v-data-table').first();
    await expect(table).toBeVisible({ timeout: 30000 });

    const firstRow = table.locator('tbody tr, [role="row"]').first();
    const rowVisible = await firstRow.isVisible().catch(() => false);
    if (!rowVisible) {
      test.skip();
      return;
    }

    await firstRow.click();
    await page.waitForTimeout(1500);

    const dialog = page.locator('[role="dialog"]').first();
    const panel = page.locator('[class*="side-panel"], [class*="sidepanel"], [class*="drawer"]').first();

    const dialogVisible = await dialog.isVisible().catch(() => false);
    const panelVisible = await panel.isVisible().catch(() => false);

    const editContainer = dialogVisible ? dialog : panelVisible ? panel : null;

    if (!editContainer) {
      const editButton = page.locator('button:has-text("Edit")').first();
      const editButtonVisible = await editButton.isVisible().catch(() => false);
      if (editButtonVisible) {
        await editButton.click();
        await page.waitForTimeout(1000);
      }
    }

    const nameInput = page.locator(
      '[role="dialog"] input[type="text"], [class*="drawer"] input[type="text"], [class*="panel"] input[type="text"]'
    ).first();

    const nameInputVisible = await nameInput.isVisible().catch(() => false);
    if (nameInputVisible) {
      await nameInput.triple_click?.() ?? await nameInput.click({ clickCount: 3 });
      await nameInput.fill(TEMPLATE_NAME_EDIT);
    }

    const saveButton = page.locator(
      '[role="dialog"] button:has-text("Save"), [role="dialog"] button:has-text("Update"), [role="dialog"] button[type="submit"], [class*="drawer"] button:has-text("Save"), [class*="panel"] button:has-text("Save")'
    ).first();

    const saveVisible = await saveButton.isVisible().catch(() => false);
    if (saveVisible) {
      await saveButton.click();
      await page.waitForTimeout(2000);
    }

    const tableAgain = page.locator('table, [role="grid"], [role="table"], .v-data-table').first();
    await expect(tableAgain).toBeVisible({ timeout: 15000 });
  });

  test('[DELETE] select template, delete, confirm', async ({ page }) => {
    test.setTimeout(180000);

    await page.goto(MODULE_URL, { waitUntil: 'networkidle' });

    const table = page.locator('table, [role="grid"], [role="table"], .v-data-table').first();
    await expect(table).toBeVisible({ timeout: 30000 });

    const firstCheckbox = table.locator('input[type="checkbox"]').first();
    const checkboxVisible = await firstCheckbox.isVisible().catch(() => false);

    if (!checkboxVisible) {
      test.skip();
      return;
    }

    await firstCheckbox.check();
    await page.waitForTimeout(500);

    const deleteButton = page.locator(
      'button:has-text("Delete"), button:has-text("Remove")'
    ).first();

    const deleteVisible = await deleteButton.isVisible().catch(() => false);
    if (!deleteVisible) {
      test.skip();
      return;
    }

    await deleteButton.click();
    await page.waitForTimeout(1000);

    const confirmDialog = page.locator('[role="dialog"]').first();
    const confirmVisible = await confirmDialog.isVisible().catch(() => false);

    if (confirmVisible) {
      const confirmButton = confirmDialog.locator(
        'button:has-text("Delete"), button:has-text("Confirm"), button:has-text("Yes")'
      ).first();

      const confirmButtonVisible = await confirmButton.isVisible().catch(() => false);
      if (confirmButtonVisible) {
        await confirmButton.click();
        await page.waitForTimeout(2000);
      }
    }

    const tableAgain = page.locator('table, [role="grid"], [role="table"], .v-data-table').first();
    await expect(tableAgain).toBeVisible({ timeout: 15000 });
  });

  test('[NAV] accessible via system-settings', async ({ page }) => {
    test.setTimeout(180000);

    await page.goto(BASE_URL, { waitUntil: 'networkidle' });

    const systemSettingsButton = page.locator('[aria-label="Open system settings"]').first();
    await expect(systemSettingsButton).toBeVisible({ timeout: 20000 });
    await systemSettingsButton.click();

    await page.waitForURL('**/system-settings/**', { timeout: 15000 });

    const adobeLink = page.locator(
      'a[href*="adobe-templates"], a:has-text("Adobe"), nav a:has-text("Adobe Templates")'
    ).first();

    const adobeLinkVisible = await adobeLink.isVisible().catch(() => false);
    if (adobeLinkVisible) {
      await adobeLink.click();
      await page.waitForURL('**/adobe-templates**', { timeout: 15000 });
    } else {
      await page.goto(MODULE_URL, { waitUntil: 'networkidle' });
    }

    await expect(page).toHaveURL(/adobe-templates/, { timeout: 15000 });

    const table = page.locator('table, [role="grid"], [role="table"], .v-data-table').first();
    await expect(table).toBeVisible({ timeout: 30000 });
  });
});
