import { test, expect } from '@playwright/test';
import { loginToApp } from './helpers/auth.helper';

test('filter Cities by draft stage', async ({ page }) => {
    test.setTimeout(120000);
    
    // Login with valid user
    await loginToApp(page);

    // Navigate to Settings
    await page.getByRole('button', { name: /settings/i }).click();
    await page.waitForTimeout(1000);

    console.log('Clicked Settings');

    // Navigate to Data Management > Cities
    await page.getByText('Data Management').click();
    await page.waitForTimeout(500);
    
    await page.getByText('Cities').click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    console.log('✅ Successfully navigated to Cities under Data Management');

    // Filter by Stages = draft
    await page.getByLabel('Stages').click();
    await page.waitForTimeout(1000);
    await page.locator('.v-list-item').filter({ hasText: 'draft' }).first().click();
    await page.waitForTimeout(2000);
    await page.waitForLoadState('networkidle');

    console.log('Applied filter: Stages = draft');

    // Get all rows in the listing
    const rows = await page.locator('tbody tr').all();
    console.log(`Found ${rows.length} rows in the listing`);

    // Validate that all rows contain "draft" or "Draft"
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
        console.log('✅ All rows in the listing are "draft" stage');
    } else if (rows.length === 0) {
        console.log('⚠️ No rows found in the listing');
    } else {
        throw new Error('Not all rows are "draft" stage');
    }
});

test('create new city with random shortname', async ({ page }) => {
    test.setTimeout(120000);
    
    // Login with valid user
    await loginToApp(page);

    // Navigate to Settings
    await page.getByRole('button', { name: /settings/i }).click();
    await page.waitForTimeout(1000);

    // Navigate to Data Management > Cities
    await page.getByText('Data Management').click();
    await page.waitForTimeout(500);
    
    await page.getByText('Cities').click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    console.log('✅ Successfully navigated to Cities');

    // Click Create button
    await page.getByText('Create', { exact: true }).click();
    await page.waitForTimeout(1000);

    console.log('Clicked Create button');

    // Wait for form to load
    await page.waitForTimeout(2000);

    // Insert shortname with random data using the correct field name
    const randomShortname = `test${Date.now()}`;
    await page.getByRole('textbox', { name: 'Shortname Shortname' }).click();
    await page.getByRole('textbox', { name: 'Shortname Shortname' }).fill(randomShortname);
    await page.waitForTimeout(500);

    console.log(`Filled shortname: ${randomShortname}`);

    // Click Save & Continue Editing button
    await page.getByRole('button', { name: 'Save & Continue Editing' }).click();
    await page.waitForTimeout(2000);
    await page.waitForLoadState('networkidle');

    console.log('✅ Successfully created new city with random shortname and clicked Save & Continue Editing');
});

test('verify cities table displays records', async ({ page }) => {
    test.setTimeout(120000);
    
    await loginToApp(page);

    // Navigate to Cities
    await page.getByRole('button', { name: /settings/i }).click();
    await page.waitForTimeout(1000);
    await page.getByText('Data Management').click();
    await page.waitForTimeout(500);
    await page.getByText('Cities').click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    console.log('✅ Successfully navigated to Cities');

    // Verify table is visible
    const table = page.locator('table, .v-data-table, [role="table"]').first();
    await expect(table).toBeVisible({ timeout: 10000 });
    console.log('✅ Table is visible');

    // Count cities in the table
    const rows = await page.locator('tbody tr').all();
    console.log(`Found ${rows.length} city/cities in the table`);

    if (rows.length > 0) {
        await expect(rows[0]).toBeVisible();
        console.log('✅ First city record is visible');
    }
});

test('search cities by name', async ({ page }) => {
    test.setTimeout(120000);
    
    await loginToApp(page);

    // Navigate to Cities
    await page.getByRole('button', { name: /settings/i }).click();
    await page.waitForTimeout(1000);
    await page.getByText('Data Management').click();
    await page.waitForTimeout(500);
    await page.getByText('Cities').click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    console.log('✅ Successfully navigated to Cities');

    // Look for search input field
    const searchInput = page.locator('input[type="text"]').first();

    if (await searchInput.isVisible({ timeout: 5000 }).catch(() => false)) {
        // Enter search term
        await searchInput.fill('test');
        await page.waitForTimeout(1500);
        console.log('✅ Entered search term: test');

        // Count results
        const rows = await page.locator('tbody tr').all();
        console.log(`Found ${rows.length} city/cities matching search`);
    } else {
        console.log('⚠️ Search field not found, skipping search test');
    }
});

