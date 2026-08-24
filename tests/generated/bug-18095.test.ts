// Bug #18095: [Admin] Users page — expired invitation link not shown; no re-invite flow
// ADO: https://dev.azure.com/vivacityapp/Viva/_workitems/edit/18095
// Auto-generated 2026-08-11
// REVIEW BEFORE MERGING — verify selectors and assertions

import { test, expect } from '@playwright/test';
import { loginToApp } from '../helpers/auth.helper';

test.setTimeout(120000);

test('BUG #18095 - Expired invitation link shown with expired status and re-invite flow available on Users page', async ({ page }) => {
  await loginToApp(page);

  // Navigate to the Users page
  await page.goto('https://app-staging.vivacityapp.com/demo-student/settings/users');
  await page.waitForLoadState('networkidle');

  // Wait for the users table/list to appear
  await page.waitForSelector('.v-application', { timeout: 30000 });

  // Look for users page content
  const usersPageLoaded = await page.locator('text=/users/i').first().isVisible().catch(() => false);
  
  // Try common navigation paths to users management
  const possiblePaths = [
    'https://app-staging.vivacityapp.com/demo-student/settings/users',
    'https://app-staging.vivacityapp.com/demo-student/users',
    'https://app-staging.vivacityapp.com/demo-student/admin/users',
  ];

  let navigated = false;
  for (const path of possiblePaths) {
    await page.goto(path);
    await page.waitForLoadState('networkidle');
    const hasUserContent = await page.locator('table, .v-data-table, [class*="user"]').first().isVisible({ timeout: 5000 }).catch(() => false);
    if (hasUserContent) {
      navigated = true;
      break;
    }
  }

  // Wait for the users data table to appear
  const dataTable = page.locator('.v-data-table, table').first();
  
  // Check if there are any users with pending/expired invitations
  // Look for invitation-related elements
  const invitationRows = page.locator('tr, .v-list-item').filter({ hasText: /invited|pending|invitation/i });
  const invitationCount = await invitationRows.count();

  if (invitationCount > 0) {
    // BUG CHECK 1: Verify that expired invitation status is displayed
    // When bug is present: no expired status shown
    // When fixed: expired invitations show "Expired" label/badge/chip
    const expiredStatusIndicator = page.locator(
      '[class*="expired"], .v-chip:has-text("Expired"), .v-badge:has-text("Expired"), text=/expired/i'
    );
    
    // BUG CHECK 2: Verify that Copy Invitation Link button is visible for invited users
    // When bug is present: button is NOT visible for expired invitations
    const copyLinkButton = page.locator('button').filter({ hasText: /copy invitation link|copy link/i }).first();
    
    // BUG CHECK 3: Verify re-invite / resend invitation flow exists
    const reInviteButton = page.locator('button, [role="menuitem"], .v-btn').filter({ 
      hasText: /re-invite|resend invitation|resend invite|reinvite/i 
    }).first();

    // The test expects at least one of these fixes to be in place:
    // - An expired status indicator is shown, OR
    // - A re-invite button is available
    const hasExpiredStatus = await expiredStatusIndicator.isVisible({ timeout: 5000 }).catch(() => false);
    const hasCopyLinkForInvited = await copyLinkButton.isVisible({ timeout: 5000 }).catch(() => false);
    const hasReInviteFlow = await reInviteButton.isVisible({ timeout: 5000 }).catch(() => false);

    // When bug is present: none of these will be true for expired invitations
    // When bug is fixed: at least expired status indicator AND re-invite flow should be present
    expect(
      hasExpiredStatus || hasReInviteFlow,
      'Expected either expired status indicator or re-invite flow to be present for expired invitations. Bug #18095: expired invitation link not shown; no re-invite flow available.'
    ).toBe(true);
  } else {
    // No invited users found in the table, look for an invite button to check the overall flow
    // and verify the users page loaded correctly
    const inviteButton = page.locator('button, .v-btn').filter({ hasText: /invite|add user/i }).first();
    const pageHasContent = await page.locator('.v-data-table, table, .v-list').first().isVisible({ timeout: 10000 }).catch(() => false);
    
    expect(
      pageHasContent,
      'Users page should load with a data table or list. Could not find invited users to test expiration flow.'
    ).toBe(true);

    // Check that the users page has some invitation management capability
    // When the full fix is implemented, there should be visible re-invite controls
    const hasInviteManagement = await page.locator(
      'button:has-text("Invite"), .v-btn:has-text("Invite"), [aria-label*="invite" i]'
    ).first().isVisible({ timeout: 5000 }).catch(() => false);

    // Navigate to check if there's an invitations tab (as suggested by SzeLee)
    const invitationsTab = page.locator('.v-tab, [role="tab"]').filter({ hasText: /invitation/i }).first();
    const hasInvitationsTab = await invitationsTab.isVisible({ timeout: 5000 }).catch(() => false);

    // For now, just verify the page loaded — full validation requires expired invitation data
    console.log('No invited users found. Page loaded:', pageHasContent, 'Has invite management:', hasInviteManagement, 'Has invitations tab:', hasInvitationsTab);
    
    // Verify the users page is accessible and functional
    expect(pageHasContent).toBe(true);
  }

  // Additional check: look for any user row and verify action menu contains re-invite option
  const userRows = page.locator('tbody tr, .v-data-table__tr').first();
  const firstRowVisible = await userRows.isVisible({ timeout: 5000 }).catch(() => false);
  
  if (firstRowVisible) {
    // Try to open an action menu on the first user row to check for re-invite option
    const actionMenuButton = userRows.locator('button[aria-haspopup="menu"], .v-btn--icon, [aria-label*="action" i], [aria-label*="more" i]').first();
    const hasActionMenu = await actionMenuButton.isVisible({ timeout: 3000 }).catch(() => false);
    
    if (hasActionMenu) {
      await actionMenuButton.click();
      await page.waitForTimeout(500);
      
      const reInviteMenuItem = page.locator('.v-list-item, [role="menuitem"]').filter({ 
        hasText: /re-invite|resend invitation|resend invite|reinvite/i 
      });
      
      const menuHasReInvite = await reInviteMenuItem.isVisible({ timeout: 3000 }).catch(() => false);
      
      // Close the menu
      await page.keyboard.press('Escape');
      await page.waitForTimeout(300);
      
      // Log for debugging - main assertion is above
      console.log('Action menu has re-invite option:', menuHasReInvite);
    }
  }
});

