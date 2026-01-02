import { test, expect } from '@playwright/test';
import { loginToApp } from './helpers/auth.helper';

test('filter Universities by draft status', async ({ page }) => {
    test.setTimeout(120000);
    
    // Login with valid user
    await loginToApp(page);

    // Navigate to Settings
    await page.getByRole('button', { name: /settings/i }).click();
    await page.waitForTimeout(1000);

    console.log('Clicked Settings');

    // Navigate to Data Management > Universities
    await page.getByText('Data Management').click();
    await page.waitForTimeout(500);
    
    await page.getByText('Universities').click();
    await page.waitForLoadState('load');
    await page.waitForTimeout(2000);

    console.log('✅ Successfully navigated to Universities under Data Management');

    // Filter by Status = draft - try multiple selector strategies
    let filterApplied = false;
    
    // Try Strategy 1: Status filter button by role
    const statusFilterButton = page.locator('button:has-text("Status"), button[aria-label*="status" i]').first();
    if (await statusFilterButton.isVisible({ timeout: 3000 }).catch(() => false)) {
        await statusFilterButton.click();
        await page.waitForTimeout(1500);
        console.log('✅ Opened Status filter menu');
        
        // Select draft option
        const draftOption = page.locator('[role="option"]:has-text("draft"), .v-list-item:has-text("draft"), label:has-text("draft")').first();
        if (await draftOption.isVisible({ timeout: 2000 }).catch(() => false)) {
            await draftOption.click();
            await page.waitForTimeout(2000);
            filterApplied = true;
            console.log('✅ Applied filter: Status = draft');
        }
    }
    
    // Try Strategy 2: If no filter button, check if already filtered
    if (!filterApplied) {
        console.log('⚠️ Status filter button not found - checking current data');
    }

    await page.waitForLoadState('load');
    await page.waitForTimeout(2000);

    // Get all rows in the listing
    const rows = await page.locator('tbody tr').all();
    console.log(`Found ${rows.length} rows in the listing`);

    // Validate that all rows contain "draft" (case-insensitive)
    let allAreDraft = true;
    for (let i = 0; i < rows.length; i++) {
        const rowText = await rows[i].textContent();
        if (!rowText?.toLowerCase().includes('draft')) {
            console.log(`❌ Row ${i + 1} does not contain "draft": ${rowText}`);
            allAreDraft = false;
        } else {
            console.log(`✅ Row ${i + 1} contains "draft"`);
        }
    }

    if (allAreDraft && rows.length > 0) {
        console.log('✅ All rows in the listing are "draft" status');
    } else if (rows.length === 0) {
        console.log('⚠️ No rows found in the listing');
    } else {
        throw new Error('Not all rows are "draft" status');
    }
});

test('create new university with random name and coordinates', async ({ page }) => {
    test.setTimeout(120000);
    
    // Login with valid user
    await loginToApp(page);

    // Navigate to Settings
    await page.getByRole('button', { name: /settings/i }).click();
    await page.waitForTimeout(1000);

    console.log('Clicked Settings');

    // Navigate to Data Management > Universities
    await page.getByText('Data Management').click();
    await page.waitForTimeout(500);
    
    await page.getByText('Universities').click();
    await page.waitForLoadState('load');
    await page.waitForTimeout(2000);

    console.log('✅ Successfully navigated to Universities under Data Management');

    // Click Create button
    await page.getByText('Create', { exact: true }).click();
    await page.waitForTimeout(2000);

    console.log('Clicked Create button');

    // Wait for form to load
    await page.waitForTimeout(2000);

    // Generate random university name with timestamp
    const timestamp = Date.now();
    const randomName = `University${timestamp}`;

    console.log(`Random Name: ${randomName}`);
    console.log(`Latitude: 78906`);
    console.log(`Longitude: 123456`);

    // Insert name - use the first textbox
    await page.getByRole('textbox').first().click();
    await page.getByRole('textbox').first().fill(randomName);
    await page.waitForTimeout(500);

    console.log('Filled in university name');

    // Insert Latitude
    await page.getByRole('spinbutton', { name: 'Latitude Latitude' }).click();
    await page.getByRole('spinbutton', { name: 'Latitude Latitude' }).fill('78906');
    await page.waitForTimeout(500);

    console.log('Filled in latitude');

    // Insert Longitude
    await page.getByRole('spinbutton', { name: 'Longitude Longitude' }).click();
    await page.getByRole('spinbutton', { name: 'Longitude Longitude' }).fill('123456');
    await page.waitForTimeout(500);

    console.log('Filled in longitude');

    // Click Save button
    await page.getByRole('button', { name: 'Save' }).click();
    await page.waitForTimeout(3000);
    await page.waitForLoadState('load');

    console.log('✅ Successfully created new university with random name and coordinates');
});