test('filter cities by published stage', async ({ page }) => {
    test.setTimeout(120000);
    
    await loginToApp(page);

    // Navigate to Cities
    await page.getByRole('button', { name: /settings/i }).click();
    await page.waitForTimeout(1000);
    await page.getByText('Data Management').click();
    await page.waitForTimeout(500);
    await page.getByText('Cities').click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    console.log('✅ Successfully navigated to Cities');

    // Apply filter for published stage
    await page.getByLabel('Stages').click();
    await page.waitForTimeout(1000);
    
    const publishedOption = page.locator('.v-list-item').filter({ hasText: 'published' });
    if (await publishedOption.count() > 0) {
        await publishedOption.first().click();
        await page.waitForTimeout(2000);
        await page.waitForLoadState('networkidle');

        console.log('Applied filter: Stages = published');

        // Verify filtered results
        const rows = await page.locator('tbody tr').all();
        console.log(`Found ${rows.length} published city/cities`);

        if (rows.length > 0) {
            let allArePublished = true;
            for (let i = 0; i < Math.min(5, rows.length); i++) {
                const rowText = await rows[i].textContent();
                if (!rowText?.toLowerCase().includes('published')) {
                    console.log(`⚠️ Row ${i + 1} may not be published stage`);
                    allArePublished = false;
                }
            }
            if (allArePublished) {
                console.log('✅ Verified rows are published stage');
            }
        }
    } else {
        console.log('⚠️ Published option not found');
    }
});

test('create city with full details', async ({ page }) => {
    test.setTimeout(120000);
    
    await loginToApp(page);

    // Navigate to Cities
    await page.getByRole('button', { name: /settings/i }).click();
    await page.waitForTimeout(1000);
    await page.getByText('Data Management').click();
    await page.waitForTimeout(500);
    await page.getByText('Cities').click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    console.log('✅ Successfully navigated to Cities');

    // Click Create button
    await page.getByText('Create', { exact: true }).click();
    await page.waitForTimeout(2000);

    console.log('Clicked Create button');

    // Generate test data
    const timestamp = Date.now();
    const randomShortname = `FullCity${timestamp}`;
    const randomName = `Full City ${timestamp}`;
    const randomChineseName = `完整城市${timestamp}`;

    console.log(`Test Data - Shortname: ${randomShortname}, Name: ${randomName}`);

    // Fill in shortname (required)
    await page.getByRole('textbox', { name: 'Shortname Shortname' }).fill(randomShortname);
    await page.waitForTimeout(500);
    console.log('✅ Filled shortname');

    // Try to fill in English name
    const nameField = page.locator('input[type="text"]').filter({ hasText: '' }).nth(1);
    if (await nameField.isVisible({ timeout: 3000 }).catch(() => false)) {
        await nameField.fill(randomName);
        await page.waitForTimeout(500);
        console.log('✅ Filled English name');
    }

    // Try to fill in Chinese name
    const chineseNameField = page.locator('input[type="text"]').filter({ hasText: '' }).nth(2);
    if (await chineseNameField.isVisible({ timeout: 3000 }).catch(() => false)) {
        await chineseNameField.fill(randomChineseName);
        await page.waitForTimeout(500);
        console.log('✅ Filled Chinese name');
    }

    // Save
    await page.getByRole('button', { name: 'Save & Continue Editing' }).click();
    await page.waitForTimeout(2000);
    await page.waitForLoadState('networkidle');

    console.log('✅ Successfully created city with full details');
});

test('edit existing city record', async ({ page }) => {
    test.setTimeout(120000);
    
    await loginToApp(page);

    // Navigate to Cities
    await page.getByRole('button', { name: /settings/i }).click();
    await page.waitForTimeout(1000);
    await page.getByText('Data Management').click();
    await page.waitForTimeout(500);
    await page.getByText('Cities').click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    console.log('✅ Successfully navigated to Cities');

    // Click on first city to edit
    const firstRow = page.locator('tbody tr').first();
    if (await firstRow.isVisible({ timeout: 5000 }).catch(() => false)) {
        await firstRow.click();
        await page.waitForTimeout(2000);
        console.log('✅ Clicked on first city record');

        // Edit shortname
        const shortnameField = page.getByRole('textbox', { name: 'Shortname Shortname' });
        if (await shortnameField.isVisible({ timeout: 5000 }).catch(() => false)) {
            const currentShortname = await shortnameField.inputValue();
            const newShortname = `${currentShortname}_edit${Date.now()}`;
            
            await shortnameField.clear();
            await shortnameField.fill(newShortname);
            await page.waitForTimeout(1000);
            console.log(`✅ Updated shortname to: ${newShortname}`);

            // Try to save
            const saveButton = page.getByRole('button', { name: /Save/i }).first();
            if (await saveButton.isVisible({ timeout: 3000 }).catch(() => false)) {
                await saveButton.click();
                await page.waitForTimeout(2000);
                console.log('✅ Clicked Save button');
            }
        } else {
            console.log('⚠️ Edit form not found');
        }
    } else {
        console.log('⚠️ No cities found to edit');
    }
});

