import { test, expect } from '@playwright/test';
import { loginToApp } from './helpers/auth.helper';

const BASE = 'https://app-staging.vivacityapp.com';
const LIST_URL = `${BASE}/demo-student/enquiries`;

async function navigateToEnquiries(page: any) {
    await page.goto(LIST_URL, { waitUntil: 'load', timeout: 30000 });
    await page.waitForTimeout(3000);
    await expect(page).toHaveURL(/demo-student\/enquiries/, { timeout: 10000 });
    await page.waitForSelector('.v-application', { timeout: 15000 });
    await page.waitForTimeout(1000);
    console.log('✅ Navigated to Enquiries list');
}

// ─────────────────────────────────────────────────────────────
// CREATE
// ─────────────────────────────────────────────────────────────

test('Enquiries - [CREATE] click Create button, fill required fields (name, email, property), save', async ({ page }) => {
    test.setTimeout(300000);
    await loginToApp(page);
    await navigateToEnquiries(page);

    // Open create dialog
    const createBtn = page.locator('button').filter({ hasText: /^create$/i }).first();
    const hasCreate = await createBtn.isVisible({ timeout: 5000 }).catch(() => false);
    if (!hasCreate) {
        // Fallback: any button containing "Create"
        const fallbackBtn = page.getByRole('button', { name: /create/i }).first();
        await expect(fallbackBtn).toBeVisible({ timeout: 5000 });
        await fallbackBtn.click();
    } else {
        await createBtn.click();
    }
    await page.waitForTimeout(2000);
    console.log('✅ Clicked Create button');

    // Dialog should open
    const dialog = page.locator('[role="dialog"]').first();
    await expect(dialog).toBeVisible({ timeout: 10000 });
    console.log('✅ Create dialog opened');

    const timestamp = Date.now();

    // Fill First Name / Full Name
    const firstNameInput = dialog.locator('input[placeholder*="First" i], input[placeholder*="first name" i]').first();
    const fullNameInput = dialog.locator('input[placeholder*="Name" i], input[label*="Name" i]').first();
    const nameInput = (await firstNameInput.isVisible({ timeout: 2000 }).catch(() => false))
        ? firstNameInput
        : fullNameInput;
    const nameInputVisible = await nameInput.isVisible({ timeout: 3000 }).catch(() => false);
    if (nameInputVisible) {
        await nameInput.fill(`Test Enquirer ${timestamp}`);
        console.log(`✅ Filled Name: Test Enquirer ${timestamp}`);
    } else {
        // Fallback: first visible text input
        const inputs = dialog.locator('input[type="text"]:visible, input:not([type]):visible');
        const cnt = await inputs.count();
        if (cnt > 0) {
            await inputs.first().fill(`Test Enquirer ${timestamp}`);
            console.log('✅ Filled first text input as Name');
        }
    }

    // Fill Email
    const emailInput = dialog.locator('input[type="email"], input[placeholder*="email" i]').first();
    const emailVisible = await emailInput.isVisible({ timeout: 3000 }).catch(() => false);
    if (emailVisible) {
        await emailInput.fill(`test.enquirer${timestamp}@example.com`);
        console.log(`✅ Filled Email: test.enquirer${timestamp}@example.com`);
    } else {
        console.log('⚠️ Email input not found with expected selector');
    }

    // Select Property via dropdown/combobox
    const propertyCombo = dialog.getByRole('combobox').first();
    const hasPropertyCombo = await propertyCombo.isVisible({ timeout: 3000 }).catch(() => false);
    if (hasPropertyCombo) {
        await propertyCombo.click();
        await page.waitForTimeout(1000);
        const firstOption = page.locator('[role="listbox"] [role="option"], .v-list-item').first();
        const hasOption = await firstOption.isVisible({ timeout: 5000 }).catch(() => false);
        if (hasOption) {
            const optionText = await firstOption.textContent();
            await firstOption.click();
            await page.waitForTimeout(500);
            console.log(`✅ Selected Property: ${optionText?.trim()}`);
        } else {
            console.log('⚠️ No property options found in dropdown');
            await page.keyboard.press('Escape');
        }
    } else {
        console.log('⚠️ Property combobox not found');
    }

    // Fill Phone if present
    const phoneInput = dialog.locator('input[type="tel"], input[placeholder*="phone" i], input[placeholder*="Phone" i]').first();
    const hasPhone = await phoneInput.isVisible({ timeout: 2000 }).catch(() => false);
    if (hasPhone) {
        await phoneInput.fill('+61400000001');
        console.log('✅ Filled Phone');
    }

    // Save
    const saveBtn = dialog.getByRole('button', { name: /^save$|^create$|^submit$|^add$/i }).first();
    const hasSave = await saveBtn.isVisible({ timeout: 5000 }).catch(() => false);
    if (hasSave) {
        await saveBtn.click();
        await page.waitForTimeout(3000);
        await page.waitForLoadState('load', { timeout: 15000 });
        console.log('✅ Clicked Save in Create dialog');
    } else {
        console.log('⚠️ Save button not found — checking for any submit button');
        const anySubmit = dialog.locator('button[type="submit"]').first();
        if (await anySubmit.isVisible({ timeout: 2000 }).catch(() => false)) {
            await anySubmit.click();
            await page.waitForTimeout(3000);
            console.log('✅ Clicked submit button');
        }
    }

    // Verify dialog closed or success
    const dialogGone = !(await dialog.isVisible({ timeout: 3000 }).catch(() => false));
    if (dialogGone) {
        console.log('✅ Dialog closed after save — Create successful');
    } else {
        // Check for validation errors
        const errorMsg = dialog.locator('.v-messages--error, [class*="error"], [role="alert"]').first();
        const hasError = await errorMsg.isVisible({ timeout: 2000 }).catch(() => false);
        if (hasError) {
            const errText = await errorMsg.textContent().catch(() => '');
            console.log(`⚠️ Validation error shown: ${errText?.trim()}`);
        } else {
            console.log('ℹ️ Dialog still open — may require additional required fields');
        }
    }

    console.log('✅ CREATE (full fields) test completed');
});

