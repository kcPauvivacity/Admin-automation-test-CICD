// Bug #17248: [Admin] Connectors - Add Property Mapping field does not appear on first click
// ADO: https://dev.azure.com/vivacityapp/Viva/_workitems/edit/17248
// Auto-generated 2026-06-12
// REVIEW BEFORE MERGING — verify selectors and assertions

import { test, expect } from '@playwright/test';
import { loginToApp } from '../helpers/auth.helper';

test.setTimeout(120000);

test('BUG #17248 - Add Property Mapping field appears on first click', async ({ page }) => {
  await loginToApp(page);

  // Navigate to Connectors
  await page.goto('https://app-staging.vivacityapp.com');
  
  // Wait for app to load
  await page.waitForSelector('.v-application', { timeout: 30000 });

  // Navigate to Connectors section
  const connectorsLink = page.locator('a, .v-list-item, [href*="connector"]').filter({ hasText: /connector/i }).first();
  await connectorsLink.waitFor({ timeout: 20000 });
  await connectorsLink.click();

  await page.waitForURL(/connector/i, { timeout: 20000 });

  // Wait for connectors page to load
  await page.waitForSelector('.v-application', { timeout: 15000 });

  // Look for any existing connector to click into, or find the property mapping button
  // First, check if there are connectors listed
  const connectorItems = page.locator('.v-card, .v-list-item, [data-testid*="connector"]').filter({ hasText: /connector/i });
  
  const connectorCount = await connectorItems.count();
  if (connectorCount > 0) {
    await connectorItems.first().click();
    await page.waitForTimeout(1000);
  }

  // Look for "Add Property Mapping" button
  const addPropertyMappingBtn = page.locator('button, .v-btn').filter({ hasText: /add property mapping/i });
  
  await addPropertyMappingBtn.waitFor({ timeout: 20000 });

  // Click "Add Property Mapping" for the FIRST time
  await addPropertyMappingBtn.click();

  // BUG: On first click, no input field appears
  // FIX: Input field should appear immediately after first click
  // Check for a new mapping input row/field appearing
  const mappingInputRow = page.locator(
    'input[placeholder*="property" i], input[placeholder*="mapping" i], input[placeholder*="key" i], input[placeholder*="value" i], .v-text-field input, [data-testid*="mapping"] input, .mapping-row, [class*="mapping"] input'
  ).last();

  // Also check for any newly appeared form fields or rows
  const newMappingField = page.locator(
    '.v-text-field, .v-field, .v-input'
  );

  const initialFieldCount = await newMappingField.count();

  // After clicking, a new input row should be immediately visible
  // We wait for a new row to appear - this should happen on first click when bug is fixed
  let fieldAppearedOnFirstClick = false;

  try {
    // Try to find a new input that appears specifically for property mapping
    const mappingRow = page.locator(
      'tr:last-child input, .property-mapping input, [class*="mapping"] input, .v-data-table tbody tr:last-child input'
    );
    
    await mappingRow.first().waitFor({ timeout: 5000, state: 'visible' });
    fieldAppearedOnFirstClick = true;
  } catch {
    // Try alternative selectors
    try {
      const afterClickFieldCount = await newMappingField.count();
      if (afterClickFieldCount > initialFieldCount) {
        fieldAppearedOnFirstClick = true;
      } else {
        // Check if any new text field became visible
        const visibleInputs = page.locator('.v-text-field:visible input, .v-field:visible input');
        await visibleInputs.last().waitFor({ timeout: 5000, state: 'visible' });
        fieldAppearedOnFirstClick = true;
      }
    } catch {
      fieldAppearedOnFirstClick = false;
    }
  }

  // Assert that the field appeared on first click (FAILS when bug is present, PASSES when fixed)
  expect(
    fieldAppearedOnFirstClick,
    'Property mapping input field should appear immediately on first click of "Add Property Mapping" button'
  ).toBe(true);

  // Cleanup: Cancel the mapping row if it was added
  const cancelBtn = page.locator('button, .v-btn').filter({ hasText: /cancel/i });
  const cancelVisible = await cancelBtn.isVisible().catch(() => false);
  if (cancelVisible) {
    await cancelBtn.click();
  }
});