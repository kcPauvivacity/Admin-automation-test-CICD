# Auto-Healing Test Framework

## 🔧 What is Auto-Healing?

Auto-healing automatically recovers from common test failures by:
- Trying multiple selector strategies
- Retrying failed actions with exponential backoff
- Handling stale element references
- Waiting for page stability
- Managing popups and loading states

## 📋 Features

### 1. **Smart Click** - Multiple Selector Fallbacks
```typescript
await healer.smartClick([
    'button#submit',
    'button[type="submit"]',
    'button:has-text("Submit")',
    '.submit-button'
]);
```

### 2. **Smart Fill** - Input with Retries
```typescript
await healer.smartFill(
    ['input[name="email"]', 'input[type="email"]', '#email'],
    'user@example.com'
);
```

### 3. **Smart Wait** - Flexible Element Waiting
```typescript
await healer.smartWaitFor([
    'text=Dashboard',
    '[class*="dashboard"]',
    '#dashboard-container'
], { timeout: 15000 });
```

### 4. **Smart Navigate** - Navigation with Retries
```typescript
await healer.smartNavigate('https://example.com', {
    waitUntil: 'load',
    timeout: 30000
});
```

### 5. **Wait for Stable** - Handle Loading States
```typescript
await healer.waitForStable(); // Waits for loaders to disappear
```

### 6. **Handle Popups** - Auto-close Modals
```typescript
await healer.handlePopups(); // Closes common popup/modal patterns
```

### 7. **Stale Element Retry** - Handle DOM Changes
```typescript
await healer.withStaleRetry(async () => {
    const element = page.locator('.dynamic-element');
    await element.click();
});
```

### 8. **Smart Text Verification** - Flexible Text Matching
```typescript
await healer.smartExpectText(
    ['h1', 'h2', '.heading'],
    /welcome/i
);
```

### 9. **Smart Scroll** - Scroll into View
```typescript
await healer.smartScrollTo(['.target-element', '#target']);
```

## 🚀 How to Use

### Basic Usage

```typescript
import { test } from '@playwright/test';
import { createAutoHealing } from './helpers/auto-healing.helper';

test('my test with auto-healing', async ({ page }) => {
    const healer = createAutoHealing(page);
    
    // Use auto-healing methods
    await healer.smartNavigate('https://example.com');
    await healer.waitForStable();
    await healer.smartClick('button#login');
});
```

### Converting Existing Tests

**Before (Regular):**
```typescript
await page.click('button#submit');
await page.fill('input[name="email"]', 'test@example.com');
```

**After (Auto-Healing):**
```typescript
const healer = createAutoHealing(page);
await healer.smartClick([
    'button#submit',
    'button[type="submit"]',
    'button:has-text("Submit")'
]);
await healer.smartFill(
    ['input[name="email"]', 'input[type="email"]'],
    'test@example.com'
);
```

## 💡 Best Practices

1. **Provide Multiple Selectors** - Always provide fallback selectors
   ```typescript
   // Good: Multiple fallbacks
   await healer.smartClick([
       '#primary-button',
       'button.primary',
       'button:has-text("Click Me")'
   ]);
   
   // Less robust: Single selector
   await healer.smartClick('#primary-button');
   ```

2. **Wait for Stability** - Wait for page to finish loading
   ```typescript
   await healer.smartNavigate(url);
   await healer.waitForStable(); // Wait for loading indicators
   ```

3. **Handle Popups Early** - Clear popups before interactions
   ```typescript
   await healer.handlePopups(); // Clear any blocking modals
   await healer.smartClick('button'); // Then interact
   ```

4. **Use Stale Retry for Dynamic Content**
   ```typescript
   await healer.withStaleRetry(async () => {
       // Code that might encounter stale elements
       const items = await page.locator('.item').all();
       await items[0].click();
   });
   ```

## 🔍 Debugging

Auto-healing logs all attempts:
```
✅ Auto-heal: Found element with selector: button#submit
🔧 Auto-heal: Normal click failed, trying force click
⚠️ Auto-heal: Attempt 1 failed: Element not found
🔍 Auto-heal: Trying text-based fallback (retry 2/3)
✅ Auto-heal: Text verification passed with selector: h1
```

## ⚙️ Configuration

Modify retry behavior in `auto-healing.helper.ts`:
```typescript
private maxRetries: number = 3;     // Number of retry attempts
private retryDelay: number = 1000;  // Delay between retries (ms)
```

## 📊 Common Patterns

### Login with Auto-Healing
```typescript
const healer = createAutoHealing(page);
await healer.smartNavigate(LOGIN_URL);
await healer.smartFill(['input[name="username"]'], email);
await healer.smartClick('button[type="submit"]');
await healer.smartFill(['input[name="password"]'], password);
await healer.smartClick('button[type="submit"]');
await healer.waitForStable();
```

### Navigation with Auto-Healing
```typescript
const healer = createAutoHealing(page);
await healer.smartClick(['text=Properties', 'a[href*="properties"]']);
await page.waitForLoadState('load');
await healer.waitForStable();
```

### Form Submission with Auto-Healing
```typescript
const healer = createAutoHealing(page);
await healer.smartFill(['input[name="name"]'], 'Test Name');
await healer.smartFill(['input[name="email"]'], 'test@example.com');
await healer.smartClick(['button:has-text("Submit")', 'button[type="submit"]']);
await healer.waitForStable();
```

## 🎯 Benefits

1. **Resilient Tests** - Tests continue working even when selectors change
2. **Reduced Maintenance** - Less test updates needed when UI changes
3. **Better Failure Handling** - Automatic retries reduce flaky tests
4. **Detailed Logging** - Easy to debug when tests do fail
5. **Flexible Matching** - Multiple strategies to find elements

## 🚨 When to Use

✅ **Use Auto-Healing For:**
- Elements with changing selectors
- Dynamic content that loads asynchronously
- Pages with loading indicators
- Forms with multiple possible selectors
- Tests that need to be resilient to UI changes

❌ **Don't Use Auto-Healing For:**
- Testing that specific selectors exist (selector validation tests)
- Performance-critical test scenarios
- When you need exact, deterministic behavior

## 📝 Example: Converting an Existing Test

**Original Test:**
```typescript
test('navigate to properties', async ({ page }) => {
    await page.goto('https://example.com');
    await page.click('text=Properties');
    await page.waitForSelector('h1:has-text("Properties")');
});
```

**With Auto-Healing:**
```typescript
test('navigate to properties', async ({ page }) => {
    const healer = createAutoHealing(page);
    
    await healer.smartNavigate('https://example.com');
    await healer.waitForStable();
    await healer.smartClick([
        'text=Properties',
        'a[href*="properties"]',
        '[data-testid="properties-link"]'
    ]);
    await healer.waitForStable();
    await healer.smartExpectText(['h1', 'h2'], /properties/i);
});
```

## 🔗 Related Files

- `tests/helpers/auto-healing.helper.ts` - Main auto-healing implementation
- `tests/auto-healing-example.test.ts` - Example tests using auto-healing
- `tests/helpers/auth.helper.ts` - Authentication helper (can be enhanced with auto-healing)

---

**Happy Testing with Auto-Healing! 🎉**
