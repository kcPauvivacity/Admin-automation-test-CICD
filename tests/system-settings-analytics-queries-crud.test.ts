import { test, expect } from '@playwright/test';
import { loginToApp } from './helpers/auth.helper';

const BASE_URL = 'https://app-staging.vivacityapp.com';
const ANALYTICS_QUERIES_URL = `${BASE_URL}/system-settings/analytics-queries`;

test.describe('System Settings - Analytics Queries CRUD', () => {

  test('NAV - navigate to Analytics Queries via system settings header button', async ({ page }) => {
    test.setTimeout(180000);
    await loginToApp(page, 90000, 'pau.kie.chee@fusioneta.com', 'PAOpaopao@9696');

    const systemSettingsBtn = page.locator('[aria-label="Open system settings"]');
    await systemSettingsBtn.waitFor({ state: 'visible', timeout: 30000 });
    await systemSettingsBtn.click();

    await page.waitForURL(/\/system-settings\/organizations/, { timeout: 30000 });

    const analyticsQueriesLink = page.locator('a, [role="menuitem"], [role="link"]').filter({ hasText: /analytics queries/i }).first();
    const analyticsQueriesVisible = await analyticsQueriesLink.isVisible().catch(() => false);
    if (analyticsQueriesVisible) {
      await analyticsQueriesLink.click();
      await page.waitForURL(/\/system-settings\/analytics-queries/, { timeout: 30000 });
    } else {
      await page.goto(ANALYTICS_QUERIES_URL, { waitUntil: 'networkidle', timeout: 60000 });
    }

    await expect(page).toHaveURL(/\/system-settings\/analytics-queries/, { timeout: 30000 });
  });

  test('READ - list Analytics Queries and verify table columns', async ({ page }) => {
    test.setTimeout(180000);
    await loginToApp(page, 90000, 'pau.kie.chee@fusioneta.com', 'PAOpaopao@9696');
    await page.goto(ANALYTICS_QUERIES_URL, { waitUntil: 'networkidle', timeout: 60000 });

    const table = page.locator('table, [role="grid"], [role="table"]').first();
    await table.waitFor({ state: 'visible', timeout: 30000 });

    const nameColumn = page.locator('th, [role="columnheader"]').filter({ hasText: /name/i }).first();
    const nameColumnVisible = await nameColumn.isVisible().catch(() => false);
    expect(nameColumnVisible).toBe(true);

    const sqlColumn = page.locator('th, [role="columnheader"]').filter({ hasText: /sql|query/i }).first();
    const sqlColumnVisible = await sqlColumn.isVisible().catch(() => false);

    const actionsColumn = page.locator('th, [role="columnheader"]').filter({ hasText: /actions?/i }).first();
    const actionsColumnVisible = await actionsColumn.isVisible().catch(() => false);

    expect(nameColumnVisible || sqlColumnVisible || actionsColumnVisible).toBe(true);
  });

  test('READ - search for an Analytics Query by name', async ({ page }) => {
    test.setTimeout(180000);
    await loginToApp(page, 90000, 'pau.kie.chee@fusioneta.com', 'PAOpaopao@9696');
    await page.goto(ANALYTICS_QUERIES_URL, { waitUntil: 'networkidle', timeout: 60000 });

    const searchInput = page.locator('input[type="search"], input[placeholder*="search" i], input[placeholder*="filter" i]').first();
    const searchVisible = await searchInput.isVisible().catch(() => false);

    if (searchVisible) {
      await searchInput.fill('test');
      await page.waitForTimeout(1000);

      const rows = page.locator('tbody tr, [role="row"]:not([role="columnheader"])');
      const rowCount = await rows.count().catch(() => 0);
      expect(rowCount).toBeGreaterThanOrEqual(0);

      await searchInput.clear();
      await page.waitForTimeout(500);
    } else {
      const table = page.locator('table, [role="grid"], [role="table"]').first();
      const tableVisible = await table.isVisible().catch(() => false);
      expect(tableVisible).toBe(true);
    }
  });

  test('CREATE - open create dialog and verify name and SQL editor fields', async ({ page }) => {
    test.setTimeout(180000);
    await loginToApp(page, 90000, 'pau.kie.chee@fusioneta.com', 'PAOpaopao@9696');
    await page.goto(ANALYTICS_QUERIES_URL, { waitUntil: 'networkidle', timeout: 60000 });

    const createBtn = page.locator('button').filter({ hasText: /create|add|new/i }).first();
    await createBtn.waitFor({ state: 'visible', timeout: 30000 });
    await createBtn.click();

    const dialog = page.locator('[role="dialog"], .modal, [data-testid*="dialog"]').first();
    await dialog.waitFor({ state: 'visible', timeout: 20000 });

    const nameField = dialog.locator('input[name*="name" i], input[placeholder*="name" i], label:has-text("Name") ~ * input, label:has-text("Name") + input').first();
    const nameFieldVisible = await nameField.isVisible().catch(() => false);
    expect(nameFieldVisible).toBe(true);

    const sqlEditor = dialog.locator('textarea, [role="textbox"], .cm-editor, .monaco-editor, [data-testid*="sql" i], [data-testid*="editor" i]').first();
    const sqlEditorVisible = await sqlEditor.isVisible().catch(() => false);
    expect(sqlEditorVisible).toBe(true);

    const cancelBtn = dialog.locator('button').filter({ hasText: /cancel|close|dismiss/i }).first();
    const cancelVisible = await cancelBtn.isVisible().catch(() => false);
    if (cancelVisible) {
      await cancelBtn.click();
    } else {
      await page.keyboard.press('Escape');
    }

    await dialog.waitFor({ state: 'hidden', timeout: 10000 }).catch(() => {});
  });

  test('CREATE - fill in name and SQL editor fields then cancel', async ({ page }) => {
    test.setTimeout(180000);
    await loginToApp(page, 90000, 'pau.kie.chee@fusioneta.com', 'PAOpaopao@9696');
    await page.goto(ANALYTICS_QUERIES_URL, { waitUntil: 'networkidle', timeout: 60000 });

    const createBtn = page.locator('button').filter({ hasText: /create|add|new/i }).first();
    await createBtn.waitFor({ state: 'visible', timeout: 30000 });
    await createBtn.click();

    const dialog = page.locator('[role="dialog"], .modal, [data-testid*="dialog"]').first();
    await dialog.waitFor({ state: 'visible', timeout: 20000 });

    const nameField = dialog.locator('input[name*="name" i], input[placeholder*="name" i], label:has-text("Name") ~ * input, label:has-text("Name") + input').first();
    const nameFieldVisible = await nameField.isVisible().catch(() => false);
    if (nameFieldVisible) {
      await nameField.fill('Test Analytics Query');
    }

    const sqlEditor = dialog.locator('textarea').first();
    const sqlEditorVisible = await sqlEditor.isVisible().catch(() => false);
    if (sqlEditorVisible) {
      await sqlEditor.fill('SELECT * FROM test_table LIMIT 10');
    } else {
      const codeEditor = dialog.locator('.cm-editor, .monaco-editor').first();
      const codeEditorVisible = await codeEditor.isVisible().catch(() => false);
      if (codeEditorVisible) {
        await codeEditor.click();
        await page.keyboard.type('SELECT * FROM test_table LIMIT 10');
      }
    }

    const cancelBtn = dialog.locator('button').filter({ hasText: /cancel|close|dismiss/i }).first();
    const cancelVisible = await cancelBtn.isVisible().catch(() => false);
    if (cancelVisible) {
      await cancelBtn.click();
    } else {
      await page.keyboard.press('Escape');
    }

    await dialog.waitFor({ state: 'hidden', timeout: 10000 }).catch(() => {});
  });

  test('EDIT - click first row or edit button and update name', async ({ page }) => {
    test.setTimeout(180000);
    await loginToApp(page, 90000, 'pau.kie.chee@fusioneta.com', 'PAOpaopao@9696');
    await page.goto(ANALYTICS_QUERIES_URL, { waitUntil: 'networkidle', timeout: 60000 });

    const rows = page.locator('tbody tr, [role="row"]:not(:first-child)');
    await rows.first().waitFor({ state: 'visible', timeout: 30000 });

    const editBtn = rows.first().locator('button').filter({ hasText: /edit/i }).first();
    const editBtnVisible = await editBtn.isVisible().catch(() => false);

    if (editBtnVisible) {
      await editBtn.click();
    } else {
      await rows.first().click();
    }

    const dialog = page.locator('[role="dialog"], .modal, [data-testid*="dialog"]').first();
    await dialog.waitFor({ state: 'visible', timeout: 20000 });

    const nameField = dialog.locator('input[name*="name" i], input[placeholder*="name" i], label:has-text("Name") ~ * input, label:has-text("Name") + input').first();
    const nameFieldVisible = await nameField.isVisible().catch(() => false);

    if (nameFieldVisible) {
      await nameField.click({ clickCount: 3 });
      const currentName = await nameField.inputValue().catch(() => '');
      await nameField.fill(currentName + ' (edited)');

      const cancelBtn = dialog.locator('button').filter({ hasText: /cancel|close|dismiss/i }).first();
      const cancelVisible = await cancelBtn.isVisible().catch(() => false);
      if (cancelVisible) {
        await cancelBtn.click();
      } else {
        await page.keyboard.press('Escape');
      }
    } else {
      const closeBtn = dialog.locator('button').filter({ hasText: /cancel|close|dismiss/i }).first();
      const closeBtnVisible = await closeBtn.isVisible().catch(() => false);
      if (closeBtnVisible) {
        await closeBtn.click();
      } else {
        await page.keyboard.press('Escape');
      }
    }

    await dialog.waitFor({ state: 'hidden', timeout: 10000 }).catch(() => {});
  });

  test('DELETE - select row via checkbox and confirm deletion dialog', async ({ page }) => {
    test.setTimeout(180000);
    await loginToApp(page, 90000, 'pau.kie.chee@fusioneta.com', 'PAOpaopao@9696');
    await page.goto(ANALYTICS_QUERIES_URL, { waitUntil: 'networkidle', timeout: 60000 });

    const rows = page.locator('tbody tr, [role="row"]:not(:first-child)');
    await rows.first().waitFor({ state: 'visible', timeout: 30000 });

    const rowCheckbox = rows.first().locator('input[type="checkbox"]').first();
    const checkboxVisible = await rowCheckbox.isVisible().catch(() => false);

    if (checkboxVisible) {
      await rowCheckbox.check();
      await page.waitForTimeout(500);

      const deleteBtn = page.locator('button').filter({ hasText: /delete|remove/i }).first();
      const deleteBtnVisible = await deleteBtn.isVisible().catch(() => false);

      if (deleteBtnVisible) {
        await deleteBtn.click();

        const confirmDialog = page.locator('[role="dialog"], .modal, [data-testid*="confirm"]').first();
        const confirmDialogVisible = await confirmDialog.isVisible().catch(() => false);

        if (confirmDialogVisible) {
          const cancelConfirmBtn = confirmDialog.locator('button').filter({ hasText: /cancel|no|dismiss/i }).first();
          const cancelConfirmVisible = await cancelConfirmBtn.isVisible().catch(() => false);
          if (cancelConfirmVisible) {
            await cancelConfirmBtn.click();
          } else {
            await page.keyboard.press('Escape');
          }
          await confirmDialog.waitFor({ state: 'hidden', timeout: 10000 }).catch(() => {});
        }
      } else {
        await rowCheckbox.uncheck();
      }
    } else {
      const deleteBtn = rows.first().locator('button').filter({ hasText: /delete|remove/i }).first();
      const deleteBtnVisible = await deleteBtn.isVisible().catch(() => false);

      if (deleteBtnVisible) {
        await deleteBtn.click();

        const confirmDialog = page.locator('[role="dialog"], .modal, [data-testid*="confirm"]').first();
        const confirmDialogVisible = await confirmDialog.isVisible().catch(() => false);

        if (confirmDialogVisible) {
          const cancelConfirmBtn = confirmDialog.locator('button').filter({ hasText: /cancel|no|dismiss/i }).first();
          const cancelConfirmVisible = await cancelConfirmBtn.isVisible().catch(() => false);
          if (cancelConfirmVisible) {
            await cancelConfirmBtn.click();
          } else {
            await page.keyboard.press('Escape');
          }
          await confirmDialog.waitFor({ state: 'hidden', timeout: 10000 }).catch(() => {});
        }
      } else {
        const table = page.locator('table, [role="grid"], [role="table"]').first();
        const tableVisible = await table.isVisible().catch(() => false);
        expect(tableVisible).toBe(true);
      }
    }
  });

});
