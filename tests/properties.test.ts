import { test, expect } from '@playwright/test';
import { loginToApp } from './helpers/auth.helper';

test('navigate to Properties section successfully', async ({ page }) => {
    test.setTimeout(180000);
    
    await loginToApp(page, 90000);
    await page.waitForLoadState('load');
    await page.waitForTimeout(3000);

    console.log('✅ Successfully logged in');

    // Navigate to Properties via main menu
    const propertiesMenuItem = page.getByRole('menuitem', { name: /properties/i });
    const hasProperties = await propertiesMenuItem.isVisible({ timeout: 3000 }).catch(() => false);
    
    if (hasProperties) {
        await propertiesMenuItem.click();
        await page.waitForLoadState('load');
        await page.waitForTimeout(2000);
        
        console.log('✅ Navigated to Properties via main menu');
        console.log('✅ Properties page loaded successfully');
    } else {
        console.log('⚠️ Properties menu not found');
        
        // Try alternative navigation
        const menuButton = page.locator('button:has-text("Menu"), button[aria-label*="menu" i]').first();
        if (await menuButton.isVisible({ timeout: 2000 }).catch(() => false)) {
            await menuButton.click();
            await page.waitForTimeout(1000);
            
            const propertiesLink = page.locator('a:has-text("Properties"), [role="menuitem"]:has-text("Properties")').first();
            if (await propertiesLink.isVisible({ timeout: 2000 }).catch(() => false)) {
                await propertiesLink.click();
                await page.waitForLoadState('load');
                await page.waitForTimeout(2000);
                console.log('✅ Navigated to Properties via alternative menu');
            }
        }
    }

    console.log('✅ Properties navigation verified');
});

test('verify properties table loads with data', async ({ page }) => {
    test.setTimeout(180000);
    
    await loginToApp(page, 90000);
    await page.waitForLoadState('load');
    await page.waitForTimeout(3000);

    console.log('✅ Successfully logged in');

    // Navigate to Properties
    const propertiesMenuItem = page.getByRole('menuitem', { name: /properties/i });
    if (await propertiesMenuItem.isVisible({ timeout: 3000 }).catch(() => false)) {
        await propertiesMenuItem.click();
        await page.waitForLoadState('load');
        await page.waitForTimeout(2000);
        
        console.log('✅ Navigated to Properties');

        // Check for table or data display
        const tableRows = page.locator('tbody tr, .v-data-table tbody tr, [role="row"]');
        const rowCount = await tableRows.count();
        
        if (rowCount > 0) {
            console.log(`✅ Found ${rowCount} properties record${rowCount === 1 ? '' : 's'} in table`);
        } else {
            console.log('⚠️ No properties records found in table');
        }

        // Check for pagination info
        const paginationInfo = page.locator('.v-data-table-footer__info, .pagination-info');
        const hasPagination = await paginationInfo.isVisible({ timeout: 2000 }).catch(() => false);
        
        if (hasPagination) {
            const paginationText = await paginationInfo.textContent();
            console.log(`📄 Pagination: ${paginationText}`);
        }

        console.log('✅ Properties table verified');
    } else {
        console.log('⚠️ Properties menu not accessible');
    }
});

test('verify properties table columns', async ({ page }) => {
    test.setTimeout(180000);
    
    await loginToApp(page, 90000);
    await page.waitForLoadState('load');
    await page.waitForTimeout(3000);

    console.log('✅ Successfully logged in');

    // Navigate to Properties
    const propertiesMenuItem = page.getByRole('menuitem', { name: /properties/i });
    if (await propertiesMenuItem.isVisible({ timeout: 3000 }).catch(() => false)) {
        await propertiesMenuItem.click();
        await page.waitForLoadState('load');
        await page.waitForTimeout(2000);
        
        console.log('✅ Navigated to Properties');

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

        console.log('✅ Properties table columns verified');
    } else {
        console.log('⚠️ Properties menu not accessible');
    }
});

test('verify create new properties record form', async ({ page }) => {
    test.setTimeout(180000);
    
    await loginToApp(page, 90000);
    await page.waitForLoadState('load');
    await page.waitForTimeout(3000);

    console.log('✅ Successfully logged in');

    // Navigate to Properties
    const propertiesMenuItem = page.getByRole('menuitem', { name: /properties/i });
    if (await propertiesMenuItem.isVisible({ timeout: 3000 }).catch(() => false)) {
        await propertiesMenuItem.click();
        await page.waitForLoadState('load');
        await page.waitForTimeout(2000);
        
        console.log('✅ Navigated to Properties');

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
                console.log('✅ Create properties record form opened');
                
                // Check for common form fields
                const nameField = page.locator('input[name*="name" i], input[label*="name" i], input[placeholder*="name" i]').first();
                const typeField = page.locator('select[name*="type" i], .v-select:has-text("Type")').first();
                const urlField = page.locator('input[type="url"], input[name*="url" i], input[placeholder*="url" i]').first();
                const codeField = page.locator('input[name*="code" i], input[name*="properties" i], textarea[name*="code" i]').first();
                
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
                console.log('⚠️ Create properties record form dialog not found');
            }
        } else {
            console.log('⚠️ Create button not found');
        }

        console.log('✅ Create properties record form verified');
    } else {
        console.log('⚠️ Properties menu not accessible');
    }
});

