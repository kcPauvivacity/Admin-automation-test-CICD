import { Page, expect } from '@playwright/test';

// Use environment variables with fallback to hardcoded values for local development
export const LOGIN_URL = process.env.BASE_URL || 'https://app-staging.vivacityapp.com';
export const VALID_EMAIL = process.env.TEST_USERNAME || 'kc@vivacityapp.com';
export const VALID_PASSWORD = process.env.TEST_PASSWORD || 'PAOpaopao@9696';

/**
 * Shared login helper function for all tests
 * Handles the complete login flow including passkey enrollment
 */
export async function loginToApp(page: Page, timeout: number = 60000) {
    // Navigate to the application (will redirect to auth0 login)
    await page.goto(LOGIN_URL, { waitUntil: 'networkidle', timeout });

    // Wait for and fill email
    await page.waitForSelector('input[name="username"]', { timeout: 10000 });
    await page.fill('input[name="username"]', VALID_EMAIL);
    await page.click('button[type="submit"]');

    // Wait for and fill password
    await page.waitForSelector('input[name="password"]', { timeout: 10000 });
    await page.fill('input[name="password"]', VALID_PASSWORD);
    await page.click('button[type="submit"]');

    // Wait for navigation after login (use load instead of networkidle due to 503 errors)
    await page.waitForLoadState('load', { timeout: 30000 });
    await page.waitForTimeout(3000); // Give extra time for potential redirects
    
    // Handle passkey enrollment if it appears
    const continueButton = page.locator('button:has-text("Continue"), a:has-text("Continue")').first();
    if (await continueButton.isVisible({ timeout: 5000 }).catch(() => false)) {
        await continueButton.click();
        await page.waitForLoadState('load', { timeout: 15000 });
        await page.waitForTimeout(2000);
    }

    // Assert we're on the app (using regex to handle /dashboard suffix)
    await expect(page).toHaveURL(/app-staging\.vivacityapp\.com\/demo-student/, { timeout: 60000 });
    await page.waitForTimeout(3000);
}

/**
 * Helper to navigate to a specific module
 */
export async function navigateToModule(page: Page, moduleName: string) {
    await page.click(`text=${moduleName}`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
}
