# Automatic Test Case Generator

## 🤖 What is it?

An intelligent tool that automatically scans your website and generates test cases for new modules/features without manual intervention.

## ✨ Features

- 🔍 **Auto-Discovery** - Automatically finds all modules in your application
- 📝 **Smart Test Generation** - Creates comprehensive test cases based on page elements
- 🔧 **Auto-Healing Integration** - Generated tests use auto-healing for resilience
- 📊 **Detailed Reports** - Generates summary reports of detected modules
- 🎯 **Feature Detection** - Identifies tables, forms, search, and other UI patterns

## 🚀 How to Use

### 1. Run the Generator

```bash
# Using npm script
npm run generate-tests

# Or directly with ts-node
npx ts-node scripts/auto-generate-tests.ts
```

### 2. Set Environment Variables (Optional)

```bash
export URL="https://your-app.com"
export USERNAME="your-email@example.com"
export PASSWORD="your-password"

npm run generate-tests
```

### 3. Review Generated Tests

Generated tests will be in: `tests/auto-generated/`

Example structure:
```
tests/auto-generated/
├── properties.test.ts
├── articles.test.ts
├── tags.test.ts
├── facilities.test.ts
└── GENERATION_REPORT.md
```

## 📋 What Gets Generated

### For Each Module, Tests Are Created For:

1. **Page Access Test**
   - Navigates to the module
   - Verifies page loads correctly
   - Checks for main heading

2. **Table/List Test** (if detected)
   - Verifies data table/list is visible
   - Counts rows/items
   - Ensures data is present

3. **Search Test** (if detected)
   - Tests search input functionality
   - Performs test search
   - Clears search

4. **Form Test** (if detected)
   - Clicks Add/Create button
   - Verifies form opens
   - Tests form close functionality

5. **Navigation Test**
   - Tests tabs and sub-navigation
   - Verifies all sections are accessible

## 🔍 Detection Capabilities

The generator automatically detects:

- ✅ Navigation menu items
- ✅ Tables and data grids
- ✅ Forms and input fields
- ✅ Search functionality
- ✅ Buttons and links
- ✅ Tabs and sub-navigation
- ✅ Modals and dialogs

## 📊 Example Generated Test

```typescript
import { test, expect } from '@playwright/test';
import { loginToApp } from './helpers/auth.helper';
import { createAutoHealing } from './helpers/auto-healing.helper';

test.describe('New Module Tests', () => {
    test.beforeEach(async ({ page }) => {
        await loginToApp(page);
        await page.waitForLoadState('load');
    });

    test('should access New Module page', async ({ page }) => {
        test.setTimeout(60000);
        
        const healer = createAutoHealing(page);
        await healer.waitForStable();
        
        await healer.smartClick([
            'text=New Module',
            'a:has-text("New Module")',
            '[href*="new-module"]'
        ]);
        
        await page.waitForLoadState('load');
        await healer.waitForStable();
        
        const heading = page.locator('h1, h2, h3').first();
        await expect(heading).toBeVisible({ timeout: 10000 });
    });

    // ... more tests based on detected features
});
```

## 🎯 Use Cases

### 1. After Website Updates
```bash
# New module added to the website?
npm run generate-tests

# Review generated tests
ls tests/auto-generated/

# Run new tests
npx playwright test tests/auto-generated/
```

### 2. Regular Scanning
Add to your CI/CD pipeline:
```yaml
- name: Generate tests for new modules
  run: npm run generate-tests
  
- name: Commit new tests
  run: |
    git add tests/auto-generated/
    git commit -m "Auto-generated tests for new modules"
```

### 3. Documentation
The generator creates a detailed report:
```markdown
# Auto-Generated Test Summary

Generated on: 2026-01-06T10:00:00.000Z
Total modules detected: 12

## Detected Modules:

### Properties
- URL: https://app.example.com/properties
- Has Table: ✅
- Has Form: ✅
- Has Search: ✅
- Buttons: Add, Edit, Delete, Export, Import
- Inputs: name, location, price, type, status
```

## ⚙️ Configuration

### Customize Generation

Edit `scripts/auto-generate-tests.ts`:

```typescript
// Adjust timeouts
test.setTimeout(60000); // Change default timeout

// Add more test patterns
generateCustomTest(module: ModuleInfo): string {
    // Your custom test generation logic
}

// Filter modules
if (moduleName.includes('Admin')) {
    // Skip or customize admin module tests
}
```

### Customize Detection

```typescript
// Detect custom elements
const hasCustomWidget = await this.page.locator('[data-widget]').count() > 0;

// Add to ModuleInfo interface
interface ModuleInfo {
    // ... existing fields
    hasCustomWidget: boolean;
}
```

## 🔄 Workflow

1. **Developer adds new module** → Website updated
2. **Run generator** → `npm run generate-tests`
3. **Review generated tests** → Check `tests/auto-generated/`
4. **Customize if needed** → Edit generated tests
5. **Run tests** → `npx playwright test`
6. **Commit** → Save to repository

## 📝 Best Practices

1. **Review Generated Tests** - Always review before committing
2. **Customize as Needed** - Generated tests are a starting point
3. **Run Regularly** - Run after each deployment to catch new modules
4. **Keep Generator Updated** - Update detection logic as UI patterns change
5. **Use with Auto-Healing** - Generated tests already use auto-healing

## 🚨 Limitations

- Generated tests are basic and may need customization
- Complex interactions require manual test writing
- May not detect all UI patterns
- Requires manual review for business logic validation

## 🔗 Integration with Existing Tests

Generated tests use the same helpers:
- ✅ `loginToApp()` from `auth.helper.ts`
- ✅ `createAutoHealing()` from `auto-healing.helper.ts`
- ✅ Standard Playwright test structure

## 📊 Success Metrics

After generation, check:
- ✅ Number of new tests created
- ✅ Code coverage increase
- ✅ Module detection accuracy
- ✅ Test execution success rate

## 🎉 Benefits

1. **Faster Test Creation** - Instant test generation for new modules
2. **Consistent Structure** - All tests follow the same pattern
3. **Auto-Healing Built-in** - Generated tests are resilient
4. **Documentation** - Detailed reports of detected modules
5. **CI/CD Ready** - Easy to integrate into pipelines

---

**Happy Auto-Testing! 🚀**
