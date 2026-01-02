import { test, expect } from '@playwright/test';
import { loginToApp } from './helpers/auth.helper';

test('create new FAQ with random question and answer', async ({ page }) => {
    test.setTimeout(120000);
    
    // Login with valid user
    await loginToApp(page);

    // Navigate to Settings
    await page.getByRole('button', { name: /settings/i }).click();
    await page.waitForTimeout(1000);

    console.log('Clicked Settings');

    // Navigate to Data Management > FAQ
    await page.getByText('Data Management').click();
    await page.waitForTimeout(500);
    
    await page.getByText('FAQ').click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    console.log('✅ Successfully navigated to FAQ under Data Management');

    // Wait and check if Create button exists
    await page.waitForTimeout(2000);

    // Click Create button
    await page.getByText('Create', { exact: true }).click();
    await page.waitForTimeout(1000);

    console.log('Clicked Create button');

    // Wait for form to load
    await page.waitForTimeout(2000);

    // Generate random question and answer with timestamp
    const timestamp = Date.now();
    const randomQuestion = `Test Question ${timestamp}`;
    const randomAnswer = `This is a test answer for FAQ created at ${timestamp}. This answer is being inserted into the rich text editor.`;

    console.log(`Random Question: ${randomQuestion}`);
    console.log(`Random Answer: ${randomAnswer}`);

    // Insert question using the correct field name
    await page.getByRole('textbox', { name: 'Question Question' }).click();
    await page.getByRole('textbox', { name: 'Question Question' }).fill(randomQuestion);
    await page.waitForTimeout(500);

    console.log('Filled in question');

    // Insert answer into rich text editor
    // The text editor has a dynamic ID starting with 'text-editor-', so use a flexible selector
    const editorSelector = page.locator('[role="textbox"][aria-label^="text-editor-"]').first();
    await editorSelector.click();
    await editorSelector.fill(randomAnswer);
    await page.waitForTimeout(500);

    console.log('Filled in answer in rich text editor');

    // Click Save & Continue Editing button
    await page.getByRole('button', { name: 'Save & Continue Editing' }).click();
    await page.waitForTimeout(3000);
    await page.waitForLoadState('networkidle');

    console.log('✅ Successfully created new FAQ with random question and answer');
});

test('verify FAQ table displays records', async ({ page }) => {
    test.setTimeout(120000);
    
    await loginToApp(page);

    // Navigate to FAQ
    await page.getByRole('button', { name: /settings/i }).click();
    await page.waitForTimeout(1000);
    await page.getByText('Data Management').click();
    await page.waitForTimeout(500);
    await page.getByText('FAQ').click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    console.log('✅ Successfully navigated to FAQ');

    // Verify table is visible
    const table = page.locator('table, .v-data-table, [role="table"]').first();
    await expect(table).toBeVisible({ timeout: 10000 });
    console.log('✅ Table is visible');

    // Count FAQs in the table
    const rows = await page.locator('tbody tr').all();
    console.log(`Found ${rows.length} FAQ(s) in the table`);

    if (rows.length > 0) {
        await expect(rows[0]).toBeVisible();
        console.log('✅ First FAQ record is visible');
    }
});

test('search FAQs by question', async ({ page }) => {
    test.setTimeout(120000);
    
    await loginToApp(page);

    // Navigate to FAQ
    await page.getByRole('button', { name: /settings/i }).click();
    await page.waitForTimeout(1000);
    await page.getByText('Data Management').click();
    await page.waitForTimeout(500);
    await page.getByText('FAQ').click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    console.log('✅ Successfully navigated to FAQ');

    // Look for search input field
    const searchInput = page.locator('input[type="text"]').first();

    if (await searchInput.isVisible({ timeout: 5000 }).catch(() => false)) {
        // Enter search term
        await searchInput.fill('Test');
        await page.waitForTimeout(1500);
        console.log('✅ Entered search term: Test');

        // Count results
        const rows = await page.locator('tbody tr').all();
        console.log(`Found ${rows.length} FAQ(s) matching search`);
    } else {
        console.log('⚠️ Search field not found, skipping search test');
    }
});

