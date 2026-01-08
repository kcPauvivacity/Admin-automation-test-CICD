import { test, expect } from '@playwright/test';
import { loginToApp } from '../helpers/auth.helper';
import { createAutoHealing } from '../helpers/auto-healing.helper';

test.describe('Tracking Tests', () => {
    test.beforeEach(async ({ page }) => {
        await loginToApp(page);
        await page.waitForLoadState('load');
    });

    test('should access Tracking page', async ({ page }) => {
        test.setTimeout(60000);
        
        const healer = createAutoHealing(page);
        await healer.waitForStable();
        
        // Navigate to Tracking
        await healer.smartClick([
            'text=Tracking',
            'a:has-text("Tracking")',
            '[href*="tracking"]'
        ]);
        
        await page.waitForLoadState('load');
        await healer.waitForStable();
        
        // Verify page loaded
        const heading = page.locator('h1, h2, h3').first();
        await expect(heading).toBeVisible({ timeout: 10000 });
        
        console.log('✅ Tracking page loaded successfully');
    });


    test('should display Tracking list/table', async ({ page }) => {
        test.setTimeout(60000);
        
        const healer = createAutoHealing(page);
        
        // Navigate to Tracking
        await healer.smartClick(['text=Tracking']);
        await page.waitForLoadState('load');
        await healer.waitForStable();
        
        // Verify table/list is visible
        const table = page.locator('table, [role="grid"], [class*="list"]').first();
        await expect(table).toBeVisible({ timeout: 10000 });
        
        // Check if rows are present
        const rows = await page.locator('tr, [role="row"], [class*="item"]').count();
        console.log(`Found ${rows} rows/items in Tracking`);
        
        expect(rows).toBeGreaterThan(0);
    });




    test('should navigate through Tracking sections', async ({ page }) => {
        test.setTimeout(60000);
        
        const healer = createAutoHealing(page);
        
        // Navigate to Tracking
        await healer.smartClick(['text=Tracking']);
        await page.waitForLoadState('load');
        await healer.waitForStable();
        
        // Check for tabs or sub-navigation
        const tabs = page.locator('[role="tab"], .tab, [class*="tab"]');
        const tabCount = await tabs.count();
        
        if (tabCount > 0) {
            console.log(`Found ${tabCount} tabs in Tracking`);
            
            // Click first few tabs
            for (let i = 0; i < Math.min(tabCount, 3); i++) {
                const tab = tabs.nth(i);
                if (await tab.isVisible()) {
                    await tab.click();
                    await page.waitForTimeout(1000);
                }
            }
        }
        
        console.log('✅ Tracking navigation tested');
    });

});
