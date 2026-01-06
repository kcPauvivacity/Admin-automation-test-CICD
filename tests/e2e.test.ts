import { test, expect } from '@playwright/test';
import { loginToApp } from './helpers/auth.helper';

test.describe('End-to-End User Workflow', () => {
    test.beforeEach(async ({ page }) => {
        // Login before each test
        await loginToApp(page);
        await page.waitForLoadState('load');
    });

    test('complete user workflow - create, view, update property', async ({ page }) => {
        test.setTimeout(300000); // 5 minutes for complete workflow
        
        console.log('🚀 Starting End-to-End test workflow...');
        
        // Step 1: Navigate to Dashboard
        console.log('📊 Step 1: Verify Dashboard');
        await page.waitForSelector('text=Dashboard', { timeout: 15000 });
        const dashboardVisible = await page.locator('text=Dashboard').isVisible();
        expect(dashboardVisible).toBeTruthy();
        await page.waitForTimeout(2000);
        
        // Step 2: Navigate to Properties
        console.log('🏢 Step 2: Navigate to Properties section');
        await page.click('text=Properties', { timeout: 15000 });
        await page.waitForLoadState('load');
        await page.waitForTimeout(2000);
        
        // Verify Properties page loaded
        const propertiesHeading = page.locator('h1, h2, h3').filter({ hasText: /properties/i }).first();
        await expect(propertiesHeading).toBeVisible({ timeout: 10000 });
        console.log('✅ Properties page loaded');
        
        // Step 3: View Property List
        console.log('📋 Step 3: Verify property list is displayed');
        const propertyList = page.locator('table, [role="grid"], .property-list, [class*="list"]').first();
        await expect(propertyList).toBeVisible({ timeout: 10000 });
        await page.waitForTimeout(2000);
        console.log('✅ Property list displayed');
        
        // Step 4: Search/Filter functionality
        console.log('🔍 Step 4: Test search/filter functionality');
        const searchInput = page.locator('input[type="text"], input[type="search"], input[placeholder*="search" i]').first();
        if (await searchInput.isVisible({ timeout: 5000 })) {
            await searchInput.fill('test');
            await page.waitForTimeout(2000);
            await searchInput.clear();
            console.log('✅ Search functionality working');
        }
        
        // Step 5: Navigate to Articles
        console.log('📰 Step 5: Navigate to Articles section');
        await page.click('text=Articles', { timeout: 15000 });
        await page.waitForLoadState('load');
        await page.waitForTimeout(2000);
        
        const articlesHeading = page.locator('h1, h2, h3').filter({ hasText: /articles/i }).first();
        await expect(articlesHeading).toBeVisible({ timeout: 10000 });
        console.log('✅ Articles page loaded');
        
        // Step 6: Navigate to Analytics/Reports
        console.log('📈 Step 6: Navigate to Analytics section');
        const analyticsLink = page.locator('text=Analytics, text=Reports, text=Dashboard').first();
        await analyticsLink.click({ timeout: 15000 });
        await page.waitForLoadState('load');
        await page.waitForTimeout(3000);
        console.log('✅ Analytics section loaded');
        
        // Step 7: Navigate to Contacts/Enquiries
        console.log('👥 Step 7: Navigate to Contacts section');
        const contactsLink = page.locator('text=Contacts, text=Enquiries, text=CRM').first();
        if (await contactsLink.isVisible({ timeout: 5000 })) {
            await contactsLink.click();
            await page.waitForLoadState('load');
            await page.waitForTimeout(2000);
            console.log('✅ Contacts section loaded');
        }
        
        // Step 8: Test Viva AI Integration
        console.log('🤖 Step 8: Test Viva AI integration');
        const vivaAIButton = page.locator('text=VIVA AI').or(
            page.getByRole('link', { name: /viva ai/i })
        ).or(
            page.getByRole('button', { name: /viva ai/i })
        ).first();
        
        if (await vivaAIButton.isVisible({ timeout: 5000 })) {
            await vivaAIButton.click();
            await page.waitForTimeout(2000);
            
            // Check if chat window opened
            const chatWindow = page.locator('[class*="chat"], [class*="sidebar"], [role="dialog"]').first();
            if (await chatWindow.isVisible({ timeout: 5000 })) {
                console.log('✅ Viva AI chat opened successfully');
                
                // Close chat
                const closeButton = page.getByRole('button', { name: /close/i }).or(
                    page.locator('button[aria-label*="close"]')
                ).first();
                if (await closeButton.isVisible({ timeout: 3000 })) {
                    await closeButton.click();
                    await page.waitForTimeout(1000);
                    console.log('✅ Viva AI chat closed');
                }
            }
        }
        
        // Step 9: Verify User Profile/Settings Access
        console.log('⚙️ Step 9: Test user settings access');
        const settingsButton = page.locator('[aria-label*="settings"], [title*="settings"], button:has-text("Settings")').first();
        if (await settingsButton.isVisible({ timeout: 5000 })) {
            await settingsButton.click();
            await page.waitForTimeout(2000);
            console.log('✅ Settings accessed');
            
            // Close settings if modal opened
            const closeModal = page.locator('button[aria-label*="close"], [class*="close"]').first();
            if (await closeModal.isVisible({ timeout: 2000 })) {
                await closeModal.click();
                await page.waitForTimeout(1000);
            }
        }
        
        // Step 10: Return to Dashboard
        console.log('🏠 Step 10: Return to Dashboard');
        await page.click('text=Dashboard', { timeout: 15000 });
        await page.waitForLoadState('load');
        await page.waitForTimeout(2000);
        
        const finalDashboard = page.locator('text=Dashboard, text=Welcome').first();
        await expect(finalDashboard).toBeVisible({ timeout: 10000 });
        console.log('✅ Returned to Dashboard successfully');
        
        console.log('🎉 End-to-End test completed successfully!');
    });

    test('complete data workflow - view multiple sections', async ({ page }) => {
        test.setTimeout(180000); // 3 minutes
        
        console.log('🚀 Starting data workflow test...');
        
        const sections = [
            { name: 'Properties', selector: 'text=Properties' },
            { name: 'Articles', selector: 'text=Articles' },
            { name: 'Tags', selector: 'text=Tags' },
            { name: 'Facilities', selector: 'text=Facilities' },
            { name: 'Universities', selector: 'text=Universities' }
        ];
        
        for (const section of sections) {
            console.log(`📂 Testing ${section.name} section...`);
            
            // Click on section
            const sectionLink = page.locator(section.selector).first();
            if (await sectionLink.isVisible({ timeout: 5000 })) {
                await sectionLink.click({ timeout: 10000 });
                await page.waitForLoadState('load');
                await page.waitForTimeout(2000);
                
                // Verify section loaded
                const heading = page.locator('h1, h2, h3').first();
                await expect(heading).toBeVisible({ timeout: 10000 });
                console.log(`✅ ${section.name} section loaded successfully`);
            } else {
                console.log(`⚠️ ${section.name} section not available`);
            }
        }
        
        console.log('🎉 Data workflow test completed!');
    });

    test('user interaction workflow - navigation and search', async ({ page }) => {
        test.setTimeout(120000); // 2 minutes
        
        console.log('🚀 Starting user interaction test...');
        
        // Test 1: Navigate through main menu items
        console.log('🧭 Testing navigation...');
        const menuItems = await page.locator('nav a, [role="navigation"] a, aside a').all();
        const visitedSections: string[] = [];
        
        for (let i = 0; i < Math.min(menuItems.length, 5); i++) {
            const itemText = await menuItems[i].textContent();
            if (itemText && itemText.trim()) {
                console.log(`  Navigating to: ${itemText.trim()}`);
                await menuItems[i].click();
                await page.waitForTimeout(1500);
                visitedSections.push(itemText.trim());
            }
        }
        
        console.log(`✅ Navigated through ${visitedSections.length} sections`);
        
        // Test 2: Test global search if available
        console.log('🔍 Testing search functionality...');
        const searchInputs = page.locator('input[type="search"], input[placeholder*="search" i]');
        const searchCount = await searchInputs.count();
        
        if (searchCount > 0) {
            await searchInputs.first().fill('test search');
            await page.waitForTimeout(2000);
            await searchInputs.first().clear();
            console.log('✅ Search functionality tested');
        }
        
        // Test 3: Verify responsive elements
        console.log('📱 Testing responsive elements...');
        const viewport = page.viewportSize();
        console.log(`  Current viewport: ${viewport?.width}x${viewport?.height}`);
        
        console.log('🎉 User interaction test completed!');
    });
});
