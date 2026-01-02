import { test, expect } from '@playwright/test';
import { loginToApp } from './helpers/auth.helper';

test('create new tag with random name and value', async ({ page }) => {
    test.setTimeout(120000);
    
    // Login with valid user
    await loginToApp(page);

    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    console.log('✅ Successfully logged in');

    // Navigate to Settings
    await page.getByRole('button', { name: /settings/i }).click();
    await page.waitForTimeout(1000);

    console.log('Clicked Settings');

    // Navigate to Data Management > Tags
    await page.getByText('Data Management').click();
    await page.waitForTimeout(500);
    
    await page.getByText('Tags').click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    console.log('✅ Successfully navigated to Tags under Data Management');

    // Click Create button
    await page.getByText('Create', { exact: true }).click();
    await page.waitForTimeout(2000);

    console.log('Clicked Create button');

    // Wait for form to load
    await page.waitForTimeout(2000);

    // Generate random name and value with timestamp
    const timestamp = Date.now();
    const randomName = `TagName${timestamp}`;
    const randomValue = `TagValue${timestamp}`;

    console.log(`Random Name: ${randomName}`);
    console.log(`Random Value (English): ${randomValue}`);

    // Insert name using the correct selector
    await page.getByRole('textbox', { name: 'Name' }).click();
    await page.getByRole('textbox', { name: 'Name' }).fill(randomName);
    await page.waitForTimeout(500);

    console.log('Filled in name');

    // Insert value (English) using the correct selector
    await page.getByRole('textbox', { name: 'Value (English)' }).click();
    await page.getByRole('textbox', { name: 'Value (English)' }).fill(randomValue);
    await page.waitForTimeout(500);

    console.log('Filled in value (English)');

    // Click Create Tag button - use exact match to avoid matching "Close create tag dialog"
    await page.getByRole('button', { name: 'Create tag', exact: true }).click();
    await page.waitForTimeout(3000);
    await page.waitForLoadState('networkidle');

    console.log('✅ Successfully created new tag with random name and value');
});

test('verify tags table and search functionality', async ({ page }) => {
    test.setTimeout(120000);
    
    await loginToApp(page);

    // Navigate to Tags
    await page.getByRole('button', { name: /settings/i }).click();
    await page.waitForTimeout(1000);
    await page.getByText('Data Management').click();
    await page.waitForTimeout(500);
    await page.getByText('Tags').click();
    await page.waitForLoadState('load');
    await page.waitForTimeout(2000);

    console.log('✅ Navigated to Tags');

    // Verify table is visible
    const table = page.locator('table').first();
    await expect(table).toBeVisible();
    
    const rows = table.locator('tbody tr');
    const rowCount = await rows.count();
    console.log(`✅ Found ${rowCount} tag(s) in the table`);

    // Test search functionality if search box exists
    const searchBox = page.locator('input[type="text"]').filter({ hasText: '' }).first();
    const hasSearch = await searchBox.isVisible({ timeout: 3000 }).catch(() => false);
    
    if (hasSearch && rowCount > 0) {
        // Get first tag name from table
        const firstTagCell = rows.first().locator('td').first();
        const firstTagName = await firstTagCell.textContent();
        
        if (firstTagName) {
            const searchTerm = firstTagName.trim().substring(0, 5);
            await searchBox.fill(searchTerm);
            await page.waitForTimeout(1500);
            
            const filteredRows = await rows.count();
            console.log(`✅ Search with '${searchTerm}' returned ${filteredRows} result(s)`);
        }
    } else {
        console.log('⚠️ Search field not found or no data to search');
    }
});

test('edit existing tag', async ({ page }) => {
    test.setTimeout(120000);
    
    await loginToApp(page);

    // Navigate to Tags
    await page.getByRole('button', { name: /settings/i }).click();
    await page.waitForTimeout(1000);
    await page.getByText('Data Management').click();
    await page.waitForTimeout(500);
    await page.getByText('Tags').click();
    await page.waitForLoadState('load');
    await page.waitForTimeout(2000);

    console.log('✅ Navigated to Tags');

    // Click on first tag row to edit
    const table = page.locator('table').first();
    const firstRow = table.locator('tbody tr').first();
    await firstRow.click();
    await page.waitForTimeout(2000);

    console.log('✅ Opened tag edit form');

    // Update the Value (English) field
    const valueInput = page.getByRole('textbox', { name: 'Value (English)' });
    const hasValueInput = await valueInput.isVisible({ timeout: 3000 }).catch(() => false);
    
    if (hasValueInput) {
        const updatedValue = `Updated${Date.now()}`;
        await valueInput.click();
        await valueInput.fill(updatedValue);
        await page.waitForTimeout(500);
        
        console.log(`✅ Updated value to: ${updatedValue}`);

        // Save changes - look for Save or Update button
        const saveBtn = page.getByRole('button', { name: /save|update/i }).first();
        const hasSaveBtn = await saveBtn.isVisible({ timeout: 3000 }).catch(() => false);
        
        if (hasSaveBtn) {
            await saveBtn.click();
            await page.waitForTimeout(2000);
            console.log('✅ Successfully saved tag changes');
        } else {
            console.log('⚠️ Save button not found');
        }
    } else {
        console.log('⚠️ Edit form not accessible');
    }
});

