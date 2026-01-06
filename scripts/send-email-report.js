const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

// Configuration - Update these with your email settings
const EMAIL_CONFIG = {
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
        user: process.env.EMAIL_USER || 'your-email@gmail.com',
        pass: process.env.EMAIL_PASSWORD || 'your-app-password'
    },
    tls: {
        rejectUnauthorized: false
    }
};

const RECIPIENTS = process.env.EMAIL_RECIPIENTS 
    ? process.env.EMAIL_RECIPIENTS.split(',') 
    : ['recipient@example.com'];

async function sendEmailReport() {
    try {
        console.log('🚀 Starting email report process...');
        console.log('📧 EMAIL_USER:', process.env.EMAIL_USER ? 'Set ✓' : 'Not set ✗');
        console.log('🔑 EMAIL_PASSWORD:', process.env.EMAIL_PASSWORD ? 'Set ✓' : 'Not set ✗');
        console.log('📬 EMAIL_RECIPIENTS:', process.env.EMAIL_RECIPIENTS || 'Not set ✗');
        
        // Read the latest report
        const reportDir = getLatestReportDir();
        if (!reportDir) {
            console.error('❌ No test reports found');
            console.log('ℹ️ Checked directories: test-reports/, playwright-report/');
            return;
        }

        console.log(`📂 Using report from: ${reportDir}`);

        // Read summary (not required)
        const summaryPath = path.join(reportDir, 'summary.md');
        const summary = fs.existsSync(summaryPath) 
            ? fs.readFileSync(summaryPath, 'utf8') 
            : 'Test execution completed. See attached report for details.';

        // Read JSON report for statistics
        const jsonPath = path.join(__dirname, '../test-results.json');
        console.log(`📊 Looking for JSON at: ${jsonPath}`);
        const stats = getTestStats(jsonPath);
        
        // Load full JSON report for failed test detection
        let testResults = null;
        if (fs.existsSync(jsonPath)) {
            try {
                testResults = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
            } catch (error) {
                console.warn('⚠️ Could not parse test results JSON:', error.message);
            }
        }

        // Create transporter
        console.log('📤 Creating email transporter...');
        const transporter = nodemailer.createTransport(EMAIL_CONFIG);
        
        // Verify transporter
        console.log('🔍 Verifying email configuration...');
        await transporter.verify();
        console.log('✅ Email configuration verified!');

        // Email subject
        const subject = `Playwright Test Report - ${stats.passed}/${stats.total} Passed (${stats.passRate}%)`;

        // HTML email body
        const htmlBody = generateEmailHTML(summary, stats, reportDir);

        // Attachments
        const attachments = [];
        const htmlReportPath = path.join(reportDir, 'index.html');
        if (fs.existsSync(htmlReportPath)) {
            attachments.push({
                filename: 'test-report.html',
                path: htmlReportPath
            });
        }

        // Add screenshots and videos from test-results directory
        const testResultsDir = path.join(__dirname, '../test-results');
        console.log(`🔍 Looking for screenshots and videos in: ${testResultsDir}`);
        
        if (fs.existsSync(testResultsDir)) {
            // Get list of non-passing tests (failed, timeout, skipped, flaky, etc.)
            const nonPassingTests = new Set();
            if (testResults && testResults.suites) {
                const extractNonPassingTests = (suite) => {
                    if (suite.specs) {
                        suite.specs.forEach(spec => {
                            // Check if the spec is NOT ok (includes all non-passing states)
                            // This covers: failed, timeout, skipped, flaky, interrupted, etc.
                            if (!spec.ok) {
                                const testName = spec.title;
                                nonPassingTests.add(testName);
                                console.log(`  ❌ Non-passing test found: "${testName}"`);
                            } else if (spec.tests) {
                                // Also check individual test results
                                spec.tests.forEach(test => {
                                    if (test.status !== 'expected' && test.status !== 'skipped') {
                                        const testName = spec.title;
                                        nonPassingTests.add(testName);
                                        console.log(`  ❌ Non-passing test (${test.status}): "${testName}"`);
                                    }
                                    // Check test results for failures
                                    if (test.results) {
                                        test.results.forEach(result => {
                                            if (result.status !== 'passed') {
                                                const testName = spec.title;
                                                nonPassingTests.add(testName);
                                                console.log(`  ❌ Non-passing result (${result.status}): "${testName}"`);
                                            }
                                        });
                                    }
                                });
                            }
                        });
                    }
                    if (suite.suites) {
                        suite.suites.forEach(extractNonPassingTests);
                    }
                };
                testResults.suites.forEach(extractNonPassingTests);
            }
            
            console.log(`🔍 Found ${nonPassingTests.size} non-passing test(s)`);
            
            const addMediaFiles = (dir, depth = 0) => {
                if (depth > 3) return; // Prevent infinite recursion
                
                try {
                    const files = fs.readdirSync(dir);
                    files.forEach(file => {
                        const fullPath = path.join(dir, file);
                        const stat = fs.statSync(fullPath);
                        
                        if (stat.isDirectory()) {
                            addMediaFiles(fullPath, depth + 1);
                        } else {
                            const ext = path.extname(file).toLowerCase();
                            const dirName = path.basename(path.dirname(fullPath));
                            
                            // Check if this media file is from a non-passing test
                            // Match by checking if the directory name contains parts of the test name
                            const isFromNonPassingTest = Array.from(nonPassingTests).some(testName => {
                                // Extract key words from test name (remove common words)
                                const testWords = testName.toLowerCase()
                                    .replace(/\bshould\b|\btest\b|\bfor\b|\bto\b|\bthe\b|\ba\b|\ban\b|\band\b|\bor\b|\bwith\b|\bin\b|\bon\b|\bat\b/gi, ' ')
                                    .split(/\s+/)
                                    .filter(word => word.length > 3); // Increase minimum length to 4
                                
                                // Check if directory contains any significant test words
                                const dirNameLower = dirName.toLowerCase();
                                return testWords.some(word => dirNameLower.includes(word));
                            });
                            
                            // Only attach media if there are non-passing tests and this file is from one
                            if (nonPassingTests.size > 0 && isFromNonPassingTest) {
                                // Add screenshots and videos
                                if (ext === '.png' || ext === '.jpg' || ext === '.jpeg') {
                                    console.log(`📸 Adding screenshot from non-passing test: ${file}`);
                                    attachments.push({
                                        filename: `screenshot-${dirName}-${file}`,
                                        path: fullPath,
                                        contentType: 'image/png'
                                    });
                                } else if (ext === '.webm' || ext === '.mp4') {
                                    console.log(`🎥 Adding video from non-passing test: ${file}`);
                                    attachments.push({
                                        filename: `video-${dirName}-${file}`,
                                        path: fullPath,
                                        contentType: ext === '.webm' ? 'video/webm' : 'video/mp4'
                                    });
                                }
                            }
                        }
                    });
                } catch (err) {
                    console.warn(`⚠️ Error reading directory ${dir}:`, err.message);
                }
            };
            
            addMediaFiles(testResultsDir);
            const mediaCount = attachments.length - 1;
            if (nonPassingTests.size > 0) {
                console.log(`📎 Total attachments: ${attachments.length} (1 HTML report + ${mediaCount} media file${mediaCount !== 1 ? 's' : ''} from non-passing tests)`);
            } else {
                console.log(`📎 Total attachments: ${attachments.length} (1 HTML report only - all tests passed! ✅)`);
            }
        } else {
            console.log('⚠️ test-results directory not found, no screenshots/videos to attach');
        }

        // Send email
        console.log('📧 Sending email...');
        console.log('   From:', EMAIL_CONFIG.auth.user);
        console.log('   To:', RECIPIENTS.join(', '));
        console.log('   Subject:', subject);
        
        const info = await transporter.sendMail({
            from: EMAIL_CONFIG.auth.user,
            to: RECIPIENTS.join(', '),
            subject: subject,
            text: summary,
            html: htmlBody,
            attachments: attachments
        });

        console.log('✅ Email sent successfully!');
        console.log('📧 Message ID:', info.messageId);
        console.log('📬 Recipients:', RECIPIENTS.join(', '));
        console.log('✨ Check your inbox (and spam folder)!');
    } catch (error) {
        console.error('❌ Failed to send email:', error.message);
        console.error('📋 Full error:', error);
        throw error; // Re-throw to see in CI logs
    }
}

