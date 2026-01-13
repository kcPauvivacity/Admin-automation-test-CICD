# 🚀 Super Simple Azure DevOps Setup

## ⚡ Quick Setup (5 minutes)

Just run this one command and follow the prompts:

```bash
cd /Users/paukiechee/Applications
./scripts/setup-azure-devops-automated.sh
```

### What the script will do:
1. ✅ Install Azure CLI (if needed)
2. ✅ Login to Azure DevOps (opens browser)
3. ✅ Create variable group with your credentials
4. ✅ Create daily test pipeline
5. ✅ Create weekly generation pipeline
6. ✅ Configure everything automatically

### What you need to provide:
- Your Azure DevOps login (browser popup)
- TEST_USERNAME: `kiechee@ms.vivacityapp.com`
- TEST_PASSWORD: `[your password]`
- BASE_URL: `https://app-staging.vivacityapp.com`
- Email settings (optional)

---

## 🎯 Manual Setup (If script doesn't work)

### Step 1: Create Variable Group
1. Go to: https://dev.azure.com/vivacityapp/Viva/_library
2. Click **+ Variable group**
3. Name: `playwright-secrets`
4. Add variables:
   - `TEST_USERNAME` (secret) ✓
   - `TEST_PASSWORD` (secret) ✓
   - `BASE_URL`
   - `EMAIL_USER` (secret, optional) ✓
   - `EMAIL_PASSWORD` (secret, optional) ✓
   - `EMAIL_RECIPIENTS` (optional)
5. Click **Save**

### Step 2: Create First Pipeline
1. Go to: https://dev.azure.com/vivacityapp/Viva/_build
2. Click **New pipeline**
3. Select **Azure Repos Git** → **admin-automation-test**
4. Choose **Existing Azure Pipelines YAML file**
5. Path: `/azure-pipelines.yml`
6. Click **Run**

### Step 3: Create Second Pipeline
1. Click **New pipeline** again
2. Select **Azure Repos Git** → **admin-automation-test**
3. Choose **Existing Azure Pipelines YAML file**
4. Path: `/azure-pipelines-generate.yml`
5. Click **Run**

---

## ✅ Verification

After setup, check:
- [ ] Pipelines visible: https://dev.azure.com/vivacityapp/Viva/_build
- [ ] Variable group exists: https://dev.azure.com/vivacityapp/Viva/_library
- [ ] First pipeline runs successfully
- [ ] Test results appear

---

## 🆘 If You Need Help

I can help you with:
1. Screen share - walk through each step
2. Troubleshoot errors
3. Verify the setup works
4. Answer questions

---

## 📞 Quick Contact

Need help right now? Just ask me and I'll guide you through it step-by-step!

**Estimated time: 5 minutes with automation, 10 minutes manual**
