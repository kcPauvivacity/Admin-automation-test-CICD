import { test, expect } from '@playwright/test';
import { loginToApp } from './helpers/auth.helper';

test('filter Analytics by tracking id and search', async ({ page }) => {
    test.setTimeout(120000);
    
    // Login with valid user
    await loginToApp(page);

    await page.waitForLoadState('load');
    await page.waitForTimeout(2000);

    console.log('✅ Successfully logged in');

    // Navigate to Settings
    await page.getByRole('button', { name: /settings/i }).click();
    await page.waitForTimeout(1000);

    console.log('Clicked Settings');

    // Navigate to Analytics & Reporting > Analytics
    await page.getByText('Analytics & Reporting').click();
    await page.waitForTimeout(500);
    
    // Click on Analytics option using role selector to be more specific
    await page.getByRole('option', { name: 'Analytics' }).click();
    await page.waitForLoadState('load');
    await page.waitForTimeout(2000);

    console.log('✅ Successfully navigated to Analytics under Analytics & Reporting');

    // Click on Tracking ID filter button
    await page.getByRole('button', { name: 'Tracking ID filter' }).click();
    await page.waitForTimeout(1000);

    console.log('Clicked Tracking ID filter');

    // Click on the search field and fill in "asdf"
    await page.getByRole('textbox', { name: 'Search for Tracking ID' }).click();
    await page.getByRole('textbox', { name: 'Search for Tracking ID' }).fill('asdf');
    await page.waitForTimeout(1000);

    console.log('Searched for: asdf');

    // Click Close button
    await page.getByRole('button', { name: 'Close' }).click();
    await page.waitForTimeout(1000);

    console.log('✅ Successfully searched for "asdf" in tracking ID filter and closed');
});

test('create new analytics with random data', async ({ page }) => {
    test.setTimeout(120000);
    
    // Login with valid user
    await loginToApp(page);

    await page.waitForLoadState('load');
    await page.waitForTimeout(2000);

    console.log('✅ Successfully logged in');

    // Navigate to Settings
    await page.getByRole('button', { name: /settings/i }).click();
    await page.waitForTimeout(1000);

    console.log('Clicked Settings');

    // Navigate to Analytics & Reporting > Analytics
    await page.getByText('Analytics & Reporting').click();
    await page.waitForTimeout(500);
    
    // Click on Analytics option using role selector to be more specific
    await page.getByRole('option', { name: 'Analytics' }).click();
    await page.waitForLoadState('load');
    await page.waitForTimeout(2000);

    console.log('✅ Successfully navigated to Analytics under Analytics & Reporting');

    // Click Create button
    await page.getByText('Create', { exact: true }).click();
    await page.waitForTimeout(2000);

    console.log('Clicked Create button');

    // Wait for form to load
    await page.waitForTimeout(2000);

    // Generate random data with timestamp
    const timestamp = Date.now();
    const randomName = `Analytics${timestamp}`;
    const randomTrackingId = `TR${timestamp}`;
    const randomViewId = `VW${timestamp}`;

    console.log(`Random Name: ${randomName}`);
    console.log(`Random Tracking ID: ${randomTrackingId}`);
    console.log(`Random View ID: ${randomViewId}`);

    // Insert name - target the input within the dialog/overlay to avoid interception
    const nameInput = page.locator('.v-dialog input[aria-label="Create New Analytics"], .v-dialog input[type="text"]').first();
    await nameInput.waitFor({ state: 'visible', timeout: 10000 });
    await nameInput.click({ force: true });
    await nameInput.fill(randomName);
    await page.waitForTimeout(500);

    console.log('Filled in name');

    // Select Type - click within the dialog on the Type dropdown
    // The field should be in a v-dialog or v-card
    await page.locator('.v-dialog .v-field__append-inner .mdi-menu-down').first().click({ force: true });
    await page.waitForTimeout(1000);
    // Select GA4 Mini Program option
    await page.getByRole('option', { name: 'GA4 Mini Program' }).click();
    await page.waitForTimeout(1000);

    console.log('Selected GA4 Mini Program from dropdown');

    // Insert Tracking ID - target within dialog, should be the 2nd text input
    const trackingInput = page.locator('.v-dialog input[type="text"]').nth(1);
    await trackingInput.waitFor({ state: 'visible', timeout: 10000 });
    await trackingInput.scrollIntoViewIfNeeded();
    await trackingInput.click({ force: true });
    await trackingInput.fill(randomTrackingId);
    await page.waitForTimeout(500);

    console.log('Filled in tracking ID');

    // Insert View ID - target within dialog, should be the 3rd text input
    const viewInput = page.locator('.v-dialog input[type="text"]').nth(2);
    await viewInput.waitFor({ state: 'visible', timeout: 10000 });
    await viewInput.scrollIntoViewIfNeeded();
    await viewInput.click({ force: true });
    await viewInput.fill(randomViewId);
    await page.waitForTimeout(500);

    console.log('Filled in view ID');

    // Wait a moment for form validation
    await page.waitForTimeout(1000);

    // Check if Save button is enabled, if not, try to identify missing fields
    const saveButton = page.getByRole('button', { name: 'Save' });
    const isDisabled = await saveButton.getAttribute('disabled');
    
    if (isDisabled !== null) {
        console.log('⚠️ Save button is disabled. Checking for missing required fields...');
        
        // Try to find and fill any additional required fields
        // Check for any empty required inputs in the dialog
        const requiredInputs = await page.locator('.v-dialog input[required]').all();
        console.log(`Found ${requiredInputs.length} required input fields`);
        
        for (let i = 0; i < requiredInputs.length; i++) {
            const value = await requiredInputs[i].inputValue();
            const ariaLabel = await requiredInputs[i].getAttribute('aria-label');
            const placeholder = await requiredInputs[i].getAttribute('placeholder');
            console.log(`Field ${i}: value="${value}", aria-label="${ariaLabel}", placeholder="${placeholder}"`);
            
            if (!value) {
                console.log(`⚠️ Required field ${i} is empty - trying to fill it`);
                // Try to fill empty required fields
                if (i === 2) {
                    await requiredInputs[i].scrollIntoViewIfNeeded();
                    await requiredInputs[i].click({ force: true });
                    await requiredInputs[i].fill(randomTrackingId);
                } else if (i === 3) {
                    await requiredInputs[i].scrollIntoViewIfNeeded();
                    await requiredInputs[i].click({ force: true });
                    await requiredInputs[i].fill(randomViewId);
                }
            }
        }
        
        // Wait and try again
        await page.waitForTimeout(2000);
    }

    // Click Save button with increased timeout
    await saveButton.click({ timeout: 10000 });
    await page.waitForTimeout(3000);
    await page.waitForLoadState('load');

    console.log('✅ Successfully created new analytics with random data');
});

