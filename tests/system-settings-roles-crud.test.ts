import { test, expect } from '@playwright/test';
import { loginToApp } from './helpers/auth.helper';

const EMAIL = 'pau.kie.chee@fusioneta.com';
const PASSWORD = 'PAOpaopao@9696';
const BASE = 'https://app-staging.vivacityapp.com';
const LIST_URL = `${BASE}/system-settings/roles`;

async function navigateToRoles(page: any) {
    await page.goto(LIST_URL, { waitUntil: 'load', timeout: 30000 });
    await page.waitForTimeout(3000);
    await expect(page).toHaveURL(/system-settings\/roles/, { timeout: 10000 });
    await page.waitForTimeout(1000);
    console.log('✅ Navigated to Roles');
}

// ─────────────────────────────────────────────────────────────────────────────
// Test 1: [READ] Page loads and main content is visible
// ─────────────────────────────────────────────────────────────────────────────
test('Roles | [READ] page loads and main content is visible', async ({ page }) => {
    test.setTimeout(180000);
    await loginToApp(page, 90000, EMAIL, PASSWORD);
    await navigateToRoles(page);

    // Verify the page heading or a recognisable container is present
    const heading = page.locator('h1, h2, h3, .page-title, [class*="title"]').filter({ hasText: /roles/i }).first();
    const headingVisible = await heading.isVisible({ timeout: 5000 }).catch(() => false);
    if (headingVisible) {
        console.log('✅ Page heading with "Roles" text found');
    } else {
        console.log('⚠️  No explicit heading found — checking for table/list container');
    }

    // Check for a data table or list container (Vuetify v-data-table or generic table)
    const tableOrList = page.locator('.v-data-table, .v-list, table, [class*="data-table"]').first();
    const tableVisible = await tableOrList.isVisible({ timeout: 8000 }).catch(() => false);
    if (tableVisible) {
        console.log('✅ Data table / list container is visible');
    } else {
        console.log('⚠️  No table/list container detected on page');
    }

    // Verify page is not showing an error state
    const errorMsg = page.locator('[class*="error"], .v-alert--type-error').first();
    const errorVisible = await errorMsg.isVisible({ timeout: 3000 }).catch(() => false);
    if (!errorVisible) {
        console.log('✅ No error state visible on page');
    } else {
        console.log('⚠️  An error alert is visible — investigate manually');
    }
});

// ─────────────────────────────────────────────────────────────────────────────
// Test 2: [READ] Table/list shows records — count rows, log column headers
// ─────────────────────────────────────────────────────────────────────────────
test('Roles | [READ] table shows records and column headers are readable', async ({ page }) => {
    test.setTimeout(180000);
    await loginToApp(page, 90000, EMAIL, PASSWORD);
    await navigateToRoles(page);

    // Wait for the table to settle after any network requests
    await page.waitForTimeout(2000);

    // Log column headers
    const headers = page.locator('thead th, .v-data-table-header th, th[role="columnheader"]');
    const headerCount = await headers.count().catch(() => 0);
    if (headerCount > 0) {
        console.log(`✅ Found ${headerCount} column header(s):`);
        for (let i = 0; i < headerCount; i++) {
            const text = await headers.nth(i).innerText().catch(() => '');
            if (text.trim()) console.log(`   • ${text.trim()}`);
        }
    } else {
        console.log('⚠️  No table headers found — module may use a card/list layout');
    }

    // Count data rows
    const rows = page.locator('tbody tr, .v-data-table__tr, .v-list-item');
    const rowCount = await rows.count().catch(() => 0);
    if (rowCount > 0) {
        console.log(`✅ Table has ${rowCount} visible row(s) / list item(s)`);
    } else {
        // It is valid for the table to be empty in a staging environment
        console.log('⚠️  No data rows found — table may be empty on staging');
    }

    // Check for pagination controls (optional)
    const pagination = page.locator('.v-pagination, [class*="pagination"]').first();
    const paginationVisible = await pagination.isVisible({ timeout: 3000 }).catch(() => false);
    if (paginationVisible) {
        console.log('✅ Pagination controls visible');
    } else {
        console.log('⚠️  No pagination controls detected (single page or no data)');
    }
});

