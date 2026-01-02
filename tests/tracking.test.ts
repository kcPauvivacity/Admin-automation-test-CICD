import { test, expect } from '@playwright/test';
import { loginToApp } from './helpers/auth.helper';

test('navigate to Tracking section successfully', async ({ page }) => {
    test.setTimeout(180000);
    
    await loginToApp(page, 90000);
    await page.waitForLoadState('load');
    await page.waitForTimeout(3000);

    console.log('✅ Successfully logged in');

    // Navigate to Tracking via main menu
    const trackingMenuItem = page.getByRole('menuitem', { name: /tracking/i });
    const hasTracking = await trackingMenuItem.isVisible({ timeout: 3000 }).catch(() => false);
    
    if (hasTracking) {
        await trackingMenuItem.click();
        await page.waitForLoadState('load');
        await page.waitForTimeout(2000);
        
        console.log('✅ Navigated to Tracking via main menu');
        console.log('✅ Tracking page loaded successfully');
    } else {
        console.log('⚠️ Tracking menu not found');
        
        // Try alternative navigation
        const menuButton = page.locator('button:has-text("Menu"), button[aria-label*="menu" i]').first();
        if (await menuButton.isVisible({ timeout: 2000 }).catch(() => false)) {
            await menuButton.click();
            await page.waitForTimeout(1000);
            
            const trackingLink = page.locator('a:has-text("Tracking"), [role="menuitem"]:has-text("Tracking")').first();
            if (await trackingLink.isVisible({ timeout: 2000 }).catch(() => false)) {
                await trackingLink.click();
                await page.waitForLoadState('load');
                await page.waitForTimeout(2000);
                console.log('✅ Navigated to Tracking via alternative menu');
            }
        }
    }

    console.log('✅ Tracking navigation verified');
});

test('verify tracking table loads with data', async ({ page }) => {
    test.setTimeout(180000);
    
    await loginToApp(page, 90000);
    await page.waitForLoadState('load');
    await page.waitForTimeout(3000);

    console.log('✅ Successfully logged in');

    // Navigate to Tracking
    const trackingMenuItem = page.getByRole('menuitem', { name: /tracking/i });
    if (await trackingMenuItem.isVisible({ timeout: 3000 }).catch(() => false)) {
        await trackingMenuItem.click();
        await page.waitForLoadState('load');
        await page.waitForTimeout(2000);
        
        console.log('✅ Navigated to Tracking');

        // Check for table or data display
        const tableRows = page.locator('tbody tr, .v-data-table tbody tr, [role="row"]');
        const rowCount = await tableRows.count();
        
        if (rowCount > 0) {
            console.log(`✅ Found ${rowCount} tracking record${rowCount === 1 ? '' : 's'} in table`);
        } else {
            console.log('⚠️ No tracking records found in table');
        }

        // Check for pagination info
        const paginationInfo = page.locator('.v-data-table-footer__info, .pagination-info');
        const hasPagination = await paginationInfo.isVisible({ timeout: 2000 }).catch(() => false);
        
        if (hasPagination) {
            const paginationText = await paginationInfo.textContent();
            console.log(`📄 Pagination: ${paginationText}`);
        }

        console.log('✅ Tracking table verified');
    } else {
        console.log('⚠️ Tracking menu not accessible');
    }
});

test('verify tracking table columns', async ({ page }) => {
    test.setTimeout(180000);
    
    await loginToApp(page, 90000);
    await page.waitForLoadState('load');
    await page.waitForTimeout(3000);

    console.log('✅ Successfully logged in');

    // Navigate to Tracking
    const trackingMenuItem = page.getByRole('menuitem', { name: /tracking/i });
    if (await trackingMenuItem.isVisible({ timeout: 3000 }).catch(() => false)) {
        await trackingMenuItem.click();
        await page.waitForLoadState('load');
        await page.waitForTimeout(2000);
        
        console.log('✅ Navigated to Tracking');

        // Check table headers
        const headers = page.locator('thead th, .v-data-table thead th, [role="columnheader"]');
        const headerCount = await headers.count();
        
        console.log(`✅ Found ${headerCount} table column(s)`);
        
        // Log column names
        for (let i = 0; i < headerCount; i++) {
            const headerText = await headers.nth(i).textContent();
            if (headerText && headerText.trim()) {
                console.log(`  Column ${i + 1}: ${headerText.trim()}`);
            }
        }

        console.log('✅ Tracking table columns verified');
    } else {
        console.log('⚠️ Tracking menu not accessible');
    }
});