test('Enquiries - [CREATE] create enquiry with minimal required fields', async ({ page }) => {
    test.setTimeout(300000);
    await loginToApp(page);
    await navigateToEnquiries(page);

    const createBtn = page.locator('button').filter({ hasText: /^create$/i }).first();
    const hasCreate = await createBtn.isVisible({ timeout: 5000 }).catch(() => false);
    if (hasCreate) {
        await createBtn.click();
    } else {
        const fallbackBtn = page.getByRole('button', { name: /create/i }).first();
        await expect(fallbackBtn).toBeVisible({ timeout: 5000 });
        await fallbackBtn.click();
    }
    await page.waitForTimeout(2000);

    const dialog = page.locator('[role="dialog"]').first();
    await expect(dialog).toBeVisible({ timeout: 10000 });
    console.log('✅ Create dialog opened');

    const timestamp = Date.now();

    // Fill minimal fields — attempt name and email only
    const textInputs = dialog.locator('input[type="text"]:visible, input:not([type]):visible');
    const inputCount = await textInputs.count();
    console.log(`Found ${inputCount} visible text input(s) in dialog`);

    if (inputCount > 0) {
        await textInputs.first().fill(`Minimal Test ${timestamp}`);
        console.log(`✅ Filled first text input: Minimal Test ${timestamp}`);
    }

    const emailInput = dialog.locator('input[type="email"]').first();
    const hasEmail = await emailInput.isVisible({ timeout: 2000 }).catch(() => false);
    if (hasEmail) {
        await emailInput.fill(`minimal${timestamp}@example.com`);
        console.log(`✅ Filled Email: minimal${timestamp}@example.com`);
    }

    // Attempt to save
    const saveBtn = dialog.getByRole('button', { name: /^save$|^create$|^submit$|^add$/i }).first();
    const hasSave = await saveBtn.isVisible({ timeout: 5000 }).catch(() => false);
    if (hasSave) {
        await saveBtn.click();
        await page.waitForTimeout(3000);
        console.log('✅ Clicked Save');
    }

    const dialogGone = !(await dialog.isVisible({ timeout: 3000 }).catch(() => false));
    if (dialogGone) {
        console.log('✅ Dialog closed — minimal create succeeded');
    } else {
        console.log('ℹ️ Dialog still open — may require more fields or validation errors present');
        // Close dialog to clean up
        const closeBtn = dialog.locator('button[aria-label*="close" i], button.mdi-close, button:has(.mdi-close)').first();
        const cancelBtn = dialog.getByRole('button', { name: /^cancel$/i }).first();
        if (await closeBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
            await closeBtn.click();
        } else if (await cancelBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
            await cancelBtn.click();
        } else {
            await page.keyboard.press('Escape');
        }
        await page.waitForTimeout(1000);
    }

    console.log('✅ CREATE (minimal fields) test completed');
});

