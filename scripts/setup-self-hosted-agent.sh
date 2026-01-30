#!/bin/bash

# Azure DevOps Self-Hosted Agent Setup
# This allows you to run Azure Pipelines on your own machine with unlimited minutes

set -e

echo "======================================"
echo "🤖 AZURE DEVOPS SELF-HOSTED AGENT SETUP"
echo "======================================"
echo ""

# Configuration
ORGANIZATION_URL="https://dev.azure.com/vivacityapp"
AGENT_POOL="Default"
AGENT_NAME="Local-Agent-$(hostname)"
WORK_FOLDER="_work"

echo "📋 Prerequisites:"
echo "  1. Personal Access Token (PAT) with 'Agent Pools (read, manage)' scope"
echo "  2. macOS/Linux/Windows machine"
echo "  3. Internet connection"
echo ""

# Check if PAT is provided
if [ -z "$AZURE_DEVOPS_PAT" ]; then
    echo "⚠️  Please set your Personal Access Token:"
    echo ""
    echo "export AZURE_DEVOPS_PAT='your-pat-token-here'"
    echo ""
    echo "To create a PAT:"
    echo "  1. Go to: https://dev.azure.com/vivacityapp/_usersSettings/tokens"
    echo "  2. Click 'New Token'"
    echo "  3. Name: 'Self-Hosted Agent'"
    echo "  4. Scopes: Select 'Agent Pools (read, manage)'"
    echo "  5. Create and copy the token"
    echo ""
    exit 1
fi

# Detect OS
OS="$(uname -s)"
case "${OS}" in
    Darwin*)    PLATFORM="osx";;
    Linux*)     PLATFORM="linux";;
    *)          echo "❌ Unsupported OS: ${OS}"; exit 1;;
esac

# Detect Architecture
ARCH="$(uname -m)"
case "${ARCH}" in
    x86_64)     AGENT_ARCH="x64";;
    arm64)      AGENT_ARCH="arm64";;
    *)          echo "❌ Unsupported architecture: ${ARCH}"; exit 1;;
esac

echo "🖥️  Detected: ${PLATFORM}-${AGENT_ARCH}"
echo ""

# Create agent directory
AGENT_DIR="$HOME/azure-agent"
mkdir -p "$AGENT_DIR"
cd "$AGENT_DIR"

echo "📥 Downloading Azure Pipelines Agent..."
AGENT_VERSION="3.236.1"
AGENT_FILE="vsts-agent-${PLATFORM}-${AGENT_ARCH}-${AGENT_VERSION}.tar.gz"
AGENT_URL="https://vstsagentpackage.azureedge.net/agent/${AGENT_VERSION}/${AGENT_FILE}"

if [ ! -f "$AGENT_FILE" ]; then
    curl -LO "$AGENT_URL"
    echo "✅ Downloaded agent"
else
    echo "✅ Agent already downloaded"
fi

# Extract agent
echo "📦 Extracting agent..."
tar xzf "$AGENT_FILE"

# Configure agent
echo ""
echo "⚙️  Configuring agent..."
echo ""

./config.sh \
    --unattended \
    --url "$ORGANIZATION_URL" \
    --auth pat \
    --token "$AZURE_DEVOPS_PAT" \
    --pool "$AGENT_POOL" \
    --agent "$AGENT_NAME" \
    --work "$WORK_FOLDER" \
    --replace \
    --acceptTeeEula

echo ""
echo "======================================"
echo "✅ AGENT CONFIGURED SUCCESSFULLY!"
echo "======================================"
echo ""
echo "To start the agent:"
echo "  cd $AGENT_DIR"
echo "  ./run.sh"
echo ""
echo "To run as a service (starts automatically):"
echo "  sudo ./svc.sh install"
echo "  sudo ./svc.sh start"
echo ""
echo "To view agent status:"
echo "  https://dev.azure.com/vivacityapp/_settings/agentpools?poolId=1&view=agents"
echo ""
