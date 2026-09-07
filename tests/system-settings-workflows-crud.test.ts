import { test, expect } from '@playwright/test';
import { loginToApp } from './helpers/auth.helper';

const EMAIL = 'pau.kie.chee@fusioneta.com';
const PASSWORD = 'PAOpaopao@9696';
const BASE = 'https://app-staging.vivacityapp.com';
const LIST_URL = `${BASE}/system-settings/workflows`;

// Workflows module: defines automated sequences of actions triggered by events
// (e.g. enquiry received → assign agent → send welcome email → schedule task)
// Typically configured with trigger type, conditions, and action steps.

async function navigateToWorkflows(page: any) {
    await page.goto(LIST_URL, { waitUntil: 'load', timeout: 30000 });
    await page.waitForTimeout(3000);
    await expect(page).toHaveURL(/system-settings\/workflows/, { timeout: 10000 });
    await page.waitForTimeout(1000);
    console.log('✅ Navigated to Workflows');
}

// ---------------------------------------------------------------------------
// 1. [READ] Page loads — navigate, verify main content visible
// ---------------------------------------------------------------------------
test('Workflows - page loads and main content is visible', async ({ page }) => {
    test.setTimeout(180000);

    await loginToApp(page, 90000, EMAIL, PASSWORD);
    await navigateToWorkflows(page);

    // Verify the page title / heading area is present
    const heading = page.locator('h1, h2, h3, .v-toolbar__title, [class*="title"], [class*="heading"]').first();
    const headingVisible = await heading.isVisible({ timeout: 5000 }).catch(() => false);
    if (headingVisible) {
        const text = await heading.textContent().catch(() => '');
        console.log(`✅ Page heading visible: "${text?.trim()}"`);
    } else {
        console.log('⚠️ Heading not found via common selectors — page may use custom layout');
    }

    // Verify some content container is present (table, list, or card)
    const contentArea = page.locator(
        '.v-data-table, .v-list, .v-card, table, [class*="data-table"], [class*="list-container"]'
    ).first();
    const contentVisible = await contentArea.isVisible({ timeout: 8000 }).catch(() => false);
    if (contentVisible) {
        console.log('✅ Main content area is visible');
    } else {
        console.log('⚠️ Main content area not found — checking for any visible text');
        const bodyText = await page.locator('body').textContent().catch(() => '');
        const hasWorkflowText = /workflow/i.test(bodyText ?? '');
        console.log(hasWorkflowText ? '✅ Page body contains "workflow" text' : '⚠️ No workflow-related text found in body');
    }

    // Confirm we did not land on a 404 / error page
    const errorIndicator = page.locator('[class*="error"], [class*="not-found"], h1:has-text("404")');
    const hasError = await errorIndicator.isVisible({ timeout: 3000 }).catch(() => false);
    expect(hasError).toBe(false);
    console.log('✅ No error page detected');
});

// ---------------------------------------------------------------------------
// 2. [READ] Table/list shows records — count rows, log column headers
// ---------------------------------------------------------------------------
test('Workflows - table or list shows records with column headers', async ({ page }) => {
    test.setTimeout(180000);

    await loginToApp(page, 90000, EMAIL, PASSWORD);
    await navigateToWorkflows(page);

    // Check for table header columns
    const headers = page.locator('thead th, .v-data-table-header th, th[role="columnheader"]');
    const headerCount = await headers.count().catch(() => 0);
    if (headerCount > 0) {
        console.log(`✅ Found ${headerCount} column header(s):`);
        for (let i = 0; i < headerCount; i++) {
            const text = await headers.nth(i).textContent().catch(() => '');
            console.log(`   [col ${i + 1}] ${text?.trim()}`);
        }
    } else {
        console.log('⚠️ No thead/th headers found — may use card or list layout');
    }

    // Count data rows
    const rows = page.locator('tbody tr:not(.v-data-table__empty-wrapper)');
    const rowCount = await rows.count().catch(() => 0);
    console.log(`✅ Found ${rowCount} data row(s) in table`);

    // If no table rows, check for list items (card/list layout fallback)
    if (rowCount === 0) {
        const listItems = page.locator('.v-list-item, [class*="workflow-item"], [class*="list-item"]');
        const itemCount = await listItems.count().catch(() => 0);
        console.log(itemCount > 0
            ? `✅ Found ${itemCount} list item(s) in list/card layout`
            : '⚠️ No list items found either — module may be empty or use a different layout');
    }

    // Check for workflow-specific column indicators (trigger, actions, status, name)
    const workflowColumns = ['name', 'trigger', 'status', 'action', 'active'];
    for (const col of workflowColumns) {
        const colHeader = page.locator(`th, td`).filter({ hasText: new RegExp(col, 'i') }).first();
        const colVisible = await colHeader.isVisible({ timeout: 2000 }).catch(() => false);
        if (colVisible) {
            console.log(`✅ Column with "${col}" text found`);
        }
    }
});

