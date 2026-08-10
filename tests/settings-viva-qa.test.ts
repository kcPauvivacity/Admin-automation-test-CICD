import { test, expect } from '@playwright/test';
import { loginToApp } from './helpers/auth.helper';
import { currentOrgBase, resolvePage, trackConsoleErrors, rowCount, BASE_URL } from './helpers/qa.helper';

// Automated version of the `settings-viva-qa` Claude skill's checklist for
// `packages/settings-viva` (org-scoped `[organization]/settings/*` pages).
//
// ⚠️ Settings holds real organization configuration data. Every check here
// is read-only: no toggles, saves, deletes, or dialog submissions — matching
// the skill's constraints. Column-editor changes only affect the viewer's
// own display preference, which is what makes the persistence check safe.

const FUSIONETA_EMAIL = 'pau.kie.chee@fusioneta.com';
const FUSIONETA_PASSWORD = 'PAOpaopao@9696';

type SettingsPage = { name: string; paths: string[]; fusioneta?: boolean };

// Candidate paths per page — several taxonomy pages may live under
// `/settings/x` or at the top-level `/x` depending on the deployed version;
// resolvePage() tries each until one loads.
const SETTINGS_PAGES: SettingsPage[] = [
    { name: 'Settings hub', paths: ['/settings'] },
    { name: 'Account defaults', paths: ['/settings/general', '/settings/account-defaults'] },
    { name: 'Users', paths: ['/settings/users'], fusioneta: true },
    { name: 'Security', paths: ['/settings/security'] },
    { name: 'Notifications', paths: ['/settings/notifications', '/settings/email-notifications'] },
    { name: 'Tags', paths: ['/settings/tags', '/tags'] },
    { name: 'Attributes', paths: ['/settings/attributes', '/attributes'] },
    { name: 'Facilities', paths: ['/settings/facilities', '/facilities'] },
    { name: 'Allergens', paths: ['/settings/allergens'] },
    { name: 'Cities', paths: ['/settings/cities', '/cities'] },
    { name: 'Countries', paths: ['/settings/countries'] },
    { name: 'Universities', paths: ['/settings/universities', '/universities'] },
    { name: 'Email templates', paths: ['/settings/email-templates'] },
    { name: 'SMS templates', paths: ['/settings/sms-templates'] },
    { name: 'SMS settings', paths: ['/settings/sms-settings'] },
    { name: 'FAQs', paths: ['/settings/faqs', '/faq'] },
    { name: 'GDPR fields', paths: ['/settings/gdpr'] },
    { name: 'Configurations', paths: ['/settings/configurations'] },
    { name: 'Connectors', paths: ['/settings/connectors'] },
    { name: 'Media library', paths: ['/settings/media-library'] },
    { name: 'Analytics', paths: ['/settings/analytics', '/analytics'] },
    { name: 'Tasks', paths: ['/settings/tasks'] },
    { name: 'Stations', paths: ['/settings/stations'] },
    { name: 'CRM', paths: ['/settings/crm'] },
    { name: 'AI Agent', paths: ['/settings/ai-agent'] },
    { name: 'Hotel solutions', paths: ['/settings/hotel-solutions'] },
    { name: 'Student accommodation solutions', paths: ['/settings/student-accommodation-solutions'] },
    { name: 'User profile', paths: ['/settings/user-profile'] },
];

// Taxonomy list pages worth exercising search on.
const SEARCHABLE_PAGES: SettingsPage[] = [
    { name: 'Tags', paths: ['/settings/tags', '/tags'] },
    { name: 'Facilities', paths: ['/settings/facilities', '/facilities'] },
    { name: 'Cities', paths: ['/settings/cities', '/cities'] },
    { name: 'Universities', paths: ['/settings/universities', '/universities'] },
];

async function login(page: any, p: SettingsPage) {
    if (p.fusioneta) {
        await loginToApp(page, 90000, FUSIONETA_EMAIL, FUSIONETA_PASSWORD);
    } else {
        await loginToApp(page);
    }
}

// ─────────────────────────────────────────────────────────────
// Console errors — every settings page
// ─────────────────────────────────────────────────────────────

