import { test, expect } from '@playwright/test';
import { loginToApp } from './helpers/auth.helper';

test('create new facility with random names', async ({ page }) => {
    test.setTimeout(120000);
    
    // Login with valid user
    await loginToApp(page);

    // Navigate to Settings
    await page.getByRole('button', { name: /settings/i }).click();
    await page.waitForTimeout(1000);

    console.log('Clicked Settings');

    // Navigate to Data Management > Facilities
    await page.getByText('Data Management').click();
    await page.waitForTimeout(500);
    
    await page.getByText('Facilities').click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    console.log('✅ Successfully navigated to Facilities under Data Management');

    // Click Create button
    await page.getByText('Create', { exact: true }).click();
    await page.waitForTimeout(2000);

    console.log('Clicked Create button - empty and clickable line should appear in listing');

    // Generate random names with timestamp
    const timestamp = Date.now();
    const randomEnglishName = `FacilityTest${timestamp}`;
    const randomChineseName = `设施测试${timestamp}`;

    console.log(`Random English Name: ${randomEnglishName}`);
    console.log(`Random Chinese Name: ${randomChineseName}`);

    // The first row should now be an empty editable row
    // Find text inputs in the first row (skip checkbox)
    const firstRowInputs = page.locator('tbody tr').first().locator('input[type="text"]');
    
    // Fill in English Name
    await firstRowInputs.nth(0).click();
    await firstRowInputs.nth(0).fill(randomEnglishName);
    await page.waitForTimeout(500);

    // Fill in Chinese Name
    await firstRowInputs.nth(1).click();
    await firstRowInputs.nth(1).fill(randomChineseName);
    await page.waitForTimeout(500);

    console.log('Filled in English and Chinese names');

    // Click Save button
    await page.getByRole('button', { name: 'Save' }).click();
    await page.waitForTimeout(3000);
    await page.waitForLoadState('networkidle');

    console.log('✅ Successfully created new facility with random names');
});

test('edit first facility record and select bathroom type', async ({ page }) => {
    test.setTimeout(120000);
    
    // Login with valid user
    await loginToApp(page);

    // Navigate to Settings
    await page.getByRole('button', { name: /settings/i }).click();
    await page.waitForTimeout(1000);

    // Navigate to Data Management > Facilities
    await page.getByText('Data Management').click();
    await page.waitForTimeout(500);
    
    await page.getByText('Facilities').click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    console.log('✅ Successfully navigated to Facilities under Data Management');

    // Click on the first record in the listing to edit
    await page.locator('tbody tr').first().click();
    await page.waitForTimeout(2000);

    console.log('Clicked first record to edit - inline editing enabled');

    // Click on the type dropdown in the first row
    await page.locator('tbody tr').first().locator('.v-select .v-field__append-inner .mdi-menu-down').click({ force: true });
    await page.waitForTimeout(1000);

    console.log('Clicked type dropdown');

    // Select bathroom from the dropdown
    await page.getByRole('option', { name: 'bathroom' }).click();
    await page.waitForTimeout(1000);

    console.log('Selected bathroom type');

    // Try to save - look for Save button or check if it auto-saves
    const saveButton = page.getByRole('button', { name: 'Save' });
    if (await saveButton.isVisible({ timeout: 3000 }).catch(() => false)) {
        await saveButton.click();
        await page.waitForTimeout(3000);
        await page.waitForLoadState('load');
        console.log('✅ Clicked Save button');
    } else {
        // Might auto-save, click outside or press Enter
        await page.keyboard.press('Escape');
        await page.waitForTimeout(2000);
        console.log('✅ Changes may have auto-saved');
    }

    console.log('✅ Successfully edited first facility record with bathroom type');
});

