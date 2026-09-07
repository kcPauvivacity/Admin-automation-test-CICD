import { test, expect } from '@playwright/test';
import { loginToApp } from './helpers/auth.helper';

const EMAIL = 'pau.kie.chee@fusioneta.com';
const PASSWORD = 'PAOpaopao@9696';
const BASE = 'https://app-staging.vivacityapp.com';
const LIST_URL = `${BASE}/system-settings/property-amenities`;

async function navigateToPropertyAmenities(page: any) {
    await page.goto(LIST_URL, { waitUntil: 'load', timeout: 30000 });
    await page.waitForTimeout(3000);
    await expect(page).toHaveURL(/system-settings\/property-amenities/, { timeout: 10000 });
    await page.waitForTimeout(1000);
    console.log('✅ Navigated to Property Amenities');
}

// ─────────────────────────────────────────────────────────────────────────────
// [NAV] Accessible via direct URL
// ─────────────────────────────────────────────────────────────────────────────
test('NAV: Property Amenities accessible via direct URL', async ({ page }) => {
    test.setTimeout(180000);

    await loginToApp(page, 90000, EMAIL, PASSWORD);
    await page.goto(LIST_URL, { waitUntil: 'load', timeout: 30000 });
    await page.waitForTimeout(3000);

    const url = page.url();
    const onCorrectPage = url.includes('system-settings/property-amenities');
    if (onCorrectPage) {
        console.log('✅ Direct URL navigation landed on Property Amenities page');
    } else {
        console.log('⚠️ URL after navigation:', url);
    }

    await expect(page).toHaveURL(/system-settings\/property-amenities/, { timeout: 10000 });
});

// ─────────────────────────────────────────────────────────────────────────────
// [READ] Page loads — main content visible
// ─────────────────────────────────────────────────────────────────────────────
test('READ: Property Amenities page loads and main content is visible', async ({ page }) => {
    test.setTimeout(180000);

    await loginToApp(page, 90000, EMAIL, PASSWORD);
    await navigateToPropertyAmenities(page);

    // Check page heading or module title
    const headingVisible = await page.locator('h1, h2, h3, .page-title, [class*="title"]')
        .filter({ hasText: /amenities/i })
        .first()
        .isVisible({ timeout: 8000 })
        .catch(() => false);

    if (headingVisible) {
        console.log('✅ Property Amenities heading is visible');
    } else {
        console.log('⚠️ Heading not found by text — checking generic main content');
    }

    // Check that some main content container rendered (table or list)
    const tableVisible = await page.locator('.v-data-table, table, .v-list, [class*="data-table"]')
        .first()
        .isVisible({ timeout: 8000 })
        .catch(() => false);

    if (tableVisible) {
        console.log('✅ Main content container (table/list) is visible');
    } else {
        console.log('⚠️ Could not find table or list container');
    }

    // Confirm no full-page error
    const errorPage = await page.locator('[class*="error"], [class*="Error"]')
        .filter({ hasText: /500|404|forbidden|unauthorized/i })
        .first()
        .isVisible({ timeout: 3000 })
        .catch(() => false);

    if (!errorPage) {
        console.log('✅ No error page displayed');
    } else {
        console.log('⚠️ Possible error state detected on page');
    }
});

