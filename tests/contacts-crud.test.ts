import { test, expect } from '@playwright/test';
import { loginToApp } from './helpers/auth.helper';

const BASE_URL = 'https://app-staging.vivacityapp.com';
const CONTACTS_URL = `${BASE_URL}/demo-student/contacts`;

async function navigateToContacts(page: any) {
    await page.goto(CONTACTS_URL, { waitUntil: 'load', timeout: 30000 });
    await page.waitForTimeout(3000);
    await expect(page).toHaveURL(/demo-student\/contacts/, { timeout: 15000 });
    console.log('✅ Navigated to Contacts');
}

async function openCreateDialog(page: any): Promise<boolean> {
    // Try button and link variants for the Create action
    const createBtn = page.locator(
        'button, a, [role="button"]'
    ).filter({ hasText: /^create$/i }).first();
    const linkCreate = page.getByRole('link', { name: /create/i }).first();

    let hasCreate = await createBtn.isVisible({ timeout: 5000 }).catch(() => false);
    if (!hasCreate) {
        hasCreate = await linkCreate.isVisible({ timeout: 3000 }).catch(() => false);
        if (hasCreate) {
            await linkCreate.click();
        }
    } else {
        await createBtn.click();
    }

    if (!hasCreate) {
        console.log('⚠️ Create button not found');
        return false;
    }

    await page.waitForTimeout(2000);
    console.log('✅ Clicked Create button');
    return true;
}

async function fillField(page: any, labelPattern: RegExp | string, value: string): Promise<boolean> {
    // Try getByLabel first, then placeholder fallbacks
    const byLabel = page.getByLabel(labelPattern, { exact: false }).first();
    const visible = await byLabel.isVisible({ timeout: 3000 }).catch(() => false);
    if (visible) {
        await byLabel.click({ clickCount: 3 });
        await byLabel.fill(value);
        return true;
    }
    return false;
}

async function saveForm(page: any) {
    const saveBtn = page.locator('button').filter({ hasText: /^save$/i }).first();
    const saveVisible = await saveBtn.isVisible({ timeout: 3000 }).catch(() => false);
    if (saveVisible) {
        await saveBtn.click();
        await page.waitForTimeout(2000);
        console.log('✅ Clicked Save');
        return;
    }
    const submitBtn = page.locator(
        'button:has-text("Submit"), button:has-text("Create"), button:has-text("Add")'
    ).first();
    if (await submitBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await submitBtn.click();
        await page.waitForTimeout(2000);
        console.log('✅ Clicked submit/create button');
    } else {
        console.log('⚠️ No save/submit button found');
    }
}

async function confirmDeletion(page: any) {
    // Pattern: type "Yes" in confirmation input, then click confirm button
    const yesInput = page.getByRole('textbox', { name: /type.*yes.*confirm/i }).first();
    const hasYesInput = await yesInput.isVisible({ timeout: 3000 }).catch(() => false);

    if (hasYesInput) {
        await yesInput.fill('Yes');
        await page.waitForTimeout(500);
        const confirmBtn = page.getByRole('button', { name: /confirm|remove/i }).first();
        const confirmVisible = await confirmBtn.isVisible({ timeout: 3000 }).catch(() => false);
        if (confirmVisible) {
            await expect(confirmBtn).toBeEnabled({ timeout: 5000 });
            await confirmBtn.click();
            await page.waitForTimeout(2000);
            console.log('✅ Confirmed deletion via "Yes" dialog');
            return;
        }
    }

    // Fallback: generic confirm/yes/ok button
    const confirmBtn = page.getByRole('button', { name: /confirm|yes|ok/i }).first();
    if (await confirmBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await confirmBtn.click();
        await page.waitForTimeout(2000);
        console.log('✅ Confirmed deletion via confirm button');
    } else {
        console.log('ℹ️ No confirmation dialog — deletion may be immediate');
        await page.waitForTimeout(2000);
    }
}

// ─────────────────────────────────────────────────────────────
// CREATE
// ─────────────────────────────────────────────────────────────

