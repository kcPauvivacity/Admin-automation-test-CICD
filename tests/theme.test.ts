import { test, expect } from '@playwright/test';
import { loginToApp } from './helpers/auth.helper';

const BASE_URL = 'https://app-staging.vivacityapp.com';

// Vuetify theme class: DARK = v-theme--DARK_BLUE_THEME, LIGHT = v-theme--BLUE_THEME

async function getThemeClass(page: any): Promise<string> {
    return await page.evaluate(() => {
        const app = document.querySelector('.v-application');
        if (!app) return '';
        if (app.classList.contains('v-theme--DARK_BLUE_THEME')) return 'dark';
        if (app.classList.contains('v-theme--BLUE_THEME')) return 'light';
        return app.className;
    });
}

async function waitForTheme(page: any, expected: 'dark' | 'light', timeout = 5000) {
    const themeClass = expected === 'dark' ? 'v-theme--DARK_BLUE_THEME' : 'v-theme--BLUE_THEME';
    await page.waitForSelector(`.v-application.${themeClass}`, { timeout });
}

async function setTheme(page: any, theme: 'dark' | 'light') {
    // Open avatar panel
    await page.locator('button[aria-label*="User profile menu"]').click();
    await page.waitForTimeout(800);

    // Open theme sub-panel if needed
    const openBtn = page.locator('button[aria-label="Open theme selector"]');
    if (await openBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await openBtn.click();
        await page.waitForTimeout(500);
    }

    // Click the target theme button
    if (theme === 'dark') {
        await page.locator('button[aria-label="Dark theme"]').click();
    } else {
        await page.locator('button[aria-label*="Light theme"]').click();
    }
    await page.waitForTimeout(800);

    // Close panel by clicking outside
    await page.locator('.v-application').click({ position: { x: 400, y: 400 }, force: true });
    await page.waitForTimeout(500);
}

// ── Basic tests ───────────────────────────────────────────────────────────────

test('verify theme panel opens with Light and Dark options', async ({ page }) => {
    test.setTimeout(120000);
    await loginToApp(page);

    await page.locator('button[aria-label*="User profile menu"]').click();
    await page.waitForTimeout(800);
    const openBtn = page.locator('button[aria-label="Open theme selector"]');
    if (await openBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await openBtn.click();
        await page.waitForTimeout(500);
    }

    await expect(page.locator('button[aria-label*="Light theme"]')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('button[aria-label="Dark theme"]')).toBeVisible({ timeout: 5000 });
    console.log('Theme panel: Light and Dark options visible');
});

test('switch to Dark Theme — verify DARK_BLUE_THEME class applied', async ({ page }) => {
    test.setTimeout(120000);
    await loginToApp(page);
    await waitForTheme(page, 'light', 10000);
    console.log('Initial: Light Theme confirmed');

    await setTheme(page, 'dark');
    await waitForTheme(page, 'dark', 5000);
    console.log('Dark Theme: v-theme--DARK_BLUE_THEME confirmed');

    // Clean up
    await setTheme(page, 'light');
});

test('switch to Light Theme from Dark — verify BLUE_THEME class restored', async ({ page }) => {
    test.setTimeout(120000);
    await loginToApp(page);

    await setTheme(page, 'dark');
    await waitForTheme(page, 'dark', 5000);
    console.log('Dark Theme applied');

    await setTheme(page, 'light');
    await waitForTheme(page, 'light', 5000);
    console.log('Light Theme restored: v-theme--BLUE_THEME confirmed');
});

test('verify Auto theme toggle is present', async ({ page }) => {
    test.setTimeout(120000);
    await loginToApp(page);

    await page.locator('button[aria-label*="User profile menu"]').click();
    await page.waitForTimeout(800);
    const openBtn = page.locator('button[aria-label="Open theme selector"]');
    if (await openBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await openBtn.click();
        await page.waitForTimeout(500);
    }
    await expect(page.locator('text=Auto').first()).toBeVisible({ timeout: 5000 });
    console.log('Auto theme toggle present');
});

test('verify Dark Theme persists after page reload', async ({ page }) => {
    test.setTimeout(120000);
    await loginToApp(page);

    await setTheme(page, 'dark');
    await waitForTheme(page, 'dark', 5000);

    await page.reload({ waitUntil: 'load' });
    await waitForTheme(page, 'dark', 10000);
    console.log('Dark Theme persisted after reload');

    // Clean up
    await setTheme(page, 'light');
});

// ── Dark Theme across all modules ─────────────────────────────────────────────

const MODULES = [
    { name: 'Dashboard',    path: '' },
    { name: 'Properties',   path: '/properties' },
    { name: 'Articles',     path: '/articles' },
    { name: 'AI Chat',      path: '/ai-chat' },
    { name: 'Contacts',     path: '/contacts' },
    { name: 'Enquiries',    path: '/enquiries' },
    { name: 'Reports',      path: '/reports' },
    { name: 'User Profile', path: '/settings/user-profile' },
];

test('Dark Theme applies correctly across all modules', async ({ page }) => {
    test.setTimeout(300000);
    await loginToApp(page);
    await waitForTheme(page, 'light', 10000);

    // Enable Dark Theme
    await setTheme(page, 'dark');
    await waitForTheme(page, 'dark', 5000);
    console.log('Dark Theme enabled');

    const currentUrl = page.url();
    const orgSlug = currentUrl.match(/vivacityapp\.com\/([^/]+)/)?.[1] || 'demo-student';

    const passed: string[] = [];
    const failed: string[] = [];

    for (const module of MODULES) {
        const url = `${BASE_URL}/${orgSlug}${module.path}`;
        await page.goto(url, { waitUntil: 'load', timeout: 30000 });

        // Wait for theme class to be applied (up to 8s)
        const isDark = await page.waitForSelector('.v-application.v-theme--DARK_BLUE_THEME', { timeout: 8000 })
            .then(() => true)
            .catch(() => false);

        const themeClass = await getThemeClass(page);
        if (isDark) {
            passed.push(module.name);
            console.log(`✅ ${module.name}: Dark Theme applied`);
        } else {
            failed.push(module.name);
            console.log(`❌ ${module.name}: NOT dark (class: ${themeClass})`);
        }

        expect(isDark, `${module.name} — Dark Theme (v-theme--DARK_BLUE_THEME) not applied`).toBe(true);
    }

    // Clean up
    await setTheme(page, 'light');

    console.log(`\nSummary: ${passed.length}/${MODULES.length} modules correct`);
    if (failed.length > 0) console.log('Failed modules:', failed.join(', '));
});