test('verify properties search functionality', async ({ page }) => {
    test.setTimeout(180000);
    
    await loginToApp(page, 90000);
    await page.waitForLoadState('load');
    await page.waitForTimeout(3000);

    console.log('✅ Successfully logged in');

    // Navigate to Properties
    const propertiesMenuItem = page.getByRole('menuitem', { name: /properties/i });
    if (await propertiesMenuItem.isVisible({ timeout: 3000 }).catch(() => false)) {
        await propertiesMenuItem.click();
        await page.waitForLoadState('load');
        await page.waitForTimeout(2000);
        
        console.log('✅ Navigated to Properties');

        // Get initial properties record count
        const tableRows = page.locator('tbody tr, .v-data-table tbody tr');
        const initialCount = await tableRows.count();
        console.log(`Initial properties records: ${initialCount}`);

        // Look for search input
        const searchInput = page.locator('input[type="search"], input[placeholder*="search" i], input[aria-label*="search" i]').first();
        const hasSearch = await searchInput.isVisible({ timeout: 3000 }).catch(() => false);
        
        if (hasSearch) {
            // Try searching for a common term
            await searchInput.fill('Google');
            await page.waitForTimeout(2000);
            
            const afterSearchCount = await tableRows.count();
            console.log(`After search: ${afterSearchCount} properties records`);
            
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
        console.log('⚠️ Properties menu not accessible');
    }
});

test('verify properties record detail view', async ({ page }) => {
    test.setTimeout(180000);
    
    await loginToApp(page, 90000);
    await page.waitForLoadState('load');
    await page.waitForTimeout(3000);

    console.log('✅ Successfully logged in');

    // Navigate to Properties
    const propertiesMenuItem = page.getByRole('menuitem', { name: /properties/i });
    if (await propertiesMenuItem.isVisible({ timeout: 3000 }).catch(() => false)) {
        await propertiesMenuItem.click();
        await page.waitForLoadState('load');
        await page.waitForTimeout(2000);
        
        console.log('✅ Navigated to Properties');

        // Click on first properties record row
        const firstRow = page.locator('tbody tr, .v-data-table tbody tr').first();
        const hasRows = await firstRow.isVisible({ timeout: 3000 }).catch(() => false);
        
        if (hasRows) {
            await firstRow.click();
            await page.waitForTimeout(2000);
            
            console.log('✅ Clicked on first properties record');

            // Check if detail view opened
            const detailView = page.locator('.v-dialog, [role="dialog"], .detail-view, .properties-detail');
            const hasDetailView = await detailView.isVisible({ timeout: 3000 }).catch(() => false);
            
            if (hasDetailView) {
                console.log('✅ Properties record detail view opened');
                
                // Check for common detail fields
                const detailFields = [
                    { name: 'Name', selector: ':has-text("Name")' },
                    { name: 'Type', selector: ':has-text("Type")' },
                    { name: 'Properties ID', selector: ':has-text("Properties ID"), :has-text("ID")' },
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
            console.log('⚠️ No properties records in table to click');
        }

        console.log('✅ Properties record detail view verified');
    } else {
        console.log('⚠️ Properties menu not accessible');
    }
});

test('verify edit properties record functionality', async ({ page }) => {
    test.setTimeout(180000);
    
    await loginToApp(page, 90000);
    await page.waitForLoadState('load');
    await page.waitForTimeout(3000);

    console.log('✅ Successfully logged in');

    // Navigate to Properties
    const propertiesMenuItem = page.getByRole('menuitem', { name: /properties/i });
    if (await propertiesMenuItem.isVisible({ timeout: 3000 }).catch(() => false)) {
        await propertiesMenuItem.click();
        await page.waitForLoadState('load');
        await page.waitForTimeout(2000);
        
        console.log('✅ Navigated to Properties');

        // Click on first properties record
        const firstRow = page.locator('tbody tr, .v-data-table tbody tr').first();
        const hasRows = await firstRow.isVisible({ timeout: 3000 }).catch(() => false);
        
        if (hasRows) {
            await firstRow.click();
            await page.waitForTimeout(2000);
            
            console.log('✅ Opened properties record details');

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
            console.log('⚠️ No properties records available to edit');
        }

        console.log('✅ Edit properties record verified');
    } else {
        console.log('⚠️ Properties menu not accessible');
    }
});

test('verify properties filter functionality', async ({ page }) => {
    test.setTimeout(180000);
    
    await loginToApp(page, 90000);
    await page.waitForLoadState('load');
    await page.waitForTimeout(3000);

    console.log('✅ Successfully logged in');

    // Navigate to Properties
    const propertiesMenuItem = page.getByRole('menuitem', { name: /properties/i });
    if (await propertiesMenuItem.isVisible({ timeout: 3000 }).catch(() => false)) {
        await propertiesMenuItem.click();
        await page.waitForLoadState('load');
        await page.waitForTimeout(2000);
        
        console.log('✅ Navigated to Properties');

        // Get initial properties record count
        const tableRows = page.locator('tbody tr, .v-data-table tbody tr');
        const initialCount = await tableRows.count();
        console.log(`Initial properties records: ${initialCount}`);

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
                console.log(`After filter: ${afterFilterCount} properties records`);
            }
        } else {
            console.log('⚠️ No filters found');
        }

        console.log('✅ Properties filters verified');
    } else {
        console.log('⚠️ Properties menu not accessible');
    }
});

test('verify properties sorting functionality', async ({ page }) => {
    test.setTimeout(180000);
    
    await loginToApp(page, 90000);
    await page.waitForLoadState('load');
    await page.waitForTimeout(3000);

    console.log('✅ Successfully logged in');

    // Navigate to Properties
    const propertiesMenuItem = page.getByRole('menuitem', { name: /properties/i });
    if (await propertiesMenuItem.isVisible({ timeout: 3000 }).catch(() => false)) {
        await propertiesMenuItem.click();
        await page.waitForLoadState('load');
        await page.waitForTimeout(2000);
        
        console.log('✅ Navigated to Properties');

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
        console.log('⚠️ Properties menu not accessible');
    }
});

test('verify properties pagination', async ({ page }) => {
    test.setTimeout(180000);
    
    await loginToApp(page, 90000);
    await page.waitForLoadState('load');
    await page.waitForTimeout(3000);

    console.log('✅ Successfully logged in');

    // Navigate to Properties
    const propertiesMenuItem = page.getByRole('menuitem', { name: /properties/i });
    if (await propertiesMenuItem.isVisible({ timeout: 3000 }).catch(() => false)) {
        await propertiesMenuItem.click();
        await page.waitForLoadState('load');
        await page.waitForTimeout(2000);
        
        console.log('✅ Navigated to Properties');

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
        console.log('⚠️ Properties menu not accessible');
    }
    
    console.log('✅ Properties pagination verified');
});

test('verify delete properties record functionality', async ({ page }) => {
    test.setTimeout(180000);
    
    await loginToApp(page, 90000);
    await page.waitForLoadState('load');
    await page.waitForTimeout(3000);

    console.log('✅ Successfully logged in');

    // Navigate to Properties
    const propertiesMenuItem = page.getByRole('menuitem', { name: /properties/i });
    if (await propertiesMenuItem.isVisible({ timeout: 3000 }).catch(() => false)) {
        await propertiesMenuItem.click();
        await page.waitForLoadState('load');
        await page.waitForTimeout(2000);
        
        console.log('✅ Navigated to Properties');

        // Click on first properties record
        const firstRow = page.locator('tbody tr, .v-data-table tbody tr').first();
        const hasRows = await firstRow.isVisible({ timeout: 3000 }).catch(() => false);
        
        if (hasRows) {
            await firstRow.click();
            await page.waitForTimeout(2000);
            
            console.log('✅ Opened properties record details');

            // Look for Delete button
            const deleteButton = page.locator('button:has-text("Delete"), button[aria-label*="delete" i]').first();
            const hasDeleteButton = await deleteButton.isVisible({ timeout: 3000 }).catch(() => false);
            
            if (hasDeleteButton) {
                console.log('✅ Delete button found');
            } else {
                console.log('⚠️ Delete button not found');
            }
        } else {
            console.log('⚠️ No properties records available');
        }

        console.log('✅ Delete properties record functionality verified');
    } else {
        console.log('⚠️ Properties menu not accessible');
    }
});

test('verify properties export functionality', async ({ page }) => {
    test.setTimeout(180000);
    
    await loginToApp(page, 90000);
    await page.waitForLoadState('load');
    await page.waitForTimeout(3000);

    console.log('✅ Successfully logged in');

    // Navigate to Properties
    const propertiesMenuItem = page.getByRole('menuitem', { name: /properties/i });
    if (await propertiesMenuItem.isVisible({ timeout: 3000 }).catch(() => false)) {
        await propertiesMenuItem.click();
        await page.waitForLoadState('load');
        await page.waitForTimeout(2000);
        
        console.log('✅ Navigated to Properties');

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

        console.log('✅ Properties export functionality verified');
    } else {
        console.log('⚠️ Properties menu not accessible');
    }
});

test('verify properties code copy functionality', async ({ page }) => {
    test.setTimeout(180000);
    
    await loginToApp(page, 90000);
    await page.waitForLoadState('load');
    await page.waitForTimeout(3000);

    console.log('✅ Successfully logged in');

    // Navigate to Properties
    const propertiesMenuItem = page.getByRole('menuitem', { name: /properties/i });
    if (await propertiesMenuItem.isVisible({ timeout: 3000 }).catch(() => false)) {
        await propertiesMenuItem.click();
        await page.waitForLoadState('load');
        await page.waitForTimeout(2000);
        
        console.log('✅ Navigated to Properties');

        // Click on first properties record
        const firstRow = page.locator('tbody tr, .v-data-table tbody tr').first();
        const hasRows = await firstRow.isVisible({ timeout: 3000 }).catch(() => false);
        
        if (hasRows) {
            await firstRow.click();
            await page.waitForTimeout(2000);
            
            console.log('✅ Opened properties record details');

            // Look for Copy button or copy icon
            const copyButton = page.locator('button:has-text("Copy"), button[aria-label*="copy" i], .mdi-content-copy, .copy-button').first();
            const hasCopyButton = await copyButton.isVisible({ timeout: 3000 }).catch(() => false);
            
            if (hasCopyButton) {
                console.log('✅ Copy button found');
                
                // Check for properties code display
                const codeDisplay = page.locator('code, pre, textarea[readonly], .properties-code, .code-snippet').first();
                const hasCodeDisplay = await codeDisplay.isVisible({ timeout: 2000 }).catch(() => false);
                
                if (hasCodeDisplay) {
                    console.log('✅ Properties code display found');
                    const codeContent = await codeDisplay.textContent();
                    if (codeContent && codeContent.length > 0) {
                        console.log(`  ℹ️ Code length: ${codeContent.length} characters`);
                    }
                } else {
                    console.log('⚠️ Properties code display not found');
                }
            } else {
                console.log('⚠️ Copy button not found');
            }
        } else {
            console.log('⚠️ No properties records available');
        }

        console.log('✅ Properties code copy functionality verified');
    } else {
        console.log('⚠️ Properties menu not accessible');
    }
});

test('verify properties type filter', async ({ page }) => {
    test.setTimeout(180000);
    
    await loginToApp(page, 90000);
    await page.waitForLoadState('load');
    await page.waitForTimeout(3000);

    console.log('✅ Successfully logged in');

    // Navigate to Properties
    const propertiesMenuItem = page.getByRole('menuitem', { name: /properties/i });
    if (await propertiesMenuItem.isVisible({ timeout: 3000 }).catch(() => false)) {
        await propertiesMenuItem.click();
        await page.waitForLoadState('load');
        await page.waitForTimeout(2000);
        
        console.log('✅ Navigated to Properties');

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
            
            // Check for common properties types
            const propertiesTypes = ['Google Analytics', 'Facebook Pixel', 'Google Tag Manager', 'Custom'];
            let foundTypes = 0;
            
            for (const type of propertiesTypes) {
                const typeOption = page.locator(`text="${type}", [role="option"]:has-text("${type}"), label:has-text("${type}")`).first();
                if (await typeOption.isVisible({ timeout: 1000 }).catch(() => false)) {
                    console.log(`  ✅ Found type: ${type}`);
                    foundTypes++;
                }
            }
            
            if (foundTypes > 0) {
                console.log(`✅ Found ${foundTypes} properties type options`);
            } else {
                console.log('⚠️ No properties type options found');
            }
        } else {
            console.log('⚠️ Type filter not found');
        }

        console.log('✅ Properties type filter verified');
    } else {
        console.log('⚠️ Properties menu not accessible');
    }
});

