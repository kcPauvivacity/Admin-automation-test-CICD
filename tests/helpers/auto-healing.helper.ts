import { Page, Locator } from '@playwright/test';

/**
 * Auto-healing utility for Playwright tests
 * Provides fallback strategies and retry mechanisms for common test failures
 */

export class AutoHealing {
    private page: Page;
    private maxRetries: number = 3;
    private retryDelay: number = 1000;

    constructor(page: Page) {
        this.page = page;
    }

    /**
     * Smart click with auto-healing
     * Tries multiple strategies to click an element
     */
    async smartClick(selectors: string | string[], options: { timeout?: number; force?: boolean } = {}) {
        const selectorArray = Array.isArray(selectors) ? selectors : [selectors];
        const timeout = options.timeout || 10000;
        
        for (let retry = 0; retry < this.maxRetries; retry++) {
            try {
                // Try each selector
                for (const selector of selectorArray) {
                    const element = this.page.locator(selector).first();
                    
                    if (await element.isVisible({ timeout: 3000 }).catch(() => false)) {
                        console.log(`✅ Auto-heal: Found element with selector: ${selector}`);
                        
                        // Try normal click first
                        try {
                            await element.click({ timeout: 5000 });
                            return true;
                        } catch {
                            // If normal click fails, try with force
                            console.log(`🔧 Auto-heal: Normal click failed, trying force click`);
                            await element.click({ force: true, timeout: 5000 });
                            return true;
                        }
                    }
                }
                
                // If no selector worked, try text-based fallback
                console.log(`🔍 Auto-heal: Trying text-based fallback (retry ${retry + 1}/${this.maxRetries})`);
                await this.page.waitForTimeout(this.retryDelay);
                
            } catch (error) {
                console.log(`⚠️ Auto-heal: Attempt ${retry + 1} failed:`, (error as Error).message);
                if (retry === this.maxRetries - 1) {
                    throw new Error(`Auto-healing failed after ${this.maxRetries} attempts: ${(error as Error).message}`);
                }
                await this.page.waitForTimeout(this.retryDelay);
            }
        }
        
        throw new Error(`Could not find or click element with any of the provided selectors`);
    }

    /**
     * Smart fill with auto-healing
     * Handles input fields that might have changed selectors
     */
    async smartFill(selectors: string | string[], value: string, options: { timeout?: number } = {}) {
        const selectorArray = Array.isArray(selectors) ? selectors : [selectors];
        const timeout = options.timeout || 10000;
        
        for (let retry = 0; retry < this.maxRetries; retry++) {
            try {
                for (const selector of selectorArray) {
                    const element = this.page.locator(selector).first();
                    
                    if (await element.isVisible({ timeout: 3000 }).catch(() => false)) {
                        console.log(`✅ Auto-heal: Found input with selector: ${selector}`);
                        await element.clear();
                        await element.fill(value);
                        return true;
                    }
                }
                
                console.log(`🔍 Auto-heal: Trying input fallback (retry ${retry + 1}/${this.maxRetries})`);
                await this.page.waitForTimeout(this.retryDelay);
                
            } catch (error) {
                console.log(`⚠️ Auto-heal: Fill attempt ${retry + 1} failed:`, (error as Error).message);
                if (retry === this.maxRetries - 1) {
                    throw error;
                }
                await this.page.waitForTimeout(this.retryDelay);
            }
        }
        
        throw new Error(`Could not fill element with any of the provided selectors`);
    }

    /**
     * Smart wait for element with multiple fallback selectors
     */
    async smartWaitFor(selectors: string | string[], options: { timeout?: number; state?: 'visible' | 'attached' } = {}) {
        const selectorArray = Array.isArray(selectors) ? selectors : [selectors];
        const timeout = options.timeout || 10000;
        const state = options.state || 'visible';
        
        for (const selector of selectorArray) {
            try {
                const element = this.page.locator(selector).first();
                await element.waitFor({ state, timeout });
                console.log(`✅ Auto-heal: Found element with selector: ${selector}`);
                return element;
            } catch (error) {
                console.log(`🔍 Auto-heal: Selector "${selector}" not found, trying next...`);
            }
        }
        
        throw new Error(`Could not find element with any of the provided selectors after ${timeout}ms`);
    }

