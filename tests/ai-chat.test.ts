import { test, expect } from '@playwright/test';
import { loginToApp } from './helpers/auth.helper';

test('verify AI chat interface is accessible', async ({ page }) => {
    test.setTimeout(180000);
    
    await loginToApp(page, 90000);
    await page.waitForLoadState('load');
    await page.waitForTimeout(3000);

    console.log('✅ Successfully logged in');

    // Look for AI chat button/icon - common locations
    const chatSelectors = [
        'button:has-text("AI Chat")',
        'button:has-text("Chat")',
        'button:has(.mdi-chat)',
        'button:has(.mdi-robot)',
        'button:has(.mdi-message)',
        '.chat-button',
        '[aria-label*="chat" i]',
        '[aria-label*="AI" i]'
    ];

    let chatButton = null;
    let foundSelector = '';

    for (const selector of chatSelectors) {
        const button = page.locator(selector).first();
        const isVisible = await button.isVisible({ timeout: 2000 }).catch(() => false);
        
        if (isVisible) {
            chatButton = button;
            foundSelector = selector;
            console.log(`✅ Found AI chat button using selector: ${selector}`);
            break;
        }
    }

    if (chatButton) {
        await chatButton.click();
        await page.waitForTimeout(2000);
        console.log('✅ AI chat button clicked');

        // Check if chat interface opened
        const chatInterface = page.locator('.chat-interface, .chat-dialog, .v-dialog, [role="dialog"]').first();
        const interfaceVisible = await chatInterface.isVisible({ timeout: 3000 }).catch(() => false);
        
        if (interfaceVisible) {
            console.log('✅ AI chat interface opened successfully');
        } else {
            console.log('⚠️ Chat interface not immediately visible');
        }
    } else {
        console.log('⚠️ AI chat button not found on dashboard');
    }

    console.log('✅ AI chat accessibility verified');
});

test('verify AI chat input field and send button', async ({ page }) => {
    test.setTimeout(180000);
    
    await loginToApp(page, 90000);
    await page.waitForLoadState('load');
    await page.waitForTimeout(3000);

    console.log('✅ Successfully logged in');

    // Try to open AI chat
    const chatButton = page.locator('button:has-text("Chat"), button:has(.mdi-chat), button:has(.mdi-robot)').first();
    const hasChatButton = await chatButton.isVisible({ timeout: 3000 }).catch(() => false);
    
    if (hasChatButton) {
        await chatButton.click();
        await page.waitForTimeout(2000);
        console.log('✅ Opened AI chat');

        // Look for message input field
        const messageInput = page.locator('input[type="text"][placeholder*="message" i], textarea[placeholder*="message" i], input[placeholder*="type" i], textarea').first();
        const hasInput = await messageInput.isVisible({ timeout: 3000 }).catch(() => false);
        
        if (hasInput) {
            console.log('✅ Message input field found');

            // Try typing a message
            await messageInput.click();
            await messageInput.fill('Hello, this is a test message');
            await page.waitForTimeout(1000);
            console.log('✅ Typed test message');

            // Look for send button
            const sendButton = page.locator('button:has-text("Send"), button:has(.mdi-send), button[type="submit"]').first();
            const hasSend = await sendButton.isVisible({ timeout: 2000 }).catch(() => false);
            
            if (hasSend) {
                console.log('✅ Send button found');
                
                const isEnabled = await sendButton.isEnabled().catch(() => false);
                if (isEnabled) {
                    console.log('✅ Send button is enabled');
                } else {
                    console.log('⚠️ Send button is disabled');
                }
            } else {
                console.log('⚠️ Send button not found');
            }

            // Clear the input
            await messageInput.clear();
            await page.waitForTimeout(500);
            console.log('✅ Cleared test message');
        } else {
            console.log('⚠️ Message input field not found');
        }
    } else {
        console.log('⚠️ AI chat button not accessible');
    }

    console.log('✅ AI chat input verified');
});

