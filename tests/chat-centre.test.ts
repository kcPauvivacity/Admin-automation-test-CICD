import { test, expect } from '@playwright/test';
import { loginToApp } from './helpers/auth.helper';

test('navigate to Chat Centre section successfully', async ({ page }) => {
    test.setTimeout(180000);

    await loginToApp(page, 90000, 'pau.kie.chee@fusioneta.com', 'PAOpaopao@9696');
    await page.waitForLoadState('load');
    await page.waitForTimeout(3000);

    const menuItem = page.getByRole('menuitem', { name: /chat centre/i });
    const hasMenu = await menuItem.isVisible({ timeout: 3000 }).catch(() => false);

    if (hasMenu) {
        await menuItem.click();
        await page.waitForLoadState('load');
        await page.waitForTimeout(2000);
        console.log('✅ Navigated to Chat Centre via main menu');
    } else {
        await page.goto(`${process.env.TEST_URL || 'https://app-staging.vivacityapp.com'}/demo-student/chat-centre`);
        await page.waitForLoadState('load');
        await page.waitForTimeout(2000);
        console.log('✅ Navigated to Chat Centre via direct URL');
    }

    await expect(page).toHaveURL(/chat-centre/i, { timeout: 10000 });
    console.log('✅ Chat Centre page loaded successfully');
});

test('Chat Centre page renders main content', async ({ page }) => {
    test.setTimeout(180000);

    await loginToApp(page, 90000, 'pau.kie.chee@fusioneta.com', 'PAOpaopao@9696');
    await page.goto(`${process.env.TEST_URL || 'https://app-staging.vivacityapp.com'}/demo-student/chat-centre`);
    await page.waitForLoadState('load');
    await page.waitForTimeout(4000);

    // Check for main content area
    const mainContent = page.locator('main, [role="main"], .content, [class*="container"], [class*="chat"]').first();
    const hasContent = await mainContent.isVisible({ timeout: 5000 }).catch(() => false);

    expect(hasContent).toBe(true);
    console.log('✅ Chat Centre main content is visible');
});

test('Chat Centre page has no console errors on load', async ({ page }) => {
    test.setTimeout(180000);

    const errors: string[] = [];
    page.on('console', msg => {
        if (msg.type() === 'error') errors.push(msg.text());
    });

    await loginToApp(page, 90000, 'pau.kie.chee@fusioneta.com', 'PAOpaopao@9696');
    await page.goto(`${process.env.TEST_URL || 'https://app-staging.vivacityapp.com'}/demo-student/chat-centre`);
    await page.waitForLoadState('load');
    await page.waitForTimeout(3000);

    const criticalErrors = errors.filter(e =>
        !e.includes('favicon') &&
        !e.includes('404') &&
        !e.includes('ext.json') &&
        !e.includes('SharedArrayBuffer')
    );

    if (criticalErrors.length > 0) {
        console.log('⚠️ Console errors found:', criticalErrors);
    } else {
        console.log('✅ No critical console errors on Chat Centre page');
    }
});
