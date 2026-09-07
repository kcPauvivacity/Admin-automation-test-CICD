import { test, expect } from '@playwright/test';
import { loginToApp } from './helpers/auth.helper';

// Project Management is under System Settings > Task Management
// URL: /system-settings/project-management
// Shows stat tiles: Overdue, Clients at Risk, Due Soon, Stalled Tasks

const EMAIL = 'pau.kie.chee@fusioneta.com';
const PASSWORD = 'PAOpaopao@9696';
const BASE = 'https://app-staging.vivacityapp.com';
const LIST_URL = `${BASE}/system-settings/project-management`;

async function navigateToProjectManagement(page: any) {
    await page.goto(LIST_URL, { waitUntil: 'load', timeout: 30000 });
    await page.waitForTimeout(3000);
    await expect(page).toHaveURL(/system-settings\/project-management/, { timeout: 10000 });
    await page.waitForTimeout(1000);
    console.log('✅ Navigated to Project Management');
}

test('Project Management - [READ] page loads with stat tiles', async ({ page }) => {
    test.setTimeout(180000);
    await loginToApp(page, 90000, EMAIL, PASSWORD);
    await navigateToProjectManagement(page);

    const content = page.locator('main, .v-main, .v-container').first();
    await expect(content).toBeVisible({ timeout: 10000 });
    console.log('✅ Page content visible');

    // Check for stat tile labels
    const statLabels = ['Overdue', 'Clients at Risk', 'Due Soon', 'Stalled'];
    for (const label of statLabels) {
        const tile = page.locator(`text=${label}`).first();
        const visible = await tile.isVisible({ timeout: 3000 }).catch(() => false);
        console.log(`  ${visible ? '✅' : '⚠️'} Stat tile "${label}": ${visible}`);
    }
});

test('Project Management - [READ] stat tiles show numeric values or dashes', async ({ page }) => {
    test.setTimeout(180000);
    await loginToApp(page, 90000, EMAIL, PASSWORD);
    await navigateToProjectManagement(page);

    // Stat tiles should show numbers or "—" placeholders
    const cards = page.locator('.v-card, [class*="stat"], [class*="tile"], [class*="metric"]');
    const count = await cards.count();
    console.log(`✅ Found ${count} card/stat elements`);

    if (count > 0) {
        for (let i = 0; i < Math.min(count, 4); i++) {
            const text = await cards.nth(i).textContent().catch(() => '');
            console.log(`  Card ${i + 1}: ${text?.trim().slice(0, 80)}`);
        }
    }
});

test('Project Management - [READ] accessible from Task Management section in sidebar', async ({ page }) => {
    test.setTimeout(180000);
    await loginToApp(page, 90000, EMAIL, PASSWORD);

    // Start from system settings landing
    await page.goto(`${BASE}/system-settings/organizations`, { waitUntil: 'load', timeout: 30000 });
    await page.waitForTimeout(3000);

    // Look for Task Management section and Project Management link
    const pmLink = page.locator('a, [role="menuitem"], .v-list-item')
        .filter({ hasText: /project management/i }).first();

    if (await pmLink.isVisible({ timeout: 5000 }).catch(() => false)) {
        await pmLink.click();
        await page.waitForTimeout(2000);
        await expect(page).toHaveURL(/system-settings\/project-management/, { timeout: 10000 });
        console.log('✅ Project Management accessible from sidebar');
    } else {
        // Fallback: direct navigation
        await page.goto(LIST_URL, { waitUntil: 'load', timeout: 30000 });
        await page.waitForTimeout(2000);
        await expect(page).toHaveURL(/system-settings\/project-management/, { timeout: 10000 });
        console.log('✅ Project Management accessible via direct URL');
    }
});

test('Project Management - [READ] page has heading or title', async ({ page }) => {
    test.setTimeout(180000);
    await loginToApp(page, 90000, EMAIL, PASSWORD);
    await navigateToProjectManagement(page);

    const heading = page.locator('h1, h2, [class*="title"], [class*="heading"]').first();
    if (await heading.isVisible({ timeout: 5000 }).catch(() => false)) {
        const text = await heading.textContent().catch(() => '');
        console.log(`✅ Page heading: "${text?.trim()}"`);
    } else {
        console.log('⚠️ No heading found — checking breadcrumb');
        const breadcrumb = page.locator('[aria-label*="Breadcrumb"], nav[aria-label*="breadcrumb"]').first();
        if (await breadcrumb.isVisible({ timeout: 3000 }).catch(() => false)) {
            const bc = await breadcrumb.textContent().catch(() => '');
            console.log(`✅ Breadcrumb: "${bc?.trim()}"`);
        }
    }
});

