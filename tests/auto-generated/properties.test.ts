import { test, expect } from '@playwright/test';
import { loginToApp } from '../helpers/auth.helper';
import { createAutoHealing } from '../helpers/auto-healing.helper';

test.describe('Properties Tests', () => {
    test.beforeEach(async ({ page }) => {
        await loginToApp(page);
        await page.waitForLoadState('load');
    });

    test('should access Properties page', async ({ page }) => {
        test.setTimeout(60000);
        
        const healer = createAutoHealing(page);
        await healer.waitForStable();
        
        // Navigate to Properties
        await healer.smartClick([
            'text=Properties',
            'a:has-text("Properties")',
            '[href*="properties"]'
        ]);
        
        await page.waitForLoadState('load');
        await healer.waitForStable();
        
        // Verify page loaded
        const heading = page.locator('h1, h2, h3').first();
        await expect(heading).toBeVisible({ timeout: 10000 });
        
        console.log('✅ Properties page loaded successfully');
    });


    test('should display Properties list/table', async ({ page }) => {
        test.setTimeout(60000);
        
        const healer = createAutoHealing(page);
        
        // Navigate to Properties
        await healer.smartClick(['text=Properties']);
        await page.waitForLoadState('load');
        await healer.waitForStable();
        
        // Verify table/list is visible
        const table = page.locator('table, [role="grid"], [class*="list"]').first();
        await expect(table).toBeVisible({ timeout: 10000 });
        
        // Check if rows are present
        const rows = await page.locator('tr, [role="row"], [class*="item"]').count();
        console.log(`Found ${rows} rows/items in Properties`);
        
        expect(rows).toBeGreaterThan(0);
    });




    test('should navigate through Properties sections', async ({ page }) => {
        test.setTimeout(60000);
        
        const healer = createAutoHealing(page);
        
        // Navigate to Properties
        await healer.smartClick(['text=Properties']);
        await page.waitForLoadState('load');
        await healer.waitForStable();
        
        // Check for tabs or sub-navigation
        const tabs = page.locator('[role="tab"], .tab, [class*="tab"]');
        const tabCount = await tabs.count();
        
        if (tabCount > 0) {
            console.log(`Found ${tabCount} tabs in Properties`);
            
            // Click first few tabs
            for (let i = 0; i < Math.min(tabCount, 3); i++) {
                const tab = tabs.nth(i);
                if (await tab.isVisible()) {
                    await tab.click();
                    await page.waitForTimeout(1000);
                }
            }
        }
        
        console.log('✅ Properties navigation tested');
    });

});
