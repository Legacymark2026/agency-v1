#!/usr/bin/env bash
# ══════════════════════════════════════════════════════════════════════════════
# LegacyMark — PostgreSQL Restore
# ══════════════════════════════════════════════════════════════════════════════
set -euo pipefail

BACKUP_DIR="/var/backups/legacymark"
PG_CONTAINER="agency-v1-postgres-1"
PG_USER="legacymark"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

if [ $# -eq 0 ]; then
    echo -e "${YELLOW}Usage: $0 <backup_file.sql.gz>${NC}"
    echo -e "Available backups in $BACKUP_DIR:"
    ls -lh "$BACKUP_DIR"/*.sql.gz 2>/dev/null || echo "No backups found."
    exit 0
fi

BACKUP_FILE="$1"

if [ ! -f "$BACKUP_FILE" ]; then
    echo -e "${RED}Error: File $BACKUP_FILE not found.${NC}"
    exit 1
fi

BASENAME=$(basename "$BACKUP_FILE")
# Parse database name from format: dbname_YYYYMMDD_HHMMSS.sql.gz
if [[ "$BASENAME" =~ ^(.*)_([0-9]{8}_[0-9]{6})\.sql\.gz$ ]]; then
    DB_NAME="${BASH_REMATCH[1]}"
else
    echo -e "${RED}Error: Cannot determine database name from filename. Expected format: dbname_YYYYMMDD_HHMMSS.sql.gz${NC}"
    exit 1
fi

echo -e "${YELLOW}WARNING: This will overwrite the database '$DB_NAME'!${NC}"
read -p "Type 'RESTORE' to confirm: " CONFIRM

if [ "$CONFIRM" != "RESTORE" ]; then
    echo -e "${RED}Restore cancelled.${NC}"
    exit 0
fi

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
PRE_RESTORE_BACKUP="${BACKUP_DIR}/${DB_NAME}_prerestore_${TIMESTAMP}.sql.gz"

echo -e "Creating pre-restore backup..."
if docker exec -t "$PG_CONTAINER" pg_dump -U "$PG_USER" "$DB_NAME" | gzip > "$PRE_RESTORE_BACKUP"; then
    echo -e "${GREEN}Pre-restore backup created at $PRE_RESTORE_BACKUP${NC}"
else
    echo -e "${RED}Failed to create pre-restore backup. Aborting.${NC}"
    exit 1
fi

echo -e "Restoring $BACKUP_FILE into database $DB_NAME..."
if zcat "$BACKUP_FILE" | docker exec -i "$PG_CONTAINER" psql -U "$PG_USER" -d "$DB_NAME"; then
    echo -e "${GREEN}Restore completed successfully.${NC}"
else
    echo -e "${RED}Restore encountered errors. Check the logs.${NC}"
    exit 1
fi