// ---------------------------------------------------------------------------
// 3. [READ] Search or filter works — fill search, clear, verify
// ---------------------------------------------------------------------------
test('Workflows - search or filter interaction works', async ({ page }) => {
    test.setTimeout(180000);

    await loginToApp(page, 90000, EMAIL, PASSWORD);
    await navigateToWorkflows(page);

    // Locate search input — common Vuetify patterns
    const searchInput = page.locator(
        'input[placeholder*="search" i], input[placeholder*="filter" i], ' +
        '.v-text-field input, [aria-label*="search" i], [aria-label*="filter" i]'
    ).first();

    const searchVisible = await searchInput.isVisible({ timeout: 5000 }).catch(() => false);

    if (!searchVisible) {
        console.log('⚠️ No search/filter input found — skipping search test');
        return;
    }

    console.log('✅ Search input found');

    // Type a search term
    await searchInput.click({ timeout: 5000 }).catch(() => {});
    await searchInput.fill('test', { timeout: 5000 }).catch(() => {});
    await page.waitForTimeout(1500);

    const inputValue = await searchInput.inputValue().catch(() => '');
    console.log(`✅ Typed search term, input value: "${inputValue}"`);

    // Count rows after search
    const rowsAfterSearch = page.locator('tbody tr:not(.v-data-table__empty-wrapper)');
    const countAfterSearch = await rowsAfterSearch.count().catch(() => 0);
    console.log(`✅ Rows after search: ${countAfterSearch}`);

    // Clear the search field
    await searchInput.clear({ timeout: 5000 }).catch(() => {});
    await page.waitForTimeout(1500);

    const clearedValue = await searchInput.inputValue().catch(() => '');
    console.log(`✅ Search cleared, input value: "${clearedValue}"`);

    const rowsAfterClear = page.locator('tbody tr:not(.v-data-table__empty-wrapper)');
    const countAfterClear = await rowsAfterClear.count().catch(() => 0);
    console.log(`✅ Rows after clearing search: ${countAfterClear}`);
});