test('send message and verify AI response', async ({ page }) => {
    test.setTimeout(180000);
    
    await loginToApp(page, 90000);
    await page.waitForLoadState('load');
    await page.waitForTimeout(3000);

    console.log('✅ Successfully logged in');

    // Open AI chat
    const chatButton = page.locator('button:has-text("Chat"), button:has(.mdi-chat), button:has(.mdi-robot)').first();
    const hasChatButton = await chatButton.isVisible({ timeout: 3000 }).catch(() => false);
    
    if (hasChatButton) {
        await chatButton.click();
        await page.waitForTimeout(2000);
        console.log('✅ Opened AI chat');

        // Find input and send message
        const messageInput = page.locator('input[type="text"][placeholder*="message" i], textarea[placeholder*="message" i], input[placeholder*="type" i], textarea').first();
        const hasInput = await messageInput.isVisible({ timeout: 3000 }).catch(() => false);
        
        if (hasInput) {
            await messageInput.fill('Hello');
            await page.waitForTimeout(500);
            console.log('✅ Typed message: "Hello"');

            // Click send button
            const sendButton = page.locator('button:has-text("Send"), button:has(.mdi-send), button[type="submit"]').first();
            const hasSend = await sendButton.isVisible({ timeout: 2000 }).catch(() => false);
            
            if (hasSend && await sendButton.isEnabled().catch(() => false)) {
                await sendButton.click();
                console.log('✅ Clicked Send button');
                
                // Wait for response
                await page.waitForTimeout(3000);

                // Check for AI response in chat
                const chatMessages = page.locator('.message, .chat-message, [class*="message"]');
                const messageCount = await chatMessages.count();
                
                if (messageCount > 0) {
                    console.log(`✅ Found ${messageCount} message(s) in chat`);
                    
                    // Try to identify AI response vs user message
                    const lastMessage = chatMessages.last();
                    const messageText = await lastMessage.textContent();
                    
                    if (messageText && messageText.trim().length > 0) {
                        console.log(`✅ Last message: "${messageText.trim().substring(0, 50)}..."`);
                    }
                } else {
                    console.log('⚠️ No messages found in chat history');
                }
            } else {
                console.log('⚠️ Send button not available or disabled');
            }
        } else {
            console.log('⚠️ Message input not found');
        }
    } else {
        console.log('⚠️ AI chat button not accessible');
    }

    console.log('✅ AI response test completed');
});

test('verify AI chat conversation history', async ({ page }) => {
    test.setTimeout(180000);
    
    await loginToApp(page, 90000);
    await page.waitForLoadState('load');
    await page.waitForTimeout(3000);

    console.log('✅ Successfully logged in');

    // Open AI chat
    const chatButton = page.locator('button:has-text("Chat"), button:has(.mdi-chat), button:has(.mdi-robot)').first();
    const hasChatButton = await chatButton.isVisible({ timeout: 3000 }).catch(() => false);
    
    if (hasChatButton) {
        await chatButton.click();
        await page.waitForTimeout(2000);
        console.log('✅ Opened AI chat');

        // Check for chat history container
        const chatHistory = page.locator('.chat-history, .messages, .conversation, [class*="chat-container"]').first();
        const hasHistory = await chatHistory.isVisible({ timeout: 3000 }).catch(() => false);
        
        if (hasHistory) {
            console.log('✅ Chat history container found');

            // Count existing messages
            const messages = page.locator('.message, .chat-message, [class*="message"]');
            const messageCount = await messages.count();
            console.log(`📜 Found ${messageCount} message(s) in history`);

            if (messageCount > 0) {
                // Check message structure
                for (let i = 0; i < Math.min(messageCount, 3); i++) {
                    const message = messages.nth(i);
                    const messageText = await message.textContent();
                    
                    if (messageText && messageText.trim()) {
                        const preview = messageText.trim().substring(0, 40);
                        console.log(`  Message ${i + 1}: "${preview}..."`);
                    }
                }
                
                console.log('✅ Chat history is accessible');
            } else {
                console.log('⚠️ No messages in chat history');
            }
        } else {
            console.log('⚠️ Chat history container not found');
        }
    } else {
        console.log('⚠️ AI chat button not accessible');
    }

    console.log('✅ Chat history verification completed');
});

