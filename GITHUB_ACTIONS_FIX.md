# GitHub Actions Auto-Generate Tests - Fix Guide

## Issue Summary
The **Auto-Generate Tests** workflow failed on Monday, January 12, 2026 at 4:37 PM after running for 44 seconds.

## Root Causes

### 1. Missing GitHub Secrets ❌
The workflow requires these environment variables but they might not be set in GitHub:
- `TEST_USERNAME` - Your login username
- `TEST_PASSWORD` - Your login password  
- `BASE_URL` - The application URL to test

### 2. Browser Running in Non-Headless Mode 🖥️
The script in `scripts/auto-generate-tests.ts` line 41 has:
```typescript
this.browser = await chromium.launch({ headless: false });
```

This causes problems on GitHub Actions (Linux server with no display).

## How to Fix

### Step 1: Add GitHub Secrets
1. Go to your GitHub repository: https://github.com/kcPauvivacity/Admin-automation-test-CICD
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add these three secrets:

| Secret Name | Value |
|------------|-------|
| `TEST_USERNAME` | `kiechee@ms.vivacityapp.com` |
| `TEST_PASSWORD` | Your login password |
| `BASE_URL` | `https://admin.ms.vivacityapp.com` (or your app URL) |

### Step 2: Fix Headless Browser Issue
Update `scripts/auto-generate-tests.ts` line 41 to detect CI environment:

**Current code:**
```typescript
this.browser = await chromium.launch({ headless: false });
```

**Fixed code:**
```typescript
// Run headless on CI, headed locally for debugging
const isCI = process.env.CI === 'true';
this.browser = await chromium.launch({ headless: isCI });
```

This will:
- Run headless (no display needed) on GitHub Actions ✅
- Run with visible browser locally for debugging ✅

### Step 3: Apply the Fix
I can help you apply this fix right now!

### Step 4: Test the Fix
After applying:
1. Push the changes to GitHub
2. Manually trigger the workflow:
   - Go to https://github.com/kcPauvivacity/Admin-automation-test-CICD/actions
   - Click **Auto-Generate Tests** workflow
   - Click **Run workflow** button
   - Click green **Run workflow** button
3. Monitor the run to verify it succeeds

## Quick Verification Checklist
- [ ] GitHub Secrets added (TEST_USERNAME, TEST_PASSWORD, BASE_URL)
- [ ] Script updated to use `headless: isCI`  
- [ ] Changes committed and pushed
- [ ] Manual workflow test successful ✅

## Expected Behavior After Fix
- ✅ Workflow runs successfully every Monday at 8 AM UTC
- ✅ Scans for new modules in the application
- ✅ Generates test files for any new modules found
- ✅ Creates pull request if new tests are generated
- ✅ Generates manual test cases documentation

## Need More Help?
If the workflow still fails after these fixes, check the detailed error logs:
1. Go to https://github.com/kcPauvivacity/Admin-automation-test-CICD/actions
2. Click the failed run
3. Click the failed job
4. Expand the failing step to see detailed error messages