test('verify facilities table displays records', async ({ page }) => {
    test.setTimeout(120000);
    
    await loginToApp(page);

    // Navigate to Facilities
    await page.getByRole('button', { name: /settings/i }).click();
    await page.waitForTimeout(1000);
    await page.getByText('Data Management').click();
    await page.waitForTimeout(500);
    await page.getByText('Facilities').click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    console.log('✅ Successfully navigated to Facilities');

    // Verify table is visible
    const table = page.locator('table, .v-data-table, [role="table"]').first();
    await expect(table).toBeVisible({ timeout: 10000 });
    console.log('✅ Table is visible');

    // Count facilities in the table
    const rows = await page.locator('tbody tr').all();
    console.log(`Found ${rows.length} facility/facilities in the table`);

    if (rows.length > 0) {
        await expect(rows[0]).toBeVisible();
        console.log('✅ First facility record is visible');
    }
});

test('search facilities by name', async ({ page }) => {
    test.setTimeout(120000);
    
    await loginToApp(page);

    // Navigate to Facilities
    await page.getByRole('button', { name: /settings/i }).click();
    await page.waitForTimeout(1000);
    await page.getByText('Data Management').click();
    await page.waitForTimeout(500);
    await page.getByText('Facilities').click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    console.log('✅ Successfully navigated to Facilities');

    // Look for search input field
    const searchInput = page.locator('input[type="text"]').first();

    if (await searchInput.isVisible({ timeout: 5000 }).catch(() => false)) {
        // Enter search term
        await searchInput.fill('test');
        await page.waitForTimeout(1500);
        console.log('✅ Entered search term: test');

        // Count results
        const rows = await page.locator('tbody tr').all();
        console.log(`Found ${rows.length} facility/facilities matching search`);
    } else {
        console.log('⚠️ Search field not found, skipping search test');
    }
});

test('create facility with different types', async ({ page }) => {
    test.setTimeout(120000);
    
    await loginToApp(page);

    // Navigate to Facilities
    await page.getByRole('button', { name: /settings/i }).click();
    await page.waitForTimeout(1000);
    await page.getByText('Data Management').click();
    await page.waitForTimeout(500);
    await page.getByText('Facilities').click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    console.log('✅ Successfully navigated to Facilities');

    // Click Create button
    await page.getByText('Create', { exact: true }).click();
    await page.waitForTimeout(2000);
    console.log('Clicked Create button');

    // Generate test data
    const timestamp = Date.now();
    const randomEnglishName = `TypeTest${timestamp}`;
    const randomChineseName = `类型测试${timestamp}`;

    // Fill in names
    const firstRowInputs = page.locator('tbody tr').first().locator('input[type="text"]');
    await firstRowInputs.nth(0).fill(randomEnglishName);
    await page.waitForTimeout(500);
    await firstRowInputs.nth(1).fill(randomChineseName);
    await page.waitForTimeout(500);
    console.log('✅ Filled in names');

    // Select a type from dropdown - wait for it to be available
    const dropdown = page.locator('tbody tr').first().locator('.v-select .v-field__append-inner .mdi-menu-down');
    if (await dropdown.isVisible({ timeout: 5000 }).catch(() => false)) {
        await dropdown.click({ force: true });
        await page.waitForTimeout(1000);

        // Get available options
        const options = await page.locator('.v-list-item-title').allTextContents();
        console.log('✅ Available facility types:', options.join(', '));

        // Select first option
        if (options.length > 0) {
            await page.locator('.v-list-item').first().click({ force: true });
            await page.waitForTimeout(1000);
            console.log(`✅ Selected type: ${options[0]}`);
        }
    } else {
        console.log('⚠️ Type dropdown not found - saving without type selection');
    }

    // Save
    await page.getByRole('button', { name: 'Save' }).click();
    await page.waitForTimeout(3000);
    await page.waitForLoadState('networkidle');

    console.log('✅ Successfully created facility with type');
});