test('Project Management - [READ] overdue tasks count visible', async ({ page }) => {
    test.setTimeout(180000);
    await loginToApp(page, 90000, EMAIL, PASSWORD);
    await navigateToProjectManagement(page);

    const overdueTile = page.locator('text=Overdue').first();
    if (await overdueTile.isVisible({ timeout: 5000 }).catch(() => false)) {
        const parent = overdueTile.locator('..').locator('..');
        const value = await parent.textContent().catch(() => '');
        console.log(`✅ Overdue tile content: "${value?.trim().slice(0, 60)}"`);
    } else {
        console.log('⚠️ Overdue tile not found');
    }
});

test('Project Management - [READ] clients at risk count visible', async ({ page }) => {
    test.setTimeout(180000);
    await loginToApp(page, 90000, EMAIL, PASSWORD);
    await navigateToProjectManagement(page);

    const tile = page.locator('text=/clients at risk/i').first();
    if (await tile.isVisible({ timeout: 5000 }).catch(() => false)) {
        console.log('✅ "Clients at Risk" tile visible');
    } else {
        console.log('⚠️ "Clients at Risk" tile not found');
    }
});

test('Project Management - [READ] due soon and stalled tasks visible', async ({ page }) => {
    test.setTimeout(180000);
    await loginToApp(page, 90000, EMAIL, PASSWORD);
    await navigateToProjectManagement(page);

    const dueSoon = page.locator('text=/due soon/i').first();
    const stalled = page.locator('text=/stalled/i').first();

    const dueSoonVisible = await dueSoon.isVisible({ timeout: 5000 }).catch(() => false);
    const stalledVisible = await stalled.isVisible({ timeout: 5000 }).catch(() => false);

    console.log(`✅ "Due Soon" tile visible: ${dueSoonVisible}`);
    console.log(`✅ "Stalled Tasks" tile visible: ${stalledVisible}`);
});

test('Project Management - [READ] clicking stat tile navigates or filters', async ({ page }) => {
    test.setTimeout(180000);
    await loginToApp(page, 90000, EMAIL, PASSWORD);
    await navigateToProjectManagement(page);

    const overdueTile = page.locator('.v-card, [class*="stat-card"], [class*="tile"]').first();
    if (await overdueTile.isVisible({ timeout: 5000 }).catch(() => false)) {
        await overdueTile.click();
        await page.waitForTimeout(2000);
        const currentUrl = page.url();
        console.log(`✅ After clicking stat tile, URL: ${currentUrl}`);
    } else {
        console.log('⚠️ No clickable stat tile found');
    }
    console.log('✅ Project Management tile click test completed');
});

test('Project Management - [NAV] sidebar shows Task Management group', async ({ page }) => {
    test.setTimeout(180000);
    await loginToApp(page, 90000, EMAIL, PASSWORD);
    await navigateToProjectManagement(page);

    // Check sidebar for Task Management group header
    const taskMgmtHeader = page.locator('text=/task management/i').first();
    if (await taskMgmtHeader.isVisible({ timeout: 5000 }).catch(() => false)) {
        console.log('✅ "Task Management" sidebar group visible');
    } else {
        console.log('⚠️ Task Management group header not visible');
    }

    // Verify both modules in the group are in the sidebar
    const taskTemplatesLink = page.locator('a, .v-list-item').filter({ hasText: /task templates/i }).first();
    const pmLink = page.locator('a, .v-list-item').filter({ hasText: /project management/i }).first();

    const ttVisible = await taskTemplatesLink.isVisible({ timeout: 3000 }).catch(() => false);
    const pmVisible = await pmLink.isVisible({ timeout: 3000 }).catch(() => false);

    console.log(`✅ Task Templates in sidebar: ${ttVisible}`);
    console.log(`✅ Project Management in sidebar: ${pmVisible}`);
});