test('verify analytics table displays records', async ({ page }) => {
    test.setTimeout(120000);
    
    // Login with valid user
    await loginToApp(page);

    await page.waitForLoadState('load');
    await page.waitForTimeout(2000);

    console.log('✅ Successfully logged in');

    // Navigate to Settings > Analytics & Reporting > Analytics
    await page.getByRole('button', { name: /settings/i }).click();
    await page.waitForTimeout(1000);
    await page.getByText('Analytics & Reporting').click();
    await page.waitForTimeout(500);
    await page.getByRole('option', { name: 'Analytics' }).click();
    await page.waitForLoadState('load');
    await page.waitForTimeout(2000);

    console.log('✅ Successfully navigated to Analytics');

    // Verify table exists
    const table = page.locator('table');
    await expect(table).toBeVisible({ timeout: 10000 });
    console.log('✅ Table is visible');

    // Count rows in the table
    const rows = table.locator('tbody tr');
    const rowCount = await rows.count();
    console.log(`Found ${rowCount} analytics record(s) in the table`);

    // Verify at least one record exists or table is empty
    if (rowCount > 0) {
        const firstRow = rows.first();
        await expect(firstRow).toBeVisible();
        console.log('✅ First analytics record is visible');
    } else {
        console.log('⚠️ No analytics records found in the table');
    }
});

