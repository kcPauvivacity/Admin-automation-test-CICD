# Azure DevOps CI/CD Setup Guide

This guide walks you through setting up CI/CD pipelines in Azure DevOps for your Playwright test automation.

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Create Variable Group](#create-variable-group)
3. [Set Up Daily Test Pipeline](#set-up-daily-test-pipeline)
4. [Set Up Weekly Test Generation Pipeline](#set-up-weekly-test-generation-pipeline)
5. [Configure Email Notifications](#configure-email-notifications)
6. [Verify Setup](#verify-setup)
7. [Troubleshooting](#troubleshooting)

---

## ✅ Prerequisites

- ✅ Code pushed to Azure DevOps: https://dev.azure.com/vivacityapp/Viva/_git/admin-automation-test
- ✅ Azure Pipeline files created:
  - `azure-pipelines.yml` (daily tests)
  - `azure-pipelines-generate.yml` (weekly test generation)

---

## 🔐 Step 1: Create Variable Group

Variable groups store secrets securely in Azure DevOps.

### 1.1 Navigate to Library

1. Go to: https://dev.azure.com/vivacityapp/Viva/_library
2. Click **+ Variable group**
3. Name: `playwright-secrets`

### 1.2 Add Variables

Add these variables (click **+ Add** for each):

| Variable Name | Value | Secret? |
|---------------|-------|---------|
| `TEST_USERNAME` | Your test account username | ✅ Yes |
| `TEST_PASSWORD` | Your test account password | ✅ Yes |
| `BASE_URL` | `https://app-staging.vivacityapp.com` | ❌ No |
| `EMAIL_USER` | Your Gmail address (optional) | ✅ Yes |
| `EMAIL_PASSWORD` | Gmail app password (optional) | ✅ Yes |
| `EMAIL_RECIPIENTS` | Comma-separated emails | ❌ No |

**Example:**
```
TEST_USERNAME: kiechee@ms.vivacityapp.com (Secret: ✓)
TEST_PASSWORD: ********** (Secret: ✓)
BASE_URL: https://app-staging.vivacityapp.com
EMAIL_USER: your-email@gmail.com (Secret: ✓)
EMAIL_PASSWORD: ********** (Secret: ✓)
EMAIL_RECIPIENTS: team@vivacityapp.com,qa@vivacityapp.com
```

### 1.3 Save Variable Group

1. Click **Save**
2. Set permissions if needed (allow pipeline access)

---

## 🚀 Step 2: Set Up Daily Test Pipeline

This pipeline runs your tests daily and on every code push.

### 2.1 Create Pipeline

1. Go to: https://dev.azure.com/vivacityapp/Viva/_build
2. Click **New pipeline**
3. Select **Azure Repos Git**
4. Choose repository: **admin-automation-test**
5. Select **Existing Azure Pipelines YAML file**
6. Path: `/azure-pipelines.yml`
7. Click **Continue**

### 2.2 Review and Run

1. Review the pipeline configuration
2. Click **Run**
3. Watch the first run complete

### 2.3 Name the Pipeline

1. Click the **three dots** (•••) → **Rename/move**
2. Name: `Playwright Tests - Daily`
3. Click **Save**

---

## 🤖 Step 3: Set Up Weekly Test Generation Pipeline

This pipeline scans for new modules and generates tests every Monday.

### 3.1 Create Pipeline

1. Go to: https://dev.azure.com/vivacityapp/Viva/_build
2. Click **New pipeline**
3. Select **Azure Repos Git**
4. Choose repository: **admin-automation-test**
5. Select **Existing Azure Pipelines YAML file**
6. Path: `/azure-pipelines-generate.yml`
7. Click **Continue**

### 3.2 Review and Run

1. Review the pipeline configuration
2. Click **Run** (first test run)
3. Watch it generate tests

### 3.3 Name the Pipeline

1. Click the **three dots** (•••) → **Rename/move**
2. Name: `Auto-Generate Tests - Weekly`
3. Click **Save**

---

## 📧 Step 4: Configure Email Notifications (Optional)

### 4.1 Gmail App Password Setup

If using Gmail for reports:

1. Go to: https://myaccount.google.com/apppasswords
2. App: **Mail**
3. Device: **Azure DevOps**
4. Click **Generate**
5. Copy the 16-character password
6. Add to `EMAIL_PASSWORD` variable in Step 1

### 4.2 Test Email

1. Run the daily test pipeline manually
2. Check if email arrives
3. Verify screenshots/videos are attached

---

## ✅ Step 5: Verify Setup

### 5.1 Check Pipeline Schedules

**Daily Test Pipeline:**
1. Go to pipeline → Edit
2. Click **Triggers**
3. Verify schedule: `0 9 * * *` (9 AM UTC daily)
4. Ensure "Always run" is checked

**Weekly Generation Pipeline:**
1. Go to pipeline → Edit
2. Click **Triggers**
3. Verify schedule: `0 8 * * 1` (8 AM UTC Monday)
4. Ensure "Always run" is checked

### 5.2 Manual Test Runs

**Test Daily Pipeline:**
```
1. Go to: Pipelines → Playwright Tests - Daily
2. Click "Run pipeline"
3. Click "Run"
4. Wait for completion
5. Check artifacts: playwright-report, test-results
```

**Test Generation Pipeline:**
```
1. Go to: Pipelines → Auto-Generate Tests - Weekly
2. Click "Run pipeline"
3. Click "Run"
4. Wait for completion
5. Check artifacts: generation-report, manual-test-cases
```

### 5.3 Verify Artifacts

After pipeline runs, check:
- ✅ **playwright-report** - HTML test report
- ✅ **test-results-json** - JSON results
- ✅ **test-results-media** - Screenshots/videos
- ✅ **generation-report** - Auto-generation summary
- ✅ **manual-test-cases** - Manual test documentation

---

## 📊 Step 6: Monitor Pipelines

### 6.1 Dashboard

Create a dashboard to monitor test results:

1. Go to: https://dev.azure.com/vivacityapp/Viva/_dashboards
2. Click **+ New Dashboard**
3. Name: `Test Automation Monitoring`
4. Add widgets:
   - **Build History** (Playwright Tests - Daily)
   - **Test Results Trend**
   - **Build Duration**
   - **Task Duration**

### 6.2 Notifications

Set up notifications:

1. Go to: User Settings → Notifications
2. Click **+ New subscription**
3. Configure:
   - Event: Build completed
   - Filter: Pipeline = Playwright Tests - Daily
   - Deliver to: Email
4. Save

---

## 🔍 Step 7: Troubleshooting

### Pipeline Fails with "Variable group not found"

**Solution:**
1. Verify variable group name is exactly `playwright-secrets`
2. Check pipeline has permission to access variable group
3. Go to Library → playwright-secrets → Pipeline permissions

### Tests Timeout

**Solution:**
1. Increase timeout in `azure-pipelines.yml`:
   ```yaml
   timeoutInMinutes: 120  # Increase from 90
   ```
2. Commit and push changes

### Email Not Sending

**Solution:**
1. Verify `EMAIL_USER`, `EMAIL_PASSWORD`, `EMAIL_RECIPIENTS` are set
2. Check Gmail app password (not regular password)
3. Review pipeline logs for email step errors

### Auto-Generation Not Creating PR

**Solution:**
In Azure DevOps, automatic PR creation requires Azure CLI or API.
The pipeline commits to a new branch instead.

To create PR:
1. Go to: Repos → Branches
2. Find the auto-generated branch
3. Click **New pull request**
4. Review and merge

### Variables Not Loading

**Solution:**
1. Ensure variable group is linked in YAML:
   ```yaml
   variables:
     - group: playwright-secrets
   ```
2. Check variable names match exactly (case-sensitive)

---

## 🎯 Quick Reference Commands

### Push Changes to Azure DevOps
```bash
cd /Users/paukiechee/Applications
git add .
git commit -m "Your commit message"
git push azure main
```

### Run Pipelines Manually
```bash
# Via Azure CLI (if installed)
az pipelines run --name "Playwright Tests - Daily"
az pipelines run --name "Auto-Generate Tests - Weekly"
```

### Check Pipeline Status
```bash
# Via Azure CLI
az pipelines runs list --pipeline-ids <pipeline-id> --top 5
```

---

## 📚 Azure DevOps Links

| Resource | URL |
|----------|-----|
| **Repository** | https://dev.azure.com/vivacityapp/Viva/_git/admin-automation-test |
| **Pipelines** | https://dev.azure.com/vivacityapp/Viva/_build |
| **Library (Variables)** | https://dev.azure.com/vivacityapp/Viva/_library |
| **Test Results** | https://dev.azure.com/vivacityapp/Viva/_test/analytics |
| **Artifacts** | https://dev.azure.com/vivacityapp/Viva/_artifacts |

---

## 🆚 Azure DevOps vs GitHub Actions

| Feature | Azure DevOps | GitHub Actions |
|---------|--------------|----------------|
| Pipeline File | `azure-pipelines.yml` | `.github/workflows/*.yml` |
| Secrets | Variable Groups | Repository Secrets |
| Artifacts | Pipeline Artifacts | Workflow Artifacts |
| Schedules | CRON in YAML | CRON in YAML |
| PR Creation | Manual or API | peter-evans/create-pull-request |

---

## ✅ Setup Checklist

- [ ] Variable group `playwright-secrets` created
- [ ] All secrets added to variable group
- [ ] Daily test pipeline created and running
- [ ] Weekly generation pipeline created
- [ ] Pipeline schedules verified
- [ ] Email notifications configured (optional)
- [ ] First manual test run successful
- [ ] Artifacts downloading correctly
- [ ] Dashboard created for monitoring
- [ ] Team notified about new CI/CD setup

---

## 🎉 You're All Set!

Your Azure DevOps CI/CD is now configured:

- ✅ **Daily tests** run at 9 AM UTC
- ✅ **Weekly test generation** runs Monday 8 AM UTC
- ✅ **Email reports** sent automatically
- ✅ **Artifacts** saved for 30 days
- ✅ **Manual test cases** generated automatically

**Next Actions:**
1. Monitor first scheduled runs
2. Review test results
3. Adjust schedules if needed
4. Share dashboard with team

---

**Last Updated:** January 13, 2026  
**Version:** 1.0.0  
**Support:** Check pipeline logs for errors
