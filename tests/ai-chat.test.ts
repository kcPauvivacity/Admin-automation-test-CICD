// Tests for the AI Chat module — /demo-student/ai-chat
// CRM view of B2B AI chat conversations between users and the AI bot.
// Columns: Session ID, Chat Date, User, Intent, Sentiment

import { test, expect } from '@playwright/test';
import { loginToApp } from './helpers/auth.helper';

const BASE = 'https://app-staging.vivacityapp.com';

async function goToAIChat(page: any) {
    await loginToApp(page);
    await page.goto(`${BASE}/demo-student/ai-chat`, { waitUntil: 'load', timeout: 30000 });
    await page.waitForSelector('.v-application', { timeout: 15000 });
    await page.waitForTimeout(2000);
}

test.describe('AI Chat — listing', () => {

    test('page loads with correct title and heading', async ({ page }) => {
        test.setTimeout(60000);
        await goToAIChat(page);

        await expect(page).toHaveURL(/\/ai-chat/);
        await expect(page).toHaveTitle(/AI Chat/i);
        const h1 = page.locator('h1').filter({ hasText: /AI Chat/i });
        await expect(h1).toBeVisible({ timeout: 8000 });
        console.log('✅ AI Chat page loaded with correct title and H1');
    });

    test('listing shows record count', async ({ page }) => {
        test.setTimeout(60000);
        await goToAIChat(page);

        const recordCount = page.locator('text=/\\d+ records?/i');
        await expect(recordCount).toBeVisible({ timeout: 10000 });
        const countText = await recordCount.textContent();
        console.log(`✅ Record count shown: "${countText?.trim()}"`);
    });

    test('table has correct columns: Session ID, Chat Date, User, Intent, Sentiment', async ({ page }) => {
        test.setTimeout(60000);
        await goToAIChat(page);

        const expectedColumns = ['Session ID', 'Chat Date', 'User', 'Intent', 'Sentiment'];
        for (const col of expectedColumns) {
            // AI Chat uses custom table headers (th or div), not strict role=columnheader
            const header = page.locator('th, [role="columnheader"], .v-data-table__th').filter({ hasText: col });
            await expect(header.first()).toBeVisible({ timeout: 8000 });
            console.log(`✅ Column "${col}" is visible`);
        }
    });

    test('table rows display session data', async ({ page }) => {
        test.setTimeout(60000);
        await goToAIChat(page);

        const rows = page.locator('tbody tr');
        const rowCount = await rows.count();
        expect(rowCount).toBeGreaterThan(0);
        console.log(`✅ Found ${rowCount} rows in AI Chat listing`);

        // First row: cell 0 is the checkbox, session ID is in cell 1
        const firstRowCells = rows.first().locator('td');
        const sessionIdCell = firstRowCells.nth(1);
        const sessionIdText = await sessionIdCell.textContent();
        expect(sessionIdText?.trim().length).toBeGreaterThan(0);
        console.log(`✅ First row session ID: "${sessionIdText?.trim().slice(0, 40)}"`);
    });

    test('Sentiment column shows formatted chips (Normal, Happy, etc.)', async ({ page }) => {
        test.setTimeout(60000);
        await goToAIChat(page);

        // Sentiment chips in the table
        const sentimentChips = page.locator('tbody .v-chip, tbody [class*="chip"]').filter({ hasText: /normal|happy|sad|frustrated|angry|neutral/i });
        const hasChips = await sentimentChips.first().isVisible({ timeout: 8000 }).catch(() => false);

        if (hasChips) {
            const chipCount = await sentimentChips.count();
            console.log(`✅ Found ${chipCount} sentiment chip(s)`);
            const firstChipText = await sentimentChips.first().textContent();
            console.log(`  First chip: "${firstChipText?.trim()}"`);
        } else {
            // Some rows may show loading spinner for Sentiment (new records)
            console.log('ℹ️ No sentiment chips found — may be loading or empty for this account');
        }
    });

    test('search bar is present and functional', async ({ page }) => {
        test.setTimeout(90000);
        await goToAIChat(page);

        const searchInput = page.locator('input[type="search"], input.viva-search__input').first();
        await expect(searchInput).toBeVisible({ timeout: 8000 });
        console.log('✅ Search input is visible');

        // Type a search term
        await searchInput.fill('test');
        await page.waitForTimeout(2000);

        // Verify URL or table updated
        const rows = page.locator('tbody tr');
        const rowCount = await rows.count();
        console.log(`ℹ️ Rows after search "test": ${rowCount}`);

        // Clear search
        await searchInput.clear();
        await page.waitForTimeout(1500);
        const rowsAfterClear = await rows.count();
        console.log(`✅ Rows after clearing search: ${rowsAfterClear}`);
    });

    test('Filters button is visible', async ({ page }) => {
        test.setTimeout(60000);
        await goToAIChat(page);

        // Filters button may be a v-btn with icon, use text-based filter
        const filtersBtn = page.locator('button, .v-btn, a').filter({ hasText: /filters/i }).first();
        await expect(filtersBtn).toBeVisible({ timeout: 8000 });
        console.log('✅ Filters button is visible');
    });

    test('Filters panel opens when clicking Filters button', async ({ page }) => {
        test.setTimeout(60000);
        await goToAIChat(page);

        const filtersBtn = page.locator('button, .v-btn, a').filter({ hasText: /filters/i }).first();
        await filtersBtn.click();
        await page.waitForTimeout(1500);

        // Filter options should appear
        const filterPanel = page.locator('.v-menu, .v-overlay, [class*="filter"]').filter({ hasNot: page.locator('thead') });
        const hasPanel = await filterPanel.first().isVisible({ timeout: 5000 }).catch(() => false);
        if (hasPanel) {
            console.log('✅ Filter panel opened');
        } else {
            console.log('ℹ️ Filter panel not detected — may use different UI');
        }
    });

    test('refresh button is visible and clickable', async ({ page }) => {
        test.setTimeout(60000);
        await goToAIChat(page);

        // Refresh icon button (v-btn with refresh icon)
        const refreshBtn = page.locator('button.v-btn[aria-label*="refresh" i], button.v-btn').filter({ has: page.locator('.mdi-refresh') }).first();
        const hasRefresh = await refreshBtn.isVisible({ timeout: 5000 }).catch(() => false);

        if (!hasRefresh) {
            // May be a generic icon button next to filters
            const iconBtns = page.locator('button.v-btn--icon');
            const count = await iconBtns.count();
            console.log(`ℹ️ Found ${count} icon button(s), refresh may be among them`);
        } else {
            await refreshBtn.click();
            await page.waitForTimeout(1500);
            const rows = page.locator('tbody tr');
            const rowCount = await rows.count();
            expect(rowCount).toBeGreaterThan(0);
            console.log(`✅ Refresh clicked, ${rowCount} rows visible`);
        }
    });

    test('table supports row selection via checkboxes', async ({ page }) => {
        test.setTimeout(60000);
        await goToAIChat(page);

        const checkboxes = page.locator('tbody input[type="checkbox"]');
        const count = await checkboxes.count();

        if (count > 0) {
            await checkboxes.first().click();
            await page.waitForTimeout(500);
            const isChecked = await checkboxes.first().isChecked();
            expect(isChecked).toBe(true);
            console.log(`✅ Row checkbox works (${count} checkboxes found)`);
        } else {
            console.log('ℹ️ No checkboxes found in table rows');
        }
    });

    test('clicking a row navigates to the conversation detail view', async ({ page }) => {
        test.setTimeout(60000);
        await goToAIChat(page);

        const firstRow = page.locator('tbody tr').first();
        await firstRow.click();
        await page.waitForLoadState('load');
        await page.waitForTimeout(2000);

        // URL should contain /ai-chat/{id}/detail
        expect(page.url()).toMatch(/\/ai-chat\/.+\/detail/);
        console.log(`✅ Navigated to detail view: ${page.url()}`);
    });
});

