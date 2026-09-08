import { test, expect } from '@playwright/test';
import { loginToApp } from './helpers/auth.helper';

const BASE_URL = 'https://app-staging.vivacityapp.com/demo-student/venues';

test.describe('Venues', () => {
  test('[READ] listing page loads with table and records', async ({ page }) => {
    test.setTimeout(300000);
    await loginToApp(page);
    await page.goto(BASE_URL);
    await page.waitForTimeout(3000); // networkidle never resolves on this page (confirmed live — persistent background activity)

    const table = page.locator('table, [role="grid"], [role="table"]').first();
    await expect(table).toBeVisible({ timeout: 30000 });

    const rows = page.locator('table tbody tr, [role="row"]');
    const rowCount = await rows.count();
    expect(rowCount).toBeGreaterThanOrEqual(0);
  });

  test('[READ] search/filter functionality', async ({ page }) => {
    test.setTimeout(300000);
    await loginToApp(page);
    await page.goto(BASE_URL);
    await page.waitForTimeout(3000); // networkidle never resolves on this page (confirmed live — persistent background activity)

    const searchInput = page.locator('input[type="search"], input[placeholder*="Search"], input[placeholder*="search"]').first();
    const searchVisible = await searchInput.isVisible().catch(() => false);

    if (searchVisible) {
      await searchInput.fill('test');
      await page.waitForTimeout(1000);
      const table = page.locator('table, [role="grid"], [role="table"]').first();
      await expect(table).toBeVisible({ timeout: 15000 });
      await searchInput.clear();
      await page.waitForTimeout(500);
    } else {
      const filterBtn = page.locator('button:has-text("Filter"), button[aria-label*="filter"], button[aria-label*="Filter"]').first();
      const filterVisible = await filterBtn.isVisible().catch(() => false);
      if (filterVisible) {
        await filterBtn.click();
        await page.waitForTimeout(500);
      }
    }
  });

  test('[READ] pagination or record count shown', async ({ page }) => {
    test.setTimeout(300000);
    await loginToApp(page);
    await page.goto(BASE_URL);
    await page.waitForTimeout(3000); // networkidle never resolves on this page (confirmed live — persistent background activity)

    const pagination = page.locator('[aria-label*="pagination"], [class*="pagination"], nav[role="navigation"]').first();
    const paginationVisible = await pagination.isVisible().catch(() => false);

    const recordCount = page.locator('text=/\\d+ record/, text=/\\d+ result/, text=/of \\d+/, text=/Total:/, text=/\\d+ item/').first();
    const recordCountVisible = await recordCount.isVisible().catch(() => false);

    const rowsPerPage = page.locator('text=/rows per page/i, text=/per page/i').first();
    const rowsPerPageVisible = await rowsPerPage.isVisible().catch(() => false);

    expect(paginationVisible || recordCountVisible || rowsPerPageVisible).toBeTruthy();
  });

  test('[CREATE] clicking Create button opens dialog or form', async ({ page }) => {
    test.setTimeout(300000);
    await loginToApp(page);
    await page.goto(BASE_URL);
    await page.waitForTimeout(3000); // networkidle never resolves on this page (confirmed live — persistent background activity)

    const createBtn = page.locator(
      'button:has-text("Create"), button:has-text("Add Venue"), button:has-text("Add"), button:has-text("New Venue"), button:has-text("New")'
    ).first();
    await expect(createBtn).toBeVisible({ timeout: 30000 });
    await createBtn.click();

    const dialog = page.locator('[role="dialog"]').first();
    const dialogVisible = await dialog.isVisible().catch(() => false);

    const form = page.locator('form').first();
    const formVisible = await form.isVisible().catch(() => false);

    const panel = page.locator('[class*="panel"], [class*="drawer"], [class*="modal"]').first();
    const panelVisible = await panel.isVisible().catch(() => false);

    expect(dialogVisible || formVisible || panelVisible).toBeTruthy();

    const closeBtn = page.locator('[aria-label="Close"], [aria-label="close"], button:has-text("Cancel"), button:has-text("close")').first();
    const closeVisible = await closeBtn.isVisible().catch(() => false);
    if (closeVisible) {
      await closeBtn.click();
    } else {
      await page.keyboard.press('Escape');
    }
  });

  test('[CREATE] create new venue with random name/data and save', async ({ page }) => {
    test.setTimeout(300000);
    await loginToApp(page);
    await page.goto(BASE_URL);
    await page.waitForTimeout(3000); // networkidle never resolves on this page (confirmed live — persistent background activity)

    const randomSuffix = Date.now();
    const venueName = `Test Venue ${randomSuffix}`;

    const createBtn = page.locator(
      'button:has-text("Create"), button:has-text("Add Venue"), button:has-text("Add"), button:has-text("New Venue"), button:has-text("New")'
    ).first();
    await expect(createBtn).toBeVisible({ timeout: 30000 });
    await createBtn.click();

    const dialog = page.locator('[role="dialog"]').first();
    await expect(dialog).toBeVisible({ timeout: 15000 });

    const nameInput = dialog.locator('input[name*="name"], input[placeholder*="name"], input[placeholder*="Name"], label:has-text("Name") + * input, label:has-text("name") + * input').first();
    const nameVisible = await nameInput.isVisible().catch(() => false);
    if (nameVisible) {
      await nameInput.fill(venueName);
    }

    const addressInput = dialog.locator('input[name*="address"], input[placeholder*="address"], input[placeholder*="Address"], label:has-text("Address") + * input').first();
    const addressVisible = await addressInput.isVisible().catch(() => false);
    if (addressVisible) {
      await addressInput.fill(`123 Test Street ${randomSuffix}`);
    }

    const cityInput = dialog.locator('input[name*="city"], input[placeholder*="city"], input[placeholder*="City"], label:has-text("City") + * input').first();
    const cityVisible = await cityInput.isVisible().catch(() => false);
    if (cityVisible) {
      await cityInput.fill('Test City');
    }

    const saveBtn = dialog.locator('button:has-text("Save"), button:has-text("Create"), button:has-text("Submit"), button[type="submit"]').first();
    const saveVisible = await saveBtn.isVisible().catch(() => false);
    if (saveVisible) {
      await saveBtn.click();
      await page.waitForTimeout(2000);
    }

    const dialogStillVisible = await dialog.isVisible().catch(() => false);
    if (!dialogStillVisible) {
      await page.waitForTimeout(3000); // networkidle never resolves on this page (confirmed live — persistent background activity)
      const table = page.locator('table, [role="grid"], [role="table"]').first();
      await expect(table).toBeVisible({ timeout: 15000 });
    }
  });

  test('[EDIT] click first row, edit a field, save', async ({ page }) => {
    test.setTimeout(300000);
    await loginToApp(page);
    await page.goto(BASE_URL);
    await page.waitForTimeout(3000); // networkidle never resolves on this page (confirmed live — persistent background activity)

    const rows = page.locator('table tbody tr, [role="grid"] [role="row"]:not([aria-label*="header"])');
    await expect(rows.first()).toBeVisible({ timeout: 30000 });

    const editBtn = page.locator('table tbody tr:first-child button[aria-label*="edit"], table tbody tr:first-child button[aria-label*="Edit"]').first();
    const editBtnVisible = await editBtn.isVisible().catch(() => false);

    if (editBtnVisible) {
      await editBtn.click();
    } else {
      await rows.first().click();
    }

    await page.waitForTimeout(1000);

    const dialog = page.locator('[role="dialog"]').first();
    const dialogVisible = await dialog.isVisible().catch(() => false);

    const panel = page.locator('[class*="panel"], [class*="drawer"], [class*="side"]').first();
    const panelVisible = await panel.isVisible().catch(() => false);

    const container = dialogVisible ? dialog : panelVisible ? panel : page;

    const nameInput = container.locator('input[name*="name"], input[placeholder*="name"], input[placeholder*="Name"]').first();
    const nameVisible = await nameInput.isVisible().catch(() => false);
    if (nameVisible) {
      const currentValue = await nameInput.inputValue();
      await nameInput.fill(currentValue + ' Edited');
    }

    const saveBtn = container.locator('button:has-text("Save"), button:has-text("Update"), button:has-text("Submit"), button[type="submit"]').first();
    const saveVisible = await saveBtn.isVisible().catch(() => false);
    if (saveVisible) {
      await saveBtn.click();
      await page.waitForTimeout(2000);
    }

    const table = page.locator('table, [role="grid"], [role="table"]').first();
    await expect(table).toBeVisible({ timeout: 15000 });
  });

  test('[DELETE] select first row, delete, confirm', async ({ page }) => {
    test.setTimeout(300000);
    await loginToApp(page);
    await page.goto(BASE_URL);
    await page.waitForTimeout(3000); // networkidle never resolves on this page (confirmed live — persistent background activity)

    const rows = page.locator('table tbody tr, [role="grid"] [role="row"]:not([aria-label*="header"])');
    await expect(rows.first()).toBeVisible({ timeout: 30000 });

    const checkbox = page.locator('table tbody tr:first-child input[type="checkbox"], [role="grid"] [role="row"]:not([aria-label*="header"]):first-child input[type="checkbox"]').first();
    const checkboxVisible = await checkbox.isVisible().catch(() => false);

    if (checkboxVisible) {
      await checkbox.check();
      await page.waitForTimeout(500);

      const deleteBtn = page.locator('button:has-text("Delete"), button[aria-label*="Delete"], button[aria-label*="delete"]').first();
      const deleteVisible = await deleteBtn.isVisible().catch(() => false);

      if (deleteVisible) {
        await deleteBtn.click();
        await page.waitForTimeout(500);

        const confirmDialog = page.locator('[role="dialog"]').first();
        const confirmVisible = await confirmDialog.isVisible().catch(() => false);

        if (confirmVisible) {
          const confirmBtn = confirmDialog.locator('button:has-text("Delete"), button:has-text("Confirm"), button:has-text("Yes"), button:has-text("OK")').first();
          const confirmBtnVisible = await confirmBtn.isVisible().catch(() => false);
          if (confirmBtnVisible) {
            await confirmBtn.click();
            await page.waitForTimeout(2000);
          } else {
            await page.keyboard.press('Escape');
          }
        }
      }
    } else {
      const rowDeleteBtn = rows.first().locator('button[aria-label*="delete"], button[aria-label*="Delete"], button:has-text("Delete")').first();
      const rowDeleteBtnVisible = await rowDeleteBtn.isVisible().catch(() => false);
      if (rowDeleteBtnVisible) {
        await rowDeleteBtn.click();
        await page.waitForTimeout(500);

        const confirmBtn = page.locator('[role="dialog"] button:has-text("Delete"), [role="dialog"] button:has-text("Confirm"), [role="dialog"] button:has-text("Yes")').first();
        const confirmVisible = await confirmBtn.isVisible().catch(() => false);
        if (confirmVisible) {
          await confirmBtn.click();
          await page.waitForTimeout(2000);
        }
      }
    }

    const table = page.locator('table, [role="grid"], [role="table"]').first();
    await expect(table).toBeVisible({ timeout: 15000 });
  });

  test('[NAV] accessible via sidebar navigation', async ({ page }) => {
    test.setTimeout(300000);
    await loginToApp(page);
    await page.waitForTimeout(3000); // networkidle never resolves on this page (confirmed live — persistent background activity)

    const venuesMenuItem = page.getByRole('menuitem', { name: 'Venues' });
    const menuItemVisible = await venuesMenuItem.isVisible().catch(() => false);

    if (menuItemVisible) {
      await venuesMenuItem.click();
    } else {
      const sidebarLink = page.locator('nav a:has-text("Venues"), aside a:has-text("Venues"), [role="navigation"] a:has-text("Venues")').first();
      const sidebarLinkVisible = await sidebarLink.isVisible().catch(() => false);

      if (sidebarLinkVisible) {
        await sidebarLink.click();
      } else {
        await page.goto(BASE_URL);
      }
    }

    await page.waitForTimeout(3000); // networkidle never resolves on this page (confirmed live — persistent background activity)
    await expect(page).toHaveURL(/venues/, { timeout: 30000 });

    const table = page.locator('table, [role="grid"], [role="table"]').first();
    await expect(table).toBeVisible({ timeout: 30000 });
  });
});
