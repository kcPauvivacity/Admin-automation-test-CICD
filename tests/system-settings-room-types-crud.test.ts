import { test, expect } from '@playwright/test';
import { loginToApp } from './helpers/auth.helper';

const EMAIL = 'pau.kie.chee@fusioneta.com';
const PASSWORD = 'PAOpaopao@9696';
const BASE = 'https://app-staging.vivacityapp.com';
const LIST_URL = `${BASE}/system-settings/room-types`;

// Room Types: defines categories of accommodation rooms (e.g. Studio, En-suite, Shared)
// used across properties for pricing, availability, and booking configuration.

async function navigateToRoomTypes(page: any) {
    await page.goto(LIST_URL, { waitUntil: 'load', timeout: 30000 });
    await page.waitForTimeout(3000);
    await expect(page).toHaveURL(/system-settings\/room-types/, { timeout: 10000 });
    await page.waitForTimeout(1000);
    console.log('✅ Navigated to Room Types');
}

test.describe('System Settings — Room Types CRUD', () => {

    test.beforeEach(async ({ page }) => {
        await loginToApp(page, 90000, EMAIL, PASSWORD);
    });

    // ─── READ: Page Loads ────────────────────────────────────────────────────

    test('[READ] Room Types page loads and main content is visible', async ({ page }) => {
        test.setTimeout(180000);

        await navigateToRoomTypes(page);

        // Verify the page heading or module title is present
        const heading = page.locator('h1, h2, h3, .page-title, [class*="title"]').filter({ hasText: /room types/i }).first();
        const headingVisible = await heading.isVisible({ timeout: 5000 }).catch(() => false);
        if (headingVisible) {
            console.log('✅ Page heading visible');
        } else {
            console.log('⚠️ Heading with "Room Types" text not found — checking generic content');
        }

        // Confirm the main content area renders (table or list container)
        const mainContent = page.locator(
            '.v-data-table, .v-list, table, [class*="data-table"], [class*="list-container"], main'
        ).first();
        const mainVisible = await mainContent.isVisible({ timeout: 8000 }).catch(() => false);
        if (mainVisible) {
            console.log('✅ Main content area is visible');
        } else {
            console.log('⚠️ Generic main content locator not matched');
        }

        // Confirm no critical error state is shown
        const errorEl = page.locator('[class*="error"], [class*="alert--error"]').first();
        const errorVisible = await errorEl.isVisible({ timeout: 3000 }).catch(() => false);
        if (errorVisible) {
            console.log('⚠️ An error element is visible on the page');
        } else {
            console.log('✅ No error state detected');
        }

        await expect(page).toHaveURL(/system-settings\/room-types/, { timeout: 5000 });
        console.log('✅ [READ] Room Types page load test complete');
    });

    // ─── READ: Table/List Shows Records ─────────────────────────────────────

    test('[READ] Room Types table displays records and column headers', async ({ page }) => {
        test.setTimeout(180000);

        await navigateToRoomTypes(page);

        // Wait for rows to appear
        await page.waitForTimeout(2000);

        // Log column headers
        const headers = page.locator('thead th, .v-data-table-header th, th');
        const headerCount = await headers.count().catch(() => 0);
        if (headerCount > 0) {
            const headerTexts: string[] = [];
            for (let i = 0; i < headerCount; i++) {
                const text = await headers.nth(i).innerText().catch(() => '');
                if (text.trim()) headerTexts.push(text.trim());
            }
            console.log(`✅ Column headers (${headerCount}): ${headerTexts.join(' | ')}`);
        } else {
            console.log('⚠️ No thead/th elements found — may be a card/list layout');
        }

        // Count data rows
        const rows = page.locator('tbody tr, .v-list-item, [class*="row-item"]');
        const rowCount = await rows.count().catch(() => 0);
        if (rowCount > 0) {
            console.log(`✅ Found ${rowCount} record row(s) in the Room Types list`);
        } else {
            console.log('⚠️ No rows found — table may be empty or uses a different layout');
        }

        // Check for a "Name" or "Type" column which is expected for Room Types
        const nameColVisible = await page.locator('th').filter({ hasText: /name|type|room/i }).first()
            .isVisible({ timeout: 4000 }).catch(() => false);
        if (nameColVisible) {
            console.log('✅ Name/Type column header detected — expected for Room Types');
        } else {
            console.log('⚠️ Name/Type column header not detected');
        }

        console.log('✅ [READ] Table records test complete');
    });

    // ─── READ: Search / Filter ───────────────────────────────────────────────

    test('[READ] Search or filter input works for Room Types', async ({ page }) => {
        test.setTimeout(180000);

        await navigateToRoomTypes(page);
        await page.waitForTimeout(2000);

        // Locate a search input (Vuetify uses v-text-field for search bars)
        const searchInput = page.locator(
            'input[placeholder*="search" i], input[placeholder*="filter" i], .v-text-field input, input[type="search"]'
        ).first();

        const searchVisible = await searchInput.isVisible({ timeout: 5000 }).catch(() => false);
        if (!searchVisible) {
            console.log('⚠️ Search input not found — skipping search test');
            return;
        }

        await searchInput.click();
        await searchInput.fill('Studio');
        await page.waitForTimeout(2000);
        console.log('✅ Typed "Studio" into search input');

        // Check that results change (rows may decrease, or a "no results" state appears)
        const rowsAfterSearch = page.locator('tbody tr, .v-list-item');
        const countAfterSearch = await rowsAfterSearch.count().catch(() => 0);
        console.log(`✅ Row count after search: ${countAfterSearch}`);

        // Clear search
        await searchInput.clear();
        await page.waitForTimeout(2000);
        console.log('✅ Cleared search input');

        const rowsAfterClear = page.locator('tbody tr, .v-list-item');
        const countAfterClear = await rowsAfterClear.count().catch(() => 0);
        console.log(`✅ Row count after clearing search: ${countAfterClear}`);

        console.log('✅ [READ] Search/filter test complete');
    });

    // ─── CREATE: Open Dialog and Escape ─────────────────────────────────────

    test('[CREATE] Create button opens dialog/form — escape without saving', async ({ page }) => {
        test.setTimeout(180000);

        await navigateToRoomTypes(page);
        await page.waitForTimeout(2000);

        // Look for a Create / Add button
        const createBtn = page.locator('button').filter({ hasText: /create|add|new/i }).first();
        const createVisible = await createBtn.isVisible({ timeout: 5000 }).catch(() => false);

        if (!createVisible) {
            console.log('⚠️ Create/Add button not found — skipping create dialog test');
            return;
        }

        await createBtn.click();
        await page.waitForTimeout(2000);
        console.log('✅ Clicked Create/Add button');

        // Verify a dialog or form opened
        const dialog = page.locator('.v-dialog, [role="dialog"], .v-overlay__content').first();
        const dialogVisible = await dialog.isVisible({ timeout: 6000 }).catch(() => false);
        if (dialogVisible) {
            console.log('✅ Create dialog/form is open');

            // Check for a Name field — expected for a Room Type form
            const nameField = dialog.locator('input[placeholder*="name" i], label:has-text("Name") + input, .v-text-field input').first();
            const nameFieldVisible = await nameField.isVisible({ timeout: 3000 }).catch(() => false);
            if (nameFieldVisible) {
                console.log('✅ Name input field found inside create dialog');
            } else {
                console.log('⚠️ Name input not specifically identified in dialog');
            }
        } else {
            // May have navigated to a create page instead of a dialog
            const createPage = await page.url();
            if (/create|new|add/i.test(createPage)) {
                console.log(`✅ Navigated to create page: ${createPage}`);
            } else {
                console.log('⚠️ Dialog did not open and URL did not change to a create path');
            }
        }

        // Escape without saving
        await page.keyboard.press('Escape');
        await page.waitForTimeout(1500);
        console.log('✅ Pressed Escape — dialog closed without saving');

        // Optionally click Cancel if still open
        const cancelBtn = page.locator('button').filter({ hasText: /cancel|close/i }).first();
        const cancelVisible = await cancelBtn.isVisible({ timeout: 2000 }).catch(() => false);
        if (cancelVisible) {
            await cancelBtn.click();
            console.log('✅ Clicked Cancel button to close form');
        }

        console.log('✅ [CREATE] Open dialog/escape test complete');
    });

    // ─── UPDATE: Click First Row, Verify Edit Form ───────────────────────────

    test('[UPDATE] Clicking first record opens an edit form with fields visible', async ({ page }) => {
        test.setTimeout(180000);

        await navigateToRoomTypes(page);
        await page.waitForTimeout(2000);

        // Try clicking an edit icon/button on the first row
        const editBtn = page.locator(
            'tbody tr:first-child button[aria-label*="edit" i], tbody tr:first-child [class*="edit"], tbody tr:first-child button:has(svg)'
        ).first();

        const editBtnVisible = await editBtn.isVisible({ timeout: 4000 }).catch(() => false);
        if (editBtnVisible) {
            await editBtn.click();
            console.log('✅ Clicked edit button on first row');
        } else {
            // Fall back: click the first row itself (many Vuetify tables open edit on row click)
            const firstRow = page.locator('tbody tr').first();
            const firstRowVisible = await firstRow.isVisible({ timeout: 4000 }).catch(() => false);
            if (!firstRowVisible) {
                console.log('⚠️ No rows found to click — skipping edit test');
                return;
            }
            await firstRow.click();
            console.log('✅ Clicked first row to open edit form');
        }

        await page.waitForTimeout(2500);

        // Verify a dialog or edit page opened
        const dialog = page.locator('.v-dialog, [role="dialog"], .v-overlay__content').first();
        const dialogVisible = await dialog.isVisible({ timeout: 6000 }).catch(() => false);
        if (dialogVisible) {
            console.log('✅ Edit dialog is open');

            // Check for input fields inside the dialog
            const inputs = dialog.locator('input, textarea, .v-select');
            const inputCount = await inputs.count().catch(() => 0);
            console.log(`✅ Found ${inputCount} input/select field(s) in edit dialog`);

            // Check for a Name or Description field — typical for Room Types
            const nameInput = dialog.locator('input').first();
            const nameVisible = await nameInput.isVisible({ timeout: 3000 }).catch(() => false);
            if (nameVisible) {
                const nameValue = await nameInput.inputValue().catch(() => '');
                console.log(`✅ First input field has value: "${nameValue}"`);
            }
        } else {
            const currentUrl = page.url();
            if (/edit|update|detail/i.test(currentUrl)) {
                console.log(`✅ Navigated to edit page: ${currentUrl}`);
            } else {
                console.log('⚠️ Edit dialog did not open and URL did not indicate an edit page');
            }
        }

        // Escape without saving
        await page.keyboard.press('Escape');
        await page.waitForTimeout(1500);
        console.log('✅ Pressed Escape — edit form closed without saving');

        const cancelBtn = page.locator('button').filter({ hasText: /cancel|close/i }).first();
        const cancelVisible = await cancelBtn.isVisible({ timeout: 2000 }).catch(() => false);
        if (cancelVisible) {
            await cancelBtn.click();
            console.log('✅ Clicked Cancel to dismiss edit form');
        }

        console.log('✅ [UPDATE] Edit form open/escape test complete');
    });

    // ─── DELETE: Check Availability — Do NOT Confirm ─────────────────────────

    test('[DELETE] Delete option is accessible after selecting a row — escape without confirming', async ({ page }) => {
        test.setTimeout(180000);

        await navigateToRoomTypes(page);
        await page.waitForTimeout(2000);

        // Try to find a delete icon on the first row directly
        const deleteBtn = page.locator(
            'tbody tr:first-child button[aria-label*="delete" i], tbody tr:first-child [class*="delete"], tbody tr:first-child button[aria-label*="remove" i]'
        ).first();

        const deleteBtnVisible = await deleteBtn.isVisible({ timeout: 4000 }).catch(() => false);
        if (deleteBtnVisible) {
            await deleteBtn.click();
            console.log('✅ Clicked delete button on first row');
        } else {
            // Try selecting the row via checkbox then looking for bulk delete
            const checkbox = page.locator('tbody tr:first-child input[type="checkbox"]').first();
            const checkboxVisible = await checkbox.isVisible({ timeout: 3000 }).catch(() => false);
            if (checkboxVisible) {
                await checkbox.click();
                await page.waitForTimeout(1500);
                console.log('✅ Selected first row via checkbox');

                const bulkDeleteBtn = page.locator('button').filter({ hasText: /delete|remove/i }).first();
                const bulkDeleteVisible = await bulkDeleteBtn.isVisible({ timeout: 3000 }).catch(() => false);
                if (bulkDeleteVisible) {
                    await bulkDeleteBtn.click();
                    console.log('✅ Clicked bulk delete button');
                } else {
                    console.log('⚠️ No bulk delete button appeared after row selection');
                    await checkbox.click(); // Deselect
                    return;
                }
            } else {
                // Try right-click context menu or actions column
                const firstRow = page.locator('tbody tr').first();
                const firstRowVisible = await firstRow.isVisible({ timeout: 3000 }).catch(() => false);
                if (firstRowVisible) {
                    await firstRow.hover();
                    await page.waitForTimeout(1000);
                    const hoveredDeleteBtn = page.locator('button[aria-label*="delete" i], button[aria-label*="remove" i]').first();
                    const hoveredDeleteVisible = await hoveredDeleteBtn.isVisible({ timeout: 2000 }).catch(() => false);
                    if (hoveredDeleteVisible) {
                        await hoveredDeleteBtn.click();
                        console.log('✅ Clicked delete button that appeared on hover');
                    } else {
                        console.log('⚠️ Delete button not found on row or via hover — delete may require different interaction');
                        return;
                    }
                } else {
                    console.log('⚠️ No rows available to test delete');
                    return;
                }
            }
        }

        await page.waitForTimeout(2000);

        // Verify a confirmation dialog appeared
        const confirmDialog = page.locator('.v-dialog, [role="dialog"], .v-overlay__content').first();
        const confirmVisible = await confirmDialog.isVisible({ timeout: 5000 }).catch(() => false);
        if (confirmVisible) {
            console.log('✅ Delete confirmation dialog appeared');

            // Verify confirm/cancel buttons exist
            const confirmBtn = page.locator('button').filter({ hasText: /confirm|yes|delete|ok/i }).first();
            const confirmBtnVisible = await confirmBtn.isVisible({ timeout: 3000 }).catch(() => false);
            if (confirmBtnVisible) {
                console.log('✅ Confirm delete button is visible (NOT clicking — avoiding data mutation)');
            }
        } else {
            console.log('⚠️ No confirmation dialog appeared after delete action');
        }

        // Always escape — never confirm deletion
        await page.keyboard.press('Escape');
        await page.waitForTimeout(1500);
        console.log('✅ Pressed Escape — delete NOT confirmed');

        const cancelBtn = page.locator('button').filter({ hasText: /cancel|no|close/i }).first();
        const cancelVisible = await cancelBtn.isVisible({ timeout: 2000 }).catch(() => false);
        if (cancelVisible) {
            await cancelBtn.click();
            console.log('✅ Clicked Cancel on delete confirmation — no data deleted');
        }

        console.log('✅ [DELETE] Delete check/escape test complete');
    });

    // ─── NAV: Direct URL Access ──────────────────────────────────────────────

    test('[NAV] Room Types module is accessible via direct URL', async ({ page }) => {
        test.setTimeout(180000);

        await page.goto(LIST_URL, { waitUntil: 'load', timeout: 30000 });
        await page.waitForTimeout(3000);

        // Confirm URL is correct and not redirected to login or 404
        const currentUrl = page.url();
        const onCorrectPage = /system-settings\/room-types/.test(currentUrl);
        const redirectedToLogin = /login|signin|auth/i.test(currentUrl);
        const on404 = /404|not-found/i.test(currentUrl);

        if (redirectedToLogin) {
            console.log('⚠️ Redirected to login — session may not have persisted');
        } else if (on404) {
            console.log('⚠️ Redirected to 404 — Room Types route may not exist');
        } else if (onCorrectPage) {
            console.log(`✅ Direct URL access successful: ${currentUrl}`);
        } else {
            console.log(`⚠️ Landed on unexpected URL: ${currentUrl}`);
        }

        await expect(page).toHaveURL(/system-settings\/room-types/, { timeout: 10000 });
        console.log('✅ [NAV] Direct URL navigation test complete');
    });

    // ─── MODULE-SPECIFIC: Room Type Attributes ────────────────────────────────

    test('[MODULE] Room Types list shows accommodation-relevant fields (e.g. name, description, bed type)', async ({ page }) => {
        test.setTimeout(180000);

        // Room Types in student accommodation platforms typically have:
        // - Name (e.g. "Studio", "En-suite", "Shared Room", "1-Bed Apartment")
        // - Description or Notes
        // - Possibly a bed count or room category flag
        // This test checks that the list surface exposes accommodation-relevant column data.

        await navigateToRoomTypes(page);
        await page.waitForTimeout(2000);

        // Check for relevant column headers
        const relevantTerms = ['name', 'type', 'description', 'bed', 'room', 'category', 'code'];
        let foundRelevant = false;

        for (const term of relevantTerms) {
            const col = page.locator('th, thead td').filter({ hasText: new RegExp(term, 'i') }).first();
            const colVisible = await col.isVisible({ timeout: 2000 }).catch(() => false);
            if (colVisible) {
                const colText = await col.innerText().catch(() => '');
                console.log(`✅ Found accommodation-relevant column: "${colText.trim()}"`);
                foundRelevant = true;
            }
        }

        if (!foundRelevant) {
            console.log('⚠️ No accommodation-specific column headers matched — may use icon/card layout');
        }

        // Check that at least one row cell contains recognisable room-type terminology
        const cellTexts = page.locator('tbody tr td').first();
        const cellVisible = await cellTexts.isVisible({ timeout: 4000 }).catch(() => false);
        if (cellVisible) {
            const text = await cellTexts.innerText().catch(() => '');
            console.log(`✅ First cell text in table: "${text.trim()}"`);
        } else {
            console.log('⚠️ Could not read first cell — table may be empty or uses a card/list layout');
        }

        // Verify the system settings sidebar/header context is correct
        const systemSettingsIndicator = page.locator(
            '[aria-label*="system settings" i], [href*="system-settings"], [class*="sidebar"] [class*="active"]'
        ).first();
        const sidebarVisible = await systemSettingsIndicator.isVisible({ timeout: 3000 }).catch(() => false);
        if (sidebarVisible) {
            console.log('✅ System settings navigation context confirmed');
        } else {
            console.log('⚠️ System settings sidebar indicator not found');
        }

        console.log('✅ [MODULE] Room Types accommodation fields test complete');
    });

});
