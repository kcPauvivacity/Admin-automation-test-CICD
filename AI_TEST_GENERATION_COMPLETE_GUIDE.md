# AI Test Generation - Complete Guide

## 🎉 Overview

The AI-powered test generation system can automatically:
- ✅ Scan your entire application
- ✅ Detect all navigation modules/pages
- ✅ Analyze page structure (tables, forms, buttons, inputs)
- ✅ Generate comprehensive test files
- ✅ Skip modules that already have tests
- ✅ Run automatically on a weekly schedule

## 🚀 Quick Start

### Run Test Generation Manually

```bash
npm run generate-tests
```

This will:
1. Log into your application
2. Scan all menu items and navigation links
3. Analyze each page's structure
4. Generate test files for new modules
5. Create a detailed report

### Generated Files Location

- **Test Files**: `tests/auto-generated/*.test.ts`
- **Report**: `tests/auto-generated/GENERATION_REPORT.md`
- **Debug Screenshot**: `debug-before-scan.png`

## 📊 What Gets Generated

### For Each Module, The AI Creates:

#### 1. **Page Load Test**
```typescript
test('should load [Module] page successfully')
```
- Verifies correct URL
- Checks page stability
- Confirms main content is visible

#### 2. **Table Tests** (if table detected)
```typescript
test('should display [Module] table with data')
test('should handle [Module] table pagination')
```
- Verifies table visibility
- Counts rows and columns
- Tests pagination if available

#### 3. **Search Test** (if search field detected)
```typescript
test('should search [Module] data')
```
- Tests search functionality
- Verifies filtering works
- Tests clearing search

#### 4. **Form Test** (if form detected)
```typescript
test('should interact with [Module] form')
```
- Finds Add/Create buttons
- Opens forms/dialogs
- Tests form closing

#### 5. **Button Verification Test**
```typescript
test('should verify [Module] action buttons')
```
- Checks for key action buttons
- Verifies button visibility

#### 6. **Navigation Test**
```typescript
test('should navigate through [Module] sections')
```
- Tests tabs if present
- Verifies sub-navigation

## 🔧 Configuration

### Environment Variables

The generator uses these environment variables:
```bash
URL=https://app-staging.vivacityapp.com
USERNAME=your-email@example.com
PASSWORD=your-password
```

### Fallback Values

If environment variables aren't set, it uses hardcoded fallbacks from `tests/helpers/auth.helper.ts`:
```typescript
export const LOGIN_URL = process.env.URL || 'https://app-staging.vivacityapp.com';
export const VALID_EMAIL = process.env.USERNAME || 'kc@vivacityapp.com';
export const VALID_PASSWORD = process.env.PASSWORD || 'PAOpaopao@9696';
```

## 📅 Automated Scheduling

The system runs automatically:

### GitHub Actions
- **Schedule**: Every Monday at 8 AM UTC
- **Workflow**: `.github/workflows/auto-generate-tests.yml`
- **Action**: Creates PR if new tests are generated

### Azure Pipelines
- **Schedule**: Every Monday at 8 AM UTC  
- **Pipeline**: `azure-pipelines-generate.yml`
- **Action**: Commits new tests to repository

## 📝 Latest Generation Report

From January 19, 2026:

**Total Modules Found**: 12
- Dashboard ✅
- Reports (has tests)
- Properties (has tests)  
- Articles (has tests)
- AI Chat ✅
- Contacts ✅
- Enquiries (has tests)
- Tracking (has tests)
- Promotions (has tests)
- Surveys (has tests)
- Projects (has tests)

**New Tests Generated**: 3
1. `dashboardnew.test.ts` - 5 tests (table, pagination, buttons, navigation)
2. `ai-chatnew.test.ts` - 5 tests (table, pagination, buttons, navigation)
3. `contactsnew.test.ts` - 5 tests (table, pagination, buttons, navigation)

## 🛠️ Advanced Usage

### Debug Mode

To see detailed output and screenshots:

```bash
# Run with debug output
npx tsx scripts/auto-generate-tests.ts

# Check the debug screenshot
open debug-before-scan.png
```

### Test a Specific Module

Use the properties test generation script as a template:

```bash
npx tsx scripts/test-properties-generation.ts
```

This will:
- Log in
- Navigate to Properties
- Analyze the page
- Show detailed information
- Save screenshots

### Customize Test Templates

