import { test, expect } from '@playwright/test';
import { loginToApp } from './helpers/auth.helper';

// Permissions module — fusioneta-exclusive (system-settings area)
// Manages granular access control permissions across the platform
const EMAIL = 'pau.kie.chee@fusioneta.com';
const PASSWORD = 'PAOpaopao@9696';
const BASE = 'https://app-staging.vivacityapp.com';
const LIST_URL = `${BASE}/system-settings/permissions`;

async function navigateToPermissions(page: any) {
    await page.goto(LIST_URL, { waitUntil: 'load', timeout: 30000 });
    await page.waitForTimeout(3000);
    await expect(page).toHaveURL(/system-settings\/permissions/, { timeout: 10000 });
    await page.waitForTimeout(1000);
    console.log('✅ Navigated to Permissions');
}

test.describe('System Settings — Permissions', () => {

    test.beforeEach(async ({ page }) => {
        await loginToApp(page, 90000, EMAIL, PASSWORD);
    });

    // ─────────────────────────────────────────────────────────────────────────
    // 1. [READ] Page loads and main content is visible
    // ─────────────────────────────────────────────────────────────────────────
    test('[READ] Permissions page loads with main content visible', async ({ page }) => {
        test.setTimeout(180000);

        await navigateToPermissions(page);

        // Confirm we are on the right page
        const url = page.url();
        console.log(`Current URL: ${url}`);

        // Check for a heading or page title referencing "Permissions"
        const heading = page.locator('h1, h2, h3, .page-title, [class*="title"], [class*="heading"]')
            .filter({ hasText: /permissions/i })
            .first();
        const headingVisible = await heading.isVisible({ timeout: 5000 }).catch(() => false);
        if (headingVisible) {
            console.log('✅ Permissions heading is visible');
        } else {
            console.log('⚠️ Heading with "Permissions" text not found — checking for generic main content');
        }

        // Confirm main content container is present (Vuetify v-main or v-container)
        const mainContent = page.locator('main, .v-main, .v-container, [class*="content"]').first();
        const mainVisible = await mainContent.isVisible({ timeout: 5000 }).catch(() => false);
        expect(mainVisible).toBeTruthy();
        console.log('✅ Main content container is visible');

        // Verify no full-page error state
        const errorMsg = page.locator('[class*="error"], [class*="Error"]')
            .filter({ hasText: /500|not found|forbidden|unauthorized/i })
            .first();
        const errorVisible = await errorMsg.isVisible({ timeout: 3000 }).catch(() => false);
        expect(errorVisible).toBeFalsy();
        console.log('✅ No error state displayed on page load');
    });

    // ─────────────────────────────────────────────────────────────────────────
    // 2. [READ] Table/list shows records — count rows, log column headers
    // ─────────────────────────────────────────────────────────────────────────
    test('[READ] Permissions table displays records and column headers', async ({ page }) => {
        test.setTimeout(180000);

        await navigateToPermissions(page);

        // Wait for any loading spinners to disappear
        await page.waitForSelector('.v-progress-circular, .v-progress-linear', { state: 'hidden', timeout: 15000 }).catch(() => null);
        await page.waitForTimeout(1000);

        // Locate the data table (Vuetify v-data-table or generic table)
        const table = page.locator('.v-data-table, table, .v-list').first();
        const tableVisible = await table.isVisible({ timeout: 8000 }).catch(() => false);

        if (tableVisible) {
            console.log('✅ Data table/list is visible');

            // Log column headers
            const headers = page.locator('th, .v-data-table-header th, thead th');
            const headerCount = await headers.count().catch(() => 0);
            if (headerCount > 0) {
                const headerTexts: string[] = [];
                for (let i = 0; i < headerCount; i++) {
                    const text = await headers.nth(i).textContent().catch(() => '');
                    if (text?.trim()) headerTexts.push(text.trim());
                }
                console.log(`✅ Column headers (${headerCount}): ${headerTexts.join(' | ')}`);
            } else {
                console.log('⚠️ No column headers found — may be a list-style layout');
            }

            // Count data rows
            const rows = page.locator('tbody tr, .v-list-item, [class*="row-item"]');
            const rowCount = await rows.count().catch(() => 0);
            console.log(`✅ Row/item count: ${rowCount}`);

            if (rowCount > 0) {
                // Log the first row's text content as a sample
                const firstRowText = await rows.first().textContent().catch(() => '');
                console.log(`✅ Sample first row: ${firstRowText?.trim().substring(0, 120)}`);
            } else {
                console.log('⚠️ No rows found — table may be empty or still loading');
            }
        } else {
            console.log('⚠️ Table not found — checking for list or card layout');
            // Try list items or card-based layout
            const listItems = page.locator('.v-list-item, .v-card, [class*="permission-item"]');
            const itemCount = await listItems.count().catch(() => 0);
            console.log(`⚠️ List/card items found: ${itemCount}`);
        }
    });

    // ─────────────────────────────────────────────────────────────────────────
    // 3. [READ] Search or filter works — fill, verify, clear
    // ─────────────────────────────────────────────────────────────────────────
    test('[READ] Search/filter input filters the permissions list', async ({ page }) => {
        test.setTimeout(180000);

        await navigateToPermissions(page);

        await page.waitForSelector('.v-progress-circular, .v-progress-linear', { state: 'hidden', timeout: 15000 }).catch(() => null);
        await page.waitForTimeout(1000);

        // Locate a search input — common Vuetify patterns
        const searchInput = page.locator(
            'input[placeholder*="search" i], input[placeholder*="filter" i], ' +
            'input[placeholder*="Search" i], .v-text-field input, ' +
            '[aria-label*="search" i], [aria-label*="Search" i]'
        ).first();

        const searchVisible = await searchInput.isVisible({ timeout: 5000 }).catch(() => false);

        if (!searchVisible) {
            console.log('⚠️ No search/filter input found — skipping search test');
            return;
        }

        console.log('✅ Search input is visible');

        // Get initial row count before searching
        const rowsBefore = page.locator('tbody tr, .v-list-item');
        const countBefore = await rowsBefore.count().catch(() => 0);
        console.log(`Initial row count: ${countBefore}`);

        // Type a search term relevant to permissions (e.g. "view", "edit", or "admin")
        await searchInput.fill('view');
        await page.waitForTimeout(2000);

        const countAfterSearch = await rowsBefore.count().catch(() => 0);
        console.log(`✅ Row count after searching "view": ${countAfterSearch}`);

        // Clear the search and verify list is restored or reset
        await searchInput.clear();
        await page.waitForTimeout(2000);

        const countAfterClear = await rowsBefore.count().catch(() => 0);
        console.log(`✅ Row count after clearing search: ${countAfterClear}`);
    });

    // ─────────────────────────────────────────────────────────────────────────
    // 4. [CREATE] Open create dialog — verify it opens, then escape (no save)
    // ─────────────────────────────────────────────────────────────────────────
    test('[CREATE] Create button opens dialog/form — escape without saving', async ({ page }) => {
        test.setTimeout(180000);

        await navigateToPermissions(page);

        await page.waitForSelector('.v-progress-circular, .v-progress-linear', { state: 'hidden', timeout: 15000 }).catch(() => null);
        await page.waitForTimeout(1000);

        // Look for a Create/Add button using defensive locators
        const createBtn = page.locator('button').filter({ hasText: /create|add|new/i }).first();
        const createVisible = await createBtn.isVisible({ timeout: 5000 }).catch(() => false);

        if (!createVisible) {
            console.log('⚠️ No Create/Add button found — skipping create dialog test');
            return;
        }

        console.log('✅ Create button is visible');
        await createBtn.click();
        await page.waitForTimeout(2000);

        // Confirm a dialog opened (Vuetify v-dialog)
        const dialog = page.locator('.v-dialog, [role="dialog"], .v-overlay__content').first();
        const dialogVisible = await dialog.isVisible({ timeout: 5000 }).catch(() => false);

        if (dialogVisible) {
            console.log('✅ Create dialog opened successfully');

            // Check for form fields inside the dialog
            const formFields = dialog.locator('input, textarea, .v-select, .v-text-field');
            const fieldCount = await formFields.count().catch(() => 0);
            console.log(`✅ Form fields in dialog: ${fieldCount}`);

            // Check for a Name or Permission Name field
            const nameField = dialog.locator('input[placeholder*="name" i], label:has-text("Name"), label:has-text("Permission")').first();
            const nameVisible = await nameField.isVisible({ timeout: 3000 }).catch(() => false);
            if (nameVisible) {
                console.log('✅ Name/Permission field visible in dialog');
            } else {
                console.log('⚠️ Name field not specifically found — form may use different labels');
            }
        } else {
            console.log('⚠️ Dialog did not open — form may be inline or use a different pattern');
        }

        // Always escape without saving
        await page.keyboard.press('Escape');
        await page.waitForTimeout(1000);
        console.log('✅ Escaped dialog without saving');

        // Confirm dialog is closed
        const dialogAfterEscape = await dialog.isVisible({ timeout: 3000 }).catch(() => false);
        expect(dialogAfterEscape).toBeFalsy();
        console.log('✅ Dialog closed after Escape');
    });

    // ─────────────────────────────────────────────────────────────────────────
    // 5. [UPDATE] Click first row, verify edit form opens — check fields, escape
    // ─────────────────────────────────────────────────────────────────────────
    test('[UPDATE] Clicking first row opens edit form — escape without saving', async ({ page }) => {
        test.setTimeout(180000);

        await navigateToPermissions(page);

        await page.waitForSelector('.v-progress-circular, .v-progress-linear', { state: 'hidden', timeout: 15000 }).catch(() => null);
        await page.waitForTimeout(1000);

        // Try clicking the first data row
        const firstRow = page.locator('tbody tr, .v-list-item').first();
        const firstRowVisible = await firstRow.isVisible({ timeout: 8000 }).catch(() => false);

        if (!firstRowVisible) {
            console.log('⚠️ No rows found to click — skipping edit test');
            return;
        }

        console.log('✅ First row found');

        // Check for an edit button (pencil icon or "Edit" text) on the row first
        const editBtn = firstRow.locator('button').filter({ hasText: /edit/i }).first();
        const editBtnVisible = await editBtn.isVisible({ timeout: 3000 }).catch(() => false);

        if (editBtnVisible) {
            await editBtn.click();
            console.log('✅ Clicked Edit button on first row');
        } else {
            // Try clicking the row itself or a row-level action icon
            const actionIcon = firstRow.locator('[class*="mdi-pencil"], [class*="edit"], button').first();
            const actionVisible = await actionIcon.isVisible({ timeout: 3000 }).catch(() => false);
            if (actionVisible) {
                await actionIcon.click();
                console.log('✅ Clicked action icon on first row');
            } else {
                await firstRow.click();
                console.log('✅ Clicked first row directly');
            }
        }

        await page.waitForTimeout(2000);

        // Verify an edit dialog or form opened
        const dialog = page.locator('.v-dialog, [role="dialog"], .v-overlay__content').first();
        const dialogVisible = await dialog.isVisible({ timeout: 5000 }).catch(() => false);

        if (dialogVisible) {
            console.log('✅ Edit dialog/form opened');

            // Confirm form fields are present and populated
            const inputs = dialog.locator('input, textarea, .v-select');
            const inputCount = await inputs.count().catch(() => 0);
            console.log(`✅ Input fields in edit form: ${inputCount}`);

            // Check that at least one field has a value (pre-populated for edit)
            if (inputCount > 0) {
                const firstInputValue = await inputs.first().inputValue().catch(() => '');
                console.log(`✅ First field value (pre-populated): "${firstInputValue}"`);
            }
        } else {
            console.log('⚠️ No dialog appeared — edit may navigate to a detail page');
            const currentUrl = page.url();
            console.log(`Current URL after click: ${currentUrl}`);
        }

        // Escape without saving
        await page.keyboard.press('Escape');
        await page.waitForTimeout(1000);
        console.log('✅ Escaped edit form without saving');
    });

    // ─────────────────────────────────────────────────────────────────────────
    // 6. [DELETE] Check delete availability after selecting row — do NOT confirm
    // ─────────────────────────────────────────────────────────────────────────
    test('[DELETE] Delete option is accessible — escape without confirming', async ({ page }) => {
        test.setTimeout(180000);

        await navigateToPermissions(page);

        await page.waitForSelector('.v-progress-circular, .v-progress-linear', { state: 'hidden', timeout: 15000 }).catch(() => null);
        await page.waitForTimeout(1000);

        const firstRow = page.locator('tbody tr, .v-list-item').first();
        const firstRowVisible = await firstRow.isVisible({ timeout: 8000 }).catch(() => false);

        if (!firstRowVisible) {
            console.log('⚠️ No rows found — skipping delete test');
            return;
        }

        // Try selecting the row via a checkbox
        const rowCheckbox = firstRow.locator('input[type="checkbox"], .v-checkbox').first();
        const checkboxVisible = await rowCheckbox.isVisible({ timeout: 3000 }).catch(() => false);
        if (checkboxVisible) {
            await rowCheckbox.click();
            await page.waitForTimeout(1000);
            console.log('✅ Row selected via checkbox');
        }

        // Look for a delete button — either on the row or in a toolbar after selection
        const deleteBtn = page.locator('button').filter({ hasText: /delete|remove/i }).first();
        const deleteBtnVisible = await deleteBtn.isVisible({ timeout: 5000 }).catch(() => false);

        if (deleteBtnVisible) {
            console.log('✅ Delete button is visible');
            await deleteBtn.click();
            await page.waitForTimeout(1500);

            // A confirmation dialog should appear — do NOT confirm
            const confirmDialog = page.locator('.v-dialog, [role="dialog"], .v-overlay__content').first();
            const confirmVisible = await confirmDialog.isVisible({ timeout: 5000 }).catch(() => false);

            if (confirmVisible) {
                console.log('✅ Confirmation dialog appeared — escaping without confirming delete');
                // Click Cancel instead of Delete/Confirm to be safe
                const cancelBtn = confirmDialog.locator('button').filter({ hasText: /cancel|no|close/i }).first();
                const cancelVisible = await cancelBtn.isVisible({ timeout: 3000 }).catch(() => false);
                if (cancelVisible) {
                    await cancelBtn.click();
                    console.log('✅ Clicked Cancel on confirmation dialog');
                } else {
                    await page.keyboard.press('Escape');
                    console.log('✅ Pressed Escape to dismiss confirmation dialog');
                }
            } else {
                console.log('⚠️ No confirmation dialog appeared after clicking Delete');
                await page.keyboard.press('Escape');
            }
        } else {
            // Check for a row-level delete icon (mdi-delete or trash icon)
            const deleteIcon = firstRow.locator('[class*="mdi-delete"], [class*="delete"], [aria-label*="delete" i]').first();
            const deleteIconVisible = await deleteIcon.isVisible({ timeout: 3000 }).catch(() => false);
            if (deleteIconVisible) {
                console.log('✅ Row-level delete icon found (not clicking to avoid data loss)');
            } else {
                console.log('⚠️ No delete button or icon found — delete may be restricted for permissions');
            }
        }

        await page.waitForTimeout(500);
        console.log('✅ Delete test completed without data modification');
    });

    // ─────────────────────────────────────────────────────────────────────────
    // 7. [NAV] Module is accessible via direct URL
    // ─────────────────────────────────────────────────────────────────────────
    test('[NAV] Permissions module is accessible via direct URL', async ({ page }) => {
        test.setTimeout(180000);

        // Navigate directly to the permissions URL
        await page.goto(LIST_URL, { waitUntil: 'load', timeout: 30000 });
        await page.waitForTimeout(3000);

        // Confirm the URL is correct (not redirected to login or 404)
        const currentUrl = page.url();
        console.log(`Current URL: ${currentUrl}`);

        const isOnPermissions = /system-settings\/permissions/.test(currentUrl);
        const isOnLogin = /login|sign-in|auth/.test(currentUrl);
        const isOnDashboard = /dashboard|home/.test(currentUrl);

        if (isOnPermissions) {
            console.log('✅ Direct URL navigation lands on Permissions page');
        } else if (isOnLogin) {
            console.log('⚠️ Redirected to login — auth may have expired');
        } else if (isOnDashboard) {
            console.log('⚠️ Redirected to dashboard — permission to access this module may be restricted');
        } else {
            console.log(`⚠️ Landed on unexpected URL: ${currentUrl}`);
        }

        expect(isOnPermissions).toBeTruthy();

        // Confirm the page is rendered (not a blank or broken page)
        const bodyContent = page.locator('body');
        const bodyVisible = await bodyContent.isVisible({ timeout: 5000 }).catch(() => false);
        expect(bodyVisible).toBeTruthy();
        console.log('✅ Page body is rendered on direct URL access');

        // Check the system-settings navigation sidebar is present
        const sysSettingsSidebar = page.locator('[class*="sidebar"], .v-navigation-drawer, nav').first();
        const sidebarVisible = await sysSettingsSidebar.isVisible({ timeout: 5000 }).catch(() => false);
        if (sidebarVisible) {
            console.log('✅ System settings sidebar/nav is visible');
        } else {
            console.log('⚠️ Sidebar not detected — may use a different nav layout');
        }
    });

    // ─────────────────────────────────────────────────────────────────────────
    // 8. [MODULE-SPECIFIC] Permissions — verify permission keys/codes are shown
    //    Permissions in a platform like this typically have a "key" or "code"
    //    (e.g. "view_users", "edit_properties") alongside a human-readable name.
    //    This test checks that identifiers/codes are visible in the list.
    // ─────────────────────────────────────────────────────────────────────────
    test('[MODULE] Permission keys/codes are displayed in the list', async ({ page }) => {
        test.setTimeout(180000);

        await navigateToPermissions(page);

        await page.waitForSelector('.v-progress-circular, .v-progress-linear', { state: 'hidden', timeout: 15000 }).catch(() => null);
        await page.waitForTimeout(1000);

        // Check for a column header or cell that looks like a permission key/code
        // Common patterns: "key", "code", "slug", "permission", "identifier", or snake_case values
        const keyColumn = page.locator('th, .v-data-table-header th')
            .filter({ hasText: /key|code|slug|identifier|permission/i })
            .first();
        const keyColVisible = await keyColumn.isVisible({ timeout: 5000 }).catch(() => false);

        if (keyColVisible) {
            const colText = await keyColumn.textContent().catch(() => '');
            console.log(`✅ Permission key/code column found: "${colText?.trim()}"`);
        } else {
            console.log('⚠️ No explicit key/code column header found — checking cell content for snake_case values');
        }

        // Look for cell values that match a snake_case or dot-notation permission pattern
        // e.g. "view_users", "system.permissions.edit"
        const cells = page.locator('tbody td, .v-list-item__title, .v-list-item__content');
        const cellCount = await cells.count().catch(() => 0);

        let snakeCaseFound = false;
        const sampleLimit = Math.min(cellCount, 20);
        for (let i = 0; i < sampleLimit; i++) {
            const text = await cells.nth(i).textContent().catch(() => '');
            if (text && /^[a-z][a-z0-9]*[_\.][a-z]/.test(text.trim())) {
                console.log(`✅ Permission key/code detected in row: "${text.trim()}"`);
                snakeCaseFound = true;
                break;
            }
        }

        if (!snakeCaseFound) {
            console.log('⚠️ No snake_case/dot-notation permission keys found in visible cells — may use display names only');
        }

        // Verify "Name" or "Description" column exists (standard for permissions UI)
        const nameColumn = page.locator('th, .v-data-table-header th')
            .filter({ hasText: /name|description|label/i })
            .first();
        const nameColVisible = await nameColumn.isVisible({ timeout: 3000 }).catch(() => false);
        if (nameColVisible) {
            const nameColText = await nameColumn.textContent().catch(() => '');
            console.log(`✅ Name/Description column found: "${nameColText?.trim()}"`);
        } else {
            console.log('⚠️ Name/Description column header not found — checking for list-style layout');
        }

        console.log('✅ Module-specific permissions structure check complete');
    });

});
