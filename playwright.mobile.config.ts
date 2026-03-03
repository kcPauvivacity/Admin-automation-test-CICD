import { defineConfig, devices } from '@playwright/test';
import * as dotenv from 'dotenv';

dotenv.config();

export default defineConfig({
  testDir: './tests/mobile',
  timeout: 120000,
  expect: {
    timeout: 8000
  },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 4 : undefined,
  reporter: process.env.CI ? [
    ['html', { open: 'never', outputFolder: 'mobile-report' }],
    ['json', { outputFile: 'mobile-results.json' }],
    ['list'],
    ['junit', { outputFile: 'mobile-results.xml' }]
  ] : [
    ['html', { outputFolder: 'mobile-report' }],
    ['json', { outputFile: 'mobile-results.json' }]
  ],
  use: {
    baseURL: process.env.URL || 'https://app-staging.vivacityapp.com',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'iPhone 14',
      use: { ...devices['iPhone 14'] },
    },
    {
      name: 'iPhone 14 Pro',
      use: { ...devices['iPhone 14 Pro'] },
    },
    {
      name: 'Pixel 7',
      use: { ...devices['Pixel 7'] },
    },
    {
      name: 'Galaxy S9+',
      use: { ...devices['Galaxy S9+'] },
    },
  ],
});
