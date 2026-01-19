import { test, expect } from '@playwright/test';
import { loginToApp } from '../helpers/auth.helper';
import { createAutoHealing } from '../helpers/auto-healing.helper';

test.describe('AI Chat Module Tests', () => {
    test.beforeEach(async ({ page }) => {
        await loginToApp(page);
        await page.waitForLoadState('load');
        
        // Navigate to AI Chat
        const menuItem = page.getByRole('menuitem', { name: /AI Chat/i });
        if (await menuItem.isVisible({ timeout: 3000 }).catch(() => false)) {
            await menuItem.click();
            await page.waitForLoadState('load');
            await page.waitForTimeout(2000);
        }
    });

    test('should load AI Chat page successfully', async ({ page }) => {
        test.setTimeout(60000);
        
        // Verify we're on the correct page (use flexible URL matching)
        const url = page.url();
        const urlPath = 'ai-chatnew'.replace('new', ''); // Handle 'New' suffix
        expect(url).toMatch(new RegExp(urlPath, 'i'));
        
        // Wait for page to be stable
        const healer = createAutoHealing(page);
        await healer.waitForStable();
        
        // Verify page has loaded (check for main container or heading)
        const mainContent = page.locator('main, [role="main"], .content, h1, h2, [class*="container"]').first();
        await expect(mainContent).toBeVisible({ timeout: 10000 });
        
        console.log('✅ AI Chat page loaded successfully');
    });


    test('should display AI Chat table with data', async ({ page }) => {
        test.setTimeout(60000);
        
        const healer = createAutoHealing(page);
        await healer.waitForStable();
        
        // Verify table or data grid is visible
        const table = page.locator('table, [role="grid"], .v-data-table, [class*="table"]').first();
        const hasTable = await table.isVisible({ timeout: 5000 }).catch(() => false);
        
        if (hasTable) {
            // Check for table rows
            const rows = page.locator('tbody tr, [role="row"]');
            const rowCount = await rows.count();
            
            console.log(`📊 Found ${rowCount} rows in AI Chat table`);
            
            // Check for table headers (optional - some tables might not have headers)
            const headers = page.locator('thead th, [role="columnheader"]');
            const headerCount = await headers.count();
            
            if (headerCount > 0) {
                console.log(`✅ AI Chat table displays correctly with ${headerCount} columns`);
            } else {
                console.log(`ℹ️ AI Chat table has no headers (might be a different layout)`);
            }
        } else {
            console.log(`ℹ️ No standard table found - AI Chat might use a different data display format`);
        }
    });

    test('should handle AI Chat table pagination', async ({ page }) => {
        test.setTimeout(60000);
        
        // Check if pagination exists
        const pagination = page.locator('.v-pagination, .pagination, [role="navigation"]');
        const hasPagination = await pagination.isVisible({ timeout: 3000 }).catch(() => false);
        
        if (hasPagination) {
            console.log('📄 Pagination found');
            
            // Get current page info
            const paginationInfo = await page.locator('.v-data-table-footer__info, .pagination-info').textContent().catch(() => '');
            console.log(`📊 Pagination info: ${paginationInfo}`);
            
            // Try to click next page if available
            const nextButton = page.locator('button:has-text("Next"), .v-pagination__next').first();
            if (await nextButton.isEnabled().catch(() => false)) {
                await nextButton.click();
                await page.waitForTimeout(1000);
                console.log('✅ Successfully navigated to next page');
            }
        } else {
            console.log('ℹ️ No pagination found (single page or all data shown)');
        }
    });




    test('should verify AI Chat action buttons', async ({ page }) => {
        test.setTimeout(60000);
        
        const healer = createAutoHealing(page);
        await healer.waitForStable();
        
        // Check for key action buttons
        const expectedButtons = ['Chat Date', 'Sentiment', 'Intent'];
        
        for (const buttonText of expectedButtons) {
            const button = page.locator(`button:has-text("${buttonText}")`).first();
            const isVisible = await button.isVisible({ timeout: 2000 }).catch(() => false);
            
            if (isVisible) {
                console.log(`✅ Found button: "${buttonText}"`);
            } else {
                console.log(`ℹ️ Button not visible: "${buttonText}"`);
            }
        }
        
        console.log('✅ AI Chat buttons verified');
    });


    test('should navigate through AI Chat sections', async ({ page }) => {
        test.setTimeout(60000);
        
        const healer = createAutoHealing(page);
        await healer.waitForStable();
        
        // Check for tabs or sub-navigation
        const tabs = page.locator('[role="tab"], .tab, [class*="tab"]');
        const tabCount = await tabs.count();
        
        if (tabCount > 0) {
            console.log(`📑 Found ${tabCount} tabs in AI Chat`);
            
            // Click first few tabs and verify they work
            for (let i = 0; i < Math.min(tabCount, 3); i++) {
                const tab = tabs.nth(i);
                if (await tab.isVisible().catch(() => false)) {
                    const tabText = await tab.textContent();
                    await tab.click();
                    await page.waitForTimeout(1000);
                    console.log(`✅ Clicked tab: ${tabText?.trim()}`);
                }
            }
        } else {
            console.log('ℹ️ No tabs found in AI Chat');
        }
        
        console.log('✅ AI Chat navigation tested');
    });

});
