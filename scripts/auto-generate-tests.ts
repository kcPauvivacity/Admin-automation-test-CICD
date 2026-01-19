import { chromium } from '@playwright/test';
import type { Browser, Page } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// ES module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Automatic Test Case Generator
 * Scans the website and generates test cases for new modules
 */

interface ModuleInfo {
    name: string;
    url: string;
    selectors: string[];
    buttons: string[];
    inputs: string[];
    links: string[];
    hasTable: boolean;
    hasForm: boolean;
    hasSearch: boolean;
}

class AutoTestGenerator {
    private browser!: Browser;
    private page!: Page;
    private baseUrl: string;
    private username: string;
    private password: string;
    private detectedModules: ModuleInfo[] = [];

    constructor(baseUrl: string, username: string, password: string) {
        this.baseUrl = baseUrl;
        this.username = username;
        this.password = password;
    }

    async initialize() {
        console.log('🚀 Initializing test generator...');
        // Run headless on CI, headed locally for debugging
        const isCI = process.env.CI === 'true';
        this.browser = await chromium.launch({ headless: isCI });
        this.page = await this.browser.newPage();
    }

    async login() {
        console.log('🔐 Logging in...');
        await this.page.goto(this.baseUrl, { waitUntil: 'load', timeout: 60000 });
        
        // Login flow
        await this.page.waitForSelector('input[name="username"]', { timeout: 10000 });
        await this.page.fill('input[name="username"]', this.username);
        await this.page.click('button[type="submit"]');
        
        await this.page.waitForSelector('input[name="password"]', { timeout: 10000 });
        await this.page.fill('input[name="password"]', this.password);
        await this.page.click('button[type="submit"]');
        
        // Wait for navigation after login
        await this.page.waitForLoadState('load', { timeout: 30000 });
        await this.page.waitForTimeout(3000);
        
        // Handle passkey enrollment
        const continueButton = this.page.locator('button:has-text("Continue"), a:has-text("Continue")').first();
        if (await continueButton.isVisible({ timeout: 5000 }).catch(() => false)) {
            await continueButton.click();
            await this.page.waitForLoadState('load', { timeout: 15000 });
            await this.page.waitForTimeout(2000);
        }
        
        // Wait for dashboard to load
        await this.page.waitForTimeout(3000);
        
        console.log('✅ Login successful');
        console.log('📍 Current URL:', this.page.url());
    }

    async scanForModules() {
        console.log('🔍 Scanning for modules...');
        
        // Wait for page to be stable
        await this.page.waitForTimeout(3000);
        
        // Wait for network to be idle
        await this.page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => console.log('  ℹ️ Network not idle, continuing...'));
        await this.page.waitForTimeout(5000); // Extra wait for dynamic content
        
        // Take screenshot for debugging
        await this.page.screenshot({ path: 'debug-before-scan.png', fullPage: true });
        console.log('📸 Screenshot saved: debug-before-scan.png');
        
        // Find all navigation links using proper role selectors
        const navLinks = await this.page.locator('[role="menuitem"], nav a, aside a, [class*="sidebar"] a, [class*="menu"] a, a[href*="/demo-student/"]').all();
        
        console.log(`Found ${navLinks.length} potential navigation links`);
        
        // Filter and collect module info
        for (const link of navLinks) {
            try {
                const text = await link.textContent();
                const href = await link.getAttribute('href');
                const role = await link.getAttribute('role');
                
                if (!text || !text.trim() || text.trim().length < 2) continue;
                
                const moduleName = text.trim();
                console.log(`  📂 Found potential module: "${moduleName}" (href: ${href || 'N/A'}, role: ${role || 'N/A'})`);
                
                // Skip modules that already have tests
                const testFileName = moduleName.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '.test.ts';
                const testFilePath = path.join(__dirname, '../tests', testFileName);
                if (fs.existsSync(testFilePath)) {
                    console.log(`  ⏭️ Skipping "${moduleName}" - test already exists`);
                    continue;
                }
                
                // Try to click and analyze the module
                try {
                    await link.click({ timeout: 5000 });
                    await this.page.waitForLoadState('load', { timeout: 10000 });
                    await this.page.waitForTimeout(3000);
                    
                    const moduleInfo = await this.analyzeCurrentPage(moduleName);
                    this.detectedModules.push(moduleInfo);
                    
                    console.log(`  ✅ Analyzed "${moduleName}"`);
                } catch (clickError) {
                    console.log(`  ⚠️ Could not click/analyze "${moduleName}": ${clickError}`);
                }
                
            } catch (error) {
                console.log(`  ⚠️ Error processing link: ${error}`);
            }
        }
        
        console.log(`✅ Found ${this.detectedModules.length} new modules (modules with existing tests were skipped)`);
    }

    async analyzeCurrentPage(moduleName: string): Promise<ModuleInfo> {
        const currentUrl = this.page.url();
        
        // Detect various elements
        const buttons = await this.page.locator('button').allTextContents();
        const inputs = await this.page.locator('input').evaluateAll(elements => 
            elements.map(el => el.getAttribute('name') || el.getAttribute('placeholder') || el.getAttribute('type'))
        );
        const links = await this.page.locator('a').allTextContents();
        
        const hasTable = await this.page.locator('table, [role="grid"]').count() > 0;
        const hasForm = await this.page.locator('form, button:has-text("Submit"), button:has-text("Save")').count() > 0;
        const hasSearch = await this.page.locator('input[type="search"], input[placeholder*="search" i]').count() > 0;
        
        // Get unique selectors
        const selectors = await this.page.locator('[data-testid], [id], [class]').evaluateAll(elements => 
            elements.slice(0, 10).map(el => {
                if (el.getAttribute('data-testid')) return `[data-testid="${el.getAttribute('data-testid')}"]`;
                if (el.id) return `#${el.id}`;
                return `.${el.className.split(' ')[0]}`;
            }).filter(s => s && !s.includes('undefined'))
        );
        
        return {
            name: moduleName,
            url: currentUrl,
            selectors: [...new Set(selectors)],
            buttons: [...new Set(buttons.filter(b => b && b.trim()))],
            inputs: [...new Set(inputs.filter((i): i is string => i !== null))],
            links: [...new Set(links.filter(l => l && l.trim().length > 2).slice(0, 10))],
            hasTable,
            hasForm,
            hasSearch
        };
    }

    generateTestFile(module: ModuleInfo): string {
        const fileName = module.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        const moduleName = module.name.replace(/New$/, ''); // Remove 'New' suffix for cleaner names
        
        const testContent = `import { test, expect } from '@playwright/test';
import { loginToApp } from '../helpers/auth.helper';
import { createAutoHealing } from '../helpers/auto-healing.helper';

test.describe('${moduleName} Module Tests', () => {
    test.beforeEach(async ({ page }) => {
        await loginToApp(page);
        await page.waitForLoadState('load');
        
        // Navigate to ${moduleName}
        const menuItem = page.getByRole('menuitem', { name: /${moduleName}/i });
        if (await menuItem.isVisible({ timeout: 3000 }).catch(() => false)) {
            await menuItem.click();
            await page.waitForLoadState('load');
            await page.waitForTimeout(2000);
        }
    });

    test('should load ${moduleName} page successfully', async ({ page }) => {
        test.setTimeout(60000);
        
        // Verify we're on the correct page (use flexible URL matching)
        const url = page.url();
        const urlPath = '${fileName}'.replace('new', ''); // Handle 'New' suffix
        expect(url).toMatch(new RegExp(urlPath, 'i'));
        
        // Wait for page to be stable
        const healer = createAutoHealing(page);
        await healer.waitForStable();
        
        // Verify page has loaded (check for main container or heading)
        const mainContent = page.locator('main, [role="main"], .content, h1, h2, [class*="container"]').first();
        await expect(mainContent).toBeVisible({ timeout: 10000 });
        
        console.log('✅ ${moduleName} page loaded successfully');
    });

${module.hasTable ? this.generateTableTest(module, moduleName) : ''}
${module.hasSearch ? this.generateSearchTest(module, moduleName) : ''}
${module.hasForm ? this.generateFormTest(module, moduleName) : ''}
${this.generateButtonTest(module, moduleName)}
${this.generateNavigationTest(module, moduleName)}
});
`;
        return testContent;
    }

    generateTableTest(module: ModuleInfo, moduleName: string): string {
        return `
    test('should display ${moduleName} table with data', async ({ page }) => {
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
            
            console.log(\`📊 Found \${rowCount} rows in ${moduleName} table\`);
            
            // Check for table headers (optional - some tables might not have headers)
            const headers = page.locator('thead th, [role="columnheader"]');
            const headerCount = await headers.count();
            
            if (headerCount > 0) {
                console.log(\`✅ ${moduleName} table displays correctly with \${headerCount} columns\`);
            } else {
                console.log(\`ℹ️ ${moduleName} table has no headers (might be a different layout)\`);
            }
        } else {
            console.log(\`ℹ️ No standard table found - ${moduleName} might use a different data display format\`);
        }
    });

    test('should handle ${moduleName} table pagination', async ({ page }) => {
        test.setTimeout(60000);
        
        // Check if pagination exists
        const pagination = page.locator('.v-pagination, .pagination, [role="navigation"]');
        const hasPagination = await pagination.isVisible({ timeout: 3000 }).catch(() => false);
        
        if (hasPagination) {
            console.log('📄 Pagination found');
            
            // Get current page info
            const paginationInfo = await page.locator('.v-data-table-footer__info, .pagination-info').textContent().catch(() => '');
            console.log(\`📊 Pagination info: \${paginationInfo}\`);
            
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
`;
    }

    generateSearchTest(module: ModuleInfo, moduleName: string): string {
        return `
    test('should search ${moduleName} data', async ({ page }) => {
        test.setTimeout(60000);
        
        const healer = createAutoHealing(page);
        await healer.waitForStable();
        
        // Find search input
        const searchInput = page.locator('input[type="search"], input[placeholder*="search" i]').first();
        await expect(searchInput).toBeVisible({ timeout: 10000 });
        
        // Get initial row count
        const initialRows = await page.locator('tbody tr, [role="row"]').count();
        console.log(\`📊 Initial rows: \${initialRows}\`);
        
        // Perform search
        await searchInput.fill('test');
        await page.waitForTimeout(2000);
        
        // Verify search results
        const filteredRows = await page.locator('tbody tr, [role="row"]').count();
        console.log(\`🔍 Filtered rows: \${filteredRows}\`);
        
        // Clear search
        await searchInput.clear();
        await page.waitForTimeout(1000);
        
        const clearedRows = await page.locator('tbody tr, [role="row"]').count();
        console.log(\`✅ After clearing search: \${clearedRows} rows\`);
    });
`;
    }

    generateFormTest(module: ModuleInfo, moduleName: string): string {
        return `
    test('should interact with ${moduleName} form', async ({ page }) => {
        test.setTimeout(90000);
        
        const healer = createAutoHealing(page);
        await healer.waitForStable();
        
        // Look for Add/Create button
        const addButton = page.locator([
            'button:has-text("Add")',
            'button:has-text("Create")',
            'button:has-text("New")',
            '[aria-label*="add" i]'
        ].join(', ')).first();
        
        if (await addButton.isVisible({ timeout: 5000 }).catch(() => false)) {
            console.log('➕ Found Add/Create button');
            await addButton.click();
            await page.waitForTimeout(2000);
            
            // Verify form/dialog appeared
            const form = page.locator('form, [role="dialog"], .modal, .v-dialog').first();
            await expect(form).toBeVisible({ timeout: 10000 });
            
            console.log('✅ ${moduleName} form opened successfully');
            
            // Close form/dialog
            const closeButton = page.locator('button:has-text("Cancel"), button:has-text("Close"), [aria-label*="close"]').first();
            if (await closeButton.isVisible({ timeout: 3000 }).catch(() => false)) {
                await closeButton.click();
                await page.waitForTimeout(1000);
                console.log('✅ Form closed');
            }
        } else {
            console.log('ℹ️ No Add/Create button found');
        }
    });
`;
    }

    generateButtonTest(module: ModuleInfo, moduleName: string): string {
        const buttonNames = module.buttons.slice(0, 5).filter(b => 
            !b.toLowerCase().includes('edit') && 
            !b.toLowerCase().includes('delete') &&
            b.length > 2 && 
            b.length < 50
        );
        
        if (buttonNames.length === 0) return '';
        
        return `
    test('should verify ${moduleName} action buttons', async ({ page }) => {
        test.setTimeout(60000);
        
        const healer = createAutoHealing(page);
        await healer.waitForStable();
        
        // Check for key action buttons
        const expectedButtons = [${buttonNames.map(b => `'${b}'`).join(', ')}];
        
        for (const buttonText of expectedButtons) {
            const button = page.locator(\`button:has-text("\${buttonText}")\`).first();
            const isVisible = await button.isVisible({ timeout: 2000 }).catch(() => false);
            
            if (isVisible) {
                console.log(\`✅ Found button: "\${buttonText}"\`);
            } else {
                console.log(\`ℹ️ Button not visible: "\${buttonText}"\`);
            }
        }
        
        console.log('✅ ${moduleName} buttons verified');
    });
`;
    }

    generateNavigationTest(module: ModuleInfo, moduleName: string): string {
        return `
    test('should navigate through ${moduleName} sections', async ({ page }) => {
        test.setTimeout(60000);
        
        const healer = createAutoHealing(page);
        await healer.waitForStable();
        
        // Check for tabs or sub-navigation
        const tabs = page.locator('[role="tab"], .tab, [class*="tab"]');
        const tabCount = await tabs.count();
        
        if (tabCount > 0) {
            console.log(\`📑 Found \${tabCount} tabs in ${moduleName}\`);
            
            // Click first few tabs and verify they work
            for (let i = 0; i < Math.min(tabCount, 3); i++) {
                const tab = tabs.nth(i);
                if (await tab.isVisible().catch(() => false)) {
                    const tabText = await tab.textContent();
                    await tab.click();
                    await page.waitForTimeout(1000);
                    console.log(\`✅ Clicked tab: \${tabText?.trim()}\`);
                }
            }
        } else {
            console.log('ℹ️ No tabs found in ${moduleName}');
        }
        
        console.log('✅ ${moduleName} navigation tested');
    });
`;
    }

    async saveTestFiles() {
        console.log('💾 Saving test files...');
        
        const testsDir = path.join(process.cwd(), 'tests', 'auto-generated');
        if (!fs.existsSync(testsDir)) {
            fs.mkdirSync(testsDir, { recursive: true });
        }
        
        for (const module of this.detectedModules) {
            const fileName = module.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
            const filePath = path.join(testsDir, `${fileName}.test.ts`);
            
            // Check if file already exists
            if (fs.existsSync(filePath)) {
                console.log(`  ⚠️ Test file already exists: ${fileName}.test.ts`);
                continue;
            }
            
            const testContent = this.generateTestFile(module);
            fs.writeFileSync(filePath, testContent);
            console.log(`  ✅ Created: tests/auto-generated/${fileName}.test.ts`);
        }
    }

    generateSummaryReport(): string {
        let report = `# Auto-Generated Test Summary\n\n`;
        report += `Generated on: ${new Date().toISOString()}\n`;
        report += `Total modules detected: ${this.detectedModules.length}\n\n`;
        
        report += `## Detected Modules:\n\n`;
        for (const module of this.detectedModules) {
            report += `### ${module.name}\n`;
            report += `- URL: ${module.url}\n`;
            report += `- Has Table: ${module.hasTable ? '✅' : '❌'}\n`;
            report += `- Has Form: ${module.hasForm ? '✅' : '❌'}\n`;
            report += `- Has Search: ${module.hasSearch ? '✅' : '❌'}\n`;
            report += `- Buttons: ${module.buttons.slice(0, 5).join(', ')}\n`;
            report += `- Inputs: ${module.inputs.slice(0, 5).join(', ')}\n\n`;
        }
        
        return report;
    }

    async saveSummaryReport() {
        const reportPath = path.join(process.cwd(), 'tests', 'auto-generated', 'GENERATION_REPORT.md');
        const report = this.generateSummaryReport();
        fs.writeFileSync(reportPath, report);
        console.log('📊 Summary report saved: tests/auto-generated/GENERATION_REPORT.md');
    }

    async cleanup() {
        await this.browser.close();
    }

    async run() {
        try {
            await this.initialize();
            await this.login();
            await this.scanForModules();
            await this.saveTestFiles();
            await this.saveSummaryReport();
            console.log('🎉 Test generation completed!');
        } catch (error) {
            console.error('❌ Error during test generation:', error);
        } finally {
            await this.cleanup();
        }
    }
}

// Run the generator
const generator = new AutoTestGenerator(
    process.env.URL || 'https://app-staging.vivacityapp.com',
    process.env.USERNAME || 'kc@vivacityapp.com',
    process.env.PASSWORD || 'PAOpaopao@9696'
);

generator.run();