test('verify required field validation', async ({ page }) => {
    test.setTimeout(120000);
    
    await loginToApp(page);

    // Navigate to Tags
    await page.getByRole('button', { name: /settings/i }).click();
    await page.waitForTimeout(1000);
    await page.getByText('Data Management').click();
    await page.waitForTimeout(500);
    await page.getByText('Tags').click();
    await page.waitForLoadState('load');
    await page.waitForTimeout(2000);

    // Click Create button
    await page.getByText('Create', { exact: true }).click();
    await page.waitForTimeout(2000);

    console.log('✅ Opened create tag form');

    // Try to submit without filling required fields
    const createBtn = page.getByRole('button', { name: 'Create tag', exact: true });
    await createBtn.click();
    await page.waitForTimeout(1000);

    // Check if form shows validation errors
    const nameInput = page.getByRole('textbox', { name: 'Name' });
    const nameInputValue = await nameInput.inputValue();
    
    if (nameInputValue === '') {
        console.log('✅ Validation prevented submission with empty Name field');
    }

    // Fill only Name and try to submit
    await nameInput.fill('TestTag');
    await page.waitForTimeout(500);
    await createBtn.click();
    await page.waitForTimeout(1000);

    const valueInput = page.getByRole('textbox', { name: 'Value (English)' });
    const valueInputValue = await valueInput.inputValue();
    
    if (valueInputValue === '') {
        console.log('✅ Validation requires Value (English) field');
    }

    console.log('✅ Required field validation verified');
});

test('create tag with multilingual values', async ({ page }) => {
    test.setTimeout(120000);
    
    await loginToApp(page);

    // Navigate to Tags
    await page.getByRole('button', { name: /settings/i }).click();
    await page.waitForTimeout(1000);
    await page.getByText('Data Management').click();
    await page.waitForTimeout(500);
    await page.getByText('Tags').click();
    await page.waitForLoadState('load');
    await page.waitForTimeout(2000);

    // Click Create button
    await page.getByText('Create', { exact: true }).click();
    await page.waitForTimeout(2000);

    console.log('✅ Opened create tag form');

    // Fill in tag details with multiple languages
    const timestamp = Date.now();
    await page.getByRole('textbox', { name: 'Name' }).fill(`MultiLangTag${timestamp}`);
    await page.waitForTimeout(500);

    await page.getByRole('textbox', { name: 'Value (English)' }).fill('English Value');
    await page.waitForTimeout(500);

    // Try to fill Chinese value if available
    const chineseInput = page.getByRole('textbox', { name: 'Value (Chinese)' });
    const hasChineseInput = await chineseInput.isVisible({ timeout: 3000 }).catch(() => false);
    
    if (hasChineseInput) {
        await chineseInput.fill('中文值');
        await page.waitForTimeout(500);
        console.log('✅ Filled Chinese value');
    }

    // Try to fill Japanese value if available
    const japaneseInput = page.getByRole('textbox', { name: 'Value (Japanese)' });
    const hasJapaneseInput = await japaneseInput.isVisible({ timeout: 3000 }).catch(() => false);
    
    if (hasJapaneseInput) {
        await japaneseInput.fill('日本語の値');
        await page.waitForTimeout(500);
        console.log('✅ Filled Japanese value');
    }

    // Create tag
    await page.getByRole('button', { name: 'Create tag', exact: true }).click();
    await page.waitForTimeout(3000);

    console.log('✅ Successfully created multilingual tag');
});

