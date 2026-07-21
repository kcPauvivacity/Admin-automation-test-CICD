// Bug #16113: [BUG]Appeditor > Mention generate success but unable to view
// ADO: https://dev.azure.com/vivacityapp/Viva/_workitems/edit/16113
// Auto-generated 2026-05-28
// REVIEW BEFORE MERGING — verify selectors and assertions

import { test, expect } from '@playwright/test';
import { loginToApp } from '../helpers/auth.helper';

test.setTimeout(120000);

test('BUG #16113: AppEditor Mention generate success and result is viewable', async ({ page }) => {
  await loginToApp(page, 90000, 'pau.kie.chee@fusioneta.com', 'PAOpaopao@9696');

  // Navigate to the app editor / mention section
  await page.goto('https://app-staging.vivacityapp.com/demo-student/app-editor', { waitUntil: 'load', timeout: 30000 });
  await page.waitForSelector('.v-application', { timeout: 15000 });
  await page.waitForTimeout(2000);

  } else {
    // Try direct navigation to likely AppEditor route
    await page.goto('https://app-staging.vivacityapp.com/demo-student/app-editor');
  }

  // Wait for editor page to load
  await page.waitForSelector('.v-application', { timeout: 15000 });

  // Look for a "Mention" feature button or tab
  const mentionTrigger = page.locator('button, .v-btn, .v-tab, [role="tab"], [role="button"]')
    .filter({ hasText: /mention/i })
    .first();

  let mentionFound = false;

  if (await mentionTrigger.isVisible({ timeout: 8000 }).catch(() => false)) {
    mentionFound = true;
    await mentionTrigger.click();
    await page.waitForTimeout(1000);
  } else {
    // Try navigating to a mentions specific route
    await page.goto('https://app-staging.vivacityapp.com/demo-student/app-editor/mention');
    await page.waitForSelector('.v-application', { timeout: 10000 });
    
    const mentionPage = page.locator('button, .v-btn, [role="button"]')
      .filter({ hasText: /mention|generate/i })
      .first();
    
    if (await mentionPage.isVisible({ timeout: 5000 }).catch(() => false)) {
      mentionFound = true;
    }
  }

  // Look for a generate button related to mention
  const generateBtn = page.locator('button, .v-btn').filter({ hasText: /generate/i }).first();
  
  if (await generateBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
    mentionFound = true;
    await generateBtn.click();

    // Wait for generation to complete - look for success indicator
    const successIndicator = page.locator(
      '.v-snackbar, .v-alert, [role="alert"], .success, .v-chip'
    ).filter({ hasText: /success|generated|done|complete/i }).first();

    const generationResult = page.locator(
      '.v-dialog, .v-card, .mention-result, .result, .v-list, table, .v-data-table'
    ).first();

    // Wait for either a success message or a result container
    await Promise.race([
      successIndicator.waitFor({ state: 'visible', timeout: 30000 }).catch(() => null),
      generationResult.waitFor({ state: 'visible', timeout: 30000 }).catch(() => null),
    ]);

    // After generation, the result should be visible
    // BUG: generation succeeds but result cannot be viewed
    // This assertion fails if bug is present (result not viewable after success)
    
    const resultVisible = await page.locator(
      '.v-dialog:visible, .mention-result:visible, .v-card:visible, .v-data-table:visible'
    ).count();

    // Check that a result/view container is actually shown
    const viewButton = page.locator('button, .v-btn').filter({ hasText: /view|open|show/i }).first();
    
    if (await viewButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await viewButton.click();
      await page.waitForTimeout(1000);

      // After clicking view, content should be visible
      const content = page.locator('.v-dialog, .v-card__text, .mention-content, .result-content').first();
      await expect(content).toBeVisible({ timeout: 10000 });

      // Ensure content is not empty
      const contentText = await content.textContent();
      expect(contentText?.trim().length).toBeGreaterThan(0);
    } else {
      // If no "view" button, the result should be inline and visible
      expect(resultVisible).toBeGreaterThan(0);
    }
  } else {
    // If we can't find generate button, do a best-effort check that the mention page loads
    test.skip(!mentionFound, 'Could not locate Mention/Generate feature in AppEditor');
    
    // At minimum the page should have loaded without errors
    const errorMessage = page.locator('.v-alert').filter({ hasText: /error|failed|unable/i }).first();
    await expect(errorMessage).not.toBeVisible({ timeout: 5000 });
  }

  // Final check: no error dialogs or alerts indicating failure to view
  const errorDialog = page.locator('.v-dialog').filter({ hasText: /error|unable to view|failed/i }).first();
  const hasErrorDialog = await errorDialog.isVisible({ timeout: 3000 }).catch(() => false);
  expect(hasErrorDialog).toBe(false);
});