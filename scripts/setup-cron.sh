#!/bin/bash

# =============================================================================
# Cron Job Setup for Playwright Tests
# =============================================================================
# This script helps you set up scheduled test runs on your local machine
#
# Usage:
#   1. Make this script executable: chmod +x scripts/setup-cron.sh
#   2. Run: ./scripts/setup-cron.sh
#   3. Follow the instructions
# =============================================================================

echo "🕐 Setting up Scheduled Test Runs"
echo "=================================="
echo ""

# Get the current directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

echo "📁 Project directory: $PROJECT_DIR"
echo ""

# Email configuration
read -p "📧 Enter your email address (for sending reports): " EMAIL_USER
read -p "📧 Enter recipient email(s) (comma-separated): " EMAIL_RECIPIENTS
read -sp "🔑 Enter your Gmail app password: " EMAIL_PASSWORD
echo ""
echo ""

# Create .env file
cat > "$PROJECT_DIR/.env" << EOF
# Email Configuration for Test Reports
EMAIL_USER=$EMAIL_USER
EMAIL_PASSWORD=$EMAIL_PASSWORD
EMAIL_RECIPIENTS=$EMAIL_RECIPIENTS
EOF

echo "✅ Created .env file with email configuration"
echo ""

# Schedule options
echo "⏰ Choose a schedule:"
echo "1. Daily at 9 AM"
echo "2. Daily at 6 PM"
echo "3. Every 6 hours"
echo "4. Weekdays at 9 AM"
echo "5. Custom (you'll enter cron expression)"
echo ""

read -p "Enter option (1-5): " SCHEDULE_OPTION

case $SCHEDULE_OPTION in
    1)
        CRON_SCHEDULE="0 9 * * *"
        SCHEDULE_DESC="Daily at 9 AM"
        ;;
    2)
        CRON_SCHEDULE="0 18 * * *"
        SCHEDULE_DESC="Daily at 6 PM"
        ;;
    3)
        CRON_SCHEDULE="0 */6 * * *"
        SCHEDULE_DESC="Every 6 hours"
        ;;
    4)
        CRON_SCHEDULE="0 9 * * 1-5"
        SCHEDULE_DESC="Weekdays at 9 AM"
        ;;
    5)
        read -p "Enter cron expression: " CRON_SCHEDULE
        SCHEDULE_DESC="Custom schedule"
        ;;
    *)
        echo "❌ Invalid option"
        exit 1
        ;;
esac

echo ""
echo "📋 Schedule: $SCHEDULE_DESC ($CRON_SCHEDULE)"
echo ""

# Create wrapper script that loads environment
cat > "$PROJECT_DIR/scripts/cron-wrapper.sh" << 'WRAPPER_EOF'
#!/bin/bash

# Load environment variables
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# Get script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

# Load .env file
if [ -f "$PROJECT_DIR/.env" ]; then
    export $(cat "$PROJECT_DIR/.env" | grep -v '^#' | xargs)
fi

# Change to project directory
cd "$PROJECT_DIR"

# Run tests with report
echo "$(date): Starting scheduled test run" >> "$PROJECT_DIR/cron.log"
./scripts/run-tests-with-report.sh >> "$PROJECT_DIR/cron.log" 2>&1
echo "$(date): Completed test run" >> "$PROJECT_DIR/cron.log"
WRAPPER_EOF

chmod +x "$PROJECT_DIR/scripts/cron-wrapper.sh"

echo "✅ Created cron wrapper script"
echo ""

# Generate cron entry
CRON_ENTRY="$CRON_SCHEDULE cd $PROJECT_DIR && ./scripts/cron-wrapper.sh"

echo "📝 Add this line to your crontab:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "$CRON_ENTRY"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "To add it automatically, run:"
echo "  (crontab -l 2>/dev/null; echo \"$CRON_ENTRY\") | crontab -"
echo ""

read -p "Would you like to add it now? (y/n): " ADD_NOW

if [ "$ADD_NOW" = "y" ] || [ "$ADD_NOW" = "Y" ]; then
    # Backup existing crontab
    crontab -l > "$PROJECT_DIR/crontab.backup" 2>/dev/null
    
    # Add new entry
    (crontab -l 2>/dev/null; echo "$CRON_ENTRY") | crontab -
    
    echo "✅ Cron job added successfully!"
    echo "📄 Backup saved to: $PROJECT_DIR/crontab.backup"
else
    echo "⏭️  Skipped automatic setup"
    echo "   You can add it manually later with: crontab -e"
fi

echo ""
echo "🎉 Setup Complete!"
echo ""
echo "📋 Summary:"
echo "  - Schedule: $SCHEDULE_DESC"
echo "  - Email reports will be sent to: $EMAIL_RECIPIENTS"
echo "  - Logs will be saved to: $PROJECT_DIR/cron.log"
echo ""
echo "🔍 To verify cron job:"
echo "  crontab -l"
echo ""
echo "🗑️  To remove cron job:"
echo "  crontab -e  (then delete the line)"
echo ""
WRAPPER_EOF

chmod +x "$PROJECT_DIR/scripts/setup-cron.sh"

echo "✅ Cron setup script created!"
