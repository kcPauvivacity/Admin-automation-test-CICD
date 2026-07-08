#!/bin/bash
# Runner for auto-bug-creator.mjs
# Detects merged PRs → generates tests → runs them → creates ADO bugs on failure
# Run manually each morning alongside run-bug-to-test.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
APP_DIR="$(dirname "$SCRIPT_DIR")"
LOG_FILE="/tmp/auto-bug-creator.log"

cd "$APP_DIR"

# Load .env
if [ -f "$APP_DIR/.env" ]; then
  export $(grep -v '^#' "$APP_DIR/.env" | grep -v '^$' | xargs)
fi

echo "=== $(date) ===" >> "$LOG_FILE"
/usr/local/bin/node "$SCRIPT_DIR/auto-bug-creator.mjs" 2>&1 | tee -a "$LOG_FILE"
echo "" >> "$LOG_FILE"