    /**
     * Navigate with retry on failure
     */
    async smartNavigate(url: string, options: { timeout?: number; waitUntil?: 'load' | 'networkidle' } = {}) {
        const timeout = options.timeout || 30000;
        const waitUntil = options.waitUntil || 'load';
        
        for (let retry = 0; retry < this.maxRetries; retry++) {
            try {
                await this.page.goto(url, { waitUntil, timeout });
                console.log(`✅ Auto-heal: Navigation successful`);
                return;
            } catch (error) {
                console.log(`⚠️ Auto-heal: Navigation attempt ${retry + 1} failed:`, (error as Error).message);
                if (retry === this.maxRetries - 1) {
                    throw error;
                }
                await this.page.waitForTimeout(this.retryDelay * 2); // Longer delay for navigation
            }
        }
    }

    /**
     * Smart text verification with flexible matching
     */
    async smartExpectText(selectors: string | string[], expectedText: string | RegExp, options: { timeout?: number } = {}) {
        const selectorArray = Array.isArray(selectors) ? selectors : [selectors];
        const timeout = options.timeout || 10000;
        
        for (const selector of selectorArray) {
            try {
                const element = this.page.locator(selector).first();
                await element.waitFor({ state: 'visible', timeout });
                
                const actualText = await element.textContent();
                if (actualText) {
                    if (typeof expectedText === 'string') {
                        if (actualText.includes(expectedText)) {
                            console.log(`✅ Auto-heal: Text verification passed with selector: ${selector}`);
                            return true;
                        }
                    } else {
                        if (expectedText.test(actualText)) {
                            console.log(`✅ Auto-heal: Text verification passed with selector: ${selector}`);
                            return true;
                        }
                    }
                }
            } catch (error) {
                console.log(`🔍 Auto-heal: Text check with selector "${selector}" failed, trying next...`);
            }
        }
        
        throw new Error(`Could not verify text with any of the provided selectors`);
    }

    /**
     * Handle stale element references automatically
     */
    async withStaleRetry<T>(action: () => Promise<T>): Promise<T> {
        for (let retry = 0; retry < this.maxRetries; retry++) {
            try {
                return await action();
            } catch (error) {
                const errorMsg = (error as Error).message;
                if (errorMsg.includes('stale') || errorMsg.includes('detached')) {
                    console.log(`🔧 Auto-heal: Stale element detected, retry ${retry + 1}/${this.maxRetries}`);
                    await this.page.waitForTimeout(500);
                    continue;
                }
                throw error;
            }
        }
        throw new Error('Action failed after handling stale element retries');
    }

    /**
     * Smart scroll into view before interaction
     */
    async smartScrollTo(selectors: string | string[], options: { timeout?: number } = {}) {
        const element = await this.smartWaitFor(selectors, options);
        
        try {
            await element.scrollIntoViewIfNeeded();
            console.log(`✅ Auto-heal: Scrolled to element`);
        } catch (error) {
            console.log(`⚠️ Auto-heal: Scroll failed, trying alternative approach`);
            await element.evaluate(el => el.scrollIntoView({ behavior: 'smooth', block: 'center' }));
        }
        
        return element;
    }

    /**
     * Wait for page to be stable (no loading indicators)
     */
    async waitForStable(timeout: number = 10000) {
        const loadingSelectors = [
            '[class*="loading"]',
            '[class*="spinner"]',
            '[aria-busy="true"]',
            '.loader',
            '[data-loading="true"]'
        ];
        
        try {
            for (const selector of loadingSelectors) {
                const loader = this.page.locator(selector).first();
                if (await loader.isVisible({ timeout: 2000 }).catch(() => false)) {
                    console.log(`⏳ Auto-heal: Waiting for loading indicator to disappear...`);
                    await loader.waitFor({ state: 'hidden', timeout });
                }
            }
            console.log(`✅ Auto-heal: Page is stable`);
        } catch (error) {
            console.log(`⚠️ Auto-heal: Could not detect page stability, continuing anyway`);
        }
    }

    /**
     * Automatically handle common popups/modals
     */
    async handlePopups() {
        const popupSelectors = [
            'button:has-text("Accept")',
            'button:has-text("OK")',
            'button:has-text("Close")',
            'button:has-text("Dismiss")',
            '[aria-label*="close"]',
            '[class*="close-button"]'
        ];
        
        for (const selector of popupSelectors) {
            const button = this.page.locator(selector).first();
            if (await button.isVisible({ timeout: 2000 }).catch(() => false)) {
                console.log(`🔧 Auto-heal: Closing popup/modal`);
                await button.click().catch(() => {});
                await this.page.waitForTimeout(500);
            }
        }
    }
}

/**
 * Create auto-healing instance for a page
 */
export function createAutoHealing(page: Page): AutoHealing {
    return new AutoHealing(page);
}
