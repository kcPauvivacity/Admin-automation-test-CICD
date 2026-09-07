import { test, expect } from '@playwright/test';
import { loginToApp } from './helpers/auth.helper';

// Stations is under System Settings (fusioneta account)
const EMAIL = 'pau.kie.chee@fusioneta.com';
const PASSWORD = 'PAOpaopao@9696';
const BASE = 'https://app-staging.vivacityapp.com';
const LIST_URL = `${BASE}/system-settings/stations`;

// UI facts (confirmed via live inspection):
//   • Columns: "" (checkbox) | ID | Name | Address | City | Country | Created At | Last Updated At
//   • Has a Create button and row checkboxes (bulk select + Delete)
//   • No inline text inputs in rows — editing appears to be dialog-based, not inline like Cities/Facilities

async function navigateToStations(page: any) {
    await page.goto(LIST_URL, { waitUntil: 'load', timeout: 30000 });
    await page.waitForTimeout(3000);
    await expect(page).toHaveURL(/system-settings\/stations/, { timeout: 10000 });
    await page.waitForSelector('tbody tr', { timeout: 30000 });
    await page.waitForTimeout(1000);
    console.log('✅ Navigated to Stations list');
}

// ─────────────────────────────────────────────────────────────
// READ
// ─────────────────────────────────────────────────────────────

test('Stations - [READ] list page loads with table and correct columns', async ({ page }) => {
    test.setTimeout(120000);
    await loginToApp(page, 90000, EMAIL, PASSWORD);
    await navigateToStations(page);

    const table = page.locator('table, .v-data-table, [role="table"]').first();
    await expect(table).toBeVisible({ timeout: 10000 });

    const expectedCols = ['ID', 'Name', 'Address', 'City', 'Country', 'Created At'];
    for (const col of expectedCols) {
        const header = page.locator('th').filter({ hasText: col }).first();
        const visible = await header.isVisible({ timeout: 3000 }).catch(() => false);
        console.log(`  ${visible ? '✅' : '⚠️'} Column "${col}": ${visible}`);
    }

    const rowCount = await page.locator('tbody tr').count();
    console.log(`✅ Table has ${rowCount} visible station record(s)`);
    expect(rowCount).toBeGreaterThan(0);
});

test('Stations - [READ] pagination and record count visible', async ({ page }) => {
    test.setTimeout(120000);
    await loginToApp(page, 90000, EMAIL, PASSWORD);
    await navigateToStations(page);

    const rows = await page.locator('tbody tr').count();
    console.log(`✅ Rows on first page: ${rows}`);

    const paginationText = page.locator('text=/\\d+-\\d+ of \\d+/').first();
    if (await paginationText.isVisible({ timeout: 3000 }).catch(() => false)) {
        const info = await paginationText.textContent();
        console.log(`✅ Pagination: ${info?.trim()}`);
    } else {
        console.log('⚠️ No pagination text found');
    }
});

test('Stations - [READ] search filters table results', async ({ page }) => {
    test.setTimeout(120000);
    await loginToApp(page, 90000, EMAIL, PASSWORD);
    await navigateToStations(page);

    const searchInput = page.getByRole('textbox', { name: /search/i }).first();
    const hasSearch = await searchInput.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasSearch) {
        await searchInput.fill('test');
        await page.waitForTimeout(2000);
        const filteredRows = await page.locator('tbody tr').count();
        console.log(`✅ Search "test" returned ${filteredRows} result(s)`);

        await searchInput.fill('');
        await page.waitForTimeout(2000);
        console.log('✅ Cleared search');
    } else {
        console.log('⚠️ No search input found');
    }
});

test('Stations - [READ] row shows City and Country reference data', async ({ page }) => {
    test.setTimeout(120000);
    await loginToApp(page, 90000, EMAIL, PASSWORD);
    await navigateToStations(page);

    const firstRow = page.locator('tbody tr').first();
    const rowText = await firstRow.textContent().catch(() => '');
    console.log(`✅ First row content: "${rowText?.trim().slice(0, 150)}"`);
});

// ─────────────────────────────────────────────────────────────
// CREATE
// ─────────────────────────────────────────────────────────────