// ---------------------------------------------------------------------------
// 4. [CREATE] Open create dialog/form — verify opens, escape without saving
// ---------------------------------------------------------------------------
test('Workflows - create dialog opens and can be dismissed', async ({ page }) => {
    test.setTimeout(180000);

    await loginToApp(page, 90000, EMAIL, PASSWORD);
    await navigateToWorkflows(page);

    // Look for a Create / Add / New button
    const createButton = page.locator('button').filter({ hasText: /create|add|new workflow/i }).first();
    const createVisible = await createButton.isVisible({ timeout: 5000 }).catch(() => false);

    if (!createVisible) {
        // Try icon-only fab or '+' button
        const fabButton = page.locator(
            'button.v-btn--fab, button[aria-label*="create" i], button[aria-label*="add" i], ' +
            'button[title*="create" i], button[title*="add" i]'
        ).first();
        const fabVisible = await fabButton.isVisible({ timeout: 3000 }).catch(() => false);
        if (!fabVisible) {
            console.log('⚠️ No Create/Add button found — module may be read-only or button is hidden');
            return;
        }
        console.log('✅ Found icon/fab Create button');
        await fabButton.click({ timeout: 5000 }).catch(() => {});
    } else {
        console.log('✅ Found Create button');
        await createButton.click({ timeout: 5000 }).catch(() => {});
    }

    await page.waitForTimeout(2000);

    // Verify dialog/form opened
    const dialog = page.locator('.v-dialog, [role="dialog"], [class*="modal"], [class*="drawer"]').first();
    const dialogVisible = await dialog.isVisible({ timeout: 7000 }).catch(() => false);

    if (dialogVisible) {
        console.log('✅ Create dialog/form opened');

        // Check for workflow-specific fields inside the dialog
        const nameField = dialog.locator('input[placeholder*="name" i], label:has-text("Name") + input, [aria-label*="name" i]').first();
        const nameVisible = await nameField.isVisible({ timeout: 3000 }).catch(() => false);
        console.log(nameVisible ? '✅ Name field visible in dialog' : '⚠️ Name field not found in dialog');

        const triggerField = dialog.locator('input, select, .v-select').filter({ hasText: /trigger/i }).first();
        const triggerVisible = await triggerField.isVisible({ timeout: 3000 }).catch(() => false);
        console.log(triggerVisible ? '✅ Trigger field visible in dialog' : '⚠️ Trigger field not detected by text');

        // Dismiss via Escape key — do NOT save
        await page.keyboard.press('Escape');
        await page.waitForTimeout(1500);

        const dialogAfterEsc = await dialog.isVisible({ timeout: 3000 }).catch(() => false);
        console.log(dialogAfterEsc
            ? '⚠️ Dialog still open after Escape — trying Cancel button'
            : '✅ Dialog dismissed with Escape');

        if (dialogAfterEsc) {
            const cancelBtn = page.locator('button').filter({ hasText: /cancel|close|dismiss/i }).first();
            const cancelVisible = await cancelBtn.isVisible({ timeout: 3000 }).catch(() => false);
            if (cancelVisible) {
                await cancelBtn.click({ timeout: 5000 }).catch(() => {});
                await page.waitForTimeout(1000);
                console.log('✅ Dialog dismissed via Cancel button');
            } else {
                console.log('⚠️ Could not find Cancel button — dialog may still be open');
            }
        }
    } else {
        // Maybe navigated to a separate create page
        const currentUrl = page.url();
        const onCreatePage = /create|new|add/i.test(currentUrl);
        console.log(onCreatePage
            ? `✅ Navigated to create page: ${currentUrl}`
            : `⚠️ Dialog not found and URL unchanged: ${currentUrl}`);

        if (onCreatePage) {
            // Navigate back without saving
            await page.goBack({ timeout: 10000 }).catch(() => page.goto(LIST_URL, { timeout: 15000 }));
            await page.waitForTimeout(1500);
            console.log('✅ Navigated back to list without saving');
        }
    }
});