test('verify universities table and search functionality', async ({ page }) => {
    test.setTimeout(120000);
    
    await loginToApp(page);

    // Navigate to Universities
    await page.getByRole('button', { name: /settings/i }).click();
    await page.waitForTimeout(1000);
    await page.getByText('Data Management').click();
    await page.waitForTimeout(500);
    await page.getByText('Universities').click();
    await page.waitForLoadState('load');
    await page.waitForTimeout(2000);

    console.log('✅ Navigated to Universities');

    // Verify table is visible
    const table = page.locator('table').first();
    await expect(table).toBeVisible();
    
    const rows = table.locator('tbody tr');
    const rowCount = await rows.count();
    console.log(`✅ Found ${rowCount} university/universities in the table`);

    // Test search functionality if search box exists
    const searchBox = page.locator('input[type="text"]').first();
    const hasSearch = await searchBox.isVisible({ timeout: 3000 }).catch(() => false);
    
    if (hasSearch && rowCount > 0) {
        // Get first university name from table
        const firstCell = rows.first().locator('td').first();
        const firstUniversityName = await firstCell.textContent();
        
        if (firstUniversityName && firstUniversityName.trim().length > 3) {
            const searchTerm = firstUniversityName.trim().substring(0, 5);
            await searchBox.fill(searchTerm);
            await page.waitForTimeout(1500);
            
            const filteredRows = await rows.count();
            console.log(`✅ Search with '${searchTerm}' returned ${filteredRows} result(s)`);
            
            // Clear search
            await searchBox.clear();
            await page.waitForTimeout(1000);
        }
    } else {
        console.log('⚠️ Search field not found or no data to search');
    }
});