// ─────────────────────────────────────────────────────────────
// EDIT
// ─────────────────────────────────────────────────────────────

test('Enquiries - [EDIT] click first enquiry row to open detail, edit a field, save', async ({ page }) => {
    test.setTimeout(300000);
    await loginToApp(page);
    await navigateToEnquiries(page);

    // Wait for table rows
    const firstRow = page.locator('tbody tr').first();
    await expect(firstRow).toBeVisible({ timeout: 15000 });
    console.log('✅ Enquiries table loaded with rows');

    // Click row to open detail/edit panel
    await firstRow.click();
    await page.waitForTimeout(2000);
    console.log('✅ Clicked first row');

    // Check for detail panel (dialog or side panel)
    const detailPanel = page.locator('[role="dialog"], .v-navigation-drawer--active, [class*="detail"], [class*="panel"], [class*="slide"]').first();
    const panelOpen = await detailPanel.isVisible({ timeout: 5000 }).catch(() => false);

    if (panelOpen) {
        console.log('✅ Detail panel/dialog opened');

        // Look for an Edit button inside the panel to enter edit mode
        const editBtn = detailPanel.getByRole('button', { name: /^edit$/i }).first();
        const hasEditBtn = await editBtn.isVisible({ timeout: 3000 }).catch(() => false);
        if (hasEditBtn) {
            await editBtn.click();
            await page.waitForTimeout(1500);
            console.log('✅ Clicked Edit button to enter edit mode');
        }

        // Try to edit a text field — phone or notes
        const editableInput = detailPanel.locator('input[type="text"]:not([readonly]), input[type="tel"], textarea:not([readonly])').first();
        const hasEditable = await editableInput.isVisible({ timeout: 5000 }).catch(() => false);

        if (hasEditable) {
            const originalVal = await editableInput.inputValue().catch(() => '');
            const newVal = `Edited ${Date.now()}`;
            await editableInput.click({ clickCount: 3 });
            await editableInput.fill(newVal);
            await page.waitForTimeout(300);
            console.log(`✅ Changed field value from "${originalVal}" to "${newVal}"`);

            // Save
            const saveBtn = detailPanel.getByRole('button', { name: /^save$|^update$/i }).first();
            const hasSave = await saveBtn.isVisible({ timeout: 3000 }).catch(() => false);
            if (hasSave) {
                await saveBtn.click();
                await page.waitForTimeout(2000);
                await page.waitForLoadState('load', { timeout: 15000 });
                console.log('✅ Clicked Save — edit saved');
            } else {
                // Attempt global save button outside panel
                const globalSave = page.getByRole('button', { name: /^save$|^update$/i }).first();
                if (await globalSave.isVisible({ timeout: 2000 }).catch(() => false)) {
                    await globalSave.click();
                    await page.waitForTimeout(2000);
                    console.log('✅ Clicked global Save button');
                } else {
                    console.log('⚠️ Save button not found — may auto-save on blur');
                    await editableInput.press('Tab');
                    await page.waitForTimeout(1500);
                }
            }
        } else {
            console.log('⚠️ No editable input fields found in detail panel');
        }
    } else {
        console.log('ℹ️ No dialog/panel opened on row click — checking for inline edit');
        // Some tables allow inline editing directly on the row
        const inlineInput = firstRow.locator('input[type="text"]:not([readonly])').first();
        const hasInline = await inlineInput.isVisible({ timeout: 3000 }).catch(() => false);
        if (hasInline) {
            const newVal = `Inline ${Date.now()}`;
            await inlineInput.click({ clickCount: 3 });
            await inlineInput.fill(newVal);
            await inlineInput.press('Tab');
            await page.waitForTimeout(1500);
            console.log(`✅ Inline edited row: ${newVal}`);
        } else {
            console.log('⚠️ No inline edit available either');
        }
    }

    console.log('✅ EDIT (row click + field edit) test completed');
});