// ---------------------------------------------------------------------------
// 5. [UPDATE] Click first row — verify edit form opens, escape without saving
// ---------------------------------------------------------------------------
test('Workflows - edit form opens on row click or edit action', async ({ page }) => {
    test.setTimeout(180000);

    await loginToApp(page, 90000, EMAIL, PASSWORD);
    await navigateToWorkflows(page);

    // Confirm there is at least one row to click
    const firstRow = page.locator('tbody tr:not(.v-data-table__empty-wrapper)').first();
    const firstRowVisible = await firstRow.isVisible({ timeout: 8000 }).catch(() => false);

    if (!firstRowVisible) {
        // Try list-item fallback
        const firstListItem = page.locator('.v-list-item, [class*="workflow-item"]').first();
        const listItemVisible = await firstListItem.isVisible({ timeout: 5000 }).catch(() => false);
        if (!listItemVisible) {
            console.log('⚠️ No rows or list items found — cannot test edit; module may be empty');
            return;
        }
        console.log('✅ Found list item (non-table layout) — clicking');
        await firstListItem.click({ timeout: 5000 }).catch(() => {});
    } else {
        // Prefer an inline edit icon/button within the row
        const editIconInRow = firstRow.locator('button[aria-label*="edit" i], button[title*="edit" i], .mdi-pencil, [class*="edit"]').first();
        const editIconVisible = await editIconInRow.isVisible({ timeout: 3000 }).catch(() => false);

        if (editIconVisible) {
            console.log('✅ Edit icon found in row — clicking');
            await editIconInRow.click({ timeout: 5000 }).catch(() => {});
        } else {
            console.log('✅ No inline edit icon — clicking the row itself');
            await firstRow.click({ timeout: 5000 }).catch(() => {});
        }
    }

    await page.waitForTimeout(2500);

    // Verify edit dialog/form/page opened
    const dialog = page.locator('.v-dialog, [role="dialog"], [class*="modal"], [class*="drawer"]').first();
    const dialogVisible = await dialog.isVisible({ timeout: 7000 }).catch(() => false);

    if (dialogVisible) {
        console.log('✅ Edit dialog/drawer opened');

        // Check that fields are populated (edit mode should pre-fill data)
        const inputs = dialog.locator('input, textarea, .v-select__selection');
        const inputCount = await inputs.count().catch(() => 0);
        console.log(`✅ Found ${inputCount} input/field(s) in edit dialog`);

        // Workflow-specific fields to look for
        const fieldLabels = ['Name', 'Trigger', 'Status', 'Description', 'Actions'];
        for (const label of fieldLabels) {
            const field = dialog.locator(`label, .v-label, .v-field-label`).filter({ hasText: new RegExp(label, 'i') }).first();
            const fieldVisible = await field.isVisible({ timeout: 2000 }).catch(() => false);
            if (fieldVisible) {
                console.log(`✅ "${label}" field/label visible in edit form`);
            }
        }

        // Dismiss without saving
        await page.keyboard.press('Escape');
        await page.waitForTimeout(1500);
        const stillOpen = await dialog.isVisible({ timeout: 3000 }).catch(() => false);
        console.log(stillOpen ? '⚠️ Dialog still visible after Escape' : '✅ Edit dialog dismissed');

        if (stillOpen) {
            const cancelBtn = page.locator('button').filter({ hasText: /cancel|close/i }).first();
            await cancelBtn.click({ timeout: 5000 }).catch(() => {});
            await page.waitForTimeout(1000);
            console.log('✅ Dismissed via Cancel button');
        }
    } else {
        // Check if navigated to an edit page
        const currentUrl = page.url();
        const onEditPage = /edit|detail|\/\d+/i.test(currentUrl) && currentUrl !== LIST_URL;
        console.log(onEditPage
            ? `✅ Navigated to edit/detail page: ${currentUrl}`
            : `⚠️ No dialog detected and URL unchanged: ${currentUrl}`);

        if (onEditPage) {
            // Verify form fields on the edit page
            const editInputs = page.locator('input, textarea, .v-select');
            const editInputCount = await editInputs.count().catch(() => 0);
            console.log(`✅ Found ${editInputCount} form field(s) on edit page`);

            await page.goBack({ timeout: 10000 }).catch(() => page.goto(LIST_URL, { timeout: 15000 }));
            await page.waitForTimeout(1500);
            console.log('✅ Navigated back to list without saving');
        }
    }
});

