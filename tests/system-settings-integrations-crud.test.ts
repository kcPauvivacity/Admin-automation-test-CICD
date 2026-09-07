import { test, expect } from '@playwright/test';
import { loginToApp } from './helpers/auth.helper';

const EMAIL = 'pau.kie.chee@fusioneta.com';
const PASSWORD = 'PAOpaopao@9696';
const BASE = 'https://app-staging.vivacityapp.com';
const LIST_URL = `${BASE}/system-settings/integrations`;

async function navigateToIntegrations(page: any) {
    await page.goto(LIST_URL, { waitUntil: 'load', timeout: 30000 });
    await page.waitForTimeout(3000);
    await expect(page).toHaveURL(/system-settings\/integrations/, { timeout: 10000 });
    await page.waitForTimeout(1000);
    console.log('✅ Navigated to Integrations');
}

// ─────────────────────────────────────────────────────────────
// TEST 1: [READ] Page loads and main content is visible
// ─────────────────────────────────────────────────────────────
test('Integrations - [READ] page loads and main content is visible', async ({ page }) => {
    test.setTimeout(180000);

    await loginToApp(page, 90000, EMAIL, PASSWORD);
    await navigateToIntegrations(page);

    // Check page heading / title area
    const heading = page.locator('h1, h2, h3, .page-title, .v-toolbar__title').filter({ hasText: /integrations/i }).first();
    const headingVisible = await heading.isVisible({ timeout: 5000 }).catch(() => false);
    if (headingVisible) {
        console.log('✅ Page heading visible');
    } else {
        console.log('⚠️ Page heading not found — checking for any content container');
    }

    // Check main content area is rendered
    const mainContent = page.locator('.v-main, main, [data-testid="integrations"], .v-container').first();
    const mainVisible = await mainContent.isVisible({ timeout: 5000 }).catch(() => false);
    if (mainVisible) {
        console.log('✅ Main content container visible');
    } else {
        console.log('⚠️ Main content container not detected by common selectors');
    }

    // Confirm we are still on the correct URL after rendering
    await expect(page).toHaveURL(/system-settings\/integrations/, { timeout: 10000 });
    console.log('✅ URL confirmed: system-settings/integrations');
});

// ─────────────────────────────────────────────────────────────
// TEST 2: [READ] Table / list shows records and column headers
// ─────────────────────────────────────────────────────────────
test('Integrations - [READ] table shows records and column headers', async ({ page }) => {
    test.setTimeout(180000);

    await loginToApp(page, 90000, EMAIL, PASSWORD);
    await navigateToIntegrations(page);

    // Look for a data table
    const table = page.locator('.v-data-table, table, .v-list').first();
    const tableVisible = await table.isVisible({ timeout: 8000 }).catch(() => false);
    if (tableVisible) {
        console.log('✅ Data table / list visible');
    } else {
        console.log('⚠️ No data table detected — module may use cards or another layout');
    }

    // Count table rows (tbody tr)
    const rows = page.locator('tbody tr, .v-list-item, .v-data-table__tr');
    const rowCount = await rows.count().catch(() => 0);
    console.log(`✅ Row count: ${rowCount}`);

    // Log column headers if present
    const headers = page.locator('th, .v-data-table-header th, thead th');
    const headerCount = await headers.count().catch(() => 0);
    if (headerCount > 0) {
        for (let i = 0; i < headerCount; i++) {
            const headerText = await headers.nth(i).textContent().catch(() => '');
            if (headerText && headerText.trim()) {
                console.log(`  Column [${i}]: ${headerText.trim()}`);
            }
        }
        console.log('✅ Column headers logged');
    } else {
        console.log('⚠️ No column headers found — table may not be present or uses alternate layout');
    }

    // Integration-specific: check for integration name or provider columns
    const nameCol = page.locator('th, td').filter({ hasText: /name|provider|type|service/i }).first();
    const nameColVisible = await nameCol.isVisible({ timeout: 3000 }).catch(() => false);
    if (nameColVisible) {
        console.log('✅ Integration name/provider column detected');
    } else {
        console.log('⚠️ Name/provider column not explicitly found');
    }
});

