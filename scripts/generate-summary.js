const fs = require('fs');
const path = require('path');

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
        console.log('```');
        console.log(test.error.substring(0, 200));
        if (test.error.length > 200) {
            console.log('...');
        }
        console.log('```\n');
    });
}

// Summary message
if (stats.failed === 0) {
    console.log('## ✅ All tests passed! 🎉');
} else {
    console.log(`## ⚠️ ${stats.failed} test(s) failed`);
}
