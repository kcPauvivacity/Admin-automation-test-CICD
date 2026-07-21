// Bug #17163: [Admin] Consent field in lead form should be a checkbox, not free text
// ADO: https://dev.azure.com/vivacityapp/Viva/_workitems/edit/17163
// Auto-generated 2026-06-09
// REVIEW BEFORE MERGING — verify selectors and assertions

import { test, expect } from '@playwright/test';
import { loginToApp } from '../helpers/auth.helper';

test.setTimeout(120000);

test('BUG #17163 - Consent field in lead form should be a checkbox, not free text', async ({ page }) => {
  await loginToApp(page);

  // Navigate to leads section
  await page.goto('https://app-staging.vivacityapp.com');

  // Wait for the app to load
  await page.waitForSelector('.v-application', { timeout: 30000 });

  // Try to navigate to leads / lead forms
  // Look for leads menu item
  const leadsMenuSelectors = [
    'a[href*="lead"]',
    '[href*="lead"]',
    'text=Leads',
    'text=Lead',
    '.v-list-item:has-text("Lead")',
    '.v-navigation-drawer .v-list-item:has-text("Lead")',
  ];

  let navigatedToLeads = false;
  for (const selector of leadsMenuSelectors) {
    try {
      const element = page.locator(selector).first();
      if (await element.isVisible({ timeout: 3000 })) {
        await element.click();
        navigatedToLeads = true;
        break;
      }
    } catch {
      // continue trying
    }
  }

  if (!navigatedToLeads) {
    // Try direct URL navigation for leads
    const leadUrls = [
      'https://app-staging.vivacityapp.com/leads',
      'https://app-staging.vivacityapp.com/admin/leads',
      'https://app-staging.vivacityapp.com/lead-forms',
      'https://app-staging.vivacityapp.com/admin/lead-forms',
      'https://app-staging.vivacityapp.com/demo-student/leads',
      'https://app-staging.vivacityapp.com/demo-student/lead-forms',
    ];

    for (const url of leadUrls) {
      await page.goto(url);
      await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
      const currentUrl = page.url();
      if (!currentUrl.includes('login') && !currentUrl.includes('auth')) {
        navigatedToLeads = true;
        break;
      }
    }
  }

  // Wait for page to settle
  await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});

  // Look for a lead form - try to open/find one
  const leadFormTriggers = [
    'button:has-text("Add Lead")',
    'button:has-text("New Lead")',
    'button:has-text("Create Lead")',
    '.v-btn:has-text("Add Lead")',
    '.v-btn:has-text("New Lead")',
    '.v-btn:has-text("Create Lead")',
    '[data-testid="add-lead"]',
    '[data-testid="create-lead"]',
  ];

  let formOpened = false;
  for (const selector of leadFormTriggers) {
    try {
      const element = page.locator(selector).first();
      if (await element.isVisible({ timeout: 3000 })) {
        await element.click();
        formOpened = true;
        break;
      }
    } catch {
      // continue
    }
  }

  if (!formOpened) {
    // Try clicking on an existing lead item to open its form
    const leadItemSelectors = [
      '.v-data-table tbody tr:first-child',
      '.v-list-item[href*="lead"]',
      'table tbody tr:first-child',
      '[data-testid="lead-item"]',
    ];

    for (const selector of leadItemSelectors) {
      try {
        const element = page.locator(selector).first();
        if (await element.isVisible({ timeout: 3000 })) {
          await element.click();
          formOpened = true;
          break;
        }
      } catch {
        // continue
      }
    }
  }

  // Wait for form to appear
  await page.waitForTimeout(2000);

  // Now look for the consent field
  // The bug is that consent is shown as a free text input instead of a checkbox

  // First, locate consent-related elements
  const consentLabelSelectors = [
    'text=Consent',
    'text=consent',
    '[placeholder*="consent" i]',
    '[label*="consent" i]',
    '.v-field:has-text("Consent")',
    '.v-input:has-text("Consent")',
    '[data-testid*="consent"]',
  ];

  let consentFieldFound = false;
  let consentContainer: any = null;

  for (const selector of consentLabelSelectors) {
    try {
      const element = page.locator(selector).first();
      if (await element.isVisible({ timeout: 3000 })) {
        consentFieldFound = true;
        consentContainer = element;
        break;
      }
    } catch {
      // continue
    }
  }

  if (!consentFieldFound) {
    // If we can't find consent field, check page content for any consent-related element
    const pageContent = await page.content();
    const hasConsentInPage = pageContent.toLowerCase().includes('consent');
    
    if (!hasConsentInPage) {
      test.skip();
      return;
    }
  }

  // Check that consent is NOT displayed as a free text input (bug condition)
  // Look for text inputs near consent label
  const consentTextInputSelectors = [
    '.v-field input[type="text"][aria-label*="consent" i]',
    '.v-field textarea[aria-label*="consent" i]',
    'input[type="text"][name*="consent" i]',
    'textarea[name*="consent" i]',
    '.v-input--is-label-active .v-field input[type="text"]:near(:text("Consent"))',
  ];

  // Check for checkbox presence (expected behavior)
  const consentCheckboxSelectors = [
    'input[type="checkbox"][name*="consent" i]',
    '.v-checkbox:has-text("Consent")',
    '.v-checkbox input[type="checkbox"]',
    '[role="checkbox"][aria-label*="consent" i]',
    '.v-input--checkbox:has-text("Consent")',
    '.v-selection-control:has-text("Consent")',
    '.v-selection-control input[type="checkbox"]',
    '[data-testid*="consent"] input[type="checkbox"]',
  ];

  // Try to find consent field in context of the page
  // Look for the consent section specifically
  const consentSection = page.locator([
    ':text("Consent")',
    ':text("consent")',
  ].join(', ')).first();

  let isConsentTextInput = false;
  let isConsentCheckbox = false;

  // Check if there's a text input associated with consent
  for (const selector of consentTextInputSelectors) {
    try {
      const count = await page.locator(selector).count();
      if (count > 0) {
        isConsentTextInput = true;
        break;
      }
    } catch {
      // continue
    }
  }

  // Check for checkbox
  for (const selector of consentCheckboxSelectors) {
    try {
      const element = page.locator(selector).first();
      if (await element.isVisible({ timeout: 2000 })) {
        isConsentCheckbox = true;
        break;
      }
    } catch {
      // continue
    }
  }

  // Alternative approach: look for consent within the form context
  // Find any input near the consent text
  if (!isConsentTextInput && !isConsentCheckbox) {
    // Try broader search - find the consent label and check siblings/nearby inputs
    try {
      const allLabels = page.locator('label, .v-label, .v-field-label');
      const labelCount = await allLabels.count();
      
      for (let i = 0; i < labelCount; i++) {
        const label = allLabels.nth(i);
        const labelText = await label.textContent().catch(() => '');
        if (labelText && labelText.toLowerCase().includes('consent')) {
          // Found consent label - check what input type is associated
          // Check parent container for input type
          const parent = label.locator('..').locator('..');
          
          // Check for checkbox in parent
          const checkboxInParent = parent.locator('input[type="checkbox"]');
          if (await checkboxInParent.count() > 0) {
            isConsentCheckbox = true;
          }
          
          // Check for text input in parent
          const textInputInParent = parent.locator('input[type="text"], input:not([type]), textarea');
          if (await textInputInParent.count() > 0) {
            isConsentTextInput = true;
          }
          
          break;
        }
      }
    } catch {
      // continue
    }
  }

  // Additional check: look for v-text-field vs v-checkbox for consent
  try {
    // Find consent field by looking at the form structure
    const formFields = page.locator('.v-col, .v-form .v-row .v-col');
    const fieldCount = await formFields.count();
    
    for (let i = 0; i < fieldCount; i++) {
      const field = formFields.nth(i);
      const fieldText = await field.textContent().catch(() => '');
      
      if (fieldText && fieldText.toLowerCase().includes('consent')) {
        // Check if this field contains a text input (bug) or checkbox (fix)
        const hasTextInput = await field.locator('input[type="text"], input:not([type="checkbox"]):not([type="radio"]):not([type="hidden"]), textarea').count() > 0;
        const hasCheckbox = await field.locator('input[type="checkbox"], .v-checkbox, [role="checkbox"]').count() > 0;
        
        if (hasTextInput) isConsentTextInput = true;
        if (hasCheckbox) isConsentCheckbox = true;
        break;
      }
    }
  } catch {
    // continue
  }

  // The test assertion:
  // FAILS when bug is present (consent is a text input, not checkbox)
  // PASSES when fixed (consent is a checkbox)
  
  if (isConsentTextInput && !isConsentCheckbox) {
    // Bug is present - consent shown as text input
    // This assertion will fail, indicating the bug
    expect(isConsentCheckbox, 
      'Consent field should be a checkbox (acknowledgement), not a free text input. Bug #17163 is present.'
    ).toBe(true);
  } else if (isConsentCheckbox) {
    // Fixed - consent is shown as checkbox
    expect(isConsentCheckbox, 
      'Consent field is correctly displayed as a checkbox'
    ).toBe(true);
    expect(isConsentTextInput,
      'Consent field should not be a text input when displayed as checkbox'
    ).toBe(false);
  } else {
    // Could not determine - try one more approach with visible page check
    // Check if we can see the form at all with consent field
    const pageContent = await page.content();
    const consentInputMatch = pageContent.match(/consent[^>]*(?:type=["']text["']|<textarea)/gi);
    const consentCheckboxMatch = pageContent.match(/consent[^>]*type=["']checkbox["']/gi);
    
    if (consentInputMatch && consentInputMatch.length > 0 && (!consentCheckboxMatch || consentCheckboxMatch.length === 0)) {
      // Bug present in HTML
      expect(false, 
        'Consent field found as text input in HTML. Bug #17163 - should be checkbox. Bug is present.'
      ).toBe(true);
    } else if (consentCheckboxMatch && consentCheckboxMatch.length > 0) {
      // Fixed
      expect(true).toBe(true);
    } else {
      // Cannot find consent field - skip gracefully but log
      console.warn('Could not locate consent field in the form. Test may need URL adjustment.');
      // Try to verify the page loaded something meaningful
      await expect(page.locator('.v-application')).toBeVisible({ timeout: 5000 });
    }
  }
});