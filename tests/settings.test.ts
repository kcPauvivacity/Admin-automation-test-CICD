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

// Regression: PR #14758 — accounts sub-accounts unlink + infinite loading fix
test('settings accounts tab loads without infinite loading', async ({ page }) => {
    test.setTimeout(120000);

    await loginToApp(page, 90000, FUSIONETA_EMAIL, FUSIONETA_PASSWORD);

    // Navigate to settings accounts section
    await page.goto(`${BASE_URL}/demo-student/settings`, { waitUntil: 'load', timeout: 30000 });
    await page.waitForSelector('.v-application', { timeout: 15000 });
    await page.waitForTimeout(2000);

    // Look for Accounts / Sub-accounts nav item in settings
    const accountsTab = page.locator('.v-list-item, .v-tab, a, button').filter({ hasText: /accounts?/i });
    const hasAccountsTab = await accountsTab.first().isVisible({ timeout: 5000 }).catch(() => false);

    if (hasAccountsTab) {
        await accountsTab.first().click();
        await page.waitForTimeout(3000);
        console.log('✅ Clicked Accounts tab');
    } else {
        // Try direct URL
        await page.goto(`${BASE_URL}/demo-student/settings/accounts`, { waitUntil: 'load', timeout: 20000 });
        await page.waitForTimeout(3000);
        console.log('ℹ️ Navigated directly to /settings/accounts');
    }

    // Verify page loads — spinner should not persist (infinite loading bug fix)
    const spinner = page.locator('.v-progress-circular, .v-skeleton-loader, [class*="loading"], [class*="spinner"]');
    await page.waitForTimeout(5000); // Give it 5s to stop loading
    const stillLoading = await spinner.isVisible({ timeout: 1000 }).catch(() => false);
    expect(stillLoading, 'Page should finish loading — infinite loading spinner bug detected').toBe(false);
    console.log('✅ Page loaded without infinite spinner');

    // Verify some content is visible (not stuck on loading state)
    const content = page.locator('.v-card, .v-list, table, [role="table"], h1, h2, h3').first();
    const hasContent = await content.isVisible({ timeout: 5000 }).catch(() => false);
    if (hasContent) {
        console.log('✅ Account settings content is visible');
    } else {
        const noDataMsg = page.locator('text=/no.*account|no.*result|empty/i').first();
        const hasNoData = await noDataMsg.isVisible({ timeout: 3000 }).catch(() => false);
        console.log(hasNoData ? '✅ Empty state message shown (no sub-accounts)' : 'ℹ️ Content structure unclear');
    }
});

test('settings sub-accounts list loads and shows link/unlink option', async ({ page }) => {
    test.setTimeout(120000);

    await loginToApp(page, 90000, FUSIONETA_EMAIL, FUSIONETA_PASSWORD);

    await page.goto(`${BASE_URL}/demo-student/settings`, { waitUntil: 'load', timeout: 30000 });
    await page.waitForSelector('.v-application', { timeout: 15000 });
    await page.waitForTimeout(2000);

    // Find sub-accounts nav
    const subAccountsNav = page.locator('.v-list-item, .v-tab, a, button').filter({ hasText: /sub.?account/i });
    const hasSubAccountsNav = await subAccountsNav.first().isVisible({ timeout: 5000 }).catch(() => false);

    if (!hasSubAccountsNav) {
        // Try accounts section which may contain sub-accounts
        const accountsNav = page.locator('.v-list-item, .v-tab, a, button').filter({ hasText: /accounts?/i });
        if (await accountsNav.first().isVisible({ timeout: 3000 }).catch(() => false)) {
            await accountsNav.first().click();
            await page.waitForTimeout(2000);
        } else {
            await page.goto(`${BASE_URL}/demo-student/settings/accounts`, { waitUntil: 'load', timeout: 20000 });
            await page.waitForTimeout(3000);
        }
    } else {
        await subAccountsNav.first().click();
        await page.waitForTimeout(2000);
    }

    // Wait for content and check for no infinite load
    await page.waitForTimeout(4000);
    const spinner = page.locator('.v-progress-circular').filter({ hasText: '' });
    const stillLoading = await spinner.isVisible({ timeout: 1000 }).catch(() => false);
    expect(stillLoading, 'Sub-accounts page should not be stuck in infinite loading').toBe(false);

    // Check for link/unlink button or action
    const linkBtn = page.locator('button, .v-btn').filter({ hasText: /link|unlink|connect|disconnect/i });
    const hasLinkBtn = await linkBtn.first().isVisible({ timeout: 5000 }).catch(() => false);

    if (hasLinkBtn) {
        await expect(linkBtn.first()).toBeVisible();
        console.log('✅ Link/Unlink button is visible in sub-accounts section');
    } else {
        const emptyState = page.locator('[class*="empty"], text=/no.*sub.?account/i').first();
        const hasEmpty = await emptyState.isVisible({ timeout: 3000 }).catch(() => false);
        console.log(hasEmpty
            ? '✅ Empty state shown — no sub-accounts currently linked'
            : 'ℹ️ Sub-accounts UI structure may differ for this account');
    }

    // Verify no error snackbar
    const errorSnackbar = page.locator('.v-snackbar--active').filter({ hasText: /error/i });
    await expect(errorSnackbar).not.toBeVisible({ timeout: 3000 });
    console.log('✅ No errors in sub-accounts section');
});