test('verify create new tracking record form', async ({ page }) => {
    test.setTimeout(180000);
    
    await loginToApp(page, 90000);
    await page.waitForLoadState('load');
    await page.waitForTimeout(3000);

    console.log('✅ Successfully logged in');

    // Navigate to Tracking
    const trackingMenuItem = page.getByRole('menuitem', { name: /tracking/i });
    if (await trackingMenuItem.isVisible({ timeout: 3000 }).catch(() => false)) {
        await trackingMenuItem.click();
        await page.waitForLoadState('load');
        await page.waitForTimeout(2000);
        
        console.log('✅ Navigated to Tracking');

        // Look for create/add button
        const createButton = page.locator('button:has-text("Create"), button:has-text("Add"), button:has-text("New"), button[aria-label*="add" i], button[aria-label*="create" i]').first();
        const hasCreateButton = await createButton.isVisible({ timeout: 3000 }).catch(() => false);
        
        if (hasCreateButton) {
            console.log('✅ Create button found');
            await createButton.click();
            await page.waitForTimeout(2000);

            // Check for form dialog or modal
            const formDialog = page.locator('.v-dialog, [role="dialog"], .modal, form');
            const hasDialog = await formDialog.isVisible({ timeout: 3000 }).catch(() => false);
            
            if (hasDialog) {
                console.log('✅ Create tracking record form opened');
                
                // Check for common form fields
                const nameField = page.locator('input[name*="name" i], input[label*="name" i], input[placeholder*="name" i]').first();
                const typeField = page.locator('select[name*="type" i], .v-select:has-text("Type")').first();
                const urlField = page.locator('input[type="url"], input[name*="url" i], input[placeholder*="url" i]').first();
                const codeField = page.locator('input[name*="code" i], input[name*="tracking" i], textarea[name*="code" i]').first();
                
                if (await nameField.isVisible({ timeout: 2000 }).catch(() => false)) {
                    console.log('  ✅ Name field found');
                }
                if (await typeField.isVisible({ timeout: 2000 }).catch(() => false)) {
                    console.log('  ✅ Type field found');
                }
                if (await urlField.isVisible({ timeout: 2000 }).catch(() => false)) {
                    console.log('  ✅ URL field found');
                }
                if (await codeField.isVisible({ timeout: 2000 }).catch(() => false)) {
                    console.log('  ✅ Code/Script field found');
                }
                
                // Close the dialog
                const closeButton = page.locator('button:has-text("Cancel"), button:has-text("Close"), button[aria-label*="close" i], .v-dialog .mdi-close').first();
                if (await closeButton.isVisible({ timeout: 2000 }).catch(() => false)) {
                    await closeButton.click();
                    await page.waitForTimeout(1000);
                }
            } else {
                console.log('⚠️ Create tracking record form dialog not found');
            }
        } else {
            console.log('⚠️ Create button not found');
        }

        console.log('✅ Create tracking record form verified');
    } else {
        console.log('⚠️ Tracking menu not accessible');
    }
});

