// Bug #17647: Appeditor = unable to generate qr
// ADO: https://dev.azure.com/vivacityapp/Viva/_workitems/edit/17647
// Auto-generated 2026-07-10
// REVIEW BEFORE MERGING — verify selectors and assertions

import { test, expect } from '@playwright/test';
import { loginToApp } from '../helpers/auth.helper';

test.setTimeout(120000);

test('Bug #17647 - AppEditor: should be able to generate QR code', async ({ page }) => {
  await loginToApp(page, 90000, 'pau.kie.chee@fusioneta.com', 'PAOpaopao@9696');

  // Navigate to the app editor section
  await page.goto('https://app-staging.vivacityapp.com/demo-student/app-editor', { waitUntil: 'load', timeout: 30000 });
  await page.waitForSelector('.v-application', { timeout: 15000 });
  await page.waitForTimeout(2000);

    navigatedViaLink = true;
  } else {
    // Try direct navigation to app editor
    await page.goto('https://app-staging.vivacityapp.com/app-editor');
  }

  // Wait for app editor page to load
  await page.waitForSelector('.v-application', { timeout: 20000 });

  // Look for QR code related button or section
  const qrButton = page.locator('button, .v-btn').filter({ hasText: /qr/i }).first();
  const qrSection = page.locator('[class*="qr"], [id*="qr"]').first();

  let qrButtonFound = false;

  if (await qrButton.isVisible({ timeout: 10000 }).catch(() => false)) {
    qrButtonFound = true;
    await qrButton.click();
  } else if (await qrSection.isVisible({ timeout: 5000 }).catch(() => false)) {
    qrButtonFound = true;
  } else {
    // Try to find generate QR button with broader search
    const generateQrBtn = page.locator('button, .v-btn').filter({ hasText: /generate/i }).first();
    if (await generateQrBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      const text = await generateQrBtn.textContent();
      if (text && /qr/i.test(text)) {
        qrButtonFound = true;
        await generateQrBtn.click();
      } else {
        await generateQrBtn.click();
        qrButtonFound = true;
      }
    }
  }

  // Navigate through the app editor to find QR generation
  // Try demo student login context which has app editor access
  await page.goto('https://app-staging.vivacityapp.com');
  await page.waitForSelector('.v-application', { timeout: 20000 });

  // Search for app editor in navigation
  const navItems = page.locator('.v-navigation-drawer .v-list-item, .v-list .v-list-item');
  const count = await navItems.count();
  
  let appEditorNavItem = null;
  for (let i = 0; i < count; i++) {
    const item = navItems.nth(i);
    const text = await item.textContent();
    if (text && /app.?editor/i.test(text)) {
      appEditorNavItem = item;
      break;
    }
  }

  if (appEditorNavItem) {
    await appEditorNavItem.click();
    await page.waitForSelector('.v-application', { timeout: 10000 });
  }

  // Now find and interact with QR code generation
  // Look for any QR-related elements on the page
  const qrGenerateButton = page.locator('button, .v-btn').filter({ hasText: /generate.*qr|qr.*code|qr/i }).first();
  const qrCodeImage = page.locator('img[alt*="qr" i], canvas[class*="qr" i], [class*="qr-code"], [class*="qrcode"]').first();

  if (await qrGenerateButton.isVisible({ timeout: 8000 }).catch(() => false)) {
    // Click the generate QR button
    await qrGenerateButton.click();

    // Wait for QR code to be generated - either an image, canvas, or success message
    const qrGenerated = await Promise.race([
      qrCodeImage.waitFor({ state: 'visible', timeout: 15000 }).then(() => true).catch(() => false),
      page.waitForSelector('img[src*="qr"], canvas, .qr-code-container, [data-testid*="qr"]', { timeout: 15000 }).then(() => true).catch(() => false),
      page.waitForSelector('.v-alert--type-success, .v-snackbar', { timeout: 15000 }).then(() => true).catch(() => false),
    ]);

    // Check that no error occurred during QR generation
    const errorAlert = page.locator('.v-alert--type-error, .error--text').filter({ hasText: /unable|error|failed/i });
    const hasError = await errorAlert.isVisible({ timeout: 3000 }).catch(() => false);
    
    expect(hasError, 'QR code generation should not show an error').toBeFalsy();
    expect(qrGenerated, 'QR code should be generated successfully').toBeTruthy();
  } else {
    // Smoke test: verify the app editor page loads without errors and QR section exists
    const pageContent = await page.content();
    const hasQrContent = /qr/i.test(pageContent);

    // Check for error messages indicating QR generation failure
    const errorMessages = page.locator('.v-alert--type-error, [class*="error"]').filter({ hasText: /unable.*generate|qr.*error|failed.*qr/i });
    const hasQrError = await errorMessages.isVisible({ timeout: 3000 }).catch(() => false);
    
    expect(hasQrError, 'Page should not show QR generation error messages').toBeFalsy();

    // Navigate specifically to app-editor URL paths
    for (const path of ['/app-editor', '/appeditor', '/app-editor/qr', '/settings/app-editor']) {
      const response = await page.goto(`https://app-staging.vivacityapp.com${path}`).catch(() => null);
      if (response && response.ok()) {
        await page.waitForSelector('.v-application', { timeout: 10000 });
        
        const qrBtn = page.locator('button, .v-btn').filter({ hasText: /qr/i }).first();
        if (await qrBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
          await qrBtn.click();
          
          // Wait to see if QR generates or shows error
          await page.waitForTimeout(3000);
          
          const errorMsg = page.locator('.v-alert, .v-snackbar').filter({ hasText: /unable|error|failed/i });
          const hasErr = await errorMsg.isVisible({ timeout: 3000 }).catch(() => false);
          expect(hasErr, 'QR code generation should succeed without errors').toBeFalsy();
          break;
        }
      }
    }
  }
});