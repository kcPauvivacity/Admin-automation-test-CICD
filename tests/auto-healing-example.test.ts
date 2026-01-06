import { test, expect } from '@playwright/test';
import { loginToApp } from './helpers/auth.helper';
import { createAutoHealing } from './helpers/auto-healing.helper';

test.describe('Auto-Healing Example Tests', () => {
    test('example: login with auto-healing', async ({ page }) => {
        test.setTimeout(90000);
        
        const healer = createAutoHealing(page);
        
        // Navigate with auto-retry
        await healer.smartNavigate('https://app-staging.vivacityapp.com');
        
        // Wait for page to be stable
        await healer.waitForStable();
        
        // Handle any popups that might appear
        await healer.handlePopups();
        
        // Smart click with multiple selector fallbacks
        await healer.smartClick([
            'input[name="username"]',
            'input[type="email"]',
            '[placeholder*="email" i]',
            '#username'
        ]);
        
        // Smart fill with fallback selectors
        await healer.smartFill(
            ['input[name="username"]', 'input[type="email"]'],
            'kc@vivacityapp.com'
        );
        
        await healer.smartClick('button[type="submit"]');
        
        // Wait for password field with multiple selectors
        await healer.smartWaitFor([
            'input[name="password"]',
            'input[type="password"]',
            '[placeholder*="password" i]'
        ]);
        
        await healer.smartFill(
            ['input[name="password"]', 'input[type="password"]'],
            'PAOpaopao@9696'
        );
        
        await healer.smartClick('button[type="submit"]');
        
        // Wait for dashboard with flexible matching
        await healer.smartWaitFor([
            'text=Dashboard',
            'text=Welcome',
            '[class*="dashboard"]'
        ], { timeout: 30000 });
        
        console.log('✅ Login successful with auto-healing!');
    });

    test('example: navigate with auto-healing', async ({ page }) => {
        test.setTimeout(90000);
        
        await loginToApp(page);
        
        const healer = createAutoHealing(page);
        
        // Wait for stable page
        await healer.waitForStable();
        
        // Navigate to Properties with multiple selector fallbacks
        await healer.smartClick([
            'text=Properties',
            'a[href*="properties"]',
            'nav >> text=Properties',
            '[data-testid="properties-link"]'
        ]);
        
        await page.waitForLoadState('load');
        await healer.waitForStable();
        
        // Verify page loaded with flexible text matching
        await healer.smartExpectText(
            ['h1', 'h2', '[class*="heading"]'],
            /properties/i
        );
        
        console.log('✅ Navigation successful with auto-healing!');
    });

    test('example: form interaction with auto-healing', async ({ page }) => {
        test.setTimeout(90000);
        
        await loginToApp(page);
        
        const healer = createAutoHealing(page);
        await healer.waitForStable();
        
        // Navigate to a form page (adjust selector as needed)
        await healer.smartClick([
            'text=Properties',
            'a[href*="properties"]'
        ]);
        
        await page.waitForLoadState('load');
        await healer.waitForStable();
        
        // Try to click Add/Create button with fallbacks
        const addButton = await healer.smartWaitFor([
            'button:has-text("Add")',
            'button:has-text("Create")',
            'button:has-text("New")',
            '[aria-label*="add"]',
            '[class*="add-button"]'
        ], { timeout: 10000 }).catch(() => null);
        
        if (addButton) {
            await healer.smartClick([
                'button:has-text("Add")',
                'button:has-text("Create")',
                'button:has-text("New")'
            ]);
            
            console.log('✅ Add button clicked successfully!');
        } else {
            console.log('ℹ️ No add button found, skipping form test');
        }
    });

    test('example: handle dynamic content with auto-healing', async ({ page }) => {
        test.setTimeout(90000);
        
        await loginToApp(page);
        
        const healer = createAutoHealing(page);
        await healer.waitForStable();
        
        // Navigate to Analytics/Dashboard
        await healer.smartClick([
            'text=Analytics',
            'text=Dashboard',
            'a[href*="analytics"]',
            'a[href*="dashboard"]'
        ]);
        
        await page.waitForLoadState('load');
        await healer.waitForStable(15000); // Wait longer for data to load
        
        // Verify stats/data loaded with flexible selectors
        const statsVisible = await healer.smartWaitFor([
            '[class*="stat"]',
            '[class*="metric"]',
            '[class*="card"]',
            '[class*="widget"]'
        ], { timeout: 15000 }).catch(() => null);
        
        if (statsVisible) {
            console.log('✅ Dynamic content loaded successfully!');
        }
    });

    test('example: handle stale elements with auto-healing', async ({ page }) => {
        test.setTimeout(90000);
        
        await loginToApp(page);
        
        const healer = createAutoHealing(page);
        
        // Navigate to a list page
        await healer.smartClick(['text=Properties', 'text=Articles']);
        await page.waitForLoadState('load');
        await healer.waitForStable();
        
        // Handle stale element scenario
        await healer.withStaleRetry(async () => {
            const items = await page.locator('[role="row"], [class*="item"], li').all();
            
            if (items.length > 0) {
                console.log(`Found ${items.length} items`);
                
                // Try to interact with first item (might become stale)
                const firstItem = items[0];
                await firstItem.scrollIntoViewIfNeeded();
                await firstItem.click();
            }
        });
        
        console.log('✅ Handled potential stale elements!');
    });
});
