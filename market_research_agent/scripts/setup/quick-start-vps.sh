#!/bin/bash

###############################################################################
# QUICK START SETUP - VPS Configuration
# Ejecutar inmediatamente después de conectarse al VPS
# IP: 187.77.98.5
# Domain: legacymarksas.com
###############################################################################

set -e

echo "======================================"
echo "  LegacyMark VPS Quick Setup"
echo "  Domain: legacymarksas.com"
echo "======================================"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# 1. Cambiar contraseña de root
echo -e "${YELLOW}📝 Paso 1: Cambiar contraseña de root${NC}"
echo "Por seguridad, debes cambiar la contraseña root"
echo "Contraseña actual: Legacy2026@."
echo ""
read -p "¿Quieres cambiar la contraseña ahora? (s/n): " cambiar_pass
if [ "$cambiar_pass" = "s" ]; then
    passwd
fi

# 2. Actualizar sistema
echo ""
echo -e "${GREEN}📦 Paso 2: Actualizando sistema...${NC}"
apt update
apt upgrade -y

# 3. Instalar dependencias básicas
echo ""
echo -e "${GREEN}🔧 Paso 3: Instalando dependencias básicas...${NC}"
apt install -y curl wget git build-essential nginx certbot python3-certbot-nginx ufw

# 4. Instalar Node.js 20
echo ""
echo -e "${GREEN}📦 Paso 4: Instalando Node.js 20...${NC}"
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

echo ""
node --version
npm --version

# 5. Instalar PostgreSQL 15
echo ""
echo -e "${GREEN}🗄️  Paso 5: Instalando PostgreSQL 15...${NC}"
apt install -y postgresql postgresql-contrib

systemctl start postgresql
systemctl enable postgresql

# 6. Configurar PostgreSQL
echo ""
echo -e "${GREEN}🔐 Paso 6: Configurando base de datos...${NC}"
RANDOM_PASSWORD=$(openssl rand -base64 16 | tr -d "=+/" | cut -c1-20)

sudo -u postgres psql << EOF
CREATE DATABASE legacymark;
CREATE USER legacyuser WITH ENCRYPTED PASSWORD '${RANDOM_PASSWORD}';
ALTER USER legacyuser WITH SUPERUSER;
GRANT ALL PRIVILEGES ON DATABASE legacymark TO legacyuser;
\q
EOF

echo -e "${YELLOW}🔐 Guarda estos datos:${NC}"
echo "Database: legacymark"
echo "User: legacyuser"
echo "Password: ${RANDOM_PASSWORD}"
echo ""
echo "Guardando en /root/.db_credentials"
cat > /root/.db_credentials << EOF
DATABASE_URL="postgresql://legacyuser:${RANDOM_PASSWORD}@localhost:5432/legacymark"
DB_PASSWORD="${RANDOM_PASSWORD}"
EOF

# 7. Instalar PM2
echo ""
echo -e "${GREEN}⚡ Paso 7: Instalando PM2...${NC}"
npm install -g pm2

# 8. Instalar Redis
echo ""
echo -e "${GREEN}🔴 Paso 8: Instalando Redis...${NC}"
apt install -y redis-server
systemctl enable redis-server
systemctl start redis-server

# Configurar Redis
sed -i 's/^supervised no/supervised systemd/' /etc/redis/redis.conf
sed -i 's/^# maxmemory <bytes>/maxmemory 2gb/' /etc/redis/redis.conf
sed -i 's/^# maxmemory-policy noeviction/maxmemory-policy allkeys-lru/' /etc/redis/redis.conf
systemctl restart redis-server

# 9. Configurar Firewall
echo ""
echo -e "${GREEN}🔒 Paso 9: Configurando firewall...${NC}"
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw --force enable

# 10. Crear usuario para aplicación
echo ""
echo -e "${GREEN}👤 Paso 10: Creando usuario appuser...${NC}"
if ! id -u appuser > /dev/null 2>&1; then
    useradd -m -s /bin/bash appuser
    usermod -aG sudo appuser
fi

# 11. Crear directorios
mkdir -p /var/www/legacymark
mkdir -p /var/log/pm2
chown -R appuser:appuser /var/www/legacymark
chown -R appuser:appuser /var/log/pm2

# 12. Optimizar kernel
echo ""
echo -e "${GREEN}⚙️  Paso 11: Optimizando sistema...${NC}"
cat >> /etc/sysctl.conf << 'SYSCTL'

# Network optimizations for KVM 4
net.core.somaxconn = 65535
net.ipv4.tcp_max_syn_backlog = 8192
net.ipv4.tcp_slow_start_after_idle = 0
net.ipv4.tcp_tw_reuse = 1

# File descriptor limits
fs.file-max = 2097152

# Optimize for SSD
vm.dirty_ratio = 10
vm.dirty_background_ratio = 5
SYSCTL

sysctl -p

# 13. Configurar swap
echo ""
echo -e "${GREEN}💾 Paso 12: Configurando swap (8GB)...${NC}"
if [ ! -f /swapfile ]; then
    fallocate -l 8G /swapfile
    chmod 600 /swapfile
    mkswap /swapfile
    swapon /swapfile
    echo '/swapfile none swap sw 0 0' >> /etc/fstab
    
    # Optimizar swap
    sysctl vm.swappiness=10
    sysctl vm.vfs_cache_pressure=50
    
    cat >> /etc/sysctl.conf << 'SWAP'
vm.swappiness=10
vm.vfs_cache_pressure=50
SWAP
fi

echo ""
echo -e "${GREEN}✅ Setup inicial completado!${NC}"
echo ""
echo -e "${YELLOW}======================================"
echo "  RESUMEN"
echo "======================================${NC}"
echo ""
echo "✅ Sistema actualizado"
echo "✅ Node.js $(node --version) instalado"
echo "✅ PostgreSQL instalado y configurado"
echo "✅ Redis instalado"
echo "✅ PM2 instalado"
echo "✅ Nginx instalado"
echo "✅ Firewall configurado"
echo "✅ Usuario appuser creado"
echo "✅ Swap 8GB configurado"
echo ""
echo -e "${YELLOW}📋 Credenciales de DB guardadas en:${NC}"
echo "   /root/.db_credentials"
echo ""
echo -e "${YELLOW}📋 Próximos pasos:${NC}"
echo "1. Subir código del proyecto"
echo "2. Configurar DNS: legacymarksas.com → 187.77.98.5"
echo "3. Configurar Nginx"
echo "4. Obtener SSL con certbot"
echo "5. Deploy de la aplicación"
echo ""
echo -e "${GREEN}¿Listo para continuar? 🚀${NC}"
