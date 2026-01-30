#!/bin/bash

# Script to cancel all running Azure DevOps pipelines
# Usage: ./cancel-all-pipelines.sh

ORGANIZATION="https://dev.azure.com/vivacityapp"
PROJECT="Viva"

echo "🔍 Finding all running pipelines..."

# Check if Azure CLI is installed
if ! command -v az &> /dev/null; then
    echo "❌ Azure CLI is not installed"
    echo "Install it with: brew install azure-cli"
    exit 1
fi

# Login check
echo "Checking Azure CLI login..."
az account show &> /dev/null
if [ $? -ne 0 ]; then
    echo "🔐 Please login to Azure..."
    az login
fi

# Get all running builds
echo ""
echo "📋 Getting list of running pipelines..."
RUNNING_BUILDS=$(az pipelines runs list \
  --organization "$ORGANIZATION" \
  --project "$PROJECT" \
  --status inProgress \
  --query "[].{id:id, name:definition.name}" \
  -o tsv)

if [ -z "$RUNNING_BUILDS" ]; then
    echo "✅ No running pipelines found!"
    exit 0
fi

echo ""
echo "Found running pipelines:"
echo "$RUNNING_BUILDS"
echo ""

# Ask for confirmation
read -p "⚠️  Cancel all these pipelines? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Cancelled - no pipelines stopped"
    exit 0
fi

# Cancel each build
echo ""
echo "🛑 Cancelling pipelines..."
echo "$RUNNING_BUILDS" | while read -r BUILD_ID BUILD_NAME; do
    echo "  Cancelling: $BUILD_NAME (ID: $BUILD_ID)..."
    az pipelines build cancel \
      --organization "$ORGANIZATION" \
      --project "$PROJECT" \
      --id "$BUILD_ID" \
      &> /dev/null
    
    if [ $? -eq 0 ]; then
        echo "  ✅ Cancelled: $BUILD_NAME"
    else
        echo "  ❌ Failed to cancel: $BUILD_NAME"
    fi
done

echo ""
echo "✅ Done! All running pipelines cancelled."