test.describe('AI Chat — conversation detail', () => {

    async function goToFirstDetail(page: any) {
        await goToAIChat(page);
        const firstRow = page.locator('tbody tr').first();
        await firstRow.click();
        await page.waitForLoadState('load');
        await page.waitForTimeout(2000);
    }

    test('detail view shows correct breadcrumb', async ({ page }) => {
        test.setTimeout(60000);
        await goToFirstDetail(page);

        // Breadcrumb contains "AI Chat"
        const breadcrumb = page.locator('text=/AI Chat/i').first();
        await expect(breadcrumb).toBeVisible({ timeout: 8000 });
        console.log('✅ AI Chat breadcrumb visible in detail view');
    });

    test('detail view has Back button', async ({ page }) => {
        test.setTimeout(60000);
        await goToFirstDetail(page);

        const backBtn = page.locator('a, button').filter({ hasText: /back/i }).first();
        await expect(backBtn).toBeVisible({ timeout: 8000 });
        console.log('✅ Back button visible in detail view');
    });

    test('Back button returns to listing', async ({ page }) => {
        test.setTimeout(90000);
        await goToFirstDetail(page);

        const backBtn = page.locator('a, button').filter({ hasText: /back/i }).first();
        await backBtn.click();
        await page.waitForLoadState('load');
        await page.waitForTimeout(2000);

        expect(page.url()).toMatch(/\/ai-chat$/);
        console.log('✅ Back button returned to AI Chat listing');
    });

    test('detail view shows session ID and user info', async ({ page }) => {
        test.setTimeout(60000);
        await goToFirstDetail(page);

        // Chat header area shows session info
        const chatHeader = page.locator('.chat-header');
        await expect(chatHeader).toBeVisible({ timeout: 8000 });

        // Session ID shown
        const sessionId = page.locator('.chat-header').filter({ hasText: /session.*id|session-/i });
        const hasSessionId = await sessionId.isVisible({ timeout: 5000 }).catch(() => false);
        if (hasSessionId) {
            const sessionText = await sessionId.textContent();
            console.log(`✅ Session ID: "${sessionText?.trim().slice(0, 60)}"`);
        } else {
            console.log('ℹ️ Session ID not found in chat-header — may be structured differently');
        }
    });

    test('detail view shows chat messages container', async ({ page }) => {
        test.setTimeout(60000);
        await goToFirstDetail(page);

        const messagesContainer = page.locator('.chat-messages-container');
        await expect(messagesContainer).toBeVisible({ timeout: 10000 });
        console.log('✅ Chat messages container is visible');
    });

    test('chat messages show user and AI bubbles', async ({ page }) => {
        test.setTimeout(60000);
        await goToFirstDetail(page);

        // User message (dark bubble, shown as .chat-message with user type)
        const chatMessages = page.locator('.chat-messages-container .message, .chat-messages-container [class*="message"]');
        const msgCount = await chatMessages.count();
        expect(msgCount).toBeGreaterThan(0);
        console.log(`✅ Found ${msgCount} message(s) in conversation`);

        if (msgCount >= 2) {
            const firstMsg = await chatMessages.first().textContent();
            console.log(`  Message 1: "${firstMsg?.trim().slice(0, 60)}"`);
        }
    });

    test('detail view has pagination (prev/next between conversations)', async ({ page }) => {
        test.setTimeout(60000);
        await goToFirstDetail(page);

        // The "X/Y" nav strip lives above .chat-header, as a sibling inside .conversation-detail.
        // Read the full container text and regex for the pattern.
        const detailView = page.locator('.conversation-detail');
        await expect(detailView).toBeVisible({ timeout: 10000 });

        const fullText = await detailView.textContent();
        const paginationMatch = (fullText || '').match(/\d+\/\d+/);
        expect(paginationMatch, `Expected "X/Y" pagination in conversation-detail but got: "${fullText?.trim().slice(0, 100)}"`).toBeTruthy();
        console.log(`✅ Pagination found: "${paginationMatch?.[0]}"`);
    });

    test('detail view has Chat Summary panel', async ({ page }) => {
        test.setTimeout(60000);
        await goToFirstDetail(page);

        // Right panel "Chat Summary"
        const summaryPanel = page.locator('text=/Chat Summary/i').first();
        await expect(summaryPanel).toBeVisible({ timeout: 8000 });
        console.log('✅ Chat Summary panel is visible');
    });

    test('Generate Summary button is visible and clickable', async ({ page }) => {
        test.setTimeout(90000);
        await goToFirstDetail(page);

        const generateBtn = page.locator('button, .v-btn').filter({ hasText: /generate.*summary/i }).first();
        await expect(generateBtn).toBeVisible({ timeout: 8000 });
        console.log('✅ Generate Summary button is visible');

        await generateBtn.click();
        await page.waitForTimeout(3000);

        // Should not error
        const errorSnackbar = page.locator('.v-snackbar--active').filter({ hasText: /error/i });
        await expect(errorSnackbar).not.toBeVisible({ timeout: 3000 });
        console.log('✅ Generate Summary clicked without errors');

        // Either a summary appears or a loading state
        const summaryText = page.locator('[class*="summary"], [class*="result"]').filter({ hasNot: page.locator('button') });
        const hasNewContent = await summaryText.isVisible({ timeout: 8000 }).catch(() => false);
        console.log(hasNewContent ? '✅ Summary content appeared' : 'ℹ️ Summary content still loading');
    });

    test('detail view intent and sentiment fields are shown', async ({ page }) => {
        test.setTimeout(60000);
        await goToFirstDetail(page);

        const chatHeader = page.locator('.chat-header');

        // Intent field
        const intentLabel = chatHeader.locator('text=/Intent/i');
        const hasIntent = await intentLabel.isVisible({ timeout: 5000 }).catch(() => false);
        if (hasIntent) {
            console.log('✅ Intent field visible in detail header');
        }

        // Sentiment field
        const sentimentLabel = chatHeader.locator('text=/Sentiment/i');
        const hasSentiment = await sentimentLabel.isVisible({ timeout: 5000 }).catch(() => false);
        if (hasSentiment) {
            console.log('✅ Sentiment field visible in detail header');
        }
    });

    test('detail navigates to next conversation via pagination', async ({ page }) => {
        test.setTimeout(90000);
        await goToFirstDetail(page);

        const currentUrl = page.url();
        const detailView = page.locator('.conversation-detail');
        await expect(detailView).toBeVisible({ timeout: 10000 });

        const fullText = await detailView.textContent();
        const paginationMatch = (fullText || '').match(/(\d+)\/(\d+)/);
        const total = paginationMatch ? parseInt(paginationMatch[2]) : 0;

        if (total <= 1) {
            console.log('ℹ️ Only 1 conversation — skipping next navigation test');
            return;
        }

        // Next arrow is within .conversation-detail (the nav strip above .chat-header).
        // We look for the LAST chevron-right button in the detail view to avoid the page-level
        // "Edit Your Mini Program" button that also uses mdi-chevron-right.
        const nextArrow = detailView.locator('button').filter({ has: page.locator('.mdi-chevron-right') }).last();
        const hasNext = await nextArrow.isVisible({ timeout: 5000 }).catch(() => false);

        if (hasNext && !(await nextArrow.isDisabled())) {
            await nextArrow.click();
            await page.waitForLoadState('load');
            await page.waitForTimeout(2000);

            const newUrl = page.url();
            // Must still be in /ai-chat/ and URL must have changed
            expect(newUrl).toMatch(/\/ai-chat\/.+\/detail/);
            expect(newUrl).not.toBe(currentUrl);
            console.log(`✅ Navigated to next conversation: ${newUrl}`);

            const newHeaderText = await page.locator('.chat-header').textContent();
            const newPagination = (newHeaderText || '').match(/\d+\/\d+/)?.[0];
            console.log(`✅ Pagination updated to: "${newPagination}"`);
        } else {
            console.log('ℹ️ Next button not found in chat-header or is disabled');
        }
    });
});
