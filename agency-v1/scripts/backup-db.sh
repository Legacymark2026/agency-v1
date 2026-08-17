#!/bin/bash
# ══════════════════════════════════════════════════════════════════════════════
# LegacyMark — ISO 22301 / ISO 27001 Off-site Encrypted Database Backup Script
# ══════════════════════════════════════════════════════════════════════════════

set -e

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="/tmp/backups"
BACKUP_FILE="${BACKUP_DIR}/legacymark_db_${TIMESTAMP}.sql.gz"
ENCRYPTED_FILE="${BACKUP_FILE}.enc"

mkdir -p ${BACKUP_DIR}

echo "[ISO 22301 Backup] Starting database dump at ${TIMESTAMP}..."

# Export database via pg_dump
docker compose exec -T postgres pg_dump -U postgres legacymark_core | gzip > ${BACKUP_FILE}

echo "[ISO 27001 Backup] Encrypting backup with AES-256-CBC..."
openssl enc -aes-256-cbc -salt -pbkdf2 -in ${BACKUP_FILE} -out ${ENCRYPTED_FILE} -k "${BACKUP_ENCRYPTION_KEY:-iso27001_secure_key_2026}"

echo "[ISO 22301 Backup] Backup created and encrypted successfully: ${ENCRYPTED_FILE}"

# Cleanup raw unencrypted dump
rm -f ${BACKUP_FILE}

echo "[ISO 22301 Backup] Done."
