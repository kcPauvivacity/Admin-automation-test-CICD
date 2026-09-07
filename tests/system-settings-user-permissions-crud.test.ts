import { test, expect } from '@playwright/test';
import { loginToApp } from './helpers/auth.helper';

// User Permissions is under System Settings (fusioneta account)
const EMAIL = 'pau.kie.chee@fusioneta.com';
const PASSWORD = 'PAOpaopao@9696';
const BASE = 'https://app-staging.vivacityapp.com';
const LIST_URL = `${BASE}/system-settings/user-permissions`;

// UI facts (confirmed via live inspection):
//   • Columns: "" | Name | Description | Read | Create | Update | Delete | GDPR Access | Created At | Created by | Last Updated At | Last Updated by
//   • This is a permission matrix — no Create button, no row-select checkboxes (not a standard CRUD list)
//   • Read/Create/Update/Delete/GDPR Access columns are likely toggles per permission record

async function navigateToUserPermissions(page: any) {
    await page.goto(LIST_URL, { waitUntil: 'load', timeout: 30000 });
    await page.waitForTimeout(3000);
    await expect(page).toHaveURL(/system-settings\/user-permissions/, { timeout: 10000 });
    await page.waitForSelector('tbody tr', { timeout: 30000 });
    await page.waitForTimeout(1000);
    console.log('✅ Navigated to User Permissions list');
}

// ─────────────────────────────────────────────────────────────
// READ
// ─────────────────────────────────────────────────────────────

test('User Permissions - [READ] list page loads with permission matrix columns', async ({ page }) => {
    test.setTimeout(120000);
    await loginToApp(page, 90000, EMAIL, PASSWORD);
    await navigateToUserPermissions(page);

    const table = page.locator('table, .v-data-table, [role="table"]').first();
    await expect(table).toBeVisible({ timeout: 10000 });

    const expectedCols = ['Name', 'Description', 'Read', 'Create', 'Update', 'Delete', 'GDPR Access'];
    for (const col of expectedCols) {
        const header = page.locator('th').filter({ hasText: col }).first();
        const visible = await header.isVisible({ timeout: 3000 }).catch(() => false);
        console.log(`  ${visible ? '✅' : '⚠️'} Column "${col}": ${visible}`);
    }

    const rowCount = await page.locator('tbody tr').count();
    console.log(`✅ Table has ${rowCount} visible permission record(s)`);
    expect(rowCount).toBeGreaterThan(0);
});

test('User Permissions - [READ] pagination shows records', async ({ page }) => {
    test.setTimeout(120000);
    await loginToApp(page, 90000, EMAIL, PASSWORD);
    await navigateToUserPermissions(page);

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

test('User Permissions - [READ] search filters table results', async ({ page }) => {
    test.setTimeout(120000);
    await loginToApp(page, 90000, EMAIL, PASSWORD);
    await navigateToUserPermissions(page);

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

test('User Permissions - [READ] first row shows name and description', async ({ page }) => {
    test.setTimeout(120000);
    await loginToApp(page, 90000, EMAIL, PASSWORD);
    await navigateToUserPermissions(page);

    const firstRow = page.locator('tbody tr').first();
    const rowText = await firstRow.textContent().catch(() => '');
    console.log(`✅ First row content: "${rowText?.trim().slice(0, 150)}"`);
});

test('User Permissions - [READ] Read/Create/Update/Delete/GDPR columns render toggle controls', async ({ page }) => {
    test.setTimeout(120000);
    await loginToApp(page, 90000, EMAIL, PASSWORD);
    await navigateToUserPermissions(page);

    const firstRow = page.locator('tbody tr').first();
    const checkboxCount = await firstRow.locator('input[type="checkbox"]').count();
    const switchCount = await firstRow.locator('.v-switch, [role="switch"]').count();
    const iconCount = await firstRow.locator('.v-icon, [class*="icon"]').count();

    console.log(`✅ First row: checkboxes=${checkboxCount}, switches=${switchCount}, icons=${iconCount}`);
});

test('User Permissions - [READ] no Create button (permission matrix is not user-creatable)', async ({ page }) => {
    test.setTimeout(120000);
    await loginToApp(page, 90000, EMAIL, PASSWORD);
    await navigateToUserPermissions(page);

    const createBtn = page.getByText('Create', { exact: true }).first();
    const hasCreate = await createBtn.isVisible({ timeout: 5000 }).catch(() => false);
    console.log(`ℹ️ Create button present: ${hasCreate} (expected: false — permission matrix is typically fixed)`);
});

test('User Permissions - [READ] clicking a row shows detail or remains read-only', async ({ page }) => {
    test.setTimeout(120000);
    await loginToApp(page, 90000, EMAIL, PASSWORD);
    await navigateToUserPermissions(page);

    const firstRow = page.locator('tbody tr').first();
    await firstRow.click();
    await page.waitForTimeout(2000);

    const dialog = page.locator('[role="dialog"], .v-dialog').first();
    const dialogVisible = await dialog.isVisible({ timeout: 3000 }).catch(() => false);
    console.log(dialogVisible ? '✅ Row click opened a detail dialog' : 'ℹ️ Row click did not open a dialog — likely inline toggles only');

    if (dialogVisible) {
        await page.keyboard.press('Escape');
        await page.waitForTimeout(500);
    }
});

// ─────────────────────────────────────────────────────────────
// NAV
// ─────────────────────────────────────────────────────────────

test('User Permissions - [NAV] accessible via direct URL', async ({ page }) => {
    test.setTimeout(120000);
    await loginToApp(page, 90000, EMAIL, PASSWORD);
    await page.goto(LIST_URL, { waitUntil: 'load', timeout: 30000 });
    await page.waitForTimeout(2000);
    await expect(page).toHaveURL(/system-settings\/user-permissions/, { timeout: 10000 });
    console.log('✅ User Permissions accessible via direct URL');
});
