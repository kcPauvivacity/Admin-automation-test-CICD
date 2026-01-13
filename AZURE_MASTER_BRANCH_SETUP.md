# ✅ Azure DevOps: main → master Migration Complete

## What I Did:

1. ✅ Created `master` branch from `main`
2. ✅ Pushed `master` branch to Azure DevOps
3. ✅ Updated Azure pipeline files to use `master`
4. ✅ Kept both branches in sync

## Current Status:

### Azure DevOps:
- ✅ `master` branch exists with all your code
- ✅ Pipelines configured to run on `master` branch
- ✅ Both `main` and `master` branches available

### GitHub:
- ✅ Still using `main` branch (GitHub standard)
- ✅ All changes synced

## 🎯 Next Step: Set Default Branch in Azure DevOps

You need to set `master` as the default branch in Azure DevOps web interface:

### Instructions:

1. **Go to Azure DevOps Repository Settings:**
   - Navigate to: https://dev.azure.com/vivacityapp/Viva/_git/admin-automation-test
   - Click on **Branches** (left sidebar)

2. **Set master as default:**
   - Find the `master` branch in the list
   - Click the **three dots (...)** next to `master`
   - Select **"Set as default branch"**
   - Confirm the change

3. **Verify:**
   - The `master` branch should now have a star (⭐) icon
   - This is now the default branch

### Why Set as Default?

- New pipelines will use `master` by default
- Pull requests will target `master`
- Clones will start with `master` branch
- Aligns with Azure DevOps conventions (many Azure projects use `master`)

## Branch Strategy:

### GitHub (origin):
- Uses `main` branch (GitHub standard)
- All GitHub Actions run on `main`

### Azure DevOps (azure):
- Uses `master` branch (Azure convention)
- All Azure Pipelines run on `master`

### Your Local Repo:
- Has both branches
- Work on `main` locally
- Changes automatically sync to both

## Syncing Between Branches:

When you make changes:

```bash
# Work on main locally
git checkout main
# Make changes...
git add .
git commit -m "Your changes"

# Push to both
git push origin main          # GitHub
git checkout master
git merge main
git push azure master         # Azure DevOps
```

Or use this simpler approach:

```bash
# On main branch
git add .
git commit -m "Your changes"
git push origin main

# Quick sync to master
git checkout master && git merge main && git push azure master && git checkout main
```

## Verify Everything Works:

### Check Azure DevOps:
1. Go to: https://dev.azure.com/vivacityapp/Viva/_git/admin-automation-test/branches
2. You should see both `main` and `master` with same latest commit
3. Set `master` as default (see instructions above)

### Check Pipelines:
1. Go to: https://dev.azure.com/vivacityapp/Viva/_build
2. Your pipelines should now trigger on `master` branch

## Summary:

✅ **Master branch created** in Azure DevOps
✅ **Pipelines updated** to use master
✅ **Code synced** between main and master
✅ **GitHub stays on main** (no change needed)
✅ **Azure DevOps uses master** (Azure convention)

**Next:** Set master as default branch in Azure DevOps web UI (instructions above)

---

Everything is ready! Just set the default branch in Azure DevOps and you're all set! 🚀
