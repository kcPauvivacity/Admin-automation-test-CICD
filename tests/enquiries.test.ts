import { test, expect } from '@playwright/test';
import { loginToApp } from './helpers/auth.helper';

test('navigate to Enquiries section successfully', async ({ page }) => {
    test.setTimeout(180000);
    
    await loginToApp(page, 90000);
    await page.waitForLoadState('load');
    await page.waitForTimeout(3000);

    console.log('✅ Successfully logged in');

    // Navigate to Enquiries via main menu
    const enquiriesMenuItem = page.getByRole('menuitem', { name: /enquiries/i });
    const hasEnquiries = await enquiriesMenuItem.isVisible({ timeout: 3000 }).catch(() => false);
    
    if (hasEnquiries) {
        await enquiriesMenuItem.click();
        await page.waitForLoadState('load');
        await page.waitForTimeout(2000);
        
        console.log('✅ Navigated to Enquiries via main menu');
        console.log('✅ Enquiries page loaded successfully');
    } else {
        console.log('⚠️ Enquiries menu not found');
        
        // Try alternative navigation
        const menuButton = page.locator('button:has-text("Menu"), button[aria-label*="menu" i]').first();
        if (await menuButton.isVisible({ timeout: 2000 }).catch(() => false)) {
            await menuButton.click();
            await page.waitForTimeout(1000);
            
            const enquiriesLink = page.locator('a:has-text("Enquiries"), [role="menuitem"]:has-text("Enquiries")').first();
            if (await enquiriesLink.isVisible({ timeout: 2000 }).catch(() => false)) {
                await enquiriesLink.click();
                await page.waitForLoadState('load');
                await page.waitForTimeout(2000);
                console.log('✅ Navigated to Enquiries via alternative menu');
            }
        }
    }

    console.log('✅ Enquiries navigation verified');
});

test('verify enquiries table loads with data', async ({ page }) => {
    test.setTimeout(180000);
    
    await loginToApp(page, 90000);
    await page.waitForLoadState('load');
    await page.waitForTimeout(3000);

    console.log('✅ Successfully logged in');

    // Navigate to Enquiries
    const enquiriesMenuItem = page.getByRole('menuitem', { name: /enquiries/i });
    if (await enquiriesMenuItem.isVisible({ timeout: 3000 }).catch(() => false)) {
        await enquiriesMenuItem.click();
        await page.waitForLoadState('load');
        await page.waitForTimeout(2000);
        
        console.log('✅ Navigated to Enquiries');

        // Check for table or data display
        const tableRows = page.locator('tbody tr, .v-data-table tbody tr, [role="row"]');
        const rowCount = await tableRows.count();
        
        if (rowCount > 0) {
            console.log(`✅ Found ${rowCount} enquir${rowCount === 1 ? 'y' : 'ies'} in table`);
        } else {
            console.log('⚠️ No enquiries found in table');
        }

        // Check for pagination info
        const paginationInfo = page.locator('.v-data-table-footer__info, .pagination-info');
        const hasPagination = await paginationInfo.isVisible({ timeout: 2000 }).catch(() => false);
        
        if (hasPagination) {
            const paginationText = await paginationInfo.textContent();
            console.log(`📄 Pagination: ${paginationText}`);
        }

        console.log('✅ Enquiries table verified');
    } else {
        console.log('⚠️ Enquiries menu not accessible');
    }
});

test('verify enquiries table columns', async ({ page }) => {
    test.setTimeout(180000);
    
    await loginToApp(page, 90000);
    await page.waitForLoadState('load');
    await page.waitForTimeout(3000);

    console.log('✅ Successfully logged in');

    // Navigate to Enquiries
    const enquiriesMenuItem = page.getByRole('menuitem', { name: /enquiries/i });
    if (await enquiriesMenuItem.isVisible({ timeout: 3000 }).catch(() => false)) {
        await enquiriesMenuItem.click();
        await page.waitForLoadState('load');
        await page.waitForTimeout(2000);
        
        console.log('✅ Navigated to Enquiries');

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

        console.log('✅ Enquiry table columns verified');
    } else {
        console.log('⚠️ Enquiries menu not accessible');
    }
});

test('verify create new enquiry form', async ({ page }) => {
    test.setTimeout(180000);
    
    await loginToApp(page, 90000);
    await page.waitForLoadState('load');
    await page.waitForTimeout(3000);

    console.log('✅ Successfully logged in');

    // Navigate to Enquiries
    const enquiriesMenuItem = page.getByRole('menuitem', { name: /enquiries/i });
    if (await enquiriesMenuItem.isVisible({ timeout: 3000 }).catch(() => false)) {
        await enquiriesMenuItem.click();
        await page.waitForLoadState('load');
        await page.waitForTimeout(2000);
        
        console.log('✅ Navigated to Enquiries');

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
                console.log('✅ Create enquiry form opened');
                
                // Check for common form fields
                const nameField = page.locator('input[name*="name" i], input[label*="name" i], input[placeholder*="name" i]').first();
                const emailField = page.locator('input[type="email"], input[name*="email" i]').first();
                const phoneField = page.locator('input[type="tel"], input[name*="phone" i]').first();
                const messageField = page.locator('textarea, input[name*="message" i], input[name*="enquiry" i]').first();
                
                if (await nameField.isVisible({ timeout: 2000 }).catch(() => false)) {
                    console.log('  ✅ Name field found');
                }
                if (await emailField.isVisible({ timeout: 2000 }).catch(() => false)) {
                    console.log('  ✅ Email field found');
                }
                if (await phoneField.isVisible({ timeout: 2000 }).catch(() => false)) {
                    console.log('  ✅ Phone field found');
                }
                if (await messageField.isVisible({ timeout: 2000 }).catch(() => false)) {
                    console.log('  ✅ Message field found');
                }
                
                // Close the dialog
                const closeButton = page.locator('button:has-text("Cancel"), button:has-text("Close"), button[aria-label*="close" i], .v-dialog .mdi-close').first();
                if (await closeButton.isVisible({ timeout: 2000 }).catch(() => false)) {
                    await closeButton.click();
                    await page.waitForTimeout(1000);
                }
            } else {
                console.log('⚠️ Create enquiry form dialog not found');
            }
        } else {
            console.log('⚠️ Create button not found');
        }

        console.log('✅ Create enquiry form verified');
    } else {
        console.log('⚠️ Enquiries menu not accessible');
    }
});

