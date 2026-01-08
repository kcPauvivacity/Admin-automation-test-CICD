# Manual Test Case Generation Guide

This guide explains how to automatically generate manual test case documentation from your automated Playwright tests.

---

## 🎯 What It Does

The manual test case generator automatically converts your Playwright automated tests into human-readable manual test case documentation in multiple formats:

- ✅ **Markdown** - Easy to read and share
- ✅ **Excel/CSV** - Spreadsheet format for tracking
- ✅ **Jira** - Ready to import into Jira
- ✅ **TestRail** - Ready to import into TestRail

---

## 🚀 Quick Start

### Generate Manual Test Cases

```bash
# Generate from auto-generated tests only
npm run generate-manual-tests

# Or generate both automated AND manual tests at once
npm run generate-all
```

### Output

All files are saved to `manual-test-cases/` directory:

```
manual-test-cases/
├── manual-test-cases.md      # Markdown format
├── manual-test-cases.csv     # Excel/CSV format
├── jira-import.csv           # Jira import format
├── testrail-import.csv       # TestRail import format
└── SUMMARY.md                # Summary report
```

---

## 📊 Generated Formats

### 1. Markdown Format (manual-test-cases.md)

**Use Case:** Documentation, team reviews, PDF export

**Example:**
```markdown
### PROPERTIES-001: should access Properties page

**Priority:** High | **Type:** Functional

**Description:**
Verify that access Properties page in the Properties module works correctly.

**Preconditions:**
1. User must be logged in to the application
2. User must have appropriate permissions
3. Navigate to Properties module

**Test Steps:**
1. Click on "Properties" link
2. Wait for page to load completely
3. Verify page heading is visible

**Expected Results:**
1. Properties page loads successfully
2. All elements are displayed correctly
```

---

### 2. Excel/CSV Format (manual-test-cases.csv)

**Use Case:** Test execution tracking, reporting

**Columns:**
- Test ID
- Module
- Test Title
- Priority (High/Medium/Low)
- Type (Functional/UI/Integration)
- Description
- Preconditions
- Test Steps
- Expected Results

**How to Use:**
1. Open in Microsoft Excel or Google Sheets
2. Add columns for: Status, Tester, Date, Notes
3. Use for manual test execution tracking
4. Filter by Priority or Module
5. Export reports

---

### 3. Jira Import Format (jira-import.csv)

**Use Case:** Import test cases into Jira

**How to Import:**
1. Go to Jira → Issues → Import Issues from CSV
2. Select `jira-import.csv`
3. Map fields:
   - Summary → Summary
   - Description → Description
   - Priority → Priority
   - Issue Type → Test (or your custom test type)
   - Labels → Labels
4. Click Import
5. All test cases will be created as Jira issues

**Fields Included:**
- Summary: `[TEST-ID] Test Title`
- Description: Full test case with steps and expected results (Jira markdown format)
- Priority: High/Medium/Low
- Issue Type: Test
- Labels: Module name, test type, "Automated"

---

### 4. TestRail Import Format (testrail-import.csv)

**Use Case:** Import test cases into TestRail

**How to Import:**
1. Go to TestRail → Test Cases tab
2. Click "Import" button
3. Select "CSV" format
4. Choose `testrail-import.csv`
5. Map fields:
   - Section → Section
   - Test Case ID → Test Case ID
   - Title → Title
   - Type → Type
   - Priority → Priority
   - Estimate → Estimate
   - Preconditions → Preconditions
   - Steps → Steps
   - Expected Result → Expected Result
6. Click Import

**Fields Included:**
- Section: Module name
- Test Case ID: Unique identifier
- Title: Test case title
- Type: Functional/UI/Integration
- Priority: High/Medium/Low
- Estimate: 5 minutes (default)
- Automation Type: Automated (Playwright)
- Preconditions: Setup requirements
- Steps: Numbered test steps
- Expected Result: Expected outcomes

---

## 📋 Test Case Structure

Each generated test case includes:

### 1. Test ID
Format: `{MODULE}-{NUMBER}`
- Example: `PROPERTIES-001`, `ARTICLES-002`
- Unique identifier for each test
- Makes it easy to reference in bug reports

### 2. Module
The module/feature being tested
- Extracted from file name or describe block
- Examples: "Properties", "Articles", "Dashboard"

### 3. Title
What the test verifies
- Extracted from test() block
- Examples: "should access Properties page", "should display table"

### 4. Priority
**Automatically determined:**
- **High:** Login, access, authentication, critical features
- **Medium:** Most functional tests
- **Low:** Formatting, styling, tooltips

### 5. Type
**Automatically classified:**
- **Functional:** General feature testing
- **UI:** Display, visibility, formatting tests
- **Integration:** End-to-end workflows

### 6. Description
Clear explanation of what's being tested
- Auto-generated from test title
- Format: "Verify that {action} in the {module} module works correctly"

### 7. Preconditions
What must be true before running the test
- User logged in
- Appropriate permissions
- Navigate to module

### 8. Test Steps
**Automatically extracted from code:**
- Navigation actions (goto, click)
- Input actions (fill, type)
- Wait actions (waitForStable, waitForLoadState)
- Verification actions (expect)

### 9. Expected Results
**Automatically extracted from:**
- `expect()` assertions
- Console log success messages
- Default: "Test should complete successfully"

---

## 🔧 Customization

### Modify Test Case Content

Edit the generator script: `scripts/generate-manual-test-cases.ts`

#### Change Priority Rules:
```typescript
determinePriority(title: string, body: string): 'High' | 'Medium' | 'Low' {
    const highPriorityKeywords = ['login', 'access', 'payment', 'checkout'];
    const lowPriorityKeywords = ['format', 'styling', 'tooltip'];
    // Add your custom logic
}
```

#### Change Test Type Classification:
```typescript
determineTestType(title: string, body: string): 'Functional' | 'UI' | 'Integration' {
    if (titleLower.includes('workflow')) return 'Integration';
    if (titleLower.includes('display')) return 'UI';
    return 'Functional';
}
```

#### Customize Test Steps Extraction:
```typescript
extractSteps(body: string): string[] {
    const actions = [
        { pattern: /your-custom-pattern/g, step: 'Your custom step' },
        // Add more patterns
    ];
}
```

---

## 🔄 Integration with CI/CD

### Automatic Generation

The manual test cases are automatically generated in CI/CD:

**Weekly Schedule (Monday 8 AM UTC):**
1. Auto-generate automated tests
2. Generate manual test cases
3. Create Pull Request with both
4. Upload as artifacts

**Workflow:** `.github/workflows/auto-generate-tests.yml`

### Manual Trigger

Trigger manually from GitHub Actions:
1. Go to Actions tab
2. Select "Auto-Generate Tests"
3. Click "Run workflow"
4. Download manual test cases from Artifacts

---

## 📊 Example Use Cases

### Use Case 1: QA Team Manual Testing

**Scenario:** QA team needs to manually test new features

**Steps:**
1. Run `npm run generate-manual-tests`
2. Open `manual-test-cases/manual-test-cases.csv` in Excel
3. Add columns: "Status", "Tester", "Date", "Notes", "Bug ID"
4. Distribute to QA team
5. Team executes tests and fills in results
6. Track progress and report

### Use Case 2: Documentation for Stakeholders

**Scenario:** Product managers need to review test coverage

**Steps:**
1. Run `npm run generate-manual-tests`
2. Open `manual-test-cases/manual-test-cases.md`
3. Convert to PDF using tool like Pandoc
4. Share with stakeholders
5. Get feedback on test scenarios

### Use Case 3: Import to Test Management Tool

**Scenario:** Team uses Jira for test management

**Steps:**
1. Run `npm run generate-manual-tests`
2. Open Jira → Issues → Import
3. Select `manual-test-cases/jira-import.csv`
4. Map fields and import
5. All test cases now in Jira
6. Create test execution issues
7. Link to user stories

### Use Case 4: Onboarding New Testers

**Scenario:** New QA engineer joining the team

**Steps:**
1. Share `manual-test-cases/manual-test-cases.md`
2. New tester learns:
   - All features in the application
   - How to test each module
   - Expected behavior
   - Test preconditions
3. Faster onboarding

---

## 📈 Statistics & Reporting

### Summary Report

File: `manual-test-cases/SUMMARY.md`

**Contains:**
- Total test suites
- Total test cases
- Breakdown by priority (High/Medium/Low)
- Breakdown by type (Functional/UI/Integration)
- Per-module statistics

**Example:**
```
## Overview
- Total Test Suites: 11
- Total Test Cases: 31

## By Priority
- High: 11
- Medium: 20
- Low: 0

## Test Suites
| Module | Test Cases | High | Medium | Low |
|--------|-----------|------|--------|-----|
| Properties | 3 | 1 | 2 | 0 |
| Articles | 3 | 1 | 2 | 0 |
```

---

## 🎯 Best Practices

### 1. Keep Automated Tests Well-Structured

Good automated test = Good manual test case

**Good:**
```typescript
test('should allow user to create new property', async ({ page }) => {
    await page.click('button:has-text("Add Property")');
    await page.fill('input[name="name"]', 'Test Property');
    await page.click('button[type="submit"]');
    await expect(page.locator('.success-message')).toBeVisible();
});
```

**Result:** Clear, detailed manual test case

### 2. Use Descriptive Test Titles

```typescript
// ❌ Bad
test('test 1', async ({ page }) => { ... });

// ✅ Good
test('should display property list with correct columns', async ({ page }) => { ... });
```

### 3. Add Console Logs for Success Messages

```typescript
test('should save property successfully', async ({ page }) => {
    // ... test steps ...
    console.log('✅ Property saved successfully');
    console.log('✅ Success message displayed');
});
```

These logs become expected results in manual tests!

### 4. Regenerate After Updates

Whenever you update automated tests:
```bash
npm run generate-manual-tests
```

Keep manual documentation in sync with automation!

---

## 🔍 Troubleshooting

### No Test Cases Generated

**Problem:** `Found 0 test suites`

**Solution:**
- Check test directory path: `tests/auto-generated/`
- Ensure test files end with `.test.ts` or `.spec.ts`
- Verify test files have `test()` blocks

### Missing Test Steps

**Problem:** Generated test case has generic steps only

**Solution:**
- Add more specific actions in your test code
- Use `await page.click()`, `await page.fill()` etc.
- Add console.log statements

### Incorrect Priority/Type

**Problem:** Test has wrong priority or type classification

**Solution:**
- Edit `scripts/generate-manual-test-cases.ts`
- Modify `determinePriority()` or `determineTestType()` methods
- Add custom keywords

---

## 📞 Support

For issues or questions:
1. Check this guide
2. Review example files in `manual-test-cases/`
3. Check GitHub Actions logs for generation errors
4. Review the generator script: `scripts/generate-manual-test-cases.ts`

---

**Last Updated:** January 8, 2026  
**Generator Version:** 1.0.0  
**Supported Formats:** Markdown, CSV, Jira, TestRail
