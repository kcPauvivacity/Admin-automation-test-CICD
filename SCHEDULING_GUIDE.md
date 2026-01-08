# CI/CD Scheduling Guide

This document explains all the automated schedules configured for your test automation.

---

## 📅 Current Schedules

### 1. **Daily Test Runs** (playwright-tests.yml)
**Schedule:** Every day at 9 AM UTC  
**Cron:** `0 9 * * *`  
**What it does:**
- ✅ Runs all existing test files
- ✅ Optionally auto-generates tests for new modules (if enabled)
- ✅ Sends email report with screenshots/videos for failed tests
- ✅ Uploads test results to GitHub Artifacts

**Triggers:**
- Scheduled: Daily at 9 AM UTC
- Manual: Can be triggered from GitHub Actions tab
- Push: Runs on push to main/master branch
- Pull Request: Runs on PRs to main/master

---

### 2. **Weekly Auto-Generation** (auto-generate-tests.yml) - NEW!
**Schedule:** Every Monday at 8 AM UTC  
**Cron:** `0 8 * * 1`  
**What it does:**
- 🤖 Scans website for new modules
- 🆕 Auto-generates test files for detected modules
- 📝 Creates automatic Pull Request if new tests found
- 📊 Uploads generation report

**Triggers:**
- Scheduled: Every Monday at 8 AM UTC
- Manual: Can be triggered from GitHub Actions tab

---

## 🕐 Schedule Customization

### Change Schedule Times

Edit the cron expression in the workflow file:

```yaml
schedule:
  - cron: '0 9 * * *'  # minute hour day month day-of-week
```

### Common Cron Examples:

```bash
# Every day at 9 AM UTC
0 9 * * *

# Every day at 6 PM UTC
0 18 * * *

# Every Monday at 8 AM UTC
0 8 * * 1

# Every weekday (Mon-Fri) at 9 AM UTC
0 9 * * 1-5

# Twice a day (9 AM and 9 PM UTC)
0 9,21 * * *

# Every 6 hours
0 */6 * * *

# First day of every month at midnight UTC
0 0 1 * *
```

### Timezone Conversion:

GitHub Actions uses **UTC time**. Convert your local time:

| Your Time | UTC Equivalent | Cron |
|-----------|----------------|------|
| 9 AM EST (UTC-5) | 2 PM UTC | `0 14 * * *` |
| 9 AM PST (UTC-8) | 5 PM UTC | `0 17 * * *` |
| 9 AM CET (UTC+1) | 8 AM UTC | `0 8 * * *` |
| 9 AM SGT (UTC+8) | 1 AM UTC | `0 1 * * *` |

---

## 🎯 Recommended Configurations

### Option 1: Frequent Testing (Current Setup)
```yaml
# playwright-tests.yml
schedule:
  - cron: '0 9 * * *'  # Daily test runs

# auto-generate-tests.yml  
schedule:
  - cron: '0 8 * * 1'  # Weekly module scan
```

**Best for:** Active development, frequent updates

---

### Option 2: Business Hours Only
```yaml
# playwright-tests.yml
schedule:
  - cron: '0 9 * * 1-5'  # Weekdays only at 9 AM UTC

# auto-generate-tests.yml
schedule:
  - cron: '0 8 * * 1'  # Monday scan
```

**Best for:** Standard work week, reduce weekend noise

---

### Option 3: Multiple Daily Runs
```yaml
# playwright-tests.yml
schedule:
  - cron: '0 9,15 * * *'  # 9 AM and 3 PM UTC

# auto-generate-tests.yml
schedule:
  - cron: '0 8 * * 1,4'  # Monday and Thursday
```

**Best for:** Critical applications, quick feedback

---

### Option 4: Minimal (Weekly Only)
```yaml
# playwright-tests.yml
schedule:
  - cron: '0 9 * * 1'  # Monday only

# auto-generate-tests.yml
schedule:
  - cron: '0 8 * * 1'  # Monday scan
```

**Best for:** Stable apps, reduce CI/CD costs

---

## 🔧 Enable/Disable Features

### Disable Auto-Generation in Daily Tests

Edit `.github/workflows/playwright-tests.yml`:

**To disable:**
```yaml
# Comment out or remove this step:
# - name: Auto-generate tests for new modules (Optional)
#   env:
#     ...
#   run: |
#     npm run generate-tests
```

**To enable:**
```yaml
- name: Auto-generate tests for new modules (Optional)
  env:
    TEST_USERNAME: ${{ secrets.TEST_USERNAME }}
    TEST_PASSWORD: ${{ secrets.TEST_PASSWORD }}
    BASE_URL: ${{ secrets.BASE_URL }}
  run: |
    npm run generate-tests
  continue-on-error: true
```

---

### Disable Email Reports

Edit `.github/workflows/playwright-tests.yml`:

**To disable:**
```yaml
# Comment out the email step:
# - name: Send email report
#   if: always()
#   env: ...
```

**To disable for successful runs only (email on failures only):**
```yaml
- name: Send email report
  if: failure()  # Changed from: always()
  env: ...
```

---

## 📊 Monitoring & Reports

### View Schedule Runs

1. Go to your GitHub repository
2. Click **Actions** tab
3. Select workflow (Playwright Tests or Auto-Generate Tests)
4. View run history and schedules

### Manual Trigger

1. Go to **Actions** tab
2. Select workflow
3. Click **Run workflow** button
4. Choose branch and click **Run workflow**

### Email Reports

Email reports are sent automatically after each test run to configured recipients:
- ✅ HTML summary of test results
- 📸 Screenshots of failed tests
- 🎥 Videos of failed tests

Configure recipients in GitHub Secrets:
- `EMAIL_RECIPIENTS` - Comma-separated email addresses

---

## 🚀 Quick Setup Checklist

### To schedule daily tests:
- ✅ Already configured! Running daily at 9 AM UTC
- ✅ Email reports enabled (if secrets configured)
- ✅ Artifacts saved for 30 days

### To enable auto-generation:
- ✅ Weekly scan workflow created (auto-generate-tests.yml)
- ✅ Auto-generates tests every Monday at 8 AM UTC
- ✅ Creates PR automatically for review
- ⚠️ Optional: Enable in daily workflow for immediate test updates

### Required GitHub Secrets:
- ✅ `TEST_USERNAME` - Your test account username
- ✅ `TEST_PASSWORD` - Your test account password
- ✅ `BASE_URL` - Application URL
- ⚠️ `EMAIL_USER` - Gmail for sending reports (optional)
- ⚠️ `EMAIL_PASSWORD` - Gmail app password (optional)
- ⚠️ `EMAIL_RECIPIENTS` - Email addresses (optional)

---

## 📝 Examples

### Example 1: Change to 6 PM Daily

Edit `.github/workflows/playwright-tests.yml`:
```yaml
schedule:
  - cron: '0 18 * * *'  # 6 PM UTC (was 9 AM)
```

### Example 2: Run Twice Daily

Edit `.github/workflows/playwright-tests.yml`:
```yaml
schedule:
  - cron: '0 9 * * *'   # 9 AM UTC
  - cron: '0 21 * * *'  # 9 PM UTC
```

### Example 3: Weekdays Only

Edit `.github/workflows/playwright-tests.yml`:
```yaml
schedule:
  - cron: '0 9 * * 1-5'  # Monday-Friday at 9 AM UTC
```

---

## 🔍 Troubleshooting

### Schedule not running?

1. Check if workflow is enabled in Actions tab
2. Verify secrets are configured
3. Check GitHub Actions logs for errors
4. Scheduled workflows need at least one successful manual run first

### Want to test the schedule?

Use manual trigger instead:
1. Actions tab → Select workflow
2. Run workflow button
3. Monitor execution

### Email not sending?

1. Verify `EMAIL_USER`, `EMAIL_PASSWORD`, `EMAIL_RECIPIENTS` secrets
2. Check Gmail app password is correct (not regular password)
3. Review workflow logs for email step

---

## 📚 Additional Resources

- [GitHub Actions Cron Syntax](https://docs.github.com/en/actions/using-workflows/events-that-trigger-workflows#schedule)
- [Crontab Guru](https://crontab.guru/) - Interactive cron expression editor
- [UTC Time Converter](https://www.worldtimebuddy.com/)

---

**Current Configuration Summary:**

| Workflow | Schedule | What It Does |
|----------|----------|--------------|
| **playwright-tests.yml** | Daily at 9 AM UTC | Runs all tests, sends email reports |
| **auto-generate-tests.yml** | Weekly Mon 8 AM UTC | Scans for new modules, creates PR |

**Last Updated:** January 8, 2026