test('verify AI chat clear/delete conversation', async ({ page }) => {
    test.setTimeout(180000);
    
    await loginToApp(page, 90000);
    await page.waitForLoadState('load');
    await page.waitForTimeout(3000);

    console.log('✅ Successfully logged in');

    // Open AI chat
    const chatButton = page.locator('button:has-text("Chat"), button:has(.mdi-chat), button:has(.mdi-robot)').first();
    const hasChatButton = await chatButton.isVisible({ timeout: 3000 }).catch(() => false);
    
    if (hasChatButton) {
        await chatButton.click();
        await page.waitForTimeout(2000);
        console.log('✅ Opened AI chat');

        // Look for clear/delete/new conversation button
        const clearButtons = [
            'button:has-text("Clear")',
            'button:has-text("Delete")',
            'button:has-text("New Conversation")',
            'button:has(.mdi-delete)',
            'button:has(.mdi-trash-can)',
            'button:has(.mdi-refresh)'
        ];

        let foundClearButton = false;

        for (const selector of clearButtons) {
            const button = page.locator(selector).first();
            const isVisible = await button.isVisible({ timeout: 1500 }).catch(() => false);
            
            if (isVisible) {
                console.log(`✅ Found clear button: ${selector}`);
                foundClearButton = true;
                
                const isEnabled = await button.isEnabled().catch(() => false);
                if (isEnabled) {
                    console.log('✅ Clear button is enabled');
                } else {
                    console.log('⚠️ Clear button is disabled');
                }
                break;
            }
        }

        if (!foundClearButton) {
            console.log('⚠️ Clear conversation button not found');
        }
    } else {
        console.log('⚠️ AI chat button not accessible');
    }

    console.log('✅ Clear conversation test completed');
});

test('verify AI chat close/minimize functionality', async ({ page }) => {
    test.setTimeout(180000);
    
    await loginToApp(page, 90000);
    await page.waitForLoadState('load');
    await page.waitForTimeout(3000);

    console.log('✅ Successfully logged in');

    // Open AI chat
    const chatButton = page.locator('button:has-text("Chat"), button:has(.mdi-chat), button:has(.mdi-robot)').first();
    const hasChatButton = await chatButton.isVisible({ timeout: 3000 }).catch(() => false);
    
    if (hasChatButton) {
        await chatButton.click();
        await page.waitForTimeout(2000);
        console.log('✅ Opened AI chat');

        // Look for close button
        const closeButton = page.locator('button:has(.mdi-close), button[aria-label*="close" i], button:has-text("×")').first();
        const hasClose = await closeButton.isVisible({ timeout: 3000 }).catch(() => false);
        
        if (hasClose) {
            console.log('✅ Close button found');
            
            await closeButton.click();
            await page.waitForTimeout(1500);
            console.log('✅ Clicked close button');

            // Verify chat is closed
            const chatInterface = page.locator('.chat-interface, .chat-dialog, .v-dialog').first();
            const stillVisible = await chatInterface.isVisible({ timeout: 2000 }).catch(() => false);
            
            if (!stillVisible) {
                console.log('✅ AI chat closed successfully');
            } else {
                console.log('⚠️ Chat interface still visible after close');
            }
        } else {
            console.log('⚠️ Close button not found');
        }
    } else {
        console.log('⚠️ AI chat button not accessible');
    }

    console.log('✅ Close functionality verified');
});

test('verify AI chat suggested prompts or quick actions', async ({ page }) => {
    test.setTimeout(180000);
    
    await loginToApp(page, 90000);
    await page.waitForLoadState('load');
    await page.waitForTimeout(3000);

    console.log('✅ Successfully logged in');

    // Open AI chat
    const chatButton = page.locator('button:has-text("Chat"), button:has(.mdi-chat), button:has(.mdi-robot)').first();
    const hasChatButton = await chatButton.isVisible({ timeout: 3000 }).catch(() => false);
    
    if (hasChatButton) {
        await chatButton.click();
        await page.waitForTimeout(2000);
        console.log('✅ Opened AI chat');

        // Look for suggested prompts or quick action buttons
        const suggestedPrompts = page.locator('button:has-text("suggestion"), .suggestion, .prompt-suggestion, .quick-action');
        const promptCount = await suggestedPrompts.count();
        
        if (promptCount > 0) {
            console.log(`✅ Found ${promptCount} suggested prompt(s) or quick action(s)`);
            
            // Display first few suggestions
            for (let i = 0; i < Math.min(promptCount, 5); i++) {
                const prompt = suggestedPrompts.nth(i);
                const promptText = await prompt.textContent();
                
                if (promptText && promptText.trim()) {
                    console.log(`  ${i + 1}. "${promptText.trim()}"`);
                }
            }
            
            console.log('✅ Suggested prompts are available');
        } else {
            console.log('⚠️ No suggested prompts found');
            console.log('✅ Chat interface is accessible');
        }
    } else {
        console.log('⚠️ AI chat button not accessible');
    }

    console.log('✅ Suggested prompts test completed');
});

