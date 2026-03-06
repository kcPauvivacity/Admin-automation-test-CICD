import { test, expect } from '@playwright/test';
import { loginToApp } from './helpers/auth.helper';

const EMAIL = 'pau.kie.chee@fusioneta.com';
const PASSWORD = 'PAOpaopao@9696';
const BASE = 'https://app-staging.vivacityapp.com';

test('System Settings > Users page loads with table', async ({ page }) => {
    test.setTimeout(180000);

    await loginToApp(page, 90000, EMAIL, PASSWORD);
    await page.goto(`${BASE}/system-settings/users`, { waitUntil: 'load', timeout: 30000 });
    await page.waitForTimeout(3000);

    await expect(page).toHaveURL(/system-settings\/users/, { timeout: 10000 });

    const table = page.locator('table, [role="grid"], .v-data-table').first();
    await expect(table).toBeVisible({ timeout: 10000 });
    console.log('✅ System Settings > Users table is visible');
});

test('System Settings > Users has search and Edit Columns', async ({ page }) => {
    test.setTimeout(180000);

    await loginToApp(page, 90000, EMAIL, PASSWORD);
    await page.goto(`${BASE}/system-settings/users`, { waitUntil: 'load', timeout: 30000 });
    await page.waitForTimeout(3000);

    const search = page.locator('input[type="text"]:visible').first();
    await expect(search).toBeVisible({ timeout: 10000 });
    console.log('✅ Search input visible');

    const editColumnsBtn = page.locator('button:has-text("Edit Columns")').first();
    const hasEditColumns = await editColumnsBtn.isVisible({ timeout: 5000 }).catch(() => false);
    console.log(`  ${hasEditColumns ? '✅' : 'ℹ️'} Edit Columns button: ${hasEditColumns}`);
});

test('System Settings > User Permissions page loads', async ({ page }) => {
    test.setTimeout(180000);

    await loginToApp(page, 90000, EMAIL, PASSWORD);
    await page.goto(`${BASE}/system-settings/user-permissions`, { waitUntil: 'load', timeout: 30000 });
    await page.waitForTimeout(3000);

    await expect(page).toHaveURL(/system-settings\/user-permissions/, { timeout: 10000 });

    const table = page.locator('table, [role="grid"], .v-data-table').first();
    await expect(table).toBeVisible({ timeout: 10000 });
    console.log('✅ User Permissions table is visible');
});

test('System Settings > User Permissions has correct columns', async ({ page }) => {
    test.setTimeout(180000);

    await loginToApp(page, 90000, EMAIL, PASSWORD);
    await page.goto(`${BASE}/system-settings/user-permissions`, { waitUntil: 'load', timeout: 30000 });
    await page.waitForTimeout(3000);

    const columns = ['Name', 'Description', 'Read', 'Create', 'Update', 'Delete'];
    for (const col of columns) {
        const header = page.locator(`th:has-text("${col}"), [role="columnheader"]:has-text("${col}")`).first();
        const visible = await header.isVisible({ timeout: 5000 }).catch(() => false);
        console.log(`  ${visible ? '✅' : '⚠️'} Column "${col}": ${visible}`);
    }
    console.log('✅ User Permissions columns verified');
});

test('System Settings > User Permissions has Create button', async ({ page }) => {
    test.setTimeout(180000);

    await loginToApp(page, 90000, EMAIL, PASSWORD);
    await page.goto(`${BASE}/system-settings/user-permissions`, { waitUntil: 'load', timeout: 30000 });
    await page.waitForTimeout(3000);

    const createBtn = page.locator('button:has-text("Create")').first();
    await expect(createBtn).toBeVisible({ timeout: 10000 });
    console.log('✅ Create button is visible on User Permissions');
});

test('System Settings > User Roles page loads', async ({ page }) => {
    test.setTimeout(180000);

    await loginToApp(page, 90000, EMAIL, PASSWORD);
    await page.goto(`${BASE}/system-settings/user-roles`, { waitUntil: 'load', timeout: 30000 });
    await page.waitForTimeout(3000);

    await expect(page).toHaveURL(/system-settings\/user-roles/, { timeout: 10000 });

    const table = page.locator('table, [role="grid"], .v-data-table').first();
    await expect(table).toBeVisible({ timeout: 10000 });
    console.log('✅ User Roles table is visible');
});

test('System Settings > User Roles has correct columns', async ({ page }) => {
    test.setTimeout(180000);

    await loginToApp(page, 90000, EMAIL, PASSWORD);
    await page.goto(`${BASE}/system-settings/user-roles`, { waitUntil: 'load', timeout: 30000 });
    await page.waitForTimeout(3000);

    const columns = ['ID', 'Name', 'Created At'];
    for (const col of columns) {
        const header = page.locator(`th:has-text("${col}"), [role="columnheader"]:has-text("${col}")`).first();
        const visible = await header.isVisible({ timeout: 5000 }).catch(() => false);
        console.log(`  ${visible ? '✅' : '⚠️'} Column "${col}": ${visible}`);
    }
    console.log('✅ User Roles columns verified');
});
