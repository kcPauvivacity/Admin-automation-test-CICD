import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const testsDir = path.join(__dirname, '../tests');
const testFiles = fs.readdirSync(testsDir).filter(file => file.endsWith('.test.ts'));

let filesUpdated = 0;
let changesCount = 0;

testFiles.forEach(file => {
    const filePath = path.join(testsDir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    // Pattern 1: Replace remaining hardcoded Auth0 URLs that weren't caught before
    const oldAuth0Pattern = /await page\.goto\('https:\/\/viva-staging\.uk\.auth0\.com[^']+'\);[\s\S]*?await page\.waitForSelector\('input\[name="username"\]'\);[\s\S]*?await page\.fill\('input\[name="username"\]', 'kc@vivacityapp\.com'\);[\s\S]*?await page\.click\('button\[type="submit"\]'\);[\s\S]*?await page\.waitForSelector\('input\[name="password"\]'\);[\s\S]*?await page\.fill\('input\[name="password"\]', 'PAOpaopao@9696'\);[\s\S]*?await page\.click\('button\[type="submit"\]'\);[\s\S]*?await expect\(page\)\.toHaveURL\('https:\/\/app-staging\.vivacityapp\.com\/demo-student', \{ timeout: 60000 \}\);/g;
    
    if (oldAuth0Pattern.test(content)) {
        content = content.replace(oldAuth0Pattern, 'await loginToApp(page);');
        modified = true;
        changesCount++;
    }
    
    // Pattern 2: Replace exact URL matches with regex patterns
    const exactUrlPattern = /await expect\(page\)\.toHaveURL\('https:\/\/app-staging\.vivacityapp\.com\/demo-student', \{ timeout: (\d+) \}\);/g;
    if (exactUrlPattern.test(content)) {
        content = content.replace(exactUrlPattern, 'await expect(page).toHaveURL(/app-staging\\.vivacityapp\\.com\\/demo-student/, { timeout: $1 });');
        modified = true;
        changesCount++;
    }
    
    // Pattern 3: Add import if needed and file was modified
    if (modified && !content.includes("import { loginToApp }")) {
        content = content.replace(
            "import { test, expect } from '@playwright/test';",
            "import { test, expect } from '@playwright/test';\nimport { loginToApp } from './helpers/auth.helper';"
        );
    }
    
    if (modified) {
        fs.writeFileSync(filePath, content, 'utf8');
        filesUpdated++;
        console.log(`✅ Updated: ${file}`);
    }
});

console.log(`\n✅ Total files updated: ${filesUpdated}`);
console.log(`✅ Total changes made: ${changesCount}`);
