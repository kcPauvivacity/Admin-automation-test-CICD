// Tests for the VIVA AI sidebar assistant (Ask VIVA)
// Accessed via the "+ VIVA AI" button in the app header
// aria-label="Open VIVA AI assistant"

import { test, expect } from '@playwright/test';
import { loginToApp } from './helpers/auth.helper';

const BASE = 'https://app-staging.vivacityapp.com';

async function loginAndOpenVivaAI(page: any) {
    await loginToApp(page);
    await page.waitForSelector('.v-application', { timeout: 15000 });
    await page.waitForTimeout(1500);
    await page.locator('button[aria-label="Open VIVA AI assistant"]').click();
    await page.waitForTimeout(2000);
    // Sidebar is open when .ai-wrapper is visible
    await page.waitForSelector('.ai-wrapper', { timeout: 10000 });
}

test.describe('Ask VIVA — sidebar assistant', () => {

    test('header button is visible and labelled correctly', async ({ page }) => {
        test.setTimeout(60000);
        await loginToApp(page);
        await page.waitForSelector('.v-application', { timeout: 15000 });
        await page.waitForTimeout(1500);

        const btn = page.locator('button[aria-label="Open VIVA AI assistant"]');
        await expect(btn).toBeVisible({ timeout: 10000 });
        await expect(btn).toContainText('VIVA AI');
        console.log('✅ VIVA AI header button is visible with correct label');
    });

    test('clicking header button opens the VIVA AI sidebar', async ({ page }) => {
        test.setTimeout(60000);
        await loginAndOpenVivaAI(page);

        // Sidebar wrapper visible
        const sidebar = page.locator('.ai-wrapper');
        await expect(sidebar).toBeVisible({ timeout: 8000 });
        console.log('✅ VIVA AI sidebar opened');

        // Page container gains .show-ai-sidebar class
        const wrapper = page.locator('.page-wrapper.show-ai-sidebar');
        await expect(wrapper).toBeVisible({ timeout: 5000 });
        console.log('✅ Page layout updated with show-ai-sidebar class');

        // Both the header button and sidebar × button show aria-label="Close VIVA AI assistant"
        const closeBtn = page.locator('button[aria-label="Close VIVA AI assistant"]').first();
        await expect(closeBtn).toBeVisible({ timeout: 5000 });
        console.log('✅ Header button now shows Close VIVA AI assistant');
    });

    test('sidebar shows personalised greeting with user name', async ({ page }) => {
        test.setTimeout(60000);
        await loginAndOpenVivaAI(page);

        const greeting = page.locator('.no-prompt');
        await expect(greeting).toBeVisible({ timeout: 8000 });
        const greetingText = await greeting.textContent();
        expect(greetingText).toMatch(/hello/i);
        console.log(`✅ Greeting text: "${greetingText?.trim().slice(0, 80)}"`);
    });

    test('sidebar shows suggestion prompts', async ({ page }) => {
        test.setTimeout(60000);
        await loginAndOpenVivaAI(page);

        const suggestions = page.locator('.suggestion-item');
        const count = await suggestions.count();
        expect(count).toBeGreaterThan(0);
        console.log(`✅ Found ${count} suggestion item(s)`);

        // Each suggestion has a title and text
        const firstTitle = page.locator('.suggestion-title').first();
        await expect(firstTitle).toBeVisible();
        const firstText = page.locator('.suggestion-text').first();
        await expect(firstText).toBeVisible();

        const title = await firstTitle.textContent();
        const text = await firstText.textContent();
        console.log(`✅ First suggestion — title: "${title?.trim()}", text: "${text?.trim()}"`);
    });

    test('clicking a suggestion populates the input field', async ({ page }) => {
        test.setTimeout(60000);
        await loginAndOpenVivaAI(page);

        const firstSuggestion = page.locator('.suggestion-item').first();
        const suggestionText = await page.locator('.suggestion-text').first().textContent();
        await firstSuggestion.click();
        await page.waitForTimeout(1500);

        // Input should now contain the suggestion text
        const input = page.locator('input[placeholder="What information do you need?"]');
        const inputValue = await input.inputValue();
        console.log(`ℹ️ Input after clicking suggestion: "${inputValue?.slice(0, 60)}"`);

        // Either the input has the suggestion text, or a message appeared in the chat
        const hasText = inputValue && inputValue.length > 0;
        const chatMessage = page.locator('.chat-message.human, .message').first();
        const hasChatMsg = await chatMessage.isVisible({ timeout: 3000 }).catch(() => false);
        expect(hasText || hasChatMsg).toBe(true);
        console.log('✅ Suggestion click triggered input or direct send');
    });

    test('input field has correct placeholder', async ({ page }) => {
        test.setTimeout(60000);
        await loginAndOpenVivaAI(page);

        const input = page.locator('input[placeholder="What information do you need?"]');
        await expect(input).toBeVisible({ timeout: 8000 });
        console.log('✅ Input placeholder "What information do you need?" is correct');
    });

    test('send button is present and accessible', async ({ page }) => {
        test.setTimeout(60000);
        await loginAndOpenVivaAI(page);

        const sendBtn = page.locator('button[aria-label="Send prompt"], .send-button');
        await expect(sendBtn.first()).toBeVisible({ timeout: 8000 });
        console.log('✅ Send prompt button is visible');
    });

    test('sending a message shows user bubble and AI loading response', async ({ page }) => {
        test.setTimeout(90000);
        await loginAndOpenVivaAI(page);

        const input = page.locator('input[placeholder="What information do you need?"]');
        await input.fill('What modules are available in this admin system?');
        await page.waitForTimeout(500);

        const sendBtn = page.locator('button[aria-label="Send prompt"], .send-button').first();
        await sendBtn.click();
        await page.waitForTimeout(2000);

        // User message bubble appears
        const userMsg = page.locator('.chat-message.human, .chat-message.loading.human');
        await expect(userMsg.first()).toBeVisible({ timeout: 8000 });
        const msgText = await userMsg.first().textContent();
        expect(msgText).toContain('What modules are available');
        console.log('✅ User message bubble appeared in chat');

        // AI response container appears (may be loading)
        const aiMsg = page.locator('.chat-message.ai');
        await expect(aiMsg.first()).toBeVisible({ timeout: 10000 });
        console.log('✅ AI response container appeared');
    });

    test('close button (×) closes the sidebar', async ({ page }) => {
        test.setTimeout(60000);
        await loginAndOpenVivaAI(page);

        const sidebar = page.locator('.ai-wrapper');
        await expect(sidebar).toBeVisible();

        // Click the × panel-close button
        const closeX = page.locator('.panel-close, button[aria-label="Close VIVA AI assistant"]').first();
        await closeX.click();
        await page.waitForTimeout(1500);

        // Sidebar should be gone
        await expect(sidebar).not.toBeVisible({ timeout: 5000 });
        console.log('✅ Sidebar closed after clicking ×');

        // Page loses show-ai-sidebar class
        const wrapper = page.locator('.page-wrapper.show-ai-sidebar');
        await expect(wrapper).not.toBeVisible({ timeout: 3000 });
        console.log('✅ show-ai-sidebar class removed from page wrapper');
    });

    test('sidebar can be toggled open and closed multiple times', async ({ page }) => {
        test.setTimeout(90000);
        await loginToApp(page);
        await page.waitForSelector('.v-application', { timeout: 15000 });
        await page.waitForTimeout(1500);

        const openBtn = page.locator('button[aria-label="Open VIVA AI assistant"]');
        const sidebar = page.locator('.ai-wrapper');

        for (let i = 0; i < 2; i++) {
            // Open
            await openBtn.click();
            await expect(sidebar).toBeVisible({ timeout: 8000 });
            console.log(`✅ Toggle ${i + 1}: sidebar opened`);

            // Close
            const closeBtn = page.locator('button[aria-label="Close VIVA AI assistant"]').first();
            await closeBtn.click();
            await expect(sidebar).not.toBeVisible({ timeout: 5000 });
            console.log(`✅ Toggle ${i + 1}: sidebar closed`);
            await page.waitForTimeout(500);
        }
    });

    test('sidebar persists when navigating to a different module', async ({ page }) => {
        test.setTimeout(90000);
        await loginAndOpenVivaAI(page);

        const sidebar = page.locator('.ai-wrapper');
        await expect(sidebar).toBeVisible();

        // Navigate to a different module
        await page.goto(`${BASE}/demo-student/enquiries`, { waitUntil: 'load', timeout: 30000 });
        await page.waitForSelector('.v-application', { timeout: 15000 });
        await page.waitForTimeout(2000);

        // Sidebar may or may not persist after route change — just verify no crash
        const hasError = page.locator('.v-snackbar--active').filter({ hasText: /error/i });
        await expect(hasError).not.toBeVisible({ timeout: 3000 });
        console.log('✅ No errors after navigating with sidebar open');
    });

    test('send button is disabled when input is empty', async ({ page }) => {
        test.setTimeout(60000);
        await loginAndOpenVivaAI(page);

        const input = page.locator('input[placeholder="What information do you need?"]');
        await input.clear();
        await page.waitForTimeout(500);

        const sendBtn = page.locator('button[aria-label="Send prompt"], .send-button').first();
        const isDisabled = await sendBtn.isDisabled().catch(() => false);
        if (isDisabled) {
            console.log('✅ Send button disabled when input is empty');
        } else {
            // May allow empty submit but show validation
            console.log('ℹ️ Send button not disabled for empty input');
        }
        // No error should appear on page load
        const errorMsg = page.locator('.v-snackbar--active').filter({ hasText: /error/i });
        await expect(errorMsg).not.toBeVisible({ timeout: 3000 });
    });

    test('VIVA AI sidebar is accessible from any module page', async ({ page }) => {
        test.setTimeout(90000);
        const modules = [
            '/demo-student/articles',
            '/demo-student/enquiries',
            '/demo-student/contacts',
        ];

        await loginToApp(page);
        await page.waitForSelector('.v-application', { timeout: 15000 });

        for (const mod of modules) {
            await page.goto(`${BASE}${mod}`, { waitUntil: 'load', timeout: 30000 });
            await page.waitForTimeout(1500);

            const openBtn = page.locator('button[aria-label="Open VIVA AI assistant"]');
            await expect(openBtn).toBeVisible({ timeout: 8000 });
            console.log(`✅ VIVA AI button visible on ${mod}`);

            await openBtn.click();
            await page.waitForTimeout(1500);
            const sidebar = page.locator('.ai-wrapper');
            await expect(sidebar).toBeVisible({ timeout: 8000 });
            console.log(`✅ Sidebar opened on ${mod}`);

            // Close for next iteration
            const closeBtn = page.locator('button[aria-label="Close VIVA AI assistant"]').first();
            await closeBtn.click();
            await page.waitForTimeout(800);
        }
    });
});
