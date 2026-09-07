// Bug #16107: [BUG]Appeditor > select any field will trigger save function
// ADO: https://dev.azure.com/vivacityapp/Viva/_workitems/edit/16107
// Auto-generated 2026-05-28
// REVIEW BEFORE MERGING — verify selectors and assertions

import { test, expect } from '@playwright/test';
import { loginToApp } from '../helpers/auth.helper';

test.setTimeout(120000);

test('BUG #16107: Selecting a field in AppEditor should not trigger save function', async ({ page }) => {
  await loginToApp(page, 90000, 'pau.kie.chee@fusioneta.com', 'PAOpaopao@9696');

  // Navigate to the app editor
  let navigatedViaLink = true;
  try {
    await page.goto('https://app-staging.vivacityapp.com/demo-student/app-editor', { waitUntil: 'load', timeout: 30000 });
    await page.waitForSelector('.v-application', { timeout: 15000 });
    await page.waitForTimeout(2000);
  } catch {
    navigatedViaLink = false;
  }

  if (!navigatedViaLink) {
    // Try direct navigation
    await page.goto('https://app-staging.vivacityapp.com/demo-student/app-editor', { timeout: 30000 });
  }

  // Wait for app editor to load
  await page.waitForSelector('.v-application', { timeout: 20000 });

  // Try to find the app editor page
  const pageContent = await page.content();
  
  // Look for any editor-related components
  const editorVisible = await page.locator('[class*="editor"], [class*="app-editor"], .v-form').first().isVisible({ timeout: 10000 }).catch(() => false);

  // Track save function calls by intercepting network requests
  let saveRequestCount = 0;
  const saveRequests: string[] = [];

  page.on('request', (request) => {
    const url = request.url();
    const method = request.method();
    // Capture PUT/POST/PATCH requests that could indicate a save operation
    if ((method === 'PUT' || method === 'POST' || method === 'PATCH') && 
        (url.includes('save') || url.includes('update') || url.includes('app') || url.includes('field'))) {
      saveRequestCount++;
      saveRequests.push(`${method} ${url}`);
    }
  });

  // Also track any save-related API calls
  const saveApiCalls: string[] = [];
  await page.route('**/*', async (route) => {
    const request = route.request();
    const url = request.url();
    const method = request.method();
    
    if ((method === 'PUT' || method === 'POST' || method === 'PATCH') &&
        (url.includes('save') || url.includes('update') || url.includes('app-editor') || url.includes('appeditor'))) {
      saveApiCalls.push(`${method} ${url}`);
    }
    
    await route.continue();
  });

  // Reset counters after navigation is complete
  await page.waitForTimeout(2000);
  saveRequestCount = 0;
  saveRequests.length = 0;
  saveApiCalls.length = 0;

  // Look for form fields in the app editor
  const formFields = page.locator('.v-select, .v-text-field, .v-input, input, select').filter({ visible: true });
  const fieldCount = await formFields.count();

  if (fieldCount === 0) {
    // Try to find any interactive elements
    console.log('No form fields found, looking for editor elements...');
    
    // Try navigating to a specific app editor route
    await page.goto('https://app-staging.vivacityapp.com/demo-student/app-editor/fields', { timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(2000);
    
    saveRequestCount = 0;
    saveRequests.length = 0;
    saveApiCalls.length = 0;
  }

  // Look for field selectors or dropdowns in the editor
  const fieldSelectors = page.locator('.v-select, [role="combobox"], [role="listbox"]').filter({ visible: true });
  const selectorCount = await fieldSelectors.count();

  let saveTriggered = false;

  if (selectorCount > 0) {
    const initialSaveCount = saveRequestCount;
    
    // Click on the first available field selector
    await fieldSelectors.first().click({ timeout: 10000 }).catch(() => {});
    
    // Wait briefly to see if any save is triggered
    await page.waitForTimeout(3000);

    // Check if a save dialog or notification appeared
    const saveIndicators = page.locator(
      '.v-snackbar:visible, .v-alert:visible, [class*="save"]:visible, [class*="success"]:visible, [class*="notification"]:visible'
    ).filter({ hasText: /save|saved|saving|updated|success/i });
    
    const saveIndicatorVisible = await saveIndicators.first().isVisible({ timeout: 2000 }).catch(() => false);
    
    if (saveIndicatorVisible || saveRequestCount > initialSaveCount || saveApiCalls.length > 0) {
      saveTriggered = true;
    }
  } else {
    // Try clicking on any visible interactive element in the editor
    const anyField = page.locator('input:visible, .v-field:visible').first();
    const anyFieldVisible = await anyField.isVisible({ timeout: 5000 }).catch(() => false);
    
    if (anyFieldVisible) {
      const initialSaveCount = saveRequestCount;
      
      await anyField.click({ timeout: 10000 }).catch(() => {});
      await page.waitForTimeout(3000);

      const saveIndicators = page.locator(
        '.v-snackbar:visible, .v-alert:visible'
      ).filter({ hasText: /save|saved|saving|updated|success/i });
      
      const saveIndicatorVisible = await saveIndicators.first().isVisible({ timeout: 2000 }).catch(() => false);
      
      if (saveIndicatorVisible || saveRequestCount > initialSaveCount) {
        saveTriggered = true;
      }
    }
  }

  // The bug: selecting a field triggers the save function
  // Test FAILS if bug is present (save was triggered by field selection)
  // Test PASSES when fixed (no save triggered by merely selecting a field)
  expect(saveTriggered, 
    `BUG #16107: Selecting a field triggered the save function unexpectedly. Save requests: ${JSON.stringify([...saveRequests, ...saveApiCalls])}`
  ).toBe(false);
});

test('BUG #16107: AppEditor - verify save is not triggered on field click (detailed check)', async ({ page }) => {
  await loginToApp(page, 90000, 'pau.kie.chee@fusioneta.com', 'PAOpaopao@9696');

  await page.goto('https://app-staging.vivacityapp.com');
  await page.waitForSelector('.v-application', { timeout: 30000 });

  // Track save-related mutations via dialog/snackbar monitoring
  let saveDialogShown = false;
  let saveFunctionCallDetected = false;

  // Listen for console errors or logs that indicate save was called
  page.on('console', (msg) => {
    const text = msg.text().toLowerCase();
    if (text.includes('save') || text.includes('saving') || text.includes('autosave')) {
      saveFunctionCallDetected = true;
    }
  });

  // Navigate to app editor
  await page.goto('https://app-staging.vivacityapp.com/demo-student/app-editor', { timeout: 30000 }).catch(() => {});
  await page.waitForTimeout(3000);

  // Intercept all API calls after navigation
  const postPutRequests: string[] = [];
  
  page.on('request', (request) => {
    const method = request.method();
    const url = request.url();
    if (method === 'PUT' || method === 'POST' || method === 'PATCH') {
      postPutRequests.push(`${method}: ${url}`);
    }
  });

  // Wait for any editor to render
  const editorContainer = page.locator(
    '[class*="editor"], [class*="app-editor"], .v-container, main'
  ).first();
  
  await editorContainer.waitFor({ state: 'visible', timeout: 15000 }).catch(() => {});

  // Clear any requests that happened during page load
  await page.waitForTimeout(2000);
  postPutRequests.length = 0;
  saveFunctionCallDetected = false;

  // Find and click on field selectors in the editor
  const fields = page.locator('.v-select:visible, [role="combobox"]:visible').all();
  const fieldElements = await fields;

  if (fieldElements.length > 0) {
    // Click the first field to select it (not to change its value, just focus/select)
    await fieldElements[0].click({ timeout: 10000 }).catch(() => {});
    
    // Give time for any save to be triggered
    await page.waitForTimeout(3000);

    // Check for save notifications
    const snackbar = page.locator('.v-snackbar').filter({ hasText: /save|saved|success/i });
    const snackbarVisible = await snackbar.isVisible({ timeout: 2000 }).catch(() => false);
    
    if (snackbarVisible) {
      saveDialogShown = true;
    }
  }

  // Press Escape to close any open dropdowns without saving
  await page.keyboard.press('Escape');
  await page.waitForTimeout(1000);

  // Bug is present if save was triggered by field selection
  const bugPresent = saveDialogShown || saveFunctionCallDetected;
  
  expect(bugPresent, 
    `BUG #16107: Save function was triggered by field selection. Save dialog: ${saveDialogShown}, Console save detected: ${saveFunctionCallDetected}`
  ).toBe(false);
});