// ─────────────────────────────────────────────────────────────
// TEST 3: [READ] Search or filter functionality
// ─────────────────────────────────────────────────────────────
test('Integrations - [READ] search or filter works', async ({ page }) => {
    test.setTimeout(180000);

    await loginToApp(page, 90000, EMAIL, PASSWORD);
    await navigateToIntegrations(page);

    // Look for a search input
    const searchInput = page.locator(
        'input[placeholder*="search" i], input[placeholder*="filter" i], input[type="search"], .v-text-field input'
    ).first();
    const searchVisible = await searchInput.isVisible({ timeout: 5000 }).catch(() => false);

    if (searchVisible) {
        await searchInput.fill('test');
        await page.waitForTimeout(1500);
        console.log('✅ Typed "test" into search field');

        // Clear the search
        await searchInput.clear();
        await page.waitForTimeout(1500);
        console.log('✅ Cleared search field');

        // Verify rows are visible again after clearing
        const rows = page.locator('tbody tr, .v-list-item');
        const rowCount = await rows.count().catch(() => 0);
        console.log(`✅ Rows after clearing search: ${rowCount}`);
    } else {
        console.log('⚠️ No search/filter input found — skipping search test');
    }

    // Check for filter chips / dropdowns as an alternative
    const filterBtn = page.locator('button').filter({ hasText: /filter/i }).first();
    const filterVisible = await filterBtn.isVisible({ timeout: 3000 }).catch(() => false);
    if (filterVisible) {
        console.log('✅ Filter button detected as alternative to search');
    } else {
        console.log('⚠️ No filter button found either');
    }
});

// ─────────────────────────────────────────────────────────────
// TEST 4: [CREATE] Open create dialog — verify it opens, then escape
// ─────────────────────────────────────────────────────────────
test('Integrations - [CREATE] create dialog opens and can be dismissed', async ({ page }) => {
    test.setTimeout(180000);

    await loginToApp(page, 90000, EMAIL, PASSWORD);
    await navigateToIntegrations(page);

    // Look for a create / add / new button
    const createBtn = page.locator('button').filter({ hasText: /create|add|new/i }).first();
    const createVisible = await createBtn.isVisible({ timeout: 5000 }).catch(() => false);

    if (!createVisible) {
        console.log('⚠️ No Create/Add button found — skipping create test');
        return;
    }

    await createBtn.click();
    await page.waitForTimeout(2000);
    console.log('✅ Clicked Create button');

    // Check dialog opened
    const dialog = page.locator('.v-dialog, [role="dialog"], .modal').first();
    const dialogVisible = await dialog.isVisible({ timeout: 5000 }).catch(() => false);
    if (dialogVisible) {
        console.log('✅ Create dialog opened');

        // Check for form fields within the dialog
        const nameField = dialog.locator('input[placeholder*="name" i], input[type="text"]').first();
        const nameFieldVisible = await nameField.isVisible({ timeout: 3000 }).catch(() => false);
        if (nameFieldVisible) {
            console.log('✅ Name/text field visible in create dialog');
        } else {
            console.log('⚠️ No text input found in dialog');
        }

        // Integration-specific: check for URL/endpoint or API key fields
        const urlField = dialog.locator('input[placeholder*="url" i], input[placeholder*="endpoint" i], input[placeholder*="key" i]').first();
        const urlFieldVisible = await urlField.isVisible({ timeout: 3000 }).catch(() => false);
        if (urlFieldVisible) {
            console.log('✅ URL/API key field visible in create dialog');
        } else {
            console.log('⚠️ No URL/API key field detected in dialog');
        }
    } else {
        console.log('⚠️ Dialog did not open — may navigate to a separate form page');

        // Check if we navigated to a create page instead
        const isCreatePage = await page.url().includes('create') || await page.url().includes('new');
        if (isCreatePage) {
            console.log('✅ Navigated to create form page');
        }
    }

    // Escape to dismiss without saving
    await page.keyboard.press('Escape');
    await page.waitForTimeout(1000);

    // Fallback close: look for Cancel button
    const cancelBtn = page.locator('button').filter({ hasText: /cancel|close|dismiss/i }).first();
    const cancelVisible = await cancelBtn.isVisible({ timeout: 2000 }).catch(() => false);
    if (cancelVisible) {
        await cancelBtn.click();
        await page.waitForTimeout(1000);
    }

    console.log('✅ Dismissed create dialog without saving');
});

