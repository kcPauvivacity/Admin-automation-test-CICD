# 🚀 Quick Guide: Run Tests in Azure Pipeline

## ✅ Prerequisites Check

Before running, make sure:
- [ ] Variable group `playwright-secrets` exists with USERNAME, PASSWORD, URL
- [ ] Code is pushed to Azure DevOps master branch ✅ (commit: 8ee49f3)
- [ ] Pipeline YAML file exists ✅ (`azure-pipelines.yml`)

---

## 🎯 Method 1: Run via Azure DevOps Web UI (Recommended)

### Step 1: Go to Pipelines
**Open**: https://dev.azure.com/vivacityapp/Viva/_build

### Step 2: Find or Create Pipeline

**If you see a pipeline listed:**
- Click on it
- Click "**Run pipeline**" button (top-right)
- Select branch: **master**
- Click "**Run**"
- ✅ Done! Tests are running

**If NO pipeline exists yet:**
- Click "**New pipeline**" (or try this direct link: https://dev.azure.com/vivacityapp/Viva/_build/new)
- Select "**Azure Repos Git**"
- Select repository: "**admin-automation-test**"
- Select "**Existing Azure Pipelines YAML file**"
- Branch: **master**
- Path: **/azure-pipelines.yml**
- Click "**Continue**"
- Click "**Run**" (this will save and run the pipeline)

### Step 3: Monitor Execution

You'll see the pipeline running with these stages:
```
Stage: Test
└─ Job: PlaywrightTests (Deployment)
   ├─ ✅ Checkout Repository
   ├─ ✅ Install Node.js
   ├─ ✅ Restore caches
   ├─ ✅ Install Dependencies
   ├─ ✅ Install Playwright Browsers
   ├─ ✅ Run Tests ← YOUR TESTS RUN HERE!
   └─ ✅ Publish Results
```

**Takes**: ~5-10 minutes first run, ~3-5 minutes with cache

---

## 🎯 Method 2: Create Environment (If Needed)

The pipeline uses an environment called "Admin Automation Test". If it doesn't exist:

1. Go to: https://dev.azure.com/vivacityapp/Viva/_environments
2. Click "**Create environment**"
3. Name: `Admin Automation Test`
4. Description: "Environment for running Playwright tests"
5. Click "**Create**"

---

## 🎯 Method 3: Trigger Pipeline from Command Line

If Azure CLI is installed:

```bash
# Login
az login

# Trigger pipeline run
az pipelines run \
  --name "admin-automation-test" \
  --branch master \
  --organization https://dev.azure.com/vivacityapp \
  --project Viva
```

---

## 📊 What the Pipeline Does

When you run it, the pipeline will:

1. **Checkout code** from master branch
2. **Install Node.js** v18
3. **Restore caches** (npm and Playwright - speeds up runs)
4. **Install dependencies** (`npm ci`)
5. **Install Playwright browsers** (chromium)
6. **Run ALL your tests**:
   - Login tests
   - Dashboard tests
   - Properties tests
   - AI Chat tests
   - All auto-generated tests
   - All manual tests
7. **Publish test results** (JUnit XML)
8. **Publish HTML report** (downloadable)
9. **Cache artifacts** for next run

---

## 🎉 Success Indicators

### Pipeline Succeeded ✅
- All steps show green checkmarks
- "Tests" tab shows results (pass/fail/skip)
- HTML report available in "Summary" → "Published" section

### Pipeline Failed ❌
- Red X on failed step
- Click on failed step to see logs
- Common issues:
  - Missing variable group → Create `playwright-secrets`
  - Wrong URL → Check URL is staging
  - Login failed → Verify USERNAME/PASSWORD

---

## 📋 View Test Results

After pipeline completes:

### Option 1: In Azure DevOps
1. Click on the pipeline run
2. Go to "**Tests**" tab
3. See breakdown of passed/failed/skipped tests
4. Click on any test to see details

### Option 2: Download HTML Report
1. Click on the pipeline run
2. Go to "**Summary**" tab
3. Under "**Published**", find "**Playwright HTML Report**"
4. Click to download
5. Extract and open `index.html`

---

## 🔧 Configuration Details

### Variable Group Required
**Name**: `playwright-secrets`

**Variables**:
- `USERNAME` = `kc@vivacityapp.com` (secret ✅)
- `PASSWORD` = `PAOpaopao@9696` (secret ✅)
- `URL` = `https://app-staging.vivacityapp.com`

**Create at**: https://dev.azure.com/vivacityapp/Viva/_library

### Pipeline Schedule
The pipeline is set to run automatically:
- **Daily**: 9 AM UTC
- **On push**: When code is pushed to master
- **Manual**: Click "Run pipeline" anytime

---

## 🚀 Quick Start Command

**Just do this**:
1. Open: https://dev.azure.com/vivacityapp/Viva/_build
2. Find/create pipeline for `azure-pipelines.yml`
3. Click "**Run pipeline**"
4. Select branch: **master**
5. Click "**Run**"

**That's it!** ✅

---

## ❓ Troubleshooting

### "Environment 'Admin Automation Test' not found"
**Solution**: Go to https://dev.azure.com/vivacityapp/Viva/_environments and create it

### "Variable group 'playwright-secrets' not found"
**Solution**: Go to https://dev.azure.com/vivacityapp/Viva/_library and create it

### "Tests fail with login error"
**Solution**: Verify USERNAME and PASSWORD in variable group

### "Browser not found"
**Solution**: Pipeline auto-installs, check the "Install Playwright Browsers" step logs

### "No pipeline found"
**Solution**: Create new pipeline pointing to `azure-pipelines.yml` on master branch

---

## 📞 Quick Links

| What | Link |
|------|------|
| **Pipelines** | https://dev.azure.com/vivacityapp/Viva/_build |
| **Environments** | https://dev.azure.com/vivacityapp/Viva/_environments |
| **Variable Library** | https://dev.azure.com/vivacityapp/Viva/_library |
| **Repository** | https://dev.azure.com/vivacityapp/Viva/_git/admin-automation-test |

---

## ✅ Summary

**To run tests in Azure Pipeline**:
1. Go to: https://dev.azure.com/vivacityapp/Viva/_build
2. Find/create pipeline for `azure-pipelines.yml`
3. Click "Run pipeline"
4. Select master branch
5. Click "Run"
6. Wait 5-10 minutes
7. View results in "Tests" tab

**That's it!** Your tests will run in Azure DevOps! 🎉

---

*Last Updated: January 21, 2026*
*Status: Ready to Run ✅*
