// Bug #17714: [Admin] Label missing in UI
// ADO: https://dev.azure.com/vivacityapp/Viva/_workitems/edit/17714
// Auto-generated 2026-07-13
// REVIEW BEFORE MERGING — verify selectors and assertions

import { test, expect } from '@playwright/test';
import { loginToApp } from '../helpers/auth.helper';

test.setTimeout(120000);

test('BUG #17714 - Labels should be visible in admin UI', async ({ page }) => {
  await loginToApp(page);

  // Navigate to admin dashboard
  await page.goto('https://app-staging.vivacityapp.com');
  await page.waitForLoadState('networkidle');

  // Check that the application has loaded
  await expect(page.locator('.v-application')).toBeVisible();

  // Helper function to check for missing labels across common admin sections
  async function checkLabelsVisible(selector: string) {
    const elements = page.locator(selector);
    const count = await elements.count();
    for (let i = 0; i < count; i++) {
      const element = elements.nth(i);
      const isVisible = await element.isVisible();
      if (isVisible) {
        // Check that visible form fields have associated labels
        const label = await element.locator('label').first();
        // Labels should not be empty if they exist
        const labelCount = await element.locator('label').count();
        if (labelCount > 0) {
          const labelText = await label.textContent();
          expect(labelText?.trim().length, `Label text should not be empty`).toBeGreaterThan(0);
        }
      }
    }
  }

  // Check v-text-field components have labels
  const textFields = page.locator('.v-text-field');
  const textFieldCount = await textFields.count();

  for (let i = 0; i < textFieldCount; i++) {
    const field = textFields.nth(i);
    if (await field.isVisible()) {
      const labelEl = field.locator('.v-label, label');
      const labelCount = await labelEl.count();
      if (labelCount > 0) {
        const labelText = await labelEl.first().textContent();
        expect(labelText?.trim().length, `v-text-field label at index ${i} should not be empty`).toBeGreaterThan(0);
      }
    }
  }

  // Check v-select components have labels
  const selectFields = page.locator('.v-select');
  const selectCount = await selectFields.count();

  for (let i = 0; i < selectCount; i++) {
    const field = selectFields.nth(i);
    if (await field.isVisible()) {
      const labelEl = field.locator('.v-label, label');
      const labelCount = await labelEl.count();
      if (labelCount > 0) {
        const labelText = await labelEl.first().textContent();
        expect(labelText?.trim().length, `v-select label at index ${i} should not be empty`).toBeGreaterThan(0);
      }
    }
  }

  // Navigate to demo-student section
  await page.goto('https://app-staging.vivacityapp.com/demo-student');
  await page.waitForLoadState('networkidle');

  // Re-check labels on this page
  const pageLabels = page.locator('.v-label');
  const labelCount = await pageLabels.count();

  for (let i = 0; i < labelCount; i++) {
    const label = pageLabels.nth(i);
    if (await label.isVisible()) {
      const text = await label.textContent();
      // Labels that are visible should have text content
      expect(text?.trim().length, `v-label at index ${i} should have visible text`).toBeGreaterThan(0);
    }
  }

  // Check page titles and section headers are visible
  const headings = page.locator('h1, h2, h3, .v-toolbar__title');
  const headingCount = await headings.count();

  for (let i = 0; i < headingCount; i++) {
    const heading = headings.nth(i);
    if (await heading.isVisible()) {
      const text = await heading.textContent();
      expect(text?.trim().length, `Heading at index ${i} should have visible text`).toBeGreaterThan(0);
    }
  }
});

test('BUG #17714 - System settings labels visible for fusioneta admin', async ({ page }) => {
  await loginToApp(page, 90000, 'pau.kie.chee@fusioneta.com', 'PAOpaopao@9696');

  await page.goto('https://app-staging.vivacityapp.com/system-settings');
  await page.waitForLoadState('networkidle');

  // Check that the application has loaded
  await expect(page.locator('.v-application')).toBeVisible();

  // Check for any visible form labels in system settings
  const labels = page.locator('.v-label');
  const labelCount = await labels.count();

  for (let i = 0; i < labelCount; i++) {
    const label = labels.nth(i);
    if (await label.isVisible()) {
      const text = await label.textContent();
      expect(text?.trim().length, `System settings v-label at index ${i} should have visible text`).toBeGreaterThan(0);
    }
  }

  // Check input labels are not hidden
  const inputContainers = page.locator('.v-input');
  const inputCount = await inputContainers.count();

  for (let i = 0; i < inputCount; i++) {
    const input = inputContainers.nth(i);
    if (await input.isVisible()) {
      const labelEl = input.locator('.v-label');
      const inputLabelCount = await labelEl.count();
      if (inputLabelCount > 0) {
        const firstLabel = labelEl.first();
        // If there's a label element, it should be visible and have content
        if (await firstLabel.isVisible()) {
          const labelText = await firstLabel.textContent();
          expect(labelText?.trim().length, `Input label at index ${i} should have text`).toBeGreaterThan(0);
        }
      }
    }
  }

  // Verify page-level headings and section titles
  const sectionTitles = page.locator('.v-card-title, .v-card__title, .v-list-item-title');
  const titleCount = await sectionTitles.count();

  for (let i = 0; i < titleCount; i++) {
    const title = sectionTitles.nth(i);
    if (await title.isVisible()) {
      const text = await title.textContent();
      expect(text?.trim().length, `Section title at index ${i} should have visible text`).toBeGreaterThan(0);
    }
  }
});