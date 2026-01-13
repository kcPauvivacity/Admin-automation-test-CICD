#!/bin/bash

# Azure DevOps Automated Setup Script
# This script will help you set up pipelines quickly

echo "======================================"
echo "🚀 Azure DevOps Pipeline Setup"
echo "======================================"
echo ""

# Check if Azure CLI is installed
if ! command -v az &> /dev/null; then
    echo "⚠️  Azure CLI is not installed."
    echo ""
    echo "📦 Installing Azure CLI..."
    brew install azure-cli
fi

echo "✅ Azure CLI is ready"
echo ""

# Login to Azure
echo "🔐 Step 1: Login to Azure DevOps"
echo "   (A browser window will open for authentication)"
echo ""
read -p "Press ENTER to login..."
az devops login

# Set default organization and project
echo ""
echo "⚙️  Step 2: Configuring defaults..."
az devops configure --defaults \
  organization=https://dev.azure.com/vivacityapp \
  project=Viva

echo "✅ Defaults configured"
echo ""

# Create variable group
echo "🔐 Step 3: Creating variable group 'playwright-secrets'"
echo ""
echo "⚠️  I'll need your credentials. Please enter them:"
echo ""

read -p "TEST_USERNAME (e.g., kiechee@ms.vivacityapp.com): " TEST_USERNAME
read -sp "TEST_PASSWORD: " TEST_PASSWORD
echo ""
read -p "BASE_URL (default: https://app-staging.vivacityapp.com): " BASE_URL
BASE_URL=${BASE_URL:-https://app-staging.vivacityapp.com}

read -p "Do you want to set up email reports? (y/n): " SETUP_EMAIL

if [ "$SETUP_EMAIL" = "y" ]; then
    read -p "EMAIL_USER (Gmail address): " EMAIL_USER
    read -sp "EMAIL_PASSWORD (Gmail app password): " EMAIL_PASSWORD
    echo ""
    read -p "EMAIL_RECIPIENTS (comma-separated): " EMAIL_RECIPIENTS
    
    az pipelines variable-group create \
      --name "playwright-secrets" \
      --authorize true \
      --variables \
        TEST_USERNAME="$TEST_USERNAME" \
        TEST_PASSWORD="$TEST_PASSWORD" \
        BASE_URL="$BASE_URL" \
        EMAIL_USER="$EMAIL_USER" \
        EMAIL_PASSWORD="$EMAIL_PASSWORD" \
        EMAIL_RECIPIENTS="$EMAIL_RECIPIENTS"
else
    az pipelines variable-group create \
      --name "playwright-secrets" \
      --authorize true \
      --variables \
        TEST_USERNAME="$TEST_USERNAME" \
        TEST_PASSWORD="$TEST_PASSWORD" \
        BASE_URL="$BASE_URL"
fi

echo ""
echo "✅ Variable group created"
echo ""

# Get repository ID
echo "📦 Step 4: Getting repository information..."
REPO_ID=$(az repos list --query "[?name=='admin-automation-test'].id" -o tsv)

if [ -z "$REPO_ID" ]; then
    echo "❌ Repository 'admin-automation-test' not found"
    exit 1
fi

echo "✅ Repository found: $REPO_ID"
echo ""

# Create daily test pipeline
echo "🚀 Step 5: Creating 'Playwright Tests - Daily' pipeline..."
az pipelines create \
  --name "Playwright Tests - Daily" \
  --repository admin-automation-test \
  --repository-type tfsgit \
  --branch main \
  --yml-path azure-pipelines.yml \
  --skip-first-run

echo "✅ Daily test pipeline created"
echo ""

# Create weekly generation pipeline
echo "🤖 Step 6: Creating 'Auto-Generate Tests - Weekly' pipeline..."
az pipelines create \
  --name "Auto-Generate Tests - Weekly" \
  --repository admin-automation-test \
  --repository-type tfsgit \
  --branch main \
  --yml-path azure-pipelines-generate.yml \
  --skip-first-run

echo "✅ Weekly generation pipeline created"
echo ""

echo "======================================"
echo "🎉 Setup Complete!"
echo "======================================"
echo ""
echo "✅ Variable group 'playwright-secrets' created"
echo "✅ Daily test pipeline created"
echo "✅ Weekly generation pipeline created"
echo ""
echo "📊 View your pipelines:"
echo "   https://dev.azure.com/vivacityapp/Viva/_build"
echo ""
echo "🔐 View your variable group:"
echo "   https://dev.azure.com/vivacityapp/Viva/_library"
echo ""
echo "🚀 Next steps:"
echo "   1. Go to the pipelines URL above"
echo "   2. Click 'Run pipeline' to test"
echo "   3. View test results and artifacts"
echo ""
echo "📧 To set up email reports (if not done):"
echo "   1. Get Gmail app password: https://myaccount.google.com/apppasswords"
echo "   2. Add EMAIL_USER, EMAIL_PASSWORD, EMAIL_RECIPIENTS to variable group"
echo ""
