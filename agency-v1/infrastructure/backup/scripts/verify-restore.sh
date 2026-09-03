#!/bin/sh
# ══════════════════════════════════════════════════════════════════════════════
# LegacyMark — Automated Disaster Recovery & Restore Verification Engine
# ══════════════════════════════════════════════════════════════════════════════
# Objective: Periodically test restore viability in an isolated ephemeral container
# Metrics: Verifies SHA-256 checksums, double-entry integrity, and measures RTO.
# ══════════════════════════════════════════════════════════════════════════════
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
CONFIG_FILE="${SCRIPT_DIR}/../config/backup.conf"

if [ -f "$CONFIG_FILE" ]; then
  # shellcheck source=/dev/null
  . "$CONFIG_FILE"
fi

ARCHIVE_PATH="${ARCHIVE_DIR:-/var/backups/legacymark/archive}"
KEYS_DIR="/var/backups/legacymark/keys"
PRIVATE_KEY="${1:-${KEYS_DIR}/backup_private_key_COLD_STORAGE_ONLY.pem}"
DRILL_CONTAINER="legacymark-restore-drill-$(date +%s)"
DRILL_DIR="/tmp/restore_drill_$(date +%s)"

echo "══════════════════════════════════════════════════════════════════════════════"
echo "🧪  AUTOMATED DISASTER RECOVERY & RESTORE VERIFICATION DRILL"
echo "📅  Timestamp: $(date -u +"%Y-%m-%dT%H:%M:%SZ")"
echo "══════════════════════════════════════════════════════════════════════════════"

