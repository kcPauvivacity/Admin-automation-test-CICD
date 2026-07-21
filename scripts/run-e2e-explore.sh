#!/bin/bash
# E2E Exploration Runner
#
# Uses Claude Code + Playwright MCP to autonomously navigate the staging app,
# find bugs, create ADO tickets, and send a Slack summary.
#
# Usage:
#   ./scripts/run-e2e-explore.sh              (full exploration)
#   ./scripts/run-e2e-explore.sh --module properties  (single module)
#   ./scripts/run-e2e-explore.sh --dry-run    (explore only, no bug creation)

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
APP_DIR="$(dirname "$SCRIPT_DIR")"
LOG_FILE="/tmp/e2e-explore-$(date +%Y%m%d-%H%M%S).log"

# Load .env
if [ -f "$APP_DIR/.env" ]; then
  export $(grep -v '^#' "$APP_DIR/.env" | grep -v '^$' | xargs)
fi

echo "=== Vivacity E2E Exploration ==="
echo "Date: $(date)"
echo "Log: $LOG_FILE"
echo ""

cd "$APP_DIR"

# Build the prompt for Claude
MODULE_ARG=""
if [ "$2" != "" ] && [ "$1" == "--module" ]; then
  MODULE_ARG="Focus only on the '$2' module."
fi

DRY_RUN_NOTE=""
if [ "$1" == "--dry-run" ]; then
  DRY_RUN_NOTE="This is a DRY RUN — explore and report findings but do NOT create ADO bugs."
fi

PROMPT="$(cat "$SCRIPT_DIR/e2e-explore-prompt.md")

---
ADO_PAT (for creating bugs via API): $ADO_PAT
ADO org: https://dev.azure.com/vivacityapp
ADO project: Viva

To create an ADO bug, use this curl command pattern:
curl -s -X POST \\
  'https://dev.azure.com/vivacityapp/Viva/_apis/wit/workitems/\$Bug?api-version=7.0' \\
  -H 'Authorization: Basic \$(echo -n \":$ADO_PAT\" | base64)' \\
  -H 'Content-Type: application/json-patch+json' \\
  -d '[
    {\"op\":\"add\",\"path\":\"/fields/System.Title\",\"value\":\"TITLE_HERE\"},
    {\"op\":\"add\",\"path\":\"/fields/Microsoft.VSTS.TCM.ReproSteps\",\"value\":\"REPRO_HERE\"},
    {\"op\":\"add\",\"path\":\"/fields/System.Tags\",\"value\":\"auto-generated; e2e-bot\"}
  ]'

$MODULE_ARG
$DRY_RUN_NOTE

Start exploring now. Use the Playwright MCP browser tools to navigate and test."

# Run Claude Code in non-interactive mode with Playwright MCP
# .claude/settings.json is picked up automatically from the project dir
echo "$PROMPT" | claude --print --output-format text 2>&1 | tee "$LOG_FILE"

echo ""
echo "=== Done ==="
echo "Log saved to: $LOG_FILE"