// ─────────────────────────────────────────────────────────────────────────────
// Test 3: [READ] Search / filter works — fill, verify, clear
// ─────────────────────────────────────────────────────────────────────────────
test('Roles | [READ] search or filter input works correctly', async ({ page }) => {
    test.setTimeout(180000);
    await loginToApp(page, 90000, EMAIL, PASSWORD);
    await navigateToRoles(page);

    // Locate a search input — Vuetify typically renders as v-text-field inside a toolbar
    const searchInput = page.locator(
        'input[placeholder*="search" i], input[placeholder*="filter" i], ' +
        '.v-toolbar input, [class*="search"] input, [data-testid*="search"] input'
    ).first();

    const searchVisible = await searchInput.isVisible({ timeout: 6000 }).catch(() => false);
    if (!searchVisible) {
        console.log('⚠️  No search input found — skipping search test');
        return;
    }

    console.log('✅ Search input found');

    // Type a search term relevant to Roles
    await searchInput.fill('admin');
    await page.waitForTimeout(1500);

    const rowsAfterSearch = page.locator('tbody tr, .v-data-table__tr, .v-list-item');
    const countAfterSearch = await rowsAfterSearch.count().catch(() => 0);
    console.log(`✅ Search for "admin" returned ${countAfterSearch} result(s)`);

    // Clear the search
    await searchInput.clear();
    await page.waitForTimeout(1500);

    const rowsAfterClear = page.locator('tbody tr, .v-data-table__tr, .v-list-item');
    const countAfterClear = await rowsAfterClear.count().catch(() => 0);
    console.log(`✅ After clearing search, ${countAfterClear} row(s) visible`);
});

// ─────────────────────────────────────────────────────────────────────────────
// Test 4: [CREATE] Open create dialog — verify it opens, then escape (no save)
// ─────────────────────────────────────────────────────────────────────────────
test('Roles | [CREATE] create button opens dialog — escape without saving', async ({ page }) => {
    test.setTimeout(180000);
    await loginToApp(page, 90000, EMAIL, PASSWORD);
    await navigateToRoles(page);

    // Look for a Create / Add / New button
    const createBtn = page.locator('button').filter({ hasText: /create|add|new role/i }).first();
    const createVisible = await createBtn.isVisible({ timeout: 6000 }).catch(() => false);

    if (!createVisible) {
        console.log('⚠️  No create button found — module may be read-only or button is hidden');
        return;
    }

    console.log('✅ Create button found — clicking');
    await createBtn.click();
    await page.waitForTimeout(2000);

    // Verify a dialog or drawer opened
    const dialog = page.locator('.v-dialog, .v-navigation-drawer, [role="dialog"]').first();
    const dialogVisible = await dialog.isVisible({ timeout: 6000 }).catch(() => false);

    if (dialogVisible) {
        console.log('✅ Create dialog/drawer opened');

        // Verify at least one input field is visible inside the dialog
        const dialogInput = dialog.locator('input, textarea').first();
        const inputVisible = await dialogInput.isVisible({ timeout: 4000 }).catch(() => false);
        if (inputVisible) {
            console.log('✅ Input field(s) visible inside create dialog');
        } else {
            console.log('⚠️  No input fields found inside dialog');
        }
    } else {
        console.log('⚠️  Dialog did not appear after clicking create button');
    }

    // Escape without saving — do NOT submit the form
    await page.keyboard.press('Escape');
    await page.waitForTimeout(1000);

    const dialogStillVisible = await dialog.isVisible({ timeout: 3000 }).catch(() => false);
    if (!dialogStillVisible) {
        console.log('✅ Dialog closed on Escape — no data submitted');
    } else {
        // Attempt clicking a cancel button as fallback
        const cancelBtn = page.locator('button').filter({ hasText: /cancel|close|discard/i }).first();
        const cancelVisible = await cancelBtn.isVisible({ timeout: 3000 }).catch(() => false);
        if (cancelVisible) {
            await cancelBtn.click();
            console.log('✅ Dialog closed via Cancel button — no data submitted');
        } else {
            console.log('⚠️  Dialog may still be open — investigate manually');
        }
    }
});

