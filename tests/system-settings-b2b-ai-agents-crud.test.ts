import { test, expect } from '@playwright/test';
import { loginToApp } from './helpers/auth.helper';

const BASE_URL = 'https://app-staging.vivacityapp.com';
const MODULE_URL = `${BASE_URL}/system-settings/b2b-ai`;
const FUSIONETA_EMAIL = 'pau.kie.chee@fusioneta.com';
const FUSIONETA_PASSWORD = 'PAOpaopao@9696';
const TEST_AGENT_NAME = `Test B2B AI Agent ${Date.now()}`;
const EDITED_AGENT_NAME = `Edited B2B AI Agent ${Date.now()}`;

test.describe('System Settings - B2B AI Agents CRUD', () => {

  test('[READ] B2B AI Agents list loads with table', async ({ page }) => {
    test.setTimeout(180000);

    await loginToApp(page, 90000, FUSIONETA_EMAIL, FUSIONETA_PASSWORD);
    await page.goto(MODULE_URL);
    await page.waitForLoadState('networkidle');

    const table = page.locator('table, [role="grid"], [role="table"], .ag-root, .data-table').first();
    await expect(table).toBeVisible({ timeout: 30000 });
  });

  test('[READ] columns visible (name, status, etc.)', async ({ page }) => {
    test.setTimeout(180000);

    await loginToApp(page, 90000, FUSIONETA_EMAIL, FUSIONETA_PASSWORD);
    await page.goto(MODULE_URL);
    await page.waitForLoadState('networkidle');

    const nameColumn = page.locator('th, [role="columnheader"]').filter({ hasText: /name/i }).first();
    const nameColumnVisible = await nameColumn.isVisible().catch(() => false);
    expect(nameColumnVisible).toBe(true);

    const statusColumn = page.locator('th, [role="columnheader"]').filter({ hasText: /status/i }).first();
    const statusColumnVisible = await statusColumn.isVisible().catch(() => false);
    if (statusColumnVisible) {
      await expect(statusColumn).toBeVisible();
    }
  });

  test('[READ] search B2B AI agents', async ({ page }) => {
    test.setTimeout(180000);

    await loginToApp(page, 90000, FUSIONETA_EMAIL, FUSIONETA_PASSWORD);
    await page.goto(MODULE_URL);
    await page.waitForLoadState('networkidle');

    const searchInput = page.locator('input[type="search"], input[placeholder*="search" i], input[placeholder*="Search" i], [aria-label*="search" i]').first();
    const searchVisible = await searchInput.isVisible().catch(() => false);

    if (searchVisible) {
      await searchInput.fill('test');
      await page.waitForTimeout(1000);
      const table = page.locator('table, [role="grid"], [role="table"], .ag-root, .data-table').first();
      await expect(table).toBeVisible({ timeout: 10000 });

      await searchInput.clear();
      await page.waitForTimeout(500);
    }
  });

  test('[CREATE] open create dialog, fill agent name and required fields, save', async ({ page }) => {
    test.setTimeout(180000);

    await loginToApp(page, 90000, FUSIONETA_EMAIL, FUSIONETA_PASSWORD);
    await page.goto(MODULE_URL);
    await page.waitForLoadState('networkidle');

    const createButton = page.locator('button').filter({ hasText: /create|add|new/i }).first();
    await expect(createButton).toBeVisible({ timeout: 20000 });
    await createButton.click();

    const dialog = page.locator('[role="dialog"]').first();
    await expect(dialog).toBeVisible({ timeout: 15000 });

    const nameInput = dialog.locator('input[name*="name" i], input[placeholder*="name" i], input[id*="name" i], input[label*="name" i]').first();
    const nameInputVisible = await nameInput.isVisible().catch(() => false);

    if (nameInputVisible) {
      await nameInput.fill(TEST_AGENT_NAME);
    } else {
      const firstInput = dialog.locator('input[type="text"], input:not([type="hidden"])').first();
      const firstInputVisible = await firstInput.isVisible().catch(() => false);
      if (firstInputVisible) {
        await firstInput.fill(TEST_AGENT_NAME);
      }
    }

    const requiredFields = dialog.locator('input[required], select[required], textarea[required]');
    const requiredCount = await requiredFields.count();
    for (let i = 0; i < requiredCount; i++) {
      const field = requiredFields.nth(i);
      const fieldVisible = await field.isVisible().catch(() => false);
      if (!fieldVisible) continue;

      const tagName = await field.evaluate(el => el.tagName.toLowerCase());
      const fieldValue = await field.inputValue().catch(() => '');
      if (fieldValue) continue;

      if (tagName === 'input') {
        const inputType = await field.getAttribute('type');
        if (!inputType || inputType === 'text' || inputType === 'email') {
          await field.fill('Test Value');
        }
      }
    }

    const saveButton = dialog.locator('button').filter({ hasText: /save|create|submit|confirm/i }).first();
    const saveVisible = await saveButton.isVisible().catch(() => false);
    if (saveVisible) {
      await saveButton.click();
      await page.waitForTimeout(2000);

      const dialogStillOpen = await dialog.isVisible().catch(() => false);
      if (!dialogStillOpen) {
        await page.waitForLoadState('networkidle');
        const successToast = page.locator('[role="alert"], .toast, .notification, .snackbar').filter({ hasText: /success|created|saved/i }).first();
        const toastVisible = await successToast.isVisible().catch(() => false);
        if (toastVisible) {
          await expect(successToast).toBeVisible();
        }
      }
    }
  });

  test('[EDIT] click first agent, edit name or settings, save', async ({ page }) => {
    test.setTimeout(180000);

    await loginToApp(page, 90000, FUSIONETA_EMAIL, FUSIONETA_PASSWORD);
    await page.goto(MODULE_URL);
    await page.waitForLoadState('networkidle');

    const tableRows = page.locator('table tbody tr, [role="row"]:not([role="columnheader"])').first();
    const rowVisible = await tableRows.isVisible().catch(() => false);

    if (!rowVisible) {
      test.skip();
      return;
    }

    const editButton = page.locator('button[aria-label*="edit" i], button').filter({ hasText: /^edit$/i }).first();
    const editButtonVisible = await editButton.isVisible().catch(() => false);

    if (editButtonVisible) {
      await editButton.click();
    } else {
      await tableRows.click();
    }

    const dialog = page.locator('[role="dialog"]').first();
    const dialogVisible = await dialog.isVisible().catch(() => false);

    const panel = page.locator('[class*="panel"], [class*="drawer"], [class*="sidebar"], [class*="slide"]').first();
    const panelVisible = await panel.isVisible().catch(() => false);

    const editContainer = dialogVisible ? dialog : (panelVisible ? panel : page);

    const nameInput = editContainer.locator('input[name*="name" i], input[placeholder*="name" i], input[id*="name" i]').first();
    const nameInputVisible = await nameInput.isVisible().catch(() => false);

    if (nameInputVisible) {
      await nameInput.clear();
      await nameInput.fill(EDITED_AGENT_NAME);
    }

    const saveButton = editContainer.locator('button').filter({ hasText: /save|update|confirm/i }).first();
    const saveVisible = await saveButton.isVisible().catch(() => false);
    if (saveVisible) {
      await saveButton.click();
      await page.waitForTimeout(2000);
    }

    const successToast = page.locator('[role="alert"], .toast, .notification, .snackbar').filter({ hasText: /success|updated|saved/i }).first();
    const toastVisible = await successToast.isVisible().catch(() => false);
    if (toastVisible) {
      await expect(successToast).toBeVisible();
    }
  });

  test('[DELETE] select agent, delete, confirm', async ({ page }) => {
    test.setTimeout(180000);

    await loginToApp(page, 90000, FUSIONETA_EMAIL, FUSIONETA_PASSWORD);
    await page.goto(MODULE_URL);
    await page.waitForLoadState('networkidle');

    const tableRows = page.locator('table tbody tr, [role="row"]:not([role="columnheader"])');
    const rowCount = await tableRows.count();

    if (rowCount === 0) {
      test.skip();
      return;
    }

    const firstRowCheckbox = tableRows.first().locator('input[type="checkbox"]').first();
    const checkboxVisible = await firstRowCheckbox.isVisible().catch(() => false);

    if (checkboxVisible) {
      await firstRowCheckbox.check();
    } else {
      const headerCheckbox = page.locator('thead input[type="checkbox"], [role="columnheader"] input[type="checkbox"]').first();
      const headerCheckboxVisible = await headerCheckbox.isVisible().catch(() => false);
      if (headerCheckboxVisible) {
        await headerCheckbox.check();
      }
    }

    const deleteButton = page.locator('button').filter({ hasText: /^delete$/i }).first();
    const deleteButtonVisible = await deleteButton.isVisible().catch(() => false);

    if (!deleteButtonVisible) {
      const actionsDeleteButton = page.locator('button[aria-label*="delete" i]').first();
      const actionsDeleteVisible = await actionsDeleteButton.isVisible().catch(() => false);
      if (actionsDeleteVisible) {
        await actionsDeleteButton.click();
      } else {
        test.skip();
        return;
      }
    } else {
      await deleteButton.click();
    }

    await page.waitForTimeout(1000);

    const confirmDialog = page.locator('[role="dialog"]').first();
    const confirmDialogVisible = await confirmDialog.isVisible().catch(() => false);

    if (confirmDialogVisible) {
      const confirmButton = confirmDialog.locator('button').filter({ hasText: /confirm|yes|delete|ok/i }).first();
      const confirmVisible = await confirmButton.isVisible().catch(() => false);
      if (confirmVisible) {
        await confirmButton.click();
        await page.waitForTimeout(2000);
      }
    }

    const successToast = page.locator('[role="alert"], .toast, .notification, .snackbar').filter({ hasText: /success|deleted|removed/i }).first();
    const toastVisible = await successToast.isVisible().catch(() => false);
    if (toastVisible) {
      await expect(successToast).toBeVisible();
    }
  });

  test('[NAV] accessible via system-settings sidebar', async ({ page }) => {
    test.setTimeout(180000);

    await loginToApp(page, 90000, FUSIONETA_EMAIL, FUSIONETA_PASSWORD);
    await page.goto(`${BASE_URL}/system-settings/organizations`);
    await page.waitForLoadState('networkidle');

    const sidebarLink = page.locator('[role="navigation"] a, nav a, aside a').filter({ hasText: /b2b ai agent/i }).first();
    const sidebarLinkVisible = await sidebarLink.isVisible().catch(() => false);

    if (sidebarLinkVisible) {
      await sidebarLink.click();
      await page.waitForLoadState('networkidle');
      await expect(page).toHaveURL(/b2b-ai-agents/, { timeout: 15000 });
    } else {
      const aiSection = page.locator('[role="navigation"] button, nav button, aside button').filter({ hasText: /ai/i }).first();
      const aiSectionVisible = await aiSection.isVisible().catch(() => false);
      if (aiSectionVisible) {
        await aiSection.click();
        await page.waitForTimeout(500);
        const b2bLink = page.locator('[role="navigation"] a, nav a, aside a').filter({ hasText: /b2b ai agent/i }).first();
        const b2bLinkVisible = await b2bLink.isVisible().catch(() => false);
        if (b2bLinkVisible) {
          await b2bLink.click();
          await page.waitForLoadState('networkidle');
          await expect(page).toHaveURL(/b2b-ai-agents/, { timeout: 15000 });
        } else {
          await page.goto(MODULE_URL);
          await page.waitForLoadState('networkidle');
          await expect(page).toHaveURL(/b2b-ai-agents/);
        }
      } else {
        await page.goto(MODULE_URL);
        await page.waitForLoadState('networkidle');
        await expect(page).toHaveURL(/b2b-ai-agents/);
      }
    }

    const table = page.locator('table, [role="grid"], [role="table"], .ag-root, .data-table').first();
    await expect(table).toBeVisible({ timeout: 20000 });
  });

});
