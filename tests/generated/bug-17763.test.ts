// Bug #17763: [Dashboard] Missing 'Total New Users' stat card
// ADO: https://dev.azure.com/vivacityapp/Viva/_workitems/edit/17763
// Auto-generated 2026-07-16
// REVIEW BEFORE MERGING — verify selectors and assertions

import { test, expect } from '@playwright/test';
import { loginToApp } from '../helpers/auth.helper';

test.setTimeout(120000);

test('BUG #17763 - Dashboard Overview should display Total New Users stat card', async ({ page }) => {
  await loginToApp(page);

  await page.goto('https://app-staging.vivacityapp.com');

  await page.waitForSelector('.v-application', { timeout: 30000 });

  const dashboardSelectors = [
    '[href*="dashboard"]',
    '[href*="overview"]',
    'a:has-text("Dashboard")',
    'a:has-text("Overview")',
  ];

  let navigated = false;
  for (const selector of dashboardSelectors) {
    const el = page.locator(selector).first();
    if (await el.isVisible({ timeout: 5000 }).catch(() => false)) {
      await el.click();
      navigated = true;
      break;
    }
  }

  if (!navigated) {
    await page.goto('https://app-staging.vivacityapp.com/dashboard');
  }

  await page.waitForSelector('.v-card, .stat-card, [class*="stat"], [class*="card"]', { timeout: 30000 });

  await page.waitForTimeout(3000);

  const statCardTexts = [
    'Total Users',
    'Total Active Users',
    'Total New Users',
    'Sessions',
    'Page Views',
    'Total Enquiries',
  ];

  for (const cardText of statCardTexts) {
    const cardLocator = page.locator(`text="${cardText}"`).first();
    await expect(cardLocator, `Stat card "${cardText}" should be visible on the Dashboard`).toBeVisible({ timeout: 15000 });
  }

  const totalNewUsersCard = page.locator('text="Total New Users"').first();
  await expect(totalNewUsersCard, 'The "Total New Users" stat card is missing from the Dashboard Overview').toBeVisible({ timeout: 15000 });

  const allStatCards = page.locator('.v-card:has-text("Total"), .stat-card');
  const visibleStatCards = await page.locator(
    ':is(.v-card, [class*="stat-card"], [class*="StatCard"])' +
    ':has-text("Total Users"), ' +
    ':is(.v-card, [class*="stat-card"], [class*="StatCard"])' +
    ':has-text("Sessions"), ' +
    ':is(.v-card, [class*="stat-card"], [class*="StatCard"])' +
    ':has-text("Page Views")'
  ).count();

  const pageContent = await page.content();
  expect(
    pageContent.includes('Total New Users'),
    'Page content should include "Total New Users" stat card text'
  ).toBeTruthy();
});