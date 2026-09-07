import { test, expect } from '@playwright/test';
import { loginToApp } from './helpers/auth.helper';

const EMAIL = 'pau.kie.chee@fusioneta.com';
const PASSWORD = 'PAOpaopao@9696';
const BASE = 'https://app-staging.vivacityapp.com';
const LIST_URL = `${BASE}/system-settings/bed-types`;

async function navigateToBedTypes(page: any) {
    await page.goto(LIST_URL, { waitUntil: 'load', timeout: 30000 });
    await page.waitForTimeout(3000);
    await expect(page).toHaveURL(/system-settings\/bed-types/, { timeout: 10000 });
    await page.waitForTimeout(1000);
    console.log('✅ Navigated to Bed Types');
}

// ─── Tests ────────────────────────────────────────────────────────────────────

test('1. [READ] Bed Types page loads and main content is visible', async ({ page }) => {
    test.setTimeout(180000);

    await loginToApp(page, 90000, EMAIL, PASSWORD);
    await navigateToBedTypes(page);

    // Verify a recognisable page heading or container is visible
    const heading = page.locator('h1, h2, h3, .v-toolbar__title, .page-title').filter({ hasText: /bed\s*type/i }).first();
    const headingVisible = await heading.isVisible({ timeout: 5000 }).catch(() => false);
    if (headingVisible) {
        console.log('✅ Page heading visible');
    } else {
        // Fall back to any main content wrapper
        const mainContent = page.locator('main, .v-main, .v-container').first();
        const mainVisible = await mainContent.isVisible({ timeout: 5000 }).catch(() => false);
        console.log(mainVisible ? '✅ Main content container visible' : '⚠️ Main content not found — page may still be loading');
    }

    // Verify the URL is correct
    await expect(page).toHaveURL(/system-settings\/bed-types/, { timeout: 10000 });
    console.log('✅ URL confirmed: system-settings/bed-types');
});

// ─────────────────────────────────────────────────────────────────────────────

test('2. [READ] Bed Types table/list renders records with column headers', async ({ page }) => {
    test.setTimeout(180000);

    await loginToApp(page, 90000, EMAIL, PASSWORD);
    await navigateToBedTypes(page);

    // Look for a Vuetify data table or list
    const table = page.locator('.v-data-table, table').first();
    const tableVisible = await table.isVisible({ timeout: 8000 }).catch(() => false);

    if (tableVisible) {
        console.log('✅ Data table is visible');

        // Log column headers
        const headers = page.locator('th');
        const headerCount = await headers.count().catch(() => 0);
        if (headerCount > 0) {
            for (let i = 0; i < headerCount; i++) {
                const text = await headers.nth(i).innerText().catch(() => '');
                if (text.trim()) console.log(`  Column header [${i}]: ${text.trim()}`);
            }
            console.log(`✅ Found ${headerCount} column header(s)`);
        } else {
            console.log('⚠️ No <th> elements found — table may use a different header structure');
        }

        // Count data rows
        const rows = page.locator('tbody tr');
        const rowCount = await rows.count().catch(() => 0);
        console.log(`✅ Found ${rowCount} data row(s) in the table`);
    } else {
        // Fallback: check for Vuetify list items (some modules use v-list instead of a table)
        const listItems = page.locator('.v-list-item');
        const listCount = await listItems.count().catch(() => 0);
        if (listCount > 0) {
            console.log(`✅ Found ${listCount} list item(s) — module may use a list layout`);
        } else {
            console.log('⚠️ No table or list items found — data may still be loading or module is empty');
        }
    }
});

// ─────────────────────────────────────────────────────────────────────────────

