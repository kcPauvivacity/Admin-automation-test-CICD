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
        passRate: '0'
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
        const stats = { total: 0, passed: 0, failed: 0 };

        if (report.suites) {
            report.suites.forEach(suite => countTests(suite, stats));
        }

        stats.passRate = stats.total > 0 
            ? ((stats.passed / stats.total) * 100).toFixed(1) 
            : '0';

        console.log(`📊 Stats: ${stats.passed}/${stats.total} passed (${stats.passRate}%)`);
        return stats;
    } catch (error) {
        console.error('❌ Error reading test stats:', error.message);
        return defaultStats;
    }
}

function countTests(suite, stats) {
    if (suite.specs) {
        suite.specs.forEach(spec => {
            stats.total++;
            if (spec.ok) stats.passed++;
            else stats.failed++;
        });
    }
    if (suite.suites) {
        suite.suites.forEach(child => countTests(child, stats));
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

        <div style="text-align: center; margin: 30px 0;">
            <p style="color: #7f8c8d;">📎 Full HTML report is attached to this email</p>
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

// Run the script
sendEmailReport();