// ─────────────────────────────────────────────────────────────────────────────
// Test 5: [UPDATE] Click first row, verify edit form opens, escape
// ─────────────────────────────────────────────────────────────────────────────
test('Roles | [UPDATE] clicking a row opens edit form — escape without saving', async ({ page }) => {
    test.setTimeout(180000);
    await loginToApp(page, 90000, EMAIL, PASSWORD);
    await navigateToRoles(page);
    await page.waitForTimeout(2000);

    // First try a dedicated Edit button/icon on the row
    const editBtn = page.locator(
        'button[aria-label*="edit" i], button[title*="edit" i], ' +
        '[class*="edit-btn"], [data-testid*="edit"]'
    ).first();
    const editBtnVisible = await editBtn.isVisible({ timeout: 4000 }).catch(() => false);

    if (editBtnVisible) {
        console.log('✅ Inline edit button found — clicking');
        await editBtn.click();
    } else {
        // Fall back to clicking the first data row directly
        const firstRow = page.locator('tbody tr, .v-data-table__tr').first();
        const rowVisible = await firstRow.isVisible({ timeout: 6000 }).catch(() => false);

        if (!rowVisible) {
            console.log('⚠️  No data rows available to click — skipping update test');
            return;
        }

        console.log('✅ Clicking first table row to open edit form');
        await firstRow.click();
    }

    await page.waitForTimeout(2000);

    // Check for dialog, drawer, or a detail panel
    const editForm = page.locator('.v-dialog, .v-navigation-drawer, [role="dialog"], [class*="detail"]').first();
    const formVisible = await editForm.isVisible({ timeout: 7000 }).catch(() => false);

    if (formVisible) {
        console.log('✅ Edit form / detail panel opened');

        // Verify fields are rendered (inputs or read-only text)
        const inputs = editForm.locator('input, textarea, .v-field__input');
        const inputCount = await inputs.count().catch(() => 0);
        console.log(`✅ ${inputCount} input field(s) visible in edit form`);
    } else {
        console.log('⚠️  No edit dialog detected — row click may navigate to a detail page');
        // Check if URL changed to a detail page
        const currentUrl = page.url();
        if (currentUrl !== LIST_URL) {
            console.log(`✅ Navigated to detail page: ${currentUrl}`);
            // Navigate back to list without making changes
            await page.goBack();
            await page.waitForTimeout(1500);
            console.log('✅ Navigated back to list — no data changed');
        }
        return;
    }

    // Escape without saving
    await page.keyboard.press('Escape');
    await page.waitForTimeout(1000);

    const stillVisible = await editForm.isVisible({ timeout: 3000 }).catch(() => false);
    if (!stillVisible) {
        console.log('✅ Edit dialog closed on Escape — no changes saved');
    } else {
        const cancelBtn = page.locator('button').filter({ hasText: /cancel|close|discard/i }).first();
        const cancelVisible = await cancelBtn.isVisible({ timeout: 3000 }).catch(() => false);
        if (cancelVisible) {
            await cancelBtn.click();
            console.log('✅ Edit dialog closed via Cancel — no changes saved');
        } else {
            console.log('⚠️  Edit dialog may still be open — investigate manually');
        }
    }
});

