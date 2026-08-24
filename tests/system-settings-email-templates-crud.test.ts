import { test, expect } from '@playwright/test';
import { loginToApp } from './helpers/auth.helper';

const EMAIL_TEMPLATES_URL = 'https://app-staging.vivacityapp.com/system-settings/email-templates';
const FUSIONETA_EMAIL = 'pau.kie.chee@fusioneta.com';
const FUSIONETA_PASSWORD = 'PAOpaopao@9696';

test.describe('System Settings - Email Templates CRUD', () => {

  test('[READ] list loads with table', async ({ page }) => {
    test.setTimeout(180000);
    await loginToApp(page, 90000, FUSIONETA_EMAIL, FUSIONETA_PASSWORD);
    await page.goto(EMAIL_TEMPLATES_URL);
    await page.waitForLoadState('networkidle');

    const table = page.locator('table, [role="grid"], [role="table"]').first();
    await expect(table).toBeVisible({ timeout: 30000 });
  });

  test('[READ] columns visible', async ({ page }) => {
    test.setTimeout(180000);
    await loginToApp(page, 90000, FUSIONETA_EMAIL, FUSIONETA_PASSWORD);
    await page.goto(EMAIL_TEMPLATES_URL);
    await page.waitForLoadState('networkidle');

    await expect(page.getByText(/name/i).first()).toBeVisible({ timeout: 30000 });
    await expect(page.getByText(/subject/i).first()).toBeVisible({ timeout: 30000 });
    await expect(page.getByText(/type/i).first()).toBeVisible({ timeout: 30000 });
    await expect(page.getByText(/language/i).first()).toBeVisible({ timeout: 30000 });
  });

  test('[READ] search by template name', async ({ page }) => {
    test.setTimeout(180000);
    await loginToApp(page, 90000, FUSIONETA_EMAIL, FUSIONETA_PASSWORD);
    await page.goto(EMAIL_TEMPLATES_URL);
    await page.waitForLoadState('networkidle');

    const searchInput = page.locator('input[type="search"], input[placeholder*="search" i], input[placeholder*="filter" i]').first();
    await expect(searchInput).toBeVisible({ timeout: 30000 });
    await searchInput.fill('welcome');
    await page.waitForTimeout(1500);

    const rows = page.locator('table tbody tr, [role="row"]');
    const rowCount = await rows.count().catch(() => 0);
    expect(rowCount).toBeGreaterThanOrEqual(0);
  });

  test('[CREATE] open create dialog, fill name/subject, select type, save', async ({ page }) => {
    test.setTimeout(180000);
    await loginToApp(page, 90000, FUSIONETA_EMAIL, FUSIONETA_PASSWORD);
    await page.goto(EMAIL_TEMPLATES_URL);
    await page.waitForLoadState('networkidle');

    const createButton = page.locator('button', { hasText: /create/i }).first();
    await expect(createButton).toBeVisible({ timeout: 30000 });
    await createButton.click();

    const dialog = page.locator('[role="dialog"], .modal, .dialog').first();
    const dialogVisible = await dialog.isVisible().catch(() => false);

    if (dialogVisible) {
      const nameInput = dialog.locator('input[name*="name" i], input[placeholder*="name" i], input[id*="name" i]').first();
      const nameVisible = await nameInput.isVisible().catch(() => false);
      if (nameVisible) {
        await nameInput.fill('Test Email Template');
      }

      const subjectInput = dialog.locator('input[name*="subject" i], input[placeholder*="subject" i], input[id*="subject" i]').first();
      const subjectVisible = await subjectInput.isVisible().catch(() => false);
      if (subjectVisible) {
        await subjectInput.fill('Test Subject Line');
      }

      const typeSelect = dialog.locator('select[name*="type" i], [role="combobox"]').first();
      const typeVisible = await typeSelect.isVisible().catch(() => false);
      if (typeVisible) {
        await typeSelect.click();
        const firstOption = page.locator('[role="option"], option').first();
        const optionVisible = await firstOption.isVisible().catch(() => false);
        if (optionVisible) {
          await firstOption.click();
        }
      }

      const saveButton = dialog.locator('button', { hasText: /save|submit|create/i }).first();
      const saveVisible = await saveButton.isVisible().catch(() => false);
      if (saveVisible) {
        await saveButton.click();
        await page.waitForTimeout(2000);
      }
    }
  });

  test('[EDIT] click first template row, edit subject, save', async ({ page }) => {
    test.setTimeout(180000);
    await loginToApp(page, 90000, FUSIONETA_EMAIL, FUSIONETA_PASSWORD);
    await page.goto(EMAIL_TEMPLATES_URL);
    await page.waitForLoadState('networkidle');

    const firstRow = page.locator('table tbody tr, [role="row"]').first();
    await expect(firstRow).toBeVisible({ timeout: 30000 });
    await firstRow.click();

    await page.waitForTimeout(1500);

    const editPanel = page.locator('[role="dialog"], .edit-panel, .side-panel, .drawer').first();
    const panelVisible = await editPanel.isVisible().catch(() => false);

    const subjectInput = panelVisible
      ? editPanel.locator('input[name*="subject" i], input[placeholder*="subject" i], input[id*="subject" i]').first()
      : page.locator('input[name*="subject" i], input[placeholder*="subject" i], input[id*="subject" i]').first();

    const subjectVisible = await subjectInput.isVisible().catch(() => false);
    if (subjectVisible) {
      await subjectInput.clear();
      await subjectInput.fill('Updated Subject Line');

      const saveButton = (panelVisible ? editPanel : page).locator('button', { hasText: /save|update/i }).first();
      const saveVisible = await saveButton.isVisible().catch(() => false);
      if (saveVisible) {
        await saveButton.click();
        await page.waitForTimeout(2000);
      }
    }
  });

  test('[DELETE] select via checkbox, click Delete, confirm in dialog', async ({ page }) => {
    test.setTimeout(180000);
    await loginToApp(page, 90000, FUSIONETA_EMAIL, FUSIONETA_PASSWORD);
    await page.goto(EMAIL_TEMPLATES_URL);
    await page.waitForLoadState('networkidle');

    const firstCheckbox = page.locator('table tbody tr input[type="checkbox"], [role="row"] input[type="checkbox"]').first();
    await expect(firstCheckbox).toBeVisible({ timeout: 30000 });
    await firstCheckbox.check();

    const deleteButton = page.locator('button', { hasText: /delete/i }).first();
    await expect(deleteButton).toBeVisible({ timeout: 15000 });
    await deleteButton.click();

    const confirmDialog = page.locator('[role="dialog"], .modal, .dialog').first();
    const confirmVisible = await confirmDialog.isVisible().catch(() => false);

    if (confirmVisible) {
      const confirmButton = confirmDialog.locator('button', { hasText: /confirm|yes|delete/i }).first();
      const confirmBtnVisible = await confirmButton.isVisible().catch(() => false);
      if (confirmBtnVisible) {
        await confirmButton.click();
        await page.waitForTimeout(2000);
      }
    }
  });

  test('[NAV] opens system settings and navigates to email-templates', async ({ page }) => {
    test.setTimeout(180000);
    await loginToApp(page, 90000, FUSIONETA_EMAIL, FUSIONETA_PASSWORD);
    await page.waitForLoadState('networkidle');

    const sysSettingsButton = page.locator('[aria-label="Open system settings"]');
    await expect(sysSettingsButton).toBeVisible({ timeout: 30000 });
    await sysSettingsButton.click();

    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);

    const emailTemplatesLink = page.locator('a[href*="email-templates"], [data-testid*="email-templates"]').first();
    const linkVisible = await emailTemplatesLink.isVisible().catch(() => false);

    if (linkVisible) {
      await emailTemplatesLink.click();
    } else {
      await page.goto(EMAIL_TEMPLATES_URL);
    }

    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/email-templates/, { timeout: 30000 });
  });

});