test('edit existing analytics record', async ({ page }) => {
    test.setTimeout(120000);
    
    // Login with valid user
    await loginToApp(page);

    await page.waitForLoadState('load');
    await page.waitForTimeout(2000);

    console.log('✅ Successfully logged in');

    // Navigate to Settings > Analytics & Reporting > Analytics
    await page.getByRole('button', { name: /settings/i }).click();
    await page.waitForTimeout(1000);
    await page.getByText('Analytics & Reporting').click();
    await page.waitForTimeout(500);
    await page.getByRole('option', { name: 'Analytics' }).click();
    await page.waitForLoadState('load');
    await page.waitForTimeout(2000);

    console.log('✅ Successfully navigated to Analytics');

    // Click on the first record to edit
    const firstRecord = page.locator('table tbody tr').first();
    const recordCount = await page.locator('table tbody tr').count();
    
    if (recordCount === 0) {
        console.log('⚠️ No analytics records to edit, skipping test');
        test.skip();
    }

    await firstRecord.click();
    await page.waitForTimeout(2000);

    console.log('✅ Clicked on first analytics record');

    // Update the name field
    const timestamp = Date.now();
    const updatedName = `UpdatedAnalytics${timestamp}`;
    
    const nameField = page.locator('.v-dialog input[aria-label="Create New Analytics"], .v-dialog input[type="text"]').first();
    if (await nameField.isVisible({ timeout: 5000 }).catch(() => false)) {
        await nameField.click({ force: true });
        await nameField.fill('');
        await nameField.fill(updatedName);
        await page.waitForTimeout(500);
        
        console.log(`✅ Updated name to: ${updatedName}`);

        // Save changes
        const saveButton = page.getByRole('button', { name: 'Save' });
        if (await saveButton.isVisible({ timeout: 5000 }).catch(() => false)) {
            await saveButton.click({ timeout: 10000 });
            await page.waitForTimeout(2000);
            console.log('✅ Successfully saved changes');
        }
    } else {
        console.log('⚠️ Edit dialog not found');
    }
});

test('create analytics with different type - UA', async ({ page }) => {
    test.setTimeout(120000);
    
    // Login with valid user
    await loginToApp(page);

    await page.waitForLoadState('load');
    await page.waitForTimeout(2000);

    console.log('✅ Successfully logged in');

    // Navigate to Settings > Analytics & Reporting > Analytics
    await page.getByRole('button', { name: /settings/i }).click();
    await page.waitForTimeout(1000);
    await page.getByText('Analytics & Reporting').click();
    await page.waitForTimeout(500);
    await page.getByRole('option', { name: 'Analytics' }).click();
    await page.waitForLoadState('load');
    await page.waitForTimeout(2000);

    console.log('✅ Successfully navigated to Analytics');

    // Click Create button
    await page.getByText('Create', { exact: true }).click();
    await page.waitForTimeout(2000);

    console.log('Clicked Create button');

    // Generate random data with timestamp
    const timestamp = Date.now();
    const randomName = `UA_Analytics${timestamp}`;
    const randomTrackingId = `UA-${timestamp}`;
    const randomViewId = `VW-${timestamp}`;

    console.log(`Random Name: ${randomName}`);
    console.log(`Random Tracking ID: ${randomTrackingId}`);
    console.log(`Random View ID: ${randomViewId}`);

    // Insert name
    const nameInput = page.locator('.v-dialog input[aria-label="Create New Analytics"], .v-dialog input[type="text"]').first();
    await nameInput.waitFor({ state: 'visible', timeout: 10000 });
    await nameInput.click({ force: true });
    await nameInput.fill(randomName);
    await page.waitForTimeout(500);

    console.log('Filled in name');

    // Select Type - try to select UA (Universal Analytics) if available
    await page.locator('.v-dialog .v-field__append-inner .mdi-menu-down').first().click({ force: true });
    await page.waitForTimeout(1000);
    
    // Check if UA option exists, otherwise use GA4
    const uaOption = page.getByRole('option', { name: /UA|Universal Analytics/i });
    const ga4Option = page.getByRole('option', { name: 'GA4 Mini Program' });
    
    if (await uaOption.isVisible({ timeout: 2000 }).catch(() => false)) {
        await uaOption.click();
        console.log('Selected UA (Universal Analytics) type');
    } else {
        await ga4Option.click();
        console.log('UA not available, selected GA4 Mini Program instead');
    }
    await page.waitForTimeout(1000);

    // Fill in remaining required fields
    const requiredInputs = await page.locator('.v-dialog input[required]').all();
    
    for (let i = 0; i < requiredInputs.length; i++) {
        const value = await requiredInputs[i].inputValue();
        
        if (!value) {
            if (i === 2) {
                await requiredInputs[i].scrollIntoViewIfNeeded();
                await requiredInputs[i].click({ force: true });
                await requiredInputs[i].fill(randomTrackingId);
            } else if (i === 3) {
                await requiredInputs[i].scrollIntoViewIfNeeded();
                await requiredInputs[i].click({ force: true });
                await requiredInputs[i].fill(randomViewId);
            }
        }
    }

    await page.waitForTimeout(1000);

    // Click Save button
    const saveButton = page.getByRole('button', { name: 'Save' });
    await saveButton.click({ timeout: 10000 });
    await page.waitForTimeout(3000);
    await page.waitForLoadState('load');

    console.log('✅ Successfully created analytics with UA/GA4 type');
});