Edit `scripts/auto-generate-tests.ts`:

```typescript
// Modify these methods:
generateTestFile()        // Main test structure
generateTableTest()       // Table testing logic
generateSearchTest()      // Search functionality
generateFormTest()        // Form interaction
generateButtonTest()      // Button verification
generateNavigationTest()  // Tab/section navigation
```

## 🎯 Best Practices

### 1. Review Generated Tests
Always review auto-generated tests before deploying:
```bash
# Check what was generated
cat tests/auto-generated/GENERATION_REPORT.md

# Review test files
code tests/auto-generated/
```

### 2. Run Tests Locally First
```bash
# Run all auto-generated tests
npx playwright test tests/auto-generated/

# Run specific module
npx playwright test tests/auto-generated/dashboardnew.test.ts
```

### 3. Update Templates Regularly
As your app evolves, update the generation templates to match:
- New UI patterns
- Different component libraries
- Additional test scenarios

### 4. Keep Tests Organized
- Auto-generated tests go in `tests/auto-generated/`
- Manual tests stay in `tests/`
- Shared helpers in `tests/helpers/`

## 🐛 Troubleshooting

### "Found 0 navigation links"

**Problem**: Generator can't find menu items after login.

**Solutions**:
1. Check if login is successful:
   ```bash
   npx playwright test tests/login.test.ts
   ```

2. Verify the navigation selectors in `scanForModules()`:
   ```typescript
   const navLinks = await this.page.locator('[role="menuitem"], nav a, ...').all();
   ```

3. Increase wait time for dynamic content:
   ```typescript
   await this.page.waitForTimeout(5000); // Longer wait
   ```

### "Test file already exists"

**Problem**: Generator won't overwrite existing tests.

**Solutions**:
1. Delete old test to regenerate:
   ```bash
   rm tests/auto-generated/modulename.test.ts
   npm run generate-tests
   ```

2. Or skip - the generator is being smart and not overwriting your work!

### "Module not found during test run"

**Problem**: Generated test can't navigate to module.

**Solutions**:
1. Update the `beforeEach` navigation:
   ```typescript
   const menuItem = page.getByRole('menuitem', { name: /Module/i });
   ```

2. Add fallback navigation methods

3. Increase timeout values

## 📈 Metrics & Reporting

### Summary Report Structure

```markdown
# Auto-Generated Test Summary

Generated on: 2026-01-19T08:29:53.088Z
Total modules detected: 3

## Detected Modules:

### ModuleName
- URL: https://...
- Has Table: ✅/❌
- Has Form: ✅/❌
- Has Search: ✅/❌
- Buttons: [list of detected buttons]
- Inputs: [list of detected inputs]
```

### Test Coverage

Track what's been generated:
```bash
# Count auto-generated test files
ls -1 tests/auto-generated/*.test.ts | wc -l

# See test coverage
npx playwright test tests/auto-generated/ --list
```

## 🔄 Integration with CI/CD

### GitHub Actions Integration

The workflow automatically:
1. Runs every Monday
2. Generates new tests
3. Creates a PR if changes detected
4. Includes the generation report

### Azure DevOps Integration

The pipeline:
1. Runs every Monday
2. Generates tests
3. Commits directly to repository
4. Triggers test execution

## 🎓 Tips & Tricks

### 1. Generate Tests for Production
```bash
URL=https://app.vivacityapp.com npm run generate-tests
```

### 2. Compare Environments
Generate tests for both staging and production to see differences.

### 3. Use as Documentation
The generated tests serve as living documentation of your app's structure.

### 4. Customize Per Module
After generation, enhance tests with:
- Module-specific assertions
- Business logic validation
- Data verification
- Error handling

## 📚 Related Documentation

- `HOW_TO_RUN_AUTO_GENERATE.md` - Step-by-step guide
- `PIPELINE_FAILURE_DEBUG.md` - Troubleshooting CI/CD
- `AUTO_TEST_GENERATION_GUIDE.md` - Original setup guide
- `GENERATION_REPORT.md` - Latest generation results

## 🎉 Success!

You now have a fully automated AI-powered test generation system that:
- ✅ Scans your entire application
- ✅ Generates comprehensive tests
- ✅ Runs on a schedule
- ✅ Creates pull requests automatically
- ✅ Integrates with your CI/CD pipeline

**Happy Testing!** 🚀
