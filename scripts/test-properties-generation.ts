import { chromium } from '@playwright/test';

/**
 * Test script specifically for Properties module generation
 */

async function generatePropertiesTest() {
    const baseUrl = process.env.URL || 'https://app-staging.vivacityapp.com';
    const username = process.env.USERNAME || 'kc@vivacityapp.com';
    const password = process.env.PASSWORD || 'PAOpaopao@9696';

    console.log('🚀 Starting Properties test generation...');
    console.log(`URL: ${baseUrl}`);
    
    const browser = await chromium.launch({ headless: true }); // Run headless for faster execution
    const page = await browser.newPage();

    try {
        // Login
        console.log('🔐 Logging in...');
        await page.goto(baseUrl, { waitUntil: 'load', timeout: 60000 });
        
        await page.waitForSelector('input[name="username"]', { timeout: 10000 });
        await page.fill('input[name="username"]', username);
        await page.click('button[type="submit"]');
        
        await page.waitForSelector('input[name="password"]', { timeout: 10000 });
        await page.fill('input[name="password"]', password);
        await page.click('button[type="submit"]');
        
        // Wait for navigation after login
        await page.waitForLoadState('load', { timeout: 30000 });
        await page.waitForTimeout(3000);
        
        // Handle passkey enrollment
        const continueButton = page.locator('button:has-text("Continue"), a:has-text("Continue")').first();
        if (await continueButton.isVisible({ timeout: 5000 }).catch(() => false)) {
            await continueButton.click();
            await page.waitForLoadState('load', { timeout: 15000 });
            await page.waitForTimeout(2000);
        }
        
        await page.waitForTimeout(3000);
        
        console.log('✅ Login successful');
        console.log('📍 Current URL:', page.url());
        
        // Wait for page to fully load
        await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => console.log('  ℹ️  Network not idle, continuing...'));
        await page.waitForTimeout(5000); // Extra wait for dynamic content
        
        // Take screenshot
        await page.screenshot({ path: 'properties-debug-1-after-login.png', fullPage: true });
        console.log('📸 Screenshot 1 saved: properties-debug-1-after-login.png');
        
        // Debug: Get page HTML to see structure
        console.log('\n📄 Checking page structure...\n');
        const bodyText = await page.locator('body').textContent();
        if (bodyText?.toLowerCase().includes('properties')) {
            console.log('✅ "Properties" text found on page');
        } else {
            console.log('❌ "Properties" text NOT found on page');
        }
        
        // Look for Properties menu item
        console.log('\n🔍 Looking for Properties menu item...\n');
        
        // Try the exact selector from the existing test
        const propertiesMenuItem = page.getByRole('menuitem', { name: /properties/i });
        const hasProperties = await propertiesMenuItem.isVisible({ timeout: 5000 }).catch(() => false);
        
        if (hasProperties) {
            console.log('✅ Found Properties menu item!');
            console.log('📍 Clicking Properties...');
            
            await propertiesMenuItem.click();
            await page.waitForLoadState('load', { timeout: 10000 });
            await page.waitForTimeout(3000);
            
            console.log('✅ Navigated to Properties');
            console.log('📍 Current URL:', page.url());
            
            // Take screenshot of Properties page
            await page.screenshot({ path: 'properties-debug-2-properties-page.png', fullPage: true });
            console.log('📸 Screenshot 2 saved: properties-debug-2-properties-page.png');
            
            // Analyze the Properties page
            console.log('\n📊 Analyzing Properties page...\n');
            
            // Check for table
            const tableRows = page.locator('tbody tr, .v-data-table tbody tr, [role="row"]');
            const rowCount = await tableRows.count();
            console.log(`  📋 Table rows found: ${rowCount}`);
            
            // Check for buttons
            const buttons = await page.locator('button').allTextContents();
            const uniqueButtons = [...new Set(buttons.filter(b => b && b.trim()))];
            console.log(`  🔘 Buttons found: ${uniqueButtons.slice(0, 10).join(', ')}`);
            
            // Check for inputs
            const inputs = await page.locator('input').count();
            console.log(`  📝 Input fields found: ${inputs}`);
            
            // Check for search
            const searchInput = await page.locator('input[type="search"], input[placeholder*="search" i]').count();
            console.log(`  🔍 Search fields found: ${searchInput}`);
            
            // Check for add button
            const addButton = await page.locator('button:has-text("Add"), button:has-text("New"), button:has-text("Create")').count();
            console.log(`  ➕ Add/New/Create buttons found: ${addButton}`);
            
            // Get page title
            const title = await page.locator('h1, h2, h3').first().textContent().catch(() => 'No title found');
            console.log(`  📌 Page title: ${title}`);
            
            console.log('\n✅ Analysis complete!');
            console.log('\n💡 Properties page structure:');
            console.log(`  - Has table: ${rowCount > 0 ? 'Yes' : 'No'}`);
            console.log(`  - Has search: ${searchInput > 0 ? 'Yes' : 'No'}`);
            console.log(`  - Has add button: ${addButton > 0 ? 'Yes' : 'No'}`);
            
        } else {
            console.log('❌ Properties menu item not found');
            
            // Try looking for it with different selectors
            console.log('\n🔍 Trying alternative selectors...\n');
            
            // Try clicking anywhere with "properties" text
            const propertiesText = page.locator('text=/properties/i').first();
            if (await propertiesText.isVisible({ timeout: 2000 }).catch(() => false)) {
                console.log('✅ Found "properties" text element');
                const tagName = await propertiesText.evaluate(el => el.tagName);
                const text = await propertiesText.textContent();
                console.log(`  Tag: <${tagName}>, Text: "${text?.trim()}"`);
            }
            
            // Debug: List all menu items
            const allMenuItems = page.locator('[role="menuitem"]');
            const menuCount = await allMenuItems.count();
            console.log(`\n📋 Found ${menuCount} menu items with role="menuitem":`);
            for (let i = 0; i < Math.min(menuCount, 20); i++) {
                const text = await allMenuItems.nth(i).textContent();
                console.log(`  ${i + 1}. "${text?.trim()}"`);
            }
            
            // Debug: List all buttons
            const allButtons = page.locator('button');
            const buttonCount = await allButtons.count();
            console.log(`\n🔘 Found ${buttonCount} buttons (showing first 20):`);
            for (let i = 0; i < Math.min(buttonCount, 20); i++) {
                const text = await allButtons.nth(i).textContent();
                if (text?.trim()) {
                    console.log(`  ${i + 1}. "${text.trim()}"`);
                }
            }
            
            // Debug: List all links
            const allLinks = page.locator('a');
            const linkCount = await allLinks.count();
            console.log(`\n🔗 Found ${linkCount} total links (showing first 30):`);
            for (let i = 0; i < Math.min(linkCount, 30); i++) {
                const text = await allLinks.nth(i).textContent();
                const href = await allLinks.nth(i).getAttribute('href');
                if (text?.trim()) {
                    console.log(`  ${i + 1}. "${text.trim()}" -> ${href || 'N/A'}`);
                }
            }
            
            // Debug: Look for navigation elements
            console.log('\n🧭 Looking for navigation elements...\n');
            const navElements = page.locator('nav, [role="navigation"], aside, [class*="nav"], [class*="menu"], [class*="sidebar"]');
            const navCount = await navElements.count();
            console.log(`Found ${navCount} potential navigation elements`);
            for (let i = 0; i < Math.min(navCount, 5); i++) {
                const tagName = await navElements.nth(i).evaluate(el => el.tagName);
                const className = await navElements.nth(i).getAttribute('class');
                const role = await navElements.nth(i).getAttribute('role');
                console.log(`  ${i + 1}. <${tagName}> class="${className?.substring(0, 50) || 'N/A'}" role="${role || 'N/A'}"`);
            }
        }
        
        // Remove the old debug section that was here
        console.log('\n⏸️ Not pausing - script complete');
        
    } catch (error) {
        console.error('❌ Error:', error);
        await page.screenshot({ path: 'properties-debug-error.png', fullPage: true });
        console.log('📸 Error screenshot saved: properties-debug-error.png');
    } finally {
        await browser.close();
        console.log('✅ Test complete');
    }
}

generatePropertiesTest();
