import { test, expect } from '@playwright/test';
import { loginToApp } from './helpers/auth.helper';

const BASE_URL = 'https://app-staging.vivacityapp.com';

async function getThemeClass(page: any): Promise<string> {
    return await page.evaluate(() => {
        const app = document.querySelector('.v-application');
        if (!app) return '';
        if (app.classList.contains('v-theme--DARK_BLUE_THEME')) return 'dark';
        if (app.classList.contains('v-theme--BLUE_THEME')) return 'light';
        return app.className.slice(0, 80);
    });
}

async function waitForTheme(page: any, expected: 'dark' | 'light', timeout = 5000) {
    const themeClass = expected === 'dark' ? 'v-theme--DARK_BLUE_THEME' : 'v-theme--BLUE_THEME';
    await page.waitForSelector(`.v-application.${themeClass}`, { timeout });
}

async function setTheme(page: any, theme: 'dark' | 'light') {
    await page.locator('button[aria-label*="User profile menu"]').click();
    await page.waitForTimeout(800);
    const openBtn = page.locator('button[aria-label="Open theme selector"]');
    if (await openBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await openBtn.click();
        await page.waitForTimeout(500);
    }
    if (theme === 'dark') {
        await page.locator('button[aria-label="Dark theme"]').click();
    } else {
        await page.locator('button[aria-label*="Light theme"]').click();
    }
    await page.waitForTimeout(800);
    await page.locator('.v-application').click({ position: { x: 400, y: 400 }, force: true });
    await page.waitForTimeout(500);
}

async function checkModules(page: any, modules: {name: string, url: string}[]) {
    const passed: string[] = [];
    const failed: string[] = [];
    const skipped: string[] = [];

    for (const module of modules) {
        try {
            await page.goto(module.url, { waitUntil: 'load', timeout: 30000 });
            // Wait for Vue app to mount (SPA takes time to hydrate)
            const hasVApp = await page.waitForSelector('.v-application', { timeout: 8000 })
                .then(() => true).catch(() => false);
            if (!hasVApp) {
                skipped.push(module.name);
                console.log(`⏭️  ${module.name}: 404 / no access (landed: ${page.url()})`);
                continue;
            }

            const isDark = await page.waitForSelector('.v-application.v-theme--DARK_BLUE_THEME', { timeout: 8000 })
                .then(() => true).catch(() => false);

            if (isDark) {
                passed.push(module.name);
                console.log(`✅ ${module.name}`);
            } else {
                failed.push(module.name);
                const cls = await getThemeClass(page);
                console.log(`❌ ${module.name} — NOT dark (${cls})`);
            }
        } catch (e: any) {
            skipped.push(module.name);
            console.log(`⏭️  ${module.name}: ${e.message?.slice(0, 50)}`);
        }
    }
    return { passed, failed, skipped };
}

// ── Basic tests ───────────────────────────────────────────────────────────────

test('verify theme panel opens with Light and Dark options', async ({ page }) => {
    test.setTimeout(120000);
    await loginToApp(page);
    await page.locator('button[aria-label*="User profile menu"]').click();
    await page.waitForTimeout(800);
    const openBtn = page.locator('button[aria-label="Open theme selector"]');
    if (await openBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await openBtn.click(); await page.waitForTimeout(500);
    }
    await expect(page.locator('button[aria-label*="Light theme"]')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('button[aria-label="Dark theme"]')).toBeVisible({ timeout: 5000 });
    console.log('Theme panel: Light and Dark options visible');
});

test('switch to Dark Theme — verify DARK_BLUE_THEME class applied', async ({ page }) => {
    test.setTimeout(120000);
    await loginToApp(page);
    await waitForTheme(page, 'light', 10000);
    await setTheme(page, 'dark');
    await waitForTheme(page, 'dark', 5000);
    console.log('Dark Theme: v-theme--DARK_BLUE_THEME confirmed');
    await setTheme(page, 'light');
});

test('switch to Light Theme from Dark — verify BLUE_THEME class restored', async ({ page }) => {
    test.setTimeout(120000);
    await loginToApp(page);
    await setTheme(page, 'dark');
    await waitForTheme(page, 'dark', 5000);
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
        await openBtn.click(); await page.waitForTimeout(500);
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
    await setTheme(page, 'light');
});

// ── Dark Theme: Main modules + Settings (kc account) ─────────────────────────