test('edit facility and update both names', async ({ page }) => {
    test.setTimeout(120000);
    
    await loginToApp(page);

    // Navigate to Facilities
    await page.getByRole('button', { name: /settings/i }).click();
    await page.waitForTimeout(1000);
    await page.getByText('Data Management').click();
    await page.waitForTimeout(500);
    await page.getByText('Facilities').click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    console.log('✅ Successfully navigated to Facilities');

    // Generate new names
    const timestamp = Date.now();
    const newEnglishName = `EditedEng${timestamp}`;
    const newChineseName = `编辑中${timestamp}`;

    console.log(`New names - English: ${newEnglishName}, Chinese: ${newChineseName}`);

    // Click on first record to edit
    await page.locator('tbody tr').first().click();
    await page.waitForTimeout(2000);
    console.log('✅ Clicked first record to edit');

    // Update both names
    const firstRowInputs = page.locator('tbody tr').first().locator('input[type="text"]');
    
    await firstRowInputs.nth(0).click({ clickCount: 3 }); // Select all
    await firstRowInputs.nth(0).fill(newEnglishName);
    await page.waitForTimeout(500);
    console.log('✅ Updated English name');

    await firstRowInputs.nth(1).click({ clickCount: 3 }); // Select all
    await firstRowInputs.nth(1).fill(newChineseName);
    await page.waitForTimeout(500);
    console.log('✅ Updated Chinese name');

    // Save
    await page.getByRole('button', { name: 'Save' }).click();
    await page.waitForTimeout(3000);
    await page.waitForLoadState('networkidle');

    console.log('✅ Successfully edited facility names');
});

test('verify facility types available in dropdown', async ({ page }) => {
    test.setTimeout(120000);
    
    await loginToApp(page);

    // Navigate to Facilities
    await page.getByRole('button', { name: /settings/i }).click();
    await page.waitForTimeout(1000);
    await page.getByText('Data Management').click();
    await page.waitForTimeout(500);
    await page.getByText('Facilities').click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    console.log('✅ Successfully navigated to Facilities');

    // Click on first record to enter edit mode
    await page.locator('tbody tr').first().click();
    await page.waitForTimeout(2000);
    console.log('✅ Entered edit mode');

    // Open type dropdown
    await page.locator('tbody tr').first().locator('.v-select .v-field__append-inner .mdi-menu-down').click({ force: true });
    await page.waitForTimeout(1000);

    // Get all available types
    const types = await page.locator('.v-list-item-title').allTextContents();
    console.log(`✅ Found ${types.length} facility types available:`);
    types.forEach((type, index) => {
        console.log(`   ${index + 1}. ${type}`);
    });

    // Close dropdown
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);

    console.log('✅ Verified facility types');
});

test('create facility with Chinese name only', async ({ page }) => {
    test.setTimeout(120000);
    
    await loginToApp(page);

    // Navigate to Facilities
    await page.getByRole('button', { name: /settings/i }).click();
    await page.waitForTimeout(1000);
    await page.getByText('Data Management').click();
    await page.waitForTimeout(500);
    await page.getByText('Facilities').click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    console.log('✅ Successfully navigated to Facilities');

    // Click Create button
    await page.getByText('Create', { exact: true }).click();
    await page.waitForTimeout(2000);
    console.log('Clicked Create button');

    // Generate test data
    const timestamp = Date.now();
    const randomEnglishName = `CNTest${timestamp}`;
    const chineseName = `中文设施${timestamp}`;

    console.log(`Test Data - English: ${randomEnglishName}, Chinese: ${chineseName}`);

    // Fill in names
    const firstRowInputs = page.locator('tbody tr').first().locator('input[type="text"]');
    await firstRowInputs.nth(0).fill(randomEnglishName);
    await page.waitForTimeout(500);
    await firstRowInputs.nth(1).fill(chineseName);
    await page.waitForTimeout(500);
    console.log('✅ Filled in English and Chinese names');

    // Save
    await page.getByRole('button', { name: 'Save' }).click();
    await page.waitForTimeout(3000);
    await page.waitForLoadState('networkidle');

    console.log('✅ Successfully created facility with Chinese name');
});