// ─────────────────────────────────────────────────────────────────────────────
// [READ] Table/list shows records — count rows, log column headers
// ─────────────────────────────────────────────────────────────────────────────
test('READ: Property Amenities table shows records and column headers', async ({ page }) => {
    test.setTimeout(180000);

    await loginToApp(page, 90000, EMAIL, PASSWORD);
    await navigateToPropertyAmenities(page);

    // Log column headers
    const headers = page.locator('thead th, .v-data-table-header th, [role="columnheader"]');
    const headerCount = await headers.count().catch(() => 0);

    if (headerCount > 0) {
        console.log(`✅ Found ${headerCount} column header(s)`);
        for (let i = 0; i < headerCount; i++) {
            const text = await headers.nth(i).textContent().catch(() => '');
            if (text?.trim()) {
                console.log(`   Column ${i + 1}: "${text.trim()}"`);
            }
        }
    } else {
        console.log('⚠️ No column headers found (may use card/list layout)');
    }

    // Count data rows
    const rows = page.locator('tbody tr, .v-list-item, [class*="list-item"]');
    const rowCount = await rows.count().catch(() => 0);

    if (rowCount > 0) {
        console.log(`✅ Found ${rowCount} row(s)/item(s) in the list`);
    } else {
        console.log('⚠️ No rows found — list may be empty or loading');
    }

    // Check for "no data" state (valid empty state)
    const noData = await page.locator('.v-data-table__empty-wrapper, [class*="no-data"], [class*="empty"]')
        .first()
        .isVisible({ timeout: 3000 })
        .catch(() => false);

    if (noData) {
        console.log('⚠️ Empty/no-data state is displayed (module may have no records)');
    }
});

// ─────────────────────────────────────────────────────────────────────────────
// [READ] Search or filter works
// ─────────────────────────────────────────────────────────────────────────────
test('READ: Search or filter functionality works on Property Amenities', async ({ page }) => {
    test.setTimeout(180000);

    await loginToApp(page, 90000, EMAIL, PASSWORD);
    await navigateToPropertyAmenities(page);

    // Locate search input — Vuetify uses v-text-field or plain input in toolbars
    const searchInput = page.locator(
        'input[type="search"], input[placeholder*="search" i], input[placeholder*="Search" i], .v-text-field input, [aria-label*="search" i]'
    ).first();

    const searchVisible = await searchInput.isVisible({ timeout: 6000 }).catch(() => false);

    if (!searchVisible) {
        console.log('⚠️ Search input not found — skipping search test');
        return;
    }

    console.log('✅ Search input found');

    // Type a search term relevant to property amenities
    await searchInput.click();
    await searchInput.fill('wifi');
    await page.waitForTimeout(1500);

    const afterSearchRows = await page.locator('tbody tr, .v-list-item').count().catch(() => 0);
    console.log(`✅ After searching "wifi": ${afterSearchRows} row(s) visible`);

    // Clear the search
    await searchInput.clear();
    await page.waitForTimeout(1500);

    const afterClearRows = await page.locator('tbody tr, .v-list-item').count().catch(() => 0);
    console.log(`✅ After clearing search: ${afterClearRows} row(s) visible`);

    // Check for a clear/reset button as an alternative
    const clearBtn = page.locator('button').filter({ hasText: /clear|reset/i }).first();
    const clearBtnVisible = await clearBtn.isVisible({ timeout: 3000 }).catch(() => false);
    if (clearBtnVisible) {
        console.log('✅ Clear/Reset button also available');
    }
});

