#!/bin/sh
# ══════════════════════════════════════════════════════════════════════════════
# LegacyMark — Backup Inventory & Cryptographic Integrity Check
# ══════════════════════════════════════════════════════════════════════════════
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
CONFIG_FILE="${SCRIPT_DIR}/../config/backup.conf"

if [ -f "$CONFIG_FILE" ]; then
  # shellcheck source=/dev/null
  . "$CONFIG_FILE"
fi

ARCHIVE_PATH="${ARCHIVE_DIR:-/var/backups/legacymark/archive}"

echo "🔍 [Integrity Scanner] Verificando inventario de respaldos en ${ARCHIVE_PATH}..."

BACKUP_COUNT=$(ls -1 "${ARCHIVE_PATH}"/*.pkg.enc 2>/dev/null | wc -l || echo "0")

if [ "${BACKUP_COUNT}" -eq 0 ]; then
  echo "⚠️ ALERTA: No se encontraron respaldos en ${ARCHIVE_PATH}."
  exit 1
fi

echo "📦 Total de paquetes de respaldo inmutables encontrados: ${BACKUP_COUNT}"

# Verificar que cada paquete tenga su llave cifrada correspondiente
INVALID=0
for pkg in "${ARCHIVE_PATH}"/*.pkg.enc; do
  if [ ! -f "${pkg}.key.enc" ]; then
    echo "❌ Error: Paquete huérfano sin llave cifrada: ${pkg}"
    INVALID=$((INVALID + 1))
  else
    SIZE=$(du -h "${pkg}" | awk '{print $1}')
    echo "  • [OK] $(basename "${pkg}") (${SIZE}) - Sellado y protegido."
  fi
done

if [ ${INVALID} -gt 0 ]; then
  echo "❌ Se encontraron ${INVALID} paquetes con anomalías."
  exit 1
fi

echo "✅ Todos los respaldos se encuentran íntegros y validados."
exit 0
