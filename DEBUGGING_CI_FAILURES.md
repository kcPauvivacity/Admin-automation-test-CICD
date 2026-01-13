# Why Tests Pass Locally But Fail in CI/CD

## Common Causes & Solutions

### 1. 🔐 **Environment Variables / Credentials**

**Problem:** GitHub Secrets might be incorrect or missing

**Your Setup:**
- Local: Uses default values from `auth.helper.ts`
  - LOGIN_URL: `https://app-staging.vivacityapp.com`
  - USERNAME: `kc@vivacityapp.com`
  - PASSWORD: `PAOpaopao@9696`
  
- CI/CD: Uses GitHub Secrets
  - `URL` secret
  - `USERNAME` secret
  - `PASSWORD` secret

**How to Check:**
1. Go to: https://github.com/kcPauvivacity/Admin-automation-test-CICD/settings/secrets/actions
2. Verify these secrets exist and have correct values:
   - `URL` = `https://app-staging.vivacityapp.com`
   - `USERNAME` = `kc@vivacityapp.com`
   - `PASSWORD` = `PAOpaopao@9696`

**⚠️ CRITICAL:** If any secret is wrong, tests will fail to login!

---

### 2. ⏱️ **Timing Issues**

**Problem:** CI environment is slower than local machine

**Configuration Differences:**
- Local: No timeout restrictions, unlimited workers
- CI: 180s timeout per test, only 2 parallel workers

**Common Issues:**
- Pages load slower in CI
- Network requests take longer
- Element animations/transitions take more time

**Solution:** Check if any tests are timing out in CI

---

### 3. 🌐 **Network/Firewall Issues**

**Problem:** GitHub Actions runners might have different network access

**Possible Issues:**
- Staging server might block GitHub IPs
- API rate limiting
- Different DNS resolution

**How to Check:**
Look in GitHub Actions logs for:
- "Connection refused"
- "Network timeout"
- "DNS resolution failed"

---

### 4. 💾 **State Management / Test Dependencies**

**Problem:** Tests run in different order or parallel execution causes conflicts

**Your Setup:**
- CI runs 2 tests in parallel (`workers: 2`)
- Local runs all tests in parallel (`workers: undefined`)

**Common Issues:**
- Tests share data/state
- Database records created by one test affect another
- Race conditions in parallel execution

**Solution:**
- Ensure each test is independent
- Use unique test data for each test
- Clean up after tests

---

### 5. 🖼️ **Browser/Viewport Differences**

**Problem:** CI uses headless mode, local might use headed mode

**Potential Issues:**
- Screenshot comparisons fail
- Viewport size differences
- Fonts/rendering differences

---

### 6. 📦 **Dependency Versions**

**Problem:** Different package versions between local and CI

**How to Check:**
```bash
# Compare local vs CI npm versions
npm list --depth=0
```

---

## 🔍 How to Debug CI Failures

### Step 1: Check GitHub Actions Logs
1. Go to: https://github.com/kcPauvivacity/Admin-automation-test-CICD/actions
2. Click on the failed workflow run
3. Click on "Run Playwright tests" step
4. Look for error messages

### Step 2: Download Artifacts
1. In the failed workflow, scroll to bottom
2. Download "playwright-report" artifact
3. Open `index.html` to see:
   - Screenshots of failures
   - Videos of failed tests
   - Detailed error messages
   - Stack traces

### Step 3: Check Test Results JSON
1. Download "test-results" artifact
2. Look at `test-results.json` for:
   - Which specific tests failed
   - Error messages
   - Test duration (timeouts?)

### Step 4: Enable Debug Logging
Add this to `.github/workflows/playwright-tests.yml`:

```yaml
- name: Run Playwright tests
  env:
    DEBUG: pw:api  # Enable Playwright debug logs
    USERNAME: ${{ secrets.USERNAME }}
    PASSWORD: ${{ secrets.PASSWORD }}
    URL: ${{ secrets.URL }}
```

---

## 🚀 Quick Fixes to Try

### Fix 1: Verify GitHub Secrets
```bash
# Test if secrets are set correctly by adding this to workflow:
- name: Debug secrets
  run: |
    echo "URL is set: ${{ secrets.URL != '' }}"
    echo "USERNAME is set: ${{ secrets.USERNAME != '' }}"
    echo "PASSWORD is set: ${{ secrets.PASSWORD != '' }}"
```

### Fix 2: Increase Timeouts
Edit `playwright.config.ts`:
```typescript
timeout: 300000, // Increase to 5 minutes
```

### Fix 3: Reduce Parallelization
Edit `playwright.config.ts`:
```typescript
workers: process.env.CI ? 1 : undefined, // Run serially in CI
```

### Fix 4: Add More Retries
Edit `playwright.config.ts`:
```typescript
retries: process.env.CI ? 2 : 0, // Retry twice on CI
```

---

## 📊 Next Steps

1. **Check the latest GitHub Actions run** to see specific error messages
2. **Download the HTML report** from artifacts to see screenshots/videos
3. **Verify GitHub Secrets** are correct
4. **Look for timeout errors** - might need to increase timeout values
5. **Check for authentication failures** - most common issue!

---

## 🆘 Most Likely Issue

Based on your setup, the **#1 most likely issue** is:

### ❌ GitHub Secrets are not set or incorrect

**Action Required:**
1. Go to: https://github.com/kcPauvivacity/Admin-automation-test-CICD/settings/secrets/actions
2. Verify all 3 secrets exist with correct values
3. If they don't exist or values are wrong, create/update them
4. Re-run the workflow

**How to test locally with same environment as CI:**
```bash
export URL="https://app-staging.vivacityapp.com"
export USERNAME="kc@vivacityapp.com"
export PASSWORD="PAOpaopao@9696"
export CI=true

npx playwright test
```

This will run tests exactly as they run in CI!
