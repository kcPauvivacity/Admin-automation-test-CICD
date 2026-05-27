#!/bin/bash
# Daily runner for bug-to-test.mjs
# Called by crontab — loads .env and runs the generator

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
APP_DIR="$(dirname "$SCRIPT_DIR")"
LOG_FILE="/tmp/bug-to-test.log"

cd "$APP_DIR"

# Load .env
if [ -f "$APP_DIR/.env" ]; then
  export $(grep -v '^#' "$APP_DIR/.env" | grep -v '^$' | xargs)
fi

echo "=== $(date) ===" >> "$LOG_FILE"
/usr/local/bin/node "$SCRIPT_DIR/bug-to-test.mjs" 2>&1 | tee -a "$LOG_FILE"
echo "" >> "$LOG_FILE"
