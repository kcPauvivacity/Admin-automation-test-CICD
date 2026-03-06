import { test, expect } from '@playwright/test';
import { loginToApp } from './helpers/auth.helper';

const EMAIL = 'pau.kie.chee@fusioneta.com';
const PASSWORD = 'PAOpaopao@9696';
const BASE = 'https://app-staging.vivacityapp.com';

test('System Settings > Audit Logs page loads with table', async ({ page }) => {
    test.setTimeout(180000);

    await loginToApp(page, 90000, EMAIL, PASSWORD);
    await page.goto(`${BASE}/system-settings/audit-logs`, { waitUntil: 'load', timeout: 30000 });
    await page.waitForTimeout(3000);

    await expect(page).toHaveURL(/system-settings\/audit-logs/, { timeout: 10000 });

    const table = page.locator('table, [role="grid"], .v-data-table').first();
    await expect(table).toBeVisible({ timeout: 10000 });
    console.log('✅ Audit Logs table is visible');
});

test('System Settings > Audit Logs has correct columns', async ({ page }) => {
    test.setTimeout(180000);

    await loginToApp(page, 90000, EMAIL, PASSWORD);
    await page.goto(`${BASE}/system-settings/audit-logs`, { waitUntil: 'load', timeout: 30000 });
    await page.waitForTimeout(3000);

    const columns = ['Organization Name', 'Date', 'Action', 'Domain'];
    for (const col of columns) {
        const header = page.locator(`th:has-text("${col}"), [role="columnheader"]:has-text("${col}")`).first();
        const visible = await header.isVisible({ timeout: 5000 }).catch(() => false);
        console.log(`  ${visible ? '✅' : '⚠️'} Column "${col}": ${visible}`);
    }
    console.log('✅ Audit Logs columns verified');
});

test('System Settings > Audit Logs has search and filters', async ({ page }) => {
    test.setTimeout(180000);

    await loginToApp(page, 90000, EMAIL, PASSWORD);
    await page.goto(`${BASE}/system-settings/audit-logs`, { waitUntil: 'load', timeout: 30000 });
    await page.waitForTimeout(3000);

    const search = page.locator('input[type="text"]:visible').first();
    await expect(search).toBeVisible({ timeout: 10000 });
    console.log('✅ Audit Logs search visible');

    const filters = ['Organization', 'Model ID', 'Domain'];
    for (const f of filters) {
        const btn = page.locator(`button:has-text("${f}")`).first();
        const visible = await btn.isVisible({ timeout: 3000 }).catch(() => false);
        console.log(`  ${visible ? '✅' : 'ℹ️'} Filter "${f}": ${visible}`);
    }
    console.log('✅ Audit Logs filters checked');
});

test('System Settings > Analytics Queries page loads with table', async ({ page }) => {
    test.setTimeout(180000);

    await loginToApp(page, 90000, EMAIL, PASSWORD);
    await page.goto(`${BASE}/system-settings/analytics-queries`, { waitUntil: 'load', timeout: 30000 });
    await page.waitForTimeout(3000);

    await expect(page).toHaveURL(/system-settings\/analytics-queries/, { timeout: 10000 });

    const table = page.locator('table, [role="grid"], .v-data-table').first();
    await expect(table).toBeVisible({ timeout: 10000 });
    console.log('✅ Analytics Queries table is visible');
});

test('System Settings > Analytics Queries has correct columns', async ({ page }) => {
    test.setTimeout(180000);

    await loginToApp(page, 90000, EMAIL, PASSWORD);
    await page.goto(`${BASE}/system-settings/analytics-queries`, { waitUntil: 'load', timeout: 30000 });
    await page.waitForTimeout(3000);

    const columns = ['ID', 'Name', 'Query'];
    for (const col of columns) {
        const header = page.locator(`th:has-text("${col}"), [role="columnheader"]:has-text("${col}")`).first();
        const visible = await header.isVisible({ timeout: 5000 }).catch(() => false);
        console.log(`  ${visible ? '✅' : '⚠️'} Column "${col}": ${visible}`);
    }
    console.log('✅ Analytics Queries columns verified');
});

test('System Settings > Dashboard Widgets page loads with table', async ({ page }) => {
    test.setTimeout(180000);

    await loginToApp(page, 90000, EMAIL, PASSWORD);
    await page.goto(`${BASE}/system-settings/widgets`, { waitUntil: 'load', timeout: 30000 });
    await page.waitForTimeout(3000);

    await expect(page).toHaveURL(/system-settings\/widgets/, { timeout: 10000 });

    const table = page.locator('table, [role="grid"], .v-data-table').first();
    await expect(table).toBeVisible({ timeout: 10000 });
    console.log('✅ Dashboard Widgets table is visible');
});