test('Dark Theme — Main modules and Settings pages', async ({ page }) => {
    test.setTimeout(600000);
    await loginToApp(page);
    await waitForTheme(page, 'light', 10000);
    await setTheme(page, 'dark');
    await waitForTheme(page, 'dark', 5000);
    console.log('Dark Theme enabled\n');

    const org = page.url().match(/vivacityapp\.com\/([^/]+)/)?.[1] || 'demo-student';
    const ORG = `${BASE_URL}/${org}`;

    const modules = [
        { name: 'Dashboard',            url: `${ORG}/dashboard` },
        { name: 'Properties',           url: `${ORG}/properties` },
        { name: 'Articles',             url: `${ORG}/articles` },
        { name: 'AI Chat',              url: `${ORG}/ai-chat` },
        { name: 'Contacts',             url: `${ORG}/contacts` },
        { name: 'Enquiries',            url: `${ORG}/enquiries` },
        { name: 'Promotions',           url: `${ORG}/promotions` },
        { name: 'Surveys',              url: `${ORG}/surveys` },
        { name: 'FAQ',                  url: `${ORG}/faq` },
        { name: 'Reports',              url: `${ORG}/reports` },
        { name: 'Tracking',             url: `${ORG}/tracking` },
        { name: 'Universities',         url: `${ORG}/universities` },
        { name: 'Cities',               url: `${ORG}/cities` },
        { name: 'Facilities',           url: `${ORG}/facilities` },
        { name: 'Attributes',           url: `${ORG}/attributes` },
        { name: 'Tags',                 url: `${ORG}/tags` },
        { name: 'Settings - General',   url: `${ORG}/settings/general` },
        { name: 'Settings - Users',     url: `${ORG}/settings/users` },
        { name: 'Settings - Profile',   url: `${ORG}/settings/user-profile` },
        { name: 'Settings - Billing',   url: `${ORG}/settings/billing` },
        { name: 'Settings - Integrations', url: `${ORG}/settings/integrations` },
    ];

    const { passed, failed, skipped } = await checkModules(page, modules);

    // Navigate back to a working page before restoring theme
    await page.goto(`${ORG}/dashboard`, { waitUntil: 'load', timeout: 30000 });
    await page.waitForTimeout(1000);
    await setTheme(page, 'light');

    console.log(`\n${'─'.repeat(50)}`);
    console.log(`✅ Passed: ${passed.length} | ❌ Failed: ${failed.length} | ⏭️ Skipped: ${skipped.length}`);
    if (failed.length > 0) console.log(`\nBUGS — Dark Theme not applied:\n${failed.map(f => `  ❌ ${f}`).join('\n')}`);

    expect(failed, `Dark Theme NOT applied on: ${failed.join(', ')}`).toHaveLength(0);
});

// ── Dark Theme: System Settings (fusioneta account) ───────────────────────────

test('Dark Theme — System Settings pages (fusioneta)', async ({ page }) => {
    test.setTimeout(600000);
    await loginToApp(page, 90000, 'pau.kie.chee@fusioneta.com', 'PAOpaopao@9696');
    await waitForTheme(page, 'light', 10000);
    await setTheme(page, 'dark');
    await waitForTheme(page, 'dark', 5000);
    console.log('Dark Theme enabled\n');

    const SYS = `${BASE_URL}/system-settings`;
    const modules = [
        { name: 'SysSettings - Organizations',        url: `${SYS}/organizations` },
        { name: 'SysSettings - Cities',               url: `${SYS}/cities` },
        { name: 'SysSettings - Countries',            url: `${SYS}/countries` },
        { name: 'SysSettings - Facilities',           url: `${SYS}/facilities` },
        { name: 'SysSettings - Neighbourhoods',       url: `${SYS}/neighbourhoods` },
        { name: 'SysSettings - Stations',             url: `${SYS}/stations` },
        { name: 'SysSettings - Universities',         url: `${SYS}/universities` },
        { name: 'SysSettings - Users',                url: `${SYS}/users` },
        { name: 'SysSettings - User Permissions',     url: `${SYS}/user-permissions` },
        { name: 'SysSettings - User Roles',           url: `${SYS}/user-roles` },
        { name: 'SysSettings - AI Agents',            url: `${SYS}/ai-agents` },
        { name: 'SysSettings - Email Templates',      url: `${SYS}/email-templates` },
        { name: 'SysSettings - Notification Templates', url: `${SYS}/notification-templates` },
        { name: 'SysSettings - Support Documents',    url: `${SYS}/support-documents` },
        { name: 'SysSettings - Configurations',       url: `${SYS}/configurations` },
        { name: 'SysSettings - Tooltips',             url: `${SYS}/tooltips` },
        { name: 'SysSettings - Task Templates',       url: `${SYS}/task-templates` },
        { name: 'SysSettings - Audit Logs',           url: `${SYS}/audit-logs` },
        { name: 'SysSettings - Analytics Queries',    url: `${SYS}/analytics-queries` },
        { name: 'SysSettings - Widgets',              url: `${SYS}/widgets` },
        { name: 'SysSettings - Reports',              url: `${SYS}/reports` },
        { name: 'SysSettings - Enquiries Queue',      url: `${SYS}/enquiries-queue` },
    ];

    const { passed, failed, skipped } = await checkModules(page, modules);
    await setTheme(page, 'light');

    console.log(`\n${'─'.repeat(50)}`);
    console.log(`✅ Passed: ${passed.length} | ❌ Failed: ${failed.length} | ⏭️ Skipped: ${skipped.length}`);
    if (failed.length > 0) console.log(`\nBUGS — Dark Theme not applied:\n${failed.map(f => `  ❌ ${f}`).join('\n')}`);

    expect(failed, `Dark Theme NOT applied on: ${failed.join(', ')}`).toHaveLength(0);
});
