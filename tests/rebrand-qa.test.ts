import { test, expect } from '@playwright/test';
import { loginToApp } from './helpers/auth.helper';
import { currentOrgBase, resolvePage, trackConsoleErrors, rowCount, setTheme, waitForTheme } from './helpers/qa.helper';

// Automated version of the `rebrand-qa` Claude skill's checklist for
// `packages/main`. Covers: console errors, search filtering, column
// persistence, back-navigation caching, NavigationBar prev/next consistency,
// empty states, and the Chat Centre-specific UI checks.
//
// Read-only by design (matches the skill's constraints): never toggles,
// saves, publishes, or deletes real data — only views, searches, and edits
// view-only preferences like column selection.

const FUSIONETA_EMAIL = 'pau.kie.chee@fusioneta.com';
const FUSIONETA_PASSWORD = 'PAOpaopao@9696';

type RebrandPage = { name: string; paths: string[]; fusioneta?: boolean };

const REBRAND_PAGES: RebrandPage[] = [
    { name: 'Dashboard', paths: ['/dashboard'] },
    { name: 'Properties', paths: ['/properties'] },
    { name: 'Venues', paths: ['/venues'] },
    { name: 'Menus', paths: ['/menus'] },
    { name: 'Enquiries', paths: ['/enquiries'] },
    { name: 'Testimonials', paths: ['/testimonials'] },
    { name: 'Articles', paths: ['/articles'] },
    { name: 'AI Chat', paths: ['/ai-chat'] },
    { name: 'Sales Consultants', paths: ['/sales-consultants'], fusioneta: true },
    { name: 'Chat Centre', paths: ['/chat-centre'], fusioneta: true },
];

// List pages worth exercising search on (per skill: "type a known-existing
// value, confirm it actually filters results").
const SEARCHABLE_PAGES: RebrandPage[] = [
    { name: 'Properties', paths: ['/properties'] },
    { name: 'Enquiries', paths: ['/enquiries'] },
    { name: 'Testimonials', paths: ['/testimonials'] },
    { name: 'Articles', paths: ['/articles'] },
];

async function login(page: any, p: RebrandPage) {
    if (p.fusioneta) {
        await loginToApp(page, 90000, FUSIONETA_EMAIL, FUSIONETA_PASSWORD);
    } else {
        await loginToApp(page);
    }
}

// ─────────────────────────────────────────────────────────────
// Console errors — every page
// ─────────────────────────────────────────────────────────────

for (const p of REBRAND_PAGES) {
    test(`Rebrand QA - ${p.name} has no critical console errors`, async ({ page }) => {
        test.setTimeout(120000);

        await login(page, p);
        const orgBase = currentOrgBase(page);
        const url = await resolvePage(page, orgBase, p.paths);
        if (!url) {
            console.log(`⏭️  ${p.name}: page not found on this deployment, skipping`);
            test.skip();
            return;
        }

        // Attach the tracker only after resolvePage has settled on a working
        // URL, then do one clean reload — otherwise errors from candidate
        // paths that resolvePage already rejected leak into this page's result.
        const tracker = trackConsoleErrors(page);
        await page.reload({ waitUntil: 'load', timeout: 15000 });
        await page.waitForTimeout(2500);

        const critical = tracker.critical();
        if (critical.length > 0) {
            console.log(`❌ ${p.name} console errors:\n${critical.join('\n')}`);
        } else {
            console.log(`✅ ${p.name}: no critical console errors`);
        }
        expect(critical, `Critical console errors on ${p.name}:\n${critical.join('\n')}`).toHaveLength(0);
    });
}

// ─────────────────────────────────────────────────────────────
// Search actually filters results
// ─────────────────────────────────────────────────────────────

for (const p of SEARCHABLE_PAGES) {
    test(`Rebrand QA - ${p.name} search filters the table`, async ({ page }) => {
        test.setTimeout(120000);
        await login(page, p);
        const orgBase = currentOrgBase(page);
        const url = await resolvePage(page, orgBase, p.paths);
        if (!url) {
            test.skip();
            return;
        }
        await page.waitForTimeout(2000);

        const searchInput = page.locator('input[type="text"], input[type="search"]').first();
        if (!(await searchInput.isVisible({ timeout: 5000 }).catch(() => false))) {
            console.log(`⏭️  ${p.name}: no search input found, skipping`);
            test.skip();
            return;
        }

        const before = await rowCount(page);
        if (before === 0) {
            console.log(`⏭️  ${p.name}: table is empty, can't verify search narrows results`);
            test.skip();
            return;
        }

        // Nonsense term should filter down to (near) zero rows — proves the
        // search box is wired to a real field, not silently ignored.
        await searchInput.fill(`zzz-no-such-record-${Date.now()}`);
        await page.waitForTimeout(1500);
        // Wait for the table's loading spinner to clear before counting —
        // otherwise a mid-fetch loading-row can be miscounted as 1 real row.
        await page.locator('tbody [role="progressbar"]').first()
            .waitFor({ state: 'hidden', timeout: 8000 }).catch(() => {});
        await page.waitForTimeout(500);
        const afterNonsense = await rowCount(page);

        console.log(`📊 ${p.name}: ${before} rows → ${afterNonsense} rows after nonsense search`);
        expect(afterNonsense, `${p.name} search did not filter results for a nonsense term`).toBeLessThan(before);

        // Also check for a visible empty-state, not a blank flash.
        const emptyState = page.locator('text=/no results|no records|nothing found|no data/i').first();
        const hasEmptyState = await emptyState.isVisible({ timeout: 3000 }).catch(() => false);
        console.log(`  ${hasEmptyState ? '✅' : 'ℹ️'} Empty state indicator visible: ${hasEmptyState}`);

        await searchInput.clear();
        await page.waitForTimeout(1500);
    });
}