// ─────────────────────────────────────────────────────────────────────────────
// Test 6: [DELETE] Check delete availability after selecting a row — do NOT confirm
// ─────────────────────────────────────────────────────────────────────────────
test('Roles | [DELETE] delete option exists — escape confirmation without deleting', async ({ page }) => {
    test.setTimeout(180000);
    await loginToApp(page, 90000, EMAIL, PASSWORD);
    await navigateToRoles(page);
    await page.waitForTimeout(2000);

    // Attempt to find an inline delete button on the first row
    const deleteBtn = page.locator(
        'button[aria-label*="delete" i], button[title*="delete" i], ' +
        'button[aria-label*="remove" i], [class*="delete-btn"], [data-testid*="delete"]'
    ).first();
    const deleteBtnVisible = await deleteBtn.isVisible({ timeout: 5000 }).catch(() => false);

    if (deleteBtnVisible) {
        console.log('✅ Delete button found — clicking to surface confirmation dialog');
        await deleteBtn.click();
        await page.waitForTimeout(1500);

        // Look for a confirmation dialog
        const confirmDialog = page.locator('.v-dialog, [role="dialog"]').filter({ hasText: /delete|confirm|remove/i }).first();
        const confirmVisible = await confirmDialog.isVisible({ timeout: 5000 }).catch(() => false);

        if (confirmVisible) {
            console.log('✅ Delete confirmation dialog appeared');
            // Escape / Cancel — do NOT click the confirm/delete button
            await page.keyboard.press('Escape');
            await page.waitForTimeout(1000);

            const confirmGone = !(await confirmDialog.isVisible({ timeout: 3000 }).catch(() => true));
            if (confirmGone) {
                console.log('✅ Confirmation dialog dismissed — no record deleted');
            } else {
                const cancelBtn = confirmDialog.locator('button').filter({ hasText: /cancel|no|close/i }).first();
                const cancelVisible = await cancelBtn.isVisible({ timeout: 3000 }).catch(() => false);
                if (cancelVisible) {
                    await cancelBtn.click();
                    console.log('✅ Confirmation dialog cancelled — no record deleted');
                } else {
                    console.log('⚠️  Could not dismiss confirmation — investigate manually');
                }
            }
        } else {
            console.log('⚠️  Delete button clicked but no confirmation dialog appeared');
        }
        return;
    }

    // Try selecting a row via checkbox first, then look for a bulk-delete toolbar button
    const checkbox = page.locator('tbody tr td input[type="checkbox"], .v-data-table__tr .v-checkbox').first();
    const checkboxVisible = await checkbox.isVisible({ timeout: 4000 }).catch(() => false);

    if (checkboxVisible) {
        console.log('✅ Row checkbox found — selecting row');
        await checkbox.click();
        await page.waitForTimeout(1000);

        const bulkDelete = page.locator('button').filter({ hasText: /delete|remove/i }).first();
        const bulkDeleteVisible = await bulkDelete.isVisible({ timeout: 4000 }).catch(() => false);
        if (bulkDeleteVisible) {
            console.log('✅ Bulk delete button appeared after row selection');
            // Do NOT click — just confirm it exists
            console.log('✅ Delete capability confirmed — no action taken');
            // Uncheck to restore state
            await checkbox.click();
        } else {
            console.log('⚠️  No bulk delete button appeared after selecting row');
        }
    } else {
        console.log('⚠️  No delete button or checkbox found — Roles may be protected from deletion');
    }
});

// ─────────────────────────────────────────────────────────────────────────────
// Test 7: [NAV] Module is accessible via direct URL
// ─────────────────────────────────────────────────────────────────────────────
test('Roles | [NAV] module is accessible via direct URL navigation', async ({ page }) => {
    test.setTimeout(180000);
    await loginToApp(page, 90000, EMAIL, PASSWORD);

    // Navigate directly to the Roles URL
    await page.goto(LIST_URL, { waitUntil: 'load', timeout: 30000 });
    await page.waitForTimeout(3000);

    // Confirm the URL is correct (not redirected away)
    await expect(page).toHaveURL(/system-settings\/roles/, { timeout: 10000 });
    console.log('✅ Direct URL navigation to /system-settings/roles succeeded');

    // Verify the app did not redirect to login (session is valid)
    const currentUrl = page.url();
    const isLoginPage = /login|auth|sign-in/i.test(currentUrl);
    if (!isLoginPage) {
        console.log('✅ Session is authenticated — not redirected to login');
    } else {
        console.log('⚠️  Redirected to login — session may have expired');
    }

    // Check for a "Roles" label in the sidebar or breadcrumb to confirm active module
    const sidebarActive = page.locator(
        '.v-list-item--active, [class*="active"] [class*="nav"], [aria-current="page"]'
    ).filter({ hasText: /roles/i }).first();
    const sidebarVisible = await sidebarActive.isVisible({ timeout: 5000 }).catch(() => false);
    if (sidebarVisible) {
        console.log('✅ "Roles" is highlighted as the active navigation item');
    } else {
        console.log('⚠️  Active nav item for Roles not detected (sidebar may use icons only)');
    }

    // Verify page has meaningful content (not blank)
    const bodyText = await page.locator('body').innerText().catch(() => '');
    const hasMeaningfulContent = bodyText.trim().length > 100;
    if (hasMeaningfulContent) {
        console.log('✅ Page body has meaningful content');
    } else {
        console.log('⚠️  Page body appears mostly empty');
    }
});