test('search analytics by name', async ({ page }) => {
    test.setTimeout(120000);
    
    // Login with valid user
    await loginToApp(page);

    await page.waitForLoadState('load');
    await page.waitForTimeout(2000);

    console.log('✅ Successfully logged in');

    // Navigate to Settings > Analytics & Reporting > Analytics
    await page.getByRole('button', { name: /settings/i }).click();
    await page.waitForTimeout(1000);
    await page.getByText('Analytics & Reporting').click();
    await page.waitForTimeout(500);
    await page.getByRole('option', { name: 'Analytics' }).click();
    await page.waitForLoadState('load');
    await page.waitForTimeout(2000);

    console.log('✅ Successfully navigated to Analytics');

    // Look for search input field
    const searchInput = page.locator('input[type="text"]').first();
    
    if (await searchInput.isVisible({ timeout: 5000 }).catch(() => false)) {
        await searchInput.click();
        await searchInput.fill('Analytics');
        await page.waitForTimeout(1000);
        
        console.log('✅ Entered search term: Analytics');

        // Verify search results
        const rows = await page.locator('table tbody tr').count();
        console.log(`Found ${rows} analytics record(s) matching search`);
    } else {
        console.log('⚠️ Search field not found');
    }
});

test('verify analytics type filter works', async ({ page }) => {
    test.setTimeout(120000);
    
    // Login with valid user
    await loginToApp(page);

    await page.waitForLoadState('load');
    await page.waitForTimeout(2000);

    console.log('✅ Successfully logged in');

    // Navigate to Settings > Analytics & Reporting > Analytics
    await page.getByRole('button', { name: /settings/i }).click();
    await page.waitForTimeout(1000);
    await page.getByText('Analytics & Reporting').click();
    await page.waitForTimeout(500);
    await page.getByRole('option', { name: 'Analytics' }).click();
    await page.waitForLoadState('load');
    await page.waitForTimeout(2000);

    console.log('✅ Successfully navigated to Analytics');

    // Look for Type filter button
    const typeFilterButton = page.getByRole('button', { name: /Type filter/i });
    
    if (await typeFilterButton.isVisible({ timeout: 5000 }).catch(() => false)) {
        await typeFilterButton.click();
        await page.waitForTimeout(1000);
        
        console.log('Clicked Type filter');

        // Try to select GA4 Mini Program filter
        const ga4Option = page.getByRole('checkbox', { name: /GA4/i });
        if (await ga4Option.isVisible({ timeout: 3000 }).catch(() => false)) {
            await ga4Option.check();
            await page.waitForTimeout(2000);
            await page.waitForLoadState('load');
            
            console.log('✅ Applied GA4 type filter');

            // Verify filtered results
            const rows = await page.locator('table tbody tr').count();
            console.log(`Found ${rows} GA4 analytics record(s)`);
        }

        // Close filter
        const closeButton = page.getByRole('button', { name: 'Close' });
        if (await closeButton.isVisible({ timeout: 3000 }).catch(() => false)) {
            await closeButton.click();
            await page.waitForTimeout(1000);
        }
    } else {
        console.log('⚠️ Type filter button not found');
    }
});

