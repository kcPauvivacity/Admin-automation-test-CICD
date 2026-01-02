# Playwright Test Automation Suite

Comprehensive end-to-end test suite for web application using Playwright.

## 📋 Table of Contents
- [Features](#features)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Running Tests](#running-tests)
- [CI/CD Setup](#cicd-setup)
- [Email Reports](#email-reports)
- [Test Coverage](#test-coverage)

## ✨ Features

- **253 comprehensive tests** across 21 modules
- **99%+ pass rate** with robust error handling
- **Automated scheduling** with GitHub Actions
- **Email notifications** with detailed HTML reports
- **Parallel execution** for faster test runs
- **Multiple reporters** (HTML, JSON, console)

## 📦 Prerequisites

- Node.js 18 or higher
- npm or yarn
- Git

## 🚀 Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd Applications

# Install dependencies
npm install

# Install Playwright browsers
npx playwright install --with-deps
```

## 🧪 Running Tests

### Run all tests
```bash
npx playwright test
```

### Run specific test file
```bash
npx playwright test tests/properties.test.ts
```

### Run tests with UI
```bash
npx playwright test --ui
```

### Run tests in headed mode
```bash
npx playwright test --headed
```

### Generate HTML report
```bash
npx playwright test --reporter=html
npx playwright show-report
```

### Run with email report
```bash
# Set environment variables
export EMAIL_USER="your-email@gmail.com"
export EMAIL_PASSWORD="your-app-password"
export EMAIL_RECIPIENTS="recipient@example.com"

# Run tests with automated report
./scripts/run-tests-with-report.sh
```

## 🔄 CI/CD Setup

### GitHub Actions Setup

1. **Push code to GitHub:**
```bash
git add .
git commit -m "Initial commit with test automation"
git remote add origin https://github.com/yourusername/your-repo.git
git branch -M main
git push -u origin main
```

2. **Configure GitHub Secrets:**

Go to your repository → Settings → Secrets and variables → Actions → New repository secret

Add the following secrets:
- `EMAIL_USER`: Your Gmail address (e.g., `your-email@gmail.com`)
- `EMAIL_PASSWORD`: Your Gmail App Password (16 characters)
- `EMAIL_RECIPIENTS`: Comma-separated email addresses (e.g., `user1@email.com,user2@email.com`)

3. **Generate Gmail App Password:**
   - Go to [Google Account Security](https://myaccount.google.com/security)
   - Enable 2-Step Verification
   - Go to [App Passwords](https://myaccount.google.com/apppasswords)
   - Select "Mail" and "Other (Custom name)"
   - Copy the 16-character password
   - Use this as `EMAIL_PASSWORD` secret

4. **Workflow Triggers:**
   - **Scheduled**: Runs daily at 9 AM UTC (configurable in `.github/workflows/playwright-tests.yml`)
   - **Manual**: Go to Actions → Playwright Tests → Run workflow
   - **Push**: Automatically runs on push to `main` branch
   - **Pull Request**: Runs on PRs to `main` branch

5. **View Results:**
   - Go to Actions tab in your GitHub repository
   - Click on the latest workflow run
   - View test summary, download artifacts, check email for detailed report

### Customizing Schedule

Edit `.github/workflows/playwright-tests.yml`:

```yaml
schedule:
  # Run every day at 9 AM UTC
  - cron: '0 9 * * *'
```

**Cron examples:**
- `0 9 * * *` - Daily at 9 AM UTC
- `0 */6 * * *` - Every 6 hours
- `0 9 * * 1-5` - Weekdays at 9 AM UTC
- `0 0 * * 0` - Weekly on Sunday at midnight

## 📧 Email Reports

### Setup for Local Runs

1. **Install Nodemailer:**
```bash
npm install nodemailer
```

2. **Configure environment variables:**
```bash
export EMAIL_USER="your-email@gmail.com"
export EMAIL_PASSWORD="your-16-char-app-password"
export EMAIL_RECIPIENTS="recipient1@example.com,recipient2@example.com"
```

3. **Run tests with email:**
```bash
./scripts/run-tests-with-report.sh
```

### Email Report Features

- ✅ Professional HTML design with responsive layout
- ✅ Visual statistics cards (total, passed, failed, pass rate)
- ✅ Status badge (green for pass, red for failures)
- ✅ Detailed summary from test results
- ✅ Full HTML report attached
- ✅ Timestamp and metadata

## 📊 Test Coverage

### Modules (21 test files, 253 tests)

| Module | Tests | Description |
|--------|-------|-------------|
| **Properties** | 26 | Create/edit properties, all tabs (General, Address, Images, Features, Contract, Testimonials, Floor Plans) |
| **Articles** | 15 | Article management, create, filter, sort |
| **Login** | 12 | Authentication, validation, security |
| **Dashboard** | 10 | Dashboard navigation, widgets |
| **Cities** | 8 | City management, CRUD operations |
| **Universities** | 7 | University management, filters |
| **Projects** | 14 | Project management, tracking |
| **Contacts** | 12 | Contact management |
| **Facilities** | 10 | Facility management |
| **Reports** | 9 | Report generation, validation |
| **Surveys** | 11 | Survey creation, responses |
| **Testimonials** | 10 | Testimonial management |
| **Tags** | 8 | Tag management |
| **FAQ** | 9 | FAQ management |
| **Attributes** | 12 | Attribute types, CRUD |
| **Promotions** | 10 | Promotion management |
| **Analytics** | 8 | Analytics tracking |
| **Tracking** | 14 | Tracking management |
| **Enquiries** | 11 | Enquiry handling |
| **AI Chat** | 7 | AI chat functionality |
| **Help** | 6 | Help documentation |

### Pass Rate: **99%+**

## 🛠️ Project Structure

```
Applications/
├── .github/
│   └── workflows/
│       └── playwright-tests.yml    # GitHub Actions workflow
├── scripts/
│   ├── generate-summary.js         # Test summary generator
│   ├── run-tests-with-report.sh    # Local test runner with email
│   └── send-email-report.js        # Email notification script
├── tests/
│   ├── properties.test.ts          # Property management tests
│   ├── articles.test.ts            # Article tests
│   ├── login.test.ts               # Authentication tests
│   └── ... (18 more test files)
├── test-cases/
│   └── *.csv                       # Test case data
├── playwright.config.ts            # Playwright configuration
├── package.json                    # Dependencies
└── README.md                       # This file
```

## 🔒 Security Best Practices

1. **Never commit credentials** - Use environment variables and `.env` files
2. **Add `.env` to `.gitignore`** - Prevent accidental commits
3. **Use App Passwords** - Don't use your main account password
4. **Rotate secrets regularly** - Update passwords periodically
5. **Limit secret access** - Only add necessary secrets to CI/CD

## 🐛 Troubleshooting

### Tests failing locally but passing in CI
- Check Node.js version (use v18+)
- Clear playwright cache: `npx playwright install --force`
- Check for environment-specific issues

### Email not sending
- Verify Gmail App Password is correct (16 characters, no spaces)
- Check environment variables are set correctly
- Ensure 2-Step Verification is enabled on Gmail

### GitHub Actions not triggering
- Verify workflow file is in `.github/workflows/` directory
- Check branch names match workflow triggers
- Ensure repository has Actions enabled (Settings → Actions)

## 📝 Contributing

1. Create a feature branch: `git checkout -b feature/new-test`
2. Add your tests
3. Run tests locally: `npx playwright test`
4. Commit changes: `git commit -am 'Add new test'`
5. Push to branch: `git push origin feature/new-test`
6. Create Pull Request

## 📄 License

This project is licensed under the MIT License.

## 👥 Support

For issues or questions:
- Check [Playwright Documentation](https://playwright.dev/)
- Review existing test files for examples
- Contact the development team

---

**Last Updated:** January 2, 2026
**Test Suite Version:** 1.0.0
**Playwright Version:** 1.x
