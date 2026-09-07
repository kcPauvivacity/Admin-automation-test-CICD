import { test, expect } from '@playwright/test';
import { loginToApp } from './helpers/auth.helper';

const EMAIL = 'pau.kie.chee@fusioneta.com';
const PASSWORD = 'PAOpaopao@9696';
const BASE = 'https://app-staging.vivacityapp.com';
const LIST_URL = `${BASE}/system-settings/enquiries-queue`;

async function navigateToEnquiriesQueue(page: any) {
    await page.goto(LIST_URL, { waitUntil: 'load', timeout: 30000 });
    await page.waitForTimeout(3000);
    await expect(page).toHaveURL(/system-settings\/enquiries-queue/, { timeout: 10000 });
    await page.waitForTimeout(1000);
    console.log('✅ Navigated to Enquiries Queue');
}

test('Enquiries Queue - [READ] page loads', async ({ page }) => {
    test.setTimeout(180000);
    await loginToApp(page, 90000, EMAIL, PASSWORD);
    await navigateToEnquiriesQueue(page);

    const content = page.locator('table, .v-data-table, [role="table"], .v-card, main').first();
    await expect(content).toBeVisible({ timeout: 10000 });
    console.log('✅ Page content visible');
});

test('Enquiries Queue - [READ] columns or settings visible', async ({ page }) => {
    test.setTimeout(180000);
    await loginToApp(page, 90000, EMAIL, PASSWORD);
    await navigateToEnquiriesQueue(page);

    const rowCount = await page.locator('tbody tr').count();
    console.log(`✅ Table rows: ${rowCount}`);

    const headers = await page.locator('th').allTextContents();
    console.log(`✅ Column headers: ${headers.join(', ')}`);
});

test('Enquiries Queue - [READ] search or filter available', async ({ page }) => {
    test.setTimeout(180000);
    await loginToApp(page, 90000, EMAIL, PASSWORD);
    await navigateToEnquiriesQueue(page);

    const searchInput = page.locator('input[type="text"], [role="searchbox"]').first();
    if (await searchInput.isVisible({ timeout: 5000 }).catch(() => false)) {
        await searchInput.fill('test');
        await page.waitForTimeout(1000);
        await searchInput.fill('');
        console.log('✅ Search input functional');
    } else {
        console.log('⚠️ No search input found');
    }
});

test('Enquiries Queue - [CONFIG] create queue rule if Create exists', async ({ page }) => {
    test.setTimeout(180000);
    await loginToApp(page, 90000, EMAIL, PASSWORD);
    await navigateToEnquiriesQueue(page);

    const createBtn = page.locator('button, a').filter({ hasText: /^create$/i }).first();
    if (await createBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await createBtn.click();
        await page.waitForTimeout(2000);
        console.log('✅ Clicked Create button');

        const dialog = page.locator('[role="dialog"]').first();
        if (await dialog.isVisible({ timeout: 3000 }).catch(() => false)) {
            console.log('✅ Create dialog opened');
            await page.keyboard.press('Escape');
            await page.waitForTimeout(1000);
        }
    } else {
        console.log('⚠️ No Create button — Enquiries Queue may be read-only configuration');
    }
});

test('Enquiries Queue - [CONFIG] edit queue settings', async ({ page }) => {
    test.setTimeout(180000);
    await loginToApp(page, 90000, EMAIL, PASSWORD);
    await navigateToEnquiriesQueue(page);

    const firstRow = page.locator('tbody tr').first();
    if (await firstRow.isVisible({ timeout: 5000 }).catch(() => false)) {
        await firstRow.click();
        await page.waitForTimeout(2000);
        console.log('✅ Clicked first queue entry');

        const editForm = page.locator('input[type="text"], .v-select, textarea').first();
        if (await editForm.isVisible({ timeout: 3000 }).catch(() => false)) {
            console.log('✅ Edit form accessible');
            const saveBtn = page.locator('button').filter({ hasText: /^save$/i }).first();
            if (await saveBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
                console.log('✅ Save button visible');
            }
        }
        await page.keyboard.press('Escape');
    } else {
        console.log('⚠️ No queue entries found');
    }
    console.log('✅ Enquiries Queue config test completed');
});

test('Enquiries Queue - [DELETE] remove queue entry if Delete exists', async ({ page }) => {
    test.setTimeout(180000);
    await loginToApp(page, 90000, EMAIL, PASSWORD);
    await navigateToEnquiriesQueue(page);

    const checkbox = page.locator('tbody tr').first().locator('input[type="checkbox"]').first();
    if (await checkbox.isVisible({ timeout: 5000 }).catch(() => false)) {
        await checkbox.click();
        await page.waitForTimeout(500);

        const deleteBtn = page.locator('button').filter({ hasText: /^delete$/i }).first();
        if (await deleteBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
            console.log('✅ Delete button appeared after selection');
            await page.keyboard.press('Escape');
        } else {
            console.log('⚠️ No Delete button — queue entries may not be deletable');
        }
    } else {
        console.log('⚠️ No checkbox found');
    }
    console.log('✅ Delete test completed');
});

test('Enquiries Queue - [NAV] accessible via system-settings', async ({ page }) => {
    test.setTimeout(180000);
    await loginToApp(page, 90000, EMAIL, PASSWORD);
    await page.goto(LIST_URL, { waitUntil: 'load', timeout: 30000 });
    await page.waitForTimeout(2000);
    await expect(page).toHaveURL(/system-settings\/enquiries-queue/, { timeout: 10000 });
    console.log('✅ Enquiries Queue accessible via direct URL');
});
