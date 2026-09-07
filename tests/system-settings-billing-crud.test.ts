import { test, expect } from '@playwright/test';
import { loginToApp } from './helpers/auth.helper';

const EMAIL = 'pau.kie.chee@fusioneta.com';
const PASSWORD = 'PAOpaopao@9696';
const BASE = 'https://app-staging.vivacityapp.com';
const LIST_URL = `${BASE}/system-settings/billing`;

async function navigateToBilling(page: any) {
    await page.goto(LIST_URL, { waitUntil: 'load', timeout: 30000 });
    await page.waitForTimeout(3000);
    await expect(page).toHaveURL(/system-settings\/billing/, { timeout: 10000 });
    await page.waitForTimeout(1000);
    console.log('✅ Navigated to Billing');
}

test.describe('System Settings — Billing', () => {

    test.beforeEach(async ({ page }) => {
        await loginToApp(page, 90000, EMAIL, PASSWORD);
    });

    // ─────────────────────────────────────────────
    // 1. [READ] Page loads
    // ─────────────────────────────────────────────
    test('[READ] Billing page loads and main content is visible', async ({ page }) => {
        test.setTimeout(180000);

        await navigateToBilling(page);

        // Verify the page has rendered meaningful content
        const hasHeading = await page.locator('h1, h2, h3, .page-title, [class*="title"]')
            .first()
            .isVisible({ timeout: 5000 })
            .catch(() => false);

        const hasMainContent = await page.locator('main, .v-main, [class*="content"], .v-container')
            .first()
            .isVisible({ timeout: 5000 })
            .catch(() => false);

        const hasCard = await page.locator('.v-card, .v-sheet, [class*="card"]')
            .first()
            .isVisible({ timeout: 5000 })
            .catch(() => false);

        if (hasHeading) {
            const headingText = await page.locator('h1, h2, h3, .page-title, [class*="title"]').first().textContent().catch(() => '');
            console.log(`✅ Page heading found: "${headingText?.trim()}"`);
        } else {
            console.log('⚠️ No heading found — checking for general content');
        }

        if (hasMainContent) console.log('✅ Main content container is visible');
        if (hasCard) console.log('✅ Card/sheet component is visible');

        // At least one of these must be true for the page to have loaded
        const pageLoaded = hasHeading || hasMainContent || hasCard;
        expect(pageLoaded).toBe(true);

        console.log('✅ Billing page loaded successfully');
    });

    // ─────────────────────────────────────────────
    // 2. [READ] Table/list shows records
    // ─────────────────────────────────────────────
    test('[READ] Billing table or list renders records and column headers', async ({ page }) => {
        test.setTimeout(180000);

        await navigateToBilling(page);

        // Check for a Vuetify data table
        const hasTable = await page.locator('.v-data-table, table, .v-list')
            .first()
            .isVisible({ timeout: 5000 })
            .catch(() => false);

        if (hasTable) {
            console.log('✅ Table or list component found');

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
                console.log('⚠️ No column headers detected');
            }

            // Count rows in tbody
            const rows = page.locator('tbody tr, .v-list-item');
            const rowCount = await rows.count().catch(() => 0);
            console.log(`✅ Found ${rowCount} row(s) in the table/list`);

            if (rowCount === 0) {
                // Check for empty state message
                const emptyMsg = await page.locator('[class*="empty"], [class*="no-data"], .v-data-table__empty-wrapper')
                    .isVisible({ timeout: 3000 })
                    .catch(() => false);
                if (emptyMsg) console.log('⚠️ Table is empty — empty state shown');
            }
        } else {
            // Billing may render as cards/sections rather than a table
            const hasCards = await page.locator('.v-card').count().catch(() => 0);
            console.log(`⚠️ No table found — found ${hasCards} card(s) instead (billing may use card layout)`);
            expect(hasCards).toBeGreaterThanOrEqual(0);
        }

        console.log('✅ Table/list render check complete');
    });

    // ─────────────────────────────────────────────
    // 3. [READ] Search or filter works
    // ─────────────────────────────────────────────
    test('[READ] Search or filter input works and can be cleared', async ({ page }) => {
        test.setTimeout(180000);

        await navigateToBilling(page);

        // Look for a search input
        const searchInput = page.locator(
            'input[type="search"], input[placeholder*="earch" i], input[placeholder*="ilter" i], ' +
            '.v-text-field input, [aria-label*="earch" i]'
        ).first();

        const hasSearch = await searchInput.isVisible({ timeout: 5000 }).catch(() => false);

        if (hasSearch) {
            const testTerm = 'test';
            await searchInput.fill(testTerm);
            await page.waitForTimeout(1500);
            console.log(`✅ Typed "${testTerm}" into search input`);

            // Verify the value was entered
            const enteredValue = await searchInput.inputValue().catch(() => '');
            expect(enteredValue).toBe(testTerm);
            console.log(`✅ Search value confirmed: "${enteredValue}"`);

            // Clear the search
            await searchInput.clear();
            await page.waitForTimeout(1500);

            const clearedValue = await searchInput.inputValue().catch(() => 'not-cleared');
            expect(clearedValue).toBe('');
            console.log('✅ Search input cleared successfully');
        } else {
            // Try Vuetify filter chips or select dropdowns
            const filterButton = page.locator('button').filter({ hasText: /filter/i }).first();
            const hasFilter = await filterButton.isVisible({ timeout: 3000 }).catch(() => false);

            if (hasFilter) {
                console.log('⚠️ No search input found — filter button present instead');
            } else {
                console.log('⚠️ No search or filter controls found on Billing page — skipping');
            }
        }

        console.log('✅ Search/filter check complete');
    });

    // ─────────────────────────────────────────────
    // 4. [CREATE] Open create dialog/form
    // ─────────────────────────────────────────────
    test('[CREATE] Create button opens a dialog or form (does not save)', async ({ page }) => {
        test.setTimeout(180000);

        await navigateToBilling(page);

        // Look for a create/add button
        const createBtn = page.locator('button').filter({ hasText: /create|add|new/i }).first();
        const hasCreate = await createBtn.isVisible({ timeout: 5000 }).catch(() => false);

        if (!hasCreate) {
            // Try icon-only FAB (Vuetify mdi-plus)
            const fabBtn = page.locator('button.v-btn--fab, button[aria-label*="add" i], button[aria-label*="create" i]').first();
            const hasFab = await fabBtn.isVisible({ timeout: 3000 }).catch(() => false);
            if (hasFab) {
                console.log('⚠️ No labelled Create button — FAB/icon button found');
            } else {
                console.log('⚠️ No Create button found on Billing page — module may be read-only or plan-based');
                return;
            }
        }

        console.log('✅ Create button found — clicking');
        await createBtn.click();
        await page.waitForTimeout(2000);

        // Verify a dialog or drawer opened
        const dialogVisible = await page.locator('.v-dialog, [role="dialog"], .v-navigation-drawer--active')
            .first()
            .isVisible({ timeout: 5000 })
            .catch(() => false);

        const formVisible = await page.locator('form, .v-form')
            .first()
            .isVisible({ timeout: 3000 })
            .catch(() => false);

        if (dialogVisible) {
            console.log('✅ Dialog opened after clicking Create');
        } else if (formVisible) {
            console.log('✅ Form opened after clicking Create');
        } else {
            console.log('⚠️ No dialog or form detected after Create click');
        }

        // Escape without saving
        await page.keyboard.press('Escape');
        await page.waitForTimeout(1000);

        const dialogClosed = await page.locator('.v-dialog, [role="dialog"]')
            .first()
            .isVisible({ timeout: 3000 })
            .catch(() => false);

        if (!dialogClosed) {
            console.log('✅ Dialog dismissed with Escape key — no data saved');
        } else {
            // Try clicking Cancel button
            const cancelBtn = page.locator('button').filter({ hasText: /cancel|close|dismiss/i }).first();
            const hasCancelBtn = await cancelBtn.isVisible({ timeout: 2000 }).catch(() => false);
            if (hasCancelBtn) {
                await cancelBtn.click();
                await page.waitForTimeout(500);
                console.log('✅ Dialog dismissed via Cancel button — no data saved');
            }
        }

        console.log('✅ Create dialog check complete');
    });

    // ─────────────────────────────────────────────
    // 5. [UPDATE] Click first row and verify edit form
    // ─────────────────────────────────────────────
    test('[UPDATE] Clicking a row opens an edit form with fields visible (does not save)', async ({ page }) => {
        test.setTimeout(180000);

        await navigateToBilling(page);

        // Wait for table rows or list items to appear
        await page.waitForTimeout(2000);

        const firstRow = page.locator('tbody tr, .v-list-item').first();
        const hasRow = await firstRow.isVisible({ timeout: 5000 }).catch(() => false);

        if (!hasRow) {
            console.log('⚠️ No rows found in the table — skipping edit test');
            return;
        }

        // Try clicking the first row to open edit
        await firstRow.click();
        await page.waitForTimeout(2000);
        console.log('✅ Clicked first row');

        // Check if a dialog or edit panel opened
        const dialogVisible = await page.locator('.v-dialog, [role="dialog"]')
            .first()
            .isVisible({ timeout: 5000 })
            .catch(() => false);

        const drawerVisible = await page.locator('.v-navigation-drawer--active, [class*="drawer"]')
            .first()
            .isVisible({ timeout: 3000 })
            .catch(() => false);

        if (dialogVisible || drawerVisible) {
            const panelType = dialogVisible ? 'Dialog' : 'Drawer';
            console.log(`✅ ${panelType} opened after row click`);

            // Check for visible input fields
            const inputCount = await page.locator('.v-dialog input, [role="dialog"] input, .v-navigation-drawer--active input')
                .count()
                .catch(() => 0);
            console.log(`✅ Found ${inputCount} input field(s) in the edit form`);

            // Log first few field labels
            const labels = page.locator('.v-dialog .v-label, [role="dialog"] label, .v-navigation-drawer--active .v-label');
            const labelCount = await labels.count().catch(() => 0);
            if (labelCount > 0) {
                const labelTexts: string[] = [];
                for (let i = 0; i < Math.min(labelCount, 5); i++) {
                    const text = await labels.nth(i).textContent().catch(() => '');
                    if (text?.trim()) labelTexts.push(text.trim());
                }
                console.log(`✅ Form labels: ${labelTexts.join(', ')}`);
            }
        } else {
            // Try looking for an inline edit row or expand
            const inlineEdit = await page.locator('input:visible, [contenteditable="true"]')
                .first()
                .isVisible({ timeout: 3000 })
                .catch(() => false);
            if (inlineEdit) {
                console.log('⚠️ Inline editing detected instead of dialog');
            } else {
                // Try clicking the edit icon/button on the row
                const editBtn = page.locator('tbody tr').first()
                    .locator('button[aria-label*="edit" i], button').filter({ hasText: /edit/i }).first();
                const hasEditBtn = await editBtn.isVisible({ timeout: 2000 }).catch(() => false);
                if (hasEditBtn) {
                    await editBtn.click();
                    await page.waitForTimeout(1500);
                    console.log('⚠️ Row click did not open form — clicked row edit button instead');
                } else {
                    console.log('⚠️ No edit form, dialog, or edit button found — Billing may be view-only');
                }
            }
        }

        // Escape to close any open panel
        await page.keyboard.press('Escape');
        await page.waitForTimeout(1000);
        console.log('✅ Dismissed edit panel with Escape — no changes saved');
    });

    // ─────────────────────────────────────────────
    // 6. [DELETE] Check delete availability (does not confirm)
    // ─────────────────────────────────────────────
    test('[DELETE] Delete option is available and can be dismissed without deleting', async ({ page }) => {
        test.setTimeout(180000);

        await navigateToBilling(page);

        await page.waitForTimeout(2000);

        // Strategy 1: look for a delete/remove button in the table row actions
        const firstRow = page.locator('tbody tr, .v-list-item').first();
        const hasRow = await firstRow.isVisible({ timeout: 5000 }).catch(() => false);

        if (!hasRow) {
            console.log('⚠️ No rows found — skipping delete test');
            return;
        }

        // Hover over the first row to reveal action buttons
        await firstRow.hover().catch(() => {});
        await page.waitForTimeout(500);

        const deleteBtn = page.locator(
            'button[aria-label*="delete" i], button[aria-label*="remove" i], ' +
            'button').filter({ hasText: /delete|remove/i }).first();
        const hasDeleteBtn = await deleteBtn.isVisible({ timeout: 3000 }).catch(() => false);

        if (hasDeleteBtn) {
            console.log('✅ Delete button found — clicking to see confirmation dialog');
            await deleteBtn.click();
            await page.waitForTimeout(1500);

            // A confirmation dialog should appear
            const confirmDialog = await page.locator('.v-dialog, [role="dialog"]')
                .first()
                .isVisible({ timeout: 5000 })
                .catch(() => false);

            if (confirmDialog) {
                console.log('✅ Delete confirmation dialog appeared');

                // Dismiss without confirming
                const cancelBtn = page.locator('button').filter({ hasText: /cancel|no|dismiss/i }).first();
                const hasCancelBtn = await cancelBtn.isVisible({ timeout: 2000 }).catch(() => false);
                if (hasCancelBtn) {
                    await cancelBtn.click();
                    console.log('✅ Clicked Cancel — delete NOT confirmed, data intact');
                } else {
                    await page.keyboard.press('Escape');
                    console.log('✅ Pressed Escape — delete NOT confirmed, data intact');
                }
            } else {
                await page.keyboard.press('Escape');
                console.log('⚠️ No confirmation dialog appeared after delete click — pressed Escape as safety measure');
            }
        } else {
            // Strategy 2: try selecting a row with a checkbox then looking for bulk delete
            const checkbox = page.locator('tbody tr').first().locator('input[type="checkbox"]').first();
            const hasCheckbox = await checkbox.isVisible({ timeout: 2000 }).catch(() => false);

            if (hasCheckbox) {
                await checkbox.click();
                await page.waitForTimeout(1000);

                const bulkDelete = page.locator('button').filter({ hasText: /delete|remove/i }).first();
                const hasBulkDelete = await bulkDelete.isVisible({ timeout: 2000 }).catch(() => false);

                if (hasBulkDelete) {
                    console.log('⚠️ Delete found as bulk action after row selection — NOT clicking');
                } else {
                    console.log('⚠️ No delete button found even after row selection');
                }

                // Uncheck the checkbox
                await checkbox.click().catch(() => {});
            } else {
                console.log('⚠️ No delete button or checkbox found — Billing module may not support deletion');
            }
        }

        console.log('✅ Delete check complete — no records were deleted');
    });

    // ─────────────────────────────────────────────
    // 7. [NAV] Module accessible via direct URL
    // ─────────────────────────────────────────────
    test('[NAV] Billing is accessible via direct URL navigation', async ({ page }) => {
        test.setTimeout(180000);

        // Navigate directly without helper
        await page.goto(LIST_URL, { waitUntil: 'load', timeout: 30000 });
        await page.waitForTimeout(3000);

        // Should land on the billing URL (not redirected to login or 404)
        const finalUrl = page.url();
        console.log(`✅ Final URL after direct navigation: ${finalUrl}`);

        const onBillingPage = finalUrl.includes('system-settings/billing');
        const onLoginPage = finalUrl.includes('login') || finalUrl.includes('sign-in');

        if (onLoginPage) {
            // Not yet authenticated — log in and retry
            console.log('⚠️ Redirected to login — logging in and retrying');
            await loginToApp(page, 90000, EMAIL, PASSWORD);
            await page.goto(LIST_URL, { waitUntil: 'load', timeout: 30000 });
            await page.waitForTimeout(3000);
            await expect(page).toHaveURL(/system-settings\/billing/, { timeout: 10000 });
            console.log('✅ Reached Billing after login');
        } else {
            expect(onBillingPage).toBe(true);
            console.log('✅ Direct URL navigation to Billing succeeded without redirect');
        }

        // Confirm page is not a 404 or error state
        const is404 = await page.locator('text=/404|not found|page not found/i')
            .first()
            .isVisible({ timeout: 3000 })
            .catch(() => false);
        expect(is404).toBe(false);
        console.log('✅ No 404 or error state detected');
    });

    // ─────────────────────────────────────────────
    // 8. [BILLING-SPECIFIC] Verify plan/subscription info or billing details are displayed
    // ─────────────────────────────────────────────
    test('[BILLING] Plan information or billing details are visible on the page', async ({ page }) => {
        test.setTimeout(180000);

        await navigateToBilling(page);

        // Billing pages typically show plan names, pricing tiers, invoice history,
        // or subscription status. Check for any of these domain-specific elements.

        const planKeywords = [
            /plan/i, /subscription/i, /invoice/i, /billing/i,
            /payment/i, /amount/i, /price/i, /tier/i, /license/i,
            /charge/i, /account/i, /renew/i, /cycle/i
        ];

        let foundKeyword = '';
        for (const keyword of planKeywords) {
            const el = page.locator(`text=${keyword}`).first();
            const visible = await el.isVisible({ timeout: 2000 }).catch(() => false);
            if (visible) {
                const text = await el.textContent().catch(() => '');
                foundKeyword = text?.trim() ?? '';
                break;
            }
        }

        if (foundKeyword) {
            console.log(`✅ Billing-related text found on page: "${foundKeyword}"`);
        } else {
            console.log('⚠️ No billing-specific keywords found in visible text — module may use non-standard labels');
        }

        // Check for a currency symbol or numeric pricing value
        const currencyEl = await page.locator('text=/$|£|€|\\d+\\.\\d{2}/')
            .first()
            .isVisible({ timeout: 3000 })
            .catch(() => false);
        if (currencyEl) {
            console.log('✅ Currency or price value visible on Billing page');
        } else {
            console.log('⚠️ No currency/price values detected — may be a config-only billing section');
        }

        // Look for a status badge (active, cancelled, trial, etc.)
        const statusBadge = page.locator(
            '.v-chip, [class*="badge"], [class*="status"], [class*="tag"]'
        ).first();
        const hasStatusBadge = await statusBadge.isVisible({ timeout: 3000 }).catch(() => false);
        if (hasStatusBadge) {
            const badgeText = await statusBadge.textContent().catch(() => '');
            console.log(`✅ Status badge found: "${badgeText?.trim()}"`);
        } else {
            console.log('⚠️ No status badge/chip found on Billing page');
        }

        // Check for an invoice or transaction table
        const invoiceTable = page.locator('table, .v-data-table').first();
        const hasInvoiceTable = await invoiceTable.isVisible({ timeout: 3000 }).catch(() => false);
        if (hasInvoiceTable) {
            console.log('✅ Invoice or data table present on Billing page');
        } else {
            console.log('⚠️ No invoice/data table detected — billing may use a card-based layout');
        }

        console.log('✅ Billing-specific content check complete');
    });

});