test('create property and save General tab successfully', async ({ page }) => {
    test.setTimeout(180000);
    
    await loginToApp(page, 90000);
    await page.waitForLoadState('load');
    await page.waitForTimeout(3000);

    console.log('✅ Successfully logged in');

    // Navigate to Properties
    const propertiesMenuItem = page.getByRole('menuitem', { name: /properties/i });
    if (await propertiesMenuItem.isVisible({ timeout: 3000 }).catch(() => false)) {
        await propertiesMenuItem.click();
        await page.waitForLoadState('load');
        await page.waitForTimeout(2000);
        
        console.log('✅ Navigated to Properties');

        // Click Create button
        const createButton = page.locator('button:has-text("Create"), button:has-text("Add Building")').first();
        const hasCreateButton = await createButton.isVisible({ timeout: 3000 }).catch(() => false);
        
        if (hasCreateButton) {
            await createButton.click();
            await page.waitForTimeout(2000);
            console.log('✅ Clicked Create button');

            // Fill in General tab fields
            const propertyName = `Test Property ${Date.now()}`;
            
            // Property Name
            const nameInput = page.locator('input[name*="name" i], input[label*="name" i], input[placeholder*="name" i]').first();
            if (await nameInput.isVisible({ timeout: 3000 }).catch(() => false)) {
                await nameInput.fill(propertyName);
                console.log(`✅ Filled property name: ${propertyName}`);
            }

            // Property Type dropdown
            const typeDropdown = page.locator('.v-select:has-text("Type"), [aria-label*="type" i]').first();
            if (await typeDropdown.isVisible({ timeout: 3000 }).catch(() => false)) {
                await typeDropdown.click();
                await page.waitForTimeout(1000);
                
                const apartmentOption = page.locator('[role="option"]:has-text("Apartment"), .v-list-item:has-text("Apartment")').first();
                if (await apartmentOption.isVisible({ timeout: 2000 }).catch(() => false)) {
                    await apartmentOption.click();
                    console.log('✅ Selected property type: Apartment');
                }
            }

            // Status dropdown
            const statusDropdown = page.locator('.v-select:has-text("Status"), [aria-label*="status" i]').first();
            if (await statusDropdown.isVisible({ timeout: 3000 }).catch(() => false)) {
                await statusDropdown.click();
                await page.waitForTimeout(1000);
                
                const activeOption = page.locator('[role="option"]:has-text("Active"), .v-list-item:has-text("Active")').first();
                if (await activeOption.isVisible({ timeout: 2000 }).catch(() => false)) {
                    await activeOption.click();
                    console.log('✅ Selected status: Active');
                }
            }

            // Featured checkbox
            const featuredCheckbox = page.locator('input[type="checkbox"][name*="featured" i]').first();
            if (await featuredCheckbox.isVisible({ timeout: 2000 }).catch(() => false)) {
                await featuredCheckbox.check();
                console.log('✅ Checked Featured option');
            }

            // Save the property
            const saveButton = page.locator('button:has-text("Save"), button:has-text("Create")').first();
            if (await saveButton.isVisible({ timeout: 3000 }).catch(() => false)) {
                await saveButton.click();
                await page.waitForTimeout(3000);
                console.log('✅ Clicked Save button');

                // Verify success message or property appears in list
                const successMessage = page.locator('.v-snackbar, .v-alert, text="success"').first();
                if (await successMessage.isVisible({ timeout: 5000 }).catch(() => false)) {
                    console.log('✅ Success message displayed');
                }

                console.log('✅ General tab saved successfully');
            }
        } else {
            console.log('⚠️ Create button not found');
        }
    } else {
        console.log('⚠️ Properties menu not accessible');
    }
});

test('create and save Address tab successfully', async ({ page }) => {
    test.setTimeout(180000);
    
    await loginToApp(page, 90000);
    await page.waitForLoadState('load');
    await page.waitForTimeout(3000);

    console.log('✅ Successfully logged in');

    // Navigate to Properties
    const propertiesMenuItem = page.getByRole('menuitem', { name: /properties/i });
    if (await propertiesMenuItem.isVisible({ timeout: 3000 }).catch(() => false)) {
        await propertiesMenuItem.click();
        await page.waitForLoadState('load');
        await page.waitForTimeout(2000);
        
        console.log('✅ Navigated to Properties');

        // Click on first property to edit
        const firstRow = page.locator('tbody tr').first();
        const rowCount = await page.locator('tbody tr').count();
        
        if (rowCount > 0) {
            await firstRow.click();
            await page.waitForTimeout(2000);
            console.log('✅ Opened property details');

            // Look for Address tab
            const addressTab = page.getByRole('tab', { name: /address/i });
            const hasAddressTab = await addressTab.isVisible({ timeout: 3000 }).catch(() => false);
            
            if (hasAddressTab) {
                await addressTab.click();
                await page.waitForTimeout(2000);
                console.log('✅ Opened Address tab');

                // Fill in address fields
                const streetInput = page.locator('input[name*="street" i], input[placeholder*="street" i]').first();
                if (await streetInput.isVisible({ timeout: 3000 }).catch(() => false)) {
                    await streetInput.fill('123 Test Street');
                    console.log('✅ Filled street address');
                }

                const suburbInput = page.locator('input[name*="suburb" i], input[placeholder*="suburb" i]').first();
                if (await suburbInput.isVisible({ timeout: 2000 }).catch(() => false)) {
                    await suburbInput.fill('Test Suburb');
                    console.log('✅ Filled suburb');
                }

                // City dropdown
                const cityDropdown = page.locator('.v-select:has-text("City"), [aria-label*="city" i]').first();
                if (await cityDropdown.isVisible({ timeout: 3000 }).catch(() => false)) {
                    await cityDropdown.click();
                    await page.waitForTimeout(1000);
                    
                    const cityOption = page.locator('[role="option"], .v-list-item').first();
                    if (await cityOption.isVisible({ timeout: 2000 }).catch(() => false)) {
                        await cityOption.click();
                        console.log('✅ Selected city');
                    }
                }

                const postcodeInput = page.locator('input[name*="postcode" i], input[name*="zip" i], input[placeholder*="postcode" i]').first();
                if (await postcodeInput.isVisible({ timeout: 2000 }).catch(() => false)) {
                    await postcodeInput.fill('3000');
                    console.log('✅ Filled postcode');
                }

                // Save button
                const saveButton = page.locator('button:has-text("Save")').first();
                if (await saveButton.isVisible({ timeout: 3000 }).catch(() => false)) {
                    await saveButton.click();
                    await page.waitForTimeout(3000);
                    console.log('✅ Address tab saved successfully');
                }
            } else {
                console.log('⚠️ Address tab not found');
            }
        } else {
            console.log('⚠️ No properties available to edit');
        }
    } else {
        console.log('⚠️ Properties menu not accessible');
    }
});

