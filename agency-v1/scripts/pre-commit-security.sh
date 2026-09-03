#!/usr/bin/env bash
# ══════════════════════════════════════════════════════════════════════════════
# LegacyMark Pre-Commit Security Hook
# ══════════════════════════════════════════════════════════════════════════════
# Blocks commits if hardcoded secrets, private keys, or insecure fallbacks exist
# ══════════════════════════════════════════════════════════════════════════════
set -eo pipefail

echo "🔍 [Pre-Commit] Escaneando archivos modificados en busca de secretos..."

# 1. Detectar si se intenta commitear llaves privadas o certificados
FORBIDDEN_EXTENSIONS='(\.pem|\.key|\.p12|\.pfx|\.jks|google-credentials\.json|gsc-credentials\.json)$'
STAGED_FILES=$(git diff --cached --name-only)

for file in $STAGED_FILES; do
  if [[ "$file" =~ $FORBIDDEN_EXTENSIONS ]]; then
    echo "❌ ERROR CRÍTICO DE SEGURIDAD: Se intentó agregar un archivo sensible: $file"
    echo "Por favor elimínalo del staging y verifica tu .gitignore."
    exit 1
  fi
done

# 2. Ejecutar Gitleaks si está instalado localmente
if command -v gitleaks &> /dev/null; then
  echo "🛡️ Ejecutando Gitleaks en archivos preparados..."
  gitleaks protect --staged --config .gitleaks.toml --verbose
else
  echo "⚠️ Advertencia: Gitleaks no está instalado en tu máquina local. Se validará en CI/CD."
fi

echo "✅ Escaneo de seguridad pre-commit superado."
exit 0
