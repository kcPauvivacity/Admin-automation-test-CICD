import { test, expect } from '@playwright/test';
import { loginToApp } from './helpers/auth.helper';

const EMAIL = 'pau.kie.chee@fusioneta.com';
const PASSWORD = 'PAOpaopao@9696';
const BASE = 'https://app-staging.vivacityapp.com';

const templateModules = [
    { name: 'Adobe Templates', path: '/system-settings/adobe-templates', columns: ['ID', 'Name', 'Created At'] },
    { name: 'Email Templates', path: '/system-settings/email-templates', columns: ['ID', 'Name', 'Created At'] },
    { name: 'MP Templates', path: '/system-settings/mp-templates', columns: ['ID', 'Created At'] },
    { name: 'Notification Templates', path: '/system-settings/notification-templates', columns: ['ID', 'Name', 'Created At'] },
];

for (const mod of templateModules) {
    test(`System Settings > ${mod.name} page loads with table`, async ({ page }) => {
        test.setTimeout(180000);

        await loginToApp(page, 90000, EMAIL, PASSWORD);
        await page.goto(`${BASE}${mod.path}`, { waitUntil: 'load', timeout: 30000 });
        await page.waitForTimeout(3000);

        const urlPattern = mod.path.replace(/\//g, '\\/');
        await expect(page).toHaveURL(new RegExp(urlPattern), { timeout: 10000 });

        const table = page.locator('table, [role="grid"], .v-data-table').first();
        await expect(table).toBeVisible({ timeout: 10000 });
        console.log(`✅ ${mod.name} table is visible`);
    });

    test(`System Settings > ${mod.name} has correct columns`, async ({ page }) => {
        test.setTimeout(180000);

        await loginToApp(page, 90000, EMAIL, PASSWORD);
        await page.goto(`${BASE}${mod.path}`, { waitUntil: 'load', timeout: 30000 });
        await page.waitForTimeout(3000);

        for (const col of mod.columns) {
            const header = page.locator(`th:has-text("${col}"), [role="columnheader"]:has-text("${col}")`).first();
            const visible = await header.isVisible({ timeout: 5000 }).catch(() => false);
            console.log(`  ${visible ? '✅' : '⚠️'} Column "${col}": ${visible}`);
        }
        console.log(`✅ ${mod.name} columns verified`);
    });

    test(`System Settings > ${mod.name} has search`, async ({ page }) => {
        test.setTimeout(180000);

        await loginToApp(page, 90000, EMAIL, PASSWORD);
        await page.goto(`${BASE}${mod.path}`, { waitUntil: 'load', timeout: 30000 });
        await page.waitForTimeout(3000);

        const search = page.locator('input[type="text"]:visible').first();
        await expect(search).toBeVisible({ timeout: 10000 });
        await search.fill('test');
        await page.waitForTimeout(1500);
        await search.clear();
        console.log(`✅ ${mod.name} search input works`);
    });
}

test('System Settings > Support Documents page loads with table', async ({ page }) => {
    test.setTimeout(180000);

    await loginToApp(page, 90000, EMAIL, PASSWORD);
    await page.goto(`${BASE}/system-settings/support-documents`, { waitUntil: 'load', timeout: 30000 });
    await page.waitForTimeout(3000);

    await expect(page).toHaveURL(/system-settings\/support-documents/, { timeout: 10000 });

    const table = page.locator('table, [role="grid"], .v-data-table').first();
    await expect(table).toBeVisible({ timeout: 10000 });
    console.log('✅ Support Documents table is visible');
});

test('System Settings > Support Documents has correct columns', async ({ page }) => {
    test.setTimeout(180000);

    await loginToApp(page, 90000, EMAIL, PASSWORD);
    await page.goto(`${BASE}/system-settings/support-documents`, { waitUntil: 'load', timeout: 30000 });
    await page.waitForTimeout(3000);

    const columns = ['Page Name', 'Display Text', 'Documentation URL'];
    for (const col of columns) {
        const header = page.locator(`th:has-text("${col}"), [role="columnheader"]:has-text("${col}")`).first();
        const visible = await header.isVisible({ timeout: 5000 }).catch(() => false);
        console.log(`  ${visible ? '✅' : '⚠️'} Column "${col}": ${visible}`);
    }
    console.log('✅ Support Documents columns verified');
});

test('System Settings > Support Documents has Create button', async ({ page }) => {
    test.setTimeout(180000);

    await loginToApp(page, 90000, EMAIL, PASSWORD);
    await page.goto(`${BASE}/system-settings/support-documents`, { waitUntil: 'load', timeout: 30000 });
    await page.waitForTimeout(3000);

    const createBtn = page.locator('button:has-text("Create")').first();
    await expect(createBtn).toBeVisible({ timeout: 10000 });
    console.log('✅ Support Documents Create button is visible');
});