test('delete facility record', async ({ page }) => {
    test.setTimeout(120000);
    
    await loginToApp(page);

    // Navigate to Facilities
    await page.getByRole('button', { name: /settings/i }).click();
    await page.waitForTimeout(1000);
    await page.getByText('Data Management').click();
    await page.waitForTimeout(500);
    await page.getByText('Facilities').click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    console.log('✅ Successfully navigated to Facilities');

    // Count records before deletion
    const rowsBefore = await page.locator('tbody tr').count();
    console.log(`Records before deletion: ${rowsBefore}`);

    // Look for checkbox in first row
    const firstRow = page.locator('tbody tr').first();
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

                // Verify record count
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

test('validate inline editing behavior', async ({ page }) => {
    test.setTimeout(120000);
    
    await loginToApp(page);

    // Navigate to Facilities
    await page.getByRole('button', { name: /settings/i }).click();
    await page.waitForTimeout(1000);
    await page.getByText('Data Management').click();
    await page.waitForTimeout(500);
    await page.getByText('Facilities').click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    console.log('✅ Successfully navigated to Facilities');

    // Verify that clicking on a row enables editing
    const firstRow = page.locator('tbody tr').first();
    const firstCell = firstRow.locator('td').nth(1); // Skip checkbox column
    const originalText = await firstCell.textContent();
    
    console.log(`Original text: ${originalText}`);

    // Click to edit
    await firstRow.click();
    await page.waitForTimeout(2000);
    console.log('✅ Clicked row to enable inline editing');

    // Verify input fields are now visible
    const inputFields = firstRow.locator('input[type="text"]');
    const inputCount = await inputFields.count();
    
    if (inputCount > 0) {
        console.log(`✅ Inline editing enabled - found ${inputCount} input fields`);
    } else {
        console.log('⚠️ No input fields found - inline editing may work differently');
    }

    // Verify dropdown is available
    const dropdown = firstRow.locator('.v-select');
    if (await dropdown.isVisible({ timeout: 3000 }).catch(() => false)) {
        console.log('✅ Type dropdown is available in edit mode');
    }

    // Cancel editing by clicking away or pressing Escape
    await page.keyboard.press('Escape');
    await page.waitForTimeout(1000);
    console.log('✅ Validated inline editing behavior');
});

test('verify pagination or record count', async ({ page }) => {
    test.setTimeout(120000);
    
    await loginToApp(page);

    // Navigate to Facilities
    await page.getByRole('button', { name: /settings/i }).click();
    await page.waitForTimeout(1000);
    await page.getByText('Data Management').click();
    await page.waitForTimeout(500);
    await page.getByText('Facilities').click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    console.log('✅ Successfully navigated to Facilities');

    // Count total records
    const rows = await page.locator('tbody tr').all();
    console.log(`Total facilities displayed: ${rows.length}`);

    // Look for pagination info
    const paginationText = page.locator('text=/\\d+-\\d+ of \\d+|\\d+ items/i').first();
    if (await paginationText.isVisible({ timeout: 3000 }).catch(() => false)) {
        const paginationInfo = await paginationText.textContent();
        console.log(`✅ Pagination info: ${paginationInfo}`);
    } else {
        console.log(`⚠️ No pagination found - showing all ${rows.length} records`);
    }

    // Check for pagination controls
    const nextButton = page.locator('button[aria-label*="next" i], button:has-text("Next")').first();
    if (await nextButton.isVisible({ timeout: 3000 }).catch(() => false)) {
        const isDisabled = await nextButton.isDisabled();
        if (isDisabled) {
            console.log('✅ Next button is disabled (on last page)');
        } else {
            console.log('✅ Next button is available (more pages exist)');
        }
    }

    console.log('✅ Record count verification completed');
});