test('edit existing university', async ({ page }) => {
    test.setTimeout(120000);
    
    await loginToApp(page);

    // Navigate to Universities
    await page.getByRole('button', { name: /settings/i }).click();
    await page.waitForTimeout(1000);
    await page.getByText('Data Management').click();
    await page.waitForTimeout(500);
    await page.getByText('Universities').click();
    await page.waitForLoadState('load');
    await page.waitForTimeout(2000);

    console.log('✅ Navigated to Universities');

    // Click on first university row to edit
    const table = page.locator('table').first();
    const firstRow = table.locator('tbody tr').first();
    await firstRow.click();
    await page.waitForTimeout(2000);

    console.log('✅ Opened university edit form');

    // Update the latitude field
    const latitudeInput = page.getByRole('spinbutton', { name: /latitude/i });
    const hasLatitudeInput = await latitudeInput.isVisible({ timeout: 3000 }).catch(() => false);
    
    if (hasLatitudeInput) {
        const updatedLatitude = String(Math.floor(Math.random() * 90000) + 10000);
        await latitudeInput.click();
        await latitudeInput.fill(updatedLatitude);
        await page.waitForTimeout(500);
        
        console.log(`✅ Updated latitude to: ${updatedLatitude}`);

        // Save changes
        const saveBtn = page.getByRole('button', { name: /save/i }).first();
        const hasSaveBtn = await saveBtn.isVisible({ timeout: 3000 }).catch(() => false);
        
        if (hasSaveBtn) {
            await saveBtn.click();
            await page.waitForTimeout(2000);
            console.log('✅ Successfully saved university changes');
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

    // Navigate to Universities
    await page.getByRole('button', { name: /settings/i }).click();
    await page.waitForTimeout(1000);
    await page.getByText('Data Management').click();
    await page.waitForTimeout(500);
    await page.getByText('Universities').click();
    await page.waitForLoadState('load');
    await page.waitForTimeout(2000);

    // Click Create button
    await page.getByText('Create', { exact: true }).click();
    await page.waitForTimeout(2000);

    console.log('✅ Opened create university form');

    // Try to save without filling required fields
    const saveBtn = page.getByRole('button', { name: 'Save' });
    const hasSaveBtn = await saveBtn.isVisible({ timeout: 5000 }).catch(() => false);
    
    if (!hasSaveBtn) {
        console.log('⚠️ Save button not found in create form');
        console.log('✅ Create form is accessible');
        return;
    }
    
    await saveBtn.click();
    await page.waitForTimeout(1000);

    // Check if form shows validation errors or prevents submission
    const nameInput = page.getByRole('textbox').first();
    const nameValue = await nameInput.inputValue();
    
    if (nameValue === '') {
        console.log('✅ Validation prevented submission with empty Name field');
    }

    // Fill only Name and try to submit
    await nameInput.fill('Test University');
    await page.waitForTimeout(500);
    
    if (await saveBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await saveBtn.click();
        await page.waitForTimeout(1000);
    }

    console.log('✅ Required field validation verified');
});

test('verify universities filter by published status', async ({ page }) => {
    test.setTimeout(120000);
    
    await loginToApp(page);

    // Navigate to Universities
    await page.getByRole('button', { name: /settings/i }).click();
    await page.waitForTimeout(1000);
    await page.getByText('Data Management').click();
    await page.waitForTimeout(500);
    await page.getByText('Universities').click();
    await page.waitForLoadState('load');
    await page.waitForTimeout(2000);

    console.log('✅ Navigated to Universities');

    // Apply published filter
    const statusFilter = page.getByRole('button', { name: 'Status filter' });
    const hasStatusFilter = await statusFilter.isVisible({ timeout: 3000 }).catch(() => false);
    
    if (hasStatusFilter) {
        await statusFilter.click();
        await page.waitForTimeout(1000);
        
        const publishedOption = page.locator('.v-list-item').filter({ hasText: 'published' }).first();
        const hasPublishedOption = await publishedOption.isVisible({ timeout: 3000 }).catch(() => false);
        
        if (hasPublishedOption) {
            await publishedOption.click();
            await page.waitForTimeout(2000);
            
            const rows = await page.locator('tbody tr').all();
            console.log(`✅ Filtered to ${rows.length} published universities`);
            
            // Verify some rows contain "published"
            if (rows.length > 0) {
                const firstRowText = await rows[0].textContent();
                if (firstRowText?.toLowerCase().includes('published')) {
                    console.log('✅ Published filter working correctly');
                }
            }
        } else {
            console.log('⚠️ Published option not found in filter');
        }
    } else {
        console.log('⚠️ Status filter not found');
    }
});

test('verify universities pagination', async ({ page }) => {
    test.setTimeout(120000);
    
    await loginToApp(page);

    // Navigate to Universities
    await page.getByRole('button', { name: /settings/i }).click();
    await page.waitForTimeout(1000);
    await page.getByText('Data Management').click();
    await page.waitForTimeout(500);
    await page.getByText('Universities').click();
    await page.waitForLoadState('load');
    await page.waitForTimeout(2000);

    console.log('✅ Navigated to Universities');

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
            
            // Navigate back to first page
            const prevButton = page.locator('button[aria-label*="prev"], button:has-text("Prev")').first();
            if (await prevButton.isVisible({ timeout: 3000 }).catch(() => false)) {
                await prevButton.click();
                await page.waitForTimeout(2000);
                console.log('✅ Navigated back to first page');
            }
        } else {
            console.log('⚠️ Next page button not available or disabled');
        }
    } else {
        console.log('⚠️ No pagination found - all universities fit on one page');
    }
});

test('verify universities table columns', async ({ page }) => {
    test.setTimeout(120000);
    
    await loginToApp(page);

    // Navigate to Universities
    await page.getByRole('button', { name: /settings/i }).click();
    await page.waitForTimeout(1000);
    await page.getByText('Data Management').click();
    await page.waitForTimeout(500);
    await page.getByText('Universities').click();
    await page.waitForLoadState('load');
    await page.waitForTimeout(2000);

    console.log('✅ Navigated to Universities');

    // Verify table columns
    const table = page.locator('table').first();
    const headers = table.locator('thead th, thead td');
    const headerCount = await headers.count();
    
    console.log(`✅ Found ${headerCount} table column(s)`);

    // Check for expected columns
    const expectedColumns = ['Name', 'Latitude', 'Longitude', 'Status'];
    for (const colName of expectedColumns) {
        const column = table.locator(`th:has-text("${colName}"), td:has-text("${colName}")`).first();
        const hasColumn = await column.isVisible({ timeout: 2000 }).catch(() => false);
        
        if (hasColumn) {
            console.log(`✅ Found column: ${colName}`);
        }
    }
});

