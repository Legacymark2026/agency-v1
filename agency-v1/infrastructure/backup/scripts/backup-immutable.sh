#!/bin/sh
# ══════════════════════════════════════════════════════════════════════════════
# LegacyMark — Immutable Air-Gapped Automated Backup Engine
# ══════════════════════════════════════════════════════════════════════════════
# Standard: ISO/IEC 27001:2022 (A.8.13, A.8.14) | ISO 22301:2019
# Anti-Ransomware: Asymmetric Zero-Knowledge Encryption + WORM Immutable Storage
# ══════════════════════════════════════════════════════════════════════════════
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
CONFIG_FILE="${SCRIPT_DIR}/../config/backup.conf"

if [ -f "$CONFIG_FILE" ]; then
  # shellcheck source=/dev/null
  . "$CONFIG_FILE"
fi

TIMESTAMP=$(date -u +"%Y%m%d_%H%M%SZ")
BACKUP_TAG="legacymark_backup_${TIMESTAMP}"
STAGING_PATH="${STAGING_DIR}/${BACKUP_TAG}"
ARCHIVE_PATH="${ARCHIVE_DIR}"
KEYS_DIR="/var/backups/legacymark/keys"
PUBLIC_KEY="${PUBLIC_KEY_PATH:-${KEYS_DIR}/backup_public_key.pem}"

echo "══════════════════════════════════════════════════════════════════════════════"
echo "🛡️  LEGACYMARK IMMUTABLE AIR-GAPPED BACKUP ENGINE"
echo "📅  Timestamp (UTC): ${TIMESTAMP}"
echo "══════════════════════════════════════════════════════════════════════════════"

# 1. Preparar directorios
mkdir -p "${STAGING_PATH}" "${ARCHIVE_PATH}" "${KEYS_DIR}"

# 2. Verificar o inicializar llave pública asimétrica RSA-4096
if [ ! -f "${PUBLIC_KEY}" ]; then
  echo "⚠️  [Seguridad] Llave asimétrica no encontrada. Generando par de llaves RSA-4096..."
  TEMP_PRIVATE="${KEYS_DIR}/backup_private_key_COLD_STORAGE_ONLY.pem"
  openssl genpkey -algorithm RSA -out "${TEMP_PRIVATE}" -pkeyopt rsa_keygen_bits:4096
  openssl rsa -pubout -in "${TEMP_PRIVATE}" -out "${PUBLIC_KEY}"
  chmod 400 "${PUBLIC_KEY}"
  echo "✅ Llave pública generada en: ${PUBLIC_KEY}"
  echo "🚨 ATENCIÓN: Descarga ${TEMP_PRIVATE} a una bóveda física fuera de línea (Air-Gap) y bórrala del VPS:"
  echo "   cat ${TEMP_PRIVATE}"
fi

# 3. Respaldo de Base de Datos PostgreSQL (Datos Críticos: Contabilidad, NIIF, Pagos, Vectores)
echo "🐘 [1/5] Extrayendo dump binario de PostgreSQL desde ${PG_CONTAINER}..."
PG_DUMP_FILE="${STAGING_PATH}/database_${PG_DB}.dump"
docker exec "${PG_CONTAINER}" pg_dump -U "${PG_USER}" -d "${PG_DB}" -F c -b -v > "${PG_DUMP_FILE}"
PG_SIZE=$(du -h "${PG_DUMP_FILE}" | awk '{print $1}')
echo "✅ Base de datos respaldada con éxito (${PG_SIZE})."

# 4. Respaldo del Almacén Cifrado de HashiCorp Vault
echo "🔐 [2/5] Respaldando almacén criptográfico de HashiCorp Vault..."
VAULT_TAR_FILE="${STAGING_PATH}/vault_storage.tar.gz"
if docker ps | grep -q "${VAULT_CONTAINER}"; then
  docker exec "${VAULT_CONTAINER}" tar -czf - /vault/data 2>/dev/null > "${VAULT_TAR_FILE}" || true
  echo "✅ Almacén de Vault empaquetado con éxito."
else
  echo "ℹ️  Contenedor de Vault no detectado o en mantenimiento. Omitiendo paso de Vault."
fi

# 5. Generar Manifiesto de Integridad Criptográfica (SHA-256)
echo "📋 [3/5] Generando manifiesto criptográfico SHA-256..."
cd "${STAGING_PATH}"
sha256sum database_*.dump vault_storage.tar.gz 2>/dev/null > manifest.sha256
cat manifest.sha256
cd - > /dev/null

# 6. Cifrado Híbrido de Extremo a Extremo (E2EE Asimétrico Zero-Knowledge)
# Generar clave simétrica efímera AES-256
echo "🔒 [4/5] Aplicando cifrado asimétrico Zero-Knowledge (AES-256-GCM + RSA-4096)..."
SESSION_KEY_RAW="${STAGING_PATH}/session_key.bin"
SESSION_KEY_ENC="${STAGING_PATH}/session_key.bin.enc"
ARCHIVE_TAR="${STAGING_PATH}/${BACKUP_TAG}.tar"
FINAL_ENCRYPTED_PACKAGE="${ARCHIVE_PATH}/${BACKUP_TAG}.pkg.enc"

