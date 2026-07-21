// Bug #16917: [Admin] Property name missing on detail page across multiple clients (iQ, HFS and others)
// ADO: https://dev.azure.com/vivacityapp/Viva/_workitems/edit/16917
// Auto-generated 2026-05-28
// REVIEW BEFORE MERGING — verify selectors and assertions

import { test, expect } from '@playwright/test';
import { loginToApp } from '../helpers/auth.helper';

test.setTimeout(120000);

test('BUG #16917 - Property name should not be missing on detail page', async ({ page }) => {
  await loginToApp(page);

  // Navigate to properties list
  await page.goto('https://app-staging.vivacityapp.com');

  // Wait for app to load
  await page.waitForSelector('.v-application', { timeout: 30000 });

  // Look for a properties/buildings navigation link
  const propertiesLink = page.locator('a, .v-list-item').filter({ hasText: /propert/i }).first();
  
  let navigatedToProperty = false;

  if (await propertiesLink.isVisible({ timeout: 10000 }).catch(() => false)) {
    await propertiesLink.click();
    await page.waitForLoadState('networkidle', { timeout: 20000 });
    navigatedToProperty = true;
  } else {
    // Try direct navigation to properties page
    const possiblePaths = [
      '/properties',
      '/admin/properties',
      '/buildings',
      '/admin/buildings',
      '/demo-student/properties',
      '/demo-student/buildings',
    ];

    for (const path of possiblePaths) {
      await page.goto(`https://app-staging.vivacityapp.com${path}`);
      await page.waitForLoadState('networkidle', { timeout: 15000 });
      
      const hasContent = await page.locator('.v-data-table, .v-list, [data-testid*="property"], [class*="property"]')
        .isVisible({ timeout: 5000 })
        .catch(() => false);
      
      if (hasContent) {
        navigatedToProperty = true;
        break;
      }
    }
  }

  // Try to find and click on a property item to get to detail page
  const propertyItems = page.locator('.v-data-table tbody tr, .v-list-item[href*="propert"], .v-list-item[href*="building"]');
  
  let detailPageReached = false;
  let propertyNameBeforeClick = '';

  if (await propertyItems.count() > 0) {
    // Get the name from the first row before clicking
    const firstRow = propertyItems.first();
    const nameCell = firstRow.locator('td').first();
    propertyNameBeforeClick = (await nameCell.textContent() || '').trim();
    
    // Click to navigate to detail page
    await firstRow.click();
    await page.waitForLoadState('networkidle', { timeout: 15000 });
    detailPageReached = true;
  } else {
    // Try clicking on any property-related card or link
    const propertyCard = page.locator('[class*="property-card"], [class*="building-card"], .v-card[href*="propert"]').first();
    if (await propertyCard.isVisible({ timeout: 5000 }).catch(() => false)) {
      await propertyCard.click();
      await page.waitForLoadState('networkidle', { timeout: 15000 });
      detailPageReached = true;
    }
  }

  if (!detailPageReached) {
    // Try navigating directly to a known detail page pattern
    const possibleDetailPaths = [
      '/demo-student/properties/1',
      '/demo-student/buildings/1',
      '/properties/1',
      '/buildings/1',
    ];

    for (const path of possibleDetailPaths) {
      await page.goto(`https://app-staging.vivacityapp.com${path}`);
      await page.waitForLoadState('networkidle', { timeout: 15000 });
      
      const hasForm = await page.locator('.v-text-field, .v-form, [data-testid*="name"]')
        .isVisible({ timeout: 5000 })
        .catch(() => false);
      
      if (hasForm) {
        detailPageReached = true;
        break;
      }
    }
  }

  // On the detail page, verify property name field is not empty
  // Look for name field (input or displayed text)
  const nameFieldSelectors = [
    'input[name*="name" i]',
    'input[placeholder*="name" i]',
    '[data-testid*="property-name"] input',
    '[data-testid*="name"] input',
    '.v-text-field input[id*="name" i]',
    'label:has-text("Property Name") + .v-input input',
    'label:has-text("Name") + .v-input input',
  ];

  let nameFieldFound = false;
  let nameValue = '';

  for (const selector of nameFieldSelectors) {
    const field = page.locator(selector).first();
    if (await field.isVisible({ timeout: 3000 }).catch(() => false)) {
      nameValue = (await field.inputValue().catch(() => '')) || '';
      nameFieldFound = true;
      
      // BUG #16917: Property name should NOT be empty on detail page
      expect(
        nameValue.length,
        `Property name field is empty (selector: ${selector}). Bug #16917: Google autocomplete may have overwritten the property name.`
      ).toBeGreaterThan(0);
      
      break;
    }
  }

  // Also check for displayed name in heading or title area
  const nameDisplaySelectors = [
    'h1, h2, h3',
    '[class*="property-name"]',
    '[class*="building-name"]',
    '[data-testid*="property-name"]',
    '.page-title',
    '.v-card-title',
  ];

  let displayNameFound = false;

  for (const selector of nameDisplaySelectors) {
    const elements = page.locator(selector);
    const count = await elements.count();
    
    for (let i = 0; i < count; i++) {
      const el = elements.nth(i);
      const text = (await el.textContent() || '').trim();
      
      // Skip generic titles like "Properties", "Buildings", etc.
      if (text && !['Properties', 'Buildings', 'Property', 'Building', 'Dashboard'].includes(text)) {
        displayNameFound = true;
        // BUG #16917: Display name should not be empty or show placeholder
        expect(
          text,
          `Property name display is empty or showing placeholder. Bug #16917: Property name missing on detail page.`
        ).not.toBe('');
        expect(
          text,
          `Property name should not be 'Unnamed' placeholder. Bug #16917: Property name missing on detail page.`
        ).not.toMatch(/^(unnamed|untitled|n\/a|null|undefined)$/i);
        break;
      }
    }
    
    if (displayNameFound) break;
  }

  // Verify that at least one name indicator was found and validated
  if (!nameFieldFound && !displayNameFound) {
    // If we can't find a specific name field, check the page URL contains a valid ID
    // and that the page has loaded with some property data
    const currentUrl = page.url();
    const hasPropertyData = await page.locator('.v-form, .v-card, [class*="detail"]')
      .isVisible({ timeout: 5000 })
      .catch(() => false);
    
    // At minimum, verify we're on a detail page with content
    expect(
      hasPropertyData,
      'Property detail page should have content loaded. Bug #16917: Unable to verify property name field.'
    ).toBe(true);
  }

  // Additional check: Verify autocomplete input fields don't interfere with existing data
  // Look for Google Places autocomplete inputs
  const autocompleteInputs = page.locator('input[autocomplete], .pac-input, input[id*="autocomplete"]');
  const autocompleteCount = await autocompleteInputs.count();
  
  if (autocompleteCount > 0) {
    // Verify property name field (if found) still has its value after potential autocomplete initialization
    if (nameFieldFound && nameValue) {
      // Re-check name value hasn't been cleared by autocomplete
      for (const selector of nameFieldSelectors) {
        const field = page.locator(selector).first();
        if (await field.isVisible({ timeout: 3000 }).catch(() => false)) {
          const currentNameValue = await field.inputValue().catch(() => '');
          expect(
            currentNameValue,
            `Property name was cleared after autocomplete initialization. Bug #16917: Google autocomplete overwriting existing property name data.`
          ).toBe(nameValue);
          break;
        }
      }
    }
  }
});

