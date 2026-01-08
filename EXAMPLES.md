# Examples: Auto-Healing and Auto-Generation

## 📋 Table of Contents
1. [Auto-Healing Examples](#auto-healing-examples)
2. [Auto-Generation Examples](#auto-generation-examples)
3. [Before & After Comparisons](#before--after-comparisons)
4. [Live Demo](#live-demo)

---

## 🔧 Auto-Healing Examples

### Example 1: Smart Click with Multiple Selectors

**Problem:** Button selector changes from `#submit-btn` to `.submit-button`

**Without Auto-Healing:**
```typescript
// ❌ Breaks when selector changes
await page.click('#submit-btn'); // FAILS if selector changes
```

**With Auto-Healing:**
```typescript
// ✅ Works even if selector changes
const healer = createAutoHealing(page);
await healer.smartClick([
    '#submit-btn',           // Try first
    '.submit-button',        // Try second
    'button[type="submit"]', // Try third
    'button:has-text("Submit")'  // Try fourth
]);
// Automatically finds the button using any matching selector!
```

### Example 2: Smart Fill with Fallbacks

**Problem:** Input field name changes from `username` to `email`

**Without Auto-Healing:**
```typescript
// ❌ Breaks when name changes
await page.fill('input[name="username"]', 'test@example.com');
```

**With Auto-Healing:**
```typescript
// ✅ Works with multiple possible selectors
const healer = createAutoHealing(page);
await healer.smartFill(
    [
        'input[name="username"]',
        'input[name="email"]',
        'input[type="email"]',
        '#email-field'
    ],
    'test@example.com'
);
// Automatically finds the input field!
```

### Example 3: Handle Loading States

**Problem:** Page has loading spinners that block interactions

**Without Auto-Healing:**
```typescript
// ❌ May click before page is ready
await page.click('button');
```

**With Auto-Healing:**
```typescript
// ✅ Waits for page to be stable
const healer = createAutoHealing(page);
await healer.waitForStable(); // Waits for loading indicators
await healer.smartClick('button'); // Now safe to click
```

### Example 4: Handle Stale Elements

**Problem:** Element becomes stale during dynamic page updates

**Without Auto-Healing:**
```typescript
// ❌ May fail with "stale element" error
const items = await page.locator('.item').all();
await items[0].click(); // FAILS if DOM updates
```

**With Auto-Healing:**
```typescript
// ✅ Automatically retries on stale elements
const healer = createAutoHealing(page);
await healer.withStaleRetry(async () => {
    const items = await page.locator('.item').all();
    await items[0].click();
});
// Automatically retries if element becomes stale!
```

---

## 🤖 Auto-Generation Examples

### Example 1: Generate Tests for New Module

**Scenario:** Developer adds a new "Bookings" module to the website

**Run Generator:**
```bash
npm run generate-tests
```

**Output:**
```
🚀 Initializing test generator...
🔐 Logging in...
✅ Login successful
🔍 Scanning for modules...
  📂 Found module: Dashboard
  📂 Found module: Properties
  📂 Found module: Bookings  ← NEW!
  📂 Found module: Articles
✅ Found 4 modules
💾 Saving test files...
  ⚠️ Test file already exists: dashboard.test.ts
  ⚠️ Test file already exists: properties.test.ts
  ✅ Created: tests/auto-generated/bookings.test.ts  ← NEW!
  ⚠️ Test file already exists: articles.test.ts
📊 Summary report saved
🎉 Test generation completed!
```

**Generated Test File:** `tests/auto-generated/bookings.test.ts`
```typescript
import { test, expect } from '@playwright/test';
import { loginToApp } from './helpers/auth.helper';
import { createAutoHealing } from './helpers/auto-healing.helper';

test.describe('Bookings Tests', () => {
    test.beforeEach(async ({ page }) => {
        await loginToApp(page);
        await page.waitForLoadState('load');
    });

    test('should access Bookings page', async ({ page }) => {
        test.setTimeout(60000);
        
        const healer = createAutoHealing(page);
        await healer.waitForStable();
        
        await healer.smartClick([
            'text=Bookings',
            'a:has-text("Bookings")',
            '[href*="bookings"]'
        ]);
        
        await page.waitForLoadState('load');
        await healer.waitForStable();
        
        const heading = page.locator('h1, h2, h3').first();
        await expect(heading).toBeVisible({ timeout: 10000 });
    });

    test('should display Bookings list/table', async ({ page }) => {
        // Auto-generated table test
        const table = page.locator('table, [role="grid"]').first();
        await expect(table).toBeVisible({ timeout: 10000 });
    });

    test('should search in Bookings', async ({ page }) => {
        // Auto-generated search test
        const searchInput = page.locator('input[type="search"]').first();
        await searchInput.fill('test');
    });
});
```

### Example 2: Generation Report

**Generated Report:** `tests/auto-generated/GENERATION_REPORT.md`
```markdown
# Auto-Generated Test Summary

Generated on: 2026-01-07T10:30:00.000Z
Total modules detected: 4

## Detected Modules:

### Bookings (NEW!)
- URL: https://app-staging.vivacityapp.com/bookings
- Has Table: ✅
- Has Form: ✅
- Has Search: ✅
- Buttons: Add Booking, Edit, Delete, Export, Filter
- Inputs: customer-name, date, property, status

### Properties
- URL: https://app-staging.vivacityapp.com/properties
- Has Table: ✅
- Has Form: ✅
- Has Search: ✅
- Buttons: Add, Edit, Delete, Export
- Inputs: name, location, price, type
```

---

## 🔄 Before & After Comparisons

### Comparison 1: Login Test

**BEFORE (Regular Test):**
```typescript
test('login test', async ({ page }) => {
    await page.goto('https://app.example.com');
    await page.click('input[name="username"]');
    await page.fill('input[name="username"]', 'user@example.com');
    await page.click('button[type="submit"]');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForSelector('text=Dashboard');
});
// ❌ Breaks if selectors change
// ❌ No retry on failures
// ❌ Doesn't handle loading states
```

**AFTER (With Auto-Healing):**
```typescript
test('login test', async ({ page }) => {
    const healer = createAutoHealing(page);
    
    await healer.smartNavigate('https://app.example.com');
    await healer.waitForStable();
    
    await healer.smartFill(
        ['input[name="username"]', 'input[type="email"]', '#username'],
        'user@example.com'
    );
    await healer.smartClick(['button[type="submit"]', 'button:has-text("Continue")']);
    
    await healer.smartFill(
        ['input[name="password"]', 'input[type="password"]'],
        'password123'
    );
    await healer.smartClick(['button[type="submit"]', 'button:has-text("Login")']);
    
    await healer.waitForStable();
    await healer.smartWaitFor(['text=Dashboard', 'text=Welcome']);
});
// ✅ Multiple selector fallbacks
// ✅ Automatic retries
// ✅ Handles loading states
// ✅ Resilient to UI changes
```

### Comparison 2: Form Submission

**BEFORE (Regular Test):**
```typescript
test('submit form', async ({ page }) => {
    await page.click('button:has-text("Add")');
    await page.fill('input[name="title"]', 'Test Title');
    await page.fill('input[name="description"]', 'Test Description');
    await page.click('button:has-text("Submit")');
    await page.waitForSelector('text=Success');
});
// ❌ No popup handling
// ❌ Doesn't wait for loading
// ❌ Single selector only
```

**AFTER (With Auto-Healing):**
```typescript
test('submit form', async ({ page }) => {
    const healer = createAutoHealing(page);
    
    await healer.handlePopups(); // Auto-close any popups
    await healer.waitForStable(); // Wait for page to load
    
    await healer.smartClick([
        'button:has-text("Add")',
        'button:has-text("Create")',
        '[aria-label="Add"]'
    ]);
    
    await healer.smartFill(
        ['input[name="title"]', '#title', '[placeholder*="title"]'],
        'Test Title'
    );
    
    await healer.smartFill(
        ['input[name="description"]', 'textarea[name="description"]'],
        'Test Description'
    );
    
    await healer.smartClick([
        'button:has-text("Submit")',
        'button[type="submit"]',
        'button:has-text("Save")'
    ]);
    
    await healer.waitForStable(); // Wait for submission
    await healer.smartExpectText(['[role="alert"]', '.message'], /success/i);
});
// ✅ Handles popups automatically
// ✅ Waits for loading states
// ✅ Multiple selector fallbacks
// ✅ Flexible text matching
```

---

## 🎬 Live Demo

### Demo 1: Run Auto-Healing Example Tests

```bash
# Run the auto-healing example tests
npx playwright test auto-healing-example.test.ts --headed

# Watch it handle:
# - Multiple selector attempts
# - Automatic retries
# - Stale element recovery
# - Loading state handling
```

### Demo 2: Generate Tests for Your Website

```bash
# Step 1: Run the generator
npm run generate-tests

# Step 2: Check generated files
ls tests/auto-generated/

# Step 3: View the report
cat tests/auto-generated/GENERATION_REPORT.md

# Step 4: Run generated tests
npx playwright test tests/auto-generated/ --headed
```

### Demo 3: Compare Regular vs Auto-Healing

**Create a test that will fail with regular Playwright:**

```typescript
// regular-test.test.ts
test('regular test - might fail', async ({ page }) => {
    await page.goto('https://app-staging.vivacityapp.com');
    await page.click('button#old-selector'); // ❌ Fails if selector changed
});
```

**Same test with auto-healing:**

```typescript
// auto-heal-test.test.ts
test('auto-healing test - resilient', async ({ page }) => {
    const healer = createAutoHealing(page);
    await healer.smartNavigate('https://app-staging.vivacityapp.com');
    await healer.smartClick([
        'button#old-selector',
        'button#new-selector',
        'button.submit-btn',
        'button:has-text("Submit")'
    ]); // ✅ Tries multiple selectors
});
```

---

## 📊 Real-World Example: Viva AI Test

### Original Test (Before Auto-Healing):
```typescript
test('access Viva AI', async ({ page }) => {
    await loginToApp(page);
    await page.waitForTimeout(2000);
    
    const vivaAIButton = page.getByRole('link', { name: /viva ai/i }).or(
        page.getByRole('button', { name: /viva ai/i })
    ).first();
    
    await vivaAIButton.click({ timeout: 10000 });
    await page.waitForTimeout(2000);
    
    const chatWindow = page.locator('[class*="chat"]').first();
    await expect(chatWindow).toBeVisible({ timeout: 10000 });
});
```

### Enhanced with Auto-Healing:
```typescript
test('access Viva AI', async ({ page }) => {
    await loginToApp(page);
    
    const healer = createAutoHealing(page);
    await healer.waitForStable(); // Better than arbitrary timeout
    await healer.handlePopups(); // Close any blocking modals
    
    // Multiple selector strategies
    await healer.smartClick([
        'text=VIVA AI',
        'a:has-text("VIVA AI")',
        'button:has-text("VIVA AI")',
        '[aria-label*="viva ai" i]',
        '[data-testid="viva-ai-button"]'
    ]);
    
    await healer.waitForStable(); // Wait for chat to load
    
    // Flexible verification
    await healer.smartWaitFor([
        '[class*="chat"]',
        '[class*="sidebar"]',
        '[role="dialog"]',
        '[data-testid="chat-window"]'
    ]);
});
```

---

## 🎯 Key Takeaways

### Auto-Healing Benefits:
1. **Resilience** - Tests work even when UI changes
2. **Maintenance** - Less updates needed
3. **Stability** - Handles loading states automatically
4. **Reliability** - Automatic retries on failures

### Auto-Generation Benefits:
1. **Speed** - Instant test creation
2. **Coverage** - Comprehensive test scenarios
3. **Consistency** - Same structure for all tests
4. **Documentation** - Detailed reports

### When to Use:
- ✅ Auto-Healing: All tests
- ✅ Auto-Generation: New modules
- ✅ Together: Maximum efficiency

---

**Try it yourself:**
```bash
npm run generate-tests
npx playwright test tests/auto-generated/ --headed
```