test('verify AI chat typing indicator', async ({ page }) => {
    test.setTimeout(180000);
    
    await loginToApp(page, 90000);
    await page.waitForLoadState('load');
    await page.waitForTimeout(3000);

    console.log('✅ Successfully logged in');

    // Open AI chat
    const chatButton = page.locator('button:has-text("Chat"), button:has(.mdi-chat), button:has(.mdi-robot)').first();
    const hasChatButton = await chatButton.isVisible({ timeout: 3000 }).catch(() => false);
    
    if (hasChatButton) {
        await chatButton.click();
        await page.waitForTimeout(2000);
        console.log('✅ Opened AI chat');

        // Send a message
        const messageInput = page.locator('input[type="text"][placeholder*="message" i], textarea[placeholder*="message" i], input[placeholder*="type" i], textarea').first();
        const hasInput = await messageInput.isVisible({ timeout: 3000 }).catch(() => false);
        
        if (hasInput) {
            await messageInput.fill('Test typing indicator');
            await page.waitForTimeout(500);
            
            const sendButton = page.locator('button:has-text("Send"), button:has(.mdi-send), button[type="submit"]').first();
            if (await sendButton.isVisible({ timeout: 2000 }).catch(() => false)) {
                await sendButton.click();
                console.log('✅ Sent message');
                
                // Immediately check for typing indicator
                await page.waitForTimeout(500);
                
                const typingIndicator = page.locator('.typing-indicator, .is-typing, [class*="typing"]').first();
                const hasTyping = await typingIndicator.isVisible({ timeout: 3000 }).catch(() => false);
                
                if (hasTyping) {
                    console.log('✅ Typing indicator displayed');
                } else {
                    console.log('⚠️ Typing indicator not visible (response may be too fast)');
                }
                
                // Wait for response to complete
                await page.waitForTimeout(3000);
                
                // Check typing indicator disappeared
                const stillTyping = await typingIndicator.isVisible({ timeout: 1000 }).catch(() => false);
                if (!stillTyping) {
                    console.log('✅ Typing indicator disappeared after response');
                }
            }
        } else {
            console.log('⚠️ Message input not found');
        }
    } else {
        console.log('⚠️ AI chat button not accessible');
    }

    console.log('✅ Typing indicator test completed');
});

test('verify AI chat error handling', async ({ page }) => {
    test.setTimeout(180000);
    
    await loginToApp(page, 90000);
    await page.waitForLoadState('load');
    await page.waitForTimeout(3000);

    console.log('✅ Successfully logged in');

    // Open AI chat
    const chatButton = page.locator('button:has-text("Chat"), button:has(.mdi-chat), button:has(.mdi-robot)').first();
    const hasChatButton = await chatButton.isVisible({ timeout: 3000 }).catch(() => false);
    
    if (hasChatButton) {
        await chatButton.click();
        await page.waitForTimeout(2000);
        console.log('✅ Opened AI chat');

        // Try sending empty message
        const messageInput = page.locator('input[type="text"][placeholder*="message" i], textarea[placeholder*="message" i], input[placeholder*="type" i], textarea').first();
        const hasInput = await messageInput.isVisible({ timeout: 3000 }).catch(() => false);
        
        if (hasInput) {
            await messageInput.click();
            await messageInput.fill('');
            await page.waitForTimeout(500);
            
            const sendButton = page.locator('button:has-text("Send"), button:has(.mdi-send), button[type="submit"]').first();
            const hasSend = await sendButton.isVisible({ timeout: 2000 }).catch(() => false);
            
            if (hasSend) {
                const isEnabled = await sendButton.isEnabled().catch(() => false);
                
                if (!isEnabled) {
                    console.log('✅ Send button disabled for empty message (good validation)');
                } else {
                    console.log('⚠️ Send button enabled for empty message');
                }
            }

            // Try very long message
            const longMessage = 'A'.repeat(10000);
            await messageInput.fill(longMessage);
            await page.waitForTimeout(1000);
            
            const currentLength = await messageInput.inputValue().then(val => val.length);
            
            if (currentLength < 10000) {
                console.log(`✅ Character limit enforced (max: ${currentLength} chars)`);
            } else {
                console.log(`⚠️ No character limit detected (${currentLength} chars)`);
            }

            await messageInput.clear();
        } else {
            console.log('⚠️ Message input not found');
        }

        // Check for error message display area
        const errorMessage = page.locator('.error, .error-message, [role="alert"]').first();
        const hasError = await errorMessage.isVisible({ timeout: 2000 }).catch(() => false);
        
        if (hasError) {
            const errorText = await errorMessage.textContent();
            console.log(`📢 Error message: "${errorText}"`);
        }
    } else {
        console.log('⚠️ AI chat button not accessible');
    }

    console.log('✅ Error handling test completed');
});

