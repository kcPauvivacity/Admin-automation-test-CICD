import * as dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

export const config = {
  // Login Credentials
  username: process.env.TEST_USERNAME || '',
  password: process.env.TEST_PASSWORD || '',
  url: process.env.TEST_URL || 'https://app-staging.vivacityapp.com',
  
  // Email Configuration
  emailUser: process.env.EMAIL_USER || '',
  emailPassword: process.env.EMAIL_PASSWORD || '',
  emailRecipients: process.env.EMAIL_RECIPIENTS || '',
};

// Validate required configuration
export function validateConfig() {
  const missing: string[] = [];
  
  if (!config.username) missing.push('TEST_USERNAME');
  if (!config.password) missing.push('TEST_PASSWORD');
  if (!config.url) missing.push('TEST_URL');
  
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}\n` +
      `Please create a .env file based on .env.example and fill in your credentials.`
    );
  }
}

export default config;