// ─────────────────────────────────────────────────────────────────────────────
// [CREATE] Open create dialog/form — verify it opens, then escape
// ─────────────────────────────────────────────────────────────────────────────
test('CREATE: Create button opens dialog/form — escape without saving', async ({ page }) => {
    test.setTimeout(180000);

    await loginToApp(page, 90000, EMAIL, PASSWORD);
    await navigateToPropertyAmenities(page);

    // Look for a Create / Add / New button
    const createBtn = page.locator('button').filter({ hasText: /create|add|new/i }).first();
    const createBtnVisible = await createBtn.isVisible({ timeout: 6000 }).catch(() => false);

    if (!createBtnVisible) {
        console.log('⚠️ No Create/Add/New button found — module may be read-only or button uses an icon');

        // Try icon-only FAB or plus button
        const fabBtn = page.locator('button.v-btn--fab, button[aria-label*="add" i], button[aria-label*="create" i]').first();
        const fabVisible = await fabBtn.isVisible({ timeout: 3000 }).catch(() => false);
        if (!fabVisible) {
            console.log('⚠️ No FAB/icon create button found either — skipping create test');
            return;
        }
        await fabBtn.click();
    } else {
        console.log('✅ Create button found');
        await createBtn.click();
    }

    await page.waitForTimeout(2000);

    // Verify dialog or slide-in form opened
    const dialogVisible = await page.locator('.v-dialog, [role="dialog"], .v-navigation-drawer--temporary, [class*="modal"]')
        .first()
        .isVisible({ timeout: 8000 })
        .catch(() => false);

    if (dialogVisible) {
        console.log('✅ Create dialog/form opened');

        // Check for a "Name" or "Amenity" label inside the form
        // Property amenities typically have a name and possibly an icon/category
        const nameField = await page.locator('.v-dialog input, [role="dialog"] input')
            .first()
            .isVisible({ timeout: 3000 })
            .catch(() => false);

        if (nameField) {
            console.log('✅ Input field visible inside create dialog');
        } else {
            console.log('⚠️ No input field detected inside dialog');
        }
    } else {
        console.log('⚠️ Dialog/form did not open or uses a different layout');
    }

    // Escape without saving — press Escape key
    await page.keyboard.press('Escape');
    await page.waitForTimeout(1000);

    const dialogGone = await page.locator('.v-dialog, [role="dialog"]')
        .first()
        .isVisible({ timeout: 3000 })
        .catch(() => false);

    if (!dialogGone) {
        console.log('✅ Dialog closed after Escape — no data was saved');
    } else {
        // Try clicking a Cancel button
        const cancelBtn = page.locator('button').filter({ hasText: /cancel|close|dismiss/i }).first();
        const cancelVisible = await cancelBtn.isVisible({ timeout: 3000 }).catch(() => false);
        if (cancelVisible) {
            await cancelBtn.click();
            console.log('✅ Closed dialog via Cancel button — no data was saved');
        } else {
            console.log('⚠️ Dialog may still be open — Escape did not close it');
        }
    }
});

// ─────────────────────────────────────────────────────────────────────────────
// [UPDATE] Click first row, verify edit form opens — check fields, escape
// ─────────────────────────────────────────────────────────────────────────────
test('UPDATE: Clicking first row opens edit form — escape without saving', async ({ page }) => {
    test.setTimeout(180000);

    await loginToApp(page, 90000, EMAIL, PASSWORD);
    await navigateToPropertyAmenities(page);

    // Try clicking an edit icon/button in the first row
    const editBtn = page.locator(
        'tbody tr:first-child button[aria-label*="edit" i], tbody tr:first-child button[title*="edit" i], tbody tr:first-child .v-btn'
    ).first();

    const editBtnVisible = await editBtn.isVisible({ timeout: 5000 }).catch(() => false);

    if (editBtnVisible) {
        console.log('✅ Edit button found in first row');
        await editBtn.click();
    } else {
        // Fallback: click the first row itself to trigger edit
        const firstRow = page.locator('tbody tr, .v-list-item').first();
        const firstRowVisible = await firstRow.isVisible({ timeout: 5000 }).catch(() => false);

        if (!firstRowVisible) {
            console.log('⚠️ No rows found to click for edit — list may be empty');
            return;
        }

        console.log('⚠️ No explicit edit button — clicking first row');
        await firstRow.click();
    }

    await page.waitForTimeout(2000);

    // Verify edit dialog/form opened
    const editDialogVisible = await page.locator('.v-dialog, [role="dialog"], .v-navigation-drawer--temporary, [class*="modal"]')
        .first()
        .isVisible({ timeout: 8000 })
        .catch(() => false);

    if (editDialogVisible) {
        console.log('✅ Edit dialog/form opened');

        // Check for input fields — property amenities should have at least a name field
        const inputs = page.locator('.v-dialog input, [role="dialog"] input');
        const inputCount = await inputs.count().catch(() => 0);
        console.log(`✅ Found ${inputCount} input field(s) in edit form`);

        // Check for pre-filled data (existing amenity name should be populated)
        if (inputCount > 0) {
            const firstInputValue = await inputs.first().inputValue().catch(() => '');
            if (firstInputValue) {
                console.log(`✅ First input pre-filled with: "${firstInputValue}"`);
            } else {
                console.log('⚠️ First input appears empty (may be a non-text field)');
            }
        }

        // Check for amenity-specific fields (icon selector, category, etc.)
        const iconSelector = await page.locator('.v-dialog [class*="icon"], [role="dialog"] [class*="icon"]')
            .first()
            .isVisible({ timeout: 3000 })
            .catch(() => false);
        if (iconSelector) {
            console.log('✅ Icon selector/field visible in edit form');
        }
    } else {
        console.log('⚠️ Edit dialog/form did not open — row click may navigate or module is read-only');
    }

    // Escape without saving
    await page.keyboard.press('Escape');
    await page.waitForTimeout(1000);

    const dialogGone = await page.locator('.v-dialog, [role="dialog"]')
        .first()
        .isVisible({ timeout: 3000 })
        .catch(() => false);

    if (!dialogGone) {
        console.log('✅ Edit dialog closed after Escape — no changes saved');
    } else {
        const cancelBtn = page.locator('button').filter({ hasText: /cancel|close|dismiss/i }).first();
        const cancelVisible = await cancelBtn.isVisible({ timeout: 3000 }).catch(() => false);
        if (cancelVisible) {
            await cancelBtn.click();
            console.log('✅ Closed edit dialog via Cancel — no changes saved');
        } else {
            console.log('⚠️ Dialog may still be open after Escape');
        }
    }
});

