# 🔧 Fix GitHub Secrets - Step by Step Guide

## 🚨 Problem Identified

Your tests are failing with this error:
```
Error: page.goto: net::ERR_ABORTED at name: BASE_URLSecret: https://app-staging.vivacityapp.com
```

**Root Cause:** The `BASE_URL` GitHub Secret is **NOT SET** or is empty.

---

## ✅ Solution: Set Up GitHub Secrets

### Step 1: Go to GitHub Secrets Settings

Click this link to open the secrets page:
**https://github.com/kcPauvivacity/Admin-automation-test-CICD/settings/secrets/actions**

Or manually navigate:
1. Go to your repository: https://github.com/kcPauvivacity/Admin-automation-test-CICD
2. Click **Settings** (top menu)
3. Click **Secrets and variables** → **Actions** (left sidebar)

---

### Step 2: Add or Update These Secrets

You need to create/update **3 secrets**:

#### Secret 1: BASE_URL
- Click **"New repository secret"** (or edit if exists)
- Name: `BASE_URL`
- Value: `https://app-staging.vivacityapp.com`
- Click **"Add secret"**

#### Secret 2: TEST_USERNAME
- Click **"New repository secret"** (or edit if exists)
- Name: `TEST_USERNAME`
- Value: `kc@vivacityapp.com`
- Click **"Add secret"**

#### Secret 3: TEST_PASSWORD
- Click **"New repository secret"** (or edit if exists)
- Name: `TEST_PASSWORD`
- Value: `PAOpaopao@9696` (use your actual password)
- Click **"Add secret"**

---

### Step 3: Verify Secrets Are Set

After adding all 3 secrets, you should see:
- ✅ BASE_URL
- ✅ TEST_USERNAME
- ✅ TEST_PASSWORD

**Important:** You won't be able to see the values (they're hidden for security), but the names should be visible.

---

### Step 4: Run Tests Again

1. Go to: https://github.com/kcPauvivacity/Admin-automation-test-CICD/actions/workflows/playwright-tests.yml
2. Click **"Run workflow"**
3. Select branch: **main**
4. Click **"Run workflow"** (green button)

The debug step will now show:
```
✅ BASE_URL is set: true
✅ TEST_USERNAME is set: true
✅ TEST_PASSWORD is set: true
```

---

## 📸 Screenshots/Videos Issue

The email says "Check attached HTML report for screenshots and videos" but you can't see them. Here's why:

### Where to Find Screenshots/Videos:

**Option 1: Download from GitHub Actions**
1. Go to the completed workflow run
2. Scroll to bottom → **Artifacts** section
3. Download **"playwright-report"** zip file
4. Unzip and open `index.html`
5. Click on failed tests → Screenshots and videos will be there

**Option 2: Wait for Next Version**
We can enhance the email to include screenshots directly in the email body (advanced feature).

---

## 🔍 Why Tests Pass Locally But Fail in CI

### Local Environment:
```typescript
// From tests/helpers/auth.helper.ts
export const LOGIN_URL = process.env.BASE_URL || 'https://app-staging.vivacityapp.com';
```

When you run tests locally:
- `process.env.BASE_URL` is **undefined**
- So it uses the **fallback** → `'https://app-staging.vivacityapp.com'`
- ✅ Tests work!

### CI Environment (Before Fix):
- `process.env.BASE_URL` is **undefined** (secret not set)
- Uses fallback → `'https://app-staging.vivacityapp.com'`
- But GitHub Actions environment has issues with the URL
- ❌ Tests fail with network error!

### CI Environment (After Fix):
- `process.env.BASE_URL` = `'https://app-staging.vivacityapp.com'` (from secret)
- ✅ Tests should work!

---

## 🎯 Expected Result After Fix

Once you set the secrets and run tests again, you should see:

1. ✅ All tests pass (or most pass)
2. ✅ Email shows correct statistics
3. ✅ No more "BASE_URLSecret" errors
4. ✅ Screenshots/videos available in downloaded HTML report

---

## 🆘 If Tests Still Fail After Setting Secrets

Check these in the workflow run logs:

1. **Debug step output** - Should show "true" for all secrets
2. **Error messages** - Look for different error types:
   - Authentication errors → Password might be wrong
   - Timeout errors → Increase timeout in `playwright.config.ts`
   - Element not found → Selectors might need updating

3. **Download HTML report** to see visual evidence of failures

---

## 📞 Need More Help?

If tests still fail after setting secrets:
1. Share the new error message from the email
2. Download and check the HTML report
3. Look at the debug step output in GitHub Actions logs

The error message in the email will now show detailed troubleshooting hints! 🎉