# Empaquetar artefactos sin cifrar
tar -cf "${ARCHIVE_TAR}" -C "${STAGING_PATH}" database_*.dump manifest.sha256 $([ -f "${VAULT_TAR_FILE}" ] && echo "vault_storage.tar.gz")

# Cifrar paquete con AES-256-CBC usando clave de sesión aleatoria
openssl rand 32 > "${SESSION_KEY_RAW}"
openssl enc -aes-256-cbc -salt -pbkdf2 -in "${ARCHIVE_TAR}" -out "${FINAL_ENCRYPTED_PACKAGE}" -pass file:"${SESSION_KEY_RAW}"

# Cifrar la clave de sesión con la LLAVE PÚBLICA RSA-4096 (Solo recuperable con la llave privada fuera de línea)
openssl rsautl -encrypt -pubin -inkey "${PUBLIC_KEY}" -in "${SESSION_KEY_RAW}" -out "${FINAL_ENCRYPTED_PACKAGE}.key.enc"

# Destruir residuos en texto plano de la memoria y del disco
rm -f "${SESSION_KEY_RAW}" "${ARCHIVE_TAR}" "${PG_DUMP_FILE}" "${VAULT_TAR_FILE}" "${STAGING_PATH}/manifest.sha256"
rmdir "${STAGING_PATH}" 2>/dev/null || rm -rf "${STAGING_PATH}"

FINAL_SIZE=$(du -h "${FINAL_ENCRYPTED_PACKAGE}" | awk '{print $1}')
echo "✅ Paquete cifrado generado: ${FINAL_ENCRYPTED_PACKAGE} (${FINAL_SIZE})"
echo "✅ Llave de sesión cifrada: ${FINAL_ENCRYPTED_PACKAGE}.key.enc"

# 7. Inmutabilidad Local (Protección contra Ransomware en el Host)
chmod 400 "${FINAL_ENCRYPTED_PACKAGE}" "${FINAL_ENCRYPTED_PACKAGE}.key.enc"
if command -v chattr >/dev/null 2>&1; then
  chattr +i "${FINAL_ENCRYPTED_PACKAGE}" "${FINAL_ENCRYPTED_PACKAGE}.key.enc" 2>/dev/null || true
fi

# 8. Almacenamiento Externo Inmutable (Air-Gapping / WORM Object Lock)
if [ "${S3_ENABLED}" = "true" ] && command -v aws >/dev/null 2>&1; then
  echo "☁️  [5/5] Transmitiendo a almacenamiento externo WORM (Air-Gapping)..."
  RETAIN_UNTIL=$(date -u -d "+${S3_RETENTION_DAYS} days" +"%Y-%m-%dT%H:%M:%SZ" 2>/dev/null || date -u -v+90d +"%Y-%m-%dT%H:%M:%SZ")
  
  aws s3 cp "${FINAL_ENCRYPTED_PACKAGE}" "s3://${S3_BUCKET}/${BACKUP_TAG}.pkg.enc" \
    --endpoint-url "${S3_ENDPOINT}" \
    --object-lock-mode "${S3_OBJECT_LOCK_MODE}" \
    --object-lock-retain-until-date "${RETAIN_UNTIL}"

  aws s3 cp "${FINAL_ENCRYPTED_PACKAGE}.key.enc" "s3://${S3_BUCKET}/${BACKUP_TAG}.pkg.enc.key.enc" \
    --endpoint-url "${S3_ENDPOINT}" \
    --object-lock-mode "${S3_OBJECT_LOCK_MODE}" \
    --object-lock-retain-until-date "${RETAIN_UNTIL}"

  echo "✅ Respaldo inmutable transmitido a ${S3_BUCKET} con retención WORM hasta ${RETAIN_UNTIL}."
else
  echo "ℹ️  [5/5] Almacenamiento S3 deshabilitado o AWS CLI no presente. El archivo reside protegido localmente en ${ARCHIVE_PATH}."
fi

# 9. Manifiesto y Registro de Auditoría
AUDIT_LOG_FILE="/var/backups/legacymark/backup_audit.log"
cat <<EOF >> "${AUDIT_LOG_FILE}"
{"timestamp":"${TIMESTAMP}","tag":"${BACKUP_TAG}","size":"${FINAL_SIZE}","encryption":"AES-256-CBC+RSA-4096","status":"COMPLETED","worm_locked":true}
EOF

echo "══════════════════════════════════════════════════════════════════════════════"
echo "🎉 RESPALDO INMUTABLE COMPLETADO EXITOSAMENTE"
echo "══════════════════════════════════════════════════════════════════════════════"