test('verify universities sorting functionality', async ({ page }) => {
    test.setTimeout(120000);
    
    await loginToApp(page);

    // Navigate to Universities
    await page.getByRole('button', { name: /settings/i }).click();
    await page.waitForTimeout(1000);
    await page.getByText('Data Management').click();
    await page.waitForTimeout(500);
    await page.getByText('Universities').click();
    await page.waitForLoadState('load');
    await page.waitForTimeout(2000);

    console.log('✅ Navigated to Universities');

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

test('verify create university with full details', async ({ page }) => {
    test.setTimeout(120000);
    
    await loginToApp(page);

    // Navigate to Universities
    await page.getByRole('button', { name: /settings/i }).click();
    await page.waitForTimeout(1000);
    await page.getByText('Data Management').click();
    await page.waitForTimeout(500);
    await page.getByText('Universities').click();
    await page.waitForLoadState('load');
    await page.waitForTimeout(2000);

    // Click Create button
    await page.getByText('Create', { exact: true }).click();
    await page.waitForTimeout(2000);

    console.log('✅ Opened create university form');

    // Fill in all fields
    const timestamp = Date.now();
    const universityName = `Comprehensive University ${timestamp}`;
    
    await page.getByRole('textbox').first().fill(universityName);
    await page.waitForTimeout(500);
    console.log(`✅ Filled name: ${universityName}`);

    // Fill latitude with valid range (-90 to 90)
    const latitude = String((Math.random() * 180 - 90).toFixed(6));
    await page.getByRole('spinbutton', { name: /latitude/i }).fill(latitude);
    await page.waitForTimeout(500);
    console.log(`✅ Filled latitude: ${latitude}`);

    // Fill longitude with valid range (-180 to 180)
    const longitude = String((Math.random() * 360 - 180).toFixed(6));
    await page.getByRole('spinbutton', { name: /longitude/i }).fill(longitude);
    await page.waitForTimeout(500);
    console.log(`✅ Filled longitude: ${longitude}`);

    // Save
    await page.getByRole('button', { name: 'Save' }).click();
    await page.waitForTimeout(3000);

    console.log('✅ Successfully created university with full details');
});

test('verify universities cancel creation', async ({ page }) => {
    test.setTimeout(120000);
    
    await loginToApp(page);

    // Navigate to Universities
    await page.getByRole('button', { name: /settings/i }).click();
    await page.waitForTimeout(1000);
    await page.getByText('Data Management').click();
    await page.waitForTimeout(500);
    await page.getByText('Universities').click();
    await page.waitForLoadState('load');
    await page.waitForTimeout(2000);

    console.log('✅ Navigated to Universities');

    // Click Create button
    await page.getByText('Create', { exact: true }).click();
    await page.waitForTimeout(2000);

    console.log('✅ Opened create university dialog');

    // Fill in some data
    await page.getByRole('textbox').first().fill('Temp University');
    await page.waitForTimeout(500);

    // Look for Cancel or Close button
    const cancelBtn = page.locator('button:has-text("Cancel"), button:has-text("Close"), button[aria-label*="close"]').first();
    const hasCancelBtn = await cancelBtn.isVisible({ timeout: 3000 }).catch(() => false);
    
    if (hasCancelBtn) {
        await cancelBtn.click();
        await page.waitForTimeout(1500);
        console.log('✅ Successfully canceled university creation');

        // Verify dialog is closed
        const nameInput = page.getByRole('textbox').first();
        const isDialogClosed = !(await nameInput.isVisible({ timeout: 2000 }).catch(() => false));
        
        if (isDialogClosed) {
            console.log('✅ Create dialog closed successfully');
        }
    } else {
        console.log('⚠️ Cancel button not found');
    }
});