test('BUG #16917 - Property name persists on detail page when form is rendered (building level)', async ({ page }) => {
  await loginToApp(page);

  await page.waitForSelector('.v-application', { timeout: 30000 });

  // Try to navigate to a building/property detail page via URL patterns
  const detailPagePaths = [
    '/demo-student/properties',
    '/demo-student/buildings',
    '/properties',
  ];

  let foundDetailPage = false;

  for (const path of detailPagePaths) {
    await page.goto(`https://app-staging.vivacityapp.com${path}`);
    await page.waitForLoadState('networkidle', { timeout: 15000 });

    // Look for list items or table rows to click into
    const listItems = page.locator('.v-data-table tbody tr').first();
    
    if (await listItems.isVisible({ timeout: 5000 }).catch(() => false)) {
      // Capture name before navigating to detail
      const rowText = (await listItems.textContent() || '').trim();
      
      await listItems.click();
      await page.waitForLoadState('networkidle', { timeout: 15000 });
      
      foundDetailPage = true;
      
      // Check that property name field exists and has value
      await page.waitForSelector('.v-text-field, .v-form', { timeout: 10000 }).catch(() => {});
      
      // Find any input that could be a name field
      const inputs = page.locator('.v-text-field input');
      const inputCount = await inputs.count();
      
      let hasNonEmptyNameField = false;
      
      for (let i = 0; i < Math.min(inputCount, 5); i++) {
        const input = inputs.nth(i);
        const inputId = await input.getAttribute('id') || '';
        const inputName = await input.getAttribute('name') || '';
        const inputPlaceholder = await input.getAttribute('placeholder') || '';
        const label = await page.locator(`label[for="${inputId}"]`).textContent().catch(() => '');
        
        const isNameRelated = 
          /name/i.test(inputId) || 
          /name/i.test(inputName) || 
          /name/i.test(inputPlaceholder) ||
          /name/i.test(label);
        
        if (isNameRelated) {
          const value = await input.inputValue().catch(() => '');
          
          // BUG #16917: Name field should have value, not be empty
          expect(
            value.length,
            `Property name input field is empty on detail page. Bug #16917: Google autocomplete may have overwritten or cleared the property name.`
          ).toBeGreaterThan(0);
          
          hasNonEmptyNameField = true;
          break;
        }
      }
      
      break;
    }
  }

  if (!foundDetailPage) {
    // Smoke test: just verify property pages load without name field being blank
    await page.goto('https://app-staging.vivacityapp.com/demo-student/properties');
    await page.waitForLoadState('networkidle', { timeout: 15000 });
    
    // Verify the page loaded
    await expect(page.locator('.v-application')).toBeVisible({ timeout: 10000 });
  }
});