#!/usr/bin/env bash
# ══════════════════════════════════════════════════════════════════════════════
# LegacyMark — Zero-Downtime Secret Rotation
# ══════════════════════════════════════════════════════════════════════════════
# Usage: bash scripts/rotate-secrets.sh [secret-name]
# Example: bash scripts/rotate-secrets.sh JWT_SECRET
# ══════════════════════════════════════════════════════════════════════════════
set -euo pipefail

SECRET_NAME=${1:-""}
ENV_FILE=".env"

if [[ -z "$SECRET_NAME" ]]; then
  echo "Usage: $0 <SECRET_NAME>"
  echo "Available: JWT_SECRET, NEXTAUTH_SECRET, INTERNAL_SECRET, POSTGRES_PASSWORD"
  exit 1
fi

NEW_VALUE=$(openssl rand -hex 32)
echo "[rotate-secrets] Rotating $SECRET_NAME..."

# Update .env in-place
if grep -q "^${SECRET_NAME}=" "$ENV_FILE"; then
  sed -i "s|^${SECRET_NAME}=.*|${SECRET_NAME}=${NEW_VALUE}|" "$ENV_FILE"
  echo "[rotate-secrets] ✅ $SECRET_NAME updated in $ENV_FILE"
else
  echo "${SECRET_NAME}=${NEW_VALUE}" >> "$ENV_FILE"
  echo "[rotate-secrets] ✅ $SECRET_NAME appended to $ENV_FILE"
fi

echo "[rotate-secrets] Restarting affected services..."
docker compose up -d --no-build --no-deps auth-service web api-gateway
echo "[rotate-secrets] ✅ Rotation complete. New value is: $NEW_VALUE"