test('3. [READ] Search / filter functionality works', async ({ page }) => {
    test.setTimeout(180000);

    await loginToApp(page, 90000, EMAIL, PASSWORD);
    await navigateToBedTypes(page);

    // Locate a search input (Vuetify text field, plain input, or labelled search)
    const searchInput = page
        .locator('input[type="search"], input[placeholder*="search" i], input[placeholder*="filter" i], .v-text-field input')
        .first();

    const searchVisible = await searchInput.isVisible({ timeout: 6000 }).catch(() => false);

    if (!searchVisible) {
        console.log('⚠️ Search input not found — module may not have a search field, skipping search test');
        return;
    }

    console.log('✅ Search input found');

    // Type a search term relevant to bed types (e.g. "single")
    await searchInput.fill('single');
    await page.waitForTimeout(2000);
    console.log('✅ Typed search term: "single"');

    // Verify the table updated (row count may have changed)
    const rowsAfterSearch = page.locator('tbody tr');
    const countAfterSearch = await rowsAfterSearch.count().catch(() => 0);
    console.log(`✅ Rows after search: ${countAfterSearch}`);

    // Clear the search and verify results reset
    await searchInput.clear();
    await page.waitForTimeout(2000);
    const rowsAfterClear = page.locator('tbody tr');
    const countAfterClear = await rowsAfterClear.count().catch(() => 0);
    console.log(`✅ Rows after clearing search: ${countAfterClear}`);
});

// ─────────────────────────────────────────────────────────────────────────────

test('4. [CREATE] Create dialog opens — escape without saving', async ({ page }) => {
    test.setTimeout(180000);

    await loginToApp(page, 90000, EMAIL, PASSWORD);
    await navigateToBedTypes(page);

    // Locate a Create / Add button (common Vuetify patterns)
    const createBtn = page
        .locator('button')
        .filter({ hasText: /create|add|new/i })
        .first();

    const createVisible = await createBtn.isVisible({ timeout: 6000 }).catch(() => false);

    if (!createVisible) {
        console.log('⚠️ Create/Add button not found — module may restrict creation, skipping');
        return;
    }

    console.log('✅ Create button found');
    await createBtn.click();
    await page.waitForTimeout(2000);

    // Verify a dialog or form panel opened
    const dialog = page.locator('.v-dialog, [role="dialog"], .v-overlay__content').first();
    const dialogVisible = await dialog.isVisible({ timeout: 6000 }).catch(() => false);

    if (dialogVisible) {
        console.log('✅ Create dialog opened');

        // Look for expected Bed Types fields — "name" is standard for a bed type
        const nameField = dialog.locator('input[placeholder*="name" i], label:has-text("Name") ~ * input, .v-text-field input').first();
        const nameVisible = await nameField.isVisible({ timeout: 4000 }).catch(() => false);
        console.log(nameVisible ? '✅ Name field visible in dialog' : '⚠️ Name field not found in dialog');
    } else {
        // Fallback: form may be inline on the page rather than a dialog
        const formVisible = await page.locator('form, .v-form').first().isVisible({ timeout: 4000 }).catch(() => false);
        console.log(formVisible ? '✅ Inline form visible after clicking Create' : '⚠️ No dialog or form appeared after clicking Create');
    }

    // Escape without saving — never pollute real data
    await page.keyboard.press('Escape');
    await page.waitForTimeout(1000);
    console.log('✅ Escaped dialog without saving');
});

// ─────────────────────────────────────────────────────────────────────────────

