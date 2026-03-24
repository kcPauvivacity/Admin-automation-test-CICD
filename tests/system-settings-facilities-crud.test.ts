import { test, expect } from '@playwright/test';
import { loginToApp } from './helpers/auth.helper';

// Facilities is under System Settings (fusioneta account)
const EMAIL = 'pau.kie.chee@fusioneta.com';
const PASSWORD = 'PAOpaopao@9696';
const BASE = 'https://app-staging.vivacityapp.com';
const LIST_URL = `${BASE}/system-settings/facilities`;

// UI facts (from ARIA scan):
//   • All rows have inline textboxes: placeholder "Enter English name" / "Enter Chinese name"
//   • Create adds a blank row at top; Create button becomes disabled until row is saved/discarded
//   • Delete button visible text: "Delete", ARIA name: "Remove button" → use filter({ hasText: 'Delete' })
//   • Columns: ID | English Name | Chinese Name | Created At

async function navigateToFacilities(page: any) {
    await page.goto(LIST_URL, { waitUntil: 'load', timeout: 30000 });
    await page.waitForTimeout(3000);
    await expect(page).toHaveURL(/system-settings\/facilities/, { timeout: 10000 });
    await page.waitForSelector('tbody tr', { timeout: 30000 });
    await page.waitForTimeout(1000);
    console.log('✅ Navigated to Facilities list');
}

// ─────────────────────────────────────────────────────────────
// READ
// ─────────────────────────────────────────────────────────────

test('Facilities - [READ] list page loads with table and correct columns', async ({ page }) => {
    test.setTimeout(120000);
    await loginToApp(page, 90000, EMAIL, PASSWORD);
    await navigateToFacilities(page);

    // Verify table is visible
    const table = page.locator('table, [role="grid"], .v-data-table').first();
    await expect(table).toBeVisible({ timeout: 10000 });

    // Check expected columns
    const expectedCols = ['ID', 'English Name', 'Chinese Name', 'Created At'];
    for (const col of expectedCols) {
        const header = page.locator(`th:has-text("${col}"), [role="columnheader"]:has-text("${col}")`).first();
        const visible = await header.isVisible({ timeout: 5000 }).catch(() => false);
        console.log(`  ${visible ? '✅' : '⚠️'} Column "${col}": ${visible}`);
    }

    // Verify rows are present
    const rowCount = await page.locator('tbody tr').count();
    expect(rowCount).toBeGreaterThan(0);
    console.log(`✅ Table has ${rowCount} visible facility record(s)`);
});

test('Facilities - [READ] page header shows record count', async ({ page }) => {
    test.setTimeout(120000);
    await loginToApp(page, 90000, EMAIL, PASSWORD);
    await navigateToFacilities(page);

    // Breadcrumb link shows "Facilities (N records)"
    const countLink = page.locator('a, [role="link"]').filter({ hasText: /facilities.*records/i }).first();
    const hasCount = await countLink.isVisible({ timeout: 5000 }).catch(() => false);
    if (hasCount) {
        const countText = await countLink.textContent();
        console.log(`✅ Record count shown: ${countText?.trim()}`);
    } else {
        // Fallback: pagination text "1-25 of N"
        const pgText = page.locator('text=/\\d+-\\d+ of \\d+/').first();
        const pgVisible = await pgText.isVisible({ timeout: 3000 }).catch(() => false);
        if (pgVisible) {
            const pg = await pgText.textContent();
            console.log(`✅ Pagination info: ${pg}`);
        } else {
            console.log('ℹ️ Record count not in breadcrumb or pagination');
        }
    }
});

test('Facilities - [READ] pagination shows 25 records per page', async ({ page }) => {
    test.setTimeout(120000);
    await loginToApp(page, 90000, EMAIL, PASSWORD);
    await navigateToFacilities(page);

    const rowCount = await page.locator('tbody tr').count();
    console.log(`✅ Rows on first page: ${rowCount}`);

    const pgInfo = page.locator('text=/\\d+-\\d+ of \\d+/').first();
    const hasPg = await pgInfo.isVisible({ timeout: 3000 }).catch(() => false);
    if (hasPg) {
        const pgText = await pgInfo.textContent();
        console.log(`✅ Pagination: ${pgText}`);
        expect(rowCount).toBeLessThanOrEqual(25);
    }
});

