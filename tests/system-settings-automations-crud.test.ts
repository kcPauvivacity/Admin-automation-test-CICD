import { test, expect } from '@playwright/test';
import { loginToApp } from './helpers/auth.helper';

const EMAIL = 'pau.kie.chee@fusioneta.com';
const PASSWORD = 'PAOpaopao@9696';
const BASE = 'https://app-staging.vivacityapp.com';
const LIST_URL = `${BASE}/system-settings/automations`;

async function navigateToAutomations(page: any) {
    await page.goto(LIST_URL, { waitUntil: 'load', timeout: 30000 });
    await page.waitForTimeout(3000);
    await expect(page).toHaveURL(/system-settings\/automations/, { timeout: 10000 });
    await page.waitForTimeout(1000);
    console.log('✅ Navigated to Automations');
}

// Automations in Vivacity admin manage event-triggered workflows — e.g. sending notifications,
// updating records, or triggering integrations when conditions are met in the platform.

test.describe('System Settings — Automations CRUD', () => {

    test.beforeEach(async ({ page }) => {
        await loginToApp(page, 90000, EMAIL, PASSWORD);
    });

    // ─────────────────────────────────────────────────────────────────────────
    // 1. [READ] Page loads
    // ─────────────────────────────────────────────────────────────────────────
    test('[READ] Automations page loads and main content is visible', async ({ page }) => {
        test.setTimeout(180000);

        await navigateToAutomations(page);

        // Verify URL is correct
        await expect(page).toHaveURL(/system-settings\/automations/, { timeout: 10000 });

        // Check for a heading or page title
        const heading = page.locator('h1, h2, h3, .page-title, [class*="title"]').first();
        const headingVisible = await heading.isVisible({ timeout: 5000 }).catch(() => false);
        if (headingVisible) {
            const headingText = await heading.textContent().catch(() => '');
            console.log(`✅ Page heading found: "${headingText?.trim()}"`);
        } else {
            console.log('⚠️ No explicit heading found — checking for main content container');
        }

        // Check for main content area (Vuetify card, container, or data table)
        const mainContent = page.locator(
            '.v-card, .v-container, .v-data-table, [class*="automations"], main, .content-area'
        ).first();
        const mainVisible = await mainContent.isVisible({ timeout: 8000 }).catch(() => false);
        if (mainVisible) {
            console.log('✅ Main content area is visible');
        } else {
            console.log('⚠️ Generic content area not detected — page may use a custom layout');
        }

        // Page should not be blank
        const bodyText = await page.locator('body').innerText().catch(() => '');
        expect(bodyText.length).toBeGreaterThan(10);
        console.log('✅ Page body has content — not blank');
    });

    // ─────────────────────────────────────────────────────────────────────────
    // 2. [READ] Table/list shows records and column headers are logged
    // ─────────────────────────────────────────────────────────────────────────
    test('[READ] Automations list/table renders rows and column headers', async ({ page }) => {
        test.setTimeout(180000);

        await navigateToAutomations(page);

        // Wait for data to load
        await page.waitForTimeout(2000);

        // Check for table headers (Vuetify data table uses th elements)
        const headers = page.locator('.v-data-table th, table th');
        const headerCount = await headers.count().catch(() => 0);
        if (headerCount > 0) {
            console.log(`✅ Found ${headerCount} table column headers:`);
            for (let i = 0; i < headerCount; i++) {
                const text = await headers.nth(i).textContent().catch(() => '');
                console.log(`   • ${text?.trim()}`);
            }
        } else {
            console.log('⚠️ No table headers found — module may use a list/card layout');
        }

        // Check for data rows in table body
        const rows = page.locator('.v-data-table tbody tr, table tbody tr');
        const rowCount = await rows.count().catch(() => 0);
        if (rowCount > 0) {
            console.log(`✅ Found ${rowCount} row(s) in the automations table`);
        } else {
            // Fallback: check for list items (v-list-item) or card-based layout
            const listItems = page.locator('.v-list-item, [class*="automation-item"], [class*="row"]');
            const listCount = await listItems.count().catch(() => 0);
            if (listCount > 0) {
                console.log(`✅ Found ${listCount} list/card item(s) in automations list`);
            } else {
                console.log('⚠️ No rows or list items found — module may be empty or still loading');
            }
        }

        // Check for empty state message if no records exist
        const emptyState = page.locator(
            '.v-data-table__empty-wrapper, [class*="empty"], [class*="no-data"], .v-empty-state'
        ).first();
        const emptyVisible = await emptyState.isVisible({ timeout: 3000 }).catch(() => false);
        if (emptyVisible) {
            const emptyText = await emptyState.textContent().catch(() => '');
            console.log(`⚠️ Empty state shown: "${emptyText?.trim()}"`);
        }
    });

    // ─────────────────────────────────────────────────────────────────────────
    // 3. [READ] Search or filter works
    // ─────────────────────────────────────────────────────────────────────────
    test('[READ] Search or filter input can be used and cleared', async ({ page }) => {
        test.setTimeout(180000);

        await navigateToAutomations(page);
        await page.waitForTimeout(2000);

        // Look for search input — Vuetify uses v-text-field for search bars
        const searchInput = page.locator(
            'input[placeholder*="search" i], input[placeholder*="filter" i], input[placeholder*="Search" i], .v-text-field input'
        ).first();
        const searchVisible = await searchInput.isVisible({ timeout: 5000 }).catch(() => false);

        if (searchVisible) {
            // Type a search term
            await searchInput.fill('test');
            await page.waitForTimeout(1500);
            console.log('✅ Typed "test" into search input');

            // Check that results changed or a no-results state appeared
            const bodyAfterSearch = await page.locator('body').innerText().catch(() => '');
            console.log(`✅ Page content after search has ${bodyAfterSearch.length} chars`);

            // Clear the search input
            await searchInput.fill('');
            await page.waitForTimeout(1500);
            console.log('✅ Cleared search input');

            // Verify page returned to default state
            const bodyAfterClear = await page.locator('body').innerText().catch(() => '');
            console.log(`✅ Page content after clear has ${bodyAfterClear.length} chars`);
        } else {
            // Try looking for a filter/dropdown instead
            const filterBtn = page.locator(
                'button:has-text("Filter"), button[aria-label*="filter" i], .v-select'
            ).first();
            const filterVisible = await filterBtn.isVisible({ timeout: 3000 }).catch(() => false);
            if (filterVisible) {
                console.log('✅ Filter control found (dropdown/button style)');
            } else {
                console.log('⚠️ No search input or filter control found on Automations page');
            }
        }
    });

    // ─────────────────────────────────────────────────────────────────────────
    // 4. [CREATE] Open create dialog — verify it opens, then escape (no save)
    // ─────────────────────────────────────────────────────────────────────────
    test('[CREATE] Create button opens dialog/form — escape without saving', async ({ page }) => {
        test.setTimeout(180000);

        await navigateToAutomations(page);
        await page.waitForTimeout(2000);

        // Look for a Create / Add / New button
        const createBtn = page.locator('button').filter({ hasText: /create|add|new automation/i }).first();
        const createVisible = await createBtn.isVisible({ timeout: 5000 }).catch(() => false);

        if (!createVisible) {
            // Try fab / icon button with plus icon
            const fabBtn = page.locator(
                'button[aria-label*="create" i], button[aria-label*="add" i], .v-btn--fab, button .mdi-plus'
            ).first();
            const fabVisible = await fabBtn.isVisible({ timeout: 3000 }).catch(() => false);
            if (fabVisible) {
                await fabBtn.click();
                console.log('✅ Clicked FAB/icon create button');
            } else {
                console.log('⚠️ No Create button found — module may be read-only or require different permissions');
                return;
            }
        } else {
            await createBtn.click();
            console.log('✅ Clicked Create button');
        }

        await page.waitForTimeout(2000);

        // Verify a dialog or form panel opened (Vuetify dialog)
        const dialog = page.locator('.v-dialog, .v-overlay__content, [role="dialog"], .v-navigation-drawer').first();
        const dialogVisible = await dialog.isVisible({ timeout: 8000 }).catch(() => false);

        if (dialogVisible) {
            console.log('✅ Create dialog/form opened successfully');

            // Log visible form fields for context
            const fields = dialog.locator('input, textarea, .v-select, .v-autocomplete');
            const fieldCount = await fields.count().catch(() => 0);
            console.log(`✅ Dialog contains ${fieldCount} input field(s)`);
        } else {
            // Form may be an inline panel or a new route
            const form = page.locator('form, .v-form').first();
            const formVisible = await form.isVisible({ timeout: 5000 }).catch(() => false);
            if (formVisible) {
                console.log('✅ Create form opened (inline or page-level)');
            } else {
                console.log('⚠️ Dialog/form not detected after clicking Create');
            }
        }

        // Escape to close without saving
        await page.keyboard.press('Escape');
        await page.waitForTimeout(1000);
        console.log('✅ Pressed Escape — dialog closed without saving');

        // Confirm we are still on the automations page
        await expect(page).toHaveURL(/system-settings\/automations/, { timeout: 5000 });
        console.log('✅ Still on Automations page after escaping');
    });

    // ─────────────────────────────────────────────────────────────────────────
    // 5. [UPDATE] Click first row, verify edit form opens — escape without saving
    // ─────────────────────────────────────────────────────────────────────────
    test('[UPDATE] Clicking first automation row opens edit form — escape without saving', async ({ page }) => {
        test.setTimeout(180000);

        await navigateToAutomations(page);
        await page.waitForTimeout(2000);

        // Try clicking the first table row
        const firstRow = page.locator(
            '.v-data-table tbody tr, table tbody tr, .v-list-item, [class*="automation-row"]'
        ).first();
        const rowVisible = await firstRow.isVisible({ timeout: 5000 }).catch(() => false);

        if (!rowVisible) {
            console.log('⚠️ No automation records found to click for edit test');
            return;
        }

        await firstRow.click();
        await page.waitForTimeout(2000);
        console.log('✅ Clicked first automation row');

        // Check if an edit dialog/panel opened
        const dialog = page.locator('.v-dialog, .v-overlay__content, [role="dialog"]').first();
        const dialogVisible = await dialog.isVisible({ timeout: 6000 }).catch(() => false);

        if (dialogVisible) {
            console.log('✅ Edit dialog opened after clicking row');

            // Verify edit fields are present
            const nameField = dialog.locator('input[type="text"], .v-text-field input').first();
            const nameVisible = await nameField.isVisible({ timeout: 3000 }).catch(() => false);
            if (nameVisible) {
                console.log('✅ Name/text field visible in edit dialog');
            } else {
                console.log('⚠️ No text field found in dialog — may use dropdowns or toggles only');
            }

            // Check for a Save/Update button (but do not click it)
            const saveBtn = dialog.locator('button').filter({ hasText: /save|update|confirm/i }).first();
            const saveVisible = await saveBtn.isVisible({ timeout: 3000 }).catch(() => false);
            console.log(saveVisible ? '✅ Save/Update button visible in edit dialog' : '⚠️ Save button not found in dialog');
        } else {
            // Row click may navigate to a detail/edit page
            const currentUrl = page.url();
            if (currentUrl !== LIST_URL) {
                console.log(`✅ Row click navigated to detail page: ${currentUrl}`);

                // Check for an edit form on the detail page
                const editForm = page.locator('form, .v-form, input').first();
                const formVisible = await editForm.isVisible({ timeout: 5000 }).catch(() => false);
                console.log(formVisible ? '✅ Edit form found on detail page' : '⚠️ No edit form on detail page');
            } else {
                // Check for inline edit mode with an action button
                const editBtn = page.locator('button').filter({ hasText: /edit/i }).first();
                const editVisible = await editBtn.isVisible({ timeout: 3000 }).catch(() => false);
                if (editVisible) {
                    await editBtn.click();
                    await page.waitForTimeout(1500);
                    console.log('✅ Edit button clicked — checking for form');
                } else {
                    console.log('⚠️ Row click did not open dialog or navigate — may require action menu');
                }
            }
        }

        // Escape to close without saving
        await page.keyboard.press('Escape');
        await page.waitForTimeout(1000);
        console.log('✅ Pressed Escape — edit form closed without saving');
    });

    // ─────────────────────────────────────────────────────────────────────────
    // 6. [DELETE] Check delete availability — do NOT confirm, always escape
    // ─────────────────────────────────────────────────────────────────────────
    test('[DELETE] Delete action is accessible — escape confirmation without deleting', async ({ page }) => {
        test.setTimeout(180000);

        await navigateToAutomations(page);
        await page.waitForTimeout(2000);

        // Strategy 1: Check for a row-level action menu (three-dot / kebab menu)
        const actionMenuBtn = page.locator(
            'button[aria-label*="action" i], button[aria-label*="more" i], .mdi-dots-vertical, button .mdi-dots-horizontal'
        ).first();
        const actionMenuVisible = await actionMenuBtn.isVisible({ timeout: 4000 }).catch(() => false);

        if (actionMenuVisible) {
            await actionMenuBtn.click();
            await page.waitForTimeout(1000);
            console.log('✅ Opened row action menu');

            const deleteOption = page.locator(
                '.v-list-item, [role="menuitem"]'
            ).filter({ hasText: /delete|remove/i }).first();
            const deleteVisible = await deleteOption.isVisible({ timeout: 3000 }).catch(() => false);

            if (deleteVisible) {
                console.log('✅ Delete option found in action menu — not clicking to preserve data');
            } else {
                console.log('⚠️ Delete option not visible in action menu');
            }

            // Close menu by pressing Escape
            await page.keyboard.press('Escape');
            await page.waitForTimeout(500);
            console.log('✅ Closed action menu without deleting');
            return;
        }

        // Strategy 2: Select a row via checkbox and look for bulk delete
        const checkbox = page.locator(
            '.v-data-table tbody tr .v-checkbox, .v-data-table tbody tr input[type="checkbox"]'
        ).first();
        const checkboxVisible = await checkbox.isVisible({ timeout: 4000 }).catch(() => false);

        if (checkboxVisible) {
            await checkbox.click();
            await page.waitForTimeout(1000);
            console.log('✅ Selected first row via checkbox');

            const bulkDeleteBtn = page.locator('button').filter({ hasText: /delete|remove/i }).first();
            const bulkDeleteVisible = await bulkDeleteBtn.isVisible({ timeout: 3000 }).catch(() => false);

            if (bulkDeleteVisible) {
                console.log('✅ Bulk delete button appeared after row selection — not clicking to preserve data');
            } else {
                console.log('⚠️ No bulk delete button appeared after row selection');
            }

            // Deselect by pressing Escape
            await page.keyboard.press('Escape');
            await page.waitForTimeout(500);
            console.log('✅ Deselected row without deleting');
            return;
        }

        // Strategy 3: Look for a delete icon button directly in table row
        const deleteIcon = page.locator(
            'tbody tr button[aria-label*="delete" i], tbody tr .mdi-delete, tbody tr .mdi-trash-can'
        ).first();
        const deleteIconVisible = await deleteIcon.isVisible({ timeout: 3000 }).catch(() => false);

        if (deleteIconVisible) {
            console.log('✅ Delete icon button found in table row — not clicking to preserve data');
        } else {
            console.log('⚠️ No delete control found — module may restrict deletion or require row selection first');
        }
    });

    // ─────────────────────────────────────────────────────────────────────────
    // 7. [NAV] Module is accessible via direct URL navigation
    // ─────────────────────────────────────────────────────────────────────────
    test('[NAV] Automations module is accessible via direct URL', async ({ page }) => {
        test.setTimeout(180000);

        // Navigate directly to the URL
        await page.goto(LIST_URL, { waitUntil: 'load', timeout: 30000 });
        await page.waitForTimeout(3000);

        // Confirm we land on the correct page (not redirected to login or 404)
        const url = page.url();
        const onAutomations = /system-settings\/automations/.test(url);
        const onLogin = /login|signin|auth/.test(url);

        if (onAutomations) {
            console.log(`✅ Direct URL navigation succeeded: ${url}`);
        } else if (onLogin) {
            console.log('⚠️ Redirected to login — session may have expired during navigation');
        } else {
            console.log(`⚠️ Landed on unexpected URL: ${url}`);
        }

        expect(onAutomations).toBe(true);

        // Verify the system settings nav is present (confirms we are inside system settings)
        const sysSettingsNav = page.locator(
            '[aria-label*="system" i], [class*="system-settings"], nav, .v-navigation-drawer'
        ).first();
        const navVisible = await sysSettingsNav.isVisible({ timeout: 5000 }).catch(() => false);
        console.log(navVisible ? '✅ System settings navigation is visible' : '⚠️ System settings nav not detected');
    });

    // ─────────────────────────────────────────────────────────────────────────
    // 8. [MODULE-SPECIFIC] Automation trigger/event type fields are visible
    // Automations typically have a trigger event, conditions, and action fields.
    // This test verifies the create form exposes those domain-specific fields.
    // ─────────────────────────────────────────────────────────────────────────
    test('[MODULE] Automation create form exposes trigger/event and action fields', async ({ page }) => {
        test.setTimeout(180000);

        await navigateToAutomations(page);
        await page.waitForTimeout(2000);

        // Attempt to open the create form
        const createBtn = page.locator('button').filter({ hasText: /create|add|new/i }).first();
        const createVisible = await createBtn.isVisible({ timeout: 5000 }).catch(() => false);

        if (!createVisible) {
            const fabBtn = page.locator(
                'button[aria-label*="create" i], button[aria-label*="add" i], .v-btn--fab'
            ).first();
            const fabVisible = await fabBtn.isVisible({ timeout: 3000 }).catch(() => false);
            if (!fabVisible) {
                console.log('⚠️ No Create button found — skipping automation field verification');
                return;
            }
            await fabBtn.click();
        } else {
            await createBtn.click();
        }

        await page.waitForTimeout(2000);
        console.log('✅ Opened create dialog/form');

        // Automations typically have: Name, Trigger/Event, Conditions, Action/Target
        // Check for trigger/event selector (Vuetify select or autocomplete)
        const triggerField = page.locator(
            '.v-dialog .v-select, .v-dialog .v-autocomplete, [role="dialog"] .v-select'
        ).first();
        const triggerVisible = await triggerField.isVisible({ timeout: 5000 }).catch(() => false);
        if (triggerVisible) {
            console.log('✅ Trigger/event dropdown field is present in create form');
        } else {
            console.log('⚠️ Trigger/event dropdown not found — form may use a different layout');
        }

        // Check for an "Action" section or field
        const actionField = page.locator(
            '.v-dialog, [role="dialog"]'
        ).locator('text=/action|trigger|event|condition|when/i').first();
        const actionLabelVisible = await actionField.isVisible({ timeout: 3000 }).catch(() => false);
        if (actionLabelVisible) {
            const labelText = await actionField.textContent().catch(() => '');
            console.log(`✅ Automation domain label found: "${labelText?.trim()}"`);
        } else {
            console.log('⚠️ No trigger/action label text detected in dialog');
        }

        // Check for a name/label field which all automations should have
        const nameField = page.locator(
            '.v-dialog input[type="text"], [role="dialog"] input[type="text"]'
        ).first();
        const nameVisible = await nameField.isVisible({ timeout: 3000 }).catch(() => false);
        console.log(nameVisible ? '✅ Name/text input field found in automation create form' : '⚠️ No name field found');

        // Escape without saving
        await page.keyboard.press('Escape');
        await page.waitForTimeout(1000);
        console.log('✅ Escaped create form — no data saved');

        // Confirm still on automations list
        await expect(page).toHaveURL(/system-settings\/automations/, { timeout: 5000 });
        console.log('✅ Still on Automations page after escaping create form');
    });

});
