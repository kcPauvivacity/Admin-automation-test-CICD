import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// ES module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read the JSON report
const reportPath = path.join(__dirname, '../test-results.json');

if (!fs.existsSync(reportPath)) {
    console.log('⚠️ No test results found');
    process.exit(0);
}

const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));

// Calculate statistics
const stats = {
    total: 0,
    passed: 0,
    failed: 0,
    skipped: 0,
    flaky: 0,
    duration: 0
};

const failedTests = [];
const testsByFile = {};

// Process test results
if (report.suites) {
    report.suites.forEach(suite => {
        processSuite(suite);
    });
}

function processSuite(suite) {
    if (suite.specs) {
        suite.specs.forEach(spec => {
            stats.total++;
            
            const fileName = suite.file || 'Unknown';
            if (!testsByFile[fileName]) {
                testsByFile[fileName] = { passed: 0, failed: 0, total: 0 };
            }
            testsByFile[fileName].total++;
            
            if (spec.ok) {
                stats.passed++;
                testsByFile[fileName].passed++;
            } else {
                stats.failed++;
                testsByFile[fileName].failed++;
                failedTests.push({
                    file: fileName,
                    title: spec.title,
                    error: spec.tests?.[0]?.results?.[0]?.error?.message || 'Unknown error'
                });
            }
            
            // Add duration
            if (spec.tests?.[0]?.results?.[0]?.duration) {
                stats.duration += spec.tests[0].results[0].duration;
            }
        });
    }
    
    if (suite.suites) {
        suite.suites.forEach(childSuite => processSuite(childSuite));
    }
}

// Generate summary
const passRate = stats.total > 0 ? ((stats.passed / stats.total) * 100).toFixed(1) : 0;
const durationMin = (stats.duration / 1000 / 60).toFixed(1);

console.log('## 📊 Test Statistics\n');
console.log('| Metric | Value |');
console.log('|--------|-------|');
console.log(`| **Total Tests** | ${stats.total} |`);
console.log(`| **Passed** ✅ | ${stats.passed} |`);
console.log(`| **Failed** ❌ | ${stats.failed} |`);
console.log(`| **Pass Rate** | ${passRate}% |`);
console.log(`| **Duration** | ${durationMin} minutes |`);
console.log('');

// Results by file
console.log('## 📁 Results by Test File\n');
console.log('| File | Passed | Failed | Total | Pass Rate |');
console.log('|------|--------|--------|-------|-----------|');

Object.keys(testsByFile).sort().forEach(fileName => {
    const file = testsByFile[fileName];
    const filePassRate = ((file.passed / file.total) * 100).toFixed(0);
    const status = file.failed === 0 ? '✅' : '❌';
    const shortName = fileName.replace('tests/', '').replace(/^.*\//, '');
    console.log(`| ${status} ${shortName} | ${file.passed} | ${file.failed} | ${file.total} | ${filePassRate}% |`);
});
console.log('');

// Failed tests details
if (failedTests.length > 0) {
    console.log('## ❌ Failed Tests\n');
    failedTests.forEach((test, index) => {
        const shortFile = test.file.replace('tests/', '');
        console.log(`### ${index + 1}. ${shortFile}`);
        console.log(`**Test:** ${test.title}\n`);
        
        // Determine error type
        let errorType = '⚠️ Error';
        if (test.error.includes('Timeout')) errorType = '⏱️ Timeout Error';
        else if (test.error.includes('expect(')) errorType = '❌ Assertion Failed';
        else if (test.error.includes('locator')) errorType = '🔍 Element Not Found';
        else if (test.error.includes('network')) errorType = '🌐 Network Error';
        
        console.log(`**Error Type:** ${errorType}\n`);
        console.log('**Error Message:**');
        console.log('```');
        console.log(test.error.substring(0, 500));
        if (test.error.length > 500) {
            console.log('...');
        }
        console.log('```\n');
        
        // Add troubleshooting tips
        console.log('**💡 Possible Causes:**');
        if (test.error.includes('Timeout')) {
            console.log('- Element took too long to appear (>180s timeout)');
            console.log('- Network/page loading issues');
            console.log('- Incorrect selector or element does not exist');
        } else if (test.error.includes('expect(')) {
            console.log('- Expected value does not match actual value');
            console.log('- Data changed or test assumptions incorrect');
            console.log('- Check the assertion in the test code');
        } else if (test.error.includes('locator')) {
            console.log('- Element not found on the page');
            console.log('- Page structure may have changed');
            console.log('- Verify the selector in the test');
        } else if (test.error.includes('network')) {
            console.log('- Network connectivity problem');
            console.log('- Server/API might be down');
            console.log('- Check application logs');
        }
        console.log('');
        
        // Add screenshot info
        console.log('**📸 Evidence:** Check HTML report for screenshots and videos\n');
        console.log('---\n');
    });
}

// Summary message
if (stats.failed === 0) {
    console.log('## ✅ All tests passed! 🎉');
} else {
    console.log(`## ⚠️ ${stats.failed} test(s) failed`);
}
