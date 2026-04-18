#!/bin/bash

###############################################################################
# Deploy Script - Producción
# Ejecutar desde el directorio del proyecto
###############################################################################

set -e

echo "🚀 Iniciando deployment..."

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# 1. Pull latest changes
echo -e "${GREEN}📥 Pulling latest changes...${NC}"
git pull origin main

# 2. Instalar dependencias
echo -e "${GREEN}📦 Instalando dependencias...${NC}"
npm ci --production=false

# 3. Generar Prisma Client
echo -e "${GREEN}🔄 Generando Prisma Client...${NC}"
npx prisma generate

# 4. Ejecutar migraciones
echo -e "${GREEN}🗄️  Ejecutando migraciones...${NC}"
npx prisma migrate deploy

# 5. Build aplicación
echo -e "${GREEN}🔨 Building aplicación...${NC}"
npm run build

# 6. Reiniciar PM2
echo -e "${GREEN}⚡ Reiniciando aplicación con PM2...${NC}"
if pm2 list | grep -q "legacymark"; then
    pm2 reload legacymark
else
    pm2 start npm --name "legacymark" -- start
    pm2 save
    pm2 startup
fi

# 7. Reiniciar Nginx
echo -e "${GREEN}🔄 Reiniciando Nginx...${NC}"
sudo systemctl reload nginx

echo -e "${GREEN}✅ Deployment completado!${NC}"
echo ""
echo -e "${YELLOW}📊 Estado de la aplicación:${NC}"
pm2 status
echo ""
echo -e "${YELLOW}🌐 Aplicación disponible en:${NC}"
echo "https://tudominio.com"