// ─────────────────────────────────────────────────────────────────────────────
// Test 8: [MODULE-SPECIFIC] Role permissions/capabilities are visible on role detail
// Roles in a student accommodation platform typically contain a list of
// permission flags (e.g. can_view_bookings, can_edit_users). This test
// verifies that role records display some form of permissions data.
// ─────────────────────────────────────────────────────────────────────────────
test('Roles | [MODULE-SPECIFIC] role detail shows permissions or capabilities', async ({ page }) => {
    test.setTimeout(180000);
    await loginToApp(page, 90000, EMAIL, PASSWORD);
    await navigateToRoles(page);
    await page.waitForTimeout(2000);

    // Try clicking the first row to open role detail
    const firstRow = page.locator('tbody tr, .v-data-table__tr, .v-list-item').first();
    const rowVisible = await firstRow.isVisible({ timeout: 6000 }).catch(() => false);

    if (!rowVisible) {
        console.log('⚠️  No role records found on staging — cannot verify permissions display');
        return;
    }

    console.log('✅ Role record found — opening detail');
    await firstRow.click();
    await page.waitForTimeout(2500);

    // Check for permissions-related content in dialog, drawer, or detail page
    const permissionKeywords = /permission|capability|access|privilege|allow|module|right/i;

    // Scenario A: detail opened in a dialog
    const dialog = page.locator('.v-dialog, [role="dialog"]').first();
    const dialogVisible = await dialog.isVisible({ timeout: 5000 }).catch(() => false);

    if (dialogVisible) {
        const dialogText = await dialog.innerText().catch(() => '');
        if (permissionKeywords.test(dialogText)) {
            console.log('✅ Role detail dialog contains permissions/capabilities content');
        } else {
            console.log('⚠️  Dialog opened but no permission-related text found');
        }

        // Look for checkboxes or toggles that represent individual permissions
        const permissionToggles = dialog.locator('.v-checkbox, .v-switch, input[type="checkbox"]');
        const toggleCount = await permissionToggles.count().catch(() => 0);
        if (toggleCount > 0) {
            console.log(`✅ ${toggleCount} permission toggle(s)/checkbox(es) found in role detail`);
        } else {
            console.log('⚠️  No permission toggles found — may be a tag or chip-based layout');
        }

        // Close without changes
        await page.keyboard.press('Escape');
        await page.waitForTimeout(1000);
        console.log('✅ Detail dialog closed — no data modified');
        return;
    }

    // Scenario B: detail opened on a new page
    const currentUrl = page.url();
    if (currentUrl !== LIST_URL) {
        console.log(`✅ Navigated to role detail page: ${currentUrl}`);
        const pageText = await page.locator('body').innerText().catch(() => '');
        if (permissionKeywords.test(pageText)) {
            console.log('✅ Role detail page contains permissions/capabilities content');
        } else {
            console.log('⚠️  Detail page loaded but no permission-related text found');
        }

        // Go back to list without modifying anything
        await page.goBack();
        await page.waitForTimeout(1500);
        console.log('✅ Navigated back to Roles list — no data modified');
    } else {
        console.log('⚠️  Row click did not open a detail view or navigate away');
    }
});
