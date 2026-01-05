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
  reporter: process.env.CI ? [['html'], ['json', { outputFile: 'test-results.json' }], ['list']] : 'html',
  use: {
    baseURL: 'https://viva-staging.uk.auth0.com',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});