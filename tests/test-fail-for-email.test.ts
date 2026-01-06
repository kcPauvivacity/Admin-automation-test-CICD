import { test, expect } from '@playwright/test';
import { loginToApp } from './helpers/auth.helper';

test.describe('Test Email Report with Media', () => {
    test('should fail and capture screenshot/video', async ({ page }) => {
        test.setTimeout(60000);
        
        // Login first
        await loginToApp(page);
        
        // Wait a bit
        await page.waitForTimeout(2000);
        
        // This will fail intentionally to capture screenshot and video
        await expect(page.locator('text=THIS_DOES_NOT_EXIST_12345')).toBeVisible({ timeout: 5000 });
    });
});