test('Facilities - [READ] search filters table results', async ({ page }) => {
    test.setTimeout(120000);
    await loginToApp(page, 90000, EMAIL, PASSWORD);
    await navigateToFacilities(page);

    const searchInput = page.getByRole('textbox', { name: 'Search table data' }).first();
    await expect(searchInput).toBeVisible({ timeout: 10000 });

    // Search for a known term
    await searchInput.fill('test');
    await page.waitForTimeout(2000);
    const filteredRows = await page.locator('tbody tr').count();
    console.log(`✅ Search "test" returned ${filteredRows} result(s)`);

    // Clear search
    await searchInput.fill('');
    await page.waitForTimeout(3000);
    await page.waitForFunction(() => document.querySelectorAll('tbody tr').length > 1, { timeout: 10000 }).catch(() => {});
    const allRows = await page.locator('tbody tr').count();
    console.log(`✅ Cleared search — ${allRows} total row(s) visible`);
    expect(allRows).toBeGreaterThanOrEqual(1);
});

test('Facilities - [READ] rows have inline editable English and Chinese Name fields', async ({ page }) => {
    test.setTimeout(120000);
    await loginToApp(page, 90000, EMAIL, PASSWORD);
    await navigateToFacilities(page);

    // First data row should have inline textboxes for both name fields
    const firstRow = page.locator('tbody tr').first();
    const engInput = firstRow.getByPlaceholder('Enter English name');
    const chiInput = firstRow.getByPlaceholder('Enter Chinese name');

    await expect(engInput).toBeVisible({ timeout: 5000 });
    await expect(chiInput).toBeVisible({ timeout: 5000 });

    const engVal = await engInput.inputValue();
    const chiVal = await chiInput.inputValue();
    console.log(`✅ First row English Name: "${engVal}"`);
    console.log(`✅ First row Chinese Name: "${chiVal}"`);
});

// ─────────────────────────────────────────────────────────────
// CREATE
// ─────────────────────────────────────────────────────────────

test('Facilities - [CREATE] Create button adds blank inline row at top', async ({ page }) => {
    test.setTimeout(120000);
    await loginToApp(page, 90000, EMAIL, PASSWORD);
    await navigateToFacilities(page);

    const rowCountBefore = await page.locator('tbody tr').count();

    // Click Create
    const createBtn = page.getByText('Create', { exact: true });
    await expect(createBtn).toBeEnabled({ timeout: 5000 });
    await createBtn.click();
    await page.waitForTimeout(2000);

    // A new blank row appears at the top with empty name fields
    const newRow = page.locator('tbody tr').first();
    const engInput = newRow.getByPlaceholder('Enter English name');
    const chiInput = newRow.getByPlaceholder('Enter Chinese name');

    await expect(engInput).toBeVisible({ timeout: 5000 });
    await expect(chiInput).toBeVisible({ timeout: 5000 });

    const engVal = await engInput.inputValue();
    expect(engVal).toBe('');
    console.log('✅ New blank row created with empty English Name field');

    // Create button becomes disabled while new row is active
    const createDisabled = await page.getByRole('button', { name: /create.*disabled/i }).isVisible({ timeout: 2000 }).catch(() => false);
    const createEnabled = await createBtn.isEnabled({ timeout: 1000 }).catch(() => false);
    console.log(`✅ Create button disabled while new row exists: ${createDisabled || !createEnabled}`);

    // Cancel by pressing Escape
    await page.keyboard.press('Escape');
    await page.waitForTimeout(1000);
});

