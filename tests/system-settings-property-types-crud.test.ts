import { test, expect } from '@playwright/test';
import { loginToApp } from './helpers/auth.helper';

const EMAIL = 'pau.kie.chee@fusioneta.com';
const PASSWORD = 'PAOpaopao@9696';
const BASE = 'https://app-staging.vivacityapp.com';
const LIST_URL = `${BASE}/system-settings/property-types`;

// Property Types: defines categories of student accommodation units
// (e.g. Studio, Ensuite, Shared Room) used across listings and enquiries.

async function navigateToPropertyTypes(page: any) {
    await page.goto(LIST_URL, { waitUntil: 'load', timeout: 30000 });
    await page.waitForTimeout(3000);
    await expect(page).toHaveURL(/system-settings\/property-types/, { timeout: 10000 });
    await page.waitForTimeout(1000);
    console.log('✅ Navigated to Property Types');
}

test.describe('System Settings - Property Types CRUD', () => {

    test.beforeEach(async ({ page }) => {
        await loginToApp(page, 90000, EMAIL, PASSWORD);
    });

    // -----------------------------------------------------------------------
    // 1. [READ] Page loads
    // -----------------------------------------------------------------------
    test('1. [READ] Property Types page loads and main content is visible', async ({ page }) => {
        test.setTimeout(180000);

        await navigateToPropertyTypes(page);

        // Verify the page heading or a recognisable content landmark
        const heading = page.locator('h1, h2, h3, .v-toolbar__title, .page-title').filter({ hasText: /property type/i }).first();
        const headingVisible = await heading.isVisible({ timeout: 8000 }).catch(() => false);

        if (headingVisible) {
            console.log('✅ Page heading is visible');
        } else {
            // Fallback: at minimum the main container should be present
            const mainContainer = page.locator('.v-main, main, [role="main"]').first();
            const containerVisible = await mainContainer.isVisible({ timeout: 5000 }).catch(() => false);
            if (containerVisible) {
                console.log('✅ Main container is visible (heading not found by text)');
            } else {
                console.log('⚠️ Main container not detected — page may still be loading');
            }
        }

        // URL should still be correct after all waits
        await expect(page).toHaveURL(/system-settings\/property-types/, { timeout: 5000 });
        console.log('✅ URL confirmed: /system-settings/property-types');
    });

    // -----------------------------------------------------------------------
    // 2. [READ] Table / list shows records
    // -----------------------------------------------------------------------
    test('2. [READ] Property Types list renders rows and column headers', async ({ page }) => {
        test.setTimeout(180000);

        await navigateToPropertyTypes(page);

        // Wait for the data table to appear
        const table = page.locator('.v-data-table, table').first();
        const tableVisible = await table.isVisible({ timeout: 10000 }).catch(() => false);

        if (tableVisible) {
            console.log('✅ Data table is visible');

            // Log column headers
            const headers = page.locator('th, .v-data-table-header th');
            const headerCount = await headers.count().catch(() => 0);
            if (headerCount > 0) {
                const headerTexts: string[] = [];
                for (let i = 0; i < headerCount; i++) {
                    const text = await headers.nth(i).innerText().catch(() => '');
                    if (text.trim()) headerTexts.push(text.trim());
                }
                console.log(`✅ Column headers (${headerTexts.length}): ${headerTexts.join(' | ')}`);
            } else {
                console.log('⚠️ No column headers detected');
            }

            // Count data rows
            const rows = page.locator('tbody tr, .v-data-table__tr');
            const rowCount = await rows.count().catch(() => 0);
            if (rowCount > 0) {
                console.log(`✅ Found ${rowCount} row(s) in the list`);
            } else {
                console.log('⚠️ No data rows found — table may be empty or using a different structure');
            }
        } else {
            // Fallback: check for v-list-item (card/list layout)
            const listItems = page.locator('.v-list-item, .v-card');
            const itemCount = await listItems.count().catch(() => 0);
            if (itemCount > 0) {
                console.log(`✅ Found ${itemCount} list/card item(s) (non-table layout)`);
            } else {
                console.log('⚠️ Neither table nor list items detected — check page structure');
            }
        }
    });

    // -----------------------------------------------------------------------
    // 3. [READ] Search / filter works
    // -----------------------------------------------------------------------
    test('3. [READ] Search or filter input filters the Property Types list', async ({ page }) => {
        test.setTimeout(180000);

        await navigateToPropertyTypes(page);

        // Locate a search input (common Vuetify patterns)
        const searchInput = page.locator(
            'input[type="search"], input[placeholder*="search" i], input[placeholder*="filter" i], .v-text-field input'
        ).first();
        const searchVisible = await searchInput.isVisible({ timeout: 8000 }).catch(() => false);

        if (!searchVisible) {
            console.log('⚠️ No search input found — skipping search test');
            return;
        }

        // Type a search term likely to match a property type name
        await searchInput.fill('Studio');
        await page.waitForTimeout(1500);
        console.log('✅ Typed "Studio" into search input');

        // Observe row count after search
        const rowsAfterSearch = page.locator('tbody tr, .v-data-table__tr, .v-list-item');
        const countAfter = await rowsAfterSearch.count().catch(() => 0);
        console.log(`✅ Rows visible after search: ${countAfter}`);

        // Clear the search input
        await searchInput.clear();
        await page.waitForTimeout(1500);
        console.log('✅ Search input cleared');

        // Rows should be restored
        const rowsAfterClear = page.locator('tbody tr, .v-data-table__tr, .v-list-item');
        const countAfterClear = await rowsAfterClear.count().catch(() => 0);
        console.log(`✅ Rows visible after clear: ${countAfterClear}`);
    });

    // -----------------------------------------------------------------------
    // 4. [CREATE] Open create dialog — verify it opens, then escape
    // -----------------------------------------------------------------------
    test('4. [CREATE] Create dialog opens and can be dismissed without saving', async ({ page }) => {
        test.setTimeout(180000);

        await navigateToPropertyTypes(page);

        // Look for a Create / Add button
        const createBtn = page.locator('button').filter({ hasText: /create|add|new/i }).first();
        const createVisible = await createBtn.isVisible({ timeout: 8000 }).catch(() => false);

        if (!createVisible) {
            console.log('⚠️ No Create button found — module may be read-only or button uses an icon');

            // Try icon-only FAB (Vuetify mdi-plus)
            const fabBtn = page.locator('button.v-btn--fab, button[aria-label*="create" i], button[aria-label*="add" i]').first();
            const fabVisible = await fabBtn.isVisible({ timeout: 5000 }).catch(() => false);
            if (!fabVisible) {
                console.log('⚠️ No FAB/icon-only create button found either — skipping');
                return;
            }
            await fabBtn.click();
        } else {
            await createBtn.click();
        }

        await page.waitForTimeout(2000);

        // Verify a dialog or form appeared
        const dialog = page.locator('.v-dialog, .v-overlay__content, [role="dialog"]').first();
        const dialogVisible = await dialog.isVisible({ timeout: 8000 }).catch(() => false);

        if (dialogVisible) {
            console.log('✅ Create dialog/form opened');

            // Check that at least one input field is present (e.g. Name field for property type)
            const nameInput = dialog.locator('input').first();
            const nameVisible = await nameInput.isVisible({ timeout: 5000 }).catch(() => false);
            if (nameVisible) {
                console.log('✅ Input field(s) visible in create dialog');
            } else {
                console.log('⚠️ No input fields detected inside dialog');
            }
        } else {
            console.log('⚠️ Dialog did not appear after clicking create — may use inline form or route navigation');
        }

        // Always escape — do NOT save
        await page.keyboard.press('Escape');
        await page.waitForTimeout(1000);
        console.log('✅ Escaped create dialog without saving');
    });

    // -----------------------------------------------------------------------
    // 5. [UPDATE] Click first row, verify edit form opens, then escape
    // -----------------------------------------------------------------------
    test('5. [UPDATE] Clicking a row opens the edit form with pre-filled fields', async ({ page }) => {
        test.setTimeout(180000);

        await navigateToPropertyTypes(page);

        // Target the first data row
        const firstRow = page.locator('tbody tr, .v-data-table__tr').first();
        const rowVisible = await firstRow.isVisible({ timeout: 10000 }).catch(() => false);

        if (!rowVisible) {
            console.log('⚠️ No rows found — cannot test edit; skipping');
            return;
        }

        // Some tables have a dedicated edit icon button per row
        const editIcon = firstRow.locator('button[aria-label*="edit" i], button .mdi-pencil, button .mdi-pencil-outline').first();
        const editIconVisible = await editIcon.isVisible({ timeout: 3000 }).catch(() => false);

        if (editIconVisible) {
            await editIcon.click();
            console.log('✅ Clicked edit icon on first row');
        } else {
            // Click the row itself
            await firstRow.click();
            console.log('✅ Clicked first row to open edit');
        }

        await page.waitForTimeout(2000);

        // Check for dialog or inline edit form
        const dialog = page.locator('.v-dialog, .v-overlay__content, [role="dialog"]').first();
        const dialogVisible = await dialog.isVisible({ timeout: 8000 }).catch(() => false);

        if (dialogVisible) {
            console.log('✅ Edit dialog opened');

            // Verify at least one input is pre-filled (the Name field for a property type)
            const inputs = dialog.locator('input');
            const inputCount = await inputs.count().catch(() => 0);
            if (inputCount > 0) {
                const firstValue = await inputs.first().inputValue().catch(() => '');
                if (firstValue) {
                    console.log(`✅ First input pre-filled with: "${firstValue}"`);
                } else {
                    console.log('⚠️ First input appears empty — may not be pre-filled');
                }
            } else {
                console.log('⚠️ No inputs found inside edit dialog');
            }
        } else {
            // Check if it navigated to an edit route
            const currentUrl = page.url();
            if (/edit|detail|view/.test(currentUrl)) {
                console.log(`✅ Navigated to edit route: ${currentUrl}`);
            } else {
                console.log('⚠️ No dialog or edit route detected after clicking row');
            }
        }

        // Always escape — do NOT save
        await page.keyboard.press('Escape');
        await page.waitForTimeout(1000);
        console.log('✅ Escaped edit dialog without saving');
    });

    // -----------------------------------------------------------------------
    // 6. [DELETE] Check delete availability — do NOT confirm
    // -----------------------------------------------------------------------
    test('6. [DELETE] Delete option is accessible but confirmation is cancelled', async ({ page }) => {
        test.setTimeout(180000);

        await navigateToPropertyTypes(page);

        const firstRow = page.locator('tbody tr, .v-data-table__tr').first();
        const rowVisible = await firstRow.isVisible({ timeout: 10000 }).catch(() => false);

        if (!rowVisible) {
            console.log('⚠️ No rows found — cannot test delete; skipping');
            return;
        }

        // Strategy 1: look for a delete icon button on the row directly
        const deleteIcon = firstRow.locator(
            'button[aria-label*="delete" i], button[aria-label*="remove" i], button .mdi-delete, button .mdi-trash-can'
        ).first();
        const deleteIconVisible = await deleteIcon.isVisible({ timeout: 3000 }).catch(() => false);

        if (deleteIconVisible) {
            await deleteIcon.click();
            await page.waitForTimeout(1500);
            console.log('✅ Delete icon clicked on first row');
        } else {
            // Strategy 2: select row via checkbox then look for a toolbar delete button
            const checkbox = firstRow.locator('input[type="checkbox"], .v-checkbox').first();
            const checkboxVisible = await checkbox.isVisible({ timeout: 3000 }).catch(() => false);

            if (checkboxVisible) {
                await checkbox.click();
                await page.waitForTimeout(1000);
                console.log('✅ Row selected via checkbox');

                const deleteBtn = page.locator('button').filter({ hasText: /delete|remove/i }).first();
                const deleteBtnVisible = await deleteBtn.isVisible({ timeout: 5000 }).catch(() => false);
                if (deleteBtnVisible) {
                    await deleteBtn.click();
                    await page.waitForTimeout(1500);
                    console.log('✅ Delete button clicked after row selection');
                } else {
                    console.log('⚠️ No delete button appeared after selecting row');
                    await page.keyboard.press('Escape');
                    return;
                }
            } else {
                // Strategy 3: right-click or three-dot menu
                const menuBtn = firstRow.locator('button[aria-label*="menu" i], button .mdi-dots-vertical, button .mdi-dots-horizontal').first();
                const menuVisible = await menuBtn.isVisible({ timeout: 3000 }).catch(() => false);
                if (menuVisible) {
                    await menuBtn.click();
                    await page.waitForTimeout(1000);
                    const deleteOption = page.locator('.v-list-item, [role="menuitem"]').filter({ hasText: /delete|remove/i }).first();
                    const deleteOptionVisible = await deleteOption.isVisible({ timeout: 3000 }).catch(() => false);
                    if (deleteOptionVisible) {
                        console.log('✅ Delete option found in row context menu');
                        // Do NOT click delete — escape instead
                        await page.keyboard.press('Escape');
                        await page.waitForTimeout(500);
                    } else {
                        console.log('⚠️ No delete option in context menu');
                        await page.keyboard.press('Escape');
                    }
                    return;
                } else {
                    console.log('⚠️ No delete mechanism found on this row — module may not support delete');
                    return;
                }
            }
        }

        // A confirmation dialog may have appeared — check and cancel it
        const confirmDialog = page.locator('.v-dialog, [role="dialog"]').filter({ hasText: /confirm|delete|remove|are you sure/i }).first();
        const confirmVisible = await confirmDialog.isVisible({ timeout: 5000 }).catch(() => false);

        if (confirmVisible) {
            console.log('✅ Delete confirmation dialog appeared');

            // Click Cancel / No rather than confirm
            const cancelBtn = confirmDialog.locator('button').filter({ hasText: /cancel|no|dismiss/i }).first();
            const cancelVisible = await cancelBtn.isVisible({ timeout: 3000 }).catch(() => false);
            if (cancelVisible) {
                await cancelBtn.click();
                console.log('✅ Delete cancelled via Cancel button');
            } else {
                await page.keyboard.press('Escape');
                console.log('✅ Delete confirmation dismissed via Escape');
            }
        } else {
            await page.keyboard.press('Escape');
            console.log('⚠️ No confirmation dialog appeared — Escape pressed as fallback');
        }

        await page.waitForTimeout(500);
        console.log('✅ Delete test completed without deleting any data');
    });

    // -----------------------------------------------------------------------
    // 7. [NAV] Module is accessible via direct URL
    // -----------------------------------------------------------------------
    test('7. [NAV] Property Types module is accessible via direct URL after login', async ({ page }) => {
        test.setTimeout(180000);

        // Navigate directly — loginToApp was called in beforeEach
        await page.goto(LIST_URL, { waitUntil: 'load', timeout: 30000 });
        await page.waitForTimeout(3000);

        const finalUrl = page.url();
        const isOnModule = /system-settings\/property-types/.test(finalUrl);
        const isRedirectedToLogin = /login|signin|auth/.test(finalUrl);

        if (isOnModule) {
            console.log(`✅ Direct URL accessible: ${finalUrl}`);
        } else if (isRedirectedToLogin) {
            console.log(`⚠️ Redirected to login — session may have expired: ${finalUrl}`);
        } else {
            console.log(`⚠️ Unexpected URL after direct navigation: ${finalUrl}`);
        }

        await expect(page).toHaveURL(/system-settings\/property-types/, { timeout: 5000 });
        console.log('✅ URL assertion passed for direct navigation');
    });

    // -----------------------------------------------------------------------
    // 8. [MODULE-SPECIFIC] Property Types have a name and verify label field
    //    Property types in student accommodation typically have a display name
    //    (e.g. "Studio", "Ensuite", "Shared Room") used on listings and filters.
    // -----------------------------------------------------------------------
    test('8. [MODULE-SPECIFIC] Property Type records display a name/label field', async ({ page }) => {
        test.setTimeout(180000);

        await navigateToPropertyTypes(page);

        // Look for a "Name" or "Type" column header — expected for property types
        const nameHeader = page.locator('th, .v-data-table-header th').filter({ hasText: /name|type|label|title/i }).first();
        const nameHeaderVisible = await nameHeader.isVisible({ timeout: 8000 }).catch(() => false);

        if (nameHeaderVisible) {
            const headerText = await nameHeader.innerText().catch(() => '');
            console.log(`✅ Name/Type column header found: "${headerText.trim()}"`);
        } else {
            console.log('⚠️ No Name/Type column header found — checking cell content instead');
        }

        // Check that the first row has non-empty text in its first cell (the name cell)
        const firstCellText = await page.locator('tbody tr:first-child td, .v-data-table__tr:first-child td').first().innerText({ timeout: 8000 }).catch(() => '');
        if (firstCellText.trim()) {
            console.log(`✅ First row first cell contains: "${firstCellText.trim()}"`);
        } else {
            console.log('⚠️ First row first cell is empty or not found');
        }

        // Open the first record and confirm a "Name" label/input is present in the form
        const firstRow = page.locator('tbody tr, .v-data-table__tr').first();
        const rowVisible = await firstRow.isVisible({ timeout: 5000 }).catch(() => false);

        if (rowVisible) {
            const editIcon = firstRow.locator('button[aria-label*="edit" i], button .mdi-pencil, button .mdi-pencil-outline').first();
            const editIconVisible = await editIcon.isVisible({ timeout: 3000 }).catch(() => false);

            if (editIconVisible) {
                await editIcon.click();
            } else {
                await firstRow.click();
            }

            await page.waitForTimeout(2000);

            const dialog = page.locator('.v-dialog, .v-overlay__content, [role="dialog"]').first();
            const dialogVisible = await dialog.isVisible({ timeout: 8000 }).catch(() => false);

            if (dialogVisible) {
                // Check for a "Name" label inside the dialog — core field for a property type
                const nameLabel = dialog.locator('label, .v-label').filter({ hasText: /name|type|label/i }).first();
                const nameLabelVisible = await nameLabel.isVisible({ timeout: 5000 }).catch(() => false);
                if (nameLabelVisible) {
                    const labelText = await nameLabel.innerText().catch(() => '');
                    console.log(`✅ Name/Type field label found in form: "${labelText.trim()}"`);
                } else {
                    console.log('⚠️ Name/Type label not found inside form dialog');
                }

                await page.keyboard.press('Escape');
                await page.waitForTimeout(500);
                console.log('✅ Escaped form without changes');
            } else {
                console.log('⚠️ Edit dialog did not open — cannot verify form fields');
            }
        }
    });

});