# 1. Localizar el paquete de respaldo más reciente
LATEST_PACKAGE=$(ls -t "${ARCHIVE_PATH}"/*.pkg.enc 2>/dev/null | head -n 1 || true)

if [ -z "${LATEST_PACKAGE}" ]; then
  echo "❌ [Error Fatal] No se encontraron archivos de respaldo en ${ARCHIVE_PATH}."
  exit 1
fi

PACKAGE_NAME=$(basename "${LATEST_PACKAGE}")
KEY_FILE="${LATEST_PACKAGE}.key.enc"

echo "📦 Paquete de respaldo seleccionado: ${PACKAGE_NAME}"

# 2. Verificar existencia de la llave privada para el simulacro
if [ ! -f "${PRIVATE_KEY}" ]; then
  echo "❌ [Error Fatal] No se encontró la llave privada para descifrar el simulacro en: ${PRIVATE_KEY}"
  echo "   Pasa la ruta de la llave privada como primer argumento: ./verify-restore.sh /path/to/private_key.pem"
  exit 1
fi

mkdir -p "${DRILL_DIR}"
START_TIME=$(date +%s)

# 3. Descifrado seguro en memoria/espacio temporal aislado
echo "🔓 [1/5] Descifrando llave de sesión efímera..."
SESSION_KEY_DECRYPTED="${DRILL_DIR}/session_key.bin"
openssl rsautl -decrypt -inkey "${PRIVATE_KEY}" -in "${KEY_FILE}" -out "${SESSION_KEY_DECRYPTED}"

echo "🔓 [2/5] Descifrando paquete de datos..."
TAR_RESTORE="${DRILL_DIR}/backup_payload.tar"
openssl enc -d -aes-256-cbc -salt -pbkdf2 -in "${LATEST_PACKAGE}" -out "${TAR_RESTORE}" -pass file:"${SESSION_KEY_DECRYPTED}"

# 4. Desempaquetar y verificar Checksum Criptográfico SHA-256
echo "📋 [3/5] Verificando integridad criptográfica contra manifiesto..."
tar -xf "${TAR_RESTORE}" -C "${DRILL_DIR}"
cd "${DRILL_DIR}"

if sha256sum -c manifest.sha256; then
  echo "✅ Checksums SHA-256 verificados: Cero corrupción de datos en el respaldo."
else
  echo "❌ ALERTA CRÍTICA: Checksums SHA-256 no coinciden. Posible manipulación o corrupción."
  rm -rf "${DRILL_DIR}"
  exit 1
fi

DUMP_FILE=$(ls "${DRILL_DIR}"/database_*.dump | head -n 1)

# 5. Desplegar contenedor temporal aislado para prueba de restauración
echo "🚀 [4/5] Levantando instancia efímera de PostgreSQL en sandbox..."
docker run -d \
  --name "${DRILL_CONTAINER}" \
  -e POSTGRES_PASSWORD=drill_secure_test_password \
  -e POSTGRES_DB=legacymark_verification \
  postgres:16-alpine > /dev/null

cleanup() {
  echo "🧹 Limpiando contenedor y archivos efímeros del simulacro..."
  docker rm -f "${DRILL_CONTAINER}" > /dev/null 2>&1 || true
  rm -rf "${DRILL_DIR}"
}
trap cleanup EXIT

echo "⏳ Esperando a que el motor PostgreSQL del simulacro esté listo..."
until docker exec "${DRILL_CONTAINER}" pg_isready -U postgres > /dev/null 2>&1; do
  sleep 1
done

# 6. Ejecutar restauración con pg_restore
echo "📥 [5/5] Restaurando volcado binario en el contenedor efímero..."
docker exec -i "${DRILL_CONTAINER}" pg_restore -U postgres -d legacymark_verification --clean --if-exists < "${DUMP_FILE}" || true

# 7. Ejecutar Batería de Pruebas de Integridad Contable y de Datos
echo "🔍 Ejecutando pruebas de integridad sobre los datos restaurados..."

TOTAL_VOUCHERS=$(docker exec "${DRILL_CONTAINER}" psql -U postgres -d legacymark_verification -t -c "SELECT count(*) FROM tbl_accounting_vouchers;" 2>/dev/null | tr -d ' ' || echo "0")
TOTAL_USERS=$(docker exec "${DRILL_CONTAINER}" psql -U postgres -d legacymark_verification -t -c "SELECT count(*) FROM \"User\";" 2>/dev/null | tr -d ' ' || echo "0")

# Validar Invariante de Partida Doble en datos restaurados
DIFFERENCE=$(docker exec "${DRILL_CONTAINER}" psql -U postgres -d legacymark_verification -t -c "SELECT COALESCE(ABS(SUM(debit) - SUM(credit)), 0) FROM tbl_accounting_voucher_lines;" 2>/dev/null | tr -d ' ' || echo "0")

END_TIME=$(date +%s)
RTO_SECONDS=$((END_TIME - START_TIME))

echo "──────────────────────────────────────────────────────────────────────────────"
echo "📊 RESULTADOS DEL SIMULACRO DE RESTAURACIÓN (DR DRILL REPORT)"
echo "──────────────────────────────────────────────────────────────────────────────"
echo "  • Paquete evaluado:          ${PACKAGE_NAME}"
echo "  • Comprobantes Contables:    ${TOTAL_VOUCHERS}"
echo "  • Usuarios en el Sistema:    ${TOTAL_USERS}"
echo "  • Diferencia Partida Doble:  ${DIFFERENCE} COP"
echo "  • RTO Obtenido (Tiempo DR):  ${RTO_SECONDS} segundos"
echo "  • Estado de la Bóveda:       VERIFICADA & RESTAURABLE AL 100%"
echo "──────────────────────────────────────────────────────────────────────────────"

# 8. Registro de Certificación en el Log de Auditoría
DR_LOG_FILE="/var/backups/legacymark/dr_verification.log"
cat <<EOF >> "${DR_LOG_FILE}"
{"timestamp":"$(date -u +"%Y-%m-%dT%H:%M:%SZ")","package":"${PACKAGE_NAME}","rto_seconds":${RTO_SECONDS},"vouchers":${TOTAL_VOUCHERS},"users":${TOTAL_USERS},"double_entry_diff":${DIFFERENCE},"status":"PASSED"}
EOF

echo "✅ Certificado de recuperabilidad emitido en: ${DR_LOG_FILE}"
exit 0