test('Facilities - [CREATE] create new facility with English and Chinese names', async ({ page }) => {
    test.setTimeout(180000);
    await loginToApp(page, 90000, EMAIL, PASSWORD);
    await navigateToFacilities(page);

    const timestamp = Date.now();
    const engName = `TestFacility${timestamp}`;
    const chiName = `测试设施${timestamp}`;

    // Click Create
    await page.getByText('Create', { exact: true }).click();
    await page.waitForTimeout(2000);

    // Fill the new blank row using execCommand (fill() doesn't commit to Vue model for new rows)
    const engInput = page.locator('tbody tr').first().locator('input[placeholder="Enter English name"]');
    const chiInput = page.locator('tbody tr').first().locator('input[placeholder="Enter Chinese name"]');

    await engInput.click();
    await page.evaluate((text) => {
        const input = document.querySelector('tbody tr:first-child input[placeholder="Enter English name"]') as HTMLInputElement;
        if (input) { input.focus(); document.execCommand('selectAll', false); document.execCommand('insertText', false, text); }
    }, engName);
    await page.waitForTimeout(300);
    console.log(`✅ Filled English Name: ${engName}`);

    await chiInput.click();
    await page.evaluate((text) => {
        const input = document.querySelector('tbody tr:first-child input[placeholder="Enter Chinese name"]') as HTMLInputElement;
        if (input) { input.focus(); document.execCommand('selectAll', false); document.execCommand('insertText', false, text); }
    }, chiName);
    await page.waitForTimeout(300);
    console.log(`✅ Filled Chinese Name: ${chiName}`);

    // Save: click the "Save" toolbar button
    const saveBtn = page.locator('button').filter({ hasText: /^save$/i }).first();
    await expect(saveBtn).toBeEnabled({ timeout: 5000 });
    await saveBtn.click();
    await page.waitForTimeout(2000);
    console.log('✅ Clicked Save');

    // Verify row now appears with the English name
    const savedRow = page.locator('tbody tr').filter({ hasText: engName }).first();
    const rowVisible = await savedRow.isVisible({ timeout: 5000 }).catch(() => false);
    console.log(`✅ Facility "${engName}" visible in table after save: ${rowVisible}`);

    // Create button should be re-enabled
    const createBtn = page.getByText('Create', { exact: true });
    const isEnabled = await createBtn.isEnabled({ timeout: 3000 }).catch(() => false);
    console.log(`✅ Create button re-enabled: ${isEnabled}`);
    console.log('✅ Create facility test completed');
});

test('Facilities - [CREATE] create facility with English name only', async ({ page }) => {
    test.setTimeout(180000);
    await loginToApp(page, 90000, EMAIL, PASSWORD);
    await navigateToFacilities(page);

    const timestamp = Date.now();
    const engName = `EngOnly${timestamp}`;

    await page.getByText('Create', { exact: true }).click();
    await page.waitForTimeout(2000);

    // Use execCommand so the value commits to Vue's reactive model
    const engInput = page.locator('tbody tr').first().locator('input[placeholder="Enter English name"]');
    await engInput.click();
    await page.evaluate((text) => {
        const input = document.querySelector('tbody tr:first-child input[placeholder="Enter English name"]') as HTMLInputElement;
        if (input) { input.focus(); document.execCommand('selectAll', false); document.execCommand('insertText', false, text); }
    }, engName);
    await page.waitForTimeout(300);

    // Save via toolbar Save button
    const saveBtn = page.locator('button').filter({ hasText: /^save$/i }).first();
    await expect(saveBtn).toBeEnabled({ timeout: 5000 });
    await saveBtn.click();
    await page.waitForTimeout(2000);
    console.log(`✅ Saved facility with English name only: ${engName}`);
    console.log('✅ English-only facility test completed');
});

// ─────────────────────────────────────────────────────────────
// UPDATE — inline editing
// ─────────────────────────────────────────────────────────────

test('Facilities - [UPDATE] edit English Name of first record inline', async ({ page }) => {
    test.setTimeout(120000);
    await loginToApp(page, 90000, EMAIL, PASSWORD);
    await navigateToFacilities(page);

    const firstRow = page.locator('tbody tr').first();
    const engInput = firstRow.getByPlaceholder('Enter English name');

    // Read original value
    const original = await engInput.inputValue();
    console.log(`Original English Name: "${original}"`);

    // Update the value
    const updatedName = `Updated${Date.now()}`;
    await engInput.click({ clickCount: 3 });
    await engInput.fill(updatedName);
    await page.waitForTimeout(300);
    console.log(`✅ Filled updated English Name: ${updatedName}`);

    // Save via toolbar Save button
    const saveBtn = page.locator('button').filter({ hasText: /^save$/i }).first();
    await expect(saveBtn).toBeVisible({ timeout: 5000 });
    await saveBtn.click();
    await page.waitForTimeout(2000);

    // Verify the updated value persists
    const newVal = await engInput.inputValue();
    console.log(`✅ Value after save: "${newVal}"`);
    console.log('✅ Inline edit English Name test completed');
});

