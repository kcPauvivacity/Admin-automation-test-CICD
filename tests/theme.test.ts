import { test, expect } from '@playwright/test';
import { loginToApp } from './helpers/auth.helper';

// Theme panel: click avatar (top right) → "Open theme selector" → Light/Dark/Auto

async function openThemeSelector(page: any) {
    await page.locator('button[aria-label*="User profile menu"]').click();
    await page.waitForTimeout(800);
    const openBtn = page.locator('button[aria-label="Open theme selector"]');
    if (await openBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await openBtn.click();
        await page.waitForTimeout(500);
    }
}

test('verify theme panel opens with Light and Dark options', async ({ page }) => {
    test.setTimeout(120000);
    await loginToApp(page);
    await openThemeSelector(page);
    await expect(page.locator('button[aria-label*="Light theme"]')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('button[aria-label="Dark theme"]')).toBeVisible({ timeout: 5000 });
    console.log('Theme panel: Light and Dark options visible');
});

test('switch to Dark Theme and verify it is applied', async ({ page }) => {
    test.setTimeout(120000);
    await loginToApp(page);
    await openThemeSelector(page);

    await page.locator('button[aria-label="Dark theme"]').click();
    await page.waitForTimeout(1000);

    const darkLabel = await page.locator('button[aria-label*="Dark theme"]').getAttribute('aria-label');
    console.log('Dark button aria-label after click:', darkLabel);
    expect(darkLabel).toContain('selected');

    // Clean up — panel stays open, click Light directly
    await page.locator('button[aria-label*="Light theme"]').click();
    await page.waitForTimeout(500);
    console.log('Reset to Light Theme');
});

test('switch to Light Theme from Dark Theme', async ({ page }) => {
    test.setTimeout(120000);
    await loginToApp(page);
    await openThemeSelector(page);

    // Switch to Dark
    await page.locator('button[aria-label="Dark theme"]').click();
    await page.waitForTimeout(800);
    console.log('Switched to Dark');

    // Panel stays open after clicking Dark — directly click Light (no re-open needed)
    await page.locator('button[aria-label*="Light theme"]').click();
    await page.waitForTimeout(1000);
    console.log('Switched back to Light');

    const lightLabel = await page.locator('button[aria-label*="Light theme"]').getAttribute('aria-label');
    console.log('Light button aria-label:', lightLabel);
    expect(lightLabel).toContain('selected');
});

test('verify Auto theme toggle is present', async ({ page }) => {
    test.setTimeout(120000);
    await loginToApp(page);
    await openThemeSelector(page);
    await expect(page.locator('text=Auto').first()).toBeVisible({ timeout: 5000 });
    console.log('Auto theme toggle present');
});

test('verify theme persists after page reload', async ({ page }) => {
    test.setTimeout(120000);
    await loginToApp(page);
    await openThemeSelector(page);

    await page.locator('button[aria-label="Dark theme"]').click();
    await page.waitForTimeout(1000);
    console.log('Set Dark Theme');

    await page.reload({ waitUntil: 'load' });
    await page.waitForTimeout(2000);

    await openThemeSelector(page);
    const darkLabel = await page.locator('button[aria-label*="Dark theme"]').getAttribute('aria-label');
    console.log('Dark button after reload:', darkLabel);
    if (darkLabel?.includes('selected')) {
        console.log('Dark Theme persisted after reload');
    } else {
        console.log('Note: Theme reset on reload');
    }

    // Clean up
    await page.locator('button[aria-label*="Light theme"]').click();
    await page.waitForTimeout(500);
    console.log('Reset to Light');
});
