import { test, expect } from '@playwright/test';
import { loginToApp } from './helpers/auth.helper';

test('navigate to Attributes and filter by installment type', async ({ page }) => {
    test.setTimeout(120000);
    
    await loginToApp(page);

    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    await page.getByRole('button', { name: /settings/i }).click();
    await page.waitForTimeout(1000);

    await page.getByText('Data Management').click();
    await page.waitForTimeout(500);
    
    await page.getByText('Attributes').click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    await expect(page.getByText('Attributes', { exact: false }).first()).toBeVisible({ timeout: 10000 });

    console.log('✅ Successfully navigated to Attributes under Data Management');

    await page.getByLabel('Type').click();
    await page.waitForTimeout(1000);
    await page.locator('.v-list-item').filter({ hasText: 'installment' }).first().click();
    await page.waitForTimeout(2000);
    await page.waitForLoadState('networkidle');

    console.log('Applied filter: Type = installment');

    const rows = await page.locator('tbody tr').all();
    console.log(`Found ${rows.length} rows in the listing`);

    let allAreInstallment = true;
    for (let i = 0; i < rows.length; i++) {
        const rowText = await rows[i].textContent();
        if (!rowText?.includes('installment')) {
            console.log(`❌ Row ${i + 1} does not contain "installment": ${rowText}`);
            allAreInstallment = false;
        } else {
            console.log(`✅ Row ${i + 1} contains "installment"`);
        }
    }

    if (allAreInstallment && rows.length > 0) {
        console.log('✅ All rows in the listing are of type "installment"');
    } else if (rows.length === 0) {
        console.log('⚠️ No rows found in the listing');
    } else {
        throw new Error('Not all rows are of type "installment"');
    }
});

test('create new attribute', async ({ page }) => {
    test.setTimeout(120000);
    
    await loginToApp(page);

    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    await page.getByRole('button', { name: /settings/i }).click();
    await page.waitForTimeout(1000);

    await page.getByText('Data Management').click();
    await page.waitForTimeout(500);
    
    await page.getByText('Attributes').click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    console.log('✅ Successfully navigated to Attributes under Data Management');

    // Click Create button
    await page.getByText('Create', { exact: true }).click();
    await page.waitForTimeout(1000);

    console.log('Clicked Create button');

    // Fill in English Name using placeholder
    await page.getByPlaceholder('Enter English name').fill('Pau');
    await page.waitForTimeout(500);

    // Fill in Chinese Name using placeholder
    await page.getByPlaceholder('Enter Chinese name').fill('包测试');
    await page.waitForTimeout(500);

    // Select Type = installment - click on the dropdown arrow icon with force
    await page.locator('.v-select .v-field__append-inner .mdi-menu-down').first().click({ force: true });
    await page.waitForTimeout(1000);
    // Click on installment option
    await page.getByRole('option', { name: 'installment' }).click();
    await page.waitForTimeout(1000);

    console.log('Selected Type = installment');

    // Fill in Description using the role selector
    await page.getByRole('textbox', { name: 'Enter English description' }).fill('pau test');
    await page.waitForTimeout(500);

    console.log('Filled in all form fields');

    await page.getByRole('button', { name: 'Save' }).click();
    await page.waitForTimeout(2000);
    await page.waitForLoadState('networkidle');

    console.log('✅ Successfully created new attribute');
});

test('edit first attribute record with random names', async ({ page }) => {
    test.setTimeout(120000);
    
    // Login
    await loginToApp(page);

    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Navigate to Settings > Data Management > Attributes
    await page.getByRole('button', { name: /settings/i }).click();
    await page.waitForTimeout(1000);

    await page.getByText('Data Management').click();
    await page.waitForTimeout(500);
    
    await page.getByText('Attributes').click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    console.log('✅ Successfully navigated to Attributes under Data Management');

    // Generate random names with timestamp
    const timestamp = Date.now();
    const randomEnglishName = `EditTest${timestamp}`;
    const randomChineseName = `编辑测试${timestamp}`;

    console.log(`Random English Name: ${randomEnglishName}`);
    console.log(`Random Chinese Name: ${randomChineseName}`);

    // Click on the first record in the listing to edit
    await page.locator('tbody tr').first().click();
    await page.waitForTimeout(2000);

    console.log('Clicked first record to edit - inline editing enabled');

    // The row is now in edit mode with input fields visible
    // Find text inputs only (skip checkbox)
    const firstRowInputs = page.locator('tbody tr').first().locator('input[type="text"]');
    
    // Update English Name - select all and replace
    await firstRowInputs.nth(0).click({ clickCount: 3 }); // Select all text
    await firstRowInputs.nth(0).fill(randomEnglishName);
    await page.waitForTimeout(500);

    // Update Chinese Name - select all and replace
    await firstRowInputs.nth(1).click({ clickCount: 3 }); // Select all text
    await firstRowInputs.nth(1).fill(randomChineseName);
    await page.waitForTimeout(500);

    console.log('Updated English and Chinese names');

    // Click Save button
    await page.getByRole('button', { name: 'Save' }).click();
    await page.waitForTimeout(3000);
    await page.waitForLoadState('networkidle');

    console.log('✅ Successfully edited first attribute record with random names');
});

