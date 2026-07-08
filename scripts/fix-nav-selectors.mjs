/**
 * Fixes the brittle sidebar navigation selectors in all affected test files.
 *
 * Replaces:
 *   await page.getByRole('button', { name: /settings/i }).click();
 *   await page.waitForTimeout(1000);
 *   ...
 *   await page.getByText('Data Management').click();
 *   await page.waitForTimeout(500);
 *   await page.getByText('{Module}').click();
 *   await page.waitForLoadState(...);
 *   await page.waitForTimeout(2000);
 *
 * With:
 *   await navigateTo(page, '{slug}');
 *
 * Also adds `navigateTo` to the import from auth.helper.
 */

import fs from 'fs';

const FILES = {
  'tests/attributes.test.ts': 'attributes',
  'tests/cities.test.ts': 'cities',
  'tests/facilities.test.ts': 'facilities',
  'tests/faq.test.ts': 'faq',
  'tests/tags.test.ts': 'tags',
  'tests/universities.test.ts': 'universities',
  'tests/analytics.test.ts': 'analytics',
  'tests/reports.test.ts': 'reports',
};

// help.test.ts: only line 240 needs fixing — Analytics & Reporting → navigateTo analytics
const HELP_FILE = 'tests/help.test.ts';

function fixFile(filePath, slug) {
  let src = fs.readFileSync(filePath, 'utf8');
  const original = src;

  // 1. Update import to include navigateTo
  src = src.replace(
    /import \{ loginToApp \} from ['"]\.\/helpers\/auth\.helper['"]/,
    "import { loginToApp, navigateTo } from './helpers/auth.helper'"
  );
  // If already has navigateTo, leave it
  if (src.includes('navigateTo') && !src.includes("import { loginToApp, navigateTo }")) {
    src = src.replace(
      /import \{ loginToApp, navigateTo \} from ['"]\.\/helpers\/auth\.helper['"]/,
      "import { loginToApp, navigateTo } from './helpers/auth.helper'"
    );
  }

  // 2. Replace the full navigation block (Settings button → group expand → module click)
  //
  // Pattern (multiline, allowing for console.logs and slight variations):
  // Lines to remove:
  //   [optional comment line(s)]
  //   await page.getByRole('button', { name: /settings/i }).click();
  //   await page.waitForTimeout(NNN);
  //   [optional console.log / blank lines / comment lines]
  //   [optional comment line]
  //   await page.getByText('Data Management' | 'Analytics & Reporting').click();
  //   await page.waitForTimeout(NNN);
  //   [optional blank line]
  //   await page.getByText('{Module}').click();
  //   await page.waitForLoadState(...);
  //   await page.waitForTimeout(2000);
  //
  // Replace with: (indented to match)
  //   await navigateTo(page, '{slug}');

  // Build a regex that captures the full block
  // We match greedily from the settings button click to the final waitForTimeout(2000) after the module click
  const blockRegex = new RegExp(
    // optional comment lines before settings button
    `(\\s*// [^\\n]*\\n)*` +
    // settings button click
    `([ \\t]*)await page\\.getByRole\\('button',\\s*\\{\\s*name:\\s*/settings/i\\s*\\}\\)\\s*\\.click\\(\\);\\n` +
    // everything between settings click and Data Management/Analytics click
    `([ \\t]*await page\\.waitForTimeout\\(\\d+\\);\\n)` +
    `([ \\t]*console\\.log\\([^\\n]*\\);\\n)*` +
    `([ \\t]*\\n)*` +  // blank lines
    // optional comment
    `([ \\t]*// [^\\n]*\\n)?` +
    // group expand click
    `[ \\t]*await page\\.getByText\\('(?:Data Management|Analytics & Reporting)'\\)\\.click\\(\\);\\n` +
    `([ \\t]*await page\\.waitForTimeout\\(\\d+\\);\\n)?` +
    `([ \\t]*\\n)*` +  // blank lines
    // module click (plain getByText or getByRole)
    `[ \\t]*await page\\.getByText\\('[^']*'\\)\\.click\\(\\);\\n` +
    // waitForLoadState and timeout
    `([ \\t]*await page\\.waitForLoadState\\([^)]*\\);\\n)?` +
    `[ \\t]*await page\\.waitForTimeout\\(\\d+\\);`,
    'g'
  );

  let count = 0;
  src = src.replace(blockRegex, (match) => {
    // Determine indentation from the settings button line
    const indentMatch = match.match(/^([ \t]*)await page\.getByRole/m);
    const indent = indentMatch ? indentMatch[1] : '    ';
    count++;
    return `${indent}await navigateTo(page, '${slug}');`;
  });

  if (count === 0) {
    console.warn(`  ⚠️  No blocks replaced in ${filePath} — check manually`);
  } else {
    console.log(`  ✅ ${filePath}: replaced ${count} navigation block(s)`);
  }

  if (src !== original) fs.writeFileSync(filePath, src);
  return count;
}

// Fix main files
let total = 0;
for (const [file, slug] of Object.entries(FILES)) {
  total += fixFile(file, slug);
}

// Fix help.test.ts: just replace the Analytics & Reporting block in the help-icon test
{
  let src = fs.readFileSync(HELP_FILE, 'utf8');
  const original = src;

  src = src.replace(
    /import \{ loginToApp \} from ['"]\.\/helpers\/auth\.helper['"]/,
    "import { loginToApp, navigateTo } from './helpers/auth.helper'"
  );

  // Replace only the specific Analytics & Reporting nav block in help.test.ts
  // Pattern: settings click → Analytics & Reporting → getByRole option
  const helpBlockRegex =
    /([ \t]*)await page\.getByRole\('button',\s*\{\s*name:\s*\/settings\/i\s*\}\)\s*\.click\(\);\n[ \t]*await page\.waitForTimeout\(\d+\);\n([ \t]*\n)*[ \t]*\/\/ Navigate to Analytics and check help icon\n[ \t]*await page\.getByText\('Analytics & Reporting'\)\.click\(\);\n[ \t]*await page\.waitForTimeout\(\d+\);\n[ \t]*await page\.getByRole\('option',\s*\{ name: 'Analytics' \}\)\.click\(\);\n[ \t]*await page\.waitForLoadState\([^)]*\);\n[ \t]*await page\.waitForTimeout\(\d+\);/;

  if (helpBlockRegex.test(src)) {
    src = src.replace(helpBlockRegex, (_, indent) => {
      total++;
      return `${indent}await navigateTo(page, 'analytics');`;
    });
    console.log(`  ✅ ${HELP_FILE}: replaced Analytics navigation block`);
  } else {
    console.warn(`  ⚠️  ${HELP_FILE}: block not matched — check manually`);
  }

  if (src !== original) fs.writeFileSync(HELP_FILE, src);
}

console.log(`\nDone. Total blocks replaced: ${total}`);
console.log('Next: update tests/helpers/auth.helper.ts to export navigateTo()');
