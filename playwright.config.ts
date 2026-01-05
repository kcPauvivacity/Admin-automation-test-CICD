import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 180000, // 3 minutes per test for CI
  expect: {
    timeout: 10000 // 10 seconds for assertions
  },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0, // Retry once on CI
  workers: process.env.CI ? 2 : undefined, // 2 parallel workers on CI
  reporter: process.env.CI ? [
    ['html', { open: 'never' }],
    ['json', { outputFile: 'test-results.json' }], 
    ['list'],
    ['junit', { outputFile: 'test-results.xml' }]
  ] : 'html',
  use: {
    baseURL: 'https://viva-staging.uk.auth0.com',
    
    // Capture screenshots on failure
    screenshot: 'only-on-failure',
    
    // Capture video on failure
    video: 'retain-on-failure',
    
    // Capture trace on first retry (includes detailed step-by-step info)
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});