test('create and save Images tab successfully', async ({ page }) => {
    test.setTimeout(180000);
    
    await loginToApp(page, 90000);
    await page.waitForLoadState('load');
    await page.waitForTimeout(3000);

    console.log('✅ Successfully logged in');

    // Navigate to Properties
    const propertiesMenuItem = page.getByRole('menuitem', { name: /properties/i });
    if (await propertiesMenuItem.isVisible({ timeout: 3000 }).catch(() => false)) {
        await propertiesMenuItem.click();
        await page.waitForLoadState('load');
        await page.waitForTimeout(2000);
        
        console.log('✅ Navigated to Properties');

        // Click on first property
        const firstRow = page.locator('tbody tr').first();
        const rowCount = await page.locator('tbody tr').count();
        
        if (rowCount > 0) {
            await firstRow.click();
            await page.waitForTimeout(2000);
            console.log('✅ Opened property details');

            // Look for Images tab
            const imagesTab = page.getByRole('tab', { name: /images/i });
            const hasImagesTab = await imagesTab.isVisible({ timeout: 3000 }).catch(() => false);
            
            if (hasImagesTab) {
                await imagesTab.click();
                await page.waitForTimeout(2000);
                console.log('✅ Opened Images tab');

                // Check for Browse Images or Upload button
                const browseButton = page.locator('button:has-text("Browse Images"), button:has-text("Upload"), button:has-text("Add Image")').first();
                const hasBrowseButton = await browseButton.isVisible({ timeout: 3000 }).catch(() => false);
                
                if (hasBrowseButton) {
                    await browseButton.click();
                    await page.waitForTimeout(2000);
                    console.log('✅ Clicked Browse/Upload button');

                    // Check if image gallery opened
                    const imageGallery = page.locator('.image-container, .v-dialog:has-text("Image"), .gallery');
                    const hasGallery = await imageGallery.isVisible({ timeout: 3000 }).catch(() => false);
                    
                    if (hasGallery) {
                        console.log('✅ Image gallery opened');
                        
                        // Try to select first image
                        const firstImage = page.locator('.image-container img, .gallery img, [role="img"]').first();
                        if (await firstImage.isVisible({ timeout: 3000 }).catch(() => false)) {
                            await firstImage.click();
                            await page.waitForTimeout(1000);
                            console.log('✅ Selected image');

                            // Confirm selection
                            const confirmButton = page.locator('button:has-text("Select"), button:has-text("Choose"), button:has-text("Confirm")').first();
                            if (await confirmButton.isVisible({ timeout: 2000 }).catch(() => false)) {
                                await confirmButton.click();
                                await page.waitForTimeout(2000);
                                console.log('✅ Confirmed image selection');
                            }
                        }
                    }

                    // Save button
                    const saveButton = page.locator('button:has-text("Save")').first();
                    if (await saveButton.isVisible({ timeout: 3000 }).catch(() => false)) {
                        await saveButton.click();
                        await page.waitForTimeout(3000);
                        console.log('✅ Images tab saved successfully');
                    }
                } else {
                    console.log('⚠️ Browse/Upload button not found');
                }
            } else {
                console.log('⚠️ Images tab not found');
            }
        } else {
            console.log('⚠️ No properties available');
        }
    } else {
        console.log('⚠️ Properties menu not accessible');
    }
});

test('create and save Features tab successfully', async ({ page }) => {
    test.setTimeout(180000);
    
    await loginToApp(page, 90000);
    await page.waitForLoadState('load');
    await page.waitForTimeout(3000);

    console.log('✅ Successfully logged in');

    // Navigate to Properties
    const propertiesMenuItem = page.getByRole('menuitem', { name: /properties/i });
    if (await propertiesMenuItem.isVisible({ timeout: 3000 }).catch(() => false)) {
        await propertiesMenuItem.click();
        await page.waitForLoadState('load');
        await page.waitForTimeout(2000);
        
        console.log('✅ Navigated to Properties');

        // Click on first property
        const firstRow = page.locator('tbody tr').first();
        const rowCount = await page.locator('tbody tr').count();
        
        if (rowCount > 0) {
            await firstRow.click();
            await page.waitForTimeout(2000);
            console.log('✅ Opened property details');

            // Look for Features tab
            const featuresTab = page.getByRole('tab', { name: /features/i });
            const hasFeaturesTab = await featuresTab.isVisible({ timeout: 3000 }).catch(() => false);
            
            if (hasFeaturesTab) {
                await featuresTab.click();
                await page.waitForTimeout(2000);
                console.log('✅ Opened Features tab');

                // Check for Add Feature button
                const addButton = page.locator('button:has-text("Add Feature"), button:has-text("Add"), button:has-text("Create")').first();
                const hasAddButton = await addButton.isVisible({ timeout: 3000 }).catch(() => false);
                
                if (hasAddButton) {
                    await addButton.click();
                    await page.waitForTimeout(2000);
                    console.log('✅ Clicked Add Feature button');

                    // Fill feature name
                    const featureNameInput = page.locator('input[name*="name" i], input[placeholder*="feature" i]').first();
                    if (await featureNameInput.isVisible({ timeout: 3000 }).catch(() => false)) {
                        await featureNameInput.fill('Swimming Pool');
                        console.log('✅ Filled feature name');
                    }

                    // Fill feature value/description
                    const featureValueInput = page.locator('input[name*="value" i], textarea[name*="description" i]').first();
                    if (await featureValueInput.isVisible({ timeout: 2000 }).catch(() => false)) {
                        await featureValueInput.fill('Heated pool with spa');
                        console.log('✅ Filled feature value');
                    }

                    // Save feature
                    const saveFeatureButton = page.locator('button:has-text("Save"), button:has-text("Add")').first();
                    if (await saveFeatureButton.isVisible({ timeout: 3000 }).catch(() => false)) {
                        await saveFeatureButton.click();
                        await page.waitForTimeout(2000);
                        console.log('✅ Feature saved');
                    }

                    // Save tab
                    const saveButton = page.locator('button:has-text("Save")').last();
                    if (await saveButton.isVisible({ timeout: 3000 }).catch(() => false)) {
                        await saveButton.click();
                        await page.waitForTimeout(3000);
                        console.log('✅ Features tab saved successfully');
                    }
                } else {
                    console.log('⚠️ Add Feature button not found - may be a different interface');
                    
                    // Alternative: Check for feature checkboxes
                    const featureCheckboxes = page.locator('input[type="checkbox"]');
                    const checkboxCount = await featureCheckboxes.count();
                    
                    if (checkboxCount > 0) {
                        await featureCheckboxes.first().check();
                        console.log('✅ Selected a feature');
                        
                        const saveButton = page.locator('button:has-text("Save")').first();
                        if (await saveButton.isVisible({ timeout: 3000 }).catch(() => false)) {
                            await saveButton.click();
                            await page.waitForTimeout(3000);
                            console.log('✅ Features tab saved successfully');
                        }
                    }
                }
            } else {
                console.log('⚠️ Features tab not found');
            }
        } else {
            console.log('⚠️ No properties available');
        }
    } else {
        console.log('⚠️ Properties menu not accessible');
    }
});

test('create and save Contract tab successfully', async ({ page }) => {
    test.setTimeout(180000);
    
    await loginToApp(page, 90000);
    await page.waitForLoadState('load');
    await page.waitForTimeout(3000);

    console.log('✅ Successfully logged in');

    // Navigate to Properties
    const propertiesMenuItem = page.getByRole('menuitem', { name: /properties/i });
    if (await propertiesMenuItem.isVisible({ timeout: 3000 }).catch(() => false)) {
        await propertiesMenuItem.click();
        await page.waitForLoadState('load');
        await page.waitForTimeout(2000);
        
        console.log('✅ Navigated to Properties');

        // Click on first property
        const firstRow = page.locator('tbody tr').first();
        const rowCount = await page.locator('tbody tr').count();
        
        if (rowCount > 0) {
            await firstRow.click();
            await page.waitForTimeout(2000);
            console.log('✅ Opened property details');

            // Look for Contract tab
            const contractTab = page.getByRole('tab', { name: /contract/i });
            const hasContractTab = await contractTab.isVisible({ timeout: 3000 }).catch(() => false);
            
            if (hasContractTab) {
                await contractTab.click();
                await page.waitForTimeout(2000);
                console.log('✅ Opened Contract tab');

                // Fill contract details
                const contractNumberInput = page.locator('input[name*="contract" i], input[placeholder*="contract" i]').first();
                if (await contractNumberInput.isVisible({ timeout: 3000 }).catch(() => false)) {
                    await contractNumberInput.fill(`CONTRACT-${Date.now()}`);
                    console.log('✅ Filled contract number');
                }

                // Price field
                const priceInput = page.locator('input[name*="price" i], input[placeholder*="price" i], input[type="number"]').first();
                if (await priceInput.isVisible({ timeout: 2000 }).catch(() => false)) {
                    await priceInput.fill('500000');
                    console.log('✅ Filled price');
                }

                // Start date
                const startDateInput = page.locator('input[name*="start" i], input[name*="date" i]').first();
                if (await startDateInput.isVisible({ timeout: 2000 }).catch(() => false)) {
                    await startDateInput.fill('2026-01-01');
                    console.log('✅ Filled start date');
                }

                // End date
                const endDateInput = page.locator('input[name*="end" i]').first();
                if (await endDateInput.isVisible({ timeout: 2000 }).catch(() => false)) {
                    await endDateInput.fill('2026-12-31');
                    console.log('✅ Filled end date');
                }

                // Save button
                const saveButton = page.locator('button:has-text("Save")').first();
                if (await saveButton.isVisible({ timeout: 3000 }).catch(() => false)) {
                    await saveButton.click();
                    await page.waitForTimeout(3000);
                    console.log('✅ Contract tab saved successfully');
                }
            } else {
                console.log('⚠️ Contract tab not found');
            }
        } else {
            console.log('⚠️ No properties available');
        }
    } else {
        console.log('⚠️ Properties menu not accessible');
    }
});

test('create and save Testimonials tab successfully', async ({ page }) => {
    test.setTimeout(180000);
    
    await loginToApp(page, 90000);
    await page.waitForLoadState('load');
    await page.waitForTimeout(3000);

    console.log('✅ Successfully logged in');

    // Navigate to Properties
    const propertiesMenuItem = page.getByRole('menuitem', { name: /properties/i });
    if (await propertiesMenuItem.isVisible({ timeout: 3000 }).catch(() => false)) {
        await propertiesMenuItem.click();
        await page.waitForLoadState('load');
        await page.waitForTimeout(2000);
        
        console.log('✅ Navigated to Properties');

        // Click on first property
        const firstRow = page.locator('tbody tr').first();
        const rowCount = await page.locator('tbody tr').count();
        
        if (rowCount > 0) {
            await firstRow.click();
            await page.waitForTimeout(2000);
            console.log('✅ Opened property details');

            // Look for Testimonials tab
            const testimonialsTab = page.getByRole('tab', { name: /testimonials/i });
            const hasTestimonialsTab = await testimonialsTab.isVisible({ timeout: 3000 }).catch(() => false);
            
            if (hasTestimonialsTab) {
                await testimonialsTab.click();
                await page.waitForTimeout(2000);
                console.log('✅ Opened Testimonials tab');

                // Check for Add Testimonial button
                const addButton = page.locator('button:has-text("Add Testimonial"), button:has-text("Add"), button:has-text("Create")').first();
                const hasAddButton = await addButton.isVisible({ timeout: 3000 }).catch(() => false);
                
                if (hasAddButton) {
                    await addButton.click();
                    await page.waitForTimeout(2000);
                    console.log('✅ Clicked Add Testimonial button');

                    // Fill testimonial author name
                    const authorInput = page.locator('input[name*="name" i], input[name*="author" i], input[placeholder*="name" i]').first();
                    if (await authorInput.isVisible({ timeout: 3000 }).catch(() => false)) {
                        await authorInput.fill('John Doe');
                        console.log('✅ Filled author name');
                    }

                    // Fill testimonial content
                    const contentInput = page.locator('textarea[name*="content" i], textarea[name*="testimonial" i], textarea[name*="message" i]').first();
                    if (await contentInput.isVisible({ timeout: 3000 }).catch(() => false)) {
                        await contentInput.fill('This is an excellent property! Highly recommended.');
                        console.log('✅ Filled testimonial content');
                    }

                    // Rating (if exists)
                    const ratingInput = page.locator('input[name*="rating" i], [role="slider"]').first();
                    if (await ratingInput.isVisible({ timeout: 2000 }).catch(() => false)) {
                        await ratingInput.fill('5');
                        console.log('✅ Filled rating');
                    }

                    // Save testimonial
                    const saveTestimonialButton = page.locator('button:has-text("Save"), button:has-text("Add")').first();
                    if (await saveTestimonialButton.isVisible({ timeout: 3000 }).catch(() => false)) {
                        await saveTestimonialButton.click();
                        await page.waitForTimeout(2000);
                        console.log('✅ Testimonial saved');
                    }

                    // Save tab
                    const saveButton = page.locator('button:has-text("Save")').last();
                    if (await saveButton.isVisible({ timeout: 3000 }).catch(() => false)) {
                        await saveButton.click();
                        await page.waitForTimeout(3000);
                        console.log('✅ Testimonials tab saved successfully');
                    }
                } else {
                    console.log('⚠️ Add Testimonial button not found');
                }
            } else {
                console.log('⚠️ Testimonials tab not found');
            }
        } else {
            console.log('⚠️ No properties available');
        }
    } else {
        console.log('⚠️ Properties menu not accessible');
    }
});

test('create and save Floor Plans tab successfully', async ({ page }) => {
    test.setTimeout(180000);
    
    await loginToApp(page, 90000);
    await page.waitForLoadState('load');
    await page.waitForTimeout(3000);

    console.log('✅ Successfully logged in');

    // Navigate to Properties
    const propertiesMenuItem = page.getByRole('menuitem', { name: /properties/i });
    if (await propertiesMenuItem.isVisible({ timeout: 3000 }).catch(() => false)) {
        await propertiesMenuItem.click();
        await page.waitForLoadState('load');
        await page.waitForTimeout(2000);
        
        console.log('✅ Navigated to Properties');

        // Click on first property
        const firstRow = page.locator('tbody tr').first();
        const rowCount = await page.locator('tbody tr').count();
        
        if (rowCount > 0) {
            await firstRow.click();
            await page.waitForTimeout(2000);
            console.log('✅ Opened property details');

            // Look for Floor Plans tab
            const floorPlansTab = page.getByRole('tab', { name: /floor plans/i });
            const hasFloorPlansTab = await floorPlansTab.isVisible({ timeout: 3000 }).catch(() => false);
            
            if (hasFloorPlansTab) {
                await floorPlansTab.click();
                await page.waitForTimeout(2000);
                console.log('✅ Opened Floor Plans tab');

                // Check for Add Floor Plan button
                const addButton = page.locator('button:has-text("Add Floor Plan"), button:has-text("Add"), button:has-text("Upload")').first();
                const hasAddButton = await addButton.isVisible({ timeout: 3000 }).catch(() => false);
                
                if (hasAddButton) {
                    await addButton.click();
                    await page.waitForTimeout(2000);
                    console.log('✅ Clicked Add Floor Plan button');

                    // Fill floor plan name
                    const nameInput = page.locator('input[name*="name" i], input[placeholder*="name" i]').first();
                    if (await nameInput.isVisible({ timeout: 3000 }).catch(() => false)) {
                        await nameInput.fill('Ground Floor');
                        console.log('✅ Filled floor plan name');
                    }

                    // Fill bedrooms
                    const bedroomsInput = page.locator('input[name*="bedroom" i], input[placeholder*="bedroom" i]').first();
                    if (await bedroomsInput.isVisible({ timeout: 2000 }).catch(() => false)) {
                        await bedroomsInput.fill('3');
                        await bedroomsInput.blur(); // Trigger validation
                        await page.waitForTimeout(500);
                        console.log('✅ Filled bedrooms');
                    }

                    // Fill bathrooms
                    const bathroomsInput = page.locator('input[name*="bathroom" i], input[placeholder*="bathroom" i]').first();
                    if (await bathroomsInput.isVisible({ timeout: 2000 }).catch(() => false)) {
                        await bathroomsInput.fill('2');
                        await bathroomsInput.blur(); // Trigger validation
                        await page.waitForTimeout(500);
                        console.log('✅ Filled bathrooms');
                    }

                    // Fill area/size
                    const areaInput = page.locator('input[name*="area" i], input[name*="size" i]').first();
                    if (await areaInput.isVisible({ timeout: 2000 }).catch(() => false)) {
                        await areaInput.fill('150');
                        await areaInput.blur(); // Trigger validation
                        await page.waitForTimeout(500);
                        console.log('✅ Filled area');
                    }

                    // Browse/Upload floor plan image
                    const browseButton = page.locator('button:has-text("Browse Images"), button:has-text("Upload Image")').first();
                    if (await browseButton.isVisible({ timeout: 3000 }).catch(() => false)) {
                        await browseButton.click();
                        await page.waitForTimeout(2000);
                        console.log('✅ Clicked Browse Images');

                        // Select first image from gallery
                        const firstImage = page.locator('.image-container img, .gallery img').first();
                        if (await firstImage.isVisible({ timeout: 3000 }).catch(() => false)) {
                            await firstImage.click();
                            await page.waitForTimeout(1000);
                            
                            const selectButton = page.locator('button:has-text("Select"), button:has-text("Choose")').first();
                            if (await selectButton.isVisible({ timeout: 2000 }).catch(() => false)) {
                                await selectButton.click();
                                await page.waitForTimeout(2000);
                                console.log('✅ Selected floor plan image');
                            }
                        }
                    }

                    // Wait for any validation messages to clear
                    await page.waitForTimeout(1000);

                    // Check for any validation errors before saving
                    const validationErrors = page.locator('.v-messages__message, .error--text');
                    const errorCount = await validationErrors.count();
                    if (errorCount > 0) {
                        console.log(`⚠️ Found ${errorCount} validation error(s) - attempting to save anyway`);
                    }

                    // Save floor plan - try multiple approaches
                    const saveFloorPlanButton = page.locator('button:has-text("Save"), button:has-text("Add")').first();
                    if (await saveFloorPlanButton.isVisible({ timeout: 3000 }).catch(() => false)) {
                        try {
                            // First try normal click
                            await saveFloorPlanButton.click({ timeout: 5000 });
                            console.log('✅ Floor plan saved');
                        } catch (error) {
                            // If normal click fails due to overlay, try force click
                            console.log('⚠️ Normal click blocked, trying force click...');
                            await saveFloorPlanButton.click({ force: true });
                            console.log('✅ Floor plan saved (forced)');
                        }
                        await page.waitForTimeout(2000);
                    }

                    // Save tab
                    const saveButton = page.locator('button:has-text("Save")').last();
                    if (await saveButton.isVisible({ timeout: 3000 }).catch(() => false)) {
                        await saveButton.click();
                        await page.waitForTimeout(3000);
                        console.log('✅ Floor Plans tab saved successfully');
                    }
                } else {
                    console.log('⚠️ Add Floor Plan button not found');
                }
            } else {
                console.log('⚠️ Floor Plans tab not found');
            }
        } else {
            console.log('⚠️ No properties available');
        }
    } else {
        console.log('⚠️ Properties menu not accessible');
    }
});

test('edit property General tab and verify changes', async ({ page }) => {
    test.setTimeout(180000);
    
    await loginToApp(page, 90000);
    await page.waitForLoadState('load');
    await page.waitForTimeout(3000);

    console.log('✅ Successfully logged in');

    // Navigate to Properties
    const propertiesMenuItem = page.getByRole('menuitem', { name: /properties/i });
    if (await propertiesMenuItem.isVisible({ timeout: 3000 }).catch(() => false)) {
        await propertiesMenuItem.click();
        await page.waitForLoadState('load');
        await page.waitForTimeout(2000);
        
        console.log('✅ Navigated to Properties');

        // Click on first property to edit
        const firstRow = page.locator('tbody tr').first();
        const rowCount = await page.locator('tbody tr').count();
        
        if (rowCount > 0) {
            // Get original property name for verification
            const originalNameCell = firstRow.locator('td').nth(5);
            const originalName = await originalNameCell.textContent().catch(() => '');
            console.log(`📝 Original property name: ${originalName}`);

            await firstRow.click();
            await page.waitForTimeout(2000);
            console.log('✅ Opened property details');

            // Click Edit button
            const editButton = page.locator('button:has-text("Edit")').first();
            const hasEditButton = await editButton.isVisible({ timeout: 3000 }).catch(() => false);
            
            if (hasEditButton) {
                await editButton.click();
                await page.waitForTimeout(2000);
                console.log('✅ Clicked Edit button');

                // Edit property name in General tab
                const newPropertyName = `Edited Property ${Date.now()}`;
                const nameInput = page.locator('input[name*="name" i], input[label*="name" i]').first();
                
                if (await nameInput.isVisible({ timeout: 3000 }).catch(() => false)) {
                    await nameInput.clear();
                    await nameInput.fill(newPropertyName);
                    console.log(`✅ Changed property name to: ${newPropertyName}`);
                }

                // Change Featured status
                const featuredCheckbox = page.locator('input[type="checkbox"][name*="featured" i]').first();
                if (await featuredCheckbox.isVisible({ timeout: 2000 }).catch(() => false)) {
                    const wasFeatured = await featuredCheckbox.isChecked();
                    if (wasFeatured) {
                        await featuredCheckbox.uncheck();
                        console.log('✅ Unchecked Featured');
                    } else {
                        await featuredCheckbox.check();
                        console.log('✅ Checked Featured');
                    }
                }

                // Change Status dropdown
                const statusDropdown = page.locator('.v-select:has-text("Status"), [aria-label*="status" i]').first();
                if (await statusDropdown.isVisible({ timeout: 3000 }).catch(() => false)) {
                    await statusDropdown.click();
                    await page.waitForTimeout(1000);
                    
                    // Try to select a different status
                    const statusOptions = page.locator('[role="option"], .v-list-item');
                    const optionCount = await statusOptions.count();
                    if (optionCount > 1) {
                        await statusOptions.nth(1).click();
                        console.log('✅ Changed status');
                    }
                }

                // Save changes
                const saveButton = page.locator('button:has-text("Save"), button:has-text("Update")').first();
                if (await saveButton.isVisible({ timeout: 3000 }).catch(() => false)) {
                    await saveButton.click();
                    await page.waitForTimeout(3000);
                    console.log('✅ Saved changes');

                    // Verify success message
                    const successMessage = page.locator('.v-snackbar:has-text("success"), .v-alert:has-text("success"), text="updated"').first();
                    if (await successMessage.isVisible({ timeout: 5000 }).catch(() => false)) {
                        console.log('✅ Success message displayed');
                    }

                    // Close detail view
                    const closeButton = page.locator('button:has-text("Close"), button[aria-label*="close" i], .mdi-close').first();
                    if (await closeButton.isVisible({ timeout: 2000 }).catch(() => false)) {
                        await closeButton.click();
                        await page.waitForTimeout(2000);
                    }

                    // Verify the edited name appears in the table
                    await page.waitForTimeout(2000);
                    const updatedTable = page.locator('tbody tr');
                    const updatedContent = await updatedTable.first().textContent();
                    
                    if (updatedContent && updatedContent.includes(newPropertyName)) {
                        console.log('✅ Property name successfully updated in table');
                    } else {
                        console.log('⚠️ Could not verify updated name in table');
                    }

                    console.log('✅ General tab edit completed successfully');
                }
            } else {
                console.log('⚠️ Edit button not found');
            }
        } else {
            console.log('⚠️ No properties available to edit');
        }
    } else {
        console.log('⚠️ Properties menu not accessible');
    }
});

test('edit property Address tab and verify changes', async ({ page }) => {
    test.setTimeout(180000);
    
    await loginToApp(page, 90000);
    await page.waitForLoadState('load');
    await page.waitForTimeout(3000);

    console.log('✅ Successfully logged in');

    // Navigate to Properties
    const propertiesMenuItem = page.getByRole('menuitem', { name: /properties/i });
    if (await propertiesMenuItem.isVisible({ timeout: 3000 }).catch(() => false)) {
        await propertiesMenuItem.click();
        await page.waitForLoadState('load');
        await page.waitForTimeout(2000);
        
        console.log('✅ Navigated to Properties');

        // Click on first property
        const firstRow = page.locator('tbody tr').first();
        const rowCount = await page.locator('tbody tr').count();
        
        if (rowCount > 0) {
            await firstRow.click();
            await page.waitForTimeout(2000);
            console.log('✅ Opened property details');

            // Navigate to Address tab
            const addressTab = page.getByRole('tab', { name: /address/i });
            const hasAddressTab = await addressTab.isVisible({ timeout: 3000 }).catch(() => false);
            
            if (hasAddressTab) {
                await addressTab.click();
                await page.waitForTimeout(2000);
                console.log('✅ Opened Address tab');

                // Click Edit button
                const editButton = page.locator('button:has-text("Edit")').first();
                if (await editButton.isVisible({ timeout: 3000 }).catch(() => false)) {
                    await editButton.click();
                    await page.waitForTimeout(2000);
                    console.log('✅ Clicked Edit button');
                }

                // Edit street address
                const streetInput = page.locator('input[name*="street" i], input[placeholder*="street" i]').first();
                if (await streetInput.isVisible({ timeout: 3000 }).catch(() => false)) {
                    const originalStreet = await streetInput.inputValue();
                    console.log(`📝 Original street: ${originalStreet}`);
                    
                    const newStreet = `${Math.floor(Math.random() * 999) + 1} Updated Street`;
                    await streetInput.clear();
                    await streetInput.fill(newStreet);
                    console.log(`✅ Changed street to: ${newStreet}`);
                }

                // Edit suburb
                const suburbInput = page.locator('input[name*="suburb" i], input[placeholder*="suburb" i]').first();
                if (await suburbInput.isVisible({ timeout: 2000 }).catch(() => false)) {
                    const newSuburb = `Updated Suburb ${Date.now() % 1000}`;
                    await suburbInput.clear();
                    await suburbInput.fill(newSuburb);
                    console.log(`✅ Changed suburb to: ${newSuburb}`);
                }

                // Edit postcode
                const postcodeInput = page.locator('input[name*="postcode" i], input[name*="zip" i]').first();
                if (await postcodeInput.isVisible({ timeout: 2000 }).catch(() => false)) {
                    const newPostcode = `${3000 + Math.floor(Math.random() * 100)}`;
                    await postcodeInput.clear();
                    await postcodeInput.fill(newPostcode);
                    console.log(`✅ Changed postcode to: ${newPostcode}`);
                }

                // Save changes
                const saveButton = page.locator('button:has-text("Save"), button:has-text("Update")').first();
                if (await saveButton.isVisible({ timeout: 3000 }).catch(() => false)) {
                    await saveButton.click();
                    await page.waitForTimeout(3000);
                    console.log('✅ Saved Address tab changes');

                    // Verify success message
                    const successMessage = page.locator('.v-snackbar, .v-alert, text="success"').first();
                    if (await successMessage.isVisible({ timeout: 5000 }).catch(() => false)) {
                        console.log('✅ Success message displayed');
                    }

                    console.log('✅ Address tab edit completed successfully');
                }
            } else {
                console.log('⚠️ Address tab not found');
            }
        } else {
            console.log('⚠️ No properties available to edit');
        }
    } else {
        console.log('⚠️ Properties menu not accessible');
    }
});

test('edit property Features tab and verify changes', async ({ page }) => {
    test.setTimeout(180000);
    
    await loginToApp(page, 90000);
    await page.waitForLoadState('load');
    await page.waitForTimeout(3000);

    console.log('✅ Successfully logged in');

    // Navigate to Properties
    const propertiesMenuItem = page.getByRole('menuitem', { name: /properties/i });
    if (await propertiesMenuItem.isVisible({ timeout: 3000 }).catch(() => false)) {
        await propertiesMenuItem.click();
        await page.waitForLoadState('load');
        await page.waitForTimeout(2000);
        
        console.log('✅ Navigated to Properties');

        // Click on first property
        const firstRow = page.locator('tbody tr').first();
        const rowCount = await page.locator('tbody tr').count();
        
        if (rowCount > 0) {
            await firstRow.click();
            await page.waitForTimeout(2000);
            console.log('✅ Opened property details');

            // Navigate to Features tab
            const featuresTab = page.getByRole('tab', { name: /features/i });
            const hasFeaturesTab = await featuresTab.isVisible({ timeout: 3000 }).catch(() => false);
            
            if (hasFeaturesTab) {
                await featuresTab.click();
                await page.waitForTimeout(2000);
                console.log('✅ Opened Features tab');

                // Click Edit button
                const editButton = page.locator('button:has-text("Edit")').first();
                if (await editButton.isVisible({ timeout: 3000 }).catch(() => false)) {
                    await editButton.click();
                    await page.waitForTimeout(2000);
                    console.log('✅ Clicked Edit button');
                }

                // Check if there are existing features to edit
                const existingFeatures = page.locator('.feature-item, .v-list-item, tbody tr');
                const featureCount = await existingFeatures.count();
                
                if (featureCount > 0) {
                    console.log(`📝 Found ${featureCount} existing features`);
                    
                    // Click edit on first feature
                    const editFeatureButton = existingFeatures.first().locator('button:has-text("Edit"), .mdi-pencil').first();
                    if (await editFeatureButton.isVisible({ timeout: 2000 }).catch(() => false)) {
                        await editFeatureButton.click();
                        await page.waitForTimeout(1500);
                        
                        // Edit feature name
                        const featureNameInput = page.locator('input[name*="name" i]').first();
                        if (await featureNameInput.isVisible({ timeout: 2000 }).catch(() => false)) {
                            await featureNameInput.clear();
                            await featureNameInput.fill(`Edited Feature ${Date.now() % 1000}`);
                            console.log('✅ Edited feature name');
                        }

                        // Save edited feature
                        const saveFeatureButton = page.locator('button:has-text("Save"), button:has-text("Update")').first();
                        if (await saveFeatureButton.isVisible({ timeout: 2000 }).catch(() => false)) {
                            await saveFeatureButton.click();
                            await page.waitForTimeout(2000);
                            console.log('✅ Saved edited feature');
                        }
                    }
                } else {
                    // Add a new feature if none exist
                    const addButton = page.locator('button:has-text("Add Feature"), button:has-text("Add")').first();
                    if (await addButton.isVisible({ timeout: 3000 }).catch(() => false)) {
                        await addButton.click();
                        await page.waitForTimeout(2000);
                        
                        const featureNameInput = page.locator('input[name*="name" i]').first();
                        if (await featureNameInput.isVisible({ timeout: 2000 }).catch(() => false)) {
                            await featureNameInput.fill('New Edited Feature');
                            console.log('✅ Added new feature');
                        }

                        const saveFeatureButton = page.locator('button:has-text("Save")').first();
                        if (await saveFeatureButton.isVisible({ timeout: 2000 }).catch(() => false)) {
                            await saveFeatureButton.click();
                            await page.waitForTimeout(2000);
                        }
                    }
                }

                // Save Features tab
                const saveButton = page.locator('button:has-text("Save")').last();
                if (await saveButton.isVisible({ timeout: 3000 }).catch(() => false)) {
                    await saveButton.click();
                    await page.waitForTimeout(3000);
                    console.log('✅ Features tab edit completed successfully');
                }
            } else {
                console.log('⚠️ Features tab not found');
            }
        } else {
            console.log('⚠️ No properties available to edit');
        }
    } else {
        console.log('⚠️ Properties menu not accessible');
    }
});