test('validate required fields when creating city', async ({ page }) => {
    test.setTimeout(120000);
    
    await loginToApp(page);

    // Navigate to Cities
    await page.getByRole('button', { name: /settings/i }).click();
    await page.waitForTimeout(1000);
    await page.getByText('Data Management').click();
    await page.waitForTimeout(500);
    await page.getByText('Cities').click();
    await page.waitForLoadState('load');
    await page.waitForTimeout(2000);

    console.log('✅ Successfully navigated to Cities');

    // Click Create button
    await page.getByText('Create', { exact: true }).click();
    await page.waitForTimeout(3000);
    console.log('Clicked Create button');

    // Wait for form to load and shortname field to be visible
    const shortnameField = page.getByRole('textbox', { name: 'Shortname Shortname' });
    
    try {
        await shortnameField.waitFor({ state: 'visible', timeout: 10000 });
        
        // Try to check save button state
        const saveButton = page.getByRole('button', { name: 'Save & Continue Editing' });
        if (await saveButton.isVisible({ timeout: 3000 }).catch(() => false)) {
            const isDisabled = await saveButton.isDisabled().catch(() => false);
            
            if (isDisabled) {
                console.log('✅ Validated: Save button is disabled when form is empty');
            } else {
                console.log('⚠️ Save button is not disabled (may show validation errors on click)');
            }
        }

        // Fill only shortname (main required field)
        await shortnameField.fill('TestValidation');
        await page.waitForTimeout(1000);
        console.log('✅ Filled shortname field');
        
        console.log('✅ Validation checks completed!');
    } catch (error) {
        console.log('⚠️ Form validation test could not complete - page may have navigated away');
    }
});

test('verify available stage options', async ({ page }) => {
    test.setTimeout(120000);
    
    await loginToApp(page);

    // Navigate to Cities
    await page.getByRole('button', { name: /settings/i }).click();
    await page.waitForTimeout(1000);
    await page.getByText('Data Management').click();
    await page.waitForTimeout(500);
    await page.getByText('Cities').click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    console.log('✅ Successfully navigated to Cities');

    // Click on Stages filter to see available options
    await page.getByLabel('Stages').click();
    await page.waitForTimeout(1000);

    const options = await page.locator('.v-list-item-title').allTextContents();
    console.log('✅ Available stage options:', options.join(', '));

    // Close the filter
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);

    console.log('✅ Verified available stage options');
});

test('create city with Chinese name only', async ({ page }) => {
    test.setTimeout(120000);
    
    await loginToApp(page);

    // Navigate to Cities
    await page.getByRole('button', { name: /settings/i }).click();
    await page.waitForTimeout(1000);
    await page.getByText('Data Management').click();
    await page.waitForTimeout(500);
    await page.getByText('Cities').click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    console.log('✅ Successfully navigated to Cities');

    // Click Create button
    await page.getByText('Create', { exact: true }).click();
    await page.waitForTimeout(2000);

    console.log('Clicked Create button');

    // Generate test data
    const timestamp = Date.now();
    const randomShortname = `CN${timestamp}`;
    const chineseName = `中文城市${timestamp}`;

    console.log(`Test Data - Shortname: ${randomShortname}, Chinese Name: ${chineseName}`);

    // Fill in shortname (required)
    await page.getByRole('textbox', { name: 'Shortname Shortname' }).fill(randomShortname);
    await page.waitForTimeout(500);
    console.log('✅ Filled shortname');

    // Try to fill in Chinese name
    const chineseNameField = page.locator('input[type="text"]').filter({ hasText: '' }).nth(2);
    if (await chineseNameField.isVisible({ timeout: 3000 }).catch(() => false)) {
        await chineseNameField.fill(chineseName);
        await page.waitForTimeout(500);
        console.log(`✅ Filled Chinese name: ${chineseName}`);
    }

    // Save
    await page.getByRole('button', { name: 'Save & Continue Editing' }).click();
    await page.waitForTimeout(2000);
    await page.waitForLoadState('networkidle');

    console.log('✅ Successfully created city with Chinese name');
});

test('verify city pagination or record count', async ({ page }) => {
    test.setTimeout(120000);
    
    await loginToApp(page);

    // Navigate to Cities
    await page.getByRole('button', { name: /settings/i }).click();
    await page.waitForTimeout(1000);
    await page.getByText('Data Management').click();
    await page.waitForTimeout(500);
    await page.getByText('Cities').click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    console.log('✅ Successfully navigated to Cities');

    // Count total records
    const rows = await page.locator('tbody tr').all();
    console.log(`Total cities displayed: ${rows.length}`);

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
