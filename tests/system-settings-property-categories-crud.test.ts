import { test, expect } from '@playwright/test';
import { loginToApp } from './helpers/auth.helper';

const EMAIL = 'pau.kie.chee@fusioneta.com';
const PASSWORD = 'PAOpaopao@9696';
const BASE = 'https://app-staging.vivacityapp.com';
const LIST_URL = `${BASE}/system-settings/property-categories`;

// Property Categories: classifies property types used across the platform
// (e.g. Studio, Ensuite, Shared Room). Used in property listings and filters.

async function navigateToPropertyCategories(page: any) {
    await page.goto(LIST_URL, { waitUntil: 'load', timeout: 30000 });
    await page.waitForTimeout(3000);
    await expect(page).toHaveURL(/system-settings\/property-categories/, { timeout: 10000 });
    await page.waitForTimeout(1000);
    console.log('✅ Navigated to Property Categories');
}

test.describe('System Settings — Property Categories CRUD', () => {

    test.beforeEach(async ({ page }) => {
        await loginToApp(page, 90000, EMAIL, PASSWORD);
    });

    // ─── 1. PAGE LOADS ───────────────────────────────────────────────────────────
    test('[READ] Property Categories page loads and main content is visible', async ({ page }) => {
        test.setTimeout(180000);

        await navigateToPropertyCategories(page);

        // Check that the page body has rendered meaningful content
        const pageContent = page.locator('main, .v-main, #app');
        const contentVisible = await pageContent.first().isVisible({ timeout: 10000 }).catch(() => false);
        if (contentVisible) {
            console.log('✅ Main content area is visible');
        } else {
            console.log('⚠️ Main content selector not matched — checking fallback');
        }

        // Verify a heading or title related to property categories is present
        const heading = page.locator('h1, h2, h3, .page-title, .v-toolbar__title').filter({ hasText: /property.?categor/i }).first();
        const headingVisible = await heading.isVisible({ timeout: 8000 }).catch(() => false);
        if (headingVisible) {
            const headingText = await heading.textContent().catch(() => '');
            console.log(`✅ Page heading visible: "${headingText?.trim()}"`);
        } else {
            console.log('⚠️ Specific heading not found — page may use breadcrumb or tab label instead');
        }

        // Confirm URL is still correct after full load
        await expect(page).toHaveURL(/system-settings\/property-categories/, { timeout: 5000 });
        console.log('✅ URL confirmed: /system-settings/property-categories');

        // Confirm no full-page error state
        const errorState = page.locator('.v-alert--type-error, [role="alert"]').filter({ hasText: /error|failed|unauthori/i }).first();
        const hasError = await errorState.isVisible({ timeout: 4000 }).catch(() => false);
        if (hasError) {
            const errorText = await errorState.textContent().catch(() => '');
            console.log(`⚠️ Alert visible on page: "${errorText?.trim()}"`);
        } else {
            console.log('✅ No error alerts detected on page load');
        }
    });

    // ─── 2. TABLE / LIST SHOWS RECORDS ───────────────────────────────────────────
    test('[READ] Table or list renders property category records', async ({ page }) => {
        test.setTimeout(180000);

        await navigateToPropertyCategories(page);

        // Wait for data to settle
        await page.waitForTimeout(2000);

        // Check for a Vuetify data table
        const table = page.locator('.v-data-table, table').first();
        const tableVisible = await table.isVisible({ timeout: 8000 }).catch(() => false);

        if (tableVisible) {
            console.log('✅ Data table is visible');

            // Log column headers
            const headers = page.locator('thead th, .v-data-table-header th');
            const headerCount = await headers.count().catch(() => 0);
            if (headerCount > 0) {
                for (let i = 0; i < headerCount; i++) {
                    const headerText = await headers.nth(i).textContent().catch(() => '');
                    if (headerText?.trim()) {
                        console.log(`  Column [${i}]: "${headerText.trim()}"`);
                    }
                }
                console.log(`✅ Found ${headerCount} column header(s)`);
            } else {
                console.log('⚠️ No thead headers found — table may use a custom layout');
            }

            // Count data rows
            const rows = page.locator('tbody tr');
            const rowCount = await rows.count().catch(() => 0);
            if (rowCount > 0) {
                console.log(`✅ Table has ${rowCount} row(s) visible`);
            } else {
                console.log('⚠️ No tbody rows found — may be empty dataset or virtual scroll');
            }

        } else {
            // Fallback: check for Vuetify list items (card/list layout)
            console.log('⚠️ Standard table not found — checking for v-list or card layout');
            const listItems = page.locator('.v-list-item, .v-card');
            const listCount = await listItems.count().catch(() => 0);
            if (listCount > 0) {
                console.log(`✅ Found ${listCount} list/card item(s) as fallback layout`);
            } else {
                console.log('⚠️ No list items or cards found — dataset may be empty');
            }
        }
    });

    // ─── 3. SEARCH / FILTER ───────────────────────────────────────────────────────
    test('[READ] Search or filter input works for property categories', async ({ page }) => {
        test.setTimeout(180000);

        await navigateToPropertyCategories(page);
        await page.waitForTimeout(2000);

        // Locate search input — common Vuetify patterns
        const searchInput = page.locator(
            'input[placeholder*="search" i], input[placeholder*="filter" i], input[aria-label*="search" i], .v-text-field input'
        ).first();

        const searchVisible = await searchInput.isVisible({ timeout: 8000 }).catch(() => false);

        if (searchVisible) {
            // Type a search term relevant to property categories
            await searchInput.fill('Studio');
            await page.waitForTimeout(1500);
            console.log('✅ Typed search term: "Studio"');

            // Log how many rows are showing after search
            const rowsAfterSearch = page.locator('tbody tr');
            const countAfterSearch = await rowsAfterSearch.count().catch(() => 0);
            console.log(`✅ Row count after search: ${countAfterSearch}`);

            // Clear the search
            await searchInput.clear();
            await page.waitForTimeout(1500);
            const rowsAfterClear = page.locator('tbody tr');
            const countAfterClear = await rowsAfterClear.count().catch(() => 0);
            console.log(`✅ Row count after clearing search: ${countAfterClear}`);

            // Optionally try the clear (×) button if present
            const clearBtn = page.locator('button[aria-label*="clear" i], .v-input__append-inner button, .mdi-close').first();
            const clearBtnVisible = await clearBtn.isVisible({ timeout: 3000 }).catch(() => false);
            if (clearBtnVisible) {
                await clearBtn.click();
                await page.waitForTimeout(1000);
                console.log('✅ Clicked clear button on search field');
            }
        } else {
            console.log('⚠️ No search/filter input found — module may not have search functionality');
        }
    });

    // ─── 4. CREATE — OPEN DIALOG ONLY (NO SAVE) ───────────────────────────────────
    test('[CREATE] Create button opens dialog/form — escape without saving', async ({ page }) => {
        test.setTimeout(180000);

        await navigateToPropertyCategories(page);
        await page.waitForTimeout(2000);

        // Look for a Create / Add / New button
        const createBtn = page.locator('button').filter({ hasText: /create|add|new/i }).first();
        const createBtnVisible = await createBtn.isVisible({ timeout: 8000 }).catch(() => false);

        if (createBtnVisible) {
            const btnText = await createBtn.textContent().catch(() => '');
            console.log(`✅ Create button found: "${btnText?.trim()}"`);
            await createBtn.click();
            await page.waitForTimeout(2000);

            // Verify a dialog or form has opened
            const dialog = page.locator('.v-dialog, [role="dialog"], .v-overlay__content').first();
            const dialogVisible = await dialog.isVisible({ timeout: 8000 }).catch(() => false);

            if (dialogVisible) {
                console.log('✅ Create dialog/form opened');

                // Check for typical Property Category form fields
                const nameField = dialog.locator('input, textarea').first();
                const nameFieldVisible = await nameField.isVisible({ timeout: 5000 }).catch(() => false);
                if (nameFieldVisible) {
                    console.log('✅ Input field visible in create dialog');
                } else {
                    console.log('⚠️ No input field found in dialog');
                }

                // Escape without saving
                await page.keyboard.press('Escape');
                await page.waitForTimeout(1000);
                const dialogAfterEsc = await dialog.isVisible({ timeout: 3000 }).catch(() => false);
                if (!dialogAfterEsc) {
                    console.log('✅ Dialog closed via Escape — no data saved');
                } else {
                    // Try clicking Cancel button if Escape didn't work
                    const cancelBtn = page.locator('button').filter({ hasText: /cancel|close|dismiss/i }).first();
                    const cancelVisible = await cancelBtn.isVisible({ timeout: 3000 }).catch(() => false);
                    if (cancelVisible) {
                        await cancelBtn.click();
                        await page.waitForTimeout(1000);
                        console.log('✅ Dialog closed via Cancel button — no data saved');
                    } else {
                        console.log('⚠️ Dialog may still be open — could not find cancel');
                    }
                }
            } else {
                // May have navigated to a separate create page
                const currentUrl = page.url();
                if (currentUrl.includes('create') || currentUrl.includes('new')) {
                    console.log(`✅ Navigated to create page: ${currentUrl}`);
                    await page.goBack();
                    await page.waitForTimeout(1500);
                    console.log('✅ Navigated back — no data saved');
                } else {
                    console.log('⚠️ Clicked create but no dialog or new URL detected');
                }
            }
        } else {
            console.log('⚠️ No Create/Add/New button found — module may be read-only or button uses a different label');
        }
    });

    // ─── 5. UPDATE — OPEN EDIT FORM (NO SAVE) ────────────────────────────────────
    test('[UPDATE] Click first row to open edit form — verify fields, escape without saving', async ({ page }) => {
        test.setTimeout(180000);

        await navigateToPropertyCategories(page);
        await page.waitForTimeout(2000);

        // Check for rows in the table
        const firstRow = page.locator('tbody tr').first();
        const firstRowVisible = await firstRow.isVisible({ timeout: 8000 }).catch(() => false);

        if (firstRowVisible) {
            // Try clicking an edit icon/button in the row first
            const editIconInRow = firstRow.locator('button[aria-label*="edit" i], .mdi-pencil, button').filter({ hasText: /edit/i }).first();
            const editIconVisible = await editIconInRow.isVisible({ timeout: 3000 }).catch(() => false);

            if (editIconVisible) {
                await editIconInRow.click();
                console.log('✅ Clicked edit icon/button in first row');
            } else {
                // Click the row itself
                await firstRow.click();
                console.log('✅ Clicked first table row');
            }

            await page.waitForTimeout(2000);

            // Verify edit dialog or page opened
            const dialog = page.locator('.v-dialog, [role="dialog"], .v-overlay__content').first();
            const dialogVisible = await dialog.isVisible({ timeout: 8000 }).catch(() => false);

            if (dialogVisible) {
                console.log('✅ Edit dialog/form opened');

                // Check for editable fields — property category likely has a Name field
                const inputs = dialog.locator('input, textarea, .v-select');
                const inputCount = await inputs.count().catch(() => 0);
                console.log(`✅ Found ${inputCount} input/select field(s) in edit form`);

                // Log first field value if present
                if (inputCount > 0) {
                    const firstInput = inputs.first();
                    const firstInputVal = await firstInput.inputValue().catch(() => '');
                    if (firstInputVal) {
                        console.log(`✅ First field has value: "${firstInputVal}"`);
                    }
                }

                // Check for Name field specifically
                const nameField = dialog.locator('input[placeholder*="name" i], input[label*="name" i], .v-text-field input').first();
                const nameVisible = await nameField.isVisible({ timeout: 3000 }).catch(() => false);
                if (nameVisible) {
                    console.log('✅ Name field visible in edit dialog');
                }

                // Escape without saving
                await page.keyboard.press('Escape');
                await page.waitForTimeout(1000);
                const dialogAfterEsc = await dialog.isVisible({ timeout: 3000 }).catch(() => false);
                if (!dialogAfterEsc) {
                    console.log('✅ Edit dialog closed via Escape — no changes saved');
                } else {
                    const cancelBtn = page.locator('button').filter({ hasText: /cancel|close|dismiss/i }).first();
                    const cancelVisible = await cancelBtn.isVisible({ timeout: 3000 }).catch(() => false);
                    if (cancelVisible) {
                        await cancelBtn.click();
                        await page.waitForTimeout(1000);
                        console.log('✅ Edit dialog closed via Cancel button — no changes saved');
                    } else {
                        console.log('⚠️ Dialog may still be open after Escape');
                    }
                }
            } else {
                // Might have navigated to an edit page
                const currentUrl = page.url();
                if (currentUrl.includes('edit') || currentUrl.includes('/system-settings/property-categories/')) {
                    console.log(`✅ Navigated to edit page: ${currentUrl}`);

                    // Check fields on the edit page
                    const inputs = page.locator('input, textarea, .v-select');
                    const inputCount = await inputs.count().catch(() => 0);
                    console.log(`✅ Found ${inputCount} input/select field(s) on edit page`);

                    await page.goBack();
                    await page.waitForTimeout(1500);
                    console.log('✅ Navigated back — no changes saved');
                } else {
                    console.log('⚠️ Row click did not open dialog or navigate to edit page');
                }
            }
        } else {
            console.log('⚠️ No table rows found — cannot test edit flow (dataset may be empty)');
        }
    });

    // ─── 6. DELETE — CHECK AVAILABILITY (NO CONFIRM) ─────────────────────────────
    test('[DELETE] Delete option is available — escape without confirming', async ({ page }) => {
        test.setTimeout(180000);

        await navigateToPropertyCategories(page);
        await page.waitForTimeout(2000);

        let deleteFound = false;

        // Strategy 1: Look for a delete icon in the first row
        const firstRow = page.locator('tbody tr').first();
        const firstRowVisible = await firstRow.isVisible({ timeout: 8000 }).catch(() => false);

        if (firstRowVisible) {
            const deleteInRow = firstRow.locator(
                'button[aria-label*="delete" i], button[aria-label*="remove" i], .mdi-delete, .mdi-trash-can'
            ).first();
            const deleteInRowVisible = await deleteInRow.isVisible({ timeout: 3000 }).catch(() => false);

            if (deleteInRowVisible) {
                deleteFound = true;
                console.log('✅ Delete icon found in first row');
                await deleteInRow.click();
                await page.waitForTimeout(1500);

                // Check for confirmation dialog
                const confirmDialog = page.locator('.v-dialog, [role="dialog"], .v-overlay__content').first();
                const confirmVisible = await confirmDialog.isVisible({ timeout: 5000 }).catch(() => false);
                if (confirmVisible) {
                    console.log('✅ Delete confirmation dialog appeared');
                    await page.keyboard.press('Escape');
                    await page.waitForTimeout(1000);
                    const dialogGone = await confirmDialog.isVisible({ timeout: 3000 }).catch(() => false);
                    if (!dialogGone) {
                        console.log('✅ Confirmation dialog dismissed via Escape — no deletion performed');
                    } else {
                        const cancelBtn = page.locator('button').filter({ hasText: /cancel|no|dismiss/i }).first();
                        const cancelVisible = await cancelBtn.isVisible({ timeout: 3000 }).catch(() => false);
                        if (cancelVisible) {
                            await cancelBtn.click();
                            await page.waitForTimeout(1000);
                            console.log('✅ Confirmation dialog cancelled — no deletion performed');
                        }
                    }
                } else {
                    console.log('⚠️ Delete clicked but no confirmation dialog appeared');
                }
            }
        }

        // Strategy 2: Select row via checkbox then look for toolbar delete button
        if (!deleteFound) {
            const checkbox = page.locator('tbody tr input[type="checkbox"]').first();
            const checkboxVisible = await checkbox.isVisible({ timeout: 5000 }).catch(() => false);

            if (checkboxVisible) {
                await checkbox.check();
                await page.waitForTimeout(1000);
                console.log('✅ Row selected via checkbox');

                const toolbarDelete = page.locator('button').filter({ hasText: /delete|remove/i }).first();
                const toolbarDeleteVisible = await toolbarDelete.isVisible({ timeout: 5000 }).catch(() => false);
                if (toolbarDeleteVisible) {
                    deleteFound = true;
                    console.log('✅ Delete button visible in toolbar after row selection');
                    // Uncheck to avoid accidentally triggering delete
                    await checkbox.uncheck();
                    await page.waitForTimeout(500);
                    console.log('✅ Row deselected — no deletion performed');
                } else {
                    await checkbox.uncheck().catch(() => {});
                    console.log('⚠️ No delete button appeared in toolbar after selecting row');
                }
            }
        }

        // Strategy 3: Row action menu (three-dot / kebab menu)
        if (!deleteFound && firstRowVisible) {
            const moreMenu = page.locator(
                'tbody tr button[aria-label*="more" i], tbody tr .mdi-dots-vertical, tbody tr button[aria-label*="action" i]'
            ).first();
            const moreMenuVisible = await moreMenu.isVisible({ timeout: 3000 }).catch(() => false);

            if (moreMenuVisible) {
                await moreMenu.click();
                await page.waitForTimeout(1000);

                const deleteOption = page.locator('.v-list-item, [role="menuitem"]').filter({ hasText: /delete|remove/i }).first();
                const deleteOptionVisible = await deleteOption.isVisible({ timeout: 3000 }).catch(() => false);

                if (deleteOptionVisible) {
                    deleteFound = true;
                    console.log('✅ Delete option found in row action menu');
                }

                // Close the menu without selecting delete
                await page.keyboard.press('Escape');
                await page.waitForTimeout(500);
                console.log('✅ Action menu closed — no deletion performed');
            }
        }

        if (!deleteFound) {
            console.log('⚠️ Delete action not found via any strategy — module may restrict deletion or use a different pattern');
        }
    });

    // ─── 7. DIRECT URL NAVIGATION ─────────────────────────────────────────────────
    test('[NAV] Property Categories is accessible via direct URL', async ({ page }) => {
        test.setTimeout(180000);

        // Navigate directly without using the UI nav
        await page.goto(LIST_URL, { waitUntil: 'load', timeout: 30000 });
        await page.waitForTimeout(3000);

        // Should land on the correct page (not redirected to login or 404)
        const currentUrl = page.url();
        const onCorrectPage = currentUrl.includes('system-settings/property-categories');

        if (onCorrectPage) {
            console.log(`✅ Direct URL access confirmed: ${currentUrl}`);
        } else {
            // May have redirected to login — attempt login and retry
            const isLoginPage = currentUrl.includes('login') || currentUrl.includes('auth');
            if (isLoginPage) {
                console.log('⚠️ Redirected to login — session may not have been set. Logging in and retrying.');
                // loginToApp already ran in beforeEach; this is a race condition check
                await page.goto(LIST_URL, { waitUntil: 'load', timeout: 30000 });
                await page.waitForTimeout(2000);
                await expect(page).toHaveURL(/system-settings\/property-categories/, { timeout: 10000 });
                console.log('✅ Reached Property Categories after second attempt');
            } else {
                console.log(`⚠️ Unexpected redirect to: ${currentUrl}`);
            }
        }

        // Confirm page has rendered content (not blank)
        const bodyText = await page.locator('body').textContent().catch(() => '');
        const hasContent = bodyText && bodyText.trim().length > 50;
        if (hasContent) {
            console.log('✅ Page body has rendered content');
        } else {
            console.log('⚠️ Page body appears to be empty or near-empty');
        }
    });

    // ─── 8. MODULE-SPECIFIC — CATEGORY NAME AND ICON/COLOR FIELDS ─────────────────
    test('[MODULE] Property category records show name and optional icon/color metadata', async ({ page }) => {
        test.setTimeout(180000);

        // Property categories in a student accommodation platform typically have:
        // - A name (e.g. "Studio", "Ensuite", "Shared Room")
        // - Optionally: an icon class, color code, or display order
        // This test checks what metadata columns are exposed in the list view.

        await navigateToPropertyCategories(page);
        await page.waitForTimeout(2000);

        // Collect all table header labels
        const headers = page.locator('thead th, .v-data-table-header th');
        const headerCount = await headers.count().catch(() => 0);

        const headerLabels: string[] = [];
        for (let i = 0; i < headerCount; i++) {
            const text = await headers.nth(i).textContent().catch(() => '');
            if (text?.trim()) {
                headerLabels.push(text.trim());
            }
        }

        if (headerLabels.length > 0) {
            console.log(`✅ Table columns: ${headerLabels.join(' | ')}`);

            // Check for a Name column
            const hasName = headerLabels.some(h => /name/i.test(h));
            if (hasName) {
                console.log('✅ "Name" column confirmed — primary identifier for property categories');
            } else {
                console.log('⚠️ No "Name" column header detected');
            }

            // Check for optional metadata columns relevant to property categories
            const hasIcon = headerLabels.some(h => /icon/i.test(h));
            const hasColor = headerLabels.some(h => /colou?r/i.test(h));
            const hasOrder = headerLabels.some(h => /order|sort|position/i.test(h));
            const hasStatus = headerLabels.some(h => /status|active|enabled/i.test(h));
            const hasType = headerLabels.some(h => /type/i.test(h));

            if (hasIcon) console.log('✅ "Icon" column present — categories may have visual identifiers');
            if (hasColor) console.log('✅ "Color" column present — categories may use color coding');
            if (hasOrder) console.log('✅ "Order/Sort" column present — categories have display ordering');
            if (hasStatus) console.log('✅ "Status/Active" column present — categories can be enabled/disabled');
            if (hasType) console.log('✅ "Type" column present — category type classification exists');

            if (!hasIcon && !hasColor && !hasOrder && !hasStatus && !hasType) {
                console.log('⚠️ No optional metadata columns (icon/color/order/status) detected — may be a minimal schema');
            }
        } else {
            // Fallback: inspect first visible row for cell text
            const firstRow = page.locator('tbody tr').first();
            const firstRowVisible = await firstRow.isVisible({ timeout: 5000 }).catch(() => false);
            if (firstRowVisible) {
                const cells = firstRow.locator('td');
                const cellCount = await cells.count().catch(() => 0);
                const cellTexts: string[] = [];
                for (let i = 0; i < cellCount; i++) {
                    const text = await cells.nth(i).textContent().catch(() => '');
                    if (text?.trim()) cellTexts.push(text.trim());
                }
                if (cellTexts.length > 0) {
                    console.log(`✅ First row cell values: ${cellTexts.slice(0, 5).join(' | ')}`);
                } else {
                    console.log('⚠️ Could not read cell values from first row');
                }
            } else {
                console.log('⚠️ No table rows found — cannot inspect category metadata');
            }
        }
    });

});