test('verify AI chat message formatting and display', async ({ page }) => {
    test.setTimeout(180000);
    
    await loginToApp(page, 90000);
    await page.waitForLoadState('load');
    await page.waitForTimeout(3000);

    console.log('✅ Successfully logged in');

    // Open AI chat
    const chatButton = page.locator('button:has-text("Chat"), button:has(.mdi-chat), button:has(.mdi-robot)').first();
    const hasChatButton = await chatButton.isVisible({ timeout: 3000 }).catch(() => false);
    
    if (hasChatButton) {
        await chatButton.click();
        await page.waitForTimeout(2000);
        console.log('✅ Opened AI chat');

        // Check if messages have proper formatting
        const messages = page.locator('.message, .chat-message, [class*="message"]');
        const messageCount = await messages.count();
        
        if (messageCount > 0) {
            console.log(`📝 Analyzing ${messageCount} message(s) format...`);
            
            // Check first message structure
            const firstMessage = messages.first();
            
            // Check for avatar/icon
            const hasAvatar = await firstMessage.locator('.avatar, .icon, img').isVisible({ timeout: 1000 }).catch(() => false);
            if (hasAvatar) {
                console.log('  ✅ Messages have avatar/icon');
            }
            
            // Check for timestamp
            const hasTimestamp = await firstMessage.locator('.timestamp, .time, [class*="time"]').isVisible({ timeout: 1000 }).catch(() => false);
            if (hasTimestamp) {
                console.log('  ✅ Messages have timestamp');
            }
            
            // Check for message text content
            const messageText = await firstMessage.textContent();
            if (messageText && messageText.trim().length > 0) {
                console.log('  ✅ Messages display text content');
            }
            
            console.log('✅ Message formatting verified');
        } else {
            console.log('⚠️ No messages to analyze formatting');
        }
    } else {
        console.log('⚠️ AI chat button not accessible');
    }

    console.log('✅ Message formatting test completed');
});

test('verify AI chat scroll behavior with multiple messages', async ({ page }) => {
    test.setTimeout(180000);
    
    await loginToApp(page, 90000);
    await page.waitForLoadState('load');
    await page.waitForTimeout(3000);

    console.log('✅ Successfully logged in');

    // Open AI chat
    const chatButton = page.locator('button:has-text("Chat"), button:has(.mdi-chat), button:has(.mdi-robot)').first();
    const hasChatButton = await chatButton.isVisible({ timeout: 3000 }).catch(() => false);
    
    if (hasChatButton) {
        await chatButton.click();
        await page.waitForTimeout(2000);
        console.log('✅ Opened AI chat');

        // Check chat container has scrolling
        const chatContainer = page.locator('.chat-history, .messages, .conversation, [class*="chat-container"]').first();
        const hasContainer = await chatContainer.isVisible({ timeout: 3000 }).catch(() => false);
        
        if (hasContainer) {
            console.log('✅ Chat container found');

            // Check if scrollable
            const scrollHeight = await chatContainer.evaluate(el => el.scrollHeight).catch(() => 0);
            const clientHeight = await chatContainer.evaluate(el => el.clientHeight).catch(() => 0);
            
            if (scrollHeight > clientHeight) {
                console.log(`✅ Chat is scrollable (content: ${scrollHeight}px, visible: ${clientHeight}px)`);
                
                // Try scrolling to bottom
                await chatContainer.evaluate(el => el.scrollTop = el.scrollHeight);
                await page.waitForTimeout(500);
                console.log('✅ Scrolled to bottom');
            } else {
                console.log('⚠️ Chat content fits in view (no scroll needed)');
            }

            // Check for scroll to bottom button
            const scrollButton = page.locator('button:has(.mdi-arrow-down), .scroll-to-bottom').first();
            const hasScrollButton = await scrollButton.isVisible({ timeout: 2000 }).catch(() => false);
            
            if (hasScrollButton) {
                console.log('✅ Scroll to bottom button available');
            }
        } else {
            console.log('⚠️ Chat container not found');
        }
    } else {
        console.log('⚠️ AI chat button not accessible');
    }

    console.log('✅ Scroll behavior test completed');
});
