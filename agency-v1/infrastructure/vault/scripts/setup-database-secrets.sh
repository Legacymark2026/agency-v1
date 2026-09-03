#!/usr/bin/env bash
# ══════════════════════════════════════════════════════════════════════════════
# Configuración del Motor de Base de Datos Dinámica en Vault (PostgreSQL)
# ══════════════════════════════════════════════════════════════════════════════
set -euo pipefail

export VAULT_ADDR="http://127.0.0.1:8200"

echo "🐘 [1/3] Habilitando motor de base de datos en Vault..."
vault secrets enable database || echo "Motor de base de datos ya habilitado."

POSTGRES_HOST="${POSTGRES_HOST:-postgres}"
POSTGRES_USER="${POSTGRES_USER:-vault_admin}"
POSTGRES_PASS="${POSTGRES_PASS:-VaultAdminPasswordChangeMe2026!}"
POSTGRES_DB="${POSTGRES_DB:-legacymark_core}"

echo "🔗 [2/3] Configurando conexión con cluster PostgreSQL..."
vault write database/config/postgresql-legacymark \
  plugin_name=postgresql-database-plugin \
  allowed_roles="finance-service-role,payment-service-role" \
  connection_url="postgresql://{{username}}:{{password}}@$POSTGRES_HOST:5432/$POSTGRES_DB?sslmode=disable" \
  username="$POSTGRES_USER" \
  password="$POSTGRES_PASS"

echo "⏰ [3/3] Configurando roles con credenciales dinámicas (TTL de 1 hora)..."

# Rol para finance-service
vault write database/roles/finance-service-role \
  db_name=postgresql-legacymark \
  creation_statements="CREATE ROLE \"{{name}}\" WITH LOGIN PASSWORD '{{password}}' VALID UNTIL '{{expiration}}'; \
                       GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO \"{{name}}\"; \
                       GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO \"{{name}}\";" \
  default_ttl="1h" \
  max_ttl="24h"

# Rol para payment-service
vault write database/roles/payment-service-role \
  db_name=postgresql-legacymark \
  creation_statements="CREATE ROLE \"{{name}}\" WITH LOGIN PASSWORD '{{password}}' VALID UNTIL '{{expiration}}'; \
                       GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO \"{{name}}\"; \
                       GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO \"{{name}}\";" \
  default_ttl="1h" \
  max_ttl="24h"

echo "✅ Credenciales dinámicas de PostgreSQL configuradas. Cada servicio recibirá usuarios efímeros con expiración de 1 hora."