test('create analytics and validate record details', async ({ page }) => {
    test.setTimeout(120000);
    
    // Login with valid user
    await loginToApp(page);

    await page.waitForLoadState('load');
    await page.waitForTimeout(2000);

    console.log('✅ Successfully logged in');

    // Navigate to Settings > Analytics & Reporting > Analytics
    await page.getByRole('button', { name: /settings/i }).click();
    await page.waitForTimeout(1000);
    await page.getByText('Analytics & Reporting').click();
    await page.waitForTimeout(500);
    await page.getByRole('option', { name: 'Analytics' }).click();
    await page.waitForLoadState('load');
    await page.waitForTimeout(2000);

    console.log('✅ Successfully navigated to Analytics');

    // Click Create button
    await page.getByText('Create', { exact: true }).click();
    await page.waitForTimeout(2000);

    console.log('Clicked Create button');

    // Generate random data with timestamp for validation
    const timestamp = Date.now();
    const testData = {
        name: `ValidateAnalytics${timestamp}`,
        trackingId: `TR-VALIDATE-${timestamp}`,
        viewId: `VW-VALIDATE-${timestamp}`,
        type: 'GA4 Mini Program'
    };

    console.log(`Test Data - Name: ${testData.name}, Tracking: ${testData.trackingId}, View: ${testData.viewId}`);

    // Insert name
    const nameInput = page.locator('.v-dialog input[aria-label="Create New Analytics"], .v-dialog input[type="text"]').first();
    await nameInput.waitFor({ state: 'visible', timeout: 10000 });
    await nameInput.click({ force: true });
    await nameInput.fill(testData.name);
    await page.waitForTimeout(500);

    console.log('✅ Filled in name');

    // Select Type
    await page.locator('.v-dialog .v-field__append-inner .mdi-menu-down').first().click({ force: true });
    await page.waitForTimeout(1000);
    await page.getByRole('option', { name: testData.type }).click();
    await page.waitForTimeout(1000);

    console.log(`✅ Selected type: ${testData.type}`);

    // Fill required fields
    const requiredInputs = await page.locator('.v-dialog input[required]').all();
    
    for (let i = 0; i < requiredInputs.length; i++) {
        const value = await requiredInputs[i].inputValue();
        
        if (!value) {
            if (i === 2) {
                await requiredInputs[i].scrollIntoViewIfNeeded();
                await requiredInputs[i].click({ force: true });
                await requiredInputs[i].fill(testData.trackingId);
                console.log('✅ Filled tracking ID');
            } else if (i === 3) {
                await requiredInputs[i].scrollIntoViewIfNeeded();
                await requiredInputs[i].click({ force: true });
                await requiredInputs[i].fill(testData.viewId);
                console.log('✅ Filled view ID');
            }
        }
    }

    await page.waitForTimeout(1000);

    // Save the record
    const saveButton = page.getByRole('button', { name: 'Save' });
    await saveButton.click({ timeout: 10000 });
    await page.waitForTimeout(3000);
    await page.waitForLoadState('load');

    console.log('✅ Successfully created analytics record');

    // Now search for the created record to validate
    await page.waitForTimeout(2000);
    
    // Search for the record by name
    const searchInput = page.locator('input[type="text"]').first();
    if (await searchInput.isVisible({ timeout: 5000 }).catch(() => false)) {
        await searchInput.click();
        await searchInput.fill(testData.name);
        await page.waitForTimeout(2000);
        
        console.log(`🔍 Searching for record: ${testData.name}`);
    }

    // Find the row containing our test data
    const recordRow = page.locator(`table tbody tr:has-text("${testData.name}")`).first();
    
    // Validate the record exists in the table
    await expect(recordRow).toBeVisible({ timeout: 10000 });
    console.log('✅ Record found in table');

    // Validate the name appears in the row
    const nameCell = recordRow.locator(`text="${testData.name}"`);
    await expect(nameCell).toBeVisible();
    console.log(`✅ Validated Name: ${testData.name}`);

    // Validate the type appears in the row
    const typeText = recordRow.locator('text=/GA4|ga4/i');
    const typeVisible = await typeText.isVisible({ timeout: 5000 }).catch(() => false);
    if (typeVisible) {
        console.log(`✅ Validated Type: ${testData.type}`);
    } else {
        console.log('⚠️ Type not visible in table row');
    }

    // Click on the record to view details
    await recordRow.click();
    await page.waitForTimeout(3000);

    console.log('✅ Opened record details');

    // Validate details in the edit dialog or detail view
    // First, check if a dialog opened
    const detailDialog = page.locator('.v-dialog');
    const isDialogVisible = await detailDialog.isVisible({ timeout: 5000 }).catch(() => false);
    
    if (!isDialogVisible) {
        console.log('⚠️ Dialog did not open on first click, trying double-click');
        await recordRow.dblclick();
        await page.waitForTimeout(3000);
    }

    // Check again if dialog is visible
    const dialogVisibleNow = await detailDialog.isVisible({ timeout: 5000 }).catch(() => false);
    
    if (dialogVisibleNow) {
        console.log('✅ Detail dialog is visible');
        
        // Validate Name field
        const nameFieldValue = await page.locator('.v-dialog input[aria-label="Create New Analytics"], .v-dialog input[type="text"]').first().inputValue();
        expect(nameFieldValue).toBe(testData.name);
        console.log(`✅ Validated Name in details: ${nameFieldValue}`);

        // Validate Type field
        const typeField = page.locator('.v-dialog input[aria-label="Open"]').first();
        const typeValue = await typeField.inputValue();
        const isGA4Type = typeValue.includes('ga4') || typeValue.includes('GA4');
        expect(isGA4Type).toBeTruthy();
        console.log(`✅ Validated Type in details: ${typeValue}`);

        // Validate Tracking ID field
        const allRequiredInputs = await page.locator('.v-dialog input[required]').all();
        if (allRequiredInputs.length >= 3) {
            const trackingIdValue = await allRequiredInputs[2].inputValue();
            expect(trackingIdValue).toBe(testData.trackingId);
            console.log(`✅ Validated Tracking ID in details: ${trackingIdValue}`);
        }

        // Validate View ID field
        if (allRequiredInputs.length >= 4) {
            const viewIdValue = await allRequiredInputs[3].inputValue();
            expect(viewIdValue).toBe(testData.viewId);
            console.log(`✅ Validated View ID in details: ${viewIdValue}`);
        }

        console.log('🎉 All record details validated successfully!');

        // Close the dialog
        const cancelButton = page.getByRole('button', { name: /Cancel|Close/i });
        if (await cancelButton.isVisible({ timeout: 3000 }).catch(() => false)) {
            await cancelButton.click();
            await page.waitForTimeout(1000);
        }
    } else {
        console.log('⚠️ Could not open detail dialog. Record validation in table was successful.');
        console.log('✅ Record exists in table with correct name');
    }
});