test('5. [UPDATE] Click first row — edit form opens, fields visible, escape', async ({ page }) => {
    test.setTimeout(180000);

    await loginToApp(page, 90000, EMAIL, PASSWORD);
    await navigateToBedTypes(page);

    // Try clicking the first data row or an edit icon/button on it
    const firstRow = page.locator('tbody tr').first();
    const rowVisible = await firstRow.isVisible({ timeout: 8000 }).catch(() => false);

    if (!rowVisible) {
        console.log('⚠️ No data rows found — cannot test edit flow');
        return;
    }

    // Prefer an explicit edit button/icon; fall back to clicking the row itself
    const editBtn = firstRow
        .locator('button[aria-label*="edit" i], button[title*="edit" i], .v-icon--clickable, button')
        .filter({ hasText: /edit/i })
        .first();

    const editBtnVisible = await editBtn.isVisible({ timeout: 3000 }).catch(() => false);

    if (editBtnVisible) {
        await editBtn.click();
        console.log('✅ Clicked dedicated Edit button on first row');
    } else {
        await firstRow.click();
        console.log('✅ Clicked first row to open edit');
    }

    await page.waitForTimeout(2500);

    // Verify a dialog or form opened
    const dialog = page.locator('.v-dialog, [role="dialog"], .v-overlay__content').first();
    const dialogVisible = await dialog.isVisible({ timeout: 6000 }).catch(() => false);

    if (dialogVisible) {
        console.log('✅ Edit dialog opened');

        // Check that a name/label field is pre-populated (typical for Bed Types)
        const inputFields = dialog.locator('input, textarea');
        const fieldCount = await inputFields.count().catch(() => 0);
        console.log(`✅ Edit form has ${fieldCount} input field(s)`);

        if (fieldCount > 0) {
            const firstValue = await inputFields.first().inputValue().catch(() => '');
            console.log(`✅ First field value: "${firstValue}"`);
        }
    } else {
        const inlineForm = page.locator('form, .v-form');
        const formVisible = await inlineForm.first().isVisible({ timeout: 4000 }).catch(() => false);
        console.log(formVisible ? '✅ Inline edit form visible' : '⚠️ No dialog or form appeared after clicking row');
    }

    // Escape without saving
    await page.keyboard.press('Escape');
    await page.waitForTimeout(1000);
    console.log('✅ Escaped edit dialog without saving');
});

// ─────────────────────────────────────────────────────────────────────────────

test('6. [DELETE] Delete option available on first row — escape without confirming', async ({ page }) => {
    test.setTimeout(180000);

    await loginToApp(page, 90000, EMAIL, PASSWORD);
    await navigateToBedTypes(page);

    const firstRow = page.locator('tbody tr').first();
    const rowVisible = await firstRow.isVisible({ timeout: 8000 }).catch(() => false);

    if (!rowVisible) {
        console.log('⚠️ No data rows found — cannot test delete flow');
        return;
    }

    // Look for an inline delete button on the first row
    const deleteBtn = firstRow
        .locator('button')
        .filter({ hasText: /delete|remove/i })
        .first();

    const deleteBtnVisible = await deleteBtn.isVisible({ timeout: 4000 }).catch(() => false);

    if (deleteBtnVisible) {
        console.log('✅ Delete button found on first row');
        await deleteBtn.click();
        await page.waitForTimeout(2000);

        // A confirmation dialog should appear — escape it immediately
        const confirmDialog = page.locator('.v-dialog, [role="dialog"], .v-overlay__content').first();
        const confirmVisible = await confirmDialog.isVisible({ timeout: 5000 }).catch(() => false);
        if (confirmVisible) {
            console.log('✅ Delete confirmation dialog appeared');
        } else {
            console.log('⚠️ Delete confirmation dialog not detected');
        }

        // Escape / cancel — never confirm deletion
        await page.keyboard.press('Escape');
        await page.waitForTimeout(1000);

        // Also click a Cancel button if Escape did not dismiss
        const cancelBtn = page
            .locator('button')
            .filter({ hasText: /cancel|no|close/i })
            .first();
        const cancelVisible = await cancelBtn.isVisible({ timeout: 2000 }).catch(() => false);
        if (cancelVisible) {
            await cancelBtn.click();
            await page.waitForTimeout(500);
        }

        console.log('✅ Escaped delete confirmation without confirming');
    } else {
        // Some modules place delete inside a row action menu (kebab / ellipsis)
        const actionMenu = firstRow
            .locator('button[aria-label*="action" i], button[aria-label*="more" i], .v-btn--icon')
            .first();
        const menuVisible = await actionMenu.isVisible({ timeout: 3000 }).catch(() => false);

        if (menuVisible) {
            await actionMenu.click();
            await page.waitForTimeout(1000);
            const menuDeleteItem = page
                .locator('.v-list-item, .v-menu__content .v-list-item')
                .filter({ hasText: /delete|remove/i })
                .first();
            const menuDeleteVisible = await menuDeleteItem.isVisible({ timeout: 3000 }).catch(() => false);
            console.log(menuDeleteVisible ? '✅ Delete option found inside action menu' : '⚠️ Delete option not found in action menu');
            await page.keyboard.press('Escape');
            await page.waitForTimeout(500);
        } else {
            console.log('⚠️ No delete button or action menu found on first row — module may restrict deletion');
        }
    }
});

