import { test, expect } from '@playwright/test';
import * as dotenv from 'dotenv';

dotenv.config();

const LOGIN_URL = process.env.TEST_URL || 'https://app-staging.vivacityapp.com';
const USERNAME = process.env.TEST_USERNAME || '';
const PASSWORD = process.env.TEST_PASSWORD || '';

test.describe('Mobile Login Tests', () => {

  test('login page renders correctly on mobile', async ({ page }) => {
    await page.goto(LOGIN_URL, { waitUntil: 'load' });

    // Check login input is visible and usable on mobile
    await page.waitForSelector('input[name="username"]', { timeout: 15000 });
    const input = page.locator('input[name="username"]');
    await expect(input).toBeVisible();

    // Verify the input is tappable (not hidden by mobile nav etc.)
    const box = await input.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.width).toBeGreaterThan(0);
    expect(box!.height).toBeGreaterThan(0);

    console.log(`✅ Login page renders correctly on mobile (viewport: ${page.viewportSize()?.width}x${page.viewportSize()?.height})`);
  });

  test('successful login on mobile', async ({ page }) => {
    await page.goto(LOGIN_URL, { waitUntil: 'load' });

    // Enter username
    await page.waitForSelector('input[name="username"]', { timeout: 15000 });
    await page.fill('input[name="username"]', USERNAME);
    await page.tap('button[type="submit"]');

    // Enter password
    await page.waitForSelector('input[name="password"]', { timeout: 15000 });
    await page.fill('input[name="password"]', PASSWORD);
    await page.tap('button[type="submit"]');

    // Handle passkey enrollment if it appears
    const continueButton = page.locator('button:has-text("Continue"), a:has-text("Continue")').first();
    if (await continueButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await continueButton.tap();
      await page.waitForLoadState('load', { timeout: 10000 });
    }

    // Assert we're logged in
    await expect(page).toHaveURL(/app-staging\.vivacityapp\.com/, { timeout: 30000 });
    console.log('✅ Successfully logged in on mobile');
  });

  test('login with invalid credentials shows error on mobile', async ({ page }) => {
    await page.goto(LOGIN_URL, { waitUntil: 'load' });

    await page.waitForSelector('input[name="username"]', { timeout: 15000 });
    await page.fill('input[name="username"]', 'invalid@example.com');
    await page.tap('button[type="submit"]');

    await page.waitForSelector('input[name="password"]', { timeout: 15000 });
    await page.fill('input[name="password"]', 'WrongPassword123!');
    await page.tap('button[type="submit"]');

    // Verify error message appears
    await page.waitForSelector('text=/Wrong (email or password|username or password)/i', { timeout: 10000 });
    const errorVisible = await page.locator('text=/Wrong (email or password|username or password)/i').isVisible();
    expect(errorVisible).toBeTruthy();
    console.log('✅ Error message shown correctly on mobile');
  });

  test('login page is scrollable and submit button is reachable on mobile', async ({ page }) => {
    await page.goto(LOGIN_URL, { waitUntil: 'load' });

    await page.waitForSelector('input[name="username"]', { timeout: 15000 });

    // Check submit button is visible without needing to scroll
    const submitButton = page.locator('button[type="submit"]').first();
    await expect(submitButton).toBeVisible();

    const box = await submitButton.boundingBox();
    expect(box).not.toBeNull();
    console.log(`✅ Submit button reachable at position (${box!.x}, ${box!.y}) on mobile`);
  });

});
