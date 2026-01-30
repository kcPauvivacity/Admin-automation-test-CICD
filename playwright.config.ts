import { defineConfig, devices } from '@playwright/test';
import * as dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

export default defineConfig({
  testDir: './tests',
  timeout: 120000, // Reduced to 2 minutes per test
  expect: {
    timeout: 8000 // Reduced to 8 seconds for assertions
  },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 0 : 0, // No retries to save time
  workers: process.env.CI ? 8 : undefined, // Increased to 8 parallel workers for faster execution
  reporter: process.env.CI ? [
    ['html', { open: 'never' }],
    ['json', { outputFile: 'test-results.json' }], 
    ['list'],
    ['junit', { outputFile: 'test-results.xml' }]
  ] : [
    ['html'],
    ['json', { outputFile: 'test-results.json' }]
  ],
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