#!/usr/bin/env bash
# Automated Immutable DR Backup Script

set -euo pipefail

# Configuration
DB_NAME="${DB_NAME:-legacymark}"
DB_USER="${DB_USER:-postgres}"
DB_HOST="${DB_HOST:-localhost}"
S3_BUCKET="${S3_BUCKET:-s3://legacymark-dr-backups/}"
BACKUP_DIR="${BACKUP_DIR:-/tmp/dr-backups}"
WEBHOOK_URL="${WEBHOOK_URL:-}" # Slack or Discord webhook

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/${DB_NAME}_${TIMESTAMP}.sql.gz"

mkdir -p "$BACKUP_DIR"

notify_failure() {
  local error_msg=$1
  echo "FAILURE: $error_msg" >&2
  if [[ -n "$WEBHOOK_URL" ]]; then
    # Simple JSON payload for Slack/Discord
    curl -s -X POST -H 'Content-type: application/json' \
      --data "{\"text\": \"🚨 DR Backup Failed: $error_msg\"}" \
      "$WEBHOOK_URL" || true
  fi
}

trap 'notify_failure "Script encountered an unexpected error on line $LINENO"' ERR

echo "Starting backup for $DB_NAME..."

# Dump and compress
echo "Creating pg_dump and compressing..."
pg_dump -U "$DB_USER" -h "$DB_HOST" "$DB_NAME" | gzip > "$BACKUP_FILE"

# Upload to S3
echo "Uploading to $S3_BUCKET..."
aws s3 cp "$BACKUP_FILE" "${S3_BUCKET}${DB_NAME}_${TIMESTAMP}.sql.gz" \
  --storage-class STANDARD_IA

# Cleanup local files older than 7 days
echo "Cleaning up old local files..."
find "$BACKUP_DIR" -type f -name "*.sql.gz" -mtime +7 -delete

echo "Backup completed successfully."