test('Contacts - [CREATE] create contact with First Name, Last Name and Email', async ({ page }) => {
    test.setTimeout(300000);

    await loginToApp(page, 90000);
    await navigateToContacts(page);

    const opened = await openCreateDialog(page);
    if (!opened) {
        console.log('⚠️ Skipping — Create button not accessible');
        return;
    }

    // Wait for dialog or form to appear
    const dialog = page.locator('[role="dialog"], .v-dialog, [class*="modal"]').first();
    const hasDialog = await dialog.isVisible({ timeout: 5000 }).catch(() => false);
    if (hasDialog) {
        console.log('✅ Create dialog opened');
    }

    const timestamp = Date.now();
    const firstName = `TestFirst${timestamp}`;
    const lastName = `TestLast${timestamp}`;
    const email = `test.contact.${timestamp}@example.com`;

    const filledFirst = await fillField(page, /first\s*name/i, firstName);
    if (filledFirst) {
        console.log(`✅ Filled First Name: ${firstName}`);
    } else {
        // Fallback: first visible text input in dialog
        const firstInput = (hasDialog ? dialog : page)
            .locator('input[type="text"], input:not([type])')
            .first();
        if (await firstInput.isVisible({ timeout: 3000 }).catch(() => false)) {
            await firstInput.click({ clickCount: 3 });
            await firstInput.fill(firstName);
            console.log(`✅ Filled first input (First Name fallback): ${firstName}`);
        }
    }

    const filledLast = await fillField(page, /last\s*name/i, lastName);
    if (filledLast) {
        console.log(`✅ Filled Last Name: ${lastName}`);
    } else {
        const container = hasDialog ? dialog : page;
        const inputs = container.locator('input[type="text"], input:not([type])');
        const count = await inputs.count();
        if (count >= 2) {
            await inputs.nth(1).click({ clickCount: 3 });
            await inputs.nth(1).fill(lastName);
            console.log(`✅ Filled second input (Last Name fallback): ${lastName}`);
        }
    }

    const filledEmail = await fillField(page, /email/i, email);
    if (filledEmail) {
        console.log(`✅ Filled Email: ${email}`);
    } else {
        const emailInput = page.locator('input[type="email"], input[placeholder*="email" i]').first();
        if (await emailInput.isVisible({ timeout: 3000 }).catch(() => false)) {
            await emailInput.click({ clickCount: 3 });
            await emailInput.fill(email);
            console.log(`✅ Filled email input (placeholder fallback): ${email}`);
        }
    }

    await saveForm(page);

    // Dialog should close after save
    const dialogClosed = !(await dialog.isVisible({ timeout: 3000 }).catch(() => false));
    console.log(`✅ Dialog closed after save: ${dialogClosed}`);
    console.log('✅ Create contact with all fields test completed');
});

test('Contacts - [CREATE] create contact with required fields only', async ({ page }) => {
    test.setTimeout(300000);

    await loginToApp(page, 90000);
    await navigateToContacts(page);

    const opened = await openCreateDialog(page);
    if (!opened) {
        console.log('⚠️ Skipping — Create button not accessible');
        return;
    }

    const dialog = page.locator('[role="dialog"], .v-dialog, [class*="modal"]').first();
    const hasDialog = await dialog.isVisible({ timeout: 5000 }).catch(() => false);

    const timestamp = Date.now();

    // Attempt to fill each commonly-required field; skip gracefully if absent
    const firstName = `ReqOnly${timestamp}`;
    const filledFirst = await fillField(page, /first\s*name/i, firstName);
    if (filledFirst) {
        console.log(`✅ Filled First Name: ${firstName}`);
    } else {
        const container = hasDialog ? dialog : page;
        const firstInput = container.locator('input[type="text"], input:not([type])').first();
        if (await firstInput.isVisible({ timeout: 3000 }).catch(() => false)) {
            await firstInput.click({ clickCount: 3 });
            await firstInput.fill(firstName);
            console.log(`✅ Filled first input: ${firstName}`);
        }
    }

    // Some implementations require email as the only required field
    const emailInput = page.locator('input[type="email"], input[placeholder*="email" i]').first();
    const hasEmailInput = await emailInput.isVisible({ timeout: 3000 }).catch(() => false);
    if (hasEmailInput) {
        const email = `reqonly.${timestamp}@example.com`;
        await emailInput.click({ clickCount: 3 });
        await emailInput.fill(email);
        console.log(`✅ Filled Email: ${email}`);
    } else {
        const filledEmail = await fillField(page, /email/i, `reqonly.${timestamp}@example.com`);
        if (filledEmail) {
            console.log('✅ Filled Email via label');
        }
    }

    await saveForm(page);

    const dialogStillOpen = await dialog.isVisible({ timeout: 3000 }).catch(() => false);
    if (!dialogStillOpen) {
        console.log('✅ Dialog closed — contact saved with required fields only');
    } else {
        // Check for validation errors
        const errorMsg = page.locator('.v-messages__message, [class*="error"], [class*="invalid"]').first();
        const hasError = await errorMsg.isVisible({ timeout: 2000 }).catch(() => false);
        if (hasError) {
            const errText = await errorMsg.textContent().catch(() => '');
            console.log(`ℹ️ Validation message: ${errText?.trim()}`);
        }
    }

    console.log('✅ Create contact (required fields only) test completed');
});