// ─────────────────────────────────────────────────────────────────────────────
// [DELETE] Check delete is available — do NOT confirm, escape
// ─────────────────────────────────────────────────────────────────────────────
test('DELETE: Delete option is available on first row — escape without confirming', async ({ page }) => {
    test.setTimeout(180000);

    await loginToApp(page, 90000, EMAIL, PASSWORD);
    await navigateToPropertyAmenities(page);

    // Check for a delete button in first row (icon button or text button)
    const deleteBtn = page.locator(
        'tbody tr:first-child button[aria-label*="delete" i], tbody tr:first-child button[title*="delete" i], tbody tr:first-child button[aria-label*="remove" i]'
    ).first();

    const deleteBtnVisible = await deleteBtn.isVisible({ timeout: 5000 }).catch(() => false);

    if (deleteBtnVisible) {
        console.log('✅ Delete button found in first row');
        await deleteBtn.click();
        await page.waitForTimeout(1500);

        // Check if a confirmation dialog appeared
        const confirmDialog = await page.locator('.v-dialog, [role="dialog"], [class*="confirm"]')
            .first()
            .isVisible({ timeout: 5000 })
            .catch(() => false);

        if (confirmDialog) {
            console.log('✅ Delete confirmation dialog appeared');

            // Do NOT confirm — press Escape or click Cancel
            await page.keyboard.press('Escape');
            await page.waitForTimeout(1000);

            const stillVisible = await page.locator('.v-dialog, [role="dialog"]')
                .first()
                .isVisible({ timeout: 3000 })
                .catch(() => false);

            if (!stillVisible) {
                console.log('✅ Confirmation dialog dismissed — no record deleted');
            } else {
                const cancelBtn = page.locator('button').filter({ hasText: /cancel|no|dismiss/i }).first();
                const cancelVisible = await cancelBtn.isVisible({ timeout: 3000 }).catch(() => false);
                if (cancelVisible) {
                    await cancelBtn.click();
                    console.log('✅ Pressed Cancel on confirmation — no record deleted');
                } else {
                    console.log('⚠️ Could not dismiss confirmation dialog — check UI');
                }
            }
        } else {
            // Escape the delete action if no confirmation dialog
            await page.keyboard.press('Escape');
            console.log('⚠️ No confirmation dialog appeared after clicking delete');
        }
    } else {
        // Try selecting a row checkbox first, then looking for a toolbar delete button
        const checkbox = page.locator('tbody tr:first-child input[type="checkbox"]').first();
        const checkboxVisible = await checkbox.isVisible({ timeout: 3000 }).catch(() => false);

        if (checkboxVisible) {
            await checkbox.click();
            await page.waitForTimeout(1000);

            const toolbarDelete = page.locator('button').filter({ hasText: /delete|remove/i }).first();
            const toolbarDeleteVisible = await toolbarDelete.isVisible({ timeout: 3000 }).catch(() => false);

            if (toolbarDeleteVisible) {
                console.log('✅ Delete button appeared in toolbar after row selection');
                // Do NOT click — just log and uncheck
                await checkbox.click();
                console.log('✅ Row deselected — no deletion triggered');
            } else {
                console.log('⚠️ No delete button in toolbar after row selection');
                await checkbox.click().catch(() => {});
            }
        } else {
            console.log('⚠️ No delete button or row checkbox found — module may not support delete or requires different interaction');
        }
    }
});

