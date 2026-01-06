import { test, expect } from '@playwright/test';

test('intentional failure for testing email attachments', async ({ page }) => {
    test.setTimeout(30000);
    
    await page.goto('https://app-staging.vivacityapp.com');
    await page.waitForTimeout(2000);
    
    // This will fail intentionally
    await expect(page).toHaveTitle('This Title Does Not Exist');
});