function getLatestReportDir() {
    const reportsDir = path.join(__dirname, '../test-reports');
    
    if (!fs.existsSync(reportsDir)) {
        // Try playwright-report directory
        const playwrightReport = path.join(__dirname, '../playwright-report');
        if (fs.existsSync(playwrightReport)) {
            return playwrightReport;
        }
        return null;
    }

    const dirs = fs.readdirSync(reportsDir)
        .filter(file => fs.statSync(path.join(reportsDir, file)).isDirectory())
        .sort()
        .reverse();

    return dirs.length > 0 ? path.join(reportsDir, dirs[0]) : null;
}

function getTestStats(jsonPath) {
    const defaultStats = {
        total: 0,
        passed: 0,
        failed: 0,
        passRate: '0',
        failedTests: []
    };

    console.log(`📊 Checking for JSON at: ${jsonPath}`);
    
    if (!fs.existsSync(jsonPath)) {
        console.log('⚠️ JSON file not found, using default stats');
        // Try to get stats from HTML report index
        const htmlIndexPath = path.join(__dirname, '../playwright-report/index.html');
        if (fs.existsSync(htmlIndexPath)) {
            console.log('📄 Found HTML report, extracting basic info');
            defaultStats.total = 'N/A';
            defaultStats.passed = 'N/A';
            defaultStats.failed = 'N/A';
            defaultStats.passRate = 'See attached report';
        }
        return defaultStats;
    }

    try {
        console.log('✅ JSON file found, parsing...');
        const report = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
        const stats = { total: 0, passed: 0, failed: 0, failedTests: [] };

        if (report.suites) {
            report.suites.forEach(suite => countTests(suite, stats, suite.file || 'unknown'));
        }

        stats.passRate = stats.total > 0 
            ? ((stats.passed / stats.total) * 100).toFixed(1) 
            : '0';

        console.log(`📊 Stats: ${stats.passed}/${stats.total} passed (${stats.passRate}%)`);
        console.log(`❌ Failed tests collected: ${stats.failedTests.length}`);
        return stats;
    } catch (error) {
        console.error('❌ Error reading test stats:', error.message);
        return defaultStats;
    }
}

