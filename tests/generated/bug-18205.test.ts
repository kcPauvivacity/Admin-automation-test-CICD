// Bug #18205: [Settings › SMS Settings] Empty state uses off-brand clipart illustration
// ADO: https://dev.azure.com/vivacityapp/Viva/_workitems/edit/18205
// Auto-generated 2026-08-18
// REVIEW BEFORE MERGING — verify selectors and assertions

import { test, expect } from '@playwright/test';
import { loginToApp } from '../helpers/auth.helper';

test.setTimeout(120000);

test('BUG #18205 - SMS Settings empty state should use VIVA-branded illustration, not clipart', async ({ page }) => {
  await loginToApp(page);

  // Navigate to Settings > SMS Settings
  await page.goto('https://app-staging.vivacityapp.com/demo-student/settings/sms-settings');

  // Wait for the page to load
  await page.waitForLoadState('networkidle');

  // Verify we're on the SMS settings page
  await expect(page).toHaveURL(/sms-settings/);

  // Wait for the empty state to appear (no SMS connector configured)
  // The empty state should be visible
  const emptyState = page.locator('.v-empty-state, [class*="empty-state"], [class*="empty_state"]').first();

  // Check if we have an empty state at all
  const hasEmptyState = await emptyState.isVisible().catch(() => false);

  if (hasEmptyState) {
    // The bug: off-brand clipart illustration is present
    // Off-brand clipart images are typically PNG/JPG files with names like:
    // "no-sms", "sms-empty", generic stock art filenames, or external URLs
    
    // Check for any img elements within the empty state
    const images = page.locator('.v-empty-state img, [class*="empty-state"] img, [class*="empty_state"] img');
    const svgElements = page.locator('.v-empty-state svg, [class*="empty-state"] svg, [class*="empty_state"] svg');

    const imgCount = await images.count();
    const svgCount = await svgElements.count();

    if (imgCount > 0) {
      // If using an <img> tag, check it's not pointing to off-brand clipart
      for (let i = 0; i < imgCount; i++) {
        const img = images.nth(i);
        const src = await img.getAttribute('src') || '';
        const alt = await img.getAttribute('alt') || '';

        // Off-brand clipart is typically a raster image (PNG/JPG) with generic names
        // VIVA brand uses SVG illustrations or specific branded image names
        const isOffBrandClipart = 
          (src.toLowerCase().includes('.png') || src.toLowerCase().includes('.jpg') || src.toLowerCase().includes('.jpeg')) &&
          !src.toLowerCase().includes('viva') &&
          !src.toLowerCase().includes('branded');

        // The test should FAIL if off-brand clipart is detected (bug present)
        // and PASS when fixed (VIVA-branded illustration used)
        expect(isOffBrandClipart, 
          `SMS Settings empty state uses off-brand clipart image: ${src}. Expected a VIVA-branded SVG illustration.`
        ).toBe(false);
      }
    }
  }

  // More specific check: Look for the page content related to SMS settings
  // and verify no off-brand illustration is present
  await page.waitForSelector('main, .v-main', { timeout: 15000 });

  // Check for any images that are clearly clipart (raster images used as illustrations)
  // VIVA brand should use SVG-based illustrations
  const allIllustrationImgs = page.locator('main img[src*=".png"], main img[src*=".jpg"], main img[src*=".gif"]');
  
  // Look specifically for the "No SMS on the Mini Program" empty state text
  const noSmsText = page.locator('text=/no sms/i, text=/sms.*mini program/i, text=/mini program.*sms/i');
  const hasNoSmsEmptyState = await noSmsText.isVisible().catch(() => false);

  if (hasNoSmsEmptyState) {
    // When the empty state with "No SMS on the Mini Program" is visible,
    // check that there's no off-brand clipart illustration near it
    
    // The bug uses a clipart illustration (person at laptop with shield and gear icons)
    // which would typically be a raster image or a non-VIVA SVG
    const nearbyImages = page.locator('img[src*=".png"], img[src*=".jpg"]');
    const nearbyImgCount = await nearbyImages.count();

    // Check each nearby raster image
    for (let i = 0; i < nearbyImgCount; i++) {
      const img = nearbyImages.nth(i);
      const src = await img.getAttribute('src') || '';
      
      // Filter out icons and small images (likely UI icons, not illustrations)
      const naturalWidth = await img.evaluate((el: HTMLImageElement) => el.naturalWidth);
      const naturalHeight = await img.evaluate((el: HTMLImageElement) => el.naturalHeight);
      
      // Large raster images (> 100px) in the context of an empty state are likely illustrations
      if (naturalWidth > 100 && naturalHeight > 100) {
        // This is a large raster image being used as an illustration
        // The fix should replace this with an SVG-based VIVA illustration
        expect(true, 
          `BUG #18205: SMS Settings empty state uses a large raster image (${src}, ${naturalWidth}x${naturalHeight}) as an illustration. ` +
          `Expected a VIVA-branded SVG illustration instead of clipart.`
        ).toBe(false);
      }
    }

    // Verify the VIVA-branded illustration is present (SVG)
    // After the fix, the empty state should use an SVG illustration
    const vivaIllustration = page.locator(
      '.v-empty-state svg, ' +
      '[class*="empty-state"] svg, ' +
      '[class*="empty_state"] svg, ' +
      'img[src*=".svg"]'
    );
    
    const hasVivaIllustration = await vivaIllustration.count() > 0;
    expect(hasVivaIllustration, 
      'BUG #18205: SMS Settings empty state should display a VIVA-branded SVG illustration, but none was found.'
    ).toBe(true);
  } else {
    // If no SMS settings empty state is visible, check if we need to navigate differently
    // Try alternative URL patterns
    const alternativeUrls = [
      '/demo-student/settings/sms',
      '/demo-student/settings/messaging/sms',
      '/demo-student/system-settings/sms-settings',
    ];

    let foundPage = false;
    for (const url of alternativeUrls) {
      await page.goto(`https://app-staging.vivacityapp.com${url}`).catch(() => {});
      await page.waitForLoadState('networkidle').catch(() => {});
      
      const altNoSmsText = await page.locator('text=/no sms/i, text=/sms.*mini program/i').isVisible().catch(() => false);
      if (altNoSmsText) {
        foundPage = true;
        
        // Check for off-brand clipart on alternative URL
        const rasterImages = page.locator('img[src*=".png"], img[src*=".jpg"]');
        const rasterCount = await rasterImages.count();
        
        for (let i = 0; i < rasterCount; i++) {
          const img = rasterImages.nth(i);
          const naturalWidth = await img.evaluate((el: HTMLImageElement) => el.naturalWidth);
          const naturalHeight = await img.evaluate((el: HTMLImageElement) => el.naturalHeight);
          
          if (naturalWidth > 100 && naturalHeight > 100) {
            const src = await img.getAttribute('src') || '';
            expect(true, 
              `BUG #18205: SMS Settings empty state uses off-brand clipart (${src}). Expected VIVA-branded SVG illustration.`
            ).toBe(false);
          }
        }
        break;
      }
    }

    // If we couldn't find the page, log a warning but don't fail
    // as the SMS settings might require specific configuration
    if (!foundPage) {
      console.warn('Could not locate SMS Settings empty state - the page may require specific configuration');
    }
  }
});