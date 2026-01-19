# 🚀 How to Run Azure Pipelines - Step by Step

## Prerequisites Checklist ✅

Before running the pipeline, ensure:
1. ✅ Code is pushed to Azure DevOps (master branch) - **DONE** (commit d91d59e)
2. ✅ Pipeline files exist - **DONE** (`azure-pipelines.yml`, `azure-pipelines-generate.yml`)
3. ⚠️ Variable group configured - **NEEDS VERIFICATION**

## 📋 Step 1: Configure Variable Group (IMPORTANT!)

The pipelines need a variable group called `playwright-secrets` with these variables:

### Go to Azure DevOps Library:
🔗 https://dev.azure.com/vivacityapp/Viva/_library

### Create/Update Variable Group:
1. Click "**+ Variable group**" (if doesn't exist) or select existing `playwright-secrets`
2. Add these variables:

| Variable Name | Value | Secret? |
|---------------|-------|---------|
| `USERNAME` | `kc@vivacityapp.com` | ✅ Yes |
| `PASSWORD` | `PAOpaopao@9696` | ✅ Yes (click lock icon) |
| `URL` | `https://app-staging.vivacityapp.com` | ❌ No |

3. Click **Save**

### ⚠️ Important Notes:
- Variable names are **USERNAME**, **PASSWORD**, **URL** (NOT TEST_USERNAME, etc.)
- Mark PASSWORD as secret (lock icon)
- URL should be staging: `https://app-staging.vivacityapp.com`

---

## 📋 Step 2: Create/Import Pipeline in Azure DevOps

### Option A: If Pipeline Doesn't Exist Yet

#### For Daily Test Pipeline:
1. Go to: https://dev.azure.com/vivacityapp/Viva/_build
2. Click "**New pipeline**"
3. Select "**Azure Repos Git**"
4. Select repository: "**admin-automation-test**"
5. Select "**Existing Azure Pipelines YAML file**"
6. Choose branch: "**master**"
7. Path: "**/azure-pipelines.yml**"
8. Click "**Continue**"
9. Click "**Save**" (dropdown next to Run) → Name it: "**Playwright Daily Tests**"

#### For Weekly Test Generation Pipeline:
1. Click "**New pipeline**" again
2. Select "**Azure Repos Git**"
3. Select repository: "**admin-automation-test**"
4. Select "**Existing Azure Pipelines YAML file**"
5. Choose branch: "**master**"
6. Path: "**/azure-pipelines-generate.yml**"
7. Click "**Continue**"
8. Click "**Save**" (dropdown next to Run) → Name it: "**Playwright Test Generation**"

### Option B: If Pipeline Already Exists

Just navigate to:
- 🔗 https://dev.azure.com/vivacityapp/Viva/_build
- Find your pipeline in the list

---

## 🎯 Step 3: Run the Pipeline Manually

### For Daily Test Pipeline (azure-pipelines.yml):

1. Go to: https://dev.azure.com/vivacityapp/Viva/_build
2. Click on "**Playwright Daily Tests**" (or your pipeline name)
3. Click "**Run pipeline**" button (top right)
4. Configure run:
   - **Branch/tag**: Select "**master**"
   - Leave other defaults
5. Click "**Run**"

### For Test Generation Pipeline (azure-pipelines-generate.yml):

1. Go to: https://dev.azure.com/vivacityapp/Viva/_build
2. Click on "**Playwright Test Generation**"
3. Click "**Run pipeline**" button
4. Configure run:
   - **Branch/tag**: Select "**master**"
5. Click "**Run**"

---

## 📊 Step 4: Monitor Pipeline Execution

Once you click Run:

### Watch the Progress:
1. You'll see the pipeline stages:
   - **Stage 1**: Test/Generate
   - **Job**: PlaywrightTests or TestGeneration

2. Click on the job to see detailed logs

3. Expand each step to see:
   - ✅ Install Node.js
   - ✅ Install Dependencies
   - ✅ Install Playwright Browsers
   - ✅ Run Tests / Generate Tests
   - ✅ Publish Results

### Expected Output for Daily Tests:
```
Installing dependencies...
Installing Playwright browsers...
Running Playwright tests...

Running 50 tests using 4 workers
✅ Tests passed: XX
❌ Tests failed: XX
⏭️ Tests skipped: XX

Total time: XX seconds
```

### Expected Output for Test Generation:
```
🤖 Running auto-generation to scan for new modules...
Found 12 potential navigation links
✅ Found 3 new modules
💾 Saving test files...
✅ Created: tests/auto-generated/dashboardnew.test.ts

📋 Generating manual test cases...
✅ Generated 31 test cases
```

---

## 🎉 Step 5: Review Results

### Test Results:
1. Go to pipeline run
2. Click "**Tests**" tab
3. See pass/fail breakdown
4. Click on failed tests to see details

### Published Reports:
1. Click "**Summary**" tab
2. Under "**Published**", find "**Playwright HTML Report**"
3. Click to download and view

### Generated Test Files (for generation pipeline):
1. After pipeline completes
2. Go to: https://dev.azure.com/vivacityapp/Viva/_git/admin-automation-test
3. Navigate to `tests/auto-generated/`
4. See new test files committed

---

## 🔧 Troubleshooting

### Issue: "Variable group not found"

**Solution**:
1. Go to: https://dev.azure.com/vivacityapp/Viva/_settings/variablegroups
2. Create variable group named exactly: `playwright-secrets`
3. Add USERNAME, PASSWORD, URL variables
4. Click "Pipeline permissions" → Grant access to your pipeline

### Issue: "Tests fail with DNS error"

**Solution**:
1. Check URL variable: `https://app-staging.vivacityapp.com`
2. Make sure it's the staging URL, not `admin.ms.vivacityapp.com`
3. Test URL works: `curl https://app-staging.vivacityapp.com`

### Issue: "Module not found" or "Cannot find package"

**Solution**:
1. Check `package.json` has all dependencies
2. Pipeline runs `npm ci` which uses `package-lock.json`
3. Make sure both are committed and pushed

### Issue: "Permission denied" when committing

**Solution** (for test generation pipeline):
1. Check pipeline has `persistCredentials: true` ✅ (already set)
2. Make sure pipeline has permission to push to repository
3. Go to Project Settings → Repositories → Security

### Issue: "Browser not found"

**Solution**:
Pipeline already has this step:
```yaml
npx playwright install --with-deps chromium
```
This should work automatically on Azure Ubuntu agents.

---

## 📅 Automated Scheduling

Both pipelines are configured to run automatically:

### Daily Test Pipeline:
```yaml
schedules:
- cron: "0 9 * * *"  # 9 AM UTC daily
  branches:
    include:
    - master
```
**Runs**: Every day at 9 AM UTC (1 AM PST / 4 AM EST)

### Test Generation Pipeline:
```yaml
schedules:
- cron: "0 8 * * 1"  # 8 AM UTC every Monday
  branches:
    include:
    - master
```
**Runs**: Every Monday at 8 AM UTC (12 AM PST / 3 AM EST)

---

## 🎯 Quick Start Commands

### From Azure DevOps Web UI:

**Daily Tests Pipeline:**
```
1. https://dev.azure.com/vivacityapp/Viva/_build
2. Select "Playwright Daily Tests"
3. Click "Run pipeline"
4. Select branch: master
5. Click "Run"
```

**Test Generation Pipeline:**
```
1. https://dev.azure.com/vivacityapp/Viva/_build
2. Select "Playwright Test Generation"
3. Click "Run pipeline"
4. Select branch: master
5. Click "Run"
```

---

## ✅ Success Indicators

### Daily Test Pipeline Success:
- ✅ All steps complete with green checkmarks
- ✅ Test results published
- ✅ HTML report available for download
- ✅ No red X's in pipeline view

### Test Generation Pipeline Success:
- ✅ New test files appear in `tests/auto-generated/`
- ✅ Commit pushed to master branch
- ✅ Generation report updated
- ✅ Manual test cases generated

---

## 📸 What You Should See

### Pipeline List View:
```
Pipelines
├── Playwright Daily Tests (azure-pipelines.yml)
│   Status: ✅ Succeeded / 🔄 Running / ❌ Failed
│   Last run: [timestamp]
│   Triggered by: Schedule / Manual
│
└── Playwright Test Generation (azure-pipelines-generate.yml)
    Status: ✅ Succeeded / 🔄 Running / ❌ Failed
    Last run: [timestamp]
    Triggered by: Schedule / Manual
```

### Pipeline Run View:
```
Run #123 - master
Duration: 5m 23s
Status: ✅ Succeeded

Stages:
  📦 Test / Generate
    ├── Install Node.js ✅
    ├── Install Dependencies ✅
    ├── Install Playwright Browsers ✅
    ├── Run Tests ✅
    └── Publish Results ✅
```

---

## 🆘 Need Help?

### Check These Resources:
1. **Variable Group**: https://dev.azure.com/vivacityapp/Viva/_library
2. **Pipelines**: https://dev.azure.com/vivacityapp/Viva/_build
3. **Repository**: https://dev.azure.com/vivacityapp/Viva/_git/admin-automation-test
4. **Pipeline Logs**: Click on any failed step to see detailed error messages

### Common Commands to Test Locally First:
```bash
# Test if dependencies install
npm ci

# Test if Playwright works
npx playwright test tests/login.test.ts

# Test generation
npm run generate-tests

# Check environment
echo "URL: $URL"
echo "USERNAME: $USERNAME"
```

---

## 🎊 You're All Set!

**Next Steps:**
1. ✅ Configure variable group (if not done)
2. ✅ Create/import pipelines (if not done)
3. ✅ Run pipeline manually
4. ✅ Watch it execute
5. ✅ Check results
6. ✅ Let it run automatically on schedule

**Pipeline URLs:**
- 📊 Pipelines Dashboard: https://dev.azure.com/vivacityapp/Viva/_build
- 📚 Library: https://dev.azure.com/vivacityapp/Viva/_library
- 📁 Repository: https://dev.azure.com/vivacityapp/Viva/_git/admin-automation-test

---

*Last Updated: January 19, 2026*  
*Status: Ready to Run ✅*
