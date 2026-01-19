# ⚡ Azure Pipeline Quick Start Checklist

## 🎯 Before You Start

### ✅ Pre-flight Check:
- [x] Code pushed to Azure DevOps master branch (commit: d91d59e)
- [x] Pipeline YAML files exist (`azure-pipelines.yml`, `azure-pipelines-generate.yml`)
- [ ] Variable group `playwright-secrets` configured
- [ ] Pipelines created in Azure DevOps

---

## 📋 Step-by-Step Checklist

### 1️⃣ Configure Variable Group (5 minutes)

**URL**: https://dev.azure.com/vivacityapp/Viva/_library

**Actions**:
- [ ] Open Azure DevOps Library
- [ ] Create/select variable group: `playwright-secrets`
- [ ] Add variable: `USERNAME` = `kc@vivacityapp.com` (mark as secret ✅)
- [ ] Add variable: `PASSWORD` = `PAOpaopao@9696` (mark as secret ✅)
- [ ] Add variable: `URL` = `https://app-staging.vivacityapp.com`
- [ ] Click **Save**
- [ ] Grant pipeline permissions if needed

**Verification**:
```
✅ Variable group named "playwright-secrets" exists
✅ Three variables: USERNAME, PASSWORD, URL
✅ PASSWORD is marked as secret (🔒 icon)
```

---

### 2️⃣ Create Pipelines (3 minutes each)

**URL**: https://dev.azure.com/vivacityapp/Viva/_build

#### Pipeline 1: Daily Tests

- [ ] Click "New pipeline"
- [ ] Select "Azure Repos Git"
- [ ] Select repository: "admin-automation-test"
- [ ] Select "Existing Azure Pipelines YAML file"
- [ ] Branch: **master**
- [ ] Path: **/azure-pipelines.yml**
- [ ] Click "Continue"
- [ ] Click "Save" dropdown → "Save"
- [ ] Rename to: "**Playwright Daily Tests**"

#### Pipeline 2: Test Generation

- [ ] Click "New pipeline"
- [ ] Select "Azure Repos Git"
- [ ] Select repository: "admin-automation-test"
- [ ] Select "Existing Azure Pipelines YAML file"
- [ ] Branch: **master**
- [ ] Path: **/azure-pipelines-generate.yml**
- [ ] Click "Continue"
- [ ] Click "Save" dropdown → "Save"
- [ ] Rename to: "**Playwright Test Generation**"

**Verification**:
```
✅ Two pipelines visible in https://dev.azure.com/vivacityapp/Viva/_build
   1. Playwright Daily Tests
   2. Playwright Test Generation
```

---

### 3️⃣ Run Daily Test Pipeline (2 minutes)

**URL**: https://dev.azure.com/vivacityapp/Viva/_build

- [ ] Select "Playwright Daily Tests" pipeline
- [ ] Click "**Run pipeline**" button (top right)
- [ ] Select branch: **master**
- [ ] Click "**Run**"
- [ ] Watch execution (takes ~5-10 minutes)

**Expected Progress**:
```
🔄 Stage: Test
  ├── ✅ Install Node.js (30s)
  ├── ✅ Install Dependencies (1m)
  ├── ✅ Install Playwright Browsers (2m)
  ├── ✅ Run Tests (3-5m)
  └── ✅ Publish Results (30s)
```

**Success Indicators**:
- [ ] All steps show green checkmarks ✅
- [ ] "Tests" tab shows test results
- [ ] Can download HTML report from "Summary" tab

---

### 4️⃣ Run Test Generation Pipeline (2 minutes)

**URL**: https://dev.azure.com/vivacityapp/Viva/_build

- [ ] Select "Playwright Test Generation" pipeline
- [ ] Click "**Run pipeline**" button
- [ ] Select branch: **master**
- [ ] Click "**Run**"
- [ ] Watch execution (takes ~3-5 minutes)

**Expected Progress**:
```
🔄 Stage: Generate
  ├── ✅ Checkout Code (15s)
  ├── ✅ Install Node.js (30s)
  ├── ✅ Install Dependencies (1m)
  ├── ✅ Install Playwright Browsers (2m)
  ├── ✅ Generate Tests (1-2m)
  └── ✅ Commit Changes (15s)
```

**Success Indicators**:
- [ ] All steps show green checkmarks ✅
- [ ] New commit appears in master branch
- [ ] New test files in `tests/auto-generated/`

---

## 🚨 Troubleshooting Quick Fixes

### ❌ "Variable group 'playwright-secrets' not found"
**Fix**: Go to https://dev.azure.com/vivacityapp/Viva/_library and create it

### ❌ Tests fail with DNS error
**Fix**: Check URL is `https://app-staging.vivacityapp.com` (not admin.ms)

### ❌ "Permission denied" when committing
**Fix**: Check pipeline has access to repository (Project Settings → Repositories → Security)

### ❌ "Browser not found"
**Fix**: Pipeline should auto-install. Check logs for `npx playwright install` step

### ❌ Tests fail with login error
**Fix**: Verify USERNAME and PASSWORD in variable group are correct

---

## 🎯 Quick Links

| Resource | URL |
|----------|-----|
| **Pipelines Dashboard** | https://dev.azure.com/vivacityapp/Viva/_build |
| **Variable Library** | https://dev.azure.com/vivacityapp/Viva/_library |
| **Repository** | https://dev.azure.com/vivacityapp/Viva/_git/admin-automation-test |
| **Project Settings** | https://dev.azure.com/vivacityapp/Viva/_settings/ |

---

## 📞 Get Help

**Full Guide**: See `HOW_TO_RUN_AZURE_PIPELINE.md` for detailed instructions

**Check Status**:
1. Go to: https://dev.azure.com/vivacityapp/Viva/_build
2. Look for your pipeline runs
3. Green ✅ = Success, Red ❌ = Failed, Blue 🔄 = Running

**View Logs**:
1. Click on any pipeline run
2. Click on failed step (if any)
3. Read error message
4. Check troubleshooting section above

---

## ✅ Final Check

After completing all steps:

- [ ] Variable group configured with 3 variables
- [ ] 2 pipelines created and visible
- [ ] Daily test pipeline ran successfully
- [ ] Test generation pipeline ran successfully
- [ ] Can view test results in Azure DevOps
- [ ] Can access pipeline logs

**Status**: 🎉 **READY TO USE!**

---

*Quick Reference - Print this page for easy access!*  
*Last Updated: January 19, 2026*
