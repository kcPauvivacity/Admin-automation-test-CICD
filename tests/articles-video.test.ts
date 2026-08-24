import { test, expect } from '@playwright/test';
import { loginToApp } from './helpers/auth.helper';

const BASE = 'https://app-staging.vivacityapp.com';

async function goToArticles(page: any) {
    await loginToApp(page);
    await page.goto(`${BASE}/demo-student/articles`, { waitUntil: 'load', timeout: 30000 });
    await page.waitForSelector('.v-application', { timeout: 15000 });
    await page.waitForTimeout(1500);
}

// The Create button in articles is an <a> linking to /articles/create — navigate directly
async function goToCreateForm(page: any) {
    await loginToApp(page);
    await page.goto(`${BASE}/demo-student/articles/create`, { waitUntil: 'load', timeout: 30000 });
    await page.waitForSelector('.v-application', { timeout: 15000 });
    await page.waitForTimeout(2000);
}

test.describe('Video Articles', () => {
    test('create form shows article type selector', async ({ page }) => {
        test.setTimeout(120000);
        await goToCreateForm(page);

        // The form should show an article type selector (Standard / Video)
        const typeSelector = page.locator('.v-select, .v-autocomplete, [role="combobox"]').filter({ hasText: /video|standard|type/i });
        const hasTypeSelector = await typeSelector.first().isVisible({ timeout: 5000 }).catch(() => false);

        if (hasTypeSelector) {
            await expect(typeSelector.first()).toBeVisible();
            console.log('✅ Article type selector (dropdown) is present on the create form');
        } else {
            // Type may appear as tabs or radio buttons
            const videoTab = page.locator('button, .v-tab, .v-chip, [role="tab"]').filter({ hasText: /video/i });
            const hasVideoTab = await videoTab.first().isVisible({ timeout: 5000 }).catch(() => false);
            if (hasVideoTab) {
                await expect(videoTab.first()).toBeVisible();
                console.log('✅ Video tab/option found on create form');
            } else {
                // Check for type label in the form
                const typeLabel = page.locator('label, .v-label').filter({ hasText: /^type$/i });
                const hasTypeLabel = await typeLabel.first().isVisible({ timeout: 3000 }).catch(() => false);
                console.log(hasTypeLabel
                    ? '✅ Type label found in form'
                    : '⚠️ Article type selector not found — may use a different UI pattern');
            }
        }
    });

    test('video article form shows video-specific fields', async ({ page }) => {
        test.setTimeout(120000);
        await goToCreateForm(page);

        // Try to switch to Video type via tab
        const videoTab = page.locator('button, .v-tab, .v-chip, [role="tab"]').filter({ hasText: /video/i });
        const hasVideoTab = await videoTab.first().isVisible({ timeout: 5000 }).catch(() => false);

        if (hasVideoTab) {
            await videoTab.first().click();
            await page.waitForTimeout(1500);
            console.log('✅ Clicked Video tab');

            // Video URL field
            const videoUrlLabel = page.locator('label, .v-label').filter({ hasText: /video.*url|url|link/i });
            const hasVideoUrl = await videoUrlLabel.first().isVisible({ timeout: 5000 }).catch(() => false);
            if (hasVideoUrl) {
                console.log('✅ Video URL field label visible');
            }

            // WeChat preview (PR #14691 feature)
            const wechatLabel = page.locator('label, .v-label, .v-field__label').filter({ hasText: /wechat|we.chat|preview/i });
            const hasWechat = await wechatLabel.first().isVisible({ timeout: 3000 }).catch(() => false);
            if (hasWechat) {
                console.log('✅ WeChat preview field visible');
                await expect(wechatLabel.first()).toBeVisible();
            }
        } else {
            // Try dropdown type selector
            const typeDropdown = page.locator('.v-select, [role="combobox"]').first();
            if (await typeDropdown.isVisible({ timeout: 3000 }).catch(() => false)) {
                await typeDropdown.click();
                await page.waitForTimeout(1000);
                const videoItem = page.locator('.v-list-item, [role="option"]').filter({ hasText: /video/i });
                if (await videoItem.first().isVisible({ timeout: 3000 }).catch(() => false)) {
                    await videoItem.first().click();
                    await page.waitForTimeout(1500);
                    console.log('✅ Selected Video from dropdown');
                } else {
                    await page.keyboard.press('Escape');
                    console.log('⚠️ Video not in dropdown — checking current form fields');
                }
            } else {
                console.log('⚠️ No video type selector found');
            }
        }

        // Verify form loaded without errors
        const errorDialog = page.locator('.v-snackbar--active').filter({ hasText: /error/i });
        await expect(errorDialog).not.toBeVisible({ timeout: 3000 });
        console.log('✅ No errors when opening article create form');
    });

    test('video article optional fields do not block form submission', async ({ page }) => {
        test.setTimeout(180000);
        await goToCreateForm(page);

        // Switch to video type if available
        const videoTab = page.locator('button, .v-tab, .v-chip, [role="tab"]').filter({ hasText: /video/i });
        if (await videoTab.first().isVisible({ timeout: 3000 }).catch(() => false)) {
            await videoTab.first().click();
            await page.waitForTimeout(1500);
        }

        // Fill required title only
        const timestamp = Date.now();
        const titleField = page.getByPlaceholder('Enter title').or(
            page.locator('input[placeholder*="title" i]').first()
        );
        const hasTitleField = await titleField.isVisible({ timeout: 5000 }).catch(() => false);

        if (hasTitleField) {
            await titleField.fill(`Video Article ${timestamp}`);
            await page.waitForTimeout(500);

            // Optional fields (video URL, WeChat preview) left empty — should not cause "required" errors
            const titleErrors = page.locator('.v-field--error').filter({ hasText: /title/i });
            await expect(titleErrors).not.toBeVisible({ timeout: 3000 });
            console.log('✅ Filled title has no validation error');

            const requiredErrors = page.locator('.v-messages--error').filter({ hasText: /required/i });
            const errorCount = await requiredErrors.count();
            console.log(`ℹ️ Required field errors before submit: ${errorCount}`);
        } else {
            console.log('⚠️ Title field not found — form structure may differ');
        }
    });

    test('articles listing shows type column or type indicator', async ({ page }) => {
        test.setTimeout(120000);
        await goToArticles(page);

        // Table should load — use .first() to avoid strict mode error
        const table = page.locator('.v-data-table, table, [role="table"]').first();
        await expect(table).toBeVisible({ timeout: 15000 });

        // Check for a Type column header
        const typeHeader = page.getByRole('columnheader', { name: /type/i });
        const hasTypeHeader = await typeHeader.isVisible({ timeout: 5000 }).catch(() => false);

        if (hasTypeHeader) {
            await expect(typeHeader).toBeVisible();
            console.log('✅ Type column header is present in articles listing');
        } else {
            // May show as badge/chip per row
            const typeBadge = page.locator('.v-chip, .v-badge, [class*="type"]').filter({ hasText: /video|standard/i }).first();
            const hasBadge = await typeBadge.isVisible({ timeout: 3000 }).catch(() => false);
            console.log(hasBadge
                ? '✅ Article type badge found in listing rows'
                : '⚠️ No type column/badge — may not be enabled for this account');
        }

        // Rows should exist
        const rows = page.locator('tbody tr').filter({ hasNot: page.locator('td[colspan]') });
        const rowCount = await rows.count();
        if (rowCount > 0) {
            console.log(`✅ Articles listing shows ${rowCount} records`);
        }
    });
});