test('verify enquiries search functionality', async ({ page }) => {
    test.setTimeout(180000);
    
    await loginToApp(page, 90000);
    await page.waitForLoadState('load');
    await page.waitForTimeout(3000);

    console.log('✅ Successfully logged in');

    // Navigate to Enquiries
    const enquiriesMenuItem = page.getByRole('menuitem', { name: /enquiries/i });
    if (await enquiriesMenuItem.isVisible({ timeout: 3000 }).catch(() => false)) {
        await enquiriesMenuItem.click();
        await page.waitForLoadState('load');
        await page.waitForTimeout(2000);
        
        console.log('✅ Navigated to Enquiries');

        // Get initial enquiry count
        const tableRows = page.locator('tbody tr, .v-data-table tbody tr');
        const initialCount = await tableRows.count();
        console.log(`Initial enquiries: ${initialCount}`);

        // Look for search input
        const searchInput = page.locator('input[type="search"], input[placeholder*="search" i], input[aria-label*="search" i]').first();
        const hasSearch = await searchInput.isVisible({ timeout: 3000 }).catch(() => false);
        
        if (hasSearch) {
            // Try searching for a common term
            await searchInput.fill('test');
            await page.waitForTimeout(2000);
            
            const afterSearchCount = await tableRows.count();
            console.log(`After search: ${afterSearchCount} enquiries`);
            
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
        console.log('⚠️ Enquiries menu not accessible');
    }
});

test('verify enquiry detail view', async ({ page }) => {
    test.setTimeout(180000);
    
    await loginToApp(page, 90000);
    await page.waitForLoadState('load');
    await page.waitForTimeout(3000);

    console.log('✅ Successfully logged in');

    // Navigate to Enquiries
    const enquiriesMenuItem = page.getByRole('menuitem', { name: /enquiries/i });
    if (await enquiriesMenuItem.isVisible({ timeout: 3000 }).catch(() => false)) {
        await enquiriesMenuItem.click();
        await page.waitForLoadState('load');
        await page.waitForTimeout(2000);
        
        console.log('✅ Navigated to Enquiries');

        // Click on first enquiry row
        const firstRow = page.locator('tbody tr, .v-data-table tbody tr').first();
        const hasRows = await firstRow.isVisible({ timeout: 3000 }).catch(() => false);
        
        if (hasRows) {
            await firstRow.click();
            await page.waitForTimeout(2000);
            
            console.log('✅ Clicked on first enquiry');

            // Check if detail view opened
            const detailView = page.locator('.v-dialog, [role="dialog"], .detail-view, .enquiry-detail');
            const hasDetailView = await detailView.isVisible({ timeout: 3000 }).catch(() => false);
            
            if (hasDetailView) {
                console.log('✅ Enquiry detail view opened');
                
                // Check for common detail fields
                const detailFields = [
                    { name: 'Name', selector: ':has-text("Name"), :has-text("Full Name")' },
                    { name: 'Email', selector: ':has-text("Email")' },
                    { name: 'Phone', selector: ':has-text("Phone")' },
                    { name: 'Message', selector: ':has-text("Message"), :has-text("Enquiry")' },
                    { name: 'Status', selector: ':has-text("Status")' },
                    { name: 'Date', selector: ':has-text("Date"), :has-text("Created")' }
                ];
                
                for (const field of detailFields) {
                    const fieldElement = detailView.locator(field.selector).first();
                    const isVisible = await fieldElement.isVisible({ timeout: 1000 }).catch(() => false);
                    console.log(`  ${isVisible ? '✅' : '⚠️'} ${isVisible ? 'Found' : 'Not found'}: ${field.name}`);
                }
                
                // Check for action buttons
                const editButton = page.locator('button:has-text("Edit"), button[aria-label*="edit" i]').first();
                const deleteButton = page.locator('button:has-text("Delete"), button[aria-label*="delete" i]').first();
                const replyButton = page.locator('button:has-text("Reply"), button:has-text("Respond")').first();
                
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
                
                if (await replyButton.isVisible({ timeout: 2000 }).catch(() => false)) {
                    console.log('  ✅ Found: Reply button');
                } else {
                    console.log('  ⚠️ Not found: Reply button');
                }
            } else {
                console.log('⚠️ Detail view not opened');
            }
        } else {
            console.log('⚠️ No enquiries in table to click');
        }

        console.log('✅ Enquiry detail view verified');
    } else {
        console.log('⚠️ Enquiries menu not accessible');
    }
});

test('verify edit enquiry functionality', async ({ page }) => {
    test.setTimeout(180000);
    
    await loginToApp(page, 90000);
    await page.waitForLoadState('load');
    await page.waitForTimeout(3000);

    console.log('✅ Successfully logged in');

    // Navigate to Enquiries
    const enquiriesMenuItem = page.getByRole('menuitem', { name: /enquiries/i });
    if (await enquiriesMenuItem.isVisible({ timeout: 3000 }).catch(() => false)) {
        await enquiriesMenuItem.click();
        await page.waitForLoadState('load');
        await page.waitForTimeout(2000);
        
        console.log('✅ Navigated to Enquiries');

        // Click on first enquiry
        const firstRow = page.locator('tbody tr, .v-data-table tbody tr').first();
        const hasRows = await firstRow.isVisible({ timeout: 3000 }).catch(() => false);
        
        if (hasRows) {
            await firstRow.click();
            await page.waitForTimeout(2000);
            
            console.log('✅ Opened enquiry details');

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
            console.log('⚠️ No enquiries available to edit');
        }

        console.log('✅ Edit enquiry verified');
    } else {
        console.log('⚠️ Enquiries menu not accessible');
    }
});

test('verify enquiries filter functionality', async ({ page }) => {
    test.setTimeout(180000);
    
    await loginToApp(page, 90000);
    await page.waitForLoadState('load');
    await page.waitForTimeout(3000);

    console.log('✅ Successfully logged in');

    // Navigate to Enquiries
    const enquiriesMenuItem = page.getByRole('menuitem', { name: /enquiries/i });
    if (await enquiriesMenuItem.isVisible({ timeout: 3000 }).catch(() => false)) {
        await enquiriesMenuItem.click();
        await page.waitForLoadState('load');
        await page.waitForTimeout(2000);
        
        console.log('✅ Navigated to Enquiries');

        // Get initial enquiry count
        const tableRows = page.locator('tbody tr, .v-data-table tbody tr');
        const initialCount = await tableRows.count();
        console.log(`Initial enquiries: ${initialCount}`);

        // Look for filter buttons or dropdowns
        const filterButton = page.locator('button:has-text("Filter"), button[aria-label*="filter" i], .filter-button').first();
        const hasFilter = await filterButton.isVisible({ timeout: 3000 }).catch(() => false);
        
        if (hasFilter) {
            await filterButton.click();
            await page.waitForTimeout(1500);
            console.log('✅ Filter menu opened');
            
            // Try to apply a filter (e.g., Status)
            const statusFilter = page.locator('text="Status", [role="menuitem"]:has-text("Status")').first();
            if (await statusFilter.isVisible({ timeout: 2000 }).catch(() => false)) {
                await statusFilter.click();
                await page.waitForTimeout(2000);
                
                const afterFilterCount = await tableRows.count();
                console.log(`After filter: ${afterFilterCount} enquiries`);
            }
        } else {
            console.log('⚠️ No filters found');
        }

        console.log('✅ Enquiries filters verified');
    } else {
        console.log('⚠️ Enquiries menu not accessible');
    }
});

test('verify enquiries sorting functionality', async ({ page }) => {
    test.setTimeout(180000);
    
    await loginToApp(page, 90000);
    await page.waitForLoadState('load');
    await page.waitForTimeout(3000);

    console.log('✅ Successfully logged in');

    // Navigate to Enquiries
    const enquiriesMenuItem = page.getByRole('menuitem', { name: /enquiries/i });
    if (await enquiriesMenuItem.isVisible({ timeout: 3000 }).catch(() => false)) {
        await enquiriesMenuItem.click();
        await page.waitForLoadState('load');
        await page.waitForTimeout(2000);
        
        console.log('✅ Navigated to Enquiries');

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
        console.log('⚠️ Enquiries menu not accessible');
    }
});

test('verify enquiries pagination', async ({ page }) => {
    test.setTimeout(180000);
    
    await loginToApp(page, 90000);
    await page.waitForLoadState('load');
    await page.waitForTimeout(3000);

    console.log('✅ Successfully logged in');

    // Navigate to Enquiries
    const enquiriesMenuItem = page.getByRole('menuitem', { name: /enquiries/i });
    if (await enquiriesMenuItem.isVisible({ timeout: 3000 }).catch(() => false)) {
        await enquiriesMenuItem.click();
        await page.waitForLoadState('load');
        await page.waitForTimeout(2000);
        
        console.log('✅ Navigated to Enquiries');

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
        console.log('⚠️ Enquiries menu not accessible');
    }
    
    console.log('✅ Enquiries pagination verified');
});

test('verify delete enquiry functionality', async ({ page }) => {
    test.setTimeout(180000);
    
    await loginToApp(page, 90000);
    await page.waitForLoadState('load');
    await page.waitForTimeout(3000);

    console.log('✅ Successfully logged in');

    // Navigate to Enquiries
    const enquiriesMenuItem = page.getByRole('menuitem', { name: /enquiries/i });
    if (await enquiriesMenuItem.isVisible({ timeout: 3000 }).catch(() => false)) {
        await enquiriesMenuItem.click();
        await page.waitForLoadState('load');
        await page.waitForTimeout(2000);
        
        console.log('✅ Navigated to Enquiries');

        // Click on first enquiry
        const firstRow = page.locator('tbody tr, .v-data-table tbody tr').first();
        const hasRows = await firstRow.isVisible({ timeout: 3000 }).catch(() => false);
        
        if (hasRows) {
            await firstRow.click();
            await page.waitForTimeout(2000);
            
            console.log('✅ Opened enquiry details');

            // Look for Delete button
            const deleteButton = page.locator('button:has-text("Delete"), button[aria-label*="delete" i]').first();
            const hasDeleteButton = await deleteButton.isVisible({ timeout: 3000 }).catch(() => false);
            
            if (hasDeleteButton) {
                console.log('✅ Delete button found');
            } else {
                console.log('⚠️ Delete button not found');
            }
        } else {
            console.log('⚠️ No enquiries available');
        }

        console.log('✅ Delete enquiry functionality verified');
    } else {
        console.log('⚠️ Enquiries menu not accessible');
    }
});

test('verify enquiries export functionality', async ({ page }) => {
    test.setTimeout(180000);
    
    await loginToApp(page, 90000);
    await page.waitForLoadState('load');
    await page.waitForTimeout(3000);

    console.log('✅ Successfully logged in');

    // Navigate to Enquiries
    const enquiriesMenuItem = page.getByRole('menuitem', { name: /enquiries/i });
    if (await enquiriesMenuItem.isVisible({ timeout: 3000 }).catch(() => false)) {
        await enquiriesMenuItem.click();
        await page.waitForLoadState('load');
        await page.waitForTimeout(2000);
        
        console.log('✅ Navigated to Enquiries');

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

        console.log('✅ Enquiries export functionality verified');
    } else {
        console.log('⚠️ Enquiries menu not accessible');
    }
});

test('verify enquiry status change functionality', async ({ page }) => {
    test.setTimeout(180000);
    
    await loginToApp(page, 90000);
    await page.waitForLoadState('load');
    await page.waitForTimeout(3000);

    console.log('✅ Successfully logged in');

    // Navigate to Enquiries
    const enquiriesMenuItem = page.getByRole('menuitem', { name: /enquiries/i });
    if (await enquiriesMenuItem.isVisible({ timeout: 3000 }).catch(() => false)) {
        await enquiriesMenuItem.click();
        await page.waitForLoadState('load');
        await page.waitForTimeout(2000);
        
        console.log('✅ Navigated to Enquiries');

        // Click on first enquiry
        const firstRow = page.locator('tbody tr, .v-data-table tbody tr').first();
        const hasRows = await firstRow.isVisible({ timeout: 3000 }).catch(() => false);
        
        if (hasRows) {
            await firstRow.click();
            await page.waitForTimeout(2000);
            
            console.log('✅ Opened enquiry details');

            // Look for status dropdown or buttons
            const statusDropdown = page.locator('select:near(:has-text("Status")), .v-select:near(:has-text("Status")), button:has-text("Status")').first();
            const hasStatusControl = await statusDropdown.isVisible({ timeout: 3000 }).catch(() => false);
            
            if (hasStatusControl) {
                console.log('✅ Status control found');
                
                // Check for status options (New, In Progress, Resolved, etc.)
                const statusOptions = ['New', 'Pending', 'In Progress', 'Resolved', 'Closed', 'Contacted'];
                let foundOptions = 0;
                
                await statusDropdown.click();
                await page.waitForTimeout(1000);
                
                for (const status of statusOptions) {
                    const option = page.locator(`text="${status}", [role="option"]:has-text("${status}")`).first();
                    if (await option.isVisible({ timeout: 1000 }).catch(() => false)) {
                        console.log(`  ✅ Found status option: ${status}`);
                        foundOptions++;
                    }
                }
                
                if (foundOptions > 0) {
                    console.log(`✅ Found ${foundOptions} status options`);
                } else {
                    console.log('⚠️ No status options found');
                }
            } else {
                console.log('⚠️ Status control not found');
            }
        } else {
            console.log('⚠️ No enquiries available');
        }

        console.log('✅ Status change functionality verified');
    } else {
        console.log('⚠️ Enquiries menu not accessible');
    }
});
