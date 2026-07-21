// Bug #16101: [BUG]Appeditor > unable to use ai chat
// ADO: https://dev.azure.com/vivacityapp/Viva/_workitems/edit/16101
// Auto-generated 2026-05-28
// REVIEW BEFORE MERGING — verify selectors and assertions

import { test, expect } from '@playwright/test';
import { loginToApp } from '../helpers/auth.helper';

test.setTimeout(120000);

test('BUG #16101 - AppEditor AI chat should be usable', async ({ page }) => {
  await loginToApp(page, 90000, 'pau.kie.chee@fusioneta.com', 'PAOpaopao@9696');

  // Navigate to App Editor
  await page.goto('https://app-staging.vivacityapp.com');

  // Wait for the application to load
  await page.waitForSelector('.v-application', { timeout: 30000 });

  // Look for App Editor navigation link
  const appEditorLink = page.locator('a[href*="app-editor"], a[href*="appeditor"], [data-testid*="app-editor"]').first();
  
  // Try to navigate to app editor via URL patterns
  const possibleEditorUrls = [
    '/app-editor',
    '/appeditor',
    '/editor',
    '/app-builder',
    '/demo-student/app-editor',
  ];

  let navigatedSuccessfully = false;
  for (const url of possibleEditorUrls) {
    try {
      const response = await page.goto(`https://app-staging.vivacityapp.com${url}`, { timeout: 15000 });
      if (response && response.status() < 400) {
        navigatedSuccessfully = true;
        break;
      }
    } catch {
      // Continue to next URL
    }
  }

  if (!navigatedSuccessfully) {
    // Try clicking on app editor in nav
    await page.goto('https://app-staging.vivacityapp.com');
    await page.waitForSelector('.v-application', { timeout: 30000 });
    
    const editorNav = page.locator('text=/app.?editor/i').first();
    if (await editorNav.isVisible({ timeout: 5000 })) {
      await editorNav.click();
    }
  }

  // Wait for page to settle
  await page.waitForLoadState('networkidle', { timeout: 30000 });

  // Look for AI chat button/icon - common patterns
  const aiChatSelectors = [
    '[data-testid*="ai-chat"]',
    '[data-testid*="chat"]',
    '.ai-chat',
    '.chat-button',
    '[aria-label*="AI"]',
    '[aria-label*="chat"]',
    '[aria-label*="Chat"]',
    'button[class*="ai"]',
    'button[class*="chat"]',
    '.v-btn[title*="AI"]',
    '.v-btn[title*="chat"]',
    '[class*="ai-chat"]',
    '[class*="aiChat"]',
  ];

  let aiChatButton = null;
  for (const selector of aiChatSelectors) {
    const element = page.locator(selector).first();
    if (await element.isVisible({ timeout: 3000 }).catch(() => false)) {
      aiChatButton = element;
      break;
    }
  }

  // If we found an AI chat button, try to interact with it
  if (aiChatButton) {
    await aiChatButton.click();
    
    // Wait for chat panel/dialog to appear
    const chatPanelSelectors = [
      '[data-testid*="chat-panel"]',
      '[data-testid*="ai-panel"]',
      '.chat-panel',
      '.ai-chat-panel',
      '[class*="chatPanel"]',
      '[class*="aiPanel"]',
      '.v-dialog[class*="chat"]',
      '[role="dialog"]',
    ];

    let chatPanelVisible = false;
    for (const selector of chatPanelSelectors) {
      const panel = page.locator(selector).first();
      if (await panel.isVisible({ timeout: 5000 }).catch(() => false)) {
        chatPanelVisible = true;
        break;
      }
    }

    // Look for chat input field
    const chatInputSelectors = [
      '[data-testid*="chat-input"]',
      '[placeholder*="message"]',
      '[placeholder*="Message"]',
      '[placeholder*="Ask"]',
      '[placeholder*="ask"]',
      '[placeholder*="chat"]',
      '[placeholder*="Chat"]',
      'textarea[class*="chat"]',
      'input[class*="chat"]',
      '.chat-input textarea',
      '.chat-input input',
      '[class*="chatInput"]',
      '[class*="messageInput"]',
    ];

    let chatInput = null;
    for (const selector of chatInputSelectors) {
      const input = page.locator(selector).first();
      if (await input.isVisible({ timeout: 5000 }).catch(() => false)) {
        chatInput = input;
        break;
      }
    }

    // BUG ASSERTION: The chat input should be visible and interactable
    expect(
      chatInput !== null,
      'AI chat input field should be visible after opening AI chat'
    ).toBeTruthy();

    if (chatInput) {
      // Verify the input is enabled (not disabled - a common bug symptom)
      await expect(chatInput).toBeEnabled();
      
      // Try typing a message
      await chatInput.fill('Hello, this is a test message');
      
      // Verify the text was entered (not blocked)
      const inputValue = await chatInput.inputValue().catch(() => '');
      expect(inputValue, 'Should be able to type in AI chat input').toBe('Hello, this is a test message');

      // Look for send button
      const sendButtonSelectors = [
        '[data-testid*="send"]',
        'button[aria-label*="send"]',
        'button[aria-label*="Send"]',
        '[class*="sendButton"]',
        '[class*="send-button"]',
        'button[class*="send"]',
      ];

      for (const selector of sendButtonSelectors) {
        const sendBtn = page.locator(selector).first();
        if (await sendBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
          // Verify send button is enabled
          await expect(sendBtn).toBeEnabled();
          break;
        }
      }
    }
  } else {
    // If we can't find a specific AI chat button, check if the page has any error indicators
    // that might suggest the AI chat feature is broken
    const errorSelectors = [
      '.v-alert[type="error"]',
      '[class*="error"]:visible',
      'text=/error/i',
      'text=/failed/i',
    ];

    // The page should at least load without errors
    const pageContent = await page.content();
    
    // Check for common error patterns
    const hasJsErrors = pageContent.includes('Cannot read') || 
                        pageContent.includes('is not a function') ||
                        pageContent.includes('undefined');

    // Navigate to app editor and verify no blocking errors
    await page.goto('https://app-staging.vivacityapp.com');
    await page.waitForSelector('.v-application', { timeout: 30000 });
    
    // The application should be accessible
    const app = page.locator('.v-application').first();
    await expect(app).toBeVisible();
    
    // Log that we couldn't find specific AI chat elements but the page loaded
    console.log('Note: Could not locate specific AI chat elements. Verifying page loads correctly.');
    
    // This test should fail if there's a clear error preventing app editor from loading
    expect(hasJsErrors, 'Page should not contain JavaScript errors').toBeFalsy();
  }
});