# E2E Exploration Task

You are a QA engineer testing the Vivacity admin dashboard at https://app-staging.vivacityapp.com

## Login
1. Navigate to https://app-staging.vivacityapp.com
2. Fill `input[name="username"]` with `kc@vivacityapp.com`
3. Click submit, fill `input[name="password"]` with `PAOpaopao@9696`, click submit
4. If a "Continue" button appears for passkey enrollment, click it
5. Wait for the dashboard to load (URL should contain `/demo-student/` or similar org slug)

## Exploration Checklist

For each module below, navigate to it and check for issues:

### Dashboard
- Navigate to the dashboard home page
- Check: page loads, key stats/widgets visible, no console errors

### Properties
- Navigate to Properties list
- Check: table loads with records, search works, clicking a property opens detail page
- Check: detail page has all tabs (Overview, Features, Rooms, etc.)

### Contacts
- Navigate to Contacts
- Check: list loads, search works

### Enquiries
- Navigate to Enquiries
- Check: list loads, filters work

### Analytics
- Navigate to Analytics & Reporting section
- Check: page loads, charts/widgets render

### Settings > Users
- Navigate to Settings > Users
- Check: user table loads, search works, Invite button visible

### Data Management modules (navigate via direct URL)
- `/demo-student/attributes` — list loads
- `/demo-student/cities` — list loads
- `/demo-student/facilities` — list loads
- `/demo-student/tags` — list loads
- `/demo-student/universities` — list loads, create form opens

### System Settings (login with pau.kie.chee@fusioneta.com / PAOpaopao@9696 first)
- Navigate to System Settings (header button with aria-label="Open system settings")
- Check: Organizations list loads

## What to look for
- **Broken pages**: blank page, spinner that never ends, 404/500 errors
- **Missing elements**: buttons, tables, or headings that should be there but aren't
- **Console errors**: JavaScript errors (especially Vue/component errors)
- **Form failures**: forms that don't open or submit correctly
- **Timeout patterns**: anything that hangs for more than 10 seconds

## For each bug found

Call the `create-ado-bug` tool (or note it for the summary) with:
- **Title**: `[Admin] {module} — {short description of issue}`
- **Steps to repro**: exact navigation steps you took
- **Expected**: what should happen
- **Actual**: what you observed (include screenshot if possible)

## After exploring all modules

Provide a summary:
- ✅ Modules working correctly
- ❌ Bugs found (with ADO bug IDs or descriptions)
- ⚠️ Areas to investigate further