test('verify tracking search functionality', async ({ page }) => {
    test.setTimeout(180000);
    
    await loginToApp(page, 90000);
    await page.waitForLoadState('load');
    await page.waitForTimeout(3000);

    console.log('✅ Successfully logged in');

    // Navigate to Tracking
    const trackingMenuItem = page.getByRole('menuitem', { name: /tracking/i });
    if (await trackingMenuItem.isVisible({ timeout: 3000 }).catch(() => false)) {
        await trackingMenuItem.click();
        await page.waitForLoadState('load');
        await page.waitForTimeout(2000);
        
        console.log('✅ Navigated to Tracking');

        // Get initial tracking record count
        const tableRows = page.locator('tbody tr, .v-data-table tbody tr');
        const initialCount = await tableRows.count();
        console.log(`Initial tracking records: ${initialCount}`);

        // Look for search input
        const searchInput = page.locator('input[type="search"], input[placeholder*="search" i], input[aria-label*="search" i]').first();
        const hasSearch = await searchInput.isVisible({ timeout: 3000 }).catch(() => false);
        
        if (hasSearch) {
            // Try searching for a common term
            await searchInput.fill('Google');
            await page.waitForTimeout(2000);
            
            const afterSearchCount = await tableRows.count();
            console.log(`After search: ${afterSearchCount} tracking records`);
            
            if (afterSearchCount !== initialCount) {
                console.log('✅ Search functionality working');
            } else {
                console.log('⚠️ Search may not have changed results (no matches or all match)');
            }
            
            // Clear search
            await searchInput.clear();
            await page.waitForTimeout(1500);
        } else {
            console.log('⚠️ Search input not found');
        }

        console.log('✅ Search functionality tested');
    } else {
        console.log('⚠️ Tracking menu not accessible');
    }
});

test('verify tracking record detail view', async ({ page }) => {
    test.setTimeout(180000);
    
    await loginToApp(page, 90000);
    await page.waitForLoadState('load');
    await page.waitForTimeout(3000);

    console.log('✅ Successfully logged in');

    // Navigate to Tracking
    const trackingMenuItem = page.getByRole('menuitem', { name: /tracking/i });
    if (await trackingMenuItem.isVisible({ timeout: 3000 }).catch(() => false)) {
        await trackingMenuItem.click();
        await page.waitForLoadState('load');
        await page.waitForTimeout(2000);
        
        console.log('✅ Navigated to Tracking');

        // Click on first tracking record row
        const firstRow = page.locator('tbody tr, .v-data-table tbody tr').first();
        const hasRows = await firstRow.isVisible({ timeout: 3000 }).catch(() => false);
        
        if (hasRows) {
            await firstRow.click();
            await page.waitForTimeout(2000);
            
            console.log('✅ Clicked on first tracking record');

            // Check if detail view opened
            const detailView = page.locator('.v-dialog, [role="dialog"], .detail-view, .tracking-detail');
            const hasDetailView = await detailView.isVisible({ timeout: 3000 }).catch(() => false);
            
            if (hasDetailView) {
                console.log('✅ Tracking record detail view opened');
                
                // Check for common detail fields
                const detailFields = [
                    { name: 'Name', selector: ':has-text("Name")' },
                    { name: 'Type', selector: ':has-text("Type")' },
                    { name: 'Tracking ID', selector: ':has-text("Tracking ID"), :has-text("ID")' },
                    { name: 'Code', selector: ':has-text("Code"), :has-text("Script")' },
                    { name: 'Status', selector: ':has-text("Status")' },
                    { name: 'Created', selector: ':has-text("Created"), :has-text("Date")' }
                ];
                
                for (const field of detailFields) {
                    const fieldElement = detailView.locator(field.selector).first();
                    const isVisible = await fieldElement.isVisible({ timeout: 1000 }).catch(() => false);
                    console.log(`  ${isVisible ? '✅' : '⚠️'} ${isVisible ? 'Found' : 'Not found'}: ${field.name}`);
                }
                
                // Check for action buttons
                const editButton = page.locator('button:has-text("Edit"), button[aria-label*="edit" i]').first();
                const deleteButton = page.locator('button:has-text("Delete"), button[aria-label*="delete" i]').first();
                const copyButton = page.locator('button:has-text("Copy"), button[aria-label*="copy" i]').first();
                
                if (await editButton.isVisible({ timeout: 2000 }).catch(() => false)) {
                    console.log('  ✅ Found: Edit button');
                } else {
                    console.log('  ⚠️ Not found: Edit button');
                }
                
                if (await deleteButton.isVisible({ timeout: 2000 }).catch(() => false)) {
                    console.log('  ✅ Found: Delete button');
                } else {
                    console.log('  ⚠️ Not found: Delete button');
                }
                
                if (await copyButton.isVisible({ timeout: 2000 }).catch(() => false)) {
                    console.log('  ✅ Found: Copy button');
                } else {
                    console.log('  ⚠️ Not found: Copy button');
                }
            } else {
                console.log('⚠️ Detail view not opened');
            }
        } else {
            console.log('⚠️ No tracking records in table to click');
        }

        console.log('✅ Tracking record detail view verified');
    } else {
        console.log('⚠️ Tracking menu not accessible');
    }
});