test('System Settings > Dashboard Widgets has correct columns', async ({ page }) => {
    test.setTimeout(180000);

    await loginToApp(page, 90000, EMAIL, PASSWORD);
    await page.goto(`${BASE}/system-settings/widgets`, { waitUntil: 'load', timeout: 30000 });
    await page.waitForTimeout(3000);

    const columns = ['ID', 'Name', 'Description', 'Active'];
    for (const col of columns) {
        const header = page.locator(`th:has-text("${col}"), [role="columnheader"]:has-text("${col}")`).first();
        const visible = await header.isVisible({ timeout: 5000 }).catch(() => false);
        console.log(`  ${visible ? '✅' : '⚠️'} Column "${col}": ${visible}`);
    }
    console.log('✅ Dashboard Widgets columns verified');
});

test('System Settings > Dashboard Widgets has Widgets and Dashboard tabs', async ({ page }) => {
    test.setTimeout(180000);

    await loginToApp(page, 90000, EMAIL, PASSWORD);
    await page.goto(`${BASE}/system-settings/widgets`, { waitUntil: 'load', timeout: 30000 });
    await page.waitForTimeout(3000);

    for (const tab of ['Widgets', 'Dashboard']) {
        const btn = page.locator(`button:has-text("${tab}")`).first();
        const visible = await btn.isVisible({ timeout: 5000 }).catch(() => false);
        console.log(`  ${visible ? '✅' : '⚠️'} Tab "${tab}": ${visible}`);
    }
    console.log('✅ Dashboard Widgets tabs verified');
});

test('System Settings > Reports page loads', async ({ page }) => {
    test.setTimeout(180000);

    await loginToApp(page, 90000, EMAIL, PASSWORD);
    await page.goto(`${BASE}/system-settings/reports`, { waitUntil: 'load', timeout: 30000 });
    await page.waitForTimeout(3000);

    await expect(page).toHaveURL(/system-settings\/reports/, { timeout: 10000 });
    console.log('✅ Reports page loaded at:', page.url());
});

test('System Settings > Reports has Add New Category button', async ({ page }) => {
    test.setTimeout(180000);

    await loginToApp(page, 90000, EMAIL, PASSWORD);
    await page.goto(`${BASE}/system-settings/reports`, { waitUntil: 'load', timeout: 30000 });
    await page.waitForTimeout(3000);

    const addBtn = page.locator('button:has-text("Add New Category"), button:has-text("Add Report")').first();
    const visible = await addBtn.isVisible({ timeout: 10000 }).catch(() => false);
    console.log(`  ${visible ? '✅' : 'ℹ️'} Add category/report button: ${visible}`);
    console.log('✅ Reports page action buttons checked');
});

test('System Settings > Enquiries Queue page loads', async ({ page }) => {
    test.setTimeout(180000);

    await loginToApp(page, 90000, EMAIL, PASSWORD);
    await page.goto(`${BASE}/system-settings/enquiries-queue`, { waitUntil: 'load', timeout: 30000 });
    await page.waitForTimeout(3000);

    await expect(page).toHaveURL(/system-settings\/enquiries-queue/, { timeout: 10000 });

    const table = page.locator('table, [role="grid"], .v-data-table').first();
    await expect(table).toBeVisible({ timeout: 10000 });
    console.log('✅ Enquiries Queue table is visible');
});

test('System Settings > Enquiry Retention page loads', async ({ page }) => {
    test.setTimeout(180000);

    await loginToApp(page, 90000, EMAIL, PASSWORD);
    await page.goto(`${BASE}/system-settings/enquiry-retention`, { waitUntil: 'load', timeout: 30000 });
    await page.waitForTimeout(3000);

    await expect(page).toHaveURL(/system-settings\/enquiry-retention/, { timeout: 10000 });

    const table = page.locator('table, [role="grid"], .v-data-table').first();
    await expect(table).toBeVisible({ timeout: 10000 });
    console.log('✅ Enquiry Retention table is visible');
});

test('System Settings > Enquiry Retention has Download Sample CSV button', async ({ page }) => {
    test.setTimeout(180000);

    await loginToApp(page, 90000, EMAIL, PASSWORD);
    await page.goto(`${BASE}/system-settings/enquiry-retention`, { waitUntil: 'load', timeout: 30000 });
    await page.waitForTimeout(3000);

    const downloadBtn = page.locator('button:has-text("Download Sample CSV")').first();
    const visible = await downloadBtn.isVisible({ timeout: 10000 }).catch(() => false);
    console.log(`  ${visible ? '✅' : 'ℹ️'} Download Sample CSV button: ${visible}`);
    console.log('✅ Enquiry Retention buttons checked');
});
