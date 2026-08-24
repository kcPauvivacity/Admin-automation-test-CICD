import { Page } from '@playwright/test';

// Shared helpers for the rebrand-qa.test.ts and settings-viva-qa.test.ts suites.
// These translate the manual checklists from the `rebrand-qa` and
// `settings-viva-qa` Claude skills into reusable Playwright building blocks.

export const BASE_URL = process.env.TEST_URL || 'https://app-staging.vivacityapp.com';

// ── Theme helpers (mirrors tests/theme.test.ts) ─────────────────────────────

export async function getThemeClass(page: Page): Promise<string> {
    return await page.evaluate(() => {
        const app = document.querySelector('.v-application');
        if (!app) return '';
        if (app.classList.contains('v-theme--DARK_BLUE_THEME')) return 'dark';
        if (app.classList.contains('v-theme--BLUE_THEME')) return 'light';
        return app.className.slice(0, 80);
    });
}

export async function waitForTheme(page: Page, expected: 'dark' | 'light', timeout = 5000) {
    const themeClass = expected === 'dark' ? 'v-theme--DARK_BLUE_THEME' : 'v-theme--BLUE_THEME';
    await page.waitForSelector(`.v-application.${themeClass}`, { timeout });
}

export async function setTheme(page: Page, theme: 'dark' | 'light') {
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

// ── Org / navigation helpers ────────────────────────────────────────────────

export function currentOrgBase(page: Page, fallback = 'demo-student'): string {
    const org = page.url().match(/vivacityapp\.com\/([^/]+)/)?.[1] || fallback;
    return `${BASE_URL}/${org}`;
}

/**
 * Tries each candidate path (relative to orgBase) until one loads the SPA
 * without landing on a 404/login page. Returns the URL that worked, or null
 * if none did — lets tests skip cleanly on deployments where a page has
 * moved or doesn't exist, instead of hard-failing.
 */
export async function resolvePage(page: Page, orgBase: string, candidatePaths: string[], timeout = 15000): Promise<string | null> {
    for (const path of candidatePaths) {
        const url = `${orgBase}${path}`;
        // Some micro-frontends (e.g. settings-viva) render the shell even on
        // an unknown sub-route and only report the miss via a console error
        // ("Page not found: ..."), not a real 404 URL or DOM text — catch
        // that here so we try the next candidate instead of treating it as a
        // hit.
        let sawSoftNotFound = false;
        const onConsole = (msg: any) => {
            if (msg.type() === 'error' && /page not found/i.test(msg.text())) sawSoftNotFound = true;
        };
        page.on('console', onConsole);
        try {
            await page.goto(url, { waitUntil: 'load', timeout });
            const hasVApp = await page.waitForSelector('.v-application', { timeout: 8000 }).then(() => true).catch(() => false);
            await page.waitForTimeout(500); // let a soft-404 console error surface
            if (hasVApp && !sawSoftNotFound && !/\/(404|auth\/login)/.test(page.url())) return url;
        } catch {
            // try next candidate
        } finally {
            page.off('console', onConsole);
        }
    }
    return null;
}

// ── Console error helpers ───────────────────────────────────────────────────

// Known background noise called out explicitly in both QA skills as
// "false positives — don't re-report these".
const KNOWN_NOISE = [
    'favicon',
    '404',
    'ext.json',
    'SharedArrayBuffer',
    'Could not find original vnode',
    '503',            // known staging backend flakiness — see auth.helper.ts comment
    'FetchError',
    'Failed to fetch',
    'Error checking onboarding status', // global app-shell check, unrelated to any single page
    'the server responded with a status of 405', // global POST ms-securities/api/user-preferences/ 405 on every page load — real bug, tracked separately, not page-specific
];

export function trackConsoleErrors(page: Page) {
    const errors: string[] = [];
    page.on('console', msg => {
        if (msg.type() === 'error') errors.push(msg.text());
    });
    return {
        all: errors,
        critical: () => errors.filter(e => !KNOWN_NOISE.some(noise => e.includes(noise))),
    };
}

// ── Table helpers ───────────────────────────────────────────────────────────

export async function rowCount(page: Page): Promise<number> {
    // Scope [role="row"] to tbody — Vuetify data tables also put role="row"
    // on the <thead> row, which would otherwise count as a phantom data row
    // and mask a genuinely empty (0-row) result as "1 row". Also exclude the
    // "No data available" placeholder row Vuetify renders inside tbody when
    // a filtered/empty table has zero real results — same phantom-row issue.
    const rows = page.locator('tbody tr, tbody [role="row"]');
    const total = await rows.count();
    const noDataRows = await rows.filter({ hasText: /no data available/i }).count();
    return total - noDataRows;
}
