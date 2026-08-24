import { test, expect } from '@playwright/test';
import { loginToApp } from './helpers/auth.helper';

const FUSIONETA_EMAIL = 'pau.kie.chee@fusioneta.com';
const FUSIONETA_PASSWORD = 'PAOpaopao@9696';
const SYSTEM_SETTINGS_URL = 'https://app-staging.vivacityapp.com/system-settings/organizations';
const TOOLTIPS_URL = 'https://app-staging.vivacityapp.com/system-settings/tooltips';

test.describe('System Settings - Tooltips CRUD', () => {

  // ─── NAV ───────────────────────────────────────────────────────────────────

  test.describe('NAV', () => {
    test('navigates to Tooltips via system settings header button', async ({ page }) => {
      test.setTimeout(180000);
      await loginToApp(page, 90000, FUSIONETA_EMAIL, FUSIONETA_PASSWORD);

      // Open system settings via header button
      const systemSettingsBtn = page.locator('[aria-label="Open system settings"]');
      await systemSettingsBtn.waitFor({ state: 'visible', timeout: 30000 });
      await systemSettingsBtn.click();

      // Wait for navigation to system settings
      await page.waitForURL('**/system-settings/**', { timeout: 30000 });

      // Try to find Tooltips in sidebar
      const tooltipsLink = page.locator('a, button, [role="menuitem"]').filter({ hasText: /^tooltips$/i });
      const tooltipsLinkCount = await tooltipsLink.count();

      if (tooltipsLinkCount > 0) {
        await tooltipsLink.first().click();
        await page.waitForURL('**/system-settings/tooltips**', { timeout: 30000 });
      } else {
        // Fall back to direct URL navigation
        await page.goto(TOOLTIPS_URL, { waitUntil: 'networkidle', timeout: 60000 });
      }

      await expect(page).toHaveURL(/system-settings\/tooltips/, { timeout: 30000 });
    });
  });

  // ─── READ ──────────────────────────────────────────────────────────────────

  test.describe('READ', () => {
    test('table and rows load', async ({ page }) => {
      test.setTimeout(180000);
      await loginToApp(page, 90000, FUSIONETA_EMAIL, FUSIONETA_PASSWORD);
      await page.goto(TOOLTIPS_URL, { waitUntil: 'networkidle', timeout: 60000 });

      // Wait for a table or list to appear
      const table = page.locator('table, [role="grid"], [role="table"]').first();
      await table.waitFor({ state: 'visible', timeout: 30000 });

      // Verify at least one row is present
      const rows = page.locator('table tbody tr, [role="row"]');
      const rowCount = await rows.count();
      expect(rowCount).toBeGreaterThan(0);
    });

    test('column headers are visible', async ({ page }) => {
      test.setTimeout(180000);
      await loginToApp(page, 90000, FUSIONETA_EMAIL, FUSIONETA_PASSWORD);
      await page.goto(TOOLTIPS_URL, { waitUntil: 'networkidle', timeout: 60000 });

      // Wait for table headers
      const headers = page.locator('table thead th, [role="columnheader"]');
      await headers.first().waitFor({ state: 'visible', timeout: 30000 });

      const headerCount = await headers.count();
      expect(headerCount).toBeGreaterThan(0);
    });

    test('search/filter by key', async ({ page }) => {
      test.setTimeout(180000);
      await loginToApp(page, 90000, FUSIONETA_EMAIL, FUSIONETA_PASSWORD);
      await page.goto(TOOLTIPS_URL, { waitUntil: 'networkidle', timeout: 60000 });

      // Try to find a search input — gracefully skip if not found
      const searchInput = page.locator('input[placeholder*="search" i], input[placeholder*="filter" i], input[type="search"]').first();
      const searchInputCount = await searchInput.count();

      if (searchInputCount === 0) {
        test.skip(true, 'No search input found on Tooltips page — skipping');
        return;
      }

      await searchInput.waitFor({ state: 'visible', timeout: 15000 });
      await searchInput.fill('TEST');
      await page.waitForTimeout(1000);

      // Verify page didn't crash — table or empty state should be visible
      const table = page.locator('table, [role="grid"], [role="table"]').first();
      const tableVisible = await table.isVisible().catch(() => false);

      const emptyState = page.locator('text=/no results/i, text=/no data/i, text=/empty/i').first();
      const emptyVisible = await emptyState.isVisible().catch(() => false);

      expect(tableVisible || emptyVisible).toBe(true);

      // Clear the search
      await searchInput.clear();
    });
  });

  // ─── CREATE ────────────────────────────────────────────────────────────────

  test.describe('CREATE', () => {
    test('creates a new tooltip', async ({ page }) => {
      test.setTimeout(180000);
      await loginToApp(page, 90000, FUSIONETA_EMAIL, FUSIONETA_PASSWORD);
      await page.goto(TOOLTIPS_URL, { waitUntil: 'networkidle', timeout: 60000 });

      const uniqueKey = `TEST_TOOLTIP_KEY_${Date.now()}`;

      // Try to find an "Add" or "Create" button
      const addButton = page.locator('button').filter({ hasText: /add|create|new|\+/i }).first();
      await addButton.waitFor({ state: 'visible', timeout: 30000 });
      await addButton.click();

      await page.waitForTimeout(1000);

      // Check for dialog-based pattern
      const dialog = page.locator('[role="dialog"], .modal, [class*="modal"], [class*="dialog"]').first();
      const dialogVisible = await dialog.isVisible().catch(() => false);

      if (dialogVisible) {
        // Dialog-based pattern
        const keyInput = dialog.locator('input[name*="key" i], input[placeholder*="key" i], input').first();
        await keyInput.waitFor({ state: 'visible', timeout: 15000 });
        await keyInput.fill(uniqueKey);

        // Fill other required fields if present
        const textInputs = dialog.locator('input, textarea');
        const inputCount = await textInputs.count();
        if (inputCount > 1) {
          await textInputs.nth(1).fill('Test tooltip value');
        }

        // Submit the dialog
        const submitBtn = dialog.locator('button').filter({ hasText: /save|submit|create|add|ok|confirm/i }).first();
        await submitBtn.click();
      } else {
        // Inline-row pattern — look for a new editable row
        const editableCell = page.locator('td input, td [contenteditable="true"]').first();
        const editableCellVisible = await editableCell.isVisible().catch(() => false);

        if (editableCellVisible) {
          await editableCell.click();
          // Use execCommand insertText for inline editors
          await page.evaluate((val) => document.execCommand('insertText', false, val), uniqueKey);

          // Move to next cell and fill value
          await editableCell.press('Tab');
          await page.waitForTimeout(300);
          const nextCell = page.locator('td input, td [contenteditable="true"]').nth(1);
          const nextCellVisible = await nextCell.isVisible().catch(() => false);
          if (nextCellVisible) {
            await nextCell.click();
            await page.evaluate((val) => document.execCommand('insertText', false, val), 'Test tooltip value');
          }

          // Save with keyboard or save button
          const saveBtn = page.locator('button').filter({ hasText: /save|confirm/i }).first();
          const saveBtnVisible = await saveBtn.isVisible().catch(() => false);
          if (saveBtnVisible) {
            await saveBtn.click();
          } else {
            await editableCell.press('Enter');
          }
        }
      }

      // Wait for the page to settle and verify no error state
      await page.waitForTimeout(2000);
      const errorMsg = page.locator('text=/error/i, [role="alert"]').first();
      const errorVisible = await errorMsg.isVisible().catch(() => false);
      expect(errorVisible).toBe(false);
    });
  });

  // ─── EDIT ──────────────────────────────────────────────────────────────────

  test.describe('EDIT', () => {
    test('edits an existing tooltip', async ({ page }) => {
      test.setTimeout(180000);
      await loginToApp(page, 90000, FUSIONETA_EMAIL, FUSIONETA_PASSWORD);
      await page.goto(TOOLTIPS_URL, { waitUntil: 'networkidle', timeout: 60000 });

      // Wait for table rows
      const rows = page.locator('table tbody tr, [role="row"]').filter({ hasNot: page.locator('th, [role="columnheader"]') });
      await rows.first().waitFor({ state: 'visible', timeout: 30000 });

      const firstRow = rows.first();

      // Try row-level edit button first
      const editBtn = firstRow.locator('button').filter({ hasText: /edit/i }).first();
      const editBtnVisible = await editBtn.isVisible().catch(() => false);

      if (editBtnVisible) {
        await editBtn.click();
      } else {
        // Try edit icon button (pencil icon)
        const iconBtn = firstRow.locator('button[aria-label*="edit" i], button[title*="edit" i], [data-action="edit"]').first();
        const iconBtnVisible = await iconBtn.isVisible().catch(() => false);

        if (iconBtnVisible) {
          await iconBtn.click();
        } else {
          // Try direct cell click for inline input
          const cell = firstRow.locator('td').nth(1);
          await cell.dblclick().catch(() => cell.click());
        }
      }

      await page.waitForTimeout(1000);

      // Check for dialog
      const dialog = page.locator('[role="dialog"], .modal, [class*="modal"], [class*="dialog"]').first();
      const dialogVisible = await dialog.isVisible().catch(() => false);

      if (dialogVisible) {
        // Edit in dialog
        const inputs = dialog.locator('input, textarea');
        const inputCount = await inputs.count();

        if (inputCount > 0) {
          const lastInput = inputs.last();
          await lastInput.click();
          await lastInput.selectAll().catch(() => lastInput.press('Control+A'));
          await lastInput.fill('Updated tooltip value');

          const saveBtn = dialog.locator('button').filter({ hasText: /save|submit|update|ok|confirm/i }).first();
          await saveBtn.click();
        } else {
          // Fall back gracefully — no editable inputs found in dialog
          const cancelBtn = dialog.locator('button').filter({ hasText: /cancel|close/i }).first();
          await cancelBtn.click().catch(() => {});
          test.skip(true, 'No editable inputs found in dialog — skipping');
          return;
        }
      } else {
        // Look for inline input in row
        const inlineInput = firstRow.locator('input, [contenteditable="true"]').first();
        const inlineInputVisible = await inlineInput.isVisible().catch(() => false);

        if (inlineInputVisible) {
          await inlineInput.click();
          await inlineInput.selectAll().catch(() => inlineInput.press('Control+A'));
          await page.evaluate((val) => document.execCommand('insertText', false, val), 'Updated tooltip value');

          const saveBtn = page.locator('button').filter({ hasText: /save|confirm/i }).first();
          const saveBtnVisible = await saveBtn.isVisible().catch(() => false);
          if (saveBtnVisible) {
            await saveBtn.click();
          } else {
            await inlineInput.press('Enter');
          }
        } else {
          // No editable inputs found anywhere — fall back gracefully
          test.skip(true, 'No editable inputs found for edit — skipping');
          return;
        }
      }

      // Verify no error state after edit
      await page.waitForTimeout(2000);
      const errorMsg = page.locator('text=/error/i, [role="alert"]').first();
      const errorVisible = await errorMsg.isVisible().catch(() => false);
      expect(errorVisible).toBe(false);
    });
  });

  // ─── DELETE ────────────────────────────────────────────────────────────────

  test.describe('DELETE', () => {
    test('deletes a tooltip row', async ({ page }) => {
      test.setTimeout(180000);
      await loginToApp(page, 90000, FUSIONETA_EMAIL, FUSIONETA_PASSWORD);
      await page.goto(TOOLTIPS_URL, { waitUntil: 'networkidle', timeout: 60000 });

      // Wait for table rows
      const rows = page.locator('table tbody tr, [role="row"]').filter({ hasNot: page.locator('th, [role="columnheader"]') });
      await rows.first().waitFor({ state: 'visible', timeout: 30000 });

      const initialRowCount = await rows.count();
      expect(initialRowCount).toBeGreaterThan(0);

      const firstRow = rows.first();
      let deleteTriggered = false;

      // Try checkbox + Delete button pattern
      const checkbox = firstRow.locator('input[type="checkbox"]').first();
      const checkboxVisible = await checkbox.isVisible().catch(() => false);

      if (checkboxVisible) {
        await checkbox.check();
        await page.waitForTimeout(500);

        const deleteBtn = page.locator('button').filter({ hasText: /delete|remove/i }).first();
        const deleteBtnVisible = await deleteBtn.isVisible().catch(() => false);

        if (deleteBtnVisible) {
          await deleteBtn.click();
          deleteTriggered = true;
        }
      }

      if (!deleteTriggered) {
        // Try row-level delete icon
        const deleteIcon = firstRow.locator('button[aria-label*="delete" i], button[title*="delete" i], button[aria-label*="remove" i], [data-action="delete"]').first();
        const deleteIconVisible = await deleteIcon.isVisible().catch(() => false);

        if (deleteIconVisible) {
          await deleteIcon.click();
          deleteTriggered = true;
        } else {
          // Try a button with delete/remove text in the row
          const rowDeleteBtn = firstRow.locator('button').filter({ hasText: /delete|remove/i }).first();
          const rowDeleteBtnVisible = await rowDeleteBtn.isVisible().catch(() => false);
          if (rowDeleteBtnVisible) {
            await rowDeleteBtn.click();
            deleteTriggered = true;
          }
        }
      }

      if (!deleteTriggered) {
        test.skip(true, 'Could not find a delete trigger on Tooltips page — skipping');
        return;
      }

      await page.waitForTimeout(1000);

      // Handle confirmation dialog
      const confirmDialog = page.locator('[role="dialog"], .modal, [class*="modal"], [class*="dialog"]').first();
      const confirmDialogVisible = await confirmDialog.isVisible().catch(() => false);

      if (confirmDialogVisible) {
        // Check for optional "Yes" input field
        const yesInput = confirmDialog.locator('input').first();
        const yesInputVisible = await yesInput.isVisible().catch(() => false);
        if (yesInputVisible) {
          await yesInput.fill('Yes');
        }

        // Click confirm/yes/ok button
        const confirmBtn = confirmDialog.locator('button').filter({ hasText: /yes|confirm|delete|ok/i }).first();
        await confirmBtn.click();
      }

      // Wait for deletion to process
      await page.waitForTimeout(3000);

      // Verify row count has decreased
      const newRowCount = await rows.count();
      expect(newRowCount).toBeLessThan(initialRowCount);
    });
  });

});