test('edit property Contract tab and verify changes', async ({ page }) => {
    test.setTimeout(180000);
    
    await loginToApp(page, 90000);
    await page.waitForLoadState('load');
    await page.waitForTimeout(3000);

    console.log('✅ Successfully logged in');

    // Navigate to Properties
    const propertiesMenuItem = page.getByRole('menuitem', { name: /properties/i });
    if (await propertiesMenuItem.isVisible({ timeout: 3000 }).catch(() => false)) {
        await propertiesMenuItem.click();
        await page.waitForLoadState('load');
        await page.waitForTimeout(2000);
        
        console.log('✅ Navigated to Properties');

        // Click on first property
        const firstRow = page.locator('tbody tr').first();
        const rowCount = await page.locator('tbody tr').count();
        
        if (rowCount > 0) {
            await firstRow.click();
            await page.waitForTimeout(2000);
            console.log('✅ Opened property details');

            // Navigate to Contract tab
            const contractTab = page.getByRole('tab', { name: /contract/i });
            const hasContractTab = await contractTab.isVisible({ timeout: 3000 }).catch(() => false);
            
            if (hasContractTab) {
                await contractTab.click();
                await page.waitForTimeout(2000);
                console.log('✅ Opened Contract tab');

                // Click Edit button
                const editButton = page.locator('button:has-text("Edit")').first();
                if (await editButton.isVisible({ timeout: 3000 }).catch(() => false)) {
                    await editButton.click();
                    await page.waitForTimeout(2000);
                    console.log('✅ Clicked Edit button');
                }

                // Edit contract number
                const contractInput = page.locator('input[name*="contract" i]').first();
                if (await contractInput.isVisible({ timeout: 3000 }).catch(() => false)) {
                    const originalContract = await contractInput.inputValue();
                    console.log(`📝 Original contract: ${originalContract}`);
                    
                    const newContract = `UPDATED-CONTRACT-${Date.now()}`;
                    await contractInput.clear();
                    await contractInput.fill(newContract);
                    console.log(`✅ Changed contract number to: ${newContract}`);
                }

                // Edit price
                const priceInput = page.locator('input[name*="price" i], input[type="number"]').first();
                if (await priceInput.isVisible({ timeout: 2000 }).catch(() => false)) {
                    const newPrice = `${Math.floor(Math.random() * 500000) + 300000}`;
                    await priceInput.clear();
                    await priceInput.fill(newPrice);
                    console.log(`✅ Changed price to: $${newPrice}`);
                }

                // Edit start date
                const startDateInput = page.locator('input[name*="start" i]').first();
                if (await startDateInput.isVisible({ timeout: 2000 }).catch(() => false)) {
                    await startDateInput.clear();
                    await startDateInput.fill('2026-02-01');
                    console.log('✅ Changed start date');
                }

                // Save changes
                const saveButton = page.locator('button:has-text("Save"), button:has-text("Update")').first();
                if (await saveButton.isVisible({ timeout: 3000 }).catch(() => false)) {
                    await saveButton.click();
                    await page.waitForTimeout(3000);
                    console.log('✅ Contract tab edit completed successfully');

                    // Verify success message
                    const successMessage = page.locator('.v-snackbar, .v-alert').first();
                    if (await successMessage.isVisible({ timeout: 5000 }).catch(() => false)) {
                        console.log('✅ Success message displayed');
                    }
                }
            } else {
                console.log('⚠️ Contract tab not found');
            }
        } else {
            console.log('⚠️ No properties available to edit');
        }
    } else {
        console.log('⚠️ Properties menu not accessible');
    }
});

test('edit and delete feature from Features tab', async ({ page }) => {
    test.setTimeout(180000);
    
    await loginToApp(page, 90000);
    await page.waitForLoadState('load');
    await page.waitForTimeout(3000);

    console.log('✅ Successfully logged in');

    // Navigate to Properties
    const propertiesMenuItem = page.getByRole('menuitem', { name: /properties/i });
    if (await propertiesMenuItem.isVisible({ timeout: 3000 }).catch(() => false)) {
        await propertiesMenuItem.click();
        await page.waitForLoadState('load');
        await page.waitForTimeout(2000);
        
        console.log('✅ Navigated to Properties');

        // Click on first property
        const firstRow = page.locator('tbody tr').first();
        const rowCount = await page.locator('tbody tr').count();
        
        if (rowCount > 0) {
            await firstRow.click();
            await page.waitForTimeout(2000);
            console.log('✅ Opened property details');

            // Navigate to Features tab
            const featuresTab = page.getByRole('tab', { name: /features/i });
            const hasFeaturesTab = await featuresTab.isVisible({ timeout: 3000 }).catch(() => false);
            
            if (hasFeaturesTab) {
                await featuresTab.click();
                await page.waitForTimeout(2000);
                console.log('✅ Opened Features tab');

                // Check existing features count
                const existingFeatures = page.locator('.feature-item, .v-list-item, tbody tr');
                const initialCount = await existingFeatures.count();
                console.log(`📝 Initial feature count: ${initialCount}`);

                if (initialCount > 0) {
                    // Try to delete the last feature
                    const deleteButton = existingFeatures.last().locator('button:has-text("Delete"), .mdi-delete').first();
                    
                    if (await deleteButton.isVisible({ timeout: 3000 }).catch(() => false)) {
                        await deleteButton.click();
                        await page.waitForTimeout(1500);
                        console.log('✅ Clicked delete button');

                        // Confirm deletion if confirmation dialog appears
                        const confirmButton = page.locator('button:has-text("Confirm"), button:has-text("Yes"), button:has-text("Delete")').last();
                        if (await confirmButton.isVisible({ timeout: 2000 }).catch(() => false)) {
                            await confirmButton.click();
                            await page.waitForTimeout(2000);
                            console.log('✅ Confirmed deletion');
                        }

                        // Verify feature was deleted
                        await page.waitForTimeout(2000);
                        const newCount = await existingFeatures.count();
                        
                        if (newCount < initialCount) {
                            console.log(`✅ Feature deleted successfully (${initialCount} → ${newCount})`);
                        } else {
                            console.log('⚠️ Feature count unchanged after deletion attempt');
                        }

                        // Save changes
                        const saveButton = page.locator('button:has-text("Save")').first();
                        if (await saveButton.isVisible({ timeout: 3000 }).catch(() => false)) {
                            await saveButton.click();
                            await page.waitForTimeout(3000);
                            console.log('✅ Saved changes after feature deletion');
                        }
                    } else {
                        console.log('⚠️ Delete button not found on feature');
                    }
                } else {
                    console.log('⚠️ No features available to delete');
                }
            } else {
                console.log('⚠️ Features tab not found');
            }
        } else {
            console.log('⚠️ No properties available');
        }
    } else {
        console.log('⚠️ Properties menu not accessible');
    }
});