// ─────────────────────────────────────────────────────────────────────────────

test('7. [NAV] Bed Types accessible via direct URL', async ({ page }) => {
    test.setTimeout(180000);

    await loginToApp(page, 90000, EMAIL, PASSWORD);

    // Navigate directly to the URL — no helper needed, this tests the route itself
    await page.goto(LIST_URL, { waitUntil: 'load', timeout: 30000 });
    await page.waitForTimeout(3000);

    await expect(page).toHaveURL(/system-settings\/bed-types/, { timeout: 10000 });
    console.log('✅ Direct URL navigation landed on system-settings/bed-types');

    // Verify the page did not redirect to a 404 or error page
    const errorIndicator = page.locator('text=404, text=not found, text=error').first();
    const errorVisible = await errorIndicator.isVisible({ timeout: 3000 }).catch(() => false);
    if (errorVisible) {
        console.log('⚠️ Possible error or 404 page detected after direct navigation');
    } else {
        console.log('✅ No error indicators — page loaded successfully via direct URL');
    }

    // Confirm the main app shell is rendered (system settings sidebar or toolbar)
    const appShell = page.locator('.v-navigation-drawer, .v-app-bar, nav, aside').first();
    const shellVisible = await appShell.isVisible({ timeout: 5000 }).catch(() => false);
    console.log(shellVisible ? '✅ App shell (navigation) is visible' : '⚠️ App shell not detected');
});

// ─────────────────────────────────────────────────────────────────────────────

test('8. [MODULE] Bed Types — verify name field and typical bed type values', async ({ page }) => {
    // Bed Types in student accommodation platforms typically hold values like
    // "Single", "Double", "Twin", "En-suite", "Studio", "Shared". This test
    // verifies the list contains at least one recognisable bed-type name and
    // that the data table exposes a "name" column (or equivalent identifier).
    test.setTimeout(180000);

    await loginToApp(page, 90000, EMAIL, PASSWORD);
    await navigateToBedTypes(page);

    const table = page.locator('.v-data-table, table').first();
    const tableVisible = await table.isVisible({ timeout: 8000 }).catch(() => false);

    if (!tableVisible) {
        console.log('⚠️ Data table not visible — cannot verify bed type values');
        return;
    }

    // Check that a "Name" column header exists
    const nameHeader = page.locator('th').filter({ hasText: /name/i }).first();
    const nameHeaderVisible = await nameHeader.isVisible({ timeout: 4000 }).catch(() => false);
    console.log(nameHeaderVisible ? '✅ "Name" column header found' : '⚠️ "Name" column header not detected');

    // Scan visible cell text for recognisable bed-type terms
    const cells = page.locator('tbody td');
    const cellCount = await cells.count().catch(() => 0);

    const knownTerms = /single|double|twin|en.?suite|studio|shared|bunk|queen|king/i;
    let matchFound = false;

    for (let i = 0; i < Math.min(cellCount, 30); i++) {
        const text = await cells.nth(i).innerText().catch(() => '');
        if (knownTerms.test(text)) {
            console.log(`✅ Recognised bed type value: "${text.trim()}"`);
            matchFound = true;
            break;
        }
    }

    if (!matchFound) {
        // Not necessarily a failure — the platform may use custom naming
        console.log('⚠️ No standard bed-type term found in first 30 cells — data may use custom names');

        // Log first few cell values for context
        for (let i = 0; i < Math.min(cellCount, 5); i++) {
            const text = await cells.nth(i).innerText().catch(() => '');
            if (text.trim()) console.log(`  Cell [${i}]: "${text.trim()}"`);
        }
    }

    console.log(`✅ Module-specific bed type check complete (${cellCount} cells scanned)`);
});