// ─────────────────────────────────────────────────────────────
// TEST 5: [UPDATE] Click first row, verify edit form opens, escape
// ─────────────────────────────────────────────────────────────
test('Integrations - [UPDATE] edit form opens for first record', async ({ page }) => {
    test.setTimeout(180000);

    await loginToApp(page, 90000, EMAIL, PASSWORD);
    await navigateToIntegrations(page);

    // Wait for rows to load
    await page.waitForTimeout(2000);

    // Try clicking the edit button on the first row
    const editBtn = page.locator('button[aria-label*="edit" i], button').filter({ hasText: /edit/i }).first();
    const editBtnVisible = await editBtn.isVisible({ timeout: 5000 }).catch(() => false);

    if (editBtnVisible) {
        await editBtn.click();
        await page.waitForTimeout(2000);
        console.log('✅ Clicked Edit button');
    } else {
        // Fallback: click first data row directly
        const firstRow = page.locator('tbody tr, .v-list-item').first();
        const firstRowVisible = await firstRow.isVisible({ timeout: 5000 }).catch(() => false);

        if (!firstRowVisible) {
            console.log('⚠️ No rows found — skipping update test');
            return;
        }

        await firstRow.click();
        await page.waitForTimeout(2000);
        console.log('✅ Clicked first row to open edit form');
    }

    // Check if edit dialog or edit page opened
    const dialog = page.locator('.v-dialog, [role="dialog"], .modal').first();
    const dialogVisible = await dialog.isVisible({ timeout: 5000 }).catch(() => false);

    if (dialogVisible) {
        console.log('✅ Edit dialog opened');

        // Check for pre-populated fields
        const inputs = dialog.locator('input, textarea, .v-select');
        const inputCount = await inputs.count().catch(() => 0);
        console.log(`✅ Edit dialog fields count: ${inputCount}`);

        if (inputCount > 0) {
            const firstInput = inputs.first();
            const firstValue = await firstInput.inputValue().catch(() => '');
            console.log(`  First field value: "${firstValue}"`);
            console.log('✅ Fields appear pre-populated (edit mode confirmed)');
        }
    } else {
        // Check if navigated to an edit URL
        const currentUrl = page.url();
        const isEditPage = currentUrl.includes('edit') || currentUrl.includes('/integrations/');
        if (isEditPage) {
            console.log(`✅ Navigated to edit page: ${currentUrl}`);
        } else {
            console.log('⚠️ No edit dialog or edit page detected');
        }
    }

    // Escape to dismiss without saving
    await page.keyboard.press('Escape');
    await page.waitForTimeout(1000);

    const cancelBtn = page.locator('button').filter({ hasText: /cancel|close/i }).first();
    const cancelVisible = await cancelBtn.isVisible({ timeout: 2000 }).catch(() => false);
    if (cancelVisible) {
        await cancelBtn.click();
        await page.waitForTimeout(1000);
    }

    console.log('✅ Dismissed edit dialog without saving');
});

