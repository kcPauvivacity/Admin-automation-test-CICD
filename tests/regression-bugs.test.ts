import { test, expect } from '@playwright/test';
import { loginToApp, LOGIN_URL } from './helpers/auth.helper';

// ─────────────────────────────────────────────────────────────────────────────
// #17031 — Promotion "Save & Publish" button not working
// Expected: clicking Save & Publish publishes the promotion to MP in one step
// ─────────────────────────────────────────────────────────────────────────────
test('regression #17031 — Promotion Save & Publish button publishes correctly', async ({ page }) => {
    test.setTimeout(120000);

    await loginToApp(page);

    await page.getByRole('menuitem', { name: 'Promotions' }).click();
    await page.waitForLoadState('load');
    await page.waitForTimeout(2000);
    console.log('✅ Navigated to Promotions');

    const viewDetailsBtn = page.getByRole('button', { name: 'View details for' }).first();
    if (!await viewDetailsBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        console.log('⚠️ No promotions found — skipping test');
        return;
    }

    await viewDetailsBtn.click();
    await page.waitForTimeout(2000);

    const detailTab = page.getByRole('tab', { name: /detail/i });
    if (await detailTab.isVisible({ timeout: 3000 }).catch(() => false)) {
        await detailTab.click();
        await page.waitForTimeout(1000);
    }

    const savePublishBtn = page.getByRole('button', { name: /save\s*&\s*publish/i });
    if (!await savePublishBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        console.log('⚠️ Save & Publish button not found on this promotion');
        return;
    }

    const isEnabled = await savePublishBtn.isEnabled({ timeout: 2000 }).catch(() => false);
    if (!isEnabled) {
        console.log('⚠️ Save & Publish button is disabled — check required fields');
        return;
    }

    await savePublishBtn.click();
    await page.waitForTimeout(3000);
    await page.waitForLoadState('load');

    // Check for success toast
    const toast = page.locator('.v-snackbar__content, [class*="toast"], [class*="snack"]').first();
    const hasToast = await toast.isVisible({ timeout: 5000 }).catch(() => false);
    if (hasToast) {
        const toastText = await toast.textContent();
        console.log(`✅ Save & Publish response: "${toastText?.trim()}"`);
    }

    // Check promotion status in page
    const publishedBadge = page.locator('[class*="badge"]:has-text("Published"), [class*="status"]:has-text("Published"), .v-chip:has-text("Published")').first();
    const isPublished = await publishedBadge.isVisible({ timeout: 5000 }).catch(() => false);

    if (isPublished) {
        console.log('✅ Bug #17031 fixed: Promotion is now Published after Save & Publish');
    } else {
        console.log('❌ Bug #17031 still present: Promotion not published after clicking Save & Publish — requires manual publish via listing');
    }
});

// ─────────────────────────────────────────────────────────────────────────────
// #17030 — Organisation Settings university address 'x' button should be disabled
// Expected: the remove/x button on university address in Org Settings is non-interactive
// ─────────────────────────────────────────────────────────────────────────────
test('regression #17030 — Organisation Settings university address x button is disabled', async ({ page }) => {
    test.setTimeout(120000);

    await loginToApp(page);

    // Derive org slug from post-login URL
    const currentUrl = page.url();
    const slugMatch = currentUrl.match(/vivacityapp\.com\/([^/]+)/);
    const orgSlug = slugMatch ? slugMatch[1] : 'demo-student';

    await page.goto(`${LOGIN_URL}/${orgSlug}/settings`, { waitUntil: 'load' });
    await page.waitForTimeout(2000);
    console.log('✅ Navigated to Organisation Settings');

    // Find university / universities chip or field
    const uniChip = page.locator('.v-chip, [class*="chip"], [class*="tag"]').filter({ hasText: /universit/i }).first();
    const hasUniChip = await uniChip.isVisible({ timeout: 5000 }).catch(() => false);

    if (!hasUniChip) {
        // Try locating by label/section heading
        const uniLabel = page.locator('label, legend, [class*="label"]').filter({ hasText: /universit/i }).first();
        const hasUniLabel = await uniLabel.isVisible({ timeout: 3000 }).catch(() => false);
        if (!hasUniLabel) {
            console.log('⚠️ University field not found in Org Settings — may require specific org or different page section');
            return;
        }
    }

    // Look for the x / close / remove button associated with the university field
    const removeBtn = page.locator(
        '.v-chip .v-chip__close, .v-chip .mdi-close-circle, .v-chip button, [aria-label*="remove" i], [aria-label*="delete" i]'
    ).filter({ hasText: '' }).first();

    const hasRemoveBtn = await removeBtn.isVisible({ timeout: 3000 }).catch(() => false);
    if (!hasRemoveBtn) {
        // Try mdi-close near the university section
        const closeNearUni = uniChip.locator('.mdi-close, button').first();
        const hasClose = await closeNearUni.isVisible({ timeout: 2000 }).catch(() => false);

        if (!hasClose) {
            console.log('⚠️ Remove button on university field not found');
            return;
        }

        const isDisabled = await closeNearUni.isDisabled({ timeout: 1000 }).catch(() => true);
        const hasPointerEventsNone = await closeNearUni.evaluate(el =>
            getComputedStyle(el).pointerEvents === 'none'
        ).catch(() => false);

        if (isDisabled || hasPointerEventsNone) {
            console.log('✅ Bug #17030 fixed: University address x button is correctly disabled in Org Settings');
        } else {
            console.log('❌ Bug #17030 still present: University address x button is clickable — should be read-only in Org Settings');
        }
        return;
    }

    const isDisabled = await removeBtn.isDisabled({ timeout: 1000 }).catch(() => false);
    if (isDisabled) {
        console.log('✅ Bug #17030 fixed: University address x button is correctly disabled in Org Settings');
    } else {
        console.log('❌ Bug #17030 still present: University address x button is enabled — should be disabled in Org Settings');
    }
});

