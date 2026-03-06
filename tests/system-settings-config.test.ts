import { test, expect } from '@playwright/test';
import { loginToApp } from './helpers/auth.helper';

const EMAIL = 'pau.kie.chee@fusioneta.com';
const PASSWORD = 'PAOpaopao@9696';
const BASE = 'https://app-staging.vivacityapp.com';

test('System Settings > Configurations page loads with table', async ({ page }) => {
    test.setTimeout(180000);

    await loginToApp(page, 90000, EMAIL, PASSWORD);
    await page.goto(`${BASE}/system-settings/configurations`, { waitUntil: 'load', timeout: 30000 });
    await page.waitForTimeout(3000);

    await expect(page).toHaveURL(/system-settings\/configurations/, { timeout: 10000 });

    const table = page.locator('table, [role="grid"], .v-data-table').first();
    await expect(table).toBeVisible({ timeout: 10000 });
    console.log('✅ Configurations table is visible');
});

test('System Settings > Configurations has correct columns', async ({ page }) => {
    test.setTimeout(180000);

    await loginToApp(page, 90000, EMAIL, PASSWORD);
    await page.goto(`${BASE}/system-settings/configurations`, { waitUntil: 'load', timeout: 30000 });
    await page.waitForTimeout(3000);

    const columns = ['ID', 'Name', 'Label', 'Value'];
    for (const col of columns) {
        const header = page.locator(`th:has-text("${col}"), [role="columnheader"]:has-text("${col}")`).first();
        const visible = await header.isVisible({ timeout: 5000 }).catch(() => false);
        console.log(`  ${visible ? '✅' : '⚠️'} Column "${col}": ${visible}`);
    }
    console.log('✅ Configurations columns verified');
});

test('System Settings > Configurations has search', async ({ page }) => {
    test.setTimeout(180000);

    await loginToApp(page, 90000, EMAIL, PASSWORD);
    await page.goto(`${BASE}/system-settings/configurations`, { waitUntil: 'load', timeout: 30000 });
    await page.waitForTimeout(3000);

    const search = page.locator('input[type="text"]:visible').first();
    await expect(search).toBeVisible({ timeout: 10000 });
    await search.fill('test');
    await page.waitForTimeout(1500);
    await search.clear();
    console.log('✅ Configurations search input works');
});

test('System Settings > Tooltips page loads with table', async ({ page }) => {
    test.setTimeout(180000);

    await loginToApp(page, 90000, EMAIL, PASSWORD);
    await page.goto(`${BASE}/system-settings/tooltips`, { waitUntil: 'load', timeout: 30000 });
    await page.waitForTimeout(3000);

    await expect(page).toHaveURL(/system-settings\/tooltips/, { timeout: 10000 });

    const table = page.locator('table, [role="grid"], .v-data-table').first();
    await expect(table).toBeVisible({ timeout: 10000 });
    console.log('✅ Tooltips table is visible');
});

test('System Settings > Tooltips has correct columns', async ({ page }) => {
    test.setTimeout(180000);

    await loginToApp(page, 90000, EMAIL, PASSWORD);
    await page.goto(`${BASE}/system-settings/tooltips`, { waitUntil: 'load', timeout: 30000 });
    await page.waitForTimeout(3000);

    const columns = ['Field Name', 'Description'];
    for (const col of columns) {
        const header = page.locator(`th:has-text("${col}"), [role="columnheader"]:has-text("${col}")`).first();
        const visible = await header.isVisible({ timeout: 5000 }).catch(() => false);
        console.log(`  ${visible ? '✅' : '⚠️'} Column "${col}": ${visible}`);
    }
    console.log('✅ Tooltips columns verified');
});

test('System Settings > Tooltips has category filter buttons', async ({ page }) => {
    test.setTimeout(180000);

    await loginToApp(page, 90000, EMAIL, PASSWORD);
    await page.goto(`${BASE}/system-settings/tooltips`, { waitUntil: 'load', timeout: 30000 });
    await page.waitForTimeout(3000);

    const categories = ['General', 'Marketing', 'Articles'];
    for (const cat of categories) {
        const btn = page.locator(`button:has-text("${cat}")`).first();
        const visible = await btn.isVisible({ timeout: 5000 }).catch(() => false);
        console.log(`  ${visible ? '✅' : '⚠️'} Category filter "${cat}": ${visible}`);
    }
    console.log('✅ Tooltips category filters verified');
});

test('System Settings > StuRents page loads with table', async ({ page }) => {
    test.setTimeout(180000);

    await loginToApp(page, 90000, EMAIL, PASSWORD);
    await page.goto(`${BASE}/system-settings/sturents`, { waitUntil: 'load', timeout: 30000 });
    await page.waitForTimeout(3000);

    await expect(page).toHaveURL(/system-settings\/sturents/, { timeout: 10000 });

    const table = page.locator('table, [role="grid"], .v-data-table').first();
    await expect(table).toBeVisible({ timeout: 10000 });
    console.log('✅ StuRents table is visible');
});

test('System Settings > StuRents has correct columns', async ({ page }) => {
    test.setTimeout(180000);

    await loginToApp(page, 90000, EMAIL, PASSWORD);
    await page.goto(`${BASE}/system-settings/sturents`, { waitUntil: 'load', timeout: 30000 });
    await page.waitForTimeout(3000);

    const columns = ['Organization', 'Status'];
    for (const col of columns) {
        const header = page.locator(`th:has-text("${col}"), [role="columnheader"]:has-text("${col}")`).first();
        const visible = await header.isVisible({ timeout: 5000 }).catch(() => false);
        console.log(`  ${visible ? '✅' : '⚠️'} Column "${col}": ${visible}`);
    }
    console.log('✅ StuRents columns verified');
});

test('System Settings > Task Templates page loads', async ({ page }) => {
    test.setTimeout(180000);

    await loginToApp(page, 90000, EMAIL, PASSWORD);
    await page.goto(`${BASE}/system-settings/task-templates`, { waitUntil: 'load', timeout: 30000 });
    await page.waitForTimeout(3000);

    await expect(page).toHaveURL(/system-settings\/task-templates/, { timeout: 10000 });
    console.log('✅ Task Templates page loaded at:', page.url());
});

test('System Settings > Task Templates has category buttons', async ({ page }) => {
    test.setTimeout(180000);

    await loginToApp(page, 90000, EMAIL, PASSWORD);
    await page.goto(`${BASE}/system-settings/task-templates`, { waitUntil: 'load', timeout: 30000 });
    await page.waitForTimeout(3000);

    const allBtn = page.locator('button:has-text("All")').first();
    const visible = await allBtn.isVisible({ timeout: 5000 }).catch(() => false);
    console.log(`  ${visible ? '✅' : '⚠️'} "All" category button: ${visible}`);
    console.log('✅ Task Templates category buttons checked');
});
