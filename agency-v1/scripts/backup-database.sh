#!/usr/bin/env bash
# ══════════════════════════════════════════════════════════════════════════════
# LegacyMark — Automated PostgreSQL Backup
# ══════════════════════════════════════════════════════════════════════════════
# Cron: 0 3 * * * /bin/bash /root/agency-v1/agency-v1/scripts/backup-database.sh >> /var/log/legacymark-backup.log 2>&1
# ══════════════════════════════════════════════════════════════════════════════
set -euo pipefail

BACKUP_DIR="/var/backups/legacymark"
PG_CONTAINER="agency-v1-postgres-1"
PG_USER="legacymark"
RETENTION_DAYS=30
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
DATABASES=("legacymark" "legacymark_auth" "legacymark_core" "legacymark_media" "legacymark_analytics")

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}Starting database backup at $(date)${NC}"

# Ensure backup directory exists
mkdir -p "$BACKUP_DIR"

TOTAL_SIZE=0
ERRORS=0

for DB in "${DATABASES[@]}"; do
    echo -e "Backing up database: ${YELLOW}${DB}${NC}..."
    BACKUP_FILE="${BACKUP_DIR}/${DB}_${TIMESTAMP}.sql.gz"
    
    if docker exec -t "$PG_CONTAINER" pg_dump -U "$PG_USER" "$DB" | gzip > "$BACKUP_FILE"; then
        echo -e "${GREEN}Successfully dumped ${DB}${NC}"
        
        # Verify integrity
        if gunzip -t "$BACKUP_FILE"; then
            echo -e "${GREEN}Backup integrity verified for ${DB}${NC}"
            FILE_SIZE=$(stat -c%s "$BACKUP_FILE")
            TOTAL_SIZE=$((TOTAL_SIZE + FILE_SIZE))
        else
            echo -e "${RED}Backup integrity check failed for ${DB}${NC}"
            ERRORS=$((ERRORS + 1))
        fi
    else
        echo -e "${RED}Failed to dump ${DB}${NC}"
        ERRORS=$((ERRORS + 1))
    fi
done

# Cleanup old backups
echo "Cleaning up backups older than ${RETENTION_DAYS} days..."
find "$BACKUP_DIR" -type f -name "*.sql.gz" -mtime +$RETENTION_DAYS -delete 2>/dev/null || true

# Calculate total size in MB
TOTAL_SIZE_MB=$((TOTAL_SIZE / 1024 / 1024))

echo -e "Backup process completed."
echo -e "Total backup size: ${GREEN}${TOTAL_SIZE_MB} MB${NC}"

if [ $ERRORS -gt 0 ]; then
    echo -e "${RED}Backup completed with $ERRORS errors.${NC}"
    exit 1
else
    echo -e "${GREEN}All backups completed successfully.${NC}"
    exit 0
fi