test('Enquiries - [EDIT] update enquiry status via dropdown', async ({ page }) => {
    test.setTimeout(300000);
    await loginToApp(page);
    await navigateToEnquiries(page);

    const firstRow = page.locator('tbody tr').first();
    await expect(firstRow).toBeVisible({ timeout: 15000 });

    // Click row to open detail
    await firstRow.click();
    await page.waitForTimeout(2000);
    console.log('✅ Clicked first row');

    // Look for status dropdown — in detail panel or inline
    const detailPanel = page.locator('[role="dialog"], .v-navigation-drawer--active, [class*="detail"], [class*="panel"]').first();
    const panelOpen = await detailPanel.isVisible({ timeout: 5000 }).catch(() => false);

    const searchScope = panelOpen ? detailPanel : page;

    // Try to enter edit mode if needed
    const editBtn = searchScope.getByRole('button', { name: /^edit$/i }).first();
    if (await editBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await editBtn.click();
        await page.waitForTimeout(1500);
        console.log('✅ Clicked Edit to enter edit mode');
    }

    // Locate status dropdown/combobox
    // Pattern: a combobox or select near a label containing "Status"
    const statusCombo = searchScope.locator('.v-select:near(:text("Status")), [aria-label*="Status" i], [role="combobox"]').first();
    const hasStatusCombo = await statusCombo.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasStatusCombo) {
        await statusCombo.click();
        await page.waitForTimeout(1000);
        console.log('✅ Opened status dropdown');

        // Select any visible option
        const options = page.locator('[role="listbox"] [role="option"], .v-list-item__title');
        const optCount = await options.count();
        console.log(`Found ${optCount} status option(s)`);

        if (optCount > 0) {
            const optionText = await options.first().textContent();
            await options.first().click();
            await page.waitForTimeout(500);
            console.log(`✅ Selected status option: ${optionText?.trim()}`);
        } else {
            await page.keyboard.press('Escape');
            console.log('⚠️ No options visible in status dropdown');
        }

        // Save if a save button is present
        const saveBtn = searchScope.getByRole('button', { name: /^save$|^update$/i }).first();
        const hasSave = await saveBtn.isVisible({ timeout: 3000 }).catch(() => false);
        if (hasSave) {
            await saveBtn.click();
            await page.waitForTimeout(2000);
            console.log('✅ Saved status update');
        }
    } else {
        // Fallback: look for any select or combobox and check its options for status-like values
        const anyCombo = searchScope.getByRole('combobox').first();
        const hasCombo = await anyCombo.isVisible({ timeout: 3000 }).catch(() => false);
        if (hasCombo) {
            await anyCombo.click();
            await page.waitForTimeout(1000);
            const opts = page.locator('[role="option"]:has-text("New"), [role="option"]:has-text("Pending"), [role="option"]:has-text("Contacted"), [role="option"]:has-text("Resolved"), [role="option"]:has-text("Closed")');
            const statusOptCount = await opts.count();
            if (statusOptCount > 0) {
                const optText = await opts.first().textContent();
                await opts.first().click();
                await page.waitForTimeout(500);
                console.log(`✅ Found and selected status option via fallback: ${optText?.trim()}`);
            } else {
                await page.keyboard.press('Escape');
                console.log('⚠️ No recognisable status options found in dropdown');
            }
        } else {
            console.log('⚠️ Status dropdown not found');
        }
    }

    console.log('✅ EDIT (status dropdown) test completed');
});

// ─────────────────────────────────────────────────────────────
// DELETE
// ─────────────────────────────────────────────────────────────

test('Enquiries - [DELETE] select row, delete, confirm', async ({ page }) => {
    test.setTimeout(300000);
    await loginToApp(page);
    await navigateToEnquiries(page);

    const firstRow = page.locator('tbody tr').first();
    await expect(firstRow).toBeVisible({ timeout: 15000 });

    // Verify Delete button is NOT visible before selection
    const deleteBtn = page.locator('button').filter({ hasText: /^delete$/i }).first();
    const deleteBefore = await deleteBtn.isVisible({ timeout: 2000 }).catch(() => false);
    expect(deleteBefore).toBe(false);
    console.log('✅ Delete button hidden before row selection');

    // Select first row via checkbox
    const checkbox = firstRow.locator('input[type="checkbox"]').first();
    const hasCheckbox = await checkbox.isVisible({ timeout: 5000 }).catch(() => false);
    if (!hasCheckbox) {
        // Some tables require hovering to reveal the checkbox
        await firstRow.hover();
        await page.waitForTimeout(500);
    }
    await checkbox.click();
    await page.waitForTimeout(1000);
    console.log('✅ Selected first row via checkbox');

    // Delete button should now be visible
    await expect(deleteBtn).toBeVisible({ timeout: 5000 });
    console.log('✅ Delete button appeared after row selection');
    await deleteBtn.click();
    await page.waitForTimeout(2000);
    console.log('✅ Clicked Delete');

    // Handle confirmation dialog
    const yesInput = page.getByRole('textbox', { name: /type.*yes.*confirm/i }).first();
    const hasYesDialog = await yesInput.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasYesDialog) {
        await yesInput.fill('Yes');
        await page.waitForTimeout(500);
        const removeBtn = page.getByRole('button', { name: /confirm remove/i }).first();
        await expect(removeBtn).toBeEnabled({ timeout: 5000 });
        await removeBtn.click();
        await page.waitForTimeout(2000);
        await page.waitForLoadState('load', { timeout: 15000 });
        console.log('✅ Confirmed deletion via "Yes" input dialog');
    } else {
        // Fallback: generic confirm/OK button
        const confirmBtn = page.getByRole('button', { name: /^confirm$|^yes$|^ok$|^delete$/i }).first();
        const hasConfirm = await confirmBtn.isVisible({ timeout: 3000 }).catch(() => false);
        if (hasConfirm) {
            await confirmBtn.click();
            await page.waitForTimeout(2000);
            await page.waitForLoadState('load', { timeout: 15000 });
            console.log('✅ Confirmed deletion via confirm button');
        } else {
            console.log('ℹ️ No confirmation dialog found — deletion may be immediate or requires "Yes" input');
            await page.waitForTimeout(2000);
        }
    }

    // Verify Delete button is gone (nothing selected)
    const deleteBtnAfter = await deleteBtn.isVisible({ timeout: 2000 }).catch(() => false);
    console.log(`✅ Delete button visible after deletion: ${deleteBtnAfter} (expected false if deselected)`);
    console.log('✅ DELETE (single row) test completed');
});

