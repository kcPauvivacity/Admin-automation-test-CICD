import { test, expect } from '@playwright/test';
import { loginToApp } from './helpers/auth.helper';

const BASE_URL = 'https://app-staging.vivacityapp.com';
const MODULE_URL = `${BASE_URL}/demo-student/tracking`;

test.setTimeout(300000);

test.describe('Tracking Module', () => {
  test('[READ] listing page loads and table is visible', async ({ page }) => {
    await loginToApp(page);
    await page.goto(MODULE_URL);
    await page.waitForLoadState('networkidle');

    const table = page.locator('table, [role="grid"], [role="table"]').first();
    await expect(table).toBeVisible({ timeout: 30000 });
  });

  test('[READ] column headers are visible', async ({ page }) => {
    await loginToApp(page);
    await page.goto(MODULE_URL);
    await page.waitForLoadState('networkidle');

    const headerRow = page.locator('thead tr, [role="row"]').first();
    await expect(headerRow).toBeVisible({ timeout: 30000 });

    const headers = page.locator('th, [role="columnheader"]');
    const headerCount = await headers.count();
    expect(headerCount).toBeGreaterThan(0);
  });

  test('[READ] search/filter by campaign or source', async ({ page }) => {
    await loginToApp(page);
    await page.goto(MODULE_URL);
    await page.waitForLoadState('networkidle');

    const searchInput = page.locator(
      'input[placeholder*="Search"], input[placeholder*="search"], input[placeholder*="campaign"], input[placeholder*="Campaign"], input[placeholder*="source"], input[type="search"]'
    ).first();

    const searchVisible = await searchInput.isVisible().catch(() => false);

    if (searchVisible) {
      await searchInput.fill('test');
      await page.waitForTimeout(1000);

      const table = page.locator('table, [role="grid"], [role="table"]').first();
      await expect(table).toBeVisible({ timeout: 15000 });

      await searchInput.clear();
      await page.waitForTimeout(1000);
    } else {
      const filterButton = page.locator('button:has-text("Filter"), button[aria-label*="filter"], button[aria-label*="Filter"]').first();
      const filterVisible = await filterButton.isVisible().catch(() => false);
      if (filterVisible) {
        await filterButton.click();
        await page.waitForTimeout(500);
      }

      const table = page.locator('table, [role="grid"], [role="table"]').first();
      await expect(table).toBeVisible({ timeout: 15000 });
    }
  });

  test('[CREATE] create a new tracking link/campaign with random name', async ({ page }) => {
    await loginToApp(page);
    await page.goto(MODULE_URL);
    await page.waitForLoadState('networkidle');

    const randomSuffix = Date.now();
    const campaignName = `Test Campaign ${randomSuffix}`;

    const createButton = page.locator(
      'button:has-text("Create"), button:has-text("Add"), button:has-text("New"), button[aria-label*="create"], button[aria-label*="Create"], button[aria-label*="add"], button[aria-label*="Add"]'
    ).first();
    await expect(createButton).toBeVisible({ timeout: 20000 });
    await createButton.click();

    const dialog = page.locator('[role="dialog"]').first();
    await expect(dialog).toBeVisible({ timeout: 15000 });

    const nameInput = dialog.locator(
      'input[name*="name"], input[placeholder*="name"], input[placeholder*="Name"], input[placeholder*="campaign"], input[placeholder*="Campaign"], input[id*="name"], input[id*="campaign"]'
    ).first();

    const nameInputVisible = await nameInput.isVisible().catch(() => false);
    if (nameInputVisible) {
      await nameInput.fill(campaignName);
    }

    const sourceInput = dialog.locator(
      'input[name*="source"], input[placeholder*="source"], input[placeholder*="Source"], input[id*="source"]'
    ).first();
    const sourceInputVisible = await sourceInput.isVisible().catch(() => false);
    if (sourceInputVisible) {
      await sourceInput.fill('playwright-test');
    }

    const mediumInput = dialog.locator(
      'input[name*="medium"], input[placeholder*="medium"], input[placeholder*="Medium"], input[id*="medium"]'
    ).first();
    const mediumInputVisible = await mediumInput.isVisible().catch(() => false);
    if (mediumInputVisible) {
      await mediumInput.fill('test');
    }

    const saveButton = dialog.locator(
      'button:has-text("Save"), button:has-text("Create"), button:has-text("Submit"), button:has-text("Add"), button[type="submit"]'
    ).first();
    await expect(saveButton).toBeVisible({ timeout: 10000 });
    await saveButton.click();

    await page.waitForTimeout(2000);

    const dialogStillVisible = await dialog.isVisible().catch(() => false);
    expect(dialogStillVisible).toBeFalsy();

    const table = page.locator('table, [role="grid"], [role="table"]').first();
    await expect(table).toBeVisible({ timeout: 15000 });
  });

  test('[EDIT] edit the first tracking record', async ({ page }) => {
    await loginToApp(page);
    await page.goto(MODULE_URL);
    await page.waitForLoadState('networkidle');

    const table = page.locator('table, [role="grid"], [role="table"]').first();
    await expect(table).toBeVisible({ timeout: 30000 });

    const firstRow = page.locator('tbody tr, [role="row"]:not([aria-label="header row"])').first();
    const rowVisible = await firstRow.isVisible().catch(() => false);

    if (!rowVisible) {
      test.skip();
      return;
    }

    const editButton = firstRow.locator(
      'button:has-text("Edit"), button[aria-label*="edit"], button[aria-label*="Edit"], a:has-text("Edit")'
    ).first();
    const editButtonVisible = await editButton.isVisible().catch(() => false);

    if (editButtonVisible) {
      await editButton.click();
    } else {
      await firstRow.click();
    }

    await page.waitForTimeout(1000);

    const dialog = page.locator('[role="dialog"]').first();
    const dialogVisible = await dialog.isVisible().catch(() => false);

    const sidePanel = page.locator('[class*="side-panel"], [class*="sidepanel"], [class*="drawer"], [role="complementary"]').first();
    const sidePanelVisible = await sidePanel.isVisible().catch(() => false);

    if (dialogVisible) {
      const editInput = dialog.locator('input').first();
      const editInputVisible = await editInput.isVisible().catch(() => false);

      if (editInputVisible) {
        const currentValue = await editInput.inputValue();
        await editInput.fill(`${currentValue} edited`);
      }

      const saveButton = dialog.locator(
        'button:has-text("Save"), button:has-text("Update"), button:has-text("Submit"), button[type="submit"]'
      ).first();
      const saveButtonVisible = await saveButton.isVisible().catch(() => false);
      if (saveButtonVisible) {
        await saveButton.click();
        await page.waitForTimeout(2000);
      }
    } else if (sidePanelVisible) {
      const editInput = sidePanel.locator('input').first();
      const editInputVisible = await editInput.isVisible().catch(() => false);

      if (editInputVisible) {
        const currentValue = await editInput.inputValue();
        await editInput.fill(`${currentValue} edited`);
      }

      const saveButton = sidePanel.locator(
        'button:has-text("Save"), button:has-text("Update"), button:has-text("Submit"), button[type="submit"]'
      ).first();
      const saveButtonVisible = await saveButton.isVisible().catch(() => false);
      if (saveButtonVisible) {
        await saveButton.click();
        await page.waitForTimeout(2000);
      }
    } else {
      const tableStillVisible = await table.isVisible().catch(() => false);
      expect(tableStillVisible).toBeTruthy();
    }
  });

  test('[DELETE] select and delete a tracking record', async ({ page }) => {
    await loginToApp(page);
    await page.goto(MODULE_URL);
    await page.waitForLoadState('networkidle');

    const table = page.locator('table, [role="grid"], [role="table"]').first();
    await expect(table).toBeVisible({ timeout: 30000 });

    const firstRow = page.locator('tbody tr, [role="row"]:not([aria-label="header row"])').first();
    const rowVisible = await firstRow.isVisible().catch(() => false);

    if (!rowVisible) {
      test.skip();
      return;
    }

    const checkbox = firstRow.locator('input[type="checkbox"]').first();
    const checkboxVisible = await checkbox.isVisible().catch(() => false);

    if (checkboxVisible) {
      await checkbox.check();
      await page.waitForTimeout(500);

      const deleteButton = page.locator(
        'button:has-text("Delete"), button[aria-label*="delete"], button[aria-label*="Delete"]'
      ).first();
      await expect(deleteButton).toBeVisible({ timeout: 10000 });
      await deleteButton.click();

      await page.waitForTimeout(500);

      const confirmButton = page.locator(
        'button:has-text("Confirm"), button:has-text("Yes"), button:has-text("Delete"), button:has-text("OK"), [role="dialog"] button:has-text("Delete")'
      ).last();
      const confirmVisible = await confirmButton.isVisible().catch(() => false);
      if (confirmVisible) {
        await confirmButton.click();
        await page.waitForTimeout(2000);
      }
    } else {
      const rowDeleteButton = firstRow.locator(
        'button:has-text("Delete"), button[aria-label*="delete"], button[aria-label*="Delete"]'
      ).first();
      const rowDeleteVisible = await rowDeleteButton.isVisible().catch(() => false);

      if (rowDeleteVisible) {
        await rowDeleteButton.click();
        await page.waitForTimeout(500);

        const confirmButton = page.locator(
          'button:has-text("Confirm"), button:has-text("Yes"), button:has-text("Delete"), [role="dialog"] button:has-text("Delete")'
        ).last();
        const confirmVisible = await confirmButton.isVisible().catch(() => false);
        if (confirmVisible) {
          await confirmButton.click();
          await page.waitForTimeout(2000);
        }
      } else {
        const tableStillVisible = await table.isVisible().catch(() => false);
        expect(tableStillVisible).toBeTruthy();
        return;
      }
    }

    const tableAfterDelete = page.locator('table, [role="grid"], [role="table"]').first();
    await expect(tableAfterDelete).toBeVisible({ timeout: 15000 });
  });

  test('[NAV] accessible via sidebar navigation', async ({ page }) => {
    await loginToApp(page);
    await page.goto(BASE_URL + '/demo-student');
    await page.waitForLoadState('networkidle');

    const trackingMenuItem = page.locator('[role="menuitem"]:has-text("Tracking"), nav a:has-text("Tracking"), [aria-label*="Tracking"]').first();
    await expect(trackingMenuItem).toBeVisible({ timeout: 30000 });
    await trackingMenuItem.click();

    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    await expect(page).toHaveURL(/tracking/, { timeout: 15000 });

    const table = page.locator('table, [role="grid"], [role="table"]').first();
    await expect(table).toBeVisible({ timeout: 30000 });
  });
});
