// Simple test script to verify Gmail credentials work
const nodemailer = require('nodemailer');

// Replace these with your actual values
const EMAIL_USER = 'kc@vivacityapp.com';
const EMAIL_PASSWORD = 'xpxvytjxjantlkge';
const EMAIL_RECIPIENTS = 'kc@vivacityapp.com';

async function testEmail() {
    console.log('🧪 Testing Gmail connection...\n');
    
    console.log('Configuration:');
    console.log('  EMAIL_USER:', EMAIL_USER);
    console.log('  EMAIL_PASSWORD length:', EMAIL_PASSWORD.length, 'characters');
    console.log('  EMAIL_RECIPIENTS:', EMAIL_RECIPIENTS);
    console.log('');
    
    try {
        // Create transporter
        console.log('📤 Creating email transporter...');
        const transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 587,
            secure: false,
            auth: {
                user: EMAIL_USER,
                pass: EMAIL_PASSWORD
            },
            tls: {
                rejectUnauthorized: false
            }
        });
        
        // Verify connection
        console.log('🔍 Verifying connection to Gmail...');
        await transporter.verify();
        console.log('✅ Connection verified! Gmail credentials are valid.\n');
        
        // Send test email
        console.log('📧 Sending test email...');
        const info = await transporter.sendMail({
            from: EMAIL_USER,
            to: EMAIL_RECIPIENTS,
            subject: 'Test Email from Playwright CI/CD',
            text: 'This is a test email to verify Gmail configuration works.',
            html: '<h1>✅ Success!</h1><p>Your Gmail email configuration is working correctly.</p>'
        });
        
        console.log('✅ Email sent successfully!');
        console.log('📧 Message ID:', info.messageId);
        console.log('📬 Sent to:', EMAIL_RECIPIENTS);
        console.log('\n🎉 All tests passed! Email configuration is correct.');
        
    } catch (error) {
        console.error('\n❌ Email test failed!');
        console.error('Error code:', error.code);
        console.error('Error message:', error.message);
        console.error('\nFull error:', error);
        
        if (error.code === 'EAUTH') {
            console.error('\n🔍 Authentication Error Diagnosis:');
            console.error('1. Verify 2-Step Verification is enabled');
            console.error('2. Generate a NEW App Password at: https://myaccount.google.com/apppasswords');
            console.error('3. Make sure EMAIL_PASSWORD is exactly 16 characters (no spaces)');
            console.error('4. Check EMAIL_USER is your full Gmail address');
            console.error('5. If using work/school email, check with admin about App Password restrictions');
        }
        
        process.exit(1);
    }
}

console.log('========================================');
console.log('Gmail Email Configuration Test');
console.log('========================================\n');

testEmail();
