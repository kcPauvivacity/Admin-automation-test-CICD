import { chromium } from '@playwright/test';
import type { Browser, Page } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';

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
        await this.page.goto(this.baseUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
        
        // Login flow
        await this.page.waitForSelector('input[name="username"]', { timeout: 10000 });
        await this.page.fill('input[name="username"]', this.username);
        await this.page.click('button[type="submit"]');
        
        await this.page.waitForSelector('input[name="password"]', { timeout: 10000 });
        await this.page.fill('input[name="password"]', this.password);
        await this.page.click('button[type="submit"]');
        
        // Wait for navigation after login
        await this.page.waitForTimeout(5000);
        
        // Handle passkey enrollment with longer timeout
        const continueButton = this.page.locator('button:has-text("Continue"), a:has-text("Continue")').first();
        try {
            if (await continueButton.isVisible({ timeout: 5000 })) {
                await continueButton.click();
                await this.page.waitForTimeout(3000);
            }
        } catch (error) {
            console.log('  ℹ️ No passkey enrollment prompt');
        }
        
        // Wait for dashboard to load
        await this.page.waitForLoadState('domcontentloaded', { timeout: 60000 });
        await this.page.waitForTimeout(2000);
        
        console.log('✅ Login successful');
    }

    async scanForModules() {
        console.log('🔍 Scanning for modules...');
        
        // Wait for page to be stable
        await this.page.waitForTimeout(3000);
        
        // Find all navigation links - improved selectors for your app
        const navLinks = await this.page.locator('a[href*="/demo-student/"], nav a, aside a, [class*="sidebar"] a, [class*="menu"] a').all();
        
        console.log(`Found ${navLinks.length} potential navigation links`);
        
        for (const link of navLinks) {
            try {
                const text = await link.textContent();
                const href = await link.getAttribute('href');
                
                if (!text || !text.trim() || text.trim().length < 2) continue;
                if (!href || href === '#' || href === 'javascript:void(0)') continue;
                
                const moduleName = text.trim();
                console.log(`  📂 Found module: ${moduleName}`);
                
                // Click and analyze the module
                await link.click({ timeout: 5000 });
                await this.page.waitForTimeout(3000);
                
                const moduleInfo = await this.analyzeCurrentPage(moduleName);
                this.detectedModules.push(moduleInfo);
                
            } catch (error) {
                console.log(`  ⚠️ Error analyzing module: ${error}`);
            }
        }
        
        console.log(`✅ Found ${this.detectedModules.length} modules`);
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
        const testContent = `import { test, expect } from '@playwright/test';
import { loginToApp } from '../helpers/auth.helper';
import { createAutoHealing } from '../helpers/auto-healing.helper';

test.describe('${module.name} Tests', () => {
    test.beforeEach(async ({ page }) => {
        await loginToApp(page);
        await page.waitForLoadState('load');
    });

    test('should access ${module.name} page', async ({ page }) => {
        test.setTimeout(60000);
        
        const healer = createAutoHealing(page);
        await healer.waitForStable();
        
        // Navigate to ${module.name}
        await healer.smartClick([
            'text=${module.name}',
            'a:has-text("${module.name}")',
            '[href*="${fileName}"]'
        ]);
        
        await page.waitForLoadState('load');
        await healer.waitForStable();
        
        // Verify page loaded
        const heading = page.locator('h1, h2, h3').first();
        await expect(heading).toBeVisible({ timeout: 10000 });
        
        console.log('✅ ${module.name} page loaded successfully');
    });

${module.hasTable ? this.generateTableTest(module) : ''}
${module.hasSearch ? this.generateSearchTest(module) : ''}
${module.hasForm ? this.generateFormTest(module) : ''}
${this.generateNavigationTest(module)}
});
`;
        return testContent;
    }

    generateTableTest(module: ModuleInfo): string {
        return `
    test('should display ${module.name} list/table', async ({ page }) => {
        test.setTimeout(60000);
        
        const healer = createAutoHealing(page);
        
        // Navigate to ${module.name}
        await healer.smartClick(['text=${module.name}']);
        await page.waitForLoadState('load');
        await healer.waitForStable();
        
        // Verify table/list is visible
        const table = page.locator('table, [role="grid"], [class*="list"]').first();
        await expect(table).toBeVisible({ timeout: 10000 });
        
        // Check if rows are present
        const rows = await page.locator('tr, [role="row"], [class*="item"]').count();
        console.log(\`Found \${rows} rows/items in ${module.name}\`);
        
        expect(rows).toBeGreaterThan(0);
    });
`;
    }

    generateSearchTest(module: ModuleInfo): string {
        return `
    test('should search in ${module.name}', async ({ page }) => {
        test.setTimeout(60000);
        
        const healer = createAutoHealing(page);
        
        // Navigate to ${module.name}
        await healer.smartClick(['text=${module.name}']);
        await page.waitForLoadState('load');
        await healer.waitForStable();
        
        // Find search input
        const searchInput = page.locator('input[type="search"], input[placeholder*="search" i]').first();
        await expect(searchInput).toBeVisible({ timeout: 10000 });
        
        // Perform search
        await searchInput.fill('test');
        await page.waitForTimeout(2000);
        
        // Clear search
        await searchInput.clear();
        await page.waitForTimeout(1000);
        
        console.log('✅ Search functionality tested in ${module.name}');
    });
`;
    }

    generateFormTest(module: ModuleInfo): string {
        return `
    test('should interact with ${module.name} form', async ({ page }) => {
        test.setTimeout(90000);
        
        const healer = createAutoHealing(page);
        
        // Navigate to ${module.name}
        await healer.smartClick(['text=${module.name}']);
        await page.waitForLoadState('load');
        await healer.waitForStable();
        
        // Look for Add/Create button
        const addButton = page.locator([
            'button:has-text("Add")',
            'button:has-text("Create")',
            'button:has-text("New")',
            '[aria-label*="add" i]'
        ].join(', ')).first();
        
        if (await addButton.isVisible({ timeout: 5000 }).catch(() => false)) {
            await addButton.click();
            await page.waitForTimeout(2000);
            
            // Verify form appeared
            const form = page.locator('form, [role="dialog"]').first();
            await expect(form).toBeVisible({ timeout: 10000 });
            
            console.log('✅ ${module.name} form opened successfully');
            
            // Close form/dialog
            const closeButton = page.locator('button:has-text("Cancel"), button:has-text("Close"), [aria-label*="close"]').first();
            if (await closeButton.isVisible({ timeout: 3000 }).catch(() => false)) {
                await closeButton.click();
            }
        }
    });
`;
    }

    generateNavigationTest(module: ModuleInfo): string {
        return `
    test('should navigate through ${module.name} sections', async ({ page }) => {
        test.setTimeout(60000);
        
        const healer = createAutoHealing(page);
        
        // Navigate to ${module.name}
        await healer.smartClick(['text=${module.name}']);
        await page.waitForLoadState('load');
        await healer.waitForStable();
        
        // Check for tabs or sub-navigation
        const tabs = page.locator('[role="tab"], .tab, [class*="tab"]');
        const tabCount = await tabs.count();
        
        if (tabCount > 0) {
            console.log(\`Found \${tabCount} tabs in ${module.name}\`);
            
            // Click first few tabs
            for (let i = 0; i < Math.min(tabCount, 3); i++) {
                const tab = tabs.nth(i);
                if (await tab.isVisible()) {
                    await tab.click();
                    await page.waitForTimeout(1000);
                }
            }
        }
        
        console.log('✅ ${module.name} navigation tested');
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
    process.env.BASE_URL || 'https://app-staging.vivacityapp.com',
    process.env.TEST_USERNAME || 'kc@vivacityapp.com',
    process.env.TEST_PASSWORD || 'PAOpaopao@9696'
);

generator.run();