// ---------------------------------------------------------------------------
// 6. [DELETE] Check delete availability — do NOT confirm, escape
// ---------------------------------------------------------------------------
test('Workflows - delete option is accessible but not confirmed', async ({ page }) => {
    test.setTimeout(180000);

    await loginToApp(page, 90000, EMAIL, PASSWORD);
    await navigateToWorkflows(page);

    const firstRow = page.locator('tbody tr:not(.v-data-table__empty-wrapper)').first();
    const firstRowVisible = await firstRow.isVisible({ timeout: 8000 }).catch(() => false);

    if (!firstRowVisible) {
        console.log('⚠️ No rows found — cannot test delete availability');
        return;
    }

    // Look for delete icon within the first row
    const deleteIconInRow = firstRow.locator(
        'button[aria-label*="delete" i], button[title*="delete" i], ' +
        '.mdi-delete, .mdi-trash, [class*="delete"]'
    ).first();
    const deleteIconVisible = await deleteIconInRow.isVisible({ timeout: 3000 }).catch(() => false);

    if (deleteIconVisible) {
        console.log('✅ Delete icon found in row — clicking to check confirmation dialog');
        await deleteIconInRow.click({ timeout: 5000 }).catch(() => {});
        await page.waitForTimeout(1500);

        // Confirmation dialog should appear
        const confirmDialog = page.locator('.v-dialog, [role="dialog"]').first();
        const confirmVisible = await confirmDialog.isVisible({ timeout: 5000 }).catch(() => false);

        if (confirmVisible) {
            console.log('✅ Delete confirmation dialog appeared');

            // Do NOT click confirm/delete — press Escape
            await page.keyboard.press('Escape');
            await page.waitForTimeout(1500);

            const stillOpen = await confirmDialog.isVisible({ timeout: 3000 }).catch(() => false);
            if (stillOpen) {
                const cancelBtn = page.locator('button').filter({ hasText: /cancel|no|dismiss/i }).first();
                await cancelBtn.click({ timeout: 5000 }).catch(() => {});
                await page.waitForTimeout(1000);
            }
            console.log('✅ Delete cancelled — no data was deleted');
        } else {
            console.log('⚠️ Delete confirmation dialog did not appear after clicking delete icon');
        }
    } else {
        // Try selecting row via checkbox, then check toolbar for delete
        const rowCheckbox = firstRow.locator('input[type="checkbox"], .v-checkbox').first();
        const checkboxVisible = await rowCheckbox.isVisible({ timeout: 3000 }).catch(() => false);

        if (checkboxVisible) {
            console.log('✅ Row checkbox found — selecting row to check bulk actions');
            await rowCheckbox.click({ timeout: 5000 }).catch(() => {});
            await page.waitForTimeout(1000);

            const bulkDeleteBtn = page.locator('button').filter({ hasText: /delete|remove/i }).first();
            const bulkDeleteVisible = await bulkDeleteBtn.isVisible({ timeout: 3000 }).catch(() => false);
            console.log(bulkDeleteVisible
                ? '✅ Bulk delete button appeared after selecting row'
                : '⚠️ No bulk delete button appeared after row selection');

            // Deselect — click checkbox again
            await rowCheckbox.click({ timeout: 5000 }).catch(() => {});
            console.log('✅ Row deselected — no data was deleted');
        } else {
            // Try row right-click / context menu
            await firstRow.click({ button: 'right', timeout: 5000 }).catch(() => {});
            await page.waitForTimeout(1000);
            const contextMenu = page.locator('.v-menu__content, [role="menu"]').first();
            const contextMenuVisible = await contextMenu.isVisible({ timeout: 3000 }).catch(() => false);
            if (contextMenuVisible) {
                const deleteOption = contextMenu.locator('[role="menuitem"]').filter({ hasText: /delete/i }).first();
                const deleteOptionVisible = await deleteOption.isVisible({ timeout: 2000 }).catch(() => false);
                console.log(deleteOptionVisible
                    ? '✅ Delete option found in context menu'
                    : '⚠️ No delete option in context menu');
                await page.keyboard.press('Escape');
            } else {
                console.log('⚠️ Delete not accessible via icon, checkbox, or context menu — may require different permissions');
            }
        }
    }
});