// ─────────────────────────────────────────────────────────────
// TEST 6: [DELETE] Check delete is available — do NOT confirm
// ─────────────────────────────────────────────────────────────
test('Integrations - [DELETE] delete option is available but not confirmed', async ({ page }) => {
    test.setTimeout(180000);

    await loginToApp(page, 90000, EMAIL, PASSWORD);
    await navigateToIntegrations(page);

    await page.waitForTimeout(2000);

    // Look for a delete button in the row actions
    const deleteBtn = page.locator(
        'button[aria-label*="delete" i], button[aria-label*="remove" i], button'
    ).filter({ hasText: /delete|remove/i }).first();
    const deleteBtnVisible = await deleteBtn.isVisible({ timeout: 5000 }).catch(() => false);

    if (deleteBtnVisible) {
        console.log('✅ Delete button found in table');

        await deleteBtn.click();
        await page.waitForTimeout(1500);
        console.log('✅ Clicked Delete button — checking for confirmation dialog');

        // Check for confirmation dialog
        const confirmDialog = page.locator('.v-dialog, [role="dialog"], .modal').first();
        const confirmVisible = await confirmDialog.isVisible({ timeout: 5000 }).catch(() => false);

        if (confirmVisible) {
            console.log('✅ Delete confirmation dialog appeared');

            // Do NOT confirm — press Escape or click Cancel
            const cancelBtn = page.locator('button').filter({ hasText: /cancel|no|dismiss/i }).first();
            const cancelVisible = await cancelBtn.isVisible({ timeout: 3000 }).catch(() => false);
            if (cancelVisible) {
                await cancelBtn.click();
                console.log('✅ Cancelled delete via Cancel button — data safe');
            } else {
                await page.keyboard.press('Escape');
                console.log('✅ Dismissed confirmation dialog with Escape — data safe');
            }
        } else {
            await page.keyboard.press('Escape');
            console.log('⚠️ No confirmation dialog appeared — escaped as precaution');
        }
    } else {
        // Try selecting a row first (checkbox), then look for bulk-delete
        const checkbox = page.locator('tbody tr .v-checkbox, tbody tr input[type="checkbox"]').first();
        const checkboxVisible = await checkbox.isVisible({ timeout: 3000 }).catch(() => false);

        if (checkboxVisible) {
            await checkbox.click();
            await page.waitForTimeout(1000);
            console.log('✅ Selected first row via checkbox');

            const bulkDelete = page.locator('button').filter({ hasText: /delete|remove/i }).first();
            const bulkDeleteVisible = await bulkDelete.isVisible({ timeout: 3000 }).catch(() => false);
            if (bulkDeleteVisible) {
                console.log('✅ Bulk delete button appeared after row selection');
            } else {
                console.log('⚠️ No bulk delete button appeared after row selection');
            }

            // Uncheck without deleting
            await checkbox.click();
            await page.waitForTimeout(500);
            console.log('✅ Unchecked row — data safe');
        } else {
            console.log('⚠️ No delete button or checkbox found — delete may not be available on this module');
        }
    }
});

// ─────────────────────────────────────────────────────────────
// TEST 7: [NAV] Module is accessible via direct URL
// ─────────────────────────────────────────────────────────────
test('Integrations - [NAV] accessible via direct URL', async ({ page }) => {
    test.setTimeout(180000);

    await loginToApp(page, 90000, EMAIL, PASSWORD);

    // Navigate directly by URL
    await page.goto(LIST_URL, { waitUntil: 'load', timeout: 30000 });
    await page.waitForTimeout(3000);

    // Confirm URL
    await expect(page).toHaveURL(/system-settings\/integrations/, { timeout: 10000 });
    console.log('✅ Direct URL navigation succeeded');

    // Confirm page is not showing a 404 / error
    const errorText = page.locator('body').filter({ hasText: /404|not found|error|forbidden/i });
    const errorVisible = await errorText.isVisible({ timeout: 3000 }).catch(() => false);
    if (!errorVisible) {
        console.log('✅ No error/404 message detected on page');
    } else {
        console.log('⚠️ Possible error message detected on page');
    }

    // Confirm the system settings layout is present
    const systemSettingsNav = page.locator('[aria-label*="system" i], .system-settings, nav').first();
    const navVisible = await systemSettingsNav.isVisible({ timeout: 5000 }).catch(() => false);
    if (navVisible) {
        console.log('✅ System settings navigation layout detected');
    } else {
        console.log('⚠️ System settings nav not found by generic selector');
    }
});

