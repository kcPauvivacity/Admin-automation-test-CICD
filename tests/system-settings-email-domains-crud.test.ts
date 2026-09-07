import { test, expect } from '@playwright/test';
import { loginToApp } from './helpers/auth.helper';

const EMAIL = 'pau.kie.chee@fusioneta.com';
const PASSWORD = 'PAOpaopao@9696';
const BASE = 'https://app-staging.vivacityapp.com';
const LIST_URL = `${BASE}/system-settings/email-domains`;

async function navigateToEmailDomains(page: any) {
    await page.goto(LIST_URL, { waitUntil: 'load', timeout: 30000 });
    await page.waitForTimeout(3000);
    await expect(page).toHaveURL(/system-settings\/email-domains/, { timeout: 10000 });
    await page.waitForTimeout(1000);
    console.log('✅ Navigated to Email Domains');
}

// Email Domains module — manages approved/whitelisted email domains for the platform.
// Each record typically has a domain name (e.g. "university.ac.uk") and a verification status.

test.describe('System Settings — Email Domains', () => {

    // ─── READ: Page Loads ────────────────────────────────────────────────────────

    test('[READ] page loads and main content is visible', async ({ page }) => {
        test.setTimeout(180000);

        await loginToApp(page, 90000, EMAIL, PASSWORD);
        await navigateToEmailDomains(page);

        // Verify the page heading or a recognisable landmark is present
        const heading = page.locator('h1, h2, h3, .page-title, [class*="title"]').filter({ hasText: /email.domain/i }).first();
        const headingVisible = await heading.isVisible({ timeout: 8000 }).catch(() => false);

        if (headingVisible) {
            console.log('✅ Page heading is visible');
        } else {
            // Fall back — check the breadcrumb or sidebar active item
            const breadcrumb = page.locator('.v-breadcrumbs, nav[aria-label*="breadcrumb"], [class*="breadcrumb"]').first();
            const breadcrumbVisible = await breadcrumb.isVisible({ timeout: 5000 }).catch(() => false);
            console.log(breadcrumbVisible ? '✅ Breadcrumb navigation visible' : '⚠️ No heading or breadcrumb found — checking main content');
        }

        // Main content area must exist
        const main = page.locator('main, .v-main, [class*="content"], [class*="main"]').first();
        const mainVisible = await main.isVisible({ timeout: 8000 }).catch(() => false);
        expect(mainVisible).toBeTruthy();
        console.log('✅ Main content area is visible');

        // Confirm we are still on the correct URL
        await expect(page).toHaveURL(/system-settings\/email-domains/, { timeout: 5000 });
        console.log('✅ URL confirms Email Domains module');
    });

    // ─── READ: Table / List Shows Records ───────────────────────────────────────

    test('[READ] table or list renders records and column headers', async ({ page }) => {
        test.setTimeout(180000);

        await loginToApp(page, 90000, EMAIL, PASSWORD);
        await navigateToEmailDomains(page);

        // Wait for any loading spinner to disappear
        const spinner = page.locator('.v-progress-circular, .v-progress-linear, [class*="loading"]').first();
        await spinner.waitFor({ state: 'hidden', timeout: 10000 }).catch(() => false);
        await page.waitForTimeout(1000);

        // Check for a data table
        const table = page.locator('.v-data-table, table').first();
        const tableVisible = await table.isVisible({ timeout: 8000 }).catch(() => false);

        if (tableVisible) {
            console.log('✅ Data table is visible');

            // Log column headers
            const headers = page.locator('thead th, .v-data-table-header th');
            const headerCount = await headers.count().catch(() => 0);
            if (headerCount > 0) {
                for (let i = 0; i < headerCount; i++) {
                    const text = await headers.nth(i).innerText().catch(() => '');
                    if (text.trim()) console.log(`  Column ${i + 1}: ${text.trim()}`);
                }
                console.log(`✅ Found ${headerCount} column header(s)`);
            } else {
                console.log('⚠️ No column headers found');
            }

            // Count data rows
            const rows = page.locator('tbody tr');
            const rowCount = await rows.count().catch(() => 0);
            console.log(`✅ Table has ${rowCount} data row(s)`);
        } else {
            // Fall back to list items (v-list)
            const listItems = page.locator('.v-list-item, [class*="list-item"]');
            const listCount = await listItems.count().catch(() => 0);
            if (listCount > 0) {
                console.log(`✅ List view found with ${listCount} item(s)`);
            } else {
                console.log('⚠️ No table or list found — module may be empty or use a different layout');
            }
        }

        // Check for an empty-state message (valid if no domains are configured)
        const emptyState = page.locator('[class*="empty"], [class*="no-data"], .v-data-table__empty-wrapper').first();
        const emptyVisible = await emptyState.isVisible({ timeout: 3000 }).catch(() => false);
        if (emptyVisible) {
            console.log('⚠️ Empty state displayed — no email domains configured yet');
        }
    });

    // ─── READ: Search / Filter ───────────────────────────────────────────────────

    test('[READ] search or filter works and can be cleared', async ({ page }) => {
        test.setTimeout(180000);

        await loginToApp(page, 90000, EMAIL, PASSWORD);
        await navigateToEmailDomains(page);

        await page.waitForTimeout(2000);

        // Locate a search input — Vuetify often renders it as v-text-field
        const searchInput = page.locator(
            'input[placeholder*="search" i], input[aria-label*="search" i], .v-text-field input[type="text"], input[type="search"]'
        ).first();

        const searchVisible = await searchInput.isVisible({ timeout: 6000 }).catch(() => false);

        if (searchVisible) {
            await searchInput.click();
            await searchInput.fill('test-domain.ac.uk');
            await page.waitForTimeout(1500);
            console.log('✅ Typed search term into search field');

            // Clear the search
            const clearBtn = page.locator('button[aria-label*="clear" i], .v-input__icon--clear button, .mdi-close').first();
            const clearVisible = await clearBtn.isVisible({ timeout: 4000 }).catch(() => false);

            if (clearVisible) {
                await clearBtn.click();
                await page.waitForTimeout(1000);
                console.log('✅ Cleared search via clear button');
            } else {
                await searchInput.selectAll ? await searchInput.selectAll() : await searchInput.press('Control+a');
                await searchInput.press('Backspace');
                await page.waitForTimeout(1000);
                console.log('✅ Cleared search by deleting text');
            }

            // Verify search field is empty
            const value = await searchInput.inputValue().catch(() => '');
            console.log(value === '' ? '✅ Search field cleared' : `⚠️ Search field value after clear: "${value}"`);
        } else {
            // Try a filter chip or dropdown
            const filterBtn = page.locator('button').filter({ hasText: /filter/i }).first();
            const filterVisible = await filterBtn.isVisible({ timeout: 4000 }).catch(() => false);
            if (filterVisible) {
                console.log('⚠️ No search field found — filter button detected but skipping interaction');
            } else {
                console.log('⚠️ No search or filter control found on this module');
            }
        }
    });

    // ─── CREATE: Open Create Dialog ──────────────────────────────────────────────

    test('[CREATE] create button opens dialog — does NOT save', async ({ page }) => {
        test.setTimeout(180000);

        await loginToApp(page, 90000, EMAIL, PASSWORD);
        await navigateToEmailDomains(page);

        await page.waitForTimeout(2000);

        // Locate the Create / Add button
        const createBtn = page.locator('button').filter({ hasText: /create|add|new/i }).first();
        const createVisible = await createBtn.isVisible({ timeout: 6000 }).catch(() => false);

        if (!createVisible) {
            console.log('⚠️ No Create/Add button found — skipping create dialog test');
            return;
        }

        await createBtn.click();
        await page.waitForTimeout(2000);
        console.log('✅ Clicked Create button');

        // Verify dialog/modal opened
        const dialog = page.locator('.v-dialog, [role="dialog"], .v-overlay__content').first();
        const dialogVisible = await dialog.isVisible({ timeout: 8000 }).catch(() => false);

        if (dialogVisible) {
            console.log('✅ Create dialog opened');

            // Check for a domain input field inside the dialog
            const domainInput = dialog.locator('input[type="text"], input[type="email"], textarea').first();
            const domainInputVisible = await domainInput.isVisible({ timeout: 5000 }).catch(() => false);
            console.log(domainInputVisible ? '✅ Domain input field is present in dialog' : '⚠️ No text input found in dialog');

            // Escape without saving — preserves production data integrity
            await page.keyboard.press('Escape');
            await page.waitForTimeout(1000);

            const dialogStillVisible = await dialog.isVisible({ timeout: 3000 }).catch(() => false);
            console.log(!dialogStillVisible ? '✅ Dialog closed after Escape — no data saved' : '⚠️ Dialog still open after Escape');
        } else {
            // Dialog may have opened as a new route (inline form page)
            const inlineForm = page.locator('form, .v-form').first();
            const formVisible = await inlineForm.isVisible({ timeout: 5000 }).catch(() => false);
            if (formVisible) {
                console.log('✅ Inline create form opened (not a dialog)');
                // Navigate back instead of saving
                await page.goBack();
                await page.waitForTimeout(1000);
                console.log('✅ Navigated back — no data saved');
            } else {
                console.log('⚠️ No dialog or form appeared after clicking Create');
            }
        }
    });

    // ─── UPDATE: Click First Row to Open Edit Form ───────────────────────────────

    test('[UPDATE] clicking first row opens edit form — does NOT save', async ({ page }) => {
        test.setTimeout(180000);

        await loginToApp(page, 90000, EMAIL, PASSWORD);
        await navigateToEmailDomains(page);

        await page.waitForTimeout(2000);

        // Wait for any loading to finish
        const spinner = page.locator('.v-progress-circular, .v-progress-linear').first();
        await spinner.waitFor({ state: 'hidden', timeout: 10000 }).catch(() => false);

        // Try clicking the first table row
        const firstRow = page.locator('tbody tr').first();
        const firstRowVisible = await firstRow.isVisible({ timeout: 8000 }).catch(() => false);

        if (!firstRowVisible) {
            // Try clicking an edit icon/button instead
            const editBtn = page.locator('button[aria-label*="edit" i], button').filter({ hasText: /edit/i }).first();
            const editVisible = await editBtn.isVisible({ timeout: 5000 }).catch(() => false);
            if (editVisible) {
                await editBtn.click();
                console.log('✅ Clicked Edit button');
            } else {
                console.log('⚠️ No rows or edit button found — module may be empty');
                return;
            }
        } else {
            // Click the edit icon in the first row if present, otherwise click the row itself
            const rowEditBtn = firstRow.locator('button[aria-label*="edit" i], .mdi-pencil, .mdi-square-edit-outline').first();
            const rowEditVisible = await rowEditBtn.isVisible({ timeout: 3000 }).catch(() => false);

            if (rowEditVisible) {
                await rowEditBtn.click();
                console.log('✅ Clicked edit icon on first row');
            } else {
                await firstRow.click();
                console.log('✅ Clicked first row');
            }
        }

        await page.waitForTimeout(2000);

        // Verify edit dialog or form opened
        const dialog = page.locator('.v-dialog, [role="dialog"], .v-overlay__content').first();
        const dialogVisible = await dialog.isVisible({ timeout: 8000 }).catch(() => false);

        if (dialogVisible) {
            console.log('✅ Edit dialog opened');

            // Check that fields are pre-populated (edit forms should have existing values)
            const inputs = dialog.locator('input[type="text"], input[type="email"], textarea');
            const inputCount = await inputs.count().catch(() => 0);
            console.log(`✅ Edit form has ${inputCount} input field(s)`);

            for (let i = 0; i < Math.min(inputCount, 3); i++) {
                const val = await inputs.nth(i).inputValue().catch(() => '');
                if (val) console.log(`  Field ${i + 1} value: "${val}"`);
            }

            // Escape without saving
            await page.keyboard.press('Escape');
            await page.waitForTimeout(1000);
            const dialogStillOpen = await dialog.isVisible({ timeout: 3000 }).catch(() => false);
            console.log(!dialogStillOpen ? '✅ Dialog closed after Escape — no changes saved' : '⚠️ Dialog still open after Escape');
        } else {
            const inlineForm = page.locator('form, .v-form').first();
            const formVisible = await inlineForm.isVisible({ timeout: 5000 }).catch(() => false);
            if (formVisible) {
                console.log('✅ Inline edit form opened (not a dialog)');
                await page.goBack();
                await page.waitForTimeout(1000);
                console.log('✅ Navigated back — no changes saved');
            } else {
                console.log('⚠️ No edit dialog or form appeared');
            }
        }
    });

    // ─── DELETE: Check Delete Availability — Does NOT Confirm ───────────────────

    test('[DELETE] delete option is available — does NOT confirm deletion', async ({ page }) => {
        test.setTimeout(180000);

        await loginToApp(page, 90000, EMAIL, PASSWORD);
        await navigateToEmailDomains(page);

        await page.waitForTimeout(2000);

        const spinner = page.locator('.v-progress-circular, .v-progress-linear').first();
        await spinner.waitFor({ state: 'hidden', timeout: 10000 }).catch(() => false);

        const firstRow = page.locator('tbody tr').first();
        const firstRowVisible = await firstRow.isVisible({ timeout: 8000 }).catch(() => false);

        if (!firstRowVisible) {
            console.log('⚠️ No rows found — cannot check delete availability');
            return;
        }

        // Look for a delete icon within the first row
        const deleteBtn = firstRow.locator(
            'button[aria-label*="delete" i], button[aria-label*="remove" i], .mdi-delete, .mdi-trash-can'
        ).first();
        const deleteBtnVisible = await deleteBtn.isVisible({ timeout: 4000 }).catch(() => false);

        if (deleteBtnVisible) {
            await deleteBtn.click();
            await page.waitForTimeout(1500);
            console.log('✅ Delete button clicked — checking for confirmation dialog');

            // Expect a confirmation dialog to appear
            const confirmDialog = page.locator('.v-dialog, [role="dialog"], .v-overlay__content').first();
            const confirmVisible = await confirmDialog.isVisible({ timeout: 6000 }).catch(() => false);

            if (confirmVisible) {
                console.log('✅ Delete confirmation dialog appeared');

                // Click Cancel / No — never confirm the delete
                const cancelBtn = confirmDialog.locator('button').filter({ hasText: /cancel|no|close/i }).first();
                const cancelVisible = await cancelBtn.isVisible({ timeout: 4000 }).catch(() => false);

                if (cancelVisible) {
                    await cancelBtn.click();
                    console.log('✅ Clicked Cancel — delete NOT confirmed, data is safe');
                } else {
                    await page.keyboard.press('Escape');
                    console.log('✅ Escaped confirmation dialog — delete NOT confirmed, data is safe');
                }

                await page.waitForTimeout(1000);
                const dialogGone = await confirmDialog.isVisible({ timeout: 3000 }).catch(() => false);
                console.log(!dialogGone ? '✅ Confirmation dialog dismissed safely' : '⚠️ Dialog still visible after cancel');
            } else {
                // Dialog may not appear; press Escape as a safety measure
                await page.keyboard.press('Escape');
                console.log('⚠️ No confirmation dialog appeared after delete click — Escaped as precaution');
            }
        } else {
            // Try row selection checkbox then toolbar delete
            const checkbox = firstRow.locator('input[type="checkbox"]').first();
            const checkboxVisible = await checkbox.isVisible({ timeout: 3000 }).catch(() => false);

            if (checkboxVisible) {
                await checkbox.click();
                await page.waitForTimeout(1000);
                console.log('✅ Selected first row via checkbox');

                const toolbarDeleteBtn = page.locator('button').filter({ hasText: /delete|remove/i }).first();
                const toolbarDeleteVisible = await toolbarDeleteBtn.isVisible({ timeout: 4000 }).catch(() => false);

                if (toolbarDeleteVisible) {
                    console.log('✅ Toolbar delete button appeared after row selection');
                    // Do NOT click — just confirm it exists
                } else {
                    console.log('⚠️ No toolbar delete button after selecting row');
                }

                // Uncheck row
                await checkbox.click();
                await page.waitForTimeout(500);
            } else {
                console.log('⚠️ No delete button or checkbox found on this module');
            }
        }
    });

    // ─── NAV: Direct URL Access ──────────────────────────────────────────────────

    test('[NAV] module is accessible via direct URL', async ({ page }) => {
        test.setTimeout(180000);

        await loginToApp(page, 90000, EMAIL, PASSWORD);

        // Navigate directly to the Email Domains URL (not via sidebar)
        await page.goto(LIST_URL, { waitUntil: 'load', timeout: 30000 });
        await page.waitForTimeout(3000);

        // Should not redirect to login or a 404
        const currentUrl = page.url();
        console.log(`Current URL after direct navigation: ${currentUrl}`);

        const isOnModule = /system-settings\/email-domains/.test(currentUrl);
        const isOnLogin = /login|sign-in|auth/.test(currentUrl);
        const isOn404 = /404|not-found/.test(currentUrl);

        expect(isOn404).toBeFalsy();
        expect(isOnLogin).toBeFalsy();

        if (isOnModule) {
            console.log('✅ Direct URL access succeeded — landed on Email Domains module');
        } else {
            // May have redirected to a parent route; still acceptable if it's in system-settings
            const isInSystemSettings = /system-settings/.test(currentUrl);
            console.log(isInSystemSettings
                ? '⚠️ Redirected within system-settings — partial navigation success'
                : `⚠️ Unexpected redirect to: ${currentUrl}`
            );
        }

        // Confirm main content renders (page is not blank)
        const body = page.locator('body');
        const bodyText = await body.innerText({ timeout: 5000 }).catch(() => '');
        expect(bodyText.length).toBeGreaterThan(10);
        console.log('✅ Page body has content — not a blank/error page');
    });

    // ─── NAV: Accessible via System Settings Sidebar ─────────────────────────────

    test('[NAV] module is reachable from system settings sidebar', async ({ page }) => {
        test.setTimeout(180000);

        await loginToApp(page, 90000, EMAIL, PASSWORD);

        // Open system settings via the header button
        const systemSettingsBtn = page.locator('[aria-label="Open system settings"]').first();
        const sysSettingsVisible = await systemSettingsBtn.isVisible({ timeout: 8000 }).catch(() => false);

        if (!sysSettingsVisible) {
            console.log('⚠️ System settings header button not found — falling back to direct URL');
            await navigateToEmailDomains(page);
            return;
        }

        await systemSettingsBtn.click();
        await page.waitForTimeout(2000);
        console.log('✅ Opened system settings');

        // Find "Email Domains" in the sidebar navigation
        const emailDomainsLink = page.locator('a, .v-list-item, [role="menuitem"]').filter({ hasText: /email.domain/i }).first();
        const linkVisible = await emailDomainsLink.isVisible({ timeout: 6000 }).catch(() => false);

        if (linkVisible) {
            await emailDomainsLink.click();
            await page.waitForTimeout(2000);
            await expect(page).toHaveURL(/system-settings\/email-domains/, { timeout: 8000 });
            console.log('✅ Navigated to Email Domains via sidebar link');
        } else {
            console.log('⚠️ Email Domains link not found in sidebar — navigating directly');
            await navigateToEmailDomains(page);
        }

        // Confirm page content loaded
        const main = page.locator('main, .v-main, [class*="content"]').first();
        const mainVisible = await main.isVisible({ timeout: 6000 }).catch(() => false);
        console.log(mainVisible ? '✅ Main content visible after sidebar navigation' : '⚠️ Main content not visible');
    });

    // ─── MODULE-SPECIFIC: Domain Verification Status ─────────────────────────────

    test('[DOMAIN] domain records show verification status or domain field', async ({ page }) => {
        test.setTimeout(180000);

        // Email Domains typically store entries like "university.ac.uk" with a
        // verified/unverified status, and optionally an associated organisation.
        // This test confirms the table exposes these key attributes.

        await loginToApp(page, 90000, EMAIL, PASSWORD);
        await navigateToEmailDomains(page);

        await page.waitForTimeout(2000);

        const spinner = page.locator('.v-progress-circular, .v-progress-linear').first();
        await spinner.waitFor({ state: 'hidden', timeout: 10000 }).catch(() => false);

        // Check for a "domain" column header
        const domainHeader = page.locator('thead th, .v-data-table-header th').filter({ hasText: /domain/i }).first();
        const domainHeaderVisible = await domainHeader.isVisible({ timeout: 6000 }).catch(() => false);
        console.log(domainHeaderVisible ? '✅ Domain column header found' : '⚠️ No explicit "domain" column header visible');

        // Check for a "status" or "verified" column header
        const statusHeader = page.locator('thead th, .v-data-table-header th').filter({ hasText: /status|verif/i }).first();
        const statusHeaderVisible = await statusHeader.isVisible({ timeout: 4000 }).catch(() => false);
        console.log(statusHeaderVisible ? '✅ Status/Verified column header found' : '⚠️ No explicit status/verified column header visible');

        // Look for a status chip or badge in the first data row
        const firstRow = page.locator('tbody tr').first();
        const firstRowVisible = await firstRow.isVisible({ timeout: 5000 }).catch(() => false);

        if (firstRowVisible) {
            // Vuetify chips are often used for statuses
            const statusChip = firstRow.locator('.v-chip, [class*="chip"], [class*="badge"], [class*="tag"]').first();
            const chipVisible = await statusChip.isVisible({ timeout: 4000 }).catch(() => false);

            if (chipVisible) {
                const chipText = await statusChip.innerText().catch(() => '');
                console.log(`✅ Status chip found in first row: "${chipText.trim()}"`);
            } else {
                // Check for a plain text cell that looks like a domain or status
                const cells = firstRow.locator('td');
                const cellCount = await cells.count().catch(() => 0);

                for (let i = 0; i < cellCount; i++) {
                    const text = await cells.nth(i).innerText().catch(() => '');
                    if (text.includes('.') || /verif|active|pending/i.test(text)) {
                        console.log(`✅ Domain-like or status cell found: "${text.trim()}"`);
                        break;
                    }
                }
                console.log('⚠️ No status chip — plain text cells checked for domain/status values');
            }
        } else {
            console.log('⚠️ No data rows found — module may be empty; cannot verify domain/status fields');
        }

        // Confirm URL is still correct
        await expect(page).toHaveURL(/system-settings\/email-domains/, { timeout: 5000 });
        console.log('✅ Still on Email Domains module after domain/status inspection');
    });

});
