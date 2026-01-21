import * as dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

export const config = {
  // Login Credentials
  username: process.env.USERNAME || '',
  password: process.env.PASSWORD || '',
  url: process.env.URL || 'https://app-staging.vivacityapp.com',
  
  // Email Configuration
  emailUser: process.env.EMAIL_USER || '',
  emailPassword: process.env.EMAIL_PASSWORD || '',
  emailRecipients: process.env.EMAIL_RECIPIENTS || '',
};

// Validate required configuration
export function validateConfig() {
  const missing: string[] = [];
  
  if (!config.username) missing.push('USERNAME');
  if (!config.password) missing.push('PASSWORD');
  if (!config.url) missing.push('URL');
  
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}\n` +
      `Please create a .env file based on .env.example and fill in your credentials.`
    );
  }
}

export default config;
