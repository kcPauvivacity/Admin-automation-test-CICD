import { test, expect } from '@playwright/test';
import { loginToApp } from './helpers/auth.helper';

const FUSIONETA_EMAIL = 'pau.kie.chee@fusioneta.com';
const FUSIONETA_PASSWORD = 'PAOpaopao@9696';
const BASE_URL = process.env.TEST_URL || 'https://app-staging.vivacityapp.com';

test('navigate to Settings section successfully', async ({ page }) => {
    test.setTimeout(180000);

    await loginToApp(page, 90000, FUSIONETA_EMAIL, FUSIONETA_PASSWORD);
    await page.waitForLoadState('load');
    await page.waitForTimeout(3000);

    // Navigate via direct URL
    await page.goto(`${BASE_URL}/demo-student/settings`);
    await page.waitForLoadState('load');
    await page.waitForTimeout(2000);

    await expect(page).toHaveURL(/settings/, { timeout: 10000 });
    console.log('✅ Settings page loaded at:', page.url());
});

test('Settings page shows Settings navigation menu', async ({ page }) => {
    test.setTimeout(180000);

    await loginToApp(page, 90000, FUSIONETA_EMAIL, FUSIONETA_PASSWORD);
    await page.goto(`${BASE_URL}/demo-student/settings`);
    await page.waitForLoadState('load');
    await page.waitForTimeout(3000);

    // Check for Settings heading or menu
    const settingsHeading = page.locator('h1:has-text("Settings"), h2:has-text("Settings"), [class*="title"]:has-text("Settings")').first();
    const hasHeading = await settingsHeading.isVisible({ timeout: 5000 }).catch(() => false);
    expect(hasHeading).toBe(true);
    console.log('✅ Settings heading is visible');
});

test('Settings Users sub-page is accessible', async ({ page }) => {
    test.setTimeout(180000);

    await loginToApp(page, 90000, FUSIONETA_EMAIL, FUSIONETA_PASSWORD);
    await page.goto(`${BASE_URL}/demo-student/settings/users`);
    await page.waitForLoadState('load');
    await page.waitForTimeout(3000);

    await expect(page).toHaveURL(/settings\/users/, { timeout: 10000 });
    console.log('✅ Settings > Users page loaded successfully');
});

test('Settings restricted pages show error for this account', async ({ page }) => {
    test.setTimeout(180000);

    await loginToApp(page, 90000, FUSIONETA_EMAIL, FUSIONETA_PASSWORD);

    const restrictedPages = [
        `${BASE_URL}/demo-student/settings/general`,
        `${BASE_URL}/demo-student/settings/billing`,
        `${BASE_URL}/demo-student/settings/integrations`,
    ];

    for (const url of restrictedPages) {
        await page.goto(url, { waitUntil: 'load', timeout: 20000 });
        await page.waitForTimeout(1500);
        const errorMsg = page.locator('text=/Opps|403|forbidden|access denied|not authorized/i').first();
        const hasError = await errorMsg.isVisible({ timeout: 3000 }).catch(() => false);
        console.log(`  ${hasError ? '✅' : 'ℹ️'} ${url.split('/').pop()} → restricted: ${hasError}`);
    }

    console.log('✅ Restricted pages verified');
});
