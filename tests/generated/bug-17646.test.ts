// Bug #17646: Appeditor = AI assitant is not replying message
// ADO: https://dev.azure.com/vivacityapp/Viva/_workitems/edit/17646
// Auto-generated 2026-07-10
// REVIEW BEFORE MERGING — verify selectors and assertions

import { test, expect } from '@playwright/test';
import { loginToApp } from '../helpers/auth.helper';

test.setTimeout(120000);

test('Bug #17646: AppEditor AI assistant should reply to messages', async ({ page }) => {
  await loginToApp(page, 90000, 'pau.kie.chee@fusioneta.com', 'PAOpaopao@9696');

  // Navigate to the App Editor section
  await page.goto('https://app-staging.vivacityapp.com');

  // Wait for the application to load
  await page.waitForSelector('.v-application', { timeout: 30000 });

  // Look for AppEditor or AI assistant navigation link
  const appEditorSelectors = [
    'a[href*="app-editor"]',
    'a[href*="appeditor"]',
    '[data-testid*="app-editor"]',
    'text=App Editor',
    'text=AppEditor',
  ];

  let navigated = false;
  for (const selector of appEditorSelectors) {
    const el = page.locator(selector).first();
    if (await el.isVisible({ timeout: 3000 }).catch(() => false)) {
      await el.click();
      navigated = true;
      break;
    }
  }

  if (!navigated) {
    // Try direct URL navigation
    await page.goto('https://app-staging.vivacityapp.com/demo-student/app-editor');
    await page.waitForSelector('.v-application', { timeout: 15000 });
  }

  // Look for AI assistant button or chat interface
  const aiAssistantSelectors = [
    '[data-testid*="ai-assistant"]',
    '[data-testid*="ai-chat"]',
    'text=AI Assistant',
    'text=AI assistant',
    '[aria-label*="AI"]',
    'button[class*="ai"]',
    '.ai-assistant',
    '.chat-assistant',
  ];

  let aiOpened = false;
  for (const selector of aiAssistantSelectors) {
    const el = page.locator(selector).first();
    if (await el.isVisible({ timeout: 3000 }).catch(() => false)) {
      await el.click();
      aiOpened = true;
      break;
    }
  }

  // Wait for chat/message input to appear
  const chatInputSelectors = [
    'textarea[placeholder*="message"]',
    'textarea[placeholder*="Message"]',
    'input[placeholder*="message"]',
    'input[placeholder*="Message"]',
    'textarea[placeholder*="Ask"]',
    'input[placeholder*="Ask"]',
    '[data-testid*="chat-input"]',
    '[data-testid*="message-input"]',
    '.chat-input textarea',
    '.message-input',
  ];

  let chatInput = null;
  for (const selector of chatInputSelectors) {
    const el = page.locator(selector).first();
    if (await el.isVisible({ timeout: 5000 }).catch(() => false)) {
      chatInput = el;
      break;
    }
  }

  // If no chat input found with specific selectors, try broader approach
  if (!chatInput) {
    chatInput = page.locator('textarea').first();
    const isVisible = await chatInput.isVisible({ timeout: 5000 }).catch(() => false);
    if (!isVisible) {
      // Try to find any text input area
      chatInput = page.locator('input[type="text"]').first();
    }
  }

  expect(chatInput).not.toBeNull();
  await expect(chatInput!).toBeVisible({ timeout: 15000 });

  // Type a test message to the AI assistant
  const testMessage = 'Hello, can you help me with a simple question?';
  await chatInput!.click();
  await chatInput!.fill(testMessage);

  // Find and click the send button
  const sendButtonSelectors = [
    'button[aria-label*="send"]',
    'button[aria-label*="Send"]',
    '[data-testid*="send"]',
    'button[type="submit"]',
    '.send-button',
    'button:has(.mdi-send)',
    'button:has-text("Send")',
  ];

  let sendButton = null;
  for (const selector of sendButtonSelectors) {
    const el = page.locator(selector).first();
    if (await el.isVisible({ timeout: 3000 }).catch(() => false)) {
      sendButton = el;
      break;
    }
  }

  if (sendButton) {
    await sendButton.click();
  } else {
    // Try pressing Enter to send the message
    await chatInput!.press('Enter');
  }

  // Wait for AI response - the bug is that AI doesn't reply
  // Look for any response message appearing after sending
  const responseSelectors = [
    '[data-testid*="ai-response"]',
    '[data-testid*="assistant-message"]',
    '.assistant-message',
    '.ai-message',
    '.chat-message:not(.user-message)',
    '[data-role="assistant"]',
    '.message-bubble.assistant',
    '.response-content',
  ];

  let responseFound = false;
  for (const selector of responseSelectors) {
    const el = page.locator(selector).first();
    if (await el.isVisible({ timeout: 30000 }).catch(() => false)) {
      responseFound = true;
      break;
    }
  }

  // If specific response selectors didn't work, check that the message count increased
  // or that there's some loading indicator followed by content
  if (!responseFound) {
    // Check for loading indicator first (AI is processing)
    const loadingSelectors = [
      '.v-progress-circular',
      '.loading-indicator',
      '[data-testid*="loading"]',
      '.mdi-loading',
      '.typing-indicator',
    ];

    let loadingFound = false;
    for (const selector of loadingSelectors) {
      const el = page.locator(selector).first();
      if (await el.isVisible({ timeout: 10000 }).catch(() => false)) {
        loadingFound = true;
        // Wait for loading to disappear (response received)
        await el.waitFor({ state: 'hidden', timeout: 60000 });
        break;
      }
    }

    // After loading, check for response content
    for (const selector of responseSelectors) {
      const el = page.locator(selector).first();
      if (await el.isVisible({ timeout: 15000 }).catch(() => false)) {
        responseFound = true;
        break;
      }
    }
  }

  // Assert that the AI responded - this FAILS if bug is present, PASSES when fixed
  expect(responseFound, 'AI assistant did not reply to the message. Bug #17646 is present.').toBe(true);
});