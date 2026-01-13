#!/bin/bash

# Azure DevOps Pipeline Setup Script
# Alternative to using the UI

# Prerequisites: Install Azure CLI
# brew install azure-cli

echo "🔐 Login to Azure DevOps..."
az login

echo "📦 Set organization and project..."
az devops configure --defaults organization=https://dev.azure.com/vivacityapp project=Viva

echo "🔐 Create variable group..."
az pipelines variable-group create \
  --name "playwright-secrets" \
  --variables \
    TEST_USERNAME="kiechee@ms.vivacityapp.com" \
    TEST_PASSWORD="your-password" \
    BASE_URL="https://app-staging.vivacityapp.com" \
    EMAIL_USER="your-email@gmail.com" \
    EMAIL_PASSWORD="your-app-password" \
    EMAIL_RECIPIENTS="team@vivacityapp.com"

echo "🚀 Create daily test pipeline..."
az pipelines create \
  --name "Playwright Tests - Daily" \
  --repository admin-automation-test \
  --repository-type tfsgit \
  --branch main \
  --yml-path azure-pipelines.yml

echo "🤖 Create weekly generation pipeline..."
az pipelines create \
  --name "Auto-Generate Tests - Weekly" \
  --repository admin-automation-test \
  --repository-type tfsgit \
  --branch main \
  --yml-path azure-pipelines-generate.yml

echo "✅ Azure DevOps pipelines created!"
echo "👉 Go to https://dev.azure.com/vivacityapp/Viva/_build to view"