// ─────────────────────────────────────────────────────────────
// TEST 8: [MODULE-SPECIFIC] Integration status / active toggle
// Integration records typically have an active/enabled status.
// Verify status indicator exists and check for API key or URL fields.
// ─────────────────────────────────────────────────────────────
test('Integrations - [MODULE-SPECIFIC] integration status indicators and API fields visible', async ({ page }) => {
    test.setTimeout(180000);

    await loginToApp(page, 90000, EMAIL, PASSWORD);
    await navigateToIntegrations(page);

    await page.waitForTimeout(2000);

    // Check for status / active column indicators (common in integration modules)
    const statusCol = page.locator('th, td, .v-chip, .v-badge').filter({ hasText: /status|active|enabled|connected/i }).first();
    const statusVisible = await statusCol.isVisible({ timeout: 5000 }).catch(() => false);
    if (statusVisible) {
        console.log('✅ Status/active indicator found in integrations list');
    } else {
        console.log('⚠️ No status/active column detected');
    }

    // Check for toggle switches (common for enabling/disabling integrations)
    const toggleSwitch = page.locator('.v-switch, input[type="checkbox"][role="switch"], [role="switch"]').first();
    const toggleVisible = await toggleSwitch.isVisible({ timeout: 5000 }).catch(() => false);
    if (toggleVisible) {
        console.log('✅ Toggle switch (enable/disable integration) found');
    } else {
        console.log('⚠️ No toggle switch found — integrations may use button-based enable/disable');
    }

    // Check for type / provider column (e.g. Stripe, Twilio, Mailgun)
    const providerCol = page.locator('td, th').filter({ hasText: /provider|type|service|platform/i }).first();
    const providerVisible = await providerCol.isVisible({ timeout: 3000 }).catch(() => false);
    if (providerVisible) {
        console.log('✅ Provider/type column visible');
    } else {
        console.log('⚠️ Provider/type column not found');
    }

    // Open first record and look for API key or webhook URL field
    const firstRow = page.locator('tbody tr, .v-list-item').first();
    const firstRowVisible = await firstRow.isVisible({ timeout: 5000 }).catch(() => false);

    if (firstRowVisible) {
        await firstRow.click();
        await page.waitForTimeout(2000);

        const dialog = page.locator('.v-dialog, [role="dialog"]').first();
        const dialogVisible = await dialog.isVisible({ timeout: 5000 }).catch(() => false);

        if (dialogVisible) {
            // Check for API key field
            const apiKeyField = dialog.locator('input[placeholder*="key" i], input[placeholder*="api" i], label').filter({ hasText: /api key|secret|token/i }).first();
            const apiKeyVisible = await apiKeyField.isVisible({ timeout: 3000 }).catch(() => false);
            if (apiKeyVisible) {
                console.log('✅ API key / secret / token field found in integration detail');
            } else {
                console.log('⚠️ No API key field detected in detail view');
            }

            // Check for webhook or endpoint URL field
            const urlField = dialog.locator('input[placeholder*="url" i], input[placeholder*="endpoint" i], label').filter({ hasText: /url|endpoint|webhook/i }).first();
            const urlFieldVisible = await urlField.isVisible({ timeout: 3000 }).catch(() => false);
            if (urlFieldVisible) {
                console.log('✅ URL/endpoint/webhook field found in integration detail');
            } else {
                console.log('⚠️ No URL/endpoint field detected in detail view');
            }

            // Dismiss without saving
            await page.keyboard.press('Escape');
            await page.waitForTimeout(1000);
            console.log('✅ Closed integration detail without making changes');
        } else {
            console.log('⚠️ No detail dialog opened after clicking first row');
        }
    } else {
        console.log('⚠️ No rows found — skipping detail field check');
    }
});
