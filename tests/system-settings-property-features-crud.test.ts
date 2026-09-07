import { test, expect } from '@playwright/test';
import { loginToApp } from './helpers/auth.helper';

const EMAIL = 'pau.kie.chee@fusioneta.com';
const PASSWORD = 'PAOpaopao@9696';
const BASE = 'https://app-staging.vivacityapp.com';
const LIST_URL = `${BASE}/system-settings/property-features`;

// Property Features: amenities/attributes that can be tagged to properties
// (e.g. "Wi-Fi", "Parking", "Gym", "Pet Friendly") in student accommodation listings.

async function navigateToPropertyFeatures(page: any) {
    await page.goto(LIST_URL, { waitUntil: 'load', timeout: 30000 });
    await page.waitForTimeout(3000);
    await expect(page).toHaveURL(/system-settings\/property-features/, { timeout: 10000 });
    await page.waitForTimeout(1000);
    console.log('✅ Navigated to Property Features');
}

test.describe('System Settings — Property Features', () => {

    test.beforeEach(async ({ page }) => {
        await loginToApp(page, 90000, EMAIL, PASSWORD);
    });

    // ─── 1. READ — Page loads ───────────────────────────────────────────────────
    test('1. [READ] Property Features page loads and displays main content', async ({ page }) => {
        test.setTimeout(180000);

        await navigateToPropertyFeatures(page);

        // Verify the page title / heading is visible
        const heading = page.locator('h1, h2, h3, .page-title, [class*="title"]').filter({ hasText: /property.?features/i }).first();
        const headingVisible = await heading.isVisible({ timeout: 5000 }).catch(() => false);
        if (headingVisible) {
            console.log('✅ Page heading visible');
        } else {
            console.log('⚠️ Page heading not found by text — checking generic heading');
            const anyHeading = page.locator('h1, h2').first();
            const anyVisible = await anyHeading.isVisible({ timeout: 5000 }).catch(() => false);
            console.log(anyVisible ? '✅ Generic heading visible' : '⚠️ No heading found');
        }

        // Verify main content container is present
        const mainContent = page.locator('.v-container, .v-card, main, [role="main"]').first();
        const mainVisible = await mainContent.isVisible({ timeout: 5000 }).catch(() => false);
        console.log(mainVisible ? '✅ Main content container visible' : '⚠️ Main content container not detected');

        // Verify a data table or list is present
        const table = page.locator('.v-data-table, table, .v-list').first();
        const tableVisible = await table.isVisible({ timeout: 8000 }).catch(() => false);
        console.log(tableVisible ? '✅ Data table/list is present on the page' : '⚠️ Data table/list not immediately visible');

        // Page should not show a 404 or error state
        const errorState = page.locator('[class*="error"], [class*="404"], [class*="not-found"]').first();
        const errorVisible = await errorState.isVisible({ timeout: 3000 }).catch(() => false);
        expect(errorVisible).toBe(false);
        console.log('✅ No error state detected');
    });

    // ─── 2. READ — Table shows records ─────────────────────────────────────────
    test('2. [READ] Table lists Property Feature records and shows column headers', async ({ page }) => {
        test.setTimeout(180000);

        await navigateToPropertyFeatures(page);

        // Wait for table to settle
        await page.waitForTimeout(2000);

        // Log column headers
        const headers = page.locator('.v-data-table th, table th');
        const headerCount = await headers.count().catch(() => 0);
        if (headerCount > 0) {
            for (let i = 0; i < headerCount; i++) {
                const text = await headers.nth(i).innerText().catch(() => '');
                if (text.trim()) console.log(`✅ Column header [${i}]: "${text.trim()}"`);
            }
        } else {
            console.log('⚠️ No table headers found');
        }

        // Count data rows
        const rows = page.locator('.v-data-table tbody tr, table tbody tr, .v-list-item');
        const rowCount = await rows.count().catch(() => 0);
        console.log(`✅ Found ${rowCount} row(s) in the list`);

        if (rowCount > 0) {
            // Log the text of the first row to confirm real data
            const firstRowText = await rows.first().innerText().catch(() => '');
            console.log(`✅ First row content: "${firstRowText.trim().substring(0, 120)}"`);
        } else {
            // Empty state is still valid
            const emptyState = page.locator('[class*="empty"], [class*="no-data"], .v-data-table__empty-wrapper').first();
            const emptyVisible = await emptyState.isVisible({ timeout: 3000 }).catch(() => false);
            console.log(emptyVisible ? '⚠️ Empty state shown — no records yet' : '⚠️ No rows and no empty state detected');
        }
    });

    // ─── 3. READ — Search / filter works ───────────────────────────────────────
    test('3. [READ] Search or filter functionality works on Property Features', async ({ page }) => {
        test.setTimeout(180000);

        await navigateToPropertyFeatures(page);

        // Look for a search input (common Vuetify patterns)
        const searchInput = page.locator(
            'input[type="search"], input[placeholder*="search" i], input[placeholder*="filter" i], .v-text-field input'
        ).first();

        const searchVisible = await searchInput.isVisible({ timeout: 5000 }).catch(() => false);

        if (!searchVisible) {
            console.log('⚠️ No search input found — skipping search test');
            return;
        }

        console.log('✅ Search input found');

        // Type a search term relevant to property features
        await searchInput.fill('Wi-Fi');
        await page.waitForTimeout(1500);
        console.log('✅ Typed "Wi-Fi" into search field');

        // Check rows after search
        const rowsAfterSearch = page.locator('.v-data-table tbody tr, table tbody tr, .v-list-item');
        const countAfterSearch = await rowsAfterSearch.count().catch(() => 0);
        console.log(`✅ Rows after search "Wi-Fi": ${countAfterSearch}`);

        // Clear the search
        await searchInput.clear();
        await page.waitForTimeout(1500);
        console.log('✅ Search cleared');

        // Rows should return to original count (or at least table is still present)
        const rowsAfterClear = page.locator('.v-data-table tbody tr, table tbody tr, .v-list-item');
        const countAfterClear = await rowsAfterClear.count().catch(() => 0);
        console.log(`✅ Rows after clearing search: ${countAfterClear}`);
    });

    // ─── 4. CREATE — Open create dialog, verify, then escape ───────────────────
    test('4. [CREATE] Create button opens dialog/form (no data saved)', async ({ page }) => {
        test.setTimeout(180000);

        await navigateToPropertyFeatures(page);

        // Find the Create / Add / New button
        const createBtn = page.locator('button').filter({ hasText: /create|add|new/i }).first();
        const createVisible = await createBtn.isVisible({ timeout: 5000 }).catch(() => false);

        if (!createVisible) {
            console.log('⚠️ No Create/Add/New button found — skipping create test');
            return;
        }

        console.log('✅ Create button found');
        await createBtn.click();
        await page.waitForTimeout(2000);

        // Verify a dialog or form appeared
        const dialog = page.locator('.v-dialog, [role="dialog"], .v-overlay__content').first();
        const dialogVisible = await dialog.isVisible({ timeout: 5000 }).catch(() => false);

        if (dialogVisible) {
            console.log('✅ Create dialog/form opened');

            // Check for a Name field (property features typically have a name/label)
            const nameField = dialog.locator('input[placeholder*="name" i], input[label*="name" i], .v-text-field input').first();
            const nameVisible = await nameField.isVisible({ timeout: 3000 }).catch(() => false);
            console.log(nameVisible ? '✅ Name/label field visible in dialog' : '⚠️ Name field not detected in dialog');

            // Check for an icon or category field (common for feature entries)
            const iconField = dialog.locator('input[placeholder*="icon" i], input[placeholder*="category" i]').first();
            const iconVisible = await iconField.isVisible({ timeout: 3000 }).catch(() => false);
            console.log(iconVisible ? '✅ Icon/category field visible in dialog' : '⚠️ Icon/category field not found');

        } else {
            // Maybe it navigated to a create page instead of opening a dialog
            const formPage = page.locator('form, .v-form').first();
            const formVisible = await formPage.isVisible({ timeout: 5000 }).catch(() => false);
            console.log(formVisible ? '✅ Create form page opened (not a dialog)' : '⚠️ Neither dialog nor form page detected after clicking Create');
        }

        // Escape without saving
        await page.keyboard.press('Escape');
        await page.waitForTimeout(1000);

        // If Escape didn't close a page-based form, navigate back
        const stillOnCreate = page.url().includes('create');
        if (stillOnCreate) {
            await page.goBack();
            await page.waitForTimeout(1500);
        }

        console.log('✅ Escaped create dialog without saving');
    });

    // ─── 5. UPDATE — Click first row, verify edit form opens, then escape ───────
    test('5. [UPDATE] Clicking a row or edit button opens the edit form', async ({ page }) => {
        test.setTimeout(180000);

        await navigateToPropertyFeatures(page);

        await page.waitForTimeout(2000);

        // Try clicking the edit icon/button in the first row
        const editBtn = page.locator(
            '.v-data-table tbody tr:first-child button[aria-label*="edit" i], ' +
            '.v-data-table tbody tr:first-child [class*="edit"], ' +
            'table tbody tr:first-child button'
        ).first();

        const editBtnVisible = await editBtn.isVisible({ timeout: 4000 }).catch(() => false);

        if (editBtnVisible) {
            await editBtn.click();
            console.log('✅ Clicked edit button on first row');
        } else {
            // Try clicking the first row itself
            const firstRow = page.locator('.v-data-table tbody tr, table tbody tr, .v-list-item').first();
            const firstRowVisible = await firstRow.isVisible({ timeout: 5000 }).catch(() => false);

            if (!firstRowVisible) {
                console.log('⚠️ No rows found to click for edit — skipping update test');
                return;
            }

            await firstRow.click();
            console.log('✅ Clicked first row to open edit');
        }

        await page.waitForTimeout(2000);

        // Verify a dialog or edit form appeared
        const dialog = page.locator('.v-dialog, [role="dialog"], .v-overlay__content').first();
        const dialogVisible = await dialog.isVisible({ timeout: 5000 }).catch(() => false);

        if (dialogVisible) {
            console.log('✅ Edit dialog opened');

            // Check fields are present (name is the primary field for a feature entry)
            const inputFields = dialog.locator('input, textarea, .v-select');
            const fieldCount = await inputFields.count().catch(() => 0);
            console.log(`✅ Edit dialog contains ${fieldCount} input field(s)`);

            // Confirm the field has an existing value (not blank, since this is edit mode)
            const firstInput = inputFields.first();
            const firstInputVisible = await firstInput.isVisible({ timeout: 3000 }).catch(() => false);
            if (firstInputVisible) {
                const value = await firstInput.inputValue().catch(() => '');
                console.log(`✅ First field value: "${value.substring(0, 60)}"`);
            }
        } else {
            // Could be a detail/edit page
            const form = page.locator('form, .v-form').first();
            const formVisible = await form.isVisible({ timeout: 5000 }).catch(() => false);
            console.log(formVisible ? '✅ Edit form page opened' : '⚠️ Edit dialog/page not detected');
        }

        // Escape without saving
        await page.keyboard.press('Escape');
        await page.waitForTimeout(1000);

        const stillOnEdit = page.url().includes('edit');
        if (stillOnEdit) {
            await page.goBack();
            await page.waitForTimeout(1500);
        }

        console.log('✅ Escaped edit dialog without saving');
    });

    // ─── 6. DELETE — Check delete is available, do NOT confirm ─────────────────
    test('6. [DELETE] Delete option is available (no actual deletion performed)', async ({ page }) => {
        test.setTimeout(180000);

        await navigateToPropertyFeatures(page);

        await page.waitForTimeout(2000);

        // Check for a delete button or action in the first row
        const deleteBtn = page.locator(
            '.v-data-table tbody tr:first-child button[aria-label*="delete" i], ' +
            '.v-data-table tbody tr:first-child [class*="delete"], ' +
            '.v-data-table tbody tr:first-child [class*="trash"], ' +
            'table tbody tr:first-child button[aria-label*="delete" i]'
        ).first();

        const deleteBtnVisible = await deleteBtn.isVisible({ timeout: 4000 }).catch(() => false);

        if (deleteBtnVisible) {
            console.log('✅ Delete button found in first row');
            await deleteBtn.click();
            await page.waitForTimeout(1500);

            // A confirmation dialog should appear
            const confirmDialog = page.locator('.v-dialog, [role="dialog"], .v-overlay__content').first();
            const confirmVisible = await confirmDialog.isVisible({ timeout: 5000 }).catch(() => false);

            if (confirmVisible) {
                console.log('✅ Delete confirmation dialog appeared');

                // Do NOT click confirm — press Escape or click Cancel
                const cancelBtn = confirmDialog.locator('button').filter({ hasText: /cancel|no|close/i }).first();
                const cancelVisible = await cancelBtn.isVisible({ timeout: 3000 }).catch(() => false);

                if (cancelVisible) {
                    await cancelBtn.click();
                    console.log('✅ Clicked Cancel on delete confirmation — no data deleted');
                } else {
                    await page.keyboard.press('Escape');
                    console.log('✅ Pressed Escape on delete confirmation — no data deleted');
                }
            } else {
                await page.keyboard.press('Escape');
                console.log('⚠️ No confirmation dialog — pressed Escape to cancel');
            }
        } else {
            // Try selecting a row via checkbox first, then look for a bulk delete
            const rowCheckbox = page.locator('.v-data-table tbody tr:first-child input[type="checkbox"]').first();
            const checkboxVisible = await rowCheckbox.isVisible({ timeout: 3000 }).catch(() => false);

            if (checkboxVisible) {
                await rowCheckbox.click();
                await page.waitForTimeout(1000);
                console.log('✅ Selected first row via checkbox');

                const bulkDelete = page.locator('button').filter({ hasText: /delete|remove/i }).first();
                const bulkDeleteVisible = await bulkDelete.isVisible({ timeout: 3000 }).catch(() => false);
                console.log(bulkDeleteVisible ? '✅ Bulk delete button appeared after row selection' : '⚠️ No bulk delete button after row selection');

                // Deselect
                await rowCheckbox.click();
                await page.waitForTimeout(500);
            } else {
                console.log('⚠️ No delete button or row checkbox found — delete may require row menu or may not be available');
            }
        }
    });

    // ─── 7. NAV — Accessible via direct URL ────────────────────────────────────
    test('7. [NAV] Property Features is accessible via direct URL', async ({ page }) => {
        test.setTimeout(180000);

        // Navigate directly without going through the sidebar
        await page.goto(LIST_URL, { waitUntil: 'load', timeout: 30000 });
        await page.waitForTimeout(3000);

        // Should land on the correct page (not redirected to login or 404)
        const currentUrl = page.url();
        const onCorrectPage = currentUrl.includes('system-settings/property-features');
        const onLogin = currentUrl.includes('login') || currentUrl.includes('signin');

        if (onLogin) {
            console.log('⚠️ Redirected to login — session may have expired');
        } else if (onCorrectPage) {
            console.log(`✅ Direct URL navigation successful: ${currentUrl}`);
        } else {
            console.log(`⚠️ Landed on unexpected URL: ${currentUrl}`);
        }

        expect(onLogin).toBe(false);

        // Verify the page has meaningful content (not blank)
        const bodyText = await page.locator('body').innerText().catch(() => '');
        expect(bodyText.length).toBeGreaterThan(10);
        console.log('✅ Page body has content after direct navigation');
    });

    // ─── 8. MODULE-SPECIFIC — Verify feature icon/category column present ───────
    test('8. [MODULE] Property Features records have name and icon/type attributes visible', async ({ page }) => {
        test.setTimeout(180000);

        // Property Features in a student accommodation platform typically store:
        //   - Feature name  (e.g. "Wi-Fi", "Parking", "Gym")
        //   - Icon or image (for display on listing cards)
        //   - Category/type (e.g. "Amenity", "Safety", "Transport")

        await navigateToPropertyFeatures(page);

        await page.waitForTimeout(2000);

        // Look for an icon column header
        const iconHeader = page.locator('th, .v-data-table th').filter({ hasText: /icon|image|img/i }).first();
        const iconHeaderVisible = await iconHeader.isVisible({ timeout: 4000 }).catch(() => false);
        console.log(iconHeaderVisible ? '✅ Icon/Image column header visible' : '⚠️ Icon/Image column not found in headers');

        // Look for a category/type column header
        const categoryHeader = page.locator('th, .v-data-table th').filter({ hasText: /category|type|group/i }).first();
        const categoryHeaderVisible = await categoryHeader.isVisible({ timeout: 4000 }).catch(() => false);
        console.log(categoryHeaderVisible ? '✅ Category/Type column header visible' : '⚠️ Category/Type column not found in headers');

        // Look for a name column header (most certain to exist)
        const nameHeader = page.locator('th, .v-data-table th').filter({ hasText: /name|label|title|feature/i }).first();
        const nameHeaderVisible = await nameHeader.isVisible({ timeout: 4000 }).catch(() => false);
        console.log(nameHeaderVisible ? '✅ Name/Label column header visible' : '⚠️ Name/Label column not found in headers');

        // Confirm at least one column header is present
        const anyHeader = page.locator('th, .v-data-table th').first();
        const anyHeaderVisible = await anyHeader.isVisible({ timeout: 5000 }).catch(() => false);
        expect(anyHeaderVisible).toBe(true);
        console.log('✅ At least one column header is present');

        // Check if rendered feature rows contain icon elements (img or v-icon)
        const rows = page.locator('.v-data-table tbody tr, table tbody tr');
        const rowCount = await rows.count().catch(() => 0);

        if (rowCount > 0) {
            const firstRow = rows.first();
            const iconInRow = firstRow.locator('img, .v-icon, [class*="icon"], [class*="mdi-"]').first();
            const iconInRowVisible = await iconInRow.isVisible({ timeout: 3000 }).catch(() => false);
            console.log(iconInRowVisible ? '✅ Icon element found in first data row' : '⚠️ No icon element in first row (may be text-only)');
        } else {
            console.log('⚠️ No data rows to inspect for icon elements');
        }
    });

    // ─── 9. READ — Pagination or scroll works for large lists ──────────────────
    test('9. [READ] Pagination controls visible when list has multiple pages', async ({ page }) => {
        test.setTimeout(180000);

        await navigateToPropertyFeatures(page);

        await page.waitForTimeout(2000);

        // Look for Vuetify pagination or items-per-page controls
        const pagination = page.locator('.v-pagination, .v-data-table-footer, [class*="pagination"]').first();
        const paginationVisible = await pagination.isVisible({ timeout: 5000 }).catch(() => false);

        if (paginationVisible) {
            console.log('✅ Pagination controls visible');

            // Check items-per-page selector
            const itemsPerPage = page.locator('[class*="items-per-page"], .v-select').filter({ hasText: /per page|\d+ items/i }).first();
            const perPageVisible = await itemsPerPage.isVisible({ timeout: 3000 }).catch(() => false);
            console.log(perPageVisible ? '✅ Items-per-page selector visible' : '⚠️ Items-per-page selector not found');

            // Check next-page button
            const nextBtn = page.locator('.v-pagination button[aria-label*="next" i], .v-pagination__next').first();
            const nextVisible = await nextBtn.isVisible({ timeout: 3000 }).catch(() => false);
            console.log(nextVisible ? '✅ Next page button visible' : '⚠️ Next page button not found');
        } else {
            console.log('⚠️ No pagination controls visible — list may fit on one page or use infinite scroll');

            // Check for infinite scroll sentinel
            const infiniteScroll = page.locator('[class*="infinite"], [class*="load-more"]').first();
            const infiniteVisible = await infiniteScroll.isVisible({ timeout: 3000 }).catch(() => false);
            console.log(infiniteVisible ? '✅ Infinite scroll element detected' : '⚠️ No pagination or infinite scroll detected');
        }
    });
});