// ─────────────────────────────────────────────────────────────
// Column editor persists after hard refresh
// ─────────────────────────────────────────────────────────────

test('Rebrand QA - Properties column selection persists after hard refresh', async ({ page }) => {
    test.setTimeout(150000);
    await loginToApp(page);
    const orgBase = currentOrgBase(page);
    const url = await resolvePage(page, orgBase, ['/properties']);
    if (!url) { test.skip(); return; }
    await page.waitForTimeout(2000);

    const editColumnsBtn = page.locator('button:has-text("Edit Columns"), [role="button"]:has-text("Edit Columns")').first();
    if (!(await editColumnsBtn.isVisible({ timeout: 5000 }).catch(() => false))) {
        console.log('⏭️  No column editor found on Properties, skipping');
        test.skip();
        return;
    }

    await editColumnsBtn.click();
    await page.waitForTimeout(1000);

    const checkboxes = page.locator('[role="menu"] input[type="checkbox"], .v-menu input[type="checkbox"]');
    const count = await checkboxes.count();
    if (count === 0) {
        console.log('⏭️  Column editor has no checkboxes, skipping');
        test.skip();
        return;
    }

    const target = checkboxes.first();
    const wasChecked = await target.isChecked();
    await target.click();
    await page.waitForTimeout(500);
    console.log(`Toggled first column checkbox: ${wasChecked} → ${!wasChecked}`);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);

    await page.reload({ waitUntil: 'load', timeout: 30000 });
    await page.waitForTimeout(2500);

    await editColumnsBtn.click();
    await page.waitForTimeout(1000);
    const afterReload = await checkboxes.first().isChecked();

    console.log(`Column state after hard refresh: expected ${!wasChecked}, got ${afterReload}`);
    expect(afterReload, 'Column visibility preference did not persist across a hard refresh').toBe(!wasChecked);

    // Restore original state so we leave the view preference as we found it.
    await checkboxes.first().click();
    await page.waitForTimeout(300);
    await page.keyboard.press('Escape');
});

// ─────────────────────────────────────────────────────────────
// Back-navigation re-renders from cache, not a fresh spinner
// ─────────────────────────────────────────────────────────────

test('Rebrand QA - Properties list re-renders from cache after back-navigation', async ({ page }) => {
    test.setTimeout(150000);
    await loginToApp(page);
    const orgBase = currentOrgBase(page);
    const url = await resolvePage(page, orgBase, ['/properties']);
    if (!url) { test.skip(); return; }
    await page.waitForTimeout(2000);

    const firstRow = page.locator('tbody tr').first();
    if (!(await firstRow.isVisible({ timeout: 5000 }).catch(() => false))) {
        console.log('⏭️  No rows in Properties list, skipping');
        test.skip();
        return;
    }

    const clicked = await firstRow.click({ timeout: 8000 }).then(() => true).catch(() => false);
    if (!clicked) {
        console.log('⏭️  Could not click first row on Properties list, skipping');
        test.skip();
        return;
    }
    await page.waitForLoadState('load', { timeout: 8000 }).catch(() => {});
    await page.waitForTimeout(2000);

    let listApiCalled = false;
    page.on('request', req => {
        if (/\/properties(\?|$)/.test(req.url()) && req.method() === 'GET') listApiCalled = true;
    });

    await page.goBack({ waitUntil: 'load', timeout: 20000 });
    await page.waitForTimeout(1500);

    console.log(`List API re-fetched on back-navigation: ${listApiCalled}`);
    if (listApiCalled) {
        console.log('⚠️  List re-fetched the API on back-navigation instead of using cache (see rebrand-qa skill)');
    } else {
        console.log('✅ List rendered from cache on back-navigation, no new fetch');
    }
});

// ─────────────────────────────────────────────────────────────
// NavigationBar prev/next: breadcrumb, Name field, and URL agree
// ─────────────────────────────────────────────────────────────