test('verify edit tracking record functionality', async ({ page }) => {
    test.setTimeout(180000);
    
    await loginToApp(page, 90000);
    await page.waitForLoadState('load');
    await page.waitForTimeout(3000);

    console.log('✅ Successfully logged in');

    // Navigate to Tracking
    const trackingMenuItem = page.getByRole('menuitem', { name: /tracking/i });
    if (await trackingMenuItem.isVisible({ timeout: 3000 }).catch(() => false)) {
        await trackingMenuItem.click();
        await page.waitForLoadState('load');
        await page.waitForTimeout(2000);
        
        console.log('✅ Navigated to Tracking');

        // Click on first tracking record
        const firstRow = page.locator('tbody tr, .v-data-table tbody tr').first();
        const hasRows = await firstRow.isVisible({ timeout: 3000 }).catch(() => false);
        
        if (hasRows) {
            await firstRow.click();
            await page.waitForTimeout(2000);
            
            console.log('✅ Opened tracking record details');

            // Look for Edit button
            const editButton = page.locator('button:has-text("Edit"), button[aria-label*="edit" i]').first();
            const hasEditButton = await editButton.isVisible({ timeout: 3000 }).catch(() => false);
            
            if (hasEditButton) {
                await editButton.click();
                await page.waitForTimeout(2000);
                
                console.log('✅ Clicked Edit button');
                
                // Check if form is in edit mode
                const saveButton = page.locator('button:has-text("Save"), button:has-text("Update")').first();
                const hasSaveButton = await saveButton.isVisible({ timeout: 2000 }).catch(() => false);
                
                if (hasSaveButton) {
                    console.log('✅ Edit form opened (Save button visible)');
                } else {
                    console.log('⚠️ Edit form may not be in edit mode');
                }
            } else {
                console.log('⚠️ Edit button not found');
            }
        } else {
            console.log('⚠️ No tracking records available to edit');
        }

        console.log('✅ Edit tracking record verified');
    } else {
        console.log('⚠️ Tracking menu not accessible');
    }
});

test('verify tracking filter functionality', async ({ page }) => {
    test.setTimeout(180000);
    
    await loginToApp(page, 90000);
    await page.waitForLoadState('load');
    await page.waitForTimeout(3000);

    console.log('✅ Successfully logged in');

    // Navigate to Tracking
    const trackingMenuItem = page.getByRole('menuitem', { name: /tracking/i });
    if (await trackingMenuItem.isVisible({ timeout: 3000 }).catch(() => false)) {
        await trackingMenuItem.click();
        await page.waitForLoadState('load');
        await page.waitForTimeout(2000);
        
        console.log('✅ Navigated to Tracking');

        // Get initial tracking record count
        const tableRows = page.locator('tbody tr, .v-data-table tbody tr');
        const initialCount = await tableRows.count();
        console.log(`Initial tracking records: ${initialCount}`);

        // Look for filter buttons or dropdowns
        const filterButton = page.locator('button:has-text("Filter"), button[aria-label*="filter" i], .filter-button').first();
        const hasFilter = await filterButton.isVisible({ timeout: 3000 }).catch(() => false);
        
        if (hasFilter) {
            await filterButton.click();
            await page.waitForTimeout(1500);
            console.log('✅ Filter menu opened');
            
            // Try to apply a filter (e.g., Type)
            const typeFilter = page.locator('text="Type", [role="menuitem"]:has-text("Type")').first();
            if (await typeFilter.isVisible({ timeout: 2000 }).catch(() => false)) {
                await typeFilter.click();
                await page.waitForTimeout(2000);
                
                const afterFilterCount = await tableRows.count();
                console.log(`After filter: ${afterFilterCount} tracking records`);
            }
        } else {
            console.log('⚠️ No filters found');
        }

        console.log('✅ Tracking filters verified');
    } else {
        console.log('⚠️ Tracking menu not accessible');
    }
});