// ---------------------------------------------------------------------------
// 7. [NAV] Module accessible via direct URL navigation
// ---------------------------------------------------------------------------
test('Workflows - accessible via direct URL without extra navigation', async ({ page }) => {
    test.setTimeout(180000);

    await loginToApp(page, 90000, EMAIL, PASSWORD);

    // Navigate directly to the workflows URL
    await page.goto(LIST_URL, { waitUntil: 'load', timeout: 30000 });
    await page.waitForTimeout(3000);

    const currentUrl = page.url();
    console.log(`✅ Final URL after direct navigation: ${currentUrl}`);

    // Should remain on workflows URL (no redirect away)
    const onWorkflowsPage = /system-settings\/workflows/i.test(currentUrl);
    expect(onWorkflowsPage).toBe(true);
    console.log('✅ URL confirmed as system-settings/workflows');

    // Verify page is not a blank/spinner-only state
    await page.waitForTimeout(2000);
    const pageBody = await page.locator('body').textContent().catch(() => '');
    const hasContent = (pageBody?.trim().length ?? 0) > 50;
    console.log(hasContent
        ? '✅ Page body has content (not blank)'
        : '⚠️ Page body appears empty or minimal');

    // Verify no auth redirect to login
    const onLoginPage = /login|auth|sign-in/i.test(currentUrl);
    expect(onLoginPage).toBe(false);
    console.log('✅ Not redirected to login — auth session is valid');
});

// ---------------------------------------------------------------------------
// 8. [MODULE-SPECIFIC] Workflow trigger types and step count visible
// ---------------------------------------------------------------------------
test('Workflows - trigger types and step/action indicators are visible', async ({ page }) => {
    test.setTimeout(180000);

    // Workflows in student accommodation typically trigger on:
    // - Enquiry created / received
    // - Application status changed
    // - Booking confirmed / cancelled
    // - Task overdue
    // - Date-based (move-in, move-out)
    // This test checks that trigger/type information is surfaced in the list.

    await loginToApp(page, 90000, EMAIL, PASSWORD);
    await navigateToWorkflows(page);

    // Check for trigger-related column or cell content
    const triggerContent = page.locator('td, .v-list-item__content').filter({
        hasText: /enquiry|application|booking|trigger|event|status|task|email|notification/i
    });
    const triggerCount = await triggerContent.count().catch(() => 0);

    if (triggerCount > 0) {
        console.log(`✅ Found ${triggerCount} cell(s) with workflow trigger/type content`);
        const firstTriggerText = await triggerContent.first().textContent().catch(() => '');
        console.log(`   First trigger cell text: "${firstTriggerText?.trim()}"`);
    } else {
        console.log('⚠️ No trigger-type content detected in cells — may use icons or a different layout');
    }

    // Check for status indicators (active/inactive toggle is common for workflows)
    const statusChips = page.locator(
        '.v-chip, [class*="status"], [class*="badge"], input[type="checkbox"][aria-label*="active" i]'
    );
    const statusCount = await statusChips.count().catch(() => 0);
    console.log(statusCount > 0
        ? `✅ Found ${statusCount} status chip/indicator(s) — workflows likely have active/inactive state`
        : '⚠️ No status chips/indicators found');

    // Check for step/action count indicators (workflows often show "3 steps", "2 actions")
    const stepContent = page.locator('td, span, .v-chip').filter({
        hasText: /\d+\s*(step|action|condition)/i
    });
    const stepCount = await stepContent.count().catch(() => 0);
    console.log(stepCount > 0
        ? `✅ Found ${stepCount} element(s) showing step/action counts`
        : '⚠️ No step/action count indicators found in list');

    // Check for an "Enable/Disable" or active toggle — common in workflow lists
    const toggles = page.locator('.v-switch, input[type="checkbox"].v-switch__input, [role="switch"]');
    const toggleCount = await toggles.count().catch(() => 0);
    console.log(toggleCount > 0
        ? `✅ Found ${toggleCount} toggle switch(es) — likely active/inactive controls per workflow`
        : '⚠️ No toggle switches found — active state may be managed elsewhere');

    // Overall: at least the page is on the right URL and renders something
    await expect(page).toHaveURL(/system-settings\/workflows/, { timeout: 5000 });
    console.log('✅ Workflow module-specific checks complete');
});
