#!/bin/sh
# ══════════════════════════════════════════════════════════════════════════════
# HashiCorp Vault Bootstrap & Provisioning Script — LegacyMark VPS (POSIX sh)
# ══════════════════════════════════════════════════════════════════════════════

export VAULT_ADDR="http://127.0.0.1:8200"

echo "🔐 [1/6] Comprobando disponibilidad del servidor Vault..."
RETRIES=0
until vault status > /dev/null 2>&1 || [ $RETRIES -ge 15 ]; do
  # vault status returns code 2 if initialized/sealed, which means it is running!
  STATUS_CODE=$(vault status 2>&1 || true)
  if echo "$STATUS_CODE" | grep -q "Key.*Value\|Initialized"; then
    break
  fi
  echo "Esperando a que Vault inicie (intento $RETRIES)..."
  sleep 2
  RETRIES=$((RETRIES + 1))
done

echo "⚙️ [2/6] Inicializando Vault con Shamir (Umbral 3 de 5)..."
INIT_OUTPUT_FILE="/vault/data/vault_init_keys.txt"

# Verificar si ya está inicializado
IS_INIT=$(vault status -format=table 2>&1 | grep "Initialized" | awk '{print $2}' || true)

if [ "$IS_INIT" != "true" ]; then
  if vault operator init -key-shares=5 -key-threshold=3 > "$INIT_OUTPUT_FILE"; then
    chmod 600 "$INIT_OUTPUT_FILE" 2>/dev/null || true
    echo "✅ Llaves de Shamir generadas en $INIT_OUTPUT_FILE"
  else
    echo "❌ Error: Falló la inicialización de Vault. Revisa los permisos de /vault/data."
    rm -f "$INIT_OUTPUT_FILE"
    exit 1
  fi
else
  echo "ℹ️ Vault ya se encuentra inicializado."
fi

if [ ! -f "$INIT_OUTPUT_FILE" ]; then
  echo "❌ Error: No se encontró el archivo de llaves en $INIT_OUTPUT_FILE para realizar el unseal."
  exit 1
fi

# Extraer llaves con awk y grep nativos de Busybox
KEY_1=$(grep 'Unseal Key 1:' "$INIT_OUTPUT_FILE" | awk '{print $NF}')
KEY_2=$(grep 'Unseal Key 2:' "$INIT_OUTPUT_FILE" | awk '{print $NF}')
KEY_3=$(grep 'Unseal Key 3:' "$INIT_OUTPUT_FILE" | awk '{print $NF}')
ROOT_TOKEN=$(grep 'Initial Root Token:' "$INIT_OUTPUT_FILE" | awk '{print $NF}')

echo "🔓 [3/6] Desbloqueando Vault (Unsealing con 3 llaves)..."
vault operator unseal "$KEY_1" > /dev/null || true
vault operator unseal "$KEY_2" > /dev/null || true
vault operator unseal "$KEY_3" > /dev/null || true

export VAULT_TOKEN="$ROOT_TOKEN"
echo "✅ Vault desbloqueado y en estado OPERATIVO."

echo "📂 [4/6] Habilitando motor de secretos KV v2..."
vault secrets enable -path=secret kv-v2 2>/dev/null || echo "ℹ️ KV v2 ya estaba habilitado."

echo "📜 [5/6] Creando políticas de menor privilegio..."
vault policy write payment-service-policy /vault/policies/payment-service-policy.hcl
vault policy write finance-service-policy /vault/policies/finance-service-policy.hcl
vault policy write web-app-policy /vault/policies/web-app-policy.hcl
vault policy write ai-engine-policy /vault/policies/ai-engine-policy.hcl

echo "🔑 [6/6] Configurando autenticación AppRole para microservicios..."
vault auth enable approle 2>/dev/null || echo "ℹ️ AppRole ya estaba habilitado."

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

echo ""
echo "🎉 ¡Vault inicializado con éxito! Todos los roles y políticas han sido desplegados."
echo "📋 Root Token para administración inicial:"
echo "   $ROOT_TOKEN"
echo ""
echo "⚠️ IMPORTANTE: Guarda una copia de $INIT_OUTPUT_FILE fuera del servidor en un lugar seguro."