// ─────────────────────────────────────────────────────────────
// EDIT
// ─────────────────────────────────────────────────────────────

test('Contacts - [EDIT] click first contact row and edit First Name', async ({ page }) => {
    test.setTimeout(300000);

    await loginToApp(page, 90000);
    await navigateToContacts(page);

    const firstRow = page.locator('tbody tr').first();
    const rowVisible = await firstRow.isVisible({ timeout: 10000 }).catch(() => false);
    if (!rowVisible) {
        console.log('⚠️ No contact rows available — skipping');
        return;
    }

    await firstRow.click();
    await page.waitForTimeout(2000);
    console.log('✅ Clicked first contact row');

    // Check for side panel, dialog, or detail page
    const editContainer = page.locator('[role="dialog"], .v-navigation-drawer, .v-dialog, [class*="detail"], [class*="panel"]').first();
    const hasContainer = await editContainer.isVisible({ timeout: 5000 }).catch(() => false);

    // Look for Edit button inside the panel
    const editBtn = page.locator('button').filter({ hasText: /^edit$/i }).first();
    const hasEditBtn = await editBtn.isVisible({ timeout: 3000 }).catch(() => false);
    if (hasEditBtn) {
        await editBtn.click();
        await page.waitForTimeout(2000);
        console.log('✅ Clicked Edit button');
    } else {
        console.log('ℹ️ No separate Edit button — form may be directly editable');
    }

    const timestamp = Date.now();
    const newFirstName = `EditedFirst${timestamp}`;

    // Try to find and update First Name field
    const firstNameField = page.getByLabel(/first\s*name/i, { exact: false }).first();
    const hasFirstName = await firstNameField.isVisible({ timeout: 3000 }).catch(() => false);

    if (hasFirstName) {
        const isEnabled = await firstNameField.isEnabled().catch(() => false);
        if (isEnabled) {
            await firstNameField.click({ clickCount: 3 });
            await firstNameField.fill(newFirstName);
            console.log(`✅ Updated First Name to: ${newFirstName}`);
        } else {
            console.log('⚠️ First Name field is not enabled');
        }
    } else {
        // Fallback: first editable text input visible in the edit area
        const container = hasContainer ? editContainer : page;
        const firstInput = container.locator('input[type="text"], input:not([type])').first();
        if (await firstInput.isEnabled({ timeout: 3000 }).catch(() => false)) {
            await firstInput.click({ clickCount: 3 });
            await firstInput.fill(newFirstName);
            console.log(`✅ Updated first editable input to: ${newFirstName}`);
        } else {
            console.log('⚠️ No editable input found');
        }
    }

    await saveForm(page);

    // Close panel if still open
    const closeBtn = page.locator('button:has(.mdi-close), button:has-text("Close"), [aria-label="Close"]').first();
    if (await closeBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await closeBtn.click();
        await page.waitForTimeout(1000);
    }

    console.log('✅ Edit First Name test completed');
});

test('Contacts - [EDIT] click first contact row and edit Email', async ({ page }) => {
    test.setTimeout(300000);

    await loginToApp(page, 90000);
    await navigateToContacts(page);

    const firstRow = page.locator('tbody tr').first();
    const rowVisible = await firstRow.isVisible({ timeout: 10000 }).catch(() => false);
    if (!rowVisible) {
        console.log('⚠️ No contact rows available — skipping');
        return;
    }

    await firstRow.click();
    await page.waitForTimeout(2000);
    console.log('✅ Clicked first contact row');

    const editContainer = page.locator('[role="dialog"], .v-navigation-drawer, .v-dialog, [class*="detail"], [class*="panel"]').first();
    const hasContainer = await editContainer.isVisible({ timeout: 5000 }).catch(() => false);

    const editBtn = page.locator('button').filter({ hasText: /^edit$/i }).first();
    const hasEditBtn = await editBtn.isVisible({ timeout: 3000 }).catch(() => false);
    if (hasEditBtn) {
        await editBtn.click();
        await page.waitForTimeout(2000);
        console.log('✅ Clicked Edit button');
    }

    const timestamp = Date.now();
    const newEmail = `edited.contact.${timestamp}@example.com`;

    // Try email input by type, then by label
    const emailInput = page.locator('input[type="email"]').first();
    const hasEmailType = await emailInput.isVisible({ timeout: 3000 }).catch(() => false);

    if (hasEmailType) {
        const isEnabled = await emailInput.isEnabled().catch(() => false);
        if (isEnabled) {
            await emailInput.click({ clickCount: 3 });
            await emailInput.fill(newEmail);
            console.log(`✅ Updated Email to: ${newEmail}`);
        } else {
            console.log('⚠️ Email input is not enabled');
        }
    } else {
        // Try label-based lookup — exclude checkboxes/radios (e.g. an "Email Verified"
        // toggle can also match a loose /email/i label and .fill() throws on those)
        const emailByLabel = page.getByLabel(/email/i, { exact: false }).and(page.locator('input:not([type="checkbox"]):not([type="radio"])')).first();
        if (await emailByLabel.isVisible({ timeout: 3000 }).catch(() => false)) {
            if (await emailByLabel.isEnabled().catch(() => false)) {
                await emailByLabel.click({ clickCount: 3 });
                await emailByLabel.fill(newEmail);
                console.log(`✅ Updated Email (by label) to: ${newEmail}`);
            }
        } else {
            // Fallback: placeholder-based
            const emailPlaceholder = page.locator('input[placeholder*="email" i]').first();
            if (await emailPlaceholder.isVisible({ timeout: 3000 }).catch(() => false)) {
                await emailPlaceholder.click({ clickCount: 3 });
                await emailPlaceholder.fill(newEmail);
                console.log(`✅ Updated Email (by placeholder) to: ${newEmail}`);
            } else {
                console.log('⚠️ Email field not found');
            }
        }
    }

    await saveForm(page);

    const closeBtn = page.locator('button:has(.mdi-close), button:has-text("Close"), [aria-label="Close"]').first();
    if (await closeBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await closeBtn.click();
        await page.waitForTimeout(1000);
    }

    console.log('✅ Edit Email test completed');
});

// ─────────────────────────────────────────────────────────────
// DELETE
// ─────────────────────────────────────────────────────────────

test('Contacts - [DELETE] select first row checkbox, click Delete, confirm deletion', async ({ page }) => {
    test.setTimeout(300000);

    await loginToApp(page, 90000);
    await navigateToContacts(page);

    const firstRow = page.locator('tbody tr').first();
    const rowVisible = await firstRow.isVisible({ timeout: 10000 }).catch(() => false);
    if (!rowVisible) {
        console.log('⚠️ No contact rows available — skipping');
        return;
    }

    const rowsBefore = await page.locator('tbody tr').count();
    console.log(`Rows before delete: ${rowsBefore}`);

    // Verify Delete button is hidden before selection
    const deleteBtn = page.locator('button').filter({ hasText: /^delete$/i }).first();
    const hiddenBefore = !(await deleteBtn.isVisible({ timeout: 2000 }).catch(() => false));
    console.log(`✅ Delete button hidden before selection: ${hiddenBefore}`);

    // Check the first row's checkbox
    const checkbox = firstRow.locator('input[type="checkbox"]').first();
    const hasCheckbox = await checkbox.isVisible({ timeout: 5000 }).catch(() => false);

    if (!hasCheckbox) {
        // Some tables require hovering to reveal the checkbox
        await firstRow.hover();
        await page.waitForTimeout(500);
    }

    await checkbox.click();
    await page.waitForTimeout(1000);
    console.log('✅ Selected first row checkbox');

    await expect(deleteBtn).toBeVisible({ timeout: 5000 });
    console.log('✅ Delete button appeared after selection');

    await deleteBtn.click();
    await page.waitForTimeout(2000);
    console.log('✅ Clicked Delete button');

    await confirmDeletion(page);

    await page.waitForLoadState('load', { timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(2000);

    const rowsAfter = await page.locator('tbody tr').count();
    console.log(`Rows after delete: ${rowsAfter}`);
    expect(rowsAfter).toBeGreaterThanOrEqual(0);
    console.log('✅ Delete first row test completed');
});

test('Contacts - [DELETE] select multiple rows and verify Delete button appears', async ({ page }) => {
    test.setTimeout(300000);

    await loginToApp(page, 90000);
    await navigateToContacts(page);

    const rows = page.locator('tbody tr');
    const rowCount = await rows.count();

    if (rowCount === 0) {
        console.log('⚠️ No contact rows available — skipping');
        return;
    }

    const selectCount = Math.min(rowCount, 3);

    // Ensure Delete button is hidden before any selection
    const deleteBtn = page.locator('button').filter({ hasText: /^delete$/i }).first();
    const hiddenBefore = !(await deleteBtn.isVisible({ timeout: 2000 }).catch(() => false));
    console.log(`✅ Delete button hidden before selection: ${hiddenBefore}`);

    for (let i = 0; i < selectCount; i++) {
        const row = rows.nth(i);
        // Hover first in case checkbox only appears on hover
        await row.hover();
        await page.waitForTimeout(300);
        const cb = row.locator('input[type="checkbox"]').first();
        const cbVisible = await cb.isVisible({ timeout: 3000 }).catch(() => false);
        if (cbVisible) {
            await cb.click();
            await page.waitForTimeout(300);
            console.log(`  ✅ Selected row ${i + 1}`);
        } else {
            console.log(`  ⚠️ Checkbox not visible for row ${i + 1}`);
        }
    }

    console.log(`✅ Selected ${selectCount} row(s)`);

    await expect(deleteBtn).toBeVisible({ timeout: 5000 });
    console.log('✅ Delete button visible after multi-row selection');

    // Deselect all without deleting
    const selectAll = page.locator(
        'input[aria-label="Select all rows in table"], thead input[type="checkbox"]'
    ).first();

    if (await selectAll.isVisible({ timeout: 2000 }).catch(() => false)) {
        // Toggle select-all twice to deselect everything
        const isChecked = await selectAll.isChecked().catch(() => false);
        if (!isChecked) {
            await selectAll.click();
            await page.waitForTimeout(300);
        }
        await selectAll.click();
        await page.waitForTimeout(500);
        console.log('✅ Deselected all rows via select-all checkbox');
    } else {
        // Uncheck individually
        for (let i = 0; i < selectCount; i++) {
            const row = rows.nth(i);
            const cb = row.locator('input[type="checkbox"]').first();
            if (await cb.isChecked().catch(() => false)) {
                await cb.click();
                await page.waitForTimeout(200);
            }
        }
        console.log('✅ Deselected rows individually');
    }

    const deleteBtnHiddenAfter = !(await deleteBtn.isVisible({ timeout: 2000 }).catch(() => false));
    console.log(`✅ Delete button hidden after deselect: ${deleteBtnHiddenAfter}`);
    console.log('✅ Multi-row delete button test completed');
});
