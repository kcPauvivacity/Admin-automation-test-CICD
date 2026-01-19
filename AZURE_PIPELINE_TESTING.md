# 🔧 Azure DevOps Pipeline Testing Guide

## Prerequisites Checklist:

Before running the pipeline, make sure you have:

### ✅ Step 1: Variable Group Set Up
1. Go to: https://dev.azure.com/vivacityapp/Viva/_library?itemType=VariableGroups
2. Click on **`playwright-secrets`**
3. Verify these variables exist with correct values:
   - `USERNAME` = `kiechee@ms.vivacityapp.com`
   - `PASSWORD` = Your login password
   - `URL` = `https://app-staging.vivacityapp.com`

**Note:** If you still have old names (TEST_USERNAME, TEST_PASSWORD, BASE_URL), rename them to the new names above.

### ✅ Step 2: Pipeline Files Exist
Already done! ✅ You have:
- `azure-pipelines.yml` (daily tests)
- `azure-pipelines-generate.yml` (weekly generation)

### ✅ Step 3: Code Pushed to Azure
Already done! ✅ Master branch exists in Azure DevOps

---

## 🚀 Option 1: Create & Run Pipeline via Web UI

### Create the Pipeline (First Time):

1. **Go to Azure Pipelines:**
   👉 https://dev.azure.dev/vivacityapp/Viva/_build

2. **Click "New pipeline"** (or ask colleague if you don't see the button)

3. **Select:** "Azure Repos Git"

4. **Select repository:** `admin-automation-test`

5. **Select:** "Existing Azure Pipelines YAML file"

6. **Choose:** `azure-pipelines.yml` (for daily tests)

7. **Click "Run"**

### Run the Pipeline (After Created):

1. Go to: https://dev.azure.com/vivacityapp/Viva/_build
2. Click on your pipeline
3. Click **"Run pipeline"** button
4. Click **"Run"**

---

## 🚀 Option 2: Quick Test via Command Line (Alternative)

If you can't create pipelines in the web UI, you can still verify everything works by running tests manually in Azure:

### Test 1: Verify Connection
```bash
cd /Users/paukiechee/Applications
git push azure master
```

Should show: "Everything up-to-date" ✅

### Test 2: Run Tests Locally with Azure Variables
```bash
cd /Users/paukiechee/Applications
USERNAME=kiechee@ms.vivacityapp.com PASSWORD=yourpass URL=https://app-staging.vivacityapp.com npm test
```

If this works, the pipeline will work too! ✅

---

## 🎯 What Each Pipeline Does:

### Pipeline 1: `azure-pipelines.yml` (Daily Tests)
- **Runs:** Daily at 9 AM UTC
- **Triggers:** Also runs on code changes to master branch
- **What it does:**
  1. Installs Node.js & Playwright
  2. Runs all your test cases
  3. Publishes HTML report
  4. Saves test results
  5. Sends email (if configured)

### Pipeline 2: `azure-pipelines-generate.yml` (Weekly Generation)
- **Runs:** Every Monday at 8 AM UTC
- **What it does:**
  1. Scans application for new modules
  2. Generates test files
  3. Generates manual test cases
  4. Creates new branch with changes

---

## 🐛 Troubleshooting:

### Issue: Can't see "New pipeline" button
**Solution:** Ask your colleague/boss with "Build Administrator" permissions to:
1. Go to https://dev.azure.com/vivacityapp/Viva/_build
2. Click "New pipeline"
3. Follow the creation steps above
4. Share the pipeline link with you

### Issue: Pipeline fails at login
**Solution:** Check variable group values:
1. Go to variable group
2. Verify USERNAME, PASSWORD, URL are correct
3. Test URL: https://app-staging.vivacityapp.com (should load)

### Issue: Variables not found
**Solution:** Grant pipeline access to variable group:
1. Go to: https://dev.azure.com/vivacityapp/Viva/_library?itemType=VariableGroups
2. Click `playwright-secrets`
3. Click "Pipeline permissions"
4. Add your pipeline

---

## ✅ Expected Results:

When pipeline runs successfully, you'll see:
- ✅ All test cases executed
- ✅ HTML report generated
- ✅ Test results published
- ✅ Green checkmark on pipeline run
- ✅ Email notification (if configured)

---

## 📊 Quick Commands Summary:

```bash
# 1. Check Azure connection
git remote -v | grep azure

# 2. Push latest code to Azure
git checkout master
git merge main
git push azure master

# 3. Test locally with Azure variables
USERNAME=kiechee@ms.vivacityapp.com PASSWORD=yourpass URL=https://app-staging.vivacityapp.com npm test
```

---

## 🎯 Next Steps:

1. ✅ Verify variable group has correct values
2. ✅ Ask colleague to create pipeline (if needed)
3. ✅ Run pipeline manually to test
4. ✅ Check results and logs
5. ✅ Set up scheduled runs

**Ready to create the pipeline? Ask your colleague or try the web UI!** 🚀