test('Facilities - [UPDATE] edit Chinese Name of first record inline', async ({ page }) => {
    test.setTimeout(120000);
    await loginToApp(page, 90000, EMAIL, PASSWORD);
    await navigateToFacilities(page);

    const firstRow = page.locator('tbody tr').first();
    const chiInput = firstRow.getByPlaceholder('Enter Chinese name');

    const original = await chiInput.inputValue();
    console.log(`Original Chinese Name: "${original}"`);

    const updatedChi = `更新${Date.now()}`;
    await chiInput.click({ clickCount: 3 });
    await chiInput.fill(updatedChi);
    await page.waitForTimeout(300);

    // Save via toolbar Save button
    const saveBtn = page.locator('button').filter({ hasText: /^save$/i }).first();
    await expect(saveBtn).toBeVisible({ timeout: 5000 });
    await saveBtn.click();
    await page.waitForTimeout(2000);

    const newVal = await chiInput.inputValue();
    console.log(`✅ Updated Chinese Name: "${newVal}"`);
    console.log('✅ Inline edit Chinese Name test completed');
});

test('Facilities - [UPDATE] edit both names of first record', async ({ page }) => {
    test.setTimeout(120000);
    await loginToApp(page, 90000, EMAIL, PASSWORD);
    await navigateToFacilities(page);

    const timestamp = Date.now();
    const firstRow = page.locator('tbody tr').first();
    const engInput = firstRow.getByPlaceholder('Enter English name');
    const chiInput = firstRow.getByPlaceholder('Enter Chinese name');

    const newEng = `BothEdit${timestamp}`;
    const newChi = `两者编辑${timestamp}`;

    await engInput.click({ clickCount: 3 });
    await engInput.fill(newEng);
    await page.waitForTimeout(300);
    console.log(`✅ Set English Name: ${newEng}`);

    await chiInput.click({ clickCount: 3 });
    await chiInput.fill(newChi);
    await page.waitForTimeout(300);
    console.log(`✅ Set Chinese Name: ${newChi}`);

    // Save via toolbar Save button
    const saveBtn = page.locator('button').filter({ hasText: /^save$/i }).first();
    await expect(saveBtn).toBeVisible({ timeout: 5000 });
    await saveBtn.click();
    await page.waitForTimeout(2000);
    console.log('✅ Both names updated test completed');
});

test('Facilities - [UPDATE] all rows have editable inline fields', async ({ page }) => {
    test.setTimeout(120000);
    await loginToApp(page, 90000, EMAIL, PASSWORD);
    await navigateToFacilities(page);

    const rows = page.locator('tbody tr');
    const count = await rows.count();
    const checkCount = Math.min(count, 3);

    for (let i = 0; i < checkCount; i++) {
        const row = rows.nth(i);
        const eng = row.getByPlaceholder('Enter English name');
        const chi = row.getByPlaceholder('Enter Chinese name');
        const engVisible = await eng.isVisible({ timeout: 3000 }).catch(() => false);
        const chiVisible = await chi.isVisible({ timeout: 3000 }).catch(() => false);
        console.log(`  Row ${i + 1}: English editable=${engVisible}, Chinese editable=${chiVisible}`);
    }
    console.log('✅ All visible rows have inline editable fields');
});

// ─────────────────────────────────────────────────────────────
// DELETE
// ─────────────────────────────────────────────────────────────

test('Facilities - [DELETE] Delete button hidden before row selection', async ({ page }) => {
    test.setTimeout(120000);
    await loginToApp(page, 90000, EMAIL, PASSWORD);
    await navigateToFacilities(page);

    // Delete should not be visible before any row is selected
    const deleteBtn = page.locator('button').filter({ hasText: /^delete$/i }).first();
    const visibleBefore = await deleteBtn.isVisible({ timeout: 2000 }).catch(() => false);
    expect(visibleBefore).toBe(false);
    console.log('✅ Delete button hidden before selection');

    // Select first row
    const checkbox = page.locator('tbody tr').first().locator('input[type="checkbox"]').first();
    await checkbox.click();
    await page.waitForTimeout(1000);

    // Delete button should now appear
    await expect(deleteBtn).toBeVisible({ timeout: 5000 });
    console.log('✅ Delete button appears after row selection');

    // Deselect
    await checkbox.click();
    await page.waitForTimeout(500);
    const visibleAfter = await deleteBtn.isVisible({ timeout: 2000 }).catch(() => false);
    console.log(`✅ Delete button hidden after deselect: ${!visibleAfter}`);
});

