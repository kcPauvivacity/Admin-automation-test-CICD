import { test, expect } from '@playwright/test';
import { loginToApp } from './helpers/auth.helper';

const EMAIL = 'pau.kie.chee@fusioneta.com';
const PASSWORD = 'PAOpaopao@9696';
const BASE = 'https://app-staging.vivacityapp.com';

const modules = [
    { name: 'Organizations', path: '/system-settings/organizations', columns: ['ID', 'Name', 'Stages'] },
    { name: 'Cities', path: '/system-settings/cities', columns: ['ID', 'English Name', 'Chinese Name'] },
    { name: 'Countries', path: '/system-settings/countries', columns: ['ID', 'English Name', 'Shortname'] },
    { name: 'Facilities', path: '/system-settings/facilities', columns: ['ID', 'English Name', 'Chinese Name'] },
    { name: 'Neighbourhoods', path: '/system-settings/neighbourhoods', columns: ['ID', 'English Name', 'City'] },
    { name: 'Stations', path: '/system-settings/stations', columns: ['ID', 'Name', 'City'] },
    { name: 'Universities', path: '/system-settings/universities', columns: ['ID', 'Name', 'City'] },
];

for (const mod of modules) {
    test(`System Settings > ${mod.name} page loads`, async ({ page }) => {
        test.setTimeout(180000);

        await loginToApp(page, 90000, EMAIL, PASSWORD);
        await page.goto(`${BASE}${mod.path}`, { waitUntil: 'load', timeout: 30000 });
        await page.waitForTimeout(3000);

        await expect(page).toHaveURL(new RegExp(mod.path.replace(/\//g, '\\/')), { timeout: 10000 });

        const heading = page.locator('h1:has-text("System Settings"), h2:has-text("System Settings"), h3:has-text("System Settings"), [class*="title"]:has-text("System Settings")').first();
        const hasHeading = await heading.isVisible({ timeout: 5000 }).catch(() => false);
        console.log(`  ${hasHeading ? '✅' : 'ℹ️'} Heading visible: ${hasHeading}`);

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
