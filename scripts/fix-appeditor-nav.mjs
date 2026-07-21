/**
 * Fixes App Editor generated tests to navigate by URL instead of clicking sidebar.
 * Replaces the "goto home → find appEditorLink → click" pattern with direct URL navigation.
 */
import fs from 'fs';
import { execSync } from 'child_process';

const APP_EDITOR_URL = 'https://app-staging.vivacityapp.com/demo-student/app-editor';

const files = execSync(
  'grep -rl "app editor\\|App Editor\\|appEditor\\|app-editor" tests/generated/*.test.ts 2>/dev/null',
  { encoding: 'utf8' }
).trim().split('\n').filter(Boolean);

let fixed = 0;
for (const file of files) {
  let src = fs.readFileSync(file, 'utf8');
  const original = src;

  // Pattern 1: goto home → waitForSelector → appEditorLink pattern
  // Replace everything from the first page.goto up through the appEditorLink.click()
  src = src.replace(
    /await page\.goto\([^)]*vivacityapp\.com[^)]*\)[^;]*;\s*\n([\s\S]*?)const appEditorLink[^;]+;\s*\n[\s\S]*?appEditorLink\.(waitFor|click)\([^)]*\);\s*\n(\s*await appEditorLink\.click\(\);\s*\n)?/,
    `await page.goto('${APP_EDITOR_URL}', { waitUntil: 'load', timeout: 30000 });\n  await page.waitForSelector('.v-application', { timeout: 15000 });\n  await page.waitForTimeout(2000);\n\n`
  );

  // Pattern 2: waitForSelector('.v-application') right after the goto replacement (dedup)
  src = src.replace(
    /await page\.waitForSelector\('\.v-application'[^)]*\);\s*\n\s*\/\/ Wait for App Editor/g,
    `// Wait for App Editor`
  );

  if (src !== original) {
    fs.writeFileSync(file, src);
    fixed++;
    console.log(`✅ Fixed: ${file}`);
  } else {
    console.log(`⚠️  No match: ${file} (check manually)`);
  }
}
console.log(`\nDone. ${fixed}/${files.length} files updated.`);