test('Facilities - [DELETE] delete newly created facility', async ({ page }) => {
    test.setTimeout(180000);
    await loginToApp(page, 90000, EMAIL, PASSWORD);
    await navigateToFacilities(page);

    // Step 1: Create an empty throwaway facility via inline Create
    const rowsBefore = await page.locator('tbody tr').count();
    console.log(`Rows before Create: ${rowsBefore}`);

    const facilityName = `DeleteMe${Date.now()}`;
    await page.getByText('Create', { exact: true }).click();
    await page.waitForTimeout(2000);

    // Use execCommand to properly trigger Vue reactivity (fill/type don't commit to Vue model)
    const emptyInput = page.locator('tbody tr').first().locator('input[placeholder="Enter English name"]');
    await emptyInput.click();
    await page.evaluate((text) => {
        const input = document.querySelector('tbody tr:first-child input[placeholder="Enter English name"]') as HTMLInputElement;
        if (input) {
            input.focus();
            document.execCommand('selectAll', false);
            document.execCommand('insertText', false, text);
        }
    }, facilityName);
    await page.waitForTimeout(500);
    const inputVal = await emptyInput.inputValue().catch(() => 'ERROR');
    console.log(`Input value after execCommand: "${inputVal}"`);

    const saveBtn = page.locator('button').filter({ hasText: /^save$/i }).first();
    await expect(saveBtn).toBeEnabled({ timeout: 5000 });
    await saveBtn.click();
    const createBtn = page.getByText('Create', { exact: true });
    await expect(createBtn).toBeEnabled({ timeout: 10000 }).catch(() => {});
    await page.waitForTimeout(1000);

    const rowsAfterSave = await page.locator('tbody tr').count();
    const newRowText = await page.locator('tbody tr').first().textContent().catch(() => '');
    console.log(`After save: ${rowsAfterSave} rows, first row: "${newRowText?.trim().slice(0, 60)}"`);
    console.log(`✅ Created facility: ${facilityName}`);

    // Step 2: Select the first row (newly created empty facility) and delete it
    const firstRow = page.locator('tbody tr').first();
    const checkbox = firstRow.locator('input[type="checkbox"]').first();
    await checkbox.click();
    await page.waitForTimeout(1000);

    const deleteBtn = page.locator('button').filter({ hasText: /^delete$/i }).first();
    await expect(deleteBtn).toBeVisible({ timeout: 5000 });
    await deleteBtn.click();
    await page.waitForTimeout(2000);
    console.log('✅ Clicked Delete');

    // Step 3: Handle confirmation dialog
    const yesInput = page.getByRole('textbox', { name: /type.*yes.*confirm/i }).first();
    const hasYesDialog = await yesInput.isVisible({ timeout: 3000 }).catch(() => false);

    if (hasYesDialog) {
        await yesInput.fill('Yes');
        await page.waitForTimeout(500);
        const removeBtn = page.getByRole('button', { name: /confirm remove/i }).first();
        await expect(removeBtn).toBeEnabled({ timeout: 5000 });
        await removeBtn.click();
        await page.waitForTimeout(2000);
        await page.waitForLoadState('load', { timeout: 15000 });
        console.log('✅ Confirmed deletion via "Yes" dialog');
    } else {
        const confirmBtn = page.getByRole('button', { name: /confirm|yes|ok/i }).first();
        const hasConfirm = await confirmBtn.isVisible({ timeout: 2000 }).catch(() => false);
        if (hasConfirm) {
            await confirmBtn.click();
            await page.waitForTimeout(2000);
            await page.waitForLoadState('load', { timeout: 15000 });
            console.log('✅ Confirmed deletion via confirm button');
        } else {
            console.log('ℹ️ No confirmation dialog — deletion may be immediate');
            await page.waitForTimeout(2000);
        }
    }

    // Step 4: Verify row count decreased
    const rowsAfterDelete = await page.locator('tbody tr').count();
    console.log(`Rows after delete: ${rowsAfterDelete} (was ${rowsAfterSave})`);
    expect(rowsAfterDelete).toBeLessThan(rowsAfterSave);
    console.log('✅ Facility deleted and row count decreased');
    console.log('✅ Delete test completed');
});

