// Bug #16102: [BUG]Appeditor> unable to generate qr
// ADO: https://dev.azure.com/vivacityapp/Viva/_workitems/edit/16102
// Auto-generated 2026-05-28
// REVIEW BEFORE MERGING — verify selectors and assertions

import { test, expect } from '@playwright/test';
import { loginToApp } from '../helpers/auth.helper';

test.setTimeout(120000);

test('BUG #16102 - AppEditor: able to generate QR code', async ({ page }) => {
  await loginToApp(page, 90000, 'pau.kie.chee@fusioneta.com', 'PAOpaopao@9696');

  // Navigate to the App Editor section
  await page.goto('https://app-staging.vivacityapp.com/demo-student/app-editor', { waitUntil: 'load', timeout: 30000 });
  await page.waitForSelector('.v-application', { timeout: 15000 });
  await page.waitForTimeout(2000);

  } else {
    // Try direct navigation to app editor
    await page.goto('https://app-staging.vivacityapp.com/app-editor');
    await page.waitForSelector('.v-application', { timeout: 15000 });
  }

  // Wait for the app editor page to load
  await page.waitForLoadState('networkidle', { timeout: 30000 });

  // Look for a QR code generate button
  const qrButton = page.locator('button, .v-btn').filter({ hasText: /qr|generate\s*qr|qr\s*code/i }).first();
  
  // Check if QR button exists and is visible
  const qrButtonVisible = await qrButton.isVisible({ timeout: 10000 }).catch(() => false);

  if (!qrButtonVisible) {
    // Try to find any element related to QR on the page
    const qrElement = page.locator('[class*="qr"], [id*="qr"], text=/QR/i').first();
    const qrElementVisible = await qrElement.isVisible({ timeout: 5000 }).catch(() => false);
    
    if (!qrElementVisible) {
      // Navigate to demo-student area which is accessible with the default login
      await page.goto('https://app-staging.vivacityapp.com/demo-student');
      await page.waitForLoadState('networkidle', { timeout: 30000 });
    }
  }

  // Try to find and click generate QR button
  const generateQrBtn = page.locator('button, .v-btn').filter({ hasText: /generate\s*qr|qr\s*code|generate.*qr/i }).first();
  
  const isGenerateQrVisible = await generateQrBtn.isVisible({ timeout: 10000 }).catch(() => false);
  
  if (isGenerateQrVisible) {
    // Click the generate QR button
    await generateQrBtn.click();
    
    // Wait for QR code to be generated (either as an image, canvas, or modal)
    const qrCodeGenerated = page.locator(
      'canvas, img[src*="qr"], img[alt*="qr" i], .qr-code, [class*="qr-code"], [class*="qrcode"]'
    ).first();
    
    // The test FAILS if QR code is not generated (bug present), PASSES if it appears (bug fixed)
    await expect(qrCodeGenerated).toBeVisible({ timeout: 20000 });
  } else {
    // Search more broadly across the page for QR-related functionality
    await page.goto('https://app-staging.vivacityapp.com');
    await page.waitForLoadState('networkidle', { timeout: 30000 });

    // Look in sidebar/navigation for app editor
    const navItems = page.locator('.v-navigation-drawer .v-list-item, .v-list .v-list-item');
    const count = await navItems.count();
    
    let foundAppEditor = false;
    for (let i = 0; i < count; i++) {
      const item = navItems.nth(i);
      const text = await item.textContent();
      if (text && /app.*editor/i.test(text)) {
        await item.click();
        foundAppEditor = true;
        await page.waitForLoadState('networkidle', { timeout: 15000 });
        break;
      }
    }

    if (foundAppEditor) {
      const qrGenerateBtn = page.locator('button, .v-btn').filter({ hasText: /qr/i }).first();
      const isVisible = await qrGenerateBtn.isVisible({ timeout: 10000 }).catch(() => false);
      
      if (isVisible) {
        await qrGenerateBtn.click();
        
        // The QR code should appear after clicking
        const qrResult = page.locator(
          'canvas, img[src*="qr"], .qr-code, [class*="qr"], dialog, .v-dialog'
        ).first();
        await expect(qrResult).toBeVisible({ timeout: 20000 });
      } else {
        // The QR button should be visible in app editor - if not, test fails (bug present)
        throw new Error('QR generation button not found in App Editor - this may indicate the bug is present');
      }
    } else {
      // App editor not found - attempt navigation and verify QR functionality
      await page.goto('https://app-staging.vivacityapp.com/app-editor');
      await page.waitForLoadState('networkidle', { timeout: 15000 });
      
      const pageContent = await page.content();
      if (pageContent.includes('404') || pageContent.includes('not found')) {
        throw new Error('App Editor page not accessible - cannot verify QR generation');
      }
      
      // Check for any QR-related elements
      const anyQrElement = page.locator('[class*="qr" i], button:has-text("QR"), .v-btn:has-text("QR")').first();
      await expect(anyQrElement).toBeVisible({ timeout: 15000 });
    }
  }
});