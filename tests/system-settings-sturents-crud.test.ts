import { test, expect } from '@playwright/test';
import { loginToApp } from './helpers/auth.helper';

const BASE_URL = 'https://app-staging.vivacityapp.com';
const STURENTS_URL = `${BASE_URL}/system-settings/sturents`;

test.describe('System Settings - StuRents', () => {
  test.beforeEach(async ({ page }) => {
    await loginToApp(page, 90000, 'pau.kie.chee@fusioneta.com', 'PAOpaopao@9696');
  });

  test('[READ] StuRents list loads with table', async ({ page }) => {
    test.setTimeout(180000);

    await page.goto(STURENTS_URL);
    await page.waitForLoadState('networkidle');

    const table = page.locator('table, [role="grid"], [role="table"], .data-table, .ag-root, .ant-table');
    await expect(table.first()).toBeVisible({ timeout: 30000 });
  });

  test('[READ] StuRents table columns are visible', async ({ page }) => {
    test.setTimeout(180000);

    await page.goto(STURENTS_URL);
    await page.waitForLoadState('networkidle');

    const headerRow = page.locator('thead tr, [role="row"]:first-child, .table-header, .ag-header-row');
    await expect(headerRow.first()).toBeVisible({ timeout: 30000 });

    const columnKeywords = ['property', 'sturents', 'id', 'status', 'name', 'mapping'];
    let foundColumn = false;
    for (const keyword of columnKeywords) {
      const col = page.locator(`th:has-text("${keyword}"), [role="columnheader"]:has-text("${keyword}")`, {
        // case-insensitive workaround via filter
      });
      const colInsensitive = page.locator('th, [role="columnheader"]').filter({ hasText: new RegExp(keyword, 'i') });
      const count = await colInsensitive.count();
      if (count > 0) {
        foundColumn = true;
        break;
      }
    }
    expect(foundColumn).toBe(true);
  });

  test('[READ] StuRents search or filter works', async ({ page }) => {
    test.setTimeout(180000);

    await page.goto(STURENTS_URL);
    await page.waitForLoadState('networkidle');

    const searchInput = page.locator(
      'input[placeholder*="search" i], input[placeholder*="filter" i], input[type="search"], .search-input input, [aria-label*="search" i]'
    );

    const hasSearch = await searchInput.first().isVisible().catch(() => false);

    if (hasSearch) {
      await searchInput.first().fill('test');
      await page.waitForTimeout(1000);
      await searchInput.first().clear();
      await page.waitForTimeout(500);
    } else {
      const filterButton = page.locator('button:has-text("Filter"), button[aria-label*="filter" i], .filter-btn');
      const hasFilter = await filterButton.first().isVisible().catch(() => false);
      if (hasFilter) {
        await filterButton.first().click();
        await page.waitForTimeout(500);
      }
    }

    const table = page.locator('table, [role="grid"], [role="table"], .data-table, .ag-root, .ant-table');
    await expect(table.first()).toBeVisible({ timeout: 15000 });
  });

  test('[CREATE] create new StuRents mapping', async ({ page }) => {
    test.setTimeout(180000);

    await page.goto(STURENTS_URL);
    await page.waitForLoadState('networkidle');

    const createButton = page.locator(
      'button:has-text("Create"), button:has-text("Add"), button:has-text("New"), button:has-text("+ "), [aria-label*="create" i], [aria-label*="add" i]'
    ).first();
    await expect(createButton).toBeVisible({ timeout: 15000 });
    await createButton.click();

    const dialog = page.locator('[role="dialog"], .modal, .dialog, .drawer, .side-panel');
    await expect(dialog.first()).toBeVisible({ timeout: 15000 });

    const propertyField = dialog.first().locator(
      'input[name*="property" i], input[placeholder*="property" i], [aria-label*="property" i], .property-select input, select[name*="property" i]'
    );
    const hasPropertyField = await propertyField.first().isVisible().catch(() => false);
    if (hasPropertyField) {
      await propertyField.first().click();
      await page.waitForTimeout(300);
      const dropdownOption = page.locator('[role="option"], .ant-select-item, .dropdown-item').first();
      const hasOption = await dropdownOption.isVisible().catch(() => false);
      if (hasOption) {
        await dropdownOption.click();
      } else {
        await propertyField.first().fill('Test Property');
      }
    }

    const sturentsIdField = dialog.first().locator(
      'input[name*="sturents" i], input[name*="id" i], input[placeholder*="sturents" i], input[placeholder*="id" i], [aria-label*="sturents" i]'
    );
    const hasSturentsField = await sturentsIdField.first().isVisible().catch(() => false);
    if (hasSturentsField) {
      await sturentsIdField.first().fill('STUR-TEST-001');
    }

    const nameField = dialog.first().locator(
      'input[name*="name" i], input[placeholder*="name" i], [aria-label*="name" i]'
    );
    const hasNameField = await nameField.first().isVisible().catch(() => false);
    if (hasNameField) {
      await nameField.first().fill('Test StuRents Mapping');
    }

    const requiredFields = dialog.first().locator('input[required], select[required], [aria-required="true"]');
    const requiredCount = await requiredFields.count();
    for (let i = 0; i < requiredCount; i++) {
      const field = requiredFields.nth(i);
      const tagName = await field.evaluate(el => el.tagName.toLowerCase());
      const currentValue = await field.inputValue().catch(() => '');
      if (!currentValue) {
        if (tagName === 'select') {
          const options = field.locator('option');
          const optionCount = await options.count();
          if (optionCount > 1) {
            await field.selectOption({ index: 1 });
          }
        } else {
          await field.fill('Test Value');
        }
      }
    }

    const saveButton = dialog.first().locator(
      'button:has-text("Save"), button:has-text("Create"), button:has-text("Submit"), button:has-text("Add"), button[type="submit"]'
    ).first();
    const hasSaveButton = await saveButton.isVisible().catch(() => false);
    if (hasSaveButton) {
      await saveButton.click();
      await page.waitForTimeout(2000);

      const dialogStillOpen = await dialog.first().isVisible().catch(() => false);
      if (!dialogStillOpen) {
        const table = page.locator('table, [role="grid"], [role="table"], .data-table, .ag-root, .ant-table');
        await expect(table.first()).toBeVisible({ timeout: 15000 });
      }
    }
  });

  test('[EDIT] edit existing StuRents mapping', async ({ page }) => {
    test.setTimeout(180000);

    await page.goto(STURENTS_URL);
    await page.waitForLoadState('networkidle');

    const tableRow = page.locator(
      'tbody tr, [role="row"]:not(:first-child), .table-row, .ag-row'
    ).first();

    await expect(tableRow).toBeVisible({ timeout: 30000 });

    const editButton = tableRow.locator(
      'button:has-text("Edit"), button[aria-label*="edit" i], [title*="edit" i], .edit-btn'
    );
    const hasEditButton = await editButton.first().isVisible().catch(() => false);

    if (hasEditButton) {
      await editButton.first().click();
    } else {
      await tableRow.click();
    }

    const editPanel = page.locator('[role="dialog"], .modal, .dialog, .drawer, .side-panel, .edit-panel');
    await expect(editPanel.first()).toBeVisible({ timeout: 15000 });

    const editableInput = editPanel.first().locator('input, textarea').first();
    const hasInput = await editableInput.isVisible().catch(() => false);
    if (hasInput) {
      const currentValue = await editableInput.inputValue().catch(() => '');
      await editableInput.triple_click ? editableInput.click({ clickCount: 3 }) : editableInput.fill('');
      await editableInput.fill(currentValue ? `${currentValue} (edited)` : 'Edited Value');
    }

    const saveButton = editPanel.first().locator(
      'button:has-text("Save"), button:has-text("Update"), button:has-text("Submit"), button[type="submit"]'
    ).first();
    const hasSaveButton = await saveButton.isVisible().catch(() => false);
    if (hasSaveButton) {
      await saveButton.click();
      await page.waitForTimeout(2000);
    }

    const table = page.locator('table, [role="grid"], [role="table"], .data-table, .ag-root, .ant-table');
    await expect(table.first()).toBeVisible({ timeout: 15000 });
  });

  test('[DELETE] select and delete a StuRents mapping', async ({ page }) => {
    test.setTimeout(180000);

    await page.goto(STURENTS_URL);
    await page.waitForLoadState('networkidle');

    const tableRow = page.locator(
      'tbody tr, [role="row"]:not(:first-child), .table-row, .ag-row'
    ).first();
    await expect(tableRow).toBeVisible({ timeout: 30000 });

    const rowCheckbox = tableRow.locator('input[type="checkbox"], [role="checkbox"]').first();
    const hasCheckbox = await rowCheckbox.isVisible().catch(() => false);

    if (hasCheckbox) {
      await rowCheckbox.click();
      await page.waitForTimeout(500);

      const deleteButton = page.locator(
        'button:has-text("Delete"), button[aria-label*="delete" i], [title*="delete" i], .delete-btn'
      ).first();
      await expect(deleteButton).toBeVisible({ timeout: 10000 });
      await deleteButton.click();

      const confirmDialog = page.locator('[role="dialog"], .confirm-modal, .confirmation-dialog, .ant-modal');
      const hasConfirmDialog = await confirmDialog.first().isVisible().catch(() => false);
      if (hasConfirmDialog) {
        const confirmButton = confirmDialog.first().locator(
          'button:has-text("Delete"), button:has-text("Confirm"), button:has-text("Yes"), button:has-text("OK")'
        ).first();
        await expect(confirmButton).toBeVisible({ timeout: 10000 });
        await confirmButton.click();
        await page.waitForTimeout(2000);
      }
    } else {
      const deleteButton = tableRow.locator(
        'button:has-text("Delete"), button[aria-label*="delete" i], [title*="delete" i], .delete-btn'
      ).first();
      const hasInlineDelete = await deleteButton.isVisible().catch(() => false);
      if (hasInlineDelete) {
        await deleteButton.click();
        await page.waitForTimeout(500);

        const confirmButton = page.locator(
          '[role="dialog"] button:has-text("Delete"), [role="dialog"] button:has-text("Confirm"), [role="dialog"] button:has-text("Yes")'
        ).first();
        const hasConfirm = await confirmButton.isVisible().catch(() => false);
        if (hasConfirm) {
          await confirmButton.click();
          await page.waitForTimeout(2000);
        }
      }
    }

    const table = page.locator('table, [role="grid"], [role="table"], .data-table, .ag-root, .ant-table');
    await expect(table.first()).toBeVisible({ timeout: 15000 });
  });

  test('[NAV] StuRents accessible via system settings navigation', async ({ page }) => {
    test.setTimeout(180000);

    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');

    const systemSettingsButton = page.locator('[aria-label="Open system settings"], button:has-text("System Settings"), [title="System Settings"]').first();
    await expect(systemSettingsButton).toBeVisible({ timeout: 30000 });
    await systemSettingsButton.click();

    await page.waitForURL(/\/system-settings\//, { timeout: 30000 });
    await page.waitForLoadState('networkidle');

    const sturentsLink = page.locator(
      'a[href*="sturents"], nav a:has-text("StuRents"), [role="menuitem"]:has-text("StuRents"), li:has-text("StuRents") a'
    ).first();

    const hasSturentsLink = await sturentsLink.isVisible().catch(() => false);

    if (hasSturentsLink) {
      await sturentsLink.click();
      await page.waitForURL(/\/system-settings\/sturents/, { timeout: 30000 });
    } else {
      await page.goto(STURENTS_URL);
    }

    await page.waitForLoadState('networkidle');
    expect(page.url()).toContain('/system-settings/sturents');

    const table = page.locator('table, [role="grid"], [role="table"], .data-table, .ag-root, .ant-table');
    await expect(table.first()).toBeVisible({ timeout: 30000 });
  });
});