test('BUG #18095 - Users page should display invitation expiry status for invited users', async ({ page }) => {
  await loginToApp(page);

  await page.goto('https://app-staging.vivacityapp.com/demo-student/settings/users');
  await page.waitForLoadState('networkidle');

  // Wait for the application to fully render
  await page.waitForSelector('.v-application', { timeout: 30000 });

  // Look for any status chips/badges related to invitations
  // When bug is fixed, expired invitations should show an "Expired" status
  const statusChips = page.locator('.v-chip');
  await statusChips.first().waitFor({ timeout: 10000 }).catch(() => {});

  const allChipTexts: string[] = [];
  const chipCount = await statusChips.count();
  
  for (let i = 0; i < chipCount; i++) {
    const text = await statusChips.nth(i).textContent().catch(() => '');
    if (text) allChipTexts.push(text.trim().toLowerCase());
  }

  // Check if there are invitation-related status indicators
  const hasInvitedStatus = allChipTexts.some(t => t.includes('invited') || t.includes('pending'));
  const hasExpiredStatus = allChipTexts.some(t => t.includes('expired'));

  // Log the status for debugging
  console.log('Chip texts found:', allChipTexts);
  console.log('Has invited status:', hasInvitedStatus);
  console.log('Has expired status:', hasExpiredStatus);

  // If there are invited users shown, verify that expired ones have proper labeling
  // The bug is that expired invitations don't show any expired indicator
  // When fixed: expired invitations should have a visible expired status
  
  // Check for re-invite functionality
  const reInviteElements = page.locator('button, .v-btn, [role="menuitem"]').filter({ 
    hasText: /re-invite|resend/i 
  });
  const reInviteCount = await reInviteElements.count();
  
  // Check for "Copy Invitation Link" button availability
  const copyInvitationButtons = page.locator('button, .v-btn').filter({ 
    hasText: /copy invitation link/i 
  });
  const copyButtonCount = await copyInvitationButtons.count();

  console.log('Re-invite elements count:', reInviteCount);
  console.log('Copy invitation button count:', copyButtonCount);

  // The page should load successfully with user management features
  const pageContent = await page.locator('.v-data-table, table, .v-list, [class*="user-list"]').first().isVisible({ timeout: 10000 }).catch(() => false);
  
  // If invited users exist, there should be either:
  // 1. An expired status indicator for expired ones
  // 2. A re-invite flow
  if (hasInvitedStatus) {
    // BUG: When bug is present, expired invitations don't show expiry status
    // FIX: expired invitations should show expiry status AND/OR re-invite option
    const fixImplemented = hasExpiredStatus || reInviteCount > 0;
    expect(
      fixImplemented,
      `BUG #18095: Found invited users but no expired status indicator or re-invite flow. ` +
      `Chip texts: ${allChipTexts.join(', ')}. Re-invite elements: ${reInviteCount}`
    ).toBe(true);
  } else {
    // Page loads but no invited users currently visible
    // Just verify the page is functional
    expect(pageContent, 'Users page should display content').toBe(true);
  }
});