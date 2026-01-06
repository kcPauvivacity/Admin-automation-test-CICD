# Quick Start: Automatic Test Generation

## 🚀 Generate Tests for New Modules in 3 Steps

### Step 1: Run the Generator
```bash
npm run generate-tests
```

### Step 2: Review Generated Tests
```bash
ls tests/auto-generated/
```

### Step 3: Run the New Tests
```bash
npx playwright test tests/auto-generated/
```

## 📋 What Happens?

1. **Logs into your app** automatically
2. **Scans all navigation links** to find modules
3. **Analyzes each page** to detect:
   - Tables/Lists
   - Forms
   - Search functionality
   - Buttons and inputs
   - Navigation tabs

4. **Generates test files** for each module:
   ```
   tests/auto-generated/
   ├── properties.test.ts
   ├── articles.test.ts
   ├── tags.test.ts
   └── GENERATION_REPORT.md
   ```

5. **Creates a summary report** with all detected features

## 💡 Example Output

```bash
$ npm run generate-tests

🚀 Initializing test generator...
🔐 Logging in...
✅ Login successful
🔍 Scanning for modules...
  📂 Found module: Properties
  📂 Found module: Articles
  📂 Found module: Tags
  📂 Found module: Facilities
✅ Found 4 modules
💾 Saving test files...
  ✅ Created: tests/auto-generated/properties.test.ts
  ✅ Created: tests/auto-generated/articles.test.ts
  ✅ Created: tests/auto-generated/tags.test.ts
  ✅ Created: tests/auto-generated/facilities.test.ts
📊 Summary report saved: tests/auto-generated/GENERATION_REPORT.md
🎉 Test generation completed!
```

## 🎯 When to Use?

- ✅ New module added to website
- ✅ After major UI updates
- ✅ Regular monthly scans for changes
- ✅ Before major releases
- ✅ When onboarding new team members (generates documentation)

## 🔧 Customization

### Use Different Credentials
```bash
export BASE_URL="https://your-app.com"
export TEST_USERNAME="your-email"
export TEST_PASSWORD="your-password"
npm run generate-tests
```

### Customize Generated Tests
After generation, edit the files in `tests/auto-generated/` to add:
- Specific business logic validations
- Custom data assertions
- Additional test scenarios

## 📊 Review the Report

Check `tests/auto-generated/GENERATION_REPORT.md`:
- See all detected modules
- Check what features were found
- Verify detection accuracy

## ⚡ Quick Tips

1. **Run with --headed to watch it scan**:
   ```bash
   # Edit scripts/auto-generate-tests.ts
   # Change: chromium.launch({ headless: false })
   ```

2. **Only generate for specific modules**:
   ```bash
   # Edit the generator to filter modules
   if (moduleName.includes('Properties')) {
       // Only generate for Properties
   }
   ```

3. **Integrate with CI/CD**:
   ```yaml
   - name: Generate tests
     run: npm run generate-tests
   - name: Commit new tests
     run: git add tests/auto-generated/ && git commit -m "Generated tests"
   ```

## 🎉 That's It!

You now have:
- ✅ Auto-generated test files
- ✅ Tests with auto-healing built-in
- ✅ Comprehensive coverage of new modules
- ✅ Documentation of detected features

---

**Read more:** `AUTO_TEST_GENERATION_GUIDE.md`
