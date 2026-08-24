import { test, expect } from '@playwright/test';
import { loginToApp } from './helpers/auth.helper';

test.describe('System Settings - Organizations CRUD', () => {
  test('[NAV] navigates to organisations and asserts URL and heading', async ({ page }) => {
    test.setTimeout(180000);
    await loginToApp(page, 90000, 'pau.kie.chee@fusioneta.com', 'PAOpaopao@9696');
    await page.goto('/system-settings/organisations');
    await expect(page).toHaveURL(/\/system-settings\/organisations/);
    const heading = page.getByRole('heading').filter({ hasText: /organisation/i }).first();
    await expect(heading).toBeVisible({ timeout: 30000 });
  });

  test('[READ] list loads with expected columns', async ({ page }) => {
    test.setTimeout(180000);
    await loginToApp(page, 90000, 'pau.kie.chee@fusioneta.com', 'PAOpaopao@9696');
    await page.goto('/system-settings/organisations');
    await page.waitForLoadState('networkidle', { timeout: 30000 });

    const nameColumn = page.getByRole('columnheader', { name: /name/i });
    await expect(nameColumn).toBeVisible({ timeout: 30000 });

    const secondaryColumn = page.getByRole('columnheader', { name: /slug|type|country/i }).first();
    await expect(secondaryColumn).toBeVisible({ timeout: 30000 });

    const rows = page.getByRole('row');
    const rowCount = await rows.count();
    expect(rowCount).toBeGreaterThan(1);
  });

  test('[READ] search organizations', async ({ page }) => {
    test.setTimeout(180000);
    await loginToApp(page, 90000, 'pau.kie.chee@fusioneta.com', 'PAOpaopao@9696');
    await page.goto('/system-settings/organisations');
    await page.waitForLoadState('networkidle', { timeout: 30000 });

    const searchInput = page.getByRole('searchbox').or(page.getByPlaceholder(/search/i)).first();
    const searchVisible = await searchInput.isVisible().catch(() => false);

    if (searchVisible) {
      await searchInput.fill('test');
      await page.waitForLoadState('networkidle', { timeout: 15000 });
      await searchInput.clear();
      await page.waitForLoadState('networkidle', { timeout: 15000 });
    } else {
      const filterButton = page.getByRole('button', { name: /filter/i }).first();
      const filterVisible = await filterButton.isVisible().catch(() => false);
      if (filterVisible) {
        await filterButton.click();
        const filterInput = page.getByRole('textbox').first();
        await filterInput.fill('test');
        await page.waitForLoadState('networkidle', { timeout: 15000 });
        await filterInput.clear();
        await page.waitForLoadState('networkidle', { timeout: 15000 });
      }
    }
  });

  test('[READ] pagination info visible', async ({ page }) => {
    test.setTimeout(180000);
    await loginToApp(page, 90000, 'pau.kie.chee@fusioneta.com', 'PAOpaopao@9696');
    await page.goto('/system-settings/organisations');
    await page.waitForLoadState('networkidle', { timeout: 30000 });

    const paginationNav = page.getByRole('navigation', { name: /pagination/i });
    const paginationNavVisible = await paginationNav.isVisible().catch(() => false);

    if (paginationNavVisible) {
      await expect(paginationNav).toBeVisible({ timeout: 15000 });
    } else {
      const paginationText = page.getByText(/\d+-\d+\s+of\s+\d+|page\s+\d+/i).first();
      const paginationTextVisible = await paginationText.isVisible().catch(() => false);

      if (paginationTextVisible) {
        await expect(paginationText).toBeVisible({ timeout: 15000 });
      } else {
        const paginationButtons = page.getByRole('button', { name: /next|previous|page/i }).first();
        await expect(paginationButtons).toBeVisible({ timeout: 15000 });
      }
    }
  });

  test('[CREATE] creates a new organization', async ({ page }) => {
    test.setTimeout(180000);
    await loginToApp(page, 90000, 'pau.kie.chee@fusioneta.com', 'PAOpaopao@9696');
    await page.goto('/system-settings/organisations');
    await page.waitForLoadState('networkidle', { timeout: 30000 });

    const createButton = page
      .getByRole('button', { name: /create|add|new/i })
      .first();
    await createButton.click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 15000 });

    const nameField = dialog.getByRole('textbox', { name: /name/i }).first();
    await nameField.fill('Test Organization ' + Date.now());

    const slugField = dialog.getByRole('textbox', { name: /slug/i }).first();
    const slugVisible = await slugField.isVisible().catch(() => false);
    if (slugVisible) {
      const slugValue = await slugField.inputValue();
      if (!slugValue) {
        await slugField.fill('test-org-' + Date.now());
      }
    }

    const emailField = dialog.getByRole('textbox', { name: /email/i }).first();
    const emailVisible = await emailField.isVisible().catch(() => false);
    if (emailVisible) {
      await emailField.fill('testorg@example.com');
    }

    const typeSelect = dialog.getByRole('combobox', { name: /type/i }).first();
    const typeVisible = await typeSelect.isVisible().catch(() => false);
    if (typeVisible) {
      await typeSelect.click();
      const typeOption = page.getByRole('option').first();
      const typeOptionVisible = await typeOption.isVisible().catch(() => false);
      if (typeOptionVisible) {
        await typeOption.click();
      }
    }

    const countrySelect = dialog.getByRole('combobox', { name: /country/i }).first();
    const countryVisible = await countrySelect.isVisible().catch(() => false);
    if (countryVisible) {
      await countrySelect.click();
      const countryOption = page.getByRole('option').first();
      const countryOptionVisible = await countryOption.isVisible().catch(() => false);
      if (countryOptionVisible) {
        await countryOption.click();
      }
    }

    const saveButton = dialog
      .getByRole('button', { name: /save|submit|create|confirm/i })
      .first();
    await saveButton.click();

    await page.waitForLoadState('networkidle', { timeout: 30000 });
  });

  test('[EDIT] edits the first organization', async ({ page }) => {
    test.setTimeout(180000);
    await loginToApp(page, 90000, 'pau.kie.chee@fusioneta.com', 'PAOpaopao@9696');
    await page.goto('/system-settings/organisations');
    await page.waitForLoadState('networkidle', { timeout: 30000 });

    const firstRowEditButton = page
      .getByRole('row')
      .nth(1)
      .getByRole('button', { name: /edit/i })
      .first();
    const editButtonVisible = await firstRowEditButton.isVisible().catch(() => false);

    if (editButtonVisible) {
      await firstRowEditButton.click();
    } else {
      const firstRow = page.getByRole('row').nth(1);
      await firstRow.click();
    }

    const editContainer =
      page.getByRole('dialog').or(page.getByRole('complementary')).first();
    const containerVisible = await editContainer.isVisible().catch(() => false);

    let nameField;
    if (containerVisible) {
      nameField = editContainer.getByRole('textbox', { name: /name/i }).first();
    } else {
      nameField = page.getByRole('textbox', { name: /name/i }).first();
    }

    await expect(nameField).toBeVisible({ timeout: 15000 });
    const currentValue = await nameField.inputValue();
    await nameField.fill(currentValue + ' (edited)');

    const saveButton = containerVisible
      ? editContainer.getByRole('button', { name: /save|submit|update|confirm/i }).first()
      : page.getByRole('button', { name: /save|submit|update|confirm/i }).first();

    await saveButton.click();
    await page.waitForLoadState('networkidle', { timeout: 30000 });
  });

  test('[DELETE] deletes the first organization', async ({ page }) => {
    test.setTimeout(180000);
    await loginToApp(page, 90000, 'pau.kie.chee@fusioneta.com', 'PAOpaopao@9696');
    await page.goto('/system-settings/organisations');
    await page.waitForLoadState('networkidle', { timeout: 30000 });

    const firstRowCheckbox = page.getByRole('row').nth(1).getByRole('checkbox').first();
    await firstRowCheckbox.check();

    const deleteButton = page.getByRole('button', { name: /delete/i }).first();
    await expect(deleteButton).toBeVisible({ timeout: 15000 });
    await deleteButton.click();

    const confirmDialog = page.getByRole('dialog');
    await expect(confirmDialog).toBeVisible({ timeout: 15000 });

    const yesInput = confirmDialog.getByRole('textbox').first();
    const yesInputVisible = await yesInput.isVisible().catch(() => false);
    if (yesInputVisible) {
      await yesInput.fill('Yes');
    }

    const confirmButton = confirmDialog
      .getByRole('button', { name: /confirm|delete|yes|ok/i })
      .first();
    await confirmButton.click();

    await page.waitForLoadState('networkidle', { timeout: 30000 });

    const pageContent = await page.content();
    expect(pageContent).not.toMatch(/500\s*[-–]?\s*internal server error/i);
  });
});
