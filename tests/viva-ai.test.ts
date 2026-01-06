import { test, expect } from '@playwright/test';
import { loginToApp } from './helpers/auth.helper';

test.describe('Viva AI Tests', () => {
    test.beforeEach(async ({ page }) => {
        // Login before each test
        await loginToApp(page);
        
        // Navigate to Viva AI section
        await page.waitForLoadState('load');
    });

    test('should access Viva AI page', async ({ page }) => {
        test.setTimeout(60000);
        
        // Wait for page to fully load
        await page.waitForTimeout(2000);
        
        // Find and click the Viva AI button in the header (it's an orange/coral button)
        // The button might be a link or have specific styling
        const vivaAIButton = page.getByRole('link', { name: /viva ai/i }).or(
            page.getByRole('button', { name: /viva ai/i })
        ).or(
            page.locator('[href*="viva-ai"]')
        ).or(
            page.locator('a, button').filter({ hasText: /viva.*ai/i })
        ).first();
        
        await vivaAIButton.click({ timeout: 10000 });
        
        // Wait for the chat window to appear on the right side
        await page.waitForTimeout(2000);
        
        // Verify chat window opened on the right side
        // Look for chat-related elements or a sidebar/panel
        const chatWindow = page.locator('[class*="chat"]').or(
            page.locator('[class*="sidebar"]')
        ).or(
            page.locator('[role="dialog"]')
        ).first();
        
        await expect(chatWindow).toBeVisible({ timeout: 10000 });
    });

    test('should interact with Viva AI features', async ({ page }) => {
        test.setTimeout(60000);
        
        // TODO: Add test for Viva AI interactions
    });

    test('should send a message to Viva AI', async ({ page }) => {
        test.setTimeout(90000);
        
        // Open Viva AI chat
        const vivaAIButton = page.getByRole('link', { name: /viva ai/i }).or(
            page.getByRole('button', { name: /viva ai/i })
        ).or(
            page.locator('a, button').filter({ hasText: /viva.*ai/i })
        ).first();
        await vivaAIButton.click({ timeout: 15000 });
        await page.waitForTimeout(3000);
        
        // Find the input field in the chat window
        const messageInput = page.locator('input[type="text"]').or(
            page.locator('textarea')
        ).or(
            page.locator('[placeholder*="message"]')
        ).or(
            page.locator('[placeholder*="type"]')
        ).last();
        
        // Type and send a message
        await messageInput.fill('Hello, can you help me?');
        await page.waitForTimeout(1000);
        
        // Click send button (look for send icon or button)
        const sendButton = page.getByRole('button', { name: /send/i }).or(
            page.locator('button[type="submit"]')
        ).or(
            page.locator('button svg')
        ).last();
        await sendButton.click();
        
        // Wait for response
        await page.waitForTimeout(5000);
        
        // Verify message was sent (look for the message in chat history)
        const sentMessage = page.locator('text=Hello, can you help me?');
        await expect(sentMessage).toBeVisible();
    });

    test('should verify AI response', async ({ page }) => {
        test.setTimeout(120000);
        
        // Open Viva AI chat
        const vivaAIButton = page.getByRole('link', { name: /viva ai/i }).or(
            page.getByRole('button', { name: /viva ai/i })
        ).or(
            page.locator('a, button').filter({ hasText: /viva.*ai/i })
        ).first();
        await vivaAIButton.click({ timeout: 15000 });
        await page.waitForTimeout(3000);
        
        // Send a message
        const messageInput = page.locator('input[type="text"]').or(
            page.locator('textarea')
        ).or(
            page.locator('[placeholder*="message"]')
        ).or(
            page.locator('[placeholder*="type"]')
        ).last();
        
        await messageInput.fill('What is Viva City?');
        await page.waitForTimeout(1000);
        
        const sendButton = page.getByRole('button', { name: /send/i }).or(
            page.locator('button[type="submit"]')
        ).or(
            page.locator('button svg')
        ).last();
        await sendButton.click();
        
        // Wait for AI response (longer timeout for AI processing)
        await page.waitForTimeout(8000);
        
        // Verify AI response appeared (look for response container or text)
        const aiResponse = page.locator('[class*="message"]').or(
            page.locator('[class*="response"]')
        ).or(
            page.locator('[class*="assistant"]')
        );
        
        // Check that there are at least 2 messages (user + AI)
        const messageCount = await aiResponse.count();
        expect(messageCount).toBeGreaterThan(1);
    });

    test('should have conversation with AI - send, receive, and reply', async ({ page }) => {
        test.setTimeout(180000);
        
        // Open Viva AI chat
        const vivaAIButton = page.getByRole('link', { name: /viva ai/i }).or(
            page.getByRole('button', { name: /viva ai/i })
        ).or(
            page.locator('a, button').filter({ hasText: /viva.*ai/i })
        ).first();
        await vivaAIButton.click({ timeout: 15000 });
        await page.waitForTimeout(3000);
        
        // Find the input field
        const messageInput = page.locator('input[type="text"]').or(
            page.locator('textarea')
        ).or(
            page.locator('[placeholder*="message"]')
        ).or(
            page.locator('[placeholder*="type"]')
        ).last();
        
        const sendButton = page.getByRole('button', { name: /send/i }).or(
            page.locator('button[type="submit"]')
        ).or(
            page.locator('button svg')
        ).last();
        
        // First message: Ask about properties
        console.log('Sending first message...');
        await messageInput.fill('Tell me about properties in the system');
        await page.waitForTimeout(1000);
        await sendButton.click();
        
        // Wait for first AI response (with longer timeout for AI processing)
        await page.waitForTimeout(10000);
        
        // Verify first message was sent
        const firstMessage = page.locator('text=Tell me about properties in the system');
        await expect(firstMessage).toBeVisible();
        
        // Get all messages after first response
        const allMessages = page.locator('[class*="message"]').or(
            page.locator('[class*="response"]')
        ).or(
            page.locator('[class*="chat"]')
        );
        
        const initialMessageCount = await allMessages.count();
        console.log(`Messages after first response: ${initialMessageCount}`);
        expect(initialMessageCount).toBeGreaterThan(1);
        
        // Second message: Follow-up question based on typical AI response
        console.log('Sending follow-up message...');
        await page.waitForTimeout(2000);
        await messageInput.fill('Can you give me more details?');
        await page.waitForTimeout(1000);
        await sendButton.click();
        
        // Wait for second AI response
        await page.waitForTimeout(10000);
        
        // Verify follow-up message was sent
        const followUpMessage = page.locator('text=Can you give me more details?');
        await expect(followUpMessage).toBeVisible();
        
        // Verify we have more messages now (original pair + new pair)
        const finalMessageCount = await allMessages.count();
        console.log(`Messages after second response: ${finalMessageCount}`);
        expect(finalMessageCount).toBeGreaterThan(initialMessageCount);
        
        // Verify we have at least 4 messages total (2 user + 2 AI)
        expect(finalMessageCount).toBeGreaterThanOrEqual(4);
    });

    test('should click on suggestion', async ({ page }) => {
        test.setTimeout(90000);
        
        // Open Viva AI chat
        const vivaAIButton = page.getByRole('link', { name: /viva ai/i }).or(
            page.getByRole('button', { name: /viva ai/i })
        ).or(
            page.locator('a, button').filter({ hasText: /viva.*ai/i })
        ).first();
        await vivaAIButton.click({ timeout: 15000 });
        await page.waitForTimeout(3000);
        
        // Look for suggestions (they might be buttons or clickable elements)
        const suggestion = page.locator('[class*="suggestion"]').or(
            page.locator('button').filter({ hasText: /.+/ })
        ).or(
            page.locator('[role="button"]')
        ).first();
        
        // Wait for suggestions to be visible
        await suggestion.waitFor({ state: 'visible', timeout: 8000 });
        
        // Click on the first suggestion
        await suggestion.click();
        await page.waitForTimeout(3000);
        
        // Verify something happened (message sent or response received)
        const messages = page.locator('[class*="message"]');
        const messageCount = await messages.count();
        expect(messageCount).toBeGreaterThan(0);
    });

    test('should close the chat window', async ({ page }) => {
        test.setTimeout(90000);
        
        // Open Viva AI chat
        const vivaAIButton = page.getByRole('link', { name: /viva ai/i }).or(
            page.getByRole('button', { name: /viva ai/i })
        ).or(
            page.locator('a, button').filter({ hasText: /viva.*ai/i })
        ).first();
        await vivaAIButton.click({ timeout: 15000 });
        await page.waitForTimeout(3000);
        
        // Verify chat is open
        const chatWindow = page.locator('[class*="chat"]').or(
            page.locator('[class*="sidebar"]')
        ).or(
            page.locator('[role="dialog"]')
        ).first();
        await expect(chatWindow).toBeVisible();
        
        // Find and click close button (X icon, close button, etc.)
        const closeButton = page.getByRole('button', { name: /close/i }).or(
            page.locator('button[aria-label*="close"]')
        ).or(
            page.locator('button svg').filter({ hasText: /×|✕|x/i })
        ).or(
            page.locator('[class*="close"]')
        ).first();
        
        await closeButton.click();
        await page.waitForTimeout(2000);
        
        // Verify chat is closed (should not be visible or have different state)
        await expect(chatWindow).not.toBeVisible({ timeout: 8000 });
    });
});
