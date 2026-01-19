import { chromium } from '@playwright/test';

/**
 * Debug script to see what navigation elements exist on the page
 */

async function debugNavigation() {
    const baseUrl = process.env.URL || 'https://app-staging.vivacityapp.com';
    const username = process.env.USERNAME || '';
    const password = process.env.PASSWORD || '';

    console.log('🚀 Starting navigation debug...');
    console.log(`URL: ${baseUrl}`);
    
    const browser = await chromium.launch({ headless: false }); // Run headed to see what's happening
    const page = await browser.newPage();

    try {
        // Login
        console.log('🔐 Logging in...');
        await page.goto(baseUrl, { waitUntil: 'networkidle', timeout: 60000 });
        
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
        
        // Debug: Take a screenshot
        await page.screenshot({ path: 'debug-after-login.png', fullPage: true });
        console.log('📸 Screenshot saved: debug-after-login.png');
        
        // Try different selectors to find navigation
        console.log('\n🔍 Checking different selectors...\n');
        
        const selectors = [
            'a',
            'nav a',
            'aside a',
            '[class*="sidebar"] a',
            '[class*="menu"] a',
            '[role="navigation"] a',
            'a[href*="/"]',
            'button',
            '[class*="nav"]',
            '[id*="nav"]',
            '[class*="Menu"]',
            '[class*="Sidebar"]',
        ];
        
        for (const selector of selectors) {
            const elements = await page.locator(selector).all();
            console.log(`\n📌 Selector: "${selector}" - Found ${elements.length} elements`);
            
            if (elements.length > 0 && elements.length < 50) {
                for (let i = 0; i < Math.min(elements.length, 10); i++) {
                    const text = await elements[i].textContent();
                    const href = await elements[i].getAttribute('href');
                    const className = await elements[i].getAttribute('class');
                    if (text?.trim()) {
                        console.log(`  ${i + 1}. Text: "${text.trim()}" | Href: ${href || 'N/A'} | Class: ${className?.substring(0, 50) || 'N/A'}`);
                    }
                }
            }
        }
        
        // Look specifically for "Properties"
        console.log('\n🏠 Looking specifically for "Properties"...\n');
        const propertiesLinks = await page.locator('text=/properties/i, a:has-text("Properties"), a:has-text("properties"), button:has-text("Properties"), button:has-text("properties")').all();
        console.log(`Found ${propertiesLinks.length} elements with "Properties"`);
        for (let i = 0; i < propertiesLinks.length; i++) {
            const text = await propertiesLinks[i].textContent();
            const tag = await propertiesLinks[i].evaluate(el => el.tagName);
            const href = await propertiesLinks[i].getAttribute('href');
            console.log(`  ${i + 1}. <${tag}> "${text?.trim()}" | Href: ${href || 'N/A'}`);
        }
        
        // Get page HTML structure (first 5000 chars)
        console.log('\n📄 Page HTML structure (first part):\n');
        const html = await page.content();
        console.log(html.substring(0, 3000));
        
        console.log('\n⏸️ Pausing for 30 seconds so you can inspect the page...');
        await page.waitForTimeout(30000);
        
    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await browser.close();
        console.log('✅ Debug complete');
    }
}

debugNavigation();