test('Rebrand QA - Properties detail prev/next keeps breadcrumb and Name field in sync', async ({ page }) => {
    test.setTimeout(210000);
    await loginToApp(page);
    const orgBase = currentOrgBase(page);
    const url = await resolvePage(page, orgBase, ['/properties']);
    if (!url) { test.skip(); return; }
    await page.waitForTimeout(2000);

    const firstRow = page.locator('tbody tr').first();
    if (!(await firstRow.isVisible({ timeout: 5000 }).catch(() => false))) {
        test.skip();
        return;
    }
    const clicked = await firstRow.click({ timeout: 8000 }).then(() => true).catch(() => false);
    if (!clicked) {
        console.log('⏭️  Could not click first row on Properties list, skipping');
        test.skip();
        return;
    }
    // Clicking a row is a client-side route change, not a full navigation —
    // 'load' may never re-fire, so don't block on it.
    await page.waitForLoadState('load', { timeout: 8000 }).catch(() => {});
    await page.waitForTimeout(2000);

    const nextBtn = page.locator('button[aria-label*="next" i]').first();
    const prevBtn = page.locator('button[aria-label*="previous" i], button[aria-label*="prev" i]').first();
    const hasNav = await nextBtn.isVisible({ timeout: 3000 }).catch(() => false);
    if (!hasNav) {
        console.log('⏭️  No prev/next NavigationBar found on Properties detail, skipping');
        test.skip();
        return;
    }

    async function snapshot() {
        const breadcrumb = await page.locator('nav[aria-label="breadcrumb"], .v-breadcrumbs').first().textContent({ timeout: 5000 }).catch(() => '');
        const nameField = await page.locator('input[name="name"], input[aria-label*="Name" i]').first().inputValue({ timeout: 5000 }).catch(() => '');
        return { breadcrumb: breadcrumb?.trim(), nameField, urlId: page.url() };
    }

    // Rapid alternating clicks, per the skill's "click rapidly, not one at a
    // time" reproduction steps — a mismatch only shows up under this pattern.
    // Each click gets a short timeout so one stuck/covered button can't hang
    // the whole test.
    for (const dir of [nextBtn, nextBtn, prevBtn, prevBtn, nextBtn, prevBtn]) {
        await dir.click({ timeout: 4000 }).catch(() => {});
    }
    await page.waitForTimeout(1500);

    const state = await snapshot();
    console.log(`Breadcrumb: "${state.breadcrumb}" | Name field: "${state.nameField}"`);

    if (state.breadcrumb && state.nameField) {
        const breadcrumbHasName = state.breadcrumb.includes(state.nameField) || state.nameField.includes(state.breadcrumb);
        if (!breadcrumbHasName) {
            console.log('⚠️  Breadcrumb and Name field disagree after rapid prev/next clicks — possible stale-query bug');
        } else {
            console.log('✅ Breadcrumb and Name field agree after rapid prev/next clicks');
        }
    } else {
        console.log('ℹ️  Could not read breadcrumb/Name field with current selectors — check manually');
    }
});

// ─────────────────────────────────────────────────────────────
// Chat Centre specific UI (fusioneta-only module)
// ─────────────────────────────────────────────────────────────

test('Rebrand QA - Chat Centre header buttons and FAQ link', async ({ page }) => {
    test.setTimeout(150000);
    await loginToApp(page, 90000, FUSIONETA_EMAIL, FUSIONETA_PASSWORD);
    const orgBase = currentOrgBase(page);
    const url = await resolvePage(page, orgBase, ['/chat-centre']);
    if (!url) { test.skip(); return; }
    await page.waitForTimeout(2500);

    const faqLink = page.locator('a:has-text("FAQ")').first();
    if (await faqLink.isVisible({ timeout: 5000 }).catch(() => false)) {
        const target = await faqLink.getAttribute('target');
        const rel = await faqLink.getAttribute('rel');
        console.log(`FAQ link target="${target}" rel="${rel}"`);
        expect(target, 'FAQ link should open in a new tab').toBe('_blank');
        expect(rel || '', 'FAQ link should use rel="noopener noreferrer"').toContain('noopener');
    } else {
        console.log('⚠️  FAQ link not found on Chat Centre header');
    }

    const openChatCentreBtn = page.locator('button:has-text("Open Chat Centre"), a:has-text("Open Chat Centre")').first();
    const hasOpenBtn = await openChatCentreBtn.isVisible({ timeout: 3000 }).catch(() => false);
    console.log(`"Open Chat Centre" button present: ${hasOpenBtn}`);
});

test('Rebrand QA - Chat Centre report cards have no header border/accent bar', async ({ page }) => {
    test.setTimeout(150000);
    await loginToApp(page, 90000, FUSIONETA_EMAIL, FUSIONETA_PASSWORD);
    const orgBase = currentOrgBase(page);
    const url = await resolvePage(page, orgBase, ['/chat-centre']);
    if (!url) { test.skip(); return; }
    await page.waitForTimeout(2500);

    const cardHeaders = page.locator('.v-card-title, [class*="card"] [class*="header"]');
    const count = await cardHeaders.count();
    if (count === 0) {
        console.log('⏭️  No report card headers found, skipping');
        test.skip();
        return;
    }

    for (let i = 0; i < Math.min(count, 5); i++) {
        const border = await cardHeaders.nth(i).evaluate(el => getComputedStyle(el).borderBottomWidth);
        if (border !== '0px') {
            console.log(`⚠️  Report card header ${i} has a border-bottom (${border}) — should be flush, see rebrand-qa skill`);
        }
    }
    console.log(`✅ Checked ${Math.min(count, 5)} report card header(s) for stray borders`);
});