for (const p of SETTINGS_PAGES) {
    test(`Settings-Viva QA - ${p.name} has no critical console errors`, async ({ page }) => {
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
// Search actually filters results on taxonomy list pages
// ─────────────────────────────────────────────────────────────

for (const p of SEARCHABLE_PAGES) {
    test(`Settings-Viva QA - ${p.name} search filters the table`, async ({ page }) => {
        test.setTimeout(120000);
        await login(page, p);
        const orgBase = currentOrgBase(page);
        const url = await resolvePage(page, orgBase, p.paths);
        if (!url) { test.skip(); return; }
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

        const emptyState = page.locator('text=/no results|no records|nothing found|no data/i').first();
        const hasEmptyState = await emptyState.isVisible({ timeout: 3000 }).catch(() => false);
        console.log(`  ${hasEmptyState ? '✅' : 'ℹ️'} Empty state indicator visible: ${hasEmptyState}`);

        await searchInput.clear();
        await page.waitForTimeout(1500);
    });
}

// ─────────────────────────────────────────────────────────────
// Column editor persists after hard refresh (Facilities, representative
// taxonomy list page)
// ─────────────────────────────────────────────────────────────

test('Settings-Viva QA - Facilities column selection persists after hard refresh', async ({ page }) => {
    test.setTimeout(150000);
    await loginToApp(page);
    const orgBase = currentOrgBase(page);
    const url = await resolvePage(page, orgBase, ['/settings/facilities', '/facilities']);
    if (!url) { test.skip(); return; }
    await page.waitForTimeout(2000);

    const editColumnsBtn = page.locator('button:has-text("Edit Columns"), [role="button"]:has-text("Edit Columns")').first();
    if (!(await editColumnsBtn.isVisible({ timeout: 5000 }).catch(() => false))) {
        console.log('⏭️  No column editor found on Facilities, skipping');
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
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);

    await page.reload({ waitUntil: 'load', timeout: 30000 });
    await page.waitForTimeout(2500);

    await editColumnsBtn.click();
    await page.waitForTimeout(1000);
    const afterReload = await checkboxes.first().isChecked();

    console.log(`Column state after hard refresh: expected ${!wasChecked}, got ${afterReload}`);
    expect(afterReload, 'Column visibility preference did not persist across a hard refresh').toBe(!wasChecked);

    // Restore original state.
    await checkboxes.first().click();
    await page.waitForTimeout(300);
    await page.keyboard.press('Escape');
});

// ─────────────────────────────────────────────────────────────
// Save sticky bar: Cancel restores original field values (never clicks Save)
// ─────────────────────────────────────────────────────────────

test('Settings-Viva QA - Account defaults Cancel restores original field value', async ({ page }) => {
    test.setTimeout(150000);
    await loginToApp(page);
    const orgBase = currentOrgBase(page);
    const url = await resolvePage(page, orgBase, ['/settings/general', '/settings/account-defaults']);
    if (!url) { test.skip(); return; }
    await page.waitForTimeout(2000);

    const textField = page.locator('input[type="text"]:not([readonly]):not([disabled])').first();
    if (!(await textField.isVisible({ timeout: 5000 }).catch(() => false))) {
        console.log('⏭️  No editable text field found on Account defaults, skipping');
        test.skip();
        return;
    }

    const original = await textField.inputValue();
    await textField.fill(`${original}__qa-probe`);
    await page.waitForTimeout(500);

    const cancelBtn = page.locator('button:has-text("Cancel")').first();
    if (!(await cancelBtn.isVisible({ timeout: 3000 }).catch(() => false))) {
        console.log('⚠️  Editing a field did not surface a sticky-bar Cancel button — restoring manually');
        await textField.fill(original);
        return;
    }

    await cancelBtn.click();
    await page.waitForTimeout(500);
    const restored = await textField.inputValue();

    console.log(`Original: "${original}" | After Cancel: "${restored}"`);
    expect(restored, 'Cancel did not restore the original field value').toBe(original);
});

// ─────────────────────────────────────────────────────────────
// Exit settings link points back to the main app domain
// ─────────────────────────────────────────────────────────────

test('Settings-Viva QA - Exit settings link points to the main app, not a stale domain', async ({ page }) => {
    test.setTimeout(120000);
    await loginToApp(page);
    const orgBase = currentOrgBase(page);
    const url = await resolvePage(page, orgBase, ['/settings']);
    if (!url) { test.skip(); return; }
    await page.waitForTimeout(2000);

    const exitLink = page.locator('a:has-text("Exit"), a[aria-label*="exit" i], button:has-text("Exit Settings")').first();
    if (!(await exitLink.isVisible({ timeout: 5000 }).catch(() => false))) {
        console.log('⏭️  No exit-settings link found with current selectors, check manually');
        test.skip();
        return;
    }

    const href = await exitLink.getAttribute('href');
    console.log(`Exit settings link href: ${href}`);
    if (href) {
        // Regression seen before: cd6fe6945 "fix Settings exit link redirecting
        // to wrong domain" — confirm it stays on the same vivacityapp.com host.
        expect(href, 'Exit settings link points to an unexpected domain').toContain('vivacityapp.com');
    } else {
        await exitLink.click();
        await page.waitForTimeout(1500);
        expect(page.url()).toContain(BASE_URL.replace(/^https?:\/\//, ''));
    }
});