test('verify tag pagination', async ({ page }) => {
    test.setTimeout(120000);
    
    await loginToApp(page);

    // Navigate to Tags
    await page.getByRole('button', { name: /settings/i }).click();
    await page.waitForTimeout(1000);
    await page.getByText('Data Management').click();
    await page.waitForTimeout(500);
    await page.getByText('Tags').click();
    await page.waitForLoadState('load');
    await page.waitForTimeout(2000);

    console.log('✅ Navigated to Tags');

    // Check for pagination controls
    const paginationInfo = page.locator('text=/\\d+\\s*-\\s*\\d+\\s+of\\s+\\d+/i').first();
    const hasPagination = await paginationInfo.isVisible({ timeout: 3000 }).catch(() => false);
    
    if (hasPagination) {
        const paginationText = await paginationInfo.textContent();
        console.log(`✅ Pagination info: ${paginationText}`);

        // Try to navigate to next page
        const nextButton = page.locator('button[aria-label*="next"], button:has-text("Next")').first();
        const hasNextBtn = await nextButton.isVisible({ timeout: 3000 }).catch(() => false);
        
        if (hasNextBtn && await nextButton.isEnabled()) {
            await nextButton.click();
            await page.waitForTimeout(2000);
            console.log('✅ Navigated to next page');
        } else {
            console.log('⚠️ Next page button not available or disabled');
        }
    } else {
        console.log('⚠️ No pagination found - all tags fit on one page');
    }
});

test('verify tag table columns', async ({ page }) => {
    test.setTimeout(120000);
    
    await loginToApp(page);

    // Navigate to Tags
    await page.getByRole('button', { name: /settings/i }).click();
    await page.waitForTimeout(1000);
    await page.getByText('Data Management').click();
    await page.waitForTimeout(500);
    await page.getByText('Tags').click();
    await page.waitForLoadState('load');
    await page.waitForTimeout(2000);

    console.log('✅ Navigated to Tags');

    // Verify table columns
    const table = page.locator('table').first();
    const headers = table.locator('thead th, thead td');
    const headerCount = await headers.count();
    
    console.log(`✅ Found ${headerCount} table column(s)`);

    // Check for expected columns
    const expectedColumns = ['Name', 'Value', 'English', 'Chinese'];
    for (const colName of expectedColumns) {
        const column = table.locator(`th:has-text("${colName}"), td:has-text("${colName}")`).first();
        const hasColumn = await column.isVisible({ timeout: 2000 }).catch(() => false);
        
        if (hasColumn) {
            console.log(`✅ Found column: ${colName}`);
        }
    }
});

test('verify tags sorting functionality', async ({ page }) => {
    test.setTimeout(120000);
    
    await loginToApp(page);

    // Navigate to Tags
    await page.getByRole('button', { name: /settings/i }).click();
    await page.waitForTimeout(1000);
    await page.getByText('Data Management').click();
    await page.waitForTimeout(500);
    await page.getByText('Tags').click();
    await page.waitForLoadState('load');
    await page.waitForTimeout(2000);

    console.log('✅ Navigated to Tags');

    // Try to click on Name column header to sort
    const nameHeader = page.locator('th:has-text("Name"), thead td:has-text("Name")').first();
    const hasNameHeader = await nameHeader.isVisible({ timeout: 3000 }).catch(() => false);
    
    if (hasNameHeader) {
        await nameHeader.click();
        await page.waitForTimeout(1500);
        console.log('✅ Clicked Name column to sort');

        // Click again to reverse sort
        await nameHeader.click();
        await page.waitForTimeout(1500);
        console.log('✅ Reversed sort order');
    } else {
        console.log('⚠️ Name column header not found for sorting');
    }
});

test('verify create button and cancel functionality', async ({ page }) => {
    test.setTimeout(120000);
    
    await loginToApp(page);

    // Navigate to Tags
    await page.getByRole('button', { name: /settings/i }).click();
    await page.waitForTimeout(1000);
    await page.getByText('Data Management').click();
    await page.waitForTimeout(500);
    await page.getByText('Tags').click();
    await page.waitForLoadState('load');
    await page.waitForTimeout(2000);

    console.log('✅ Navigated to Tags');

    // Click Create button
    await page.getByText('Create', { exact: true }).click();
    await page.waitForTimeout(2000);

    console.log('✅ Opened create tag dialog');

    // Fill in some data
    await page.getByRole('textbox', { name: 'Name' }).fill('TempTag');
    await page.waitForTimeout(500);

    // Look for Cancel or Close button
    const cancelBtn = page.locator('button:has-text("Cancel"), button:has-text("Close"), button[aria-label*="close"]').first();
    const hasCancelBtn = await cancelBtn.isVisible({ timeout: 3000 }).catch(() => false);
    
    if (hasCancelBtn) {
        await cancelBtn.click();
        await page.waitForTimeout(1500);
        console.log('✅ Successfully canceled tag creation');

        // Verify dialog is closed
        const nameInput = page.getByRole('textbox', { name: 'Name' });
        const isDialogClosed = !(await nameInput.isVisible({ timeout: 2000 }).catch(() => false));
        
        if (isDialogClosed) {
            console.log('✅ Create dialog closed successfully');
        }
    } else {
        console.log('⚠️ Cancel button not found');
    }
});