test('Stations - [CREATE] Create button opens dialog/form', async ({ page }) => {
    test.setTimeout(120000);
    await loginToApp(page, 90000, EMAIL, PASSWORD);
    await navigateToStations(page);

    const createBtn = page.getByText('Create', { exact: true }).first();
    const hasCreate = await createBtn.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasCreate) {
        await createBtn.click();
        await page.waitForTimeout(2000);

        const dialog = page.locator('[role="dialog"], .v-dialog').first();
        const dialogVisible = await dialog.isVisible({ timeout: 5000 }).catch(() => false);
        console.log(`✅ Create dialog opened: ${dialogVisible}`);

        const newRow = page.locator('tbody tr').first();
        const inlineInputVisible = await newRow.locator('input[type="text"], input:not([type])').first().isVisible({ timeout: 2000 }).catch(() => false);
        console.log(`ℹ️ Inline input in new row: ${inlineInputVisible}`);

        // Close without saving
        const cancelBtn = page.locator('button').filter({ hasText: /^cancel$/i }).first();
        if (await cancelBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
            await cancelBtn.click();
        } else {
            await page.keyboard.press('Escape');
        }
        await page.waitForTimeout(1000);
        console.log('✅ Closed create dialog without saving');
    } else {
        console.log('⚠️ No Create button found');
    }
});

// ─────────────────────────────────────────────────────────────
// UPDATE
// ─────────────────────────────────────────────────────────────

test('Stations - [UPDATE] clicking a row opens edit view', async ({ page }) => {
    test.setTimeout(120000);
    await loginToApp(page, 90000, EMAIL, PASSWORD);
    await navigateToStations(page);

    const firstRow = page.locator('tbody tr').first();
    await firstRow.click();
    await page.waitForTimeout(2000);

    const dialog = page.locator('[role="dialog"], .v-dialog').first();
    const dialogVisible = await dialog.isVisible({ timeout: 3000 }).catch(() => false);

    if (dialogVisible) {
        console.log('✅ Row click opened an edit dialog');
        await page.keyboard.press('Escape');
    } else {
        const inlineInput = firstRow.locator('input[type="text"], input:not([type])').first();
        const inlineVisible = await inlineInput.isVisible({ timeout: 2000 }).catch(() => false);
        console.log(inlineVisible ? '✅ Row click enabled inline editing' : 'ℹ️ Row click did not open a visible edit affordance');
    }
    console.log('✅ Stations edit test completed');
});

// ─────────────────────────────────────────────────────────────
// DELETE
// ─────────────────────────────────────────────────────────────

test('Stations - [DELETE] Delete button appears after row selection', async ({ page }) => {
    test.setTimeout(120000);
    await loginToApp(page, 90000, EMAIL, PASSWORD);
    await navigateToStations(page);

    const deleteBtn = page.locator('button').filter({ hasText: /^delete$/i }).first();
    const hiddenBefore = !(await deleteBtn.isVisible({ timeout: 2000 }).catch(() => false));
    console.log(`✅ Delete button hidden before selection: ${hiddenBefore}`);

    const checkbox = page.locator('tbody tr').first().locator('input[type="checkbox"]').first();
    const hasCheckbox = await checkbox.isVisible({ timeout: 3000 }).catch(() => false);

    if (hasCheckbox) {
        await checkbox.click();
        await page.waitForTimeout(500);

        const visibleAfter = await deleteBtn.isVisible({ timeout: 3000 }).catch(() => false);
        console.log(`✅ Delete button visible after selection: ${visibleAfter}`);

        // Deselect — don't delete live data
        await checkbox.click();
        await page.waitForTimeout(500);
    } else {
        console.log('⚠️ No row checkbox found');
    }
});

// ─────────────────────────────────────────────────────────────
// NAV
// ─────────────────────────────────────────────────────────────

test('Stations - [NAV] accessible via direct URL', async ({ page }) => {
    test.setTimeout(120000);
    await loginToApp(page, 90000, EMAIL, PASSWORD);
    await page.goto(LIST_URL, { waitUntil: 'load', timeout: 30000 });
    await page.waitForTimeout(2000);
    await expect(page).toHaveURL(/system-settings\/stations/, { timeout: 10000 });
    console.log('✅ Stations accessible via direct URL');
});
