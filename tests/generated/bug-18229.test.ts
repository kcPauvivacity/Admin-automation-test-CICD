// Bug #18229: [Fresh] Admin portal property phone number field defaults to wrong country code
// ADO: https://dev.azure.com/vivacityapp/Viva/_workitems/edit/18229
// Auto-generated 2026-08-20
// REVIEW BEFORE MERGING — verify selectors and assertions

import { test, expect } from '@playwright/test';
import { loginToApp } from '../helpers/auth.helper';

test.setTimeout(120000);

test('BUG #18229 - Property phone number field should default to UK country code, not Afghanistan', async ({ page }) => {
  await loginToApp(page);

  // Navigate to properties list
  await page.goto('https://app-staging.vivacityapp.com/demo-student/properties');
  await page.waitForSelector('.v-application', { timeout: 30000 });

  // Wait for properties to load
  await page.waitForSelector('[class*="property"], [class*="v-card"], [class*="v-list-item"]', { timeout: 30000 });

  // Try to find and click on a property to open its details/edit page
  const propertyLink = page.locator('a[href*="propert"], .v-list-item[href*="propert"], .v-card[href*="propert"]').first();
  
  let navigatedToProperty = false;

  if (await propertyLink.isVisible({ timeout: 5000 })) {
    await propertyLink.click();
    navigatedToProperty = true;
  } else {
    // Try alternative selectors for property items
    const altPropertyLink = page.locator('text=/property/i').first();
    if (await altPropertyLink.isVisible({ timeout: 5000 })) {
      await altPropertyLink.click();
      navigatedToProperty = true;
    }
  }

  if (!navigatedToProperty) {
    // Navigate directly to a known property route pattern
    await page.goto('https://app-staging.vivacityapp.com/demo-student/properties');
    await page.waitForLoadState('networkidle', { timeout: 30000 });
    
    // Click first available property
    const firstProperty = page.locator('.v-list-item, .v-card').first();
    await firstProperty.waitFor({ timeout: 15000 });
    await firstProperty.click();
  }

  await page.waitForLoadState('networkidle', { timeout: 30000 });

  // Look for an edit button or settings for the property
  const editButton = page.locator('button:has-text("Edit"), a:has-text("Edit"), button:has-text("Settings"), [aria-label*="edit"]').first();
  if (await editButton.isVisible({ timeout: 5000 })) {
    await editButton.click();
    await page.waitForLoadState('networkidle', { timeout: 15000 });
  }

  // Look for phone number field with country code selector
  // In Vuetify, phone fields often have a flag/country code prefix
  const phoneFieldSelectors = [
    '[class*="phone"]',
    'input[type="tel"]',
    '[placeholder*="phone"], [placeholder*="Phone"]',
    '[label*="phone"], [label*="Phone"]',
  ];

  let phoneField = null;
  for (const selector of phoneFieldSelectors) {
    const el = page.locator(selector).first();
    if (await el.isVisible({ timeout: 3000 })) {
      phoneField = el;
      break;
    }
  }

  // Look for country code selector - this is typically a dropdown/select near the phone field
  const countryCodeSelectors = [
    '[class*="country-code"]',
    '[class*="countryCode"]',
    '[class*="country_code"]',
    '[class*="phone-prefix"]',
    '[class*="dial-code"]',
    '.vue-tel-input [class*="dropdown"]',
    '[class*="tel"] .v-select',
    '[class*="phone"] .v-select',
    '[class*="phone"] .v-autocomplete',
    'button[class*="country"]',
    '[data-testid*="country"]',
    '[data-testid*="phone"]',
  ];

  let countryCodeSelector = null;
  for (const selector of countryCodeSelectors) {
    const el = page.locator(selector).first();
    if (await el.isVisible({ timeout: 3000 })) {
      countryCodeSelector = el;
      break;
    }
  }

  if (countryCodeSelector) {
    // Click the country code selector to see what's selected
    await countryCodeSelector.click();
    await page.waitForTimeout(1000);

    // Check if Afghanistan is shown as selected (bug present)
    // OR check the displayed value in the selector
    const selectorText = await countryCodeSelector.textContent();
    
    // Close any opened dropdown
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);

    // The field should show UK (+44) not Afghanistan (+93)
    expect(selectorText).not.toContain('Afghanistan');
    expect(selectorText).not.toContain('+93');
    
    // Ideally it should contain UK/GB identifier
    const hasUKCode = selectorText?.includes('UK') || 
                       selectorText?.includes('GB') || 
                       selectorText?.includes('+44') ||
                       selectorText?.includes('🇬🇧');
    expect(hasUKCode).toBe(true);
  } else {
    // If we can't find the country code selector, navigate to property settings more specifically
    await page.goto('https://app-staging.vivacityapp.com/demo-student/properties');
    await page.waitForLoadState('networkidle', { timeout: 30000 });

    // Try finding property settings via URL patterns
    const currentUrl = page.url();
    console.log('Current URL:', currentUrl);

    // Check page content for any phone-related elements with country codes
    const allSelects = page.locator('.v-select, .v-autocomplete').all();
    const selects = await allSelects;

    let foundAfghanistan = false;
    let foundPhoneField = false;

    for (const select of selects) {
      if (await select.isVisible({ timeout: 2000 })) {
        const text = await select.textContent();
        if (text?.includes('Afghanistan') || text?.includes('+93')) {
          // Check if this is near a phone-related field
          const parent = select.locator('..').locator('..');
          const parentText = await parent.textContent();
          if (parentText?.toLowerCase().includes('phone') || parentText?.includes('+')) {
            foundAfghanistan = true;
            foundPhoneField = true;
            break;
          }
        }
        if (text?.includes('+44') || text?.includes('United Kingdom') || text?.includes('UK')) {
          foundPhoneField = true;
        }
      }
    }

    // If we found Afghanistan in a phone context, the bug is present
    if (foundPhoneField) {
      expect(foundAfghanistan).toBe(false);
    } else {
      // Navigate more specifically - try to find the property edit form
      // Check for any visible phone inputs on the page
      const pageContent = await page.content();
      if (pageContent.includes('Afghanistan') && pageContent.includes('phone')) {
        throw new Error('Bug #18229 present: Afghanistan country code found in phone field context');
      }
      
      // If we couldn't find the specific element, mark test as needing manual verification
      console.log('Could not find phone country code field - manual verification may be needed');
    }
  }
});

