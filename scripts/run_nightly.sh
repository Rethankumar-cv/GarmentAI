#!/bin/bash
# run_nightly.sh — Linux/Mac cron script for nightly pipeline run
#
# Add to crontab (run at 2 AM daily):
#   crontab -e
#   0 2 * * * /path/to/GarmentsInsights_AI/GarmentsInsights_AI/scripts/run_nightly.sh
#
# For weekly retrain (Sunday 3 AM):
#   0 3 * * 0 /path/to/.../run_nightly.sh --retrain

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PYTHON="$PROJECT_DIR/venv/bin/python"
LOG_DIR="$PROJECT_DIR/analytics/pipeline_logs"
LOG_FILE="$LOG_DIR/nightly.log"
RETRAIN=${1:-""}

mkdir -p "$LOG_DIR"

echo "[$(date '+%Y-%m-%d %H:%M:%S')] Starting nightly pipeline... RETRAIN=$RETRAIN" >> "$LOG_FILE"

cd "$PROJECT_DIR"

if [ "$RETRAIN" = "--retrain" ]; then
    "$PYTHON" -m data_pipeline.pipeline --retrain >> "$LOG_FILE" 2>&1
else
    "$PYTHON" -m data_pipeline.pipeline >> "$LOG_FILE" 2>&1
fi

EXIT_CODE=$?

if [ $EXIT_CODE -eq 0 ]; then
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] Pipeline completed successfully." >> "$LOG_FILE"
else
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] Pipeline FAILED (exit $EXIT_CODE)." >> "$LOG_FILE"
fi

echo "" >> "$LOG_FILE"
exit $EXIT_CODE
