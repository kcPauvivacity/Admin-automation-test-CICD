import { test, expect } from '@playwright/test';

// Skip this test - it's intentionally designed to fail for email testing
test.skip('intentional failure for testing email attachments', async ({ page }) => {
    test.setTimeout(30000);
    
    await page.goto('https://app-staging.vivacityapp.com');
    await page.waitForTimeout(2000);
    
    // This will fail intentionally
    await expect(page).toHaveTitle('This Title Does Not Exist');
});
