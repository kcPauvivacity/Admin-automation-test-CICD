import { test, expect } from '@playwright/test';

const LOGIN_URL = 'https://app-staging.vivacityapp.com';
const VALID_EMAIL = 'kc@vivacityapp.com';
const VALID_PASSWORD = 'PAOpaopao@9696';

test('successful login with valid credentials', async ({ page }) => {
    test.setTimeout(120000);
    
    // Navigate to the application (will redirect to auth0 login)
    await page.goto(LOGIN_URL, { waitUntil: 'load' });

    // Wait for the page to load and enter valid email
    await page.waitForSelector('input[name="username"]', { timeout: 10000 });
    await page.fill('input[name="username"]', VALID_EMAIL);
    await page.click('button[type="submit"]');

    // Wait for password field and enter password
    await page.waitForSelector('input[name="password"]', { timeout: 10000 });
    await page.fill('input[name="password"]', VALID_PASSWORD);
    await page.click('button[type="submit"]');

    // Wait for navigation after login
    await page.waitForLoadState('load', { timeout: 30000 });
    await page.waitForTimeout(2000);
    
    // Handle passkey enrollment if it appears
    const continueButton = page.locator('button:has-text("Continue"), a:has-text("Continue")').first();
    if (await continueButton.isVisible({ timeout: 3000 }).catch(() => false)) {
        await continueButton.click();
        await page.waitForLoadState('load', { timeout: 10000 });
        await page.waitForTimeout(2000);
    }

    // Assert we're on the app (either demo-student or main page)
    await expect(page).toHaveURL(/app-staging\.vivacityapp\.com/, { timeout: 30000 });
    await expect(page.locator('body')).toBeVisible();
    
    console.log('✅ Successfully logged in with valid credentials');
});

test('login attempt with invalid email format', async ({ page }) => {
    // Navigate to the application
    await page.goto(LOGIN_URL, { waitUntil: 'load' });

    // Wait for the page to load and enter invalid email
    await page.waitForSelector('input[name="username"]', { timeout: 10000 });
    await page.fill('input[name="username"]', 'kcvivacity');
    
    // Click continue and wait for form validation
    await page.click('button[type="submit"]');
    
    // Wait for and verify the error message
    await page.waitForSelector('text="Email is not valid."', { timeout: 10000 });
    const errorText = await page.getByText('Email is not valid.').isVisible();
    expect(errorText).toBeTruthy();
});

test('login attempt with non-existent email', async ({ page }) => {
    // Navigate to the application
    await page.goto(LOGIN_URL, { waitUntil: 'load' });

    // Wait for the page to load and enter non-existent email
    await page.waitForSelector('input[name="username"]', { timeout: 10000 });
    await page.fill('input[name="username"]', 'nonexistent@example.com');
    await page.click('button[type="submit"]');

    // Wait for password field (Auth0 still allows to continue)
    await page.waitForSelector('input[name="password"]', { timeout: 10000 });
    await page.fill('input[name="password"]', 'SomePassword123!');
    await page.click('button[type="submit"]');
    
    // Wait for and verify the error message
    await page.waitForSelector('text=/Wrong (email or password|username or password)/i', { timeout: 10000 });
    const errorVisible = await page.locator('text=/Wrong (email or password|username or password)/i').isVisible();
    expect(errorVisible).toBeTruthy();
});

test('login attempt with incorrect password', async ({ page }) => {
    // Navigate to the application
    await page.goto(LOGIN_URL, { waitUntil: 'load' });

    // Wait for the page to load and enter valid email
    await page.waitForSelector('input[name="username"]', { timeout: 10000 });
    await page.fill('input[name="username"]', VALID_EMAIL);
    await page.click('button[type="submit"]');

    // Wait for password field and enter incorrect password
    await page.waitForSelector('input[name="password"]', { timeout: 10000 });
    await page.fill('input[name="password"]', 'WrongPassword123!');
    await page.click('button[type="submit"]');
    
    // Wait for and verify the error message
    await page.waitForSelector('text=/Wrong (email or password|username or password)/i', { timeout: 10000 });
    const errorVisible = await page.locator('text=/Wrong (email or password|username or password)/i').isVisible();
    expect(errorVisible).toBeTruthy();
});

test('login attempt with empty credentials', async ({ page }) => {
    // Navigate to the application
    await page.goto(LOGIN_URL, { waitUntil: 'load' });

    // Wait for the page to load
    await page.waitForSelector('input[name="username"]', { timeout: 10000 });
    
    // Try to submit without entering email - use the first submit button
    const submitButton = page.locator('button[type="submit"]').first();
    await submitButton.click();
    
    // Check if email field shows validation (HTML5 validation or error message)
    const emailInput = page.locator('input[name="username"]');
    
    // Wait a moment for validation to trigger
    await page.waitForTimeout(1000);
    
    // Check if we're still on the login page (didn't proceed)
    const isStillOnLoginPage = await emailInput.isVisible();
    expect(isStillOnLoginPage).toBeTruthy();
    
    // Verify the URL hasn't changed to password page
    const currentUrl = page.url();
    expect(currentUrl).toContain('login');
});