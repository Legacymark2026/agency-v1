#!/bin/bash
# ============================================================
# LegacyMark - Script de Deploy Seguro (v1.0)
# Ejecutar en el VPS: bash scripts/deploy.sh
# ============================================================

set -e  # Detener en cualquier error

echo ""
echo "========================================"
echo " LEGACYMARK DEPLOY - INICIANDO"
echo "========================================"

# 1. Obtener últimos cambios del repositorio
echo ""
echo "[1/6] Obteniendo cambios del repositorio..."
git pull origin main

# 2. Instalar dependencias (incluyendo nuevas)
echo ""
echo "[2/6] Instalando dependencias npm..."
npm install --legacy-peer-deps

# 3. Regenerar el cliente de Prisma
echo ""
echo "[3/6] Regenerando cliente de Prisma..."
npx prisma generate
npx prisma db push

# 4. Limpiar el build anterior
echo ""
echo "[4/6] Limpiando build anterior..."
rm -rf .next
rm -rf node_modules/.cache

# 5. Construir la aplicación Next.js
echo ""
echo "[5/6] Construyendo aplicacion (esto tarda ~5 minutos)..."
npm run build

# 6. Reiniciar PM2
echo ""
echo "[6/6] Reiniciando servidor con PM2..."
pm2 restart legacymark

echo ""
echo "========================================"
echo " DEPLOY COMPLETADO CON EXITO"
echo "========================================"
echo " El Agente de IA deberia estar visible"
echo " en la esquina inferior izquierda."
echo "========================================"
echo ""
pm2 status legacymark