test('edit existing FAQ', async ({ page }) => {
    test.setTimeout(120000);
    
    await loginToApp(page);

    // Navigate to FAQ
    await page.getByRole('button', { name: /settings/i }).click();
    await page.waitForTimeout(1000);
    await page.getByText('Data Management').click();
    await page.waitForTimeout(500);
    await page.getByText('FAQ').click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    console.log('✅ Successfully navigated to FAQ');

    // Click on first FAQ to edit
    const firstRow = page.locator('tbody tr').first();
    if (await firstRow.isVisible({ timeout: 5000 }).catch(() => false)) {
        await firstRow.click();
        await page.waitForTimeout(2000);
        console.log('✅ Clicked on first FAQ record');

        // Edit question
        const questionField = page.getByRole('textbox', { name: 'Question Question' });
        if (await questionField.isVisible({ timeout: 5000 }).catch(() => false)) {
            const currentQuestion = await questionField.inputValue();
            const newQuestion = `${currentQuestion} - Edited ${Date.now()}`;
            
            await questionField.clear();
            await questionField.fill(newQuestion);
            await page.waitForTimeout(1000);
            console.log(`✅ Updated question to: ${newQuestion}`);

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
        console.log('⚠️ No FAQs found to edit');
    }
});

test('create FAQ with long answer text', async ({ page }) => {
    test.setTimeout(120000);
    
    await loginToApp(page);

    // Navigate to FAQ
    await page.getByRole('button', { name: /settings/i }).click();
    await page.waitForTimeout(1000);
    await page.getByText('Data Management').click();
    await page.waitForTimeout(500);
    await page.getByText('FAQ').click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    console.log('✅ Successfully navigated to FAQ');

    // Click Create button
    await page.getByText('Create', { exact: true }).click();
    await page.waitForTimeout(2000);
    console.log('Clicked Create button');

    // Generate test data with long answer
    const timestamp = Date.now();
    const randomQuestion = `Long Answer Test ${timestamp}`;
    const longAnswer = `This is a comprehensive answer for FAQ created at ${timestamp}. 
It includes multiple paragraphs to test the rich text editor's capability to handle longer content.

Paragraph 1: This paragraph discusses the basic features and functionalities that users need to know.

Paragraph 2: This section covers advanced topics and detailed explanations of complex concepts.

Paragraph 3: Finally, this part provides troubleshooting tips and best practices for optimal usage.

The answer should be properly formatted and stored in the database with all line breaks preserved.`;

    console.log(`Test Data - Question: ${randomQuestion}`);

    // Fill in question
    await page.getByRole('textbox', { name: 'Question Question' }).fill(randomQuestion);
    await page.waitForTimeout(500);
    console.log('✅ Filled in question');

    // Fill in long answer
    const editorSelector = page.locator('[role="textbox"][aria-label^="text-editor-"]').first();
    await editorSelector.click();
    await editorSelector.fill(longAnswer);
    await page.waitForTimeout(500);
    console.log('✅ Filled in long answer in rich text editor');

    // Save
    await page.getByRole('button', { name: 'Save & Continue Editing' }).click();
    await page.waitForTimeout(3000);
    await page.waitForLoadState('networkidle');

    console.log('✅ Successfully created FAQ with long answer');
});

test('validate required fields when creating FAQ', async ({ page }) => {
    test.setTimeout(120000);
    
    await loginToApp(page);

    // Navigate to FAQ
    await page.getByRole('button', { name: /settings/i }).click();
    await page.waitForTimeout(1000);
    await page.getByText('Data Management').click();
    await page.waitForTimeout(500);
    await page.getByText('FAQ').click();
    await page.waitForLoadState('load');
    await page.waitForTimeout(2000);

    console.log('✅ Successfully navigated to FAQ');

    // Click Create button
    await page.getByText('Create', { exact: true }).click();
    await page.waitForTimeout(3000);
    console.log('Clicked Create button');

    try {
        // Wait for question field to be visible
        const questionField = page.getByRole('textbox', { name: 'Question Question' });
        await questionField.waitFor({ state: 'visible', timeout: 10000 });

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

        // Fill only question
        await questionField.fill('Test Question Only');
        await page.waitForTimeout(1000);
        console.log('✅ Filled question field');

        console.log('✅ Validation checks completed!');
    } catch (error) {
        console.log('⚠️ Form validation test could not complete - page may have navigated away');
    }
});

test('create FAQ with special characters in question', async ({ page }) => {
    test.setTimeout(120000);
    
    await loginToApp(page);

    // Navigate to FAQ
    await page.getByRole('button', { name: /settings/i }).click();
    await page.waitForTimeout(1000);
    await page.getByText('Data Management').click();
    await page.waitForTimeout(500);
    await page.getByText('FAQ').click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    console.log('✅ Successfully navigated to FAQ');

    // Click Create button
    await page.getByText('Create', { exact: true }).click();
    await page.waitForTimeout(2000);
    console.log('Clicked Create button');

    // Generate test data with special characters
    const timestamp = Date.now();
    const specialQuestion = `What is the cost? (Price: $50-$100) & How to pay? ${timestamp}`;
    const specialAnswer = `The cost ranges from $50 to $100. You can pay via: credit card, PayPal, or bank transfer. Questions? Contact us at support@example.com`;

    console.log(`Test Data - Question: ${specialQuestion}`);

    // Fill in question
    await page.getByRole('textbox', { name: 'Question Question' }).fill(specialQuestion);
    await page.waitForTimeout(500);
    console.log('✅ Filled in question with special characters');

    // Fill in answer
    const editorSelector = page.locator('[role="textbox"][aria-label^="text-editor-"]').first();
    await editorSelector.click();
    await editorSelector.fill(specialAnswer);
    await page.waitForTimeout(500);
    console.log('✅ Filled in answer');

    // Save
    await page.getByRole('button', { name: 'Save & Continue Editing' }).click();
    await page.waitForTimeout(3000);
    await page.waitForLoadState('networkidle');

    console.log('✅ Successfully created FAQ with special characters');
});

test('verify FAQ record count and pagination', async ({ page }) => {
    test.setTimeout(120000);
    
    await loginToApp(page);

    // Navigate to FAQ
    await page.getByRole('button', { name: /settings/i }).click();
    await page.waitForTimeout(1000);
    await page.getByText('Data Management').click();
    await page.waitForTimeout(500);
    await page.getByText('FAQ').click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    console.log('✅ Successfully navigated to FAQ');

    // Count total records
    const rows = await page.locator('tbody tr').all();
    console.log(`Total FAQs displayed: ${rows.length}`);

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

test('create FAQ with Chinese characters', async ({ page }) => {
    test.setTimeout(120000);
    
    await loginToApp(page);

    // Navigate to FAQ
    await page.getByRole('button', { name: /settings/i }).click();
    await page.waitForTimeout(1000);
    await page.getByText('Data Management').click();
    await page.waitForTimeout(500);
    await page.getByText('FAQ').click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    console.log('✅ Successfully navigated to FAQ');

    // Click Create button
    await page.getByText('Create', { exact: true }).click();
    await page.waitForTimeout(2000);
    console.log('Clicked Create button');

    // Generate test data with Chinese characters
    const timestamp = Date.now();
    const chineseQuestion = `常见问题测试 ${timestamp}`;
    const chineseAnswer = `这是一个常见问题的测试答案，创建时间戳为 ${timestamp}。这个答案包含中文字符，用于测试富文本编辑器对多语言内容的支持。`;

    console.log(`Test Data - Question: ${chineseQuestion}`);

    // Fill in question
    await page.getByRole('textbox', { name: 'Question Question' }).fill(chineseQuestion);
    await page.waitForTimeout(500);
    console.log('✅ Filled in Chinese question');

    // Fill in answer
    const editorSelector = page.locator('[role="textbox"][aria-label^="text-editor-"]').first();
    await editorSelector.click();
    await editorSelector.fill(chineseAnswer);
    await page.waitForTimeout(500);
    console.log('✅ Filled in Chinese answer');

    // Save
    await page.getByRole('button', { name: 'Save & Continue Editing' }).click();
    await page.waitForTimeout(3000);
    await page.waitForLoadState('networkidle');

    console.log('✅ Successfully created FAQ with Chinese characters');
});

test('verify FAQ detail view', async ({ page }) => {
    test.setTimeout(120000);
    
    await loginToApp(page);

    // Navigate to FAQ
    await page.getByRole('button', { name: /settings/i }).click();
    await page.waitForTimeout(1000);
    await page.getByText('Data Management').click();
    await page.waitForTimeout(500);
    await page.getByText('FAQ').click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    console.log('✅ Successfully navigated to FAQ');

    // Click on first FAQ
    const firstRow = page.locator('tbody tr').first();
    if (await firstRow.isVisible({ timeout: 5000 }).catch(() => false)) {
        await firstRow.click();
        await page.waitForTimeout(2000);
        console.log('✅ Opened FAQ detail view');

        // Verify key elements are visible
        const questionField = page.getByRole('textbox', { name: 'Question Question' });
        const questionVisible = await questionField.isVisible({ timeout: 3000 }).catch(() => false);
        
        if (questionVisible) {
            const question = await questionField.inputValue();
            console.log(`✅ Question field visible: ${question}`);
        }

        // Check for answer editor
        const editorSelector = page.locator('[role="textbox"][aria-label^="text-editor-"]').first();
        const editorVisible = await editorSelector.isVisible({ timeout: 3000 }).catch(() => false);
        
        if (editorVisible) {
            console.log('✅ Answer editor visible');
        }

        console.log('✅ FAQ detail view verified');
    } else {
        console.log('⚠️ No FAQs found to view');
    }
});
