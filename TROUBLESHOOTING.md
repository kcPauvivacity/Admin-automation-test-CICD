# Workflow Troubleshooting Guide

## Common Workflow Failures and Solutions

### 1. Check Which Step Failed

Go to the failed workflow run and identify which step has the ❌:

#### **Step: "Install dependencies" failed**
**Error:** `npm ci` failed or package-lock.json issues

**Solution:**
```bash
# Regenerate package-lock.json locally
rm package-lock.json
npm install
git add package-lock.json
git commit -m "Regenerate package-lock.json"
git push
```

---

#### **Step: "Install Playwright Browsers" failed**
**Error:** Timeout or browser installation issues

**Solution:** Usually just retry the workflow. This is often a temporary issue.
- Click "Re-run failed jobs" button in GitHub Actions

---

#### **Step: "Run Playwright tests" failed**
**Error:** Tests timing out or login failing

**Possible causes:**
1. **Secrets not set correctly** - Check all 6 secrets exist
2. **Wrong credentials** - Verify USERNAME and PASSWORD are correct
3. **Base URL wrong** - Check URL is correct
4. **Network timeout** - Tests take longer on CI

**Solution:** Check the test logs for specific error messages

---

#### **Step: "Send email report" failed**
**Error:** Email sending failed

**Possible causes:**
1. EMAIL_USER not a Gmail address
2. EMAIL_PASSWORD is wrong (needs App Password, not regular password)
3. EMAIL_RECIPIENTS has invalid email format

**Solution:** 
- Verify Gmail App Password (16 characters)
- Check EMAIL_RECIPIENTS format: `email1@example.com,email2@example.com`

---

### 2. Get Detailed Error Information

**Where to look:**
1. Go to: https://github.com/kcPauvivacity/Admin-automation-test-CICD/actions
2. Click on the failed workflow run
3. Click on the "test" or "debug" job
4. Expand the failed step (red X)
5. Read the error message

**Common error messages:**

| Error Message | What It Means | Fix |
|--------------|---------------|-----|
| `Error: Timeout of 30000ms exceeded` | Test took too long | Already fixed - increased timeout to 180s |
| `Error: browserType.launch: Executable doesn't exist` | Browser not installed | Re-run workflow, should work on retry |
| `Error: page.goto: net::ERR_NAME_NOT_RESOLVED` | Wrong URL or network issue | Check URL secret |
| `Error: locator.click: Timeout 30000ms exceeded` | Login page element not found | Check if app is accessible, credentials correct |
| `Authentication failed` | Wrong email credentials | Check EMAIL_USER and EMAIL_PASSWORD |
| `npm ERR! code ELIFECYCLE` | npm command failed | Check package.json and dependencies |

---

### 3. Quick Fixes to Try

#### **Fix 1: Ensure all secrets are set**
Go to: https://github.com/kcPauvivacity/Admin-automation-test-CICD/settings/secrets/actions

Should see:
- ✅ URL
- ✅ EMAIL_PASSWORD  
- ✅ EMAIL_RECIPIENTS
- ✅ EMAIL_USER
- ✅ PASSWORD
- ✅ USERNAME

#### **Fix 2: Check secret values are correct**

**USERNAME:** `kc@vivacityapp.com`
**PASSWORD:** `PAOpaopao@9696`
**URL:** `https://app-staging.vivacityapp.com`
**EMAIL_USER:** Your Gmail (e.g., `yourname@gmail.com`)
**EMAIL_PASSWORD:** 16-character App Password (e.g., `abcdefghijklmnop`)
**EMAIL_RECIPIENTS:** Email addresses separated by comma (e.g., `user1@email.com,user2@email.com`)

#### **Fix 3: Re-run the workflow**
Sometimes it's just a temporary issue:
1. Go to the failed run
2. Click "Re-run failed jobs" (top right)
3. Wait for it to complete

---

### 4. Run Debug Workflow First

The debug workflow runs just 1 test and shows detailed information:

1. Go to: https://github.com/kcPauvivacity/Admin-automation-test-CICD/actions
2. Click "Debug Playwright Tests" (left sidebar)
3. Click "Run workflow"
4. This will show:
   - ✅ Which secrets are set (true/false)
   - ✅ What files exist
   - ✅ What's installed
   - ✅ Single test result with detailed logs

---

### 5. Specific Error Scenarios

#### **Scenario A: All secrets show "false" in debug**
**Problem:** Secrets not added or wrong names

**Fix:** 
- Check secret names are EXACTLY: `USERNAME`, `PASSWORD`, `URL`, `EMAIL_USER`, `EMAIL_PASSWORD`, `EMAIL_RECIPIENTS`
- Names are case-sensitive!

#### **Scenario B: Tests fail but workflow completes**
**This is NORMAL!** 
- Tests are set to `continue-on-error: true`
- Email report will still be sent
- Some test failures are expected

#### **Scenario C: Email not received**
**Check:**
1. Spam folder
2. EMAIL_PASSWORD is Gmail App Password (not your regular Gmail password)
3. 2-Step Verification is enabled on Gmail
4. EMAIL_RECIPIENTS has valid email addresses

---

### 6. What to Share for Help

If you need help, share:

1. **Which workflow failed?**
   - "Playwright Tests" or "Debug Playwright Tests"

2. **Which step failed?**
   - Name of the step with red X

3. **Error message:**
   - Copy the error text from the failed step

4. **Screenshot:**
   - Screenshot of the failed step would help

---

## Quick Checklist

- [ ] All 6 secrets added to GitHub
- [ ] Secret names are correct (case-sensitive)
- [ ] USERNAME and PASSWORD match your app login
- [ ] URL is correct
- [ ] EMAIL_PASSWORD is Gmail App Password (16 chars)
- [ ] 2-Step Verification enabled on Gmail
- [ ] Tried re-running the workflow
- [ ] Tried debug workflow first

---

## Need More Help?

Share with me:
1. Which step failed? (step name)
2. What's the error message? (copy the text)
3. Did all 6 secrets show "true" in debug workflow?

I'll help you fix it! 🚀