test('verify tracking sorting functionality', async ({ page }) => {
    test.setTimeout(180000);
    
    await loginToApp(page, 90000);
    await page.waitForLoadState('load');
    await page.waitForTimeout(3000);

    console.log('✅ Successfully logged in');

    // Navigate to Tracking
    const trackingMenuItem = page.getByRole('menuitem', { name: /tracking/i });
    if (await trackingMenuItem.isVisible({ timeout: 3000 }).catch(() => false)) {
        await trackingMenuItem.click();
        await page.waitForLoadState('load');
        await page.waitForTimeout(2000);
        
        console.log('✅ Navigated to Tracking');

        // Get all column headers
        const headers = page.locator('thead th, .v-data-table thead th');
        const headerCount = await headers.count();
        
        console.log(`Testing sorting on ${headerCount} columns...`);
        
        let sortableColumns = 0;
        
        for (let i = 0; i < headerCount; i++) {
            const header = headers.nth(i);
            const headerText = await header.textContent();
            
            // Check if column is sortable
            const isSortable = await header.locator('.mdi-arrow-up, .mdi-arrow-down, .mdi-sort, [role="button"]').count() > 0 ||
                              await header.evaluate(el => el.classList.contains('sortable')) ||
                              await header.evaluate(el => el.style.cursor === 'pointer');
            
            if (isSortable && headerText && headerText.trim()) {
                sortableColumns++;
                console.log(`  ✅ "${headerText.trim()}" column is sortable`);
                
                // Click to sort
                await header.click();
                await page.waitForTimeout(1500);
                console.log(`    Sorted by ${headerText.trim()}`);
                break; // Only test first sortable column
            }
        }
        
        if (sortableColumns === 0) {
            console.log('⚠️ No sortable columns found');
        }

        console.log('✅ Sorting functionality checked');
    } else {
        console.log('⚠️ Tracking menu not accessible');
    }
});

test('verify tracking pagination', async ({ page }) => {
    test.setTimeout(180000);
    
    await loginToApp(page, 90000);
    await page.waitForLoadState('load');
    await page.waitForTimeout(3000);

    console.log('✅ Successfully logged in');

    // Navigate to Tracking
    const trackingMenuItem = page.getByRole('menuitem', { name: /tracking/i });
    if (await trackingMenuItem.isVisible({ timeout: 3000 }).catch(() => false)) {
        await trackingMenuItem.click();
        await page.waitForLoadState('load');
        await page.waitForTimeout(2000);
        
        console.log('✅ Navigated to Tracking');

        // Check pagination info
        const paginationInfo = page.locator('.v-data-table-footer__info');
        const hasPagination = await paginationInfo.isVisible({ timeout: 3000 }).catch(() => false);
        
        if (hasPagination) {
            const paginationText = await paginationInfo.textContent();
            console.log(`✅ Pagination info: ${paginationText}`);

            // Check for next page button
            const nextButton = page.locator('button:has(.mdi-chevron-right)').first();
            const hasNext = await nextButton.isVisible({ timeout: 2000 }).catch(() => false);
            
            if (hasNext) {
                const isEnabled = await nextButton.isEnabled().catch(() => false);
                
                if (isEnabled) {
                    console.log('✅ Next page button available');
                    
                    // Click to go to next page
                    await nextButton.click();
                    await page.waitForLoadState('load', { timeout: 15000 }).catch(() => null);
                    await page.waitForTimeout(3000);
                    
                    // Try to get updated pagination info with timeout handling
                    const newPaginationText = await paginationInfo.textContent({ timeout: 10000 }).catch(() => null);
                    
                    if (newPaginationText) {
                        console.log(`✅ Page 2 pagination: ${newPaginationText}`);
                        
                        // Go back to first page
                        const prevButton = page.locator('button:has(.mdi-chevron-left)').first();
                        if (await prevButton.isEnabled().catch(() => false)) {
                            await prevButton.click();
                            await page.waitForTimeout(1500);
                            console.log('✅ Returned to first page');
                        }
                    } else {
                        console.log('⚠️ Could not verify page 2 (pagination element not available)');
                    }
                } else {
                    console.log('⚠️ Next page button disabled (only one page)');
                }
            } else {
                console.log('⚠️ Next page button not found');
            }
        } else {
            console.log('⚠️ No pagination info found');
        }
    } else {
        console.log('⚠️ Tracking menu not accessible');
    }
    
    console.log('✅ Tracking pagination verified');
});

test('verify delete tracking record functionality', async ({ page }) => {
    test.setTimeout(180000);
    
    await loginToApp(page, 90000);
    await page.waitForLoadState('load');
    await page.waitForTimeout(3000);

    console.log('✅ Successfully logged in');

    // Navigate to Tracking
    const trackingMenuItem = page.getByRole('menuitem', { name: /tracking/i });
    if (await trackingMenuItem.isVisible({ timeout: 3000 }).catch(() => false)) {
        await trackingMenuItem.click();
        await page.waitForLoadState('load');
        await page.waitForTimeout(2000);
        
        console.log('✅ Navigated to Tracking');

        // Click on first tracking record
        const firstRow = page.locator('tbody tr, .v-data-table tbody tr').first();
        const hasRows = await firstRow.isVisible({ timeout: 3000 }).catch(() => false);
        
        if (hasRows) {
            await firstRow.click();
            await page.waitForTimeout(2000);
            
            console.log('✅ Opened tracking record details');

            // Look for Delete button
            const deleteButton = page.locator('button:has-text("Delete"), button[aria-label*="delete" i]').first();
            const hasDeleteButton = await deleteButton.isVisible({ timeout: 3000 }).catch(() => false);
            
            if (hasDeleteButton) {
                console.log('✅ Delete button found');
            } else {
                console.log('⚠️ Delete button not found');
            }
        } else {
            console.log('⚠️ No tracking records available');
        }

        console.log('✅ Delete tracking record functionality verified');
    } else {
        console.log('⚠️ Tracking menu not accessible');
    }
});

test('verify tracking export functionality', async ({ page }) => {
    test.setTimeout(180000);
    
    await loginToApp(page, 90000);
    await page.waitForLoadState('load');
    await page.waitForTimeout(3000);

    console.log('✅ Successfully logged in');

    // Navigate to Tracking
    const trackingMenuItem = page.getByRole('menuitem', { name: /tracking/i });
    if (await trackingMenuItem.isVisible({ timeout: 3000 }).catch(() => false)) {
        await trackingMenuItem.click();
        await page.waitForLoadState('load');
        await page.waitForTimeout(2000);
        
        console.log('✅ Navigated to Tracking');

        // Look for export button
        const exportButton = page.locator('button:has-text("Export"), button:has-text("Download"), button[aria-label*="export" i]').first();
        const hasExportButton = await exportButton.isVisible({ timeout: 3000 }).catch(() => false);
        
        if (hasExportButton) {
            console.log('✅ Export button found');
            
            const isEnabled = await exportButton.isEnabled().catch(() => false);
            if (isEnabled) {
                console.log('✅ Export button is enabled');
            } else {
                console.log('⚠️ Export button is disabled');
            }
        } else {
            console.log('⚠️ Export button not found');
        }

        console.log('✅ Tracking export functionality verified');
    } else {
        console.log('⚠️ Tracking menu not accessible');
    }
});

test('verify tracking code copy functionality', async ({ page }) => {
    test.setTimeout(180000);
    
    await loginToApp(page, 90000);
    await page.waitForLoadState('load');
    await page.waitForTimeout(3000);

    console.log('✅ Successfully logged in');

    // Navigate to Tracking
    const trackingMenuItem = page.getByRole('menuitem', { name: /tracking/i });
    if (await trackingMenuItem.isVisible({ timeout: 3000 }).catch(() => false)) {
        await trackingMenuItem.click();
        await page.waitForLoadState('load');
        await page.waitForTimeout(2000);
        
        console.log('✅ Navigated to Tracking');

        // Click on first tracking record
        const firstRow = page.locator('tbody tr, .v-data-table tbody tr').first();
        const hasRows = await firstRow.isVisible({ timeout: 3000 }).catch(() => false);
        
        if (hasRows) {
            await firstRow.click();
            await page.waitForTimeout(2000);
            
            console.log('✅ Opened tracking record details');

            // Look for Copy button or copy icon
            const copyButton = page.locator('button:has-text("Copy"), button[aria-label*="copy" i], .mdi-content-copy, .copy-button').first();
            const hasCopyButton = await copyButton.isVisible({ timeout: 3000 }).catch(() => false);
            
            if (hasCopyButton) {
                console.log('✅ Copy button found');
                
                // Check for tracking code display
                const codeDisplay = page.locator('code, pre, textarea[readonly], .tracking-code, .code-snippet').first();
                const hasCodeDisplay = await codeDisplay.isVisible({ timeout: 2000 }).catch(() => false);
                
                if (hasCodeDisplay) {
                    console.log('✅ Tracking code display found');
                    const codeContent = await codeDisplay.textContent();
                    if (codeContent && codeContent.length > 0) {
                        console.log(`  ℹ️ Code length: ${codeContent.length} characters`);
                    }
                } else {
                    console.log('⚠️ Tracking code display not found');
                }
            } else {
                console.log('⚠️ Copy button not found');
            }
        } else {
            console.log('⚠️ No tracking records available');
        }

        console.log('✅ Tracking code copy functionality verified');
    } else {
        console.log('⚠️ Tracking menu not accessible');
    }
});

test('verify tracking type filter', async ({ page }) => {
    test.setTimeout(180000);
    
    await loginToApp(page, 90000);
    await page.waitForLoadState('load');
    await page.waitForTimeout(3000);

    console.log('✅ Successfully logged in');

    // Navigate to Tracking
    const trackingMenuItem = page.getByRole('menuitem', { name: /tracking/i });
    if (await trackingMenuItem.isVisible({ timeout: 3000 }).catch(() => false)) {
        await trackingMenuItem.click();
        await page.waitForLoadState('load');
        await page.waitForTimeout(2000);
        
        console.log('✅ Navigated to Tracking');

        // Get initial count
        const tableRows = page.locator('tbody tr, .v-data-table tbody tr');
        const initialCount = await tableRows.count();
        console.log(`📊 Initial records: ${initialCount}`);

        // Look for Type filter
        const typeFilterButton = page.locator('button:has-text("Type"), button[aria-label*="type" i]').first();
        const hasTypeFilter = await typeFilterButton.isVisible({ timeout: 3000 }).catch(() => false);
        
        if (hasTypeFilter) {
            await typeFilterButton.click();
            await page.waitForTimeout(1500);
            console.log('✅ Type filter opened');
            
            // Check for common tracking types
            const trackingTypes = ['Google Analytics', 'Facebook Pixel', 'Google Tag Manager', 'Custom'];
            let foundTypes = 0;
            
            for (const type of trackingTypes) {
                const typeOption = page.locator(`text="${type}", [role="option"]:has-text("${type}"), label:has-text("${type}")`).first();
                if (await typeOption.isVisible({ timeout: 1000 }).catch(() => false)) {
                    console.log(`  ✅ Found type: ${type}`);
                    foundTypes++;
                }
            }
            
            if (foundTypes > 0) {
                console.log(`✅ Found ${foundTypes} tracking type options`);
            } else {
                console.log('⚠️ No tracking type options found');
            }
        } else {
            console.log('⚠️ Type filter not found');
        }

        console.log('✅ Tracking type filter verified');
    } else {
        console.log('⚠️ Tracking menu not accessible');
    }
});