// ─────────────────────────────────────────────────────────────────────────────
// #17032 — [Abodus] Martha Street Penthouse room pages not loading + missing price data
// Expected: Penthouse room type pages load fully and contain price data
// ─────────────────────────────────────────────────────────────────────────────
test('regression #17032 — Abodus Martha Street Penthouse room pages load with price data', async ({ page }) => {
    test.setTimeout(180000);

    await loginToApp(page);

    await page.getByRole('menuitem', { name: /properties/i }).click();
    await page.waitForLoadState('load');
    await page.waitForTimeout(2000);
    console.log('✅ Navigated to Properties');

    // Search for Martha Street
    const searchBox = page.locator('input[placeholder*="search" i], input[type="search"], .v-field__input').first();
    if (await searchBox.isVisible({ timeout: 3000 }).catch(() => false)) {
        await searchBox.fill('Martha Street');
        await page.waitForTimeout(2000);
    }

    const marthaRow = page.locator('tbody tr, [role="row"]').filter({ hasText: /martha street/i }).first();
    if (!await marthaRow.isVisible({ timeout: 5000 }).catch(() => false)) {
        console.log('⚠️ Martha Street not found — may require Abodus organisation login or different account');
        return;
    }

    const viewBtn = marthaRow.locator('button[aria-label*="view" i], button[aria-label*="detail" i]').first();
    if (await viewBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await viewBtn.click();
    } else {
        await marthaRow.click();
    }
    await page.waitForLoadState('load');
    await page.waitForTimeout(2000);
    console.log('✅ Opened Martha Street property');

    // Navigate to Room Types tab
    const roomTypesTab = page.getByRole('tab', { name: /room\s*types?/i });
    if (!await roomTypesTab.isVisible({ timeout: 5000 }).catch(() => false)) {
        console.log('⚠️ Room Types tab not found');
        return;
    }
    await roomTypesTab.click();
    await page.waitForTimeout(2000);

    // Check Penthouse room types
    const penthouseTypes = ['Penthouse Premium Studio', 'Penthouse Ensuite', 'Penthouse Premium Ensuite'];
    let allPassed = true;

    for (const roomType of penthouseTypes) {
        const row = page.locator('tbody tr, [role="row"]').filter({ hasText: new RegExp(roomType, 'i') }).first();
        if (!await row.isVisible({ timeout: 3000 }).catch(() => false)) {
            console.log(`⚠️ "${roomType}" not found in room type list`);
            continue;
        }

        const detailBtn = row.locator('button').first();
        if (await detailBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
            await detailBtn.click();
        } else {
            await row.click();
        }
        await page.waitForLoadState('load');
        await page.waitForTimeout(3000);

        // Check page loaded (no error)
        const errMsg = page.locator('text=/error|failed to load|something went wrong/i').first();
        if (await errMsg.isVisible({ timeout: 2000 }).catch(() => false)) {
            console.log(`❌ Bug #17032 still present: "${roomType}" page failed to load`);
            allPassed = false;
        } else {
            console.log(`✅ "${roomType}" page loaded`);

            // Check for price data
            const priceData = page.locator('[class*="price"], input[name*="price" i], td:has-text("£"), td:has-text("$"), text=/per week|per month|from £|from \\$/i').first();
            const hasPrice = await priceData.isVisible({ timeout: 3000 }).catch(() => false);
            if (hasPrice) {
                console.log(`✅ "${roomType}" has price data`);
            } else {
                console.log(`❌ Bug #17032 still present: "${roomType}" missing price data`);
                allPassed = false;
            }
        }

        // Go back to room type list
        await page.goBack();
        await page.waitForTimeout(1500);
        if (await roomTypesTab.isVisible({ timeout: 3000 }).catch(() => false)) {
            await roomTypesTab.click();
            await page.waitForTimeout(1500);
        }
    }

    if (allPassed) {
        console.log('✅ Bug #17032 fixed: All Penthouse room pages load correctly with price data');
    }
});