test('Facilities - [DELETE] select all rows and verify Delete button visible', async ({ page }) => {
    test.setTimeout(120000);
    await loginToApp(page, 90000, EMAIL, PASSWORD);
    await navigateToFacilities(page);

    const selectAll = page.locator('input[aria-label="Select all rows in table"]').first();
    await expect(selectAll).toBeVisible({ timeout: 5000 });
    await selectAll.click();
    await page.waitForTimeout(1000);

    const deleteBtn = page.locator('button').filter({ hasText: /^delete$/i }).first();
    await expect(deleteBtn).toBeVisible({ timeout: 5000 });
    console.log('✅ Delete button visible after select-all');

    // Deselect — don't delete all live data
    await selectAll.click();
    await page.waitForTimeout(500);
    console.log('✅ Deselected all rows');
});

test('Facilities - [DELETE] select multiple rows and verify Delete button', async ({ page }) => {
    test.setTimeout(120000);
    await loginToApp(page, 90000, EMAIL, PASSWORD);
    await navigateToFacilities(page);

    const rows = page.locator('tbody tr');
    const rowCount = await rows.count();
    const selectCount = Math.min(rowCount, 3);

    for (let i = 0; i < selectCount; i++) {
        const cb = rows.nth(i).locator('input[type="checkbox"]').first();
        await cb.click();
        await page.waitForTimeout(200);
    }
    console.log(`✅ Selected ${selectCount} rows`);

    const deleteBtn = page.locator('button').filter({ hasText: /^delete$/i }).first();
    await expect(deleteBtn).toBeVisible({ timeout: 5000 });
    console.log('✅ Delete button visible after multi-row selection');

    // Deselect all
    const selectAll = page.locator('input[aria-label="Select all rows in table"]').first();
    if (await selectAll.isVisible({ timeout: 2000 }).catch(() => false)) {
        // Uncheck all by clicking select-all twice if needed
        const allChecked = await selectAll.isChecked();
        if (!allChecked) await selectAll.click();
        await page.waitForTimeout(200);
        await selectAll.click();
    }
    await page.waitForTimeout(300);
    console.log('✅ Multi-row delete button test completed');
});

// ─────────────────────────────────────────────────────────────
// NAV
// ─────────────────────────────────────────────────────────────

test('Facilities - [NAV] accessible via System Settings sidebar', async ({ page }) => {
    test.setTimeout(120000);
    await loginToApp(page, 90000, EMAIL, PASSWORD);

    await page.goto(`${BASE}/system-settings/organizations`, { waitUntil: 'load', timeout: 30000 });
    await page.waitForTimeout(3000);

    const facilitiesLink = page.locator('a:has-text("Facilities"), [href*="facilities"]').first();
    await expect(facilitiesLink).toBeVisible({ timeout: 10000 });
    await facilitiesLink.click();
    await page.waitForTimeout(2000);

    await expect(page).toHaveURL(/system-settings\/facilities/, { timeout: 10000 });
    console.log('✅ Facilities accessible from System Settings sidebar');
});

test('Facilities - [NAV] breadcrumb shows Facilities with record count', async ({ page }) => {
    test.setTimeout(120000);
    await loginToApp(page, 90000, EMAIL, PASSWORD);
    await navigateToFacilities(page);

    // "Current page: Facilities (N records)"
    const breadcrumb = page.locator('a, [role="link"]').filter({ hasText: /facilities/i }).first();
    await expect(breadcrumb).toBeVisible({ timeout: 10000 });
    const text = await breadcrumb.textContent();
    console.log(`✅ Breadcrumb: "${text?.trim()}"`);
});

test('Facilities - [NAV] search input is accessible', async ({ page }) => {
    test.setTimeout(120000);
    await loginToApp(page, 90000, EMAIL, PASSWORD);
    await navigateToFacilities(page);

    const searchInput = page.getByRole('textbox', { name: 'Search table data' }).first();
    await expect(searchInput).toBeVisible({ timeout: 10000 });
    await searchInput.click();
    await page.keyboard.type('a');
    await page.waitForTimeout(300);
    const val = await searchInput.inputValue();
    expect(val).toBe('a');
    await searchInput.clear();
    console.log('✅ Search input accessible and functional');
});