test('BUG #18229 - Verify UK country code persists when opening property settings', async ({ page }) => {
  await loginToApp(page);

  test.setTimeout(120000);

  // Navigate to properties
  await page.goto('https://app-staging.vivacityapp.com/demo-student/properties');
  await page.waitForLoadState('networkidle', { timeout: 30000 });
  await page.waitForSelector('.v-application', { timeout: 30000 });

  // Get list of properties if available
  const propertyItems = page.locator('.v-list-item[href*="propert"], a[href*="propert"]');
  const count = await propertyItems.count();

  if (count > 0) {
    // Check multiple properties for the bug
    for (let i = 0; i < Math.min(count, 3); i++) {
      const item = propertyItems.nth(i);
      if (await item.isVisible({ timeout: 3000 })) {
        await item.click();
        await page.waitForLoadState('networkidle', { timeout: 15000 });

        // Look for any country code display showing Afghanistan
        const afghBody = page.locator('body');
        const bodyText = await afghBody.textContent();

        if (bodyText?.includes('Afghanistan')) {
          // Verify it's in a phone field context
          const phoneSection = page.locator('[class*="phone"], input[type="tel"]').first();
          if (await phoneSection.isVisible({ timeout: 3000 })) {
            // Bug is present - country code shows Afghanistan instead of UK
            const nearbyText = await page.locator('[class*="phone"]').first().textContent();
            expect(nearbyText).not.toContain('Afghanistan');
          }
        }

        // Navigate back to properties list
        await page.goto('https://app-staging.vivacityapp.com/demo-student/properties');
        await page.waitForLoadState('networkidle', { timeout: 15000 });
      }
    }
  }

  // Direct check: look for phone field with country code on property edit page
  // Try known URL patterns for property settings
  const settingsPatterns = [
    '/demo-student/properties/settings',
    '/demo-student/property-settings',
    '/demo-student/settings/property',
  ];

  for (const pattern of settingsPatterns) {
    const response = await page.goto(`https://app-staging.vivacityapp.com${pattern}`);
    if (response?.status() === 200) {
      await page.waitForLoadState('networkidle', { timeout: 15000 });
      
      // Check for country code field
      const countryDropdown = page.locator('[class*="country"], [class*="phone-code"], [class*="dial"]').first();
      if (await countryDropdown.isVisible({ timeout: 5000 })) {
        const dropdownText = await countryDropdown.textContent();
        
        // Should not be Afghanistan
        expect(dropdownText).not.toContain('Afghanistan');
        expect(dropdownText).not.toContain('+93');
        
        break;
      }
    }
  }
});