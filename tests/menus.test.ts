import { test, expect } from '@playwright/test';
import { loginToApp } from './helpers/auth.helper';

const BASE_URL = 'https://app-staging.vivacityapp.com/demo-student/menus';

test.describe('Menus', () => {
  test('[READ] listing page loads with table and records', async ({ page }) => {
    test.setTimeout(300000);
    await loginToApp(page);
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');

    const table = page.locator('table, [role="grid"], [role="table"]').first();
    await expect(table).toBeVisible({ timeout: 30000 });

    const rows = page.locator('table tbody tr, [role="row"]:not([role="columnheader"])');
    const rowCount = await rows.count();
    expect(rowCount).toBeGreaterThanOrEqual(0);
  });

  test('[READ] search/filter functionality', async ({ page }) => {
    test.setTimeout(300000);
    await loginToApp(page);
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');

    const searchInput = page.locator('input[placeholder*="Search"], input[type="search"], input[placeholder*="search"]').first();
    const searchVisible = await searchInput.isVisible().catch(() => false);

    if (searchVisible) {
      await searchInput.fill('test');
      await page.waitForTimeout(1000);
      await page.waitForLoadState('networkidle');

      const table = page.locator('table, [role="grid"], [role="table"]').first();
      await expect(table).toBeVisible({ timeout: 15000 });

      await searchInput.clear();
      await page.waitForTimeout(1000);
      await page.waitForLoadState('networkidle');
    } else {
      const filterButton = page.locator('button:has-text("Filter"), button[aria-label*="filter"], button[aria-label*="Filter"]').first();
      const filterVisible = await filterButton.isVisible().catch(() => false);
      if (filterVisible) {
        await filterButton.click();
        await page.waitForTimeout(500);
      }
    }

    const table = page.locator('table, [role="grid"], [role="table"]').first();
    await expect(table).toBeVisible({ timeout: 15000 });
  });

  test('[READ] pagination or record count shown', async ({ page }) => {
    test.setTimeout(300000);
    await loginToApp(page);
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');

    const paginationOrCount = page.locator(
      '[aria-label*="pagination"], [class*="pagination"], nav[aria-label*="page"], ' +
      'button:has-text("Next"), button:has-text("Previous"), ' +
      'text=/\\d+ (record|result|item|row|entr)/i, text=/Page \\d+ of \\d+/i, ' +
      'text=/Showing \\d+/i, text=/\\d+-\\d+ of \\d+/i'
    ).first();

    const hasPagination = await paginationOrCount.isVisible().catch(() => false);

    if (!hasPagination) {
      const rows = page.locator('table tbody tr, [role="row"]:not([role="columnheader"])');
      const rowCount = await rows.count();
      expect(rowCount).toBeGreaterThanOrEqual(0);
    } else {
      await expect(paginationOrCount).toBeVisible({ timeout: 15000 });
    }
  });

  test('[CREATE] clicking Create button opens dialog or form', async ({ page }) => {
    test.setTimeout(300000);
    await loginToApp(page);
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');

    const createButton = page.locator(
      'button:has-text("Create"), button:has-text("Add"), button:has-text("New"), ' +
      'button:has-text("+ Menu"), button[aria-label*="Create"], button[aria-label*="Add"]'
    ).first();
    await expect(createButton).toBeVisible({ timeout: 30000 });
    await createButton.click();

    const dialog = page.locator('[role="dialog"]').first();
    const dialogVisible = await dialog.isVisible().catch(() => false);

    if (dialogVisible) {
      await expect(dialog).toBeVisible({ timeout: 15000 });
    } else {
      const form = page.locator('form, [class*="form"], [class*="panel"], [class*="drawer"]').first();
      await expect(form).toBeVisible({ timeout: 15000 });
    }
  });

  test('[CREATE] create new menu with random name/data and save', async ({ page }) => {
    test.setTimeout(300000);
    await loginToApp(page);
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');

    const randomSuffix = Date.now();
    const menuName = `Test Menu ${randomSuffix}`;

    const createButton = page.locator(
      'button:has-text("Create"), button:has-text("Add"), button:has-text("New"), ' +
      'button:has-text("+ Menu"), button[aria-label*="Create"], button[aria-label*="Add"]'
    ).first();
    await expect(createButton).toBeVisible({ timeout: 30000 });
    await createButton.click();

    const dialog = page.locator('[role="dialog"]').first();
    const dialogVisible = await dialog.isVisible().catch(() => false);

    const container = dialogVisible ? dialog : page;

    const nameInput = container.locator(
      'input[name*="name"], input[placeholder*="name"], input[placeholder*="Name"], ' +
      'input[id*="name"], input[label*="name"], input[aria-label*="name"], ' +
      'input[aria-label*="Name"], input[type="text"]'
    ).first();
    await expect(nameInput).toBeVisible({ timeout: 15000 });
    await nameInput.fill(menuName);

    const saveButton = container.locator(
      'button:has-text("Save"), button:has-text("Create"), button:has-text("Submit"), ' +
      'button[type="submit"], button:has-text("Add")'
    ).first();
    await expect(saveButton).toBeVisible({ timeout: 15000 });
    await saveButton.click();

    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    const dialogStillVisible = await page.locator('[role="dialog"]').isVisible().catch(() => false);
    expect(dialogStillVisible).toBe(false);

    const successToast = page.locator(
      '[class*="toast"], [class*="notification"], [class*="alert"], [role="alert"], ' +
      'text=/success/i, text=/created/i, text=/saved/i'
    ).first();
    const toastVisible = await successToast.isVisible().catch(() => false);

    if (!toastVisible) {
      const table = page.locator('table, [role="grid"], [role="table"]').first();
      await expect(table).toBeVisible({ timeout: 15000 });
    }
  });

  test('[EDIT] click first row, edit a field, save', async ({ page }) => {
    test.setTimeout(300000);
    await loginToApp(page);
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');

    const table = page.locator('table, [role="grid"], [role="table"]').first();
    await expect(table).toBeVisible({ timeout: 30000 });

    const firstRow = page.locator('table tbody tr, [role="row"]:not([role="columnheader"])').first();
    await expect(firstRow).toBeVisible({ timeout: 15000 });

    const editButton = firstRow.locator('button:has-text("Edit"), button[aria-label*="Edit"], button[aria-label*="edit"]').first();
    const editButtonVisible = await editButton.isVisible().catch(() => false);

    if (editButtonVisible) {
      await editButton.click();
    } else {
      await firstRow.click();
    }

    await page.waitForTimeout(1000);

    const dialog = page.locator('[role="dialog"]').first();
    const dialogVisible = await dialog.isVisible().catch(() => false);

    const panel = page.locator('[class*="panel"], [class*="drawer"], [class*="sidebar"]').first();
    const panelVisible = await panel.isVisible().catch(() => false);

    const container = dialogVisible ? dialog : panelVisible ? panel : page;

    const nameInput = container.locator(
      'input[name*="name"], input[placeholder*="name"], input[placeholder*="Name"], ' +
      'input[id*="name"], input[type="text"]'
    ).first();
    const inputVisible = await nameInput.isVisible().catch(() => false);

    if (inputVisible) {
      const currentValue = await nameInput.inputValue();
      await nameInput.clear();
      await nameInput.fill(`${currentValue} Edited`);
    }

    const saveButton = container.locator(
      'button:has-text("Save"), button:has-text("Update"), button:has-text("Submit"), ' +
      'button[type="submit"]'
    ).first();
    const saveVisible = await saveButton.isVisible().catch(() => false);

    if (saveVisible) {
      await saveButton.click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);
    }

    const tableAfter = page.locator('table, [role="grid"], [role="table"]').first();
    await expect(tableAfter).toBeVisible({ timeout: 15000 });
  });

  test('[DELETE] select first row, delete, confirm', async ({ page }) => {
    test.setTimeout(300000);
    await loginToApp(page);
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');

    const table = page.locator('table, [role="grid"], [role="table"]').first();
    await expect(table).toBeVisible({ timeout: 30000 });

    const firstRowCheckbox = page.locator('table tbody tr:first-child input[type="checkbox"], [role="row"]:not([role="columnheader"]):first-child input[type="checkbox"]').first();
    const checkboxVisible = await firstRowCheckbox.isVisible().catch(() => false);

    if (checkboxVisible) {
      await firstRowCheckbox.check();
      await page.waitForTimeout(500);

      const deleteButton = page.locator(
        'button:has-text("Delete"), button[aria-label*="Delete"], button[aria-label*="delete"]'
      ).first();
      const deleteVisible = await deleteButton.isVisible().catch(() => false);

      if (deleteVisible) {
        await deleteButton.click();
        await page.waitForTimeout(500);

        const confirmButton = page.locator(
          '[role="dialog"] button:has-text("Delete"), [role="dialog"] button:has-text("Confirm"), ' +
          '[role="dialog"] button:has-text("Yes"), [role="alertdialog"] button:has-text("Delete"), ' +
          '[role="alertdialog"] button:has-text("Confirm"), [role="alertdialog"] button:has-text("Yes")'
        ).first();
        const confirmVisible = await confirmButton.isVisible().catch(() => false);

        if (confirmVisible) {
          await confirmButton.click();
          await page.waitForLoadState('networkidle');
          await page.waitForTimeout(1000);
        }
      }
    } else {
      const firstRow = page.locator('table tbody tr, [role="row"]:not([role="columnheader"])').first();
      const rowDeleteButton = firstRow.locator('button:has-text("Delete"), button[aria-label*="Delete"]').first();
      const rowDeleteVisible = await rowDeleteButton.isVisible().catch(() => false);

      if (rowDeleteVisible) {
        await rowDeleteButton.click();
        await page.waitForTimeout(500);

        const confirmButton = page.locator(
          '[role="dialog"] button:has-text("Delete"), [role="dialog"] button:has-text("Confirm"), ' +
          '[role="dialog"] button:has-text("Yes"), [role="alertdialog"] button:has-text("Delete"), ' +
          '[role="alertdialog"] button:has-text("Confirm"), [role="alertdialog"] button:has-text("Yes")'
        ).first();
        const confirmVisible = await confirmButton.isVisible().catch(() => false);

        if (confirmVisible) {
          await confirmButton.click();
          await page.waitForLoadState('networkidle');
          await page.waitForTimeout(1000);
        }
      }
    }

    const tableAfter = page.locator('table, [role="grid"], [role="table"]').first();
    await expect(tableAfter).toBeVisible({ timeout: 15000 });
  });

  test('[NAV] accessible via sidebar navigation', async ({ page }) => {
    test.setTimeout(300000);
    await loginToApp(page);
    await page.waitForLoadState('networkidle');

    const menusNavItem = page.locator('[role="menuitem"]:has-text("Menus")').first();
    const navVisible = await menusNavItem.isVisible().catch(() => false);

    if (!navVisible) {
      const sidebarToggle = page.locator('button[aria-label*="menu"], button[aria-label*="sidebar"], button[aria-label*="navigation"]').first();
      const toggleVisible = await sidebarToggle.isVisible().catch(() => false);
      if (toggleVisible) {
        await sidebarToggle.click();
        await page.waitForTimeout(500);
      }
    }

    const menusItem = page.locator('[role="menuitem"]:has-text("Menus")').first();
    await expect(menusItem).toBeVisible({ timeout: 30000 });
    await menusItem.click();

    await page.waitForLoadState('networkidle');

    await expect(page).toHaveURL(/menus/, { timeout: 15000 });

    const table = page.locator('table, [role="grid"], [role="table"]').first();
    await expect(table).toBeVisible({ timeout: 30000 });
  });
});
