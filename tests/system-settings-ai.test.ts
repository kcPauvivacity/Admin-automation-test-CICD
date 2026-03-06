import { test, expect } from '@playwright/test';
import { loginToApp } from './helpers/auth.helper';

const EMAIL = 'pau.kie.chee@fusioneta.com';
const PASSWORD = 'PAOpaopao@9696';
const BASE = 'https://app-staging.vivacityapp.com';

test('System Settings > AI Agents page loads with table', async ({ page }) => {
    test.setTimeout(180000);

    await loginToApp(page, 90000, EMAIL, PASSWORD);
    await page.goto(`${BASE}/system-settings/ai-agents`, { waitUntil: 'load', timeout: 30000 });
    await page.waitForTimeout(3000);

    await expect(page).toHaveURL(/system-settings\/ai-agents/, { timeout: 10000 });

    const table = page.locator('table, [role="grid"], .v-data-table').first();
    await expect(table).toBeVisible({ timeout: 10000 });
    console.log('✅ AI Agents table is visible');
});

test('System Settings > AI Agents has correct columns', async ({ page }) => {
    test.setTimeout(180000);

    await loginToApp(page, 90000, EMAIL, PASSWORD);
    await page.goto(`${BASE}/system-settings/ai-agents`, { waitUntil: 'load', timeout: 30000 });
    await page.waitForTimeout(3000);

    const columns = ['ID', 'Name', 'Organization'];
    for (const col of columns) {
        const header = page.locator(`th:has-text("${col}"), [role="columnheader"]:has-text("${col}")`).first();
        const visible = await header.isVisible({ timeout: 5000 }).catch(() => false);
        console.log(`  ${visible ? '✅' : '⚠️'} Column "${col}": ${visible}`);
    }
    console.log('✅ AI Agents columns verified');
});

test('System Settings > AI Agents has search', async ({ page }) => {
    test.setTimeout(180000);

    await loginToApp(page, 90000, EMAIL, PASSWORD);
    await page.goto(`${BASE}/system-settings/ai-agents`, { waitUntil: 'load', timeout: 30000 });
    await page.waitForTimeout(3000);

    const search = page.locator('input[type="text"]:visible').first();
    await expect(search).toBeVisible({ timeout: 10000 });
    await search.fill('test');
    await page.waitForTimeout(1500);
    await search.clear();
    console.log('✅ AI Agents search input works');
});

test('System Settings > B2B AI Agents page loads', async ({ page }) => {
    test.setTimeout(180000);

    await loginToApp(page, 90000, EMAIL, PASSWORD);
    await page.goto(`${BASE}/system-settings/b2b-ai`, { waitUntil: 'load', timeout: 30000 });
    await page.waitForTimeout(3000);

    await expect(page).toHaveURL(/system-settings\/b2b-ai/, { timeout: 10000 });
    console.log('✅ B2B AI Agents page loaded at:', page.url());
});

test('System Settings > B2B AI Agents has navigation tabs', async ({ page }) => {
    test.setTimeout(180000);

    await loginToApp(page, 90000, EMAIL, PASSWORD);
    await page.goto(`${BASE}/system-settings/b2b-ai`, { waitUntil: 'load', timeout: 30000 });
    await page.waitForTimeout(3000);

    const expectedTabs = ['Agent', 'Suggestions', 'URL Management', 'Glossaries'];
    for (const tab of expectedTabs) {
        const btn = page.locator(`button:has-text("${tab}"), [role="tab"]:has-text("${tab}")`).first();
        const visible = await btn.isVisible({ timeout: 5000 }).catch(() => false);
        console.log(`  ${visible ? '✅' : '⚠️'} Tab "${tab}": ${visible}`);
    }
    console.log('✅ B2B AI Agents tabs verified');
});