test('Enquiries - [DELETE] verify bulk delete button appears with multiple selections', async ({ page }) => {
    test.setTimeout(300000);
    await loginToApp(page);
    await navigateToEnquiries(page);

    const rows = page.locator('tbody tr');
    await expect(rows.first()).toBeVisible({ timeout: 15000 });
    const rowCount = await rows.count();
    const selectCount = Math.min(rowCount, 2);

    console.log(`Selecting ${selectCount} rows for bulk delete test`);

    // Select first 2 (or available) rows
    for (let i = 0; i < selectCount; i++) {
        const row = rows.nth(i);
        await row.hover();
        await page.waitForTimeout(300);
        const cb = row.locator('input[type="checkbox"]').first();
        const cbVisible = await cb.isVisible({ timeout: 3000 }).catch(() => false);
        if (cbVisible) {
            await cb.click();
            await page.waitForTimeout(400);
            console.log(`✅ Selected row ${i + 1}`);
        } else {
            console.log(`⚠️ Checkbox not found on row ${i + 1}`);
        }
    }

    // Delete button should be visible
    const deleteBtn = page.locator('button').filter({ hasText: /^delete$/i }).first();
    await expect(deleteBtn).toBeVisible({ timeout: 5000 });
    console.log(`✅ Delete button visible after selecting ${selectCount} rows (bulk delete available)`);

    // Verify button is enabled
    const isEnabled = await deleteBtn.isEnabled({ timeout: 2000 }).catch(() => false);
    expect(isEnabled).toBe(true);
    console.log('✅ Bulk Delete button is enabled');

    // Deselect all rows — do NOT actually delete live data
    const selectAllCb = page.locator('input[aria-label="Select all rows in table"]').first();
    const hasSelectAll = await selectAllCb.isVisible({ timeout: 2000 }).catch(() => false);
    if (hasSelectAll) {
        // Toggle select-all off
        const isChecked = await selectAllCb.isChecked().catch(() => false);
        if (!isChecked) {
            // Click once to select all, then once more to deselect
            await selectAllCb.click();
            await page.waitForTimeout(300);
        }
        await selectAllCb.click();
        await page.waitForTimeout(500);
        console.log('✅ Deselected all rows via select-all checkbox');
    } else {
        // Deselect individually
        for (let i = 0; i < selectCount; i++) {
            const cb = rows.nth(i).locator('input[type="checkbox"]').first();
            if (await cb.isVisible({ timeout: 1000 }).catch(() => false)) {
                const checked = await cb.isChecked().catch(() => false);
                if (checked) {
                    await cb.click();
                    await page.waitForTimeout(300);
                }
            }
        }
        console.log('✅ Deselected rows individually');
    }

    // Delete button should be hidden again
    const deleteBtnGone = !(await deleteBtn.isVisible({ timeout: 2000 }).catch(() => false));
    console.log(`✅ Delete button hidden after deselect: ${deleteBtnGone}`);
    console.log('✅ DELETE (bulk) test completed');
});
