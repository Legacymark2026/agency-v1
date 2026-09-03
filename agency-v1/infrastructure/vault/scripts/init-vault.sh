#!/usr/bin/env bash
# ══════════════════════════════════════════════════════════════════════════════
# HashiCorp Vault Bootstrap & Provisioning Script — LegacyMark VPS
# ══════════════════════════════════════════════════════════════════════════════
set -euo pipefail

export VAULT_ADDR="http://127.0.0.1:8200"

echo "🔐 [1/6] Comprobando disponibilidad del servidor Vault..."
until curl -s "$VAULT_ADDR/v1/sys/health" > /dev/null 2>&1 || true; do
  echo "Esperando a que Vault inicie..."
  sleep 2
done

echo "⚙️ [2/6] Inicializando Vault con Shamir (Umbral 3 de 5)..."
INIT_OUTPUT_FILE="/vault/data/vault_init_keys.json"

if [ ! -f "$INIT_OUTPUT_FILE" ]; then
  vault operator init -key-shares=5 -key-threshold=3 -format=json > "$INIT_OUTPUT_FILE"
  chmod 600 "$INIT_OUTPUT_FILE"
  echo "✅ Llaves de Shamir generadas en $INIT_OUTPUT_FILE (Copia este archivo a una ubicación segura)."
fi

# Extraer llaves para unseal
KEY_1=$(jq -r '.unseal_keys_b64[0]' "$INIT_OUTPUT_FILE")
KEY_2=$(jq -r '.unseal_keys_b64[1]' "$INIT_OUTPUT_FILE")
KEY_3=$(jq -r '.unseal_keys_b64[2]' "$INIT_OUTPUT_FILE")
ROOT_TOKEN=$(jq -r '.root_token' "$INIT_OUTPUT_FILE")

echo "🔓 [3/6] Desbloqueando Vault (Unsealing con 3 llaves)..."
vault operator unseal "$KEY_1" > /dev/null
vault operator unseal "$KEY_2" > /dev/null
vault operator unseal "$KEY_3" > /dev/null

export VAULT_TOKEN="$ROOT_TOKEN"
echo "✅ Vault desbloqueado y en estado OPERATIVO."

echo "📂 [4/6] Habilitando motor de secretos KV v2..."
vault secrets enable -path=secret kv-v2 || echo "KV v2 ya habilitado."

echo "📜 [5/6] Creando políticas de menor privilegio..."
vault policy write payment-service-policy /vault/policies/payment-service-policy.hcl
vault policy write finance-service-policy /vault/policies/finance-service-policy.hcl
vault policy write web-app-policy /vault/policies/web-app-policy.hcl
vault policy write ai-engine-policy /vault/policies/ai-engine-policy.hcl

echo "🔑 [6/6] Configurando autenticación AppRole para microservicios..."
vault auth enable approle || echo "AppRole ya habilitado."

# Rol para payment-service
vault write auth/approle/role/payment-service-role \
  token_policies="payment-service-policy" \
  token_ttl=1h \
  token_max_ttl=4h \
  secret_id_num_uses=0

# Rol para finance-service
vault write auth/approle/role/finance-service-role \
  token_policies="finance-service-policy" \
  token_ttl=1h \
  token_max_ttl=4h \
  secret_id_num_uses=0

# Rol para web app
vault write auth/approle/role/web-app-role \
  token_policies="web-app-policy" \
  token_ttl=1h \
  token_max_ttl=4h \
  secret_id_num_uses=0

# Rol para ai-engine
vault write auth/approle/role/ai-engine-role \
  token_policies="ai-engine-policy" \
  token_ttl=1h \
  token_max_ttl=4h \
  secret_id_num_uses=0

echo "🎉 ¡Vault inicializado con éxito! Todos los roles y políticas han sido desplegados."
