import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const testsDir = path.join(__dirname, '../tests');
const testFiles = fs.readdirSync(testsDir).filter(file => file.endsWith('.test.ts') && file !== 'login.test.ts');

const oldLoginBlock = `    // Login with valid user
    await page.goto('https://viva-staging.uk.auth0.com/u/login/identifier?state=hKFo2SBkdFpjSGxCMDk3NzE5dW16d2VLS1ZFWjlleFNuSjFHTqFur3VuaXZlcnNhbC1sb2dpbqN0aWTZIHlqTFRpUUhTRlJDTVd2RmFpNXEwMXUzMXUwenVaSGszo2NpZNkgZmY0dVRlMmJPWm5PVWNId3V6VVJYWFE5Rzl6M2ZPcHI');
    await page.waitForSelector('input[name="username"]');
    await page.fill('input[name="username"]', 'kc@vivacityapp.com');
    await page.click('button[type="submit"]');
    await page.waitForSelector('input[name="password"]');
    await page.fill('input[name="password"]', 'PAOpaopao@9696');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('https://app-staging.vivacityapp.com/demo-student', { timeout: 60000 });

    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    console.log('✅ Successfully logged in');`;

const newLoginBlock = `    // Login with valid user
    await loginToApp(page);`;

let filesUpdated = 0;

testFiles.forEach(file => {
    const filePath = path.join(testsDir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Check if file needs updating
    if (content.includes("await page.goto('https://viva-staging.uk.auth0.com")) {
        // Add import if not present
        if (!content.includes("import { loginToApp }")) {
            content = content.replace(
                "import { test, expect } from '@playwright/test';",
                "import { test, expect } from '@playwright/test';\nimport { loginToApp } from './helpers/auth.helper';"
            );
        }
        
        // Replace login blocks
        content = content.replace(new RegExp(oldLoginBlock.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), newLoginBlock);
        
        fs.writeFileSync(filePath, content, 'utf8');
        filesUpdated++;
        console.log(`✅ Updated: ${file}`);
    }
});

console.log(`\n✅ Total files updated: ${filesUpdated}`);