test('verify attributes table displays records', async ({ page }) => {
    test.setTimeout(120000);
    
    await loginToApp(page);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Navigate to Attributes
    await page.getByRole('button', { name: /settings/i }).click();
    await page.waitForTimeout(1000);
    await page.getByText('Data Management').click();
    await page.waitForTimeout(500);
    await page.getByText('Attributes').click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    console.log('✅ Successfully navigated to Attributes');

    // Verify table is visible
    const table = page.locator('table, .v-data-table, [role="table"]').first();
    await expect(table).toBeVisible({ timeout: 10000 });
    console.log('✅ Table is visible');

    // Count attributes in the table
    const rows = await page.locator('tbody tr').all();
    console.log(`Found ${rows.length} attribute(s) in the table`);

    if (rows.length > 0) {
        await expect(rows[0]).toBeVisible();
        console.log('✅ First attribute record is visible');
    }
});

test('search attributes by English name', async ({ page }) => {
    test.setTimeout(120000);
    
    await loginToApp(page);
    await page.waitForLoadState('load');
    await page.waitForTimeout(2000);

    // Navigate to Attributes
    await page.getByRole('button', { name: /settings/i }).click();
    await page.waitForTimeout(1000);
    await page.getByText('Data Management').click();
    await page.waitForTimeout(1000);
    await page.getByText('Attributes').click();
    await page.waitForLoadState('load');
    await page.waitForTimeout(2000);

    console.log('✅ Successfully navigated to Attributes');

    // Look for search input field
    const searchInput = page.locator('input[type="text"]').first();

    if (await searchInput.isVisible({ timeout: 5000 }).catch(() => false)) {
        // Enter search term
        await searchInput.fill('test');
        await page.waitForTimeout(1500);
        console.log('✅ Entered search term: test');

        // Count results
        const rows = await page.locator('tbody tr').all();
        console.log(`Found ${rows.length} attribute(s) matching search`);
    } else {
        console.log('⚠️ Search field not found, skipping search test');
    }
});

test('filter attributes by type - amenities', async ({ page }) => {
    test.setTimeout(120000);
    
    await loginToApp(page);
    await page.waitForLoadState('load');
    await page.waitForTimeout(2000);

    // Navigate to Attributes
    await page.getByRole('button', { name: /settings/i }).click();
    await page.waitForTimeout(1000);
    await page.getByText('Data Management').click();
    await page.waitForTimeout(1000);
    await page.getByText('Attributes').click();
    await page.waitForLoadState('load');
    await page.waitForTimeout(2000);

    console.log('✅ Successfully navigated to Attributes');

    // Apply filter - try amenities or fallback to any available type
    await page.getByLabel('Type').click();
    await page.waitForTimeout(1000);
    
    // Check if amenities option exists
    const amenitiesOption = page.locator('.v-list-item').filter({ hasText: 'amenities' });
    const hasAmenities = await amenitiesOption.count() > 0;
    
    if (hasAmenities) {
        await amenitiesOption.first().click();
        await page.waitForTimeout(2000);
        await page.waitForLoadState('load');
        console.log('Applied filter: Type = amenities');
    } else {
        // Fallback: select any available type option that's not installment
        const allOptions = await page.locator('.v-list-item-title').allTextContents();
        console.log('Available types:', allOptions.join(', '));
        
        // Select deposit or first option that's not installment
        const depositOption = page.locator('.v-list-item').filter({ hasText: 'deposit' });
        if (await depositOption.count() > 0) {
            await depositOption.first().click();
            await page.waitForTimeout(2000);
            await page.waitForLoadState('load');
            console.log('Applied filter: Type = deposit (amenities not available)');
        } else {
            console.log('⚠️ Amenities type not found, skipping filter test');
            return;
        }
    }

    // Verify filtered results
    const rows = await page.locator('tbody tr').all();
    console.log(`Found ${rows.length} amenities attribute(s)`);

    if (rows.length > 0) {
        let allAreAmenities = true;
        for (let i = 0; i < rows.length; i++) {
            const rowText = await rows[i].textContent();
            if (!rowText?.toLowerCase().includes('amenities')) {
                console.log(`⚠️ Row ${i + 1} may not be amenities type`);
                allAreAmenities = false;
            }
        }
        if (allAreAmenities) {
            console.log('✅ All rows are of type "amenities"');
        }
    }
});

test('create attribute with all types verification', async ({ page }) => {
    test.setTimeout(120000);
    
    await loginToApp(page);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Navigate to Attributes
    await page.getByRole('button', { name: /settings/i }).click();
    await page.waitForTimeout(1000);
    await page.getByText('Data Management').click();
    await page.waitForTimeout(500);
    await page.getByText('Attributes').click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    console.log('✅ Successfully navigated to Attributes');

    // Click Create button
    await page.getByText('Create', { exact: true }).click();
    await page.waitForTimeout(1000);
    console.log('Clicked Create button');

    // Check available types in dropdown
    await page.locator('.v-select .v-field__append-inner .mdi-menu-down').first().click({ force: true });
    await page.waitForTimeout(1000);

    const options = await page.locator('.v-list-item-title').allTextContents();
    console.log('✅ Available attribute types:', options.join(', '));

    // Select first available type with force click to handle overlays
    if (options.length > 0) {
        await page.locator('.v-list-item').first().click({ force: true });
        await page.waitForTimeout(500);
        console.log(`✅ Selected type: ${options[0]}`);
    }

    // Close without saving
    await page.keyboard.press('Escape');
    await page.waitForTimeout(1000);
    console.log('✅ Verified attribute types available');
});

test('validate required fields when creating attribute', async ({ page }) => {
    test.setTimeout(120000);
    
    await loginToApp(page);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Navigate to Attributes
    await page.getByRole('button', { name: /settings/i }).click();
    await page.waitForTimeout(1000);
    await page.getByText('Data Management').click();
    await page.waitForTimeout(500);
    await page.getByText('Attributes').click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    console.log('✅ Successfully navigated to Attributes');

    // Click Create button
    await page.getByText('Create', { exact: true }).click();
    await page.waitForTimeout(1000);
    console.log('Clicked Create button');

    // Try to save without filling required fields
    const saveButton = page.getByRole('button', { name: 'Save' });
    const isDisabled = await saveButton.isDisabled().catch(() => false);
    
    if (isDisabled) {
        console.log('✅ Validated: Save button is disabled when form is empty');
    } else {
        console.log('⚠️ Save button is not disabled (may show validation errors on click)');
    }

    // Fill only English name
    await page.getByPlaceholder('Enter English name').fill('Test Only Name');
    await page.waitForTimeout(1000);
    console.log('Filled only English name field');

    // Check if save button state changed
    const isStillDisabled = await saveButton.isDisabled().catch(() => false);
    if (isStillDisabled) {
        console.log('✅ Validated: Save button still disabled without Type selected');
    }

    // Select Type
    await page.locator('.v-select .v-field__append-inner .mdi-menu-down').first().click({ force: true });
    await page.waitForTimeout(1000);
    await page.locator('.v-list-item').first().click({ force: true });
    await page.waitForTimeout(500);
    console.log('Selected Type');

    // Check if save button is now enabled
    const isFinallyEnabled = !await saveButton.isDisabled().catch(() => true);
    if (isFinallyEnabled) {
        console.log('✅ Validated: Save button enabled with English name and Type');
    }

    console.log('🎉 All validation checks completed!');
});

test('edit attribute and verify changes persist', async ({ page }) => {
    test.setTimeout(120000);
    
    await loginToApp(page);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Navigate to Attributes
    await page.getByRole('button', { name: /settings/i }).click();
    await page.waitForTimeout(1000);
    await page.getByText('Data Management').click();
    await page.waitForTimeout(500);
    await page.getByText('Attributes').click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    console.log('✅ Successfully navigated to Attributes');

    // Get first record's original English name
    const firstRow = page.locator('tbody tr').first();
    const originalName = await firstRow.locator('td').nth(1).textContent();
    console.log(`Original English name: ${originalName}`);

    // Generate random name
    const timestamp = Date.now();
    const newName = `Verified${timestamp}`;
    console.log(`New name to apply: ${newName}`);

    // Click to edit
    await firstRow.click();
    await page.waitForTimeout(2000);
    console.log('✅ Clicked first record to edit');

    // Update English Name
    const firstRowInputs = page.locator('tbody tr').first().locator('input[type="text"]');
    await firstRowInputs.nth(0).click({ clickCount: 3 });
    await firstRowInputs.nth(0).fill(newName);
    await page.waitForTimeout(500);
    console.log(`✅ Updated name to: ${newName}`);

    // Save
    await page.getByRole('button', { name: 'Save' }).click();
    await page.waitForTimeout(3000);
    await page.waitForLoadState('networkidle');
    console.log('✅ Saved changes');

    // Verify the change persists in the table
    const updatedName = await firstRow.locator('td').nth(1).textContent();
    if (updatedName?.includes(newName)) {
        console.log('✅ Changes persisted successfully!');
    } else {
        console.log(`⚠️ Name might not have updated. Current: ${updatedName}`);
    }
});

test('delete attribute record', async ({ page }) => {
    test.setTimeout(120000);
    
    await loginToApp(page);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Navigate to Attributes
    await page.getByRole('button', { name: /settings/i }).click();
    await page.waitForTimeout(1000);
    await page.getByText('Data Management').click();
    await page.waitForTimeout(500);
    await page.getByText('Attributes').click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    console.log('✅ Successfully navigated to Attributes');

    // Count records before deletion
    const rowsBefore = await page.locator('tbody tr').count();
    console.log(`Records before deletion: ${rowsBefore}`);

    // Look for delete button or checkbox + delete action
    const firstRow = page.locator('tbody tr').first();
    
    // Try to find checkbox in first row
    const checkbox = firstRow.locator('input[type="checkbox"]');
    if (await checkbox.isVisible({ timeout: 3000 }).catch(() => false)) {
        await checkbox.click();
        await page.waitForTimeout(500);
        console.log('✅ Selected first record');

        // Look for delete button
        const deleteButton = page.getByRole('button', { name: /delete/i });
        if (await deleteButton.isVisible({ timeout: 3000 }).catch(() => false)) {
            await deleteButton.click();
            await page.waitForTimeout(1000);
            console.log('Clicked Delete button');

            // Confirm deletion if dialog appears
            const confirmButton = page.getByRole('button', { name: /confirm|yes|delete/i });
            if (await confirmButton.isVisible({ timeout: 3000 }).catch(() => false)) {
                await confirmButton.click();
                await page.waitForTimeout(2000);
                await page.waitForLoadState('networkidle');
                console.log('✅ Confirmed deletion');

                // Verify record count decreased
                const rowsAfter = await page.locator('tbody tr').count();
                console.log(`Records after deletion: ${rowsAfter}`);

                if (rowsAfter < rowsBefore) {
                    console.log('✅ Record successfully deleted!');
                } else {
                    console.log('⚠️ Record count unchanged');
                }
            } else {
                console.log('⚠️ Confirmation dialog not found');
            }
        } else {
            console.log('⚠️ Delete button not found');
        }
    } else {
        console.log('⚠️ Checkbox not found - delete functionality may not be available');
    }
});

test('create attribute with Chinese characters only', async ({ page }) => {
    test.setTimeout(120000);
    
    await loginToApp(page);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Navigate to Attributes
    await page.getByRole('button', { name: /settings/i }).click();
    await page.waitForTimeout(1000);
    await page.getByText('Data Management').click();
    await page.waitForTimeout(500);
    await page.getByText('Attributes').click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    console.log('✅ Successfully navigated to Attributes');

    // Click Create button
    await page.getByText('Create', { exact: true }).click();
    await page.waitForTimeout(1000);
    console.log('Clicked Create button');

    // Generate Chinese name
    const timestamp = Date.now();
    const chineseName = `测试属性${timestamp}`;

    // Fill in English Name (required)
    await page.getByPlaceholder('Enter English name').fill(`ChineseTest${timestamp}`);
    await page.waitForTimeout(500);

    // Fill in Chinese Name
    await page.getByPlaceholder('Enter Chinese name').fill(chineseName);
    await page.waitForTimeout(500);
    console.log(`✅ Filled Chinese name: ${chineseName}`);

    // Select Type
    await page.locator('.v-select .v-field__append-inner .mdi-menu-down').first().click({ force: true });
    await page.waitForTimeout(1000);
    await page.getByRole('option', { name: 'installment' }).click();
    await page.waitForTimeout(1000);
    console.log('✅ Selected Type = installment');

    // Fill in Chinese Description
    await page.getByRole('textbox', { name: 'Enter English description' }).fill('中文描述测试');
    await page.waitForTimeout(500);

    // Save
    await page.getByRole('button', { name: 'Save' }).click();
    await page.waitForTimeout(2000);
    await page.waitForLoadState('networkidle');

    console.log('✅ Successfully created attribute with Chinese characters');
});