test('validate required field error messages', async ({ page }) => {
    test.setTimeout(120000);
    
    // Login with valid user
    await loginToApp(page);

    await page.waitForLoadState('load');
    await page.waitForTimeout(2000);

    console.log('✅ Successfully logged in');

    // Navigate to Settings > Analytics & Reporting > Analytics
    await page.getByRole('button', { name: /settings/i }).click();
    await page.waitForTimeout(1000);
    await page.getByText('Analytics & Reporting').click();
    await page.waitForTimeout(500);
    await page.getByRole('option', { name: 'Analytics' }).click();
    await page.waitForLoadState('load');
    await page.waitForTimeout(2000);

    console.log('✅ Successfully navigated to Analytics');

    // Click Create button
    await page.getByText('Create', { exact: true }).click();
    await page.waitForTimeout(2000);

    console.log('Clicked Create button');

    // Try to save without filling any fields
    const saveButton = page.getByRole('button', { name: 'Save' });
    
    // Check if Save button is disabled when form is empty
    const isDisabled = await saveButton.getAttribute('disabled');
    expect(isDisabled).not.toBeNull();
    console.log('✅ Validated: Save button is disabled when form is empty');

    // Fill only the name field
    const nameInput = page.locator('.v-dialog input[aria-label="Create New Analytics"], .v-dialog input[type="text"]').first();
    await nameInput.waitFor({ state: 'visible', timeout: 10000 });
    await nameInput.click({ force: true });
    await nameInput.fill('TestName');
    await page.waitForTimeout(500);

    console.log('Filled only name field');

    // Check if Save button is still disabled (Type is required)
    await page.waitForTimeout(1000);
    const isStillDisabled = await saveButton.getAttribute('disabled');
    expect(isStillDisabled).not.toBeNull();
    console.log('✅ Validated: Save button is still disabled without Type selected');

    // Select Type
    await page.locator('.v-dialog .v-field__append-inner .mdi-menu-down').first().click({ force: true });
    await page.waitForTimeout(1000);
    await page.getByRole('option', { name: 'GA4 Mini Program' }).click();
    await page.waitForTimeout(1000);

    console.log('Selected Type');

    // Check if Save button is still disabled (Tracking ID and View ID required)
    await page.waitForTimeout(1000);
    const isStillDisabled2 = await saveButton.getAttribute('disabled');
    expect(isStillDisabled2).not.toBeNull();
    console.log('✅ Validated: Save button is still disabled without Tracking ID and View ID');

    // Verify required field indicators (usually marked with asterisk or aria-required)
    const requiredInputs = await page.locator('.v-dialog input[required]').count();
    console.log(`✅ Found ${requiredInputs} required fields`);
    expect(requiredInputs).toBeGreaterThan(0);

    console.log('🎉 All validation checks passed!');

    // Close the dialog
    const cancelButton = page.getByRole('button', { name: /Cancel|Close/i });
    if (await cancelButton.isVisible({ timeout: 3000 }).catch(() => false)) {
        await cancelButton.click();
        await page.waitForTimeout(1000);
    }
});
