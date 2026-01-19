# 🔍 Troubleshooting Pipeline Test Failures

## Common Reasons Tests Fail in CI/CD:

### 1. ❌ Missing or Incorrect Secrets/Variables

**For GitHub Actions:**
Check if you added the new secret names:
- Go to: https://github.com/kcPauvivacity/Admin-automation-test-CICD/settings/secrets/actions
- Verify these exist:
  - ✅ `USERNAME`
  - ✅ `PASSWORD`
  - ✅ `URL`

**For Azure DevOps:**
Check if you renamed the variables:
- Go to: https://dev.azure.com/vivacityapp/Viva/_library?itemType=VariableGroups
- Open `playwright-secrets` variable group
- Variables should be named:
  - ✅ `USERNAME` (not TEST_USERNAME)
  - ✅ `PASSWORD` (not TEST_PASSWORD)
  - ✅ `URL` (not BASE_URL)

### 2. ❌ Login Issues

If tests are failing at login:
- Credentials might be wrong
- Password might have changed
- URL might be incorrect
- Network/firewall blocking CI server

**Quick Test:**
Run locally with same credentials:
```bash
USERNAME=your@email.com PASSWORD=yourpass URL=https://your-url.com npm test
```

### 3. ❌ Timeout Issues

CI/CD environments are slower than local machines:
- Tests might need longer timeouts
- Network latency higher
- Server might be slow to respond

**Check:** Look for "Timeout" in error messages

### 4. ❌ Headless Browser Issues

Some tests might work locally (with display) but fail headless:
- Pop-ups not handled
- Elements positioned differently
- Animations causing timing issues

### 5. ❌ Application Unavailable

- The application URL might be down
- VPN required but not available in CI
- IP restrictions blocking CI server

## 🔧 How to Debug:

### Step 1: Check the Logs

**GitHub Actions:**
1. Go to: https://github.com/kcPauvivacity/Admin-automation-test-CICD/actions
2. Click the failed workflow run
3. Click the failed job
4. Look at the error messages

**Azure DevOps:**
1. Go to: https://dev.azure.com/vivacityapp/Viva/_build
2. Click the failed pipeline
3. Look at the logs for error messages

### Step 2: Look for Specific Errors

Common error patterns:
- `"USERNAME is not defined"` → Secret not set
- `"Timeout waiting for"` → Element not found or slow
- `"net::ERR_NAME_NOT_RESOLVED"` → Wrong URL
- `"Invalid username or password"` → Wrong credentials
- `"Navigation timeout"` → Application not responding

### Step 3: Check Environment Variables

Add this to your workflow to debug:
```yaml
- name: Debug Environment
  run: |
    echo "USERNAME set: ${{ env.USERNAME != '' }}"
    echo "PASSWORD set: ${{ env.PASSWORD != '' }}"
    echo "URL set: ${{ env.URL != '' }}"
```

### Step 4: Run a Single Test

Modify the workflow to run just one test:
```yaml
run: npx playwright test tests/login.test.ts
```

If login fails, the credentials are wrong.

## 🎯 Most Likely Issues:

### Issue #1: Secrets Not Updated ⚠️

After we renamed variables from `TEST_USERNAME` → `USERNAME`, you need to:

**GitHub:**
- Delete old secrets (TEST_USERNAME, TEST_PASSWORD, BASE_URL)
- Add new secrets (USERNAME, PASSWORD, URL)

**Azure DevOps:**
- Rename variables in variable group
- Or update pipelines to use old names

### Issue #2: Wrong Credentials

The credentials might be:
- Expired/changed
- Wrong environment (staging vs production)
- Missing special characters (escaped incorrectly)

## 🚀 Quick Fixes:

### Fix 1: Verify Secrets Are Set

**GitHub Actions - Test Secrets Workflow:**
1. Go to: https://github.com/kcPauvivacity/Admin-automation-test-CICD/actions
2. Run the "Test Secrets" workflow
3. Check if it shows ✅ for all 3 secrets

### Fix 2: Test Login Locally

```bash
cd /Users/paukiechee/Applications
USERNAME=your@email.com PASSWORD=yourpass URL=https://admin.ms.vivacityapp.com npx playwright test tests/login.test.ts --headed
```

If this fails, credentials are wrong.

### Fix 3: Check Recent Changes

```bash
cd /Users/paukiechee/Applications
git log --oneline -10
```

See if any recent changes broke the tests.

## 📊 What I Need to Help You:

Please share:
1. **Which pipeline?** GitHub Actions or Azure DevOps?
2. **Error message** from the logs
3. **When did it start failing?** After which change?
4. **Do tests pass locally?** Run: `npm test`

Once you share the error message, I can give you the exact fix! 🎯