function countTests(suite, stats, file) {
    const currentFile = suite.file || file;
    
    if (suite.specs) {
        suite.specs.forEach(spec => {
            stats.total++;
            if (spec.ok) {
                stats.passed++;
            } else {
                stats.failed++;
                // Collect failed test details
                const failedTest = {
                    file: currentFile,
                    title: spec.title,
                    error: spec.tests && spec.tests[0] && spec.tests[0].results && spec.tests[0].results[0] 
                        ? spec.tests[0].results[0].error?.message || 'No error message'
                        : 'No error details available',
                    duration: spec.tests && spec.tests[0] && spec.tests[0].results && spec.tests[0].results[0]
                        ? spec.tests[0].results[0].duration
                        : 0
                };
                stats.failedTests.push(failedTest);
            }
        });
    }
    if (suite.suites) {
        suite.suites.forEach(child => countTests(child, stats, currentFile));
    }
}

function generateEmailHTML(summary, stats, reportDir) {
    const timestamp = new Date().toLocaleString();
    const statusIcon = stats.failed === 0 ? '✅' : '⚠️';
    const statusColor = stats.failed === 0 ? '#27ae60' : '#e74c3c';

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .container {
            background-color: white;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            padding: 30px;
        }
        .header {
            text-align: center;
            padding-bottom: 20px;
            border-bottom: 3px solid #3498db;
            margin-bottom: 30px;
        }
        .header h1 {
            color: #2c3e50;
            margin: 0;
            font-size: 28px;
        }
        .status-badge {
            display: inline-block;
            padding: 10px 20px;
            border-radius: 20px;
            font-weight: bold;
            font-size: 18px;
            margin: 15px 0;
            background-color: ${statusColor};
            color: white;
        }
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 15px;
            margin: 25px 0;
        }
        .stat-card {
            background-color: #ecf0f1;
            padding: 20px;
            border-radius: 8px;
            text-align: center;
        }
        .stat-value {
            font-size: 32px;
            font-weight: bold;
            color: #2c3e50;
        }
        .stat-label {
            color: #7f8c8d;
            font-size: 14px;
            margin-top: 5px;
        }
        .summary {
            background-color: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            margin: 25px 0;
            border-left: 4px solid #3498db;
        }
        .summary pre {
            white-space: pre-wrap;
            word-wrap: break-word;
            font-family: 'Courier New', monospace;
            font-size: 13px;
            line-height: 1.4;
            margin: 0;
        }
        .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            text-align: center;
            color: #7f8c8d;
            font-size: 14px;
        }
        .button {
            display: inline-block;
            padding: 12px 24px;
            background-color: #3498db;
            color: white;
            text-decoration: none;
            border-radius: 5px;
            margin: 10px 5px;
            font-weight: bold;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🧪 Playwright Test Report</h1>
            <div class="status-badge">${statusIcon} ${stats.failed === 0 ? 'All Tests Passed' : `${stats.failed} Test(s) Failed`}</div>
            <p style="color: #7f8c8d; margin: 10px 0 0 0;">Generated: ${timestamp}</p>
        </div>

        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-value">${stats.total}</div>
                <div class="stat-label">Total Tests</div>
            </div>
            <div class="stat-card">
                <div class="stat-value" style="color: #27ae60;">${stats.passed}</div>
                <div class="stat-label">Passed ✅</div>
            </div>
            <div class="stat-card">
                <div class="stat-value" style="color: #e74c3c;">${stats.failed}</div>
                <div class="stat-label">Failed ❌</div>
            </div>
            <div class="stat-card">
                <div class="stat-value" style="color: #3498db;">${stats.passRate}%</div>
                <div class="stat-label">Pass Rate</div>
            </div>
        </div>

        <div class="summary">
            <h3 style="margin-top: 0; color: #2c3e50;">📊 Detailed Summary</h3>
            <pre>${summary}</pre>
        </div>

        ${stats.failedTests && stats.failedTests.length > 0 ? generateFailureDetailsHTML(stats.failedTests) : ''}

        <div style="text-align: center; margin: 30px 0;">
            <p style="color: #7f8c8d;">📎 Attachments included:</p>
            <ul style="list-style: none; padding: 0; color: #555;">
                <li>✅ Full HTML test report</li>
                <li>📸 Screenshots (on test failures)</li>
                <li>🎥 Video recordings (on test failures)</li>
            </ul>
            <p style="color: #7f8c8d; font-size: 14px;">Report Location: ${path.basename(reportDir)}</p>
        </div>

        <div class="footer">
            <p>Generated by Playwright Automated Test Suite</p>
            <p>© ${new Date().getFullYear()} - All rights reserved</p>
        </div>
    </div>
</body>
</html>
    `;
}

function generateFailureDetailsHTML(failedTests) {
    if (!failedTests || failedTests.length === 0) return '';

    let html = `
        <div style="background-color: #fff5f5; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #e74c3c;">
            <h3 style="margin-top: 0; color: #e74c3c;">❌ Failed Tests Details</h3>
    `;

    failedTests.forEach((test, index) => {
        const shortFile = test.file.replace('tests/', '');
        const errorMsg = test.error || 'No error message available';
        
        // Determine error type
        let errorType = '⚠️ Error';
        let errorIcon = '⚠️';
        let troubleshootingTips = '';
        
        if (errorMsg.includes('Timeout') || errorMsg.includes('timeout')) {
            errorType = 'Timeout Error';
            errorIcon = '⏱️';
            troubleshootingTips = `
                <li>Element took too long to appear (>180s timeout)</li>
                <li>Network/page loading issues</li>
                <li>Incorrect selector or element does not exist</li>
            `;
        } else if (errorMsg.includes('expect(') || errorMsg.includes('Expected')) {
            errorType = 'Assertion Failed';
            errorIcon = '❌';
            troubleshootingTips = `
                <li>Expected value does not match actual value</li>
                <li>Data changed or test assumptions incorrect</li>
                <li>Check the assertion in the test code</li>
            `;
        } else if (errorMsg.includes('locator') || errorMsg.includes('Locator')) {
            errorType = 'Element Not Found';
            errorIcon = '🔍';
            troubleshootingTips = `
                <li>Element not found on the page</li>
                <li>Page structure may have changed</li>
                <li>Verify the selector in the test</li>
            `;
        } else if (errorMsg.includes('network') || errorMsg.includes('Network')) {
            errorType = 'Network Error';
            errorIcon = '🌐';
            troubleshootingTips = `
                <li>Network connectivity problem</li>
                <li>Server/API might be down</li>
                <li>Check application logs</li>
            `;
        }

        const errorPreview = errorMsg.length > 500 ? errorMsg.substring(0, 500) + '...' : errorMsg;
        const duration = test.duration ? `${(test.duration / 1000).toFixed(2)}s` : 'N/A';

        html += `
            <div style="background-color: white; padding: 15px; border-radius: 6px; margin: 15px 0; border: 1px solid #fee;">
                <h4 style="margin: 0 0 10px 0; color: #2c3e50;">
                    ${index + 1}. ${shortFile}
                </h4>
                <p style="margin: 5px 0; color: #555;">
                    <strong>Test:</strong> ${test.title}
                </p>
                <p style="margin: 5px 0; color: #555;">
                    <strong>Error Type:</strong> ${errorIcon} ${errorType} 
                    <span style="color: #999; margin-left: 10px;">⏱️ Duration: ${duration}</span>
                </p>
                <div style="background-color: #f8f9fa; padding: 10px; border-radius: 4px; margin: 10px 0;">
                    <strong style="color: #e74c3c;">Error Message:</strong>
                    <pre style="margin: 5px 0 0 0; white-space: pre-wrap; word-wrap: break-word; font-size: 12px; color: #d63031;">${errorPreview}</pre>
                </div>
                ${troubleshootingTips ? `
                <div style="background-color: #e3f2fd; padding: 10px; border-radius: 4px; margin: 10px 0;">
                    <strong style="color: #1976d2;">💡 Possible Causes:</strong>
                    <ul style="margin: 5px 0; padding-left: 20px;">
                        ${troubleshootingTips}
                    </ul>
                </div>
                ` : ''}
                <p style="margin: 10px 0 0 0; color: #7f8c8d; font-size: 13px;">
                    📸 <strong>Evidence:</strong> Screenshots and videos are attached to this email
                </p>
            </div>
        `;
    });

    html += `
        </div>
    `;

    return html;
}

// Run the script
sendEmailReport();
