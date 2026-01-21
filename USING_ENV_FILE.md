# 🔐 Using .env File for Configuration

## Overview

Instead of using environment variables, you can now store your test credentials in a `.env` file. This approach is more convenient for local development and keeps sensitive information secure.

## Quick Setup

### 1. Copy the Example File

```bash
cp .env.example .env
```

### 2. Edit the .env File

Open `.env` and fill in your actual credentials:

```env
# Login Credentials
USERNAME=kc@vivacityapp.com
PASSWORD=your-actual-password-here

# Application URL
URL=https://app-staging.vivacityapp.com

# Email Configuration (Optional)
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_RECIPIENTS=recipient1@example.com,recipient2@example.com
```

### 3. Run Tests

```bash
# Run all tests
npm test

# Run specific test
npx playwright test tests/login.test.ts

# Run with UI
npx playwright test --ui
```

## How It Works

### Configuration Loading

1. **playwright.config.ts** loads `.env` file using `dotenv` package
2. **tests/config.ts** reads environment variables and provides them to tests
3. **Tests** import from `config.ts` instead of hardcoding values

### File Structure

```
Applications/
├── .env                  # Your actual credentials (NOT committed to git)
├── .env.example          # Template file (committed to git)
├── playwright.config.ts  # Loads dotenv
├── tests/
│   ├── config.ts        # Configuration helper
│   └── login.test.ts    # Uses config.ts
```

## Security Features

### ✅ What's Protected

- `.env` is in `.gitignore` - **never committed to git**
- Credentials stay on your local machine
- Each developer has their own `.env` file
- Template (`.env.example`) is committed for reference

### ⚠️ Important Rules

1. **NEVER commit `.env` file** - it contains sensitive passwords
2. **ALWAYS use `.env.example`** as template
3. **NEVER share passwords** via chat/email/Slack
4. **Keep `.env` file** in your local workspace only

## Azure Pipeline Configuration

For Azure Pipeline, continue using **Variable Groups** (not .env files):

1. Go to Azure DevOps → Library → Variable Groups
2. Create/edit `playwright-secrets` variable group
3. Add variables:
   - `USERNAME`: kc@vivacityapp.com
   - `PASSWORD`: (mark as secret)
   - `URL`: https://app-staging.vivacityapp.com

### Why Different Approaches?

- **Local Development**: `.env` file (convenient, secure)
- **Azure Pipeline**: Variable Groups (CI/CD standard, managed secrets)

## Configuration Variables

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `USERNAME` | Admin login email | kc@vivacityapp.com |
| `PASSWORD` | Admin password | your-password |
| `URL` | Application URL | https://app-staging.vivacityapp.com |

### Optional Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `EMAIL_USER` | Gmail for sending reports | your-email@gmail.com |
| `EMAIL_PASSWORD` | Gmail app password | your-app-password |
| `EMAIL_RECIPIENTS` | Comma-separated emails | user1@example.com,user2@example.com |

## Validation

The configuration automatically validates that required variables are set:

```typescript
// In tests/config.ts
export function validateConfig() {
  const missing: string[] = [];
  
  if (!config.username) missing.push('USERNAME');
  if (!config.password) missing.push('PASSWORD');
  if (!config.url) missing.push('URL');
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}
```

If you forget to set a variable, you'll see a clear error message.

## Using Configuration in Tests

### Import the Config

```typescript
import config from './config';

const LOGIN_URL = config.url;
const VALID_EMAIL = config.username;
const VALID_PASSWORD = config.password;
```

### Validate Before Tests

```typescript
import { validateConfig } from './config';

test.beforeAll(() => {
  validateConfig(); // Throws error if variables are missing
});
```

## Troubleshooting

### Error: "Missing required environment variables"

**Solution**: Create/update your `.env` file:
```bash
cp .env.example .env
# Edit .env and add your credentials
```

### Tests Can't Login

**Check**:
1. Verify USERNAME is correct email
2. Verify PASSWORD is correct
3. Verify URL points to staging environment
4. Check `.env` file exists and has correct values

### .env File Not Loading

**Check**:
1. File is named `.env` (not `.env.txt`)
2. File is in project root (`/Users/paukiechee/Applications/.env`)
3. Run `npm install` to ensure `dotenv` package is installed

## Migration from Hardcoded Values

### Before (Hardcoded)
```typescript
const LOGIN_URL = 'https://app-staging.vivacityapp.com';
const VALID_EMAIL = 'kc@vivacityapp.com';
const VALID_PASSWORD = 'PAOpaopao@9696'; // ❌ Exposed in code
```

### After (.env File)
```typescript
import config from './config';

const LOGIN_URL = config.url;
const VALID_EMAIL = config.username;
const VALID_PASSWORD = config.password; // ✅ Loaded from .env
```

## Best Practices

1. **Use .env for local development**
   - Quick to setup
   - Easy to change credentials
   - Secure (not committed)

2. **Use Variable Groups for CI/CD**
   - Azure Pipeline uses Variable Groups
   - Centrally managed
   - Team can access without sharing passwords

3. **Never commit credentials**
   - Check `.gitignore` includes `.env`
   - Use `.env.example` as template only
   - Review code before pushing

4. **Rotate passwords regularly**
   - Update `.env` file locally
   - Update Azure Variable Group
   - Notify team members

## Quick Commands

```bash
# Setup .env file
cp .env.example .env && nano .env

# Test configuration
npx playwright test tests/login.test.ts

# Check if .env is in .gitignore
git check-ignore .env
# Should output: .env (means it's ignored ✅)

# Install dependencies
npm install
```

## Next Steps

1. ✅ Create your `.env` file
2. ✅ Fill in your credentials
3. ✅ Run a test to verify it works
4. ✅ Keep `.env` file secure and local

Your credentials are now safely stored in `.env` file! 🔒