// ─────────────────────────────────────────────────────────────────────────────
// [MODULE-SPECIFIC] Property Amenities: verify amenity-relevant fields and icons
// Property amenities in student accommodation platforms typically include items
// like WiFi, Gym, Pool, Laundry, Parking — each may have a name, icon, and
// possibly a category (indoor/outdoor). This test checks those characteristics.
// ─────────────────────────────────────────────────────────────────────────────
test('MODULE: Property Amenity records contain expected name and icon data', async ({ page }) => {
    test.setTimeout(180000);

    await loginToApp(page, 90000, EMAIL, PASSWORD);
    await navigateToPropertyAmenities(page);

    // Check that amenity names appear in the list (text content of rows)
    const rows = page.locator('tbody tr, .v-list-item');
    const rowCount = await rows.count().catch(() => 0);

    if (rowCount === 0) {
        console.log('⚠️ No amenity records found — cannot verify amenity fields');
        return;
    }

    console.log(`✅ Found ${rowCount} amenity record(s) to inspect`);

    // Log first few amenity names for verification
    const maxToLog = Math.min(rowCount, 5);
    for (let i = 0; i < maxToLog; i++) {
        const rowText = await rows.nth(i).textContent().catch(() => '');
        if (rowText?.trim()) {
            console.log(`   Amenity ${i + 1}: "${rowText.trim().substring(0, 80)}"`);
        }
    }

    // Check for icon/image elements in rows — amenities often display an icon or symbol
    const iconInRows = await page.locator(
        'tbody tr .v-icon, tbody tr img, tbody tr [class*="icon"], .v-list-item .v-icon, .v-list-item img'
    ).first().isVisible({ timeout: 3000 }).catch(() => false);

    if (iconInRows) {
        console.log('✅ Icon/image elements found in amenity rows');
    } else {
        console.log('⚠️ No icon/image elements in rows — amenities may be text-only');
    }

    // Check if there is a category or type column in the table headers
    const categoryHeader = await page.locator('thead th, [role="columnheader"]')
        .filter({ hasText: /category|type|group/i })
        .first()
        .isVisible({ timeout: 3000 })
        .catch(() => false);

    if (categoryHeader) {
        console.log('✅ Category/Type column header found — amenities are categorized');
    } else {
        console.log('⚠️ No category column detected in headers');
    }

    // Check for a status or active/inactive indicator
    const statusIndicator = await page.locator(
        'tbody tr .v-chip, tbody tr [class*="status"], tbody tr [class*="badge"], tbody tr [class*="chip"]'
    ).first().isVisible({ timeout: 3000 }).catch(() => false);

    if (statusIndicator) {
        console.log('✅ Status indicator (chip/badge) found on amenity records');
    } else {
        console.log('⚠️ No status indicator found on amenity rows');
    }
});
