import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Files to fix
const files = [
    'tests/properties.test.ts',
    'tests/surveys.test.ts',
    'tests/promotions.test.ts',
    'tests/testimonials.test.ts',
    'tests/universities.test.ts',
    'tests/analytics.test.ts'
];

files.forEach(file => {
    const filePath = path.join(__dirname, '..', file);
    
    if (fs.existsSync(filePath)) {
        let content = fs.readFileSync(filePath, 'utf8');
        
        // Replace networkidle with load
        const originalContent = content;
        content = content.replace(/waitForLoadState\('networkidle'\)/g, "waitForLoadState('load')");
        
        if (content !== originalContent) {
            fs.writeFileSync(filePath, content, 'utf8');
            console.log(`✅ Fixed ${file}`);
        } else {
            console.log(`⚠️  No changes needed in ${file}`);
        }
    } else {
        console.log(`❌ File not found: ${file}`);
    }
});

console.log('\n✨ All files processed!');
