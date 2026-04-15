#!/bin/bash
###############################################################################
# COMPLETE VPS SETUP - LegacyMark
# Ejecuta TODA la configuración en un solo comando
###############################################################################

set -e

echo "🚀 Iniciando setup completo del VPS..."
echo ""

# 1. Configurar Firewall
echo "🔒 Configurando firewall..."
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw --force enable

# 2. Instalar PM2
echo "⚡ Instalando PM2..."
npm install -g pm2

# 3. Crear directorios
echo "📁 Creando directorios..."
mkdir -p /var/www/legacymark
mkdir -p /var/log/pm2

# 4. Configurar Swap (8GB)
echo "💾 Configurando swap..."
if [ ! -f /swapfile ]; then
    fallocate -l 8G /swapfile
    chmod 600 /swapfile
    mkswap /swapfile
    swapon /swapfile
    echo '/swapfile none swap sw 0 0' >> /etc/fstab
    sysctl vm.swappiness=10
    sysctl vm.vfs_cache_pressure=50
fi

# 5. Configurar Redis
echo "🔴 Configurando Redis..."
sed -i 's/^supervised no/supervised systemd/' /etc/redis/redis.conf
sed -i 's/^# maxmemory <bytes>/maxmemory 2gb/' /etc/redis/redis.conf
sed -i 's/^# maxmemory-policy noeviction/maxmemory-policy allkeys-lru/' /etc/redis/redis.conf
systemctl restart redis-server

# 6. Optimizar PostgreSQL para 16GB RAM
echo "🗄️  Optimizando PostgreSQL..."
cat >> /etc/postgresql/*/main/postgresql.conf << 'PGCONF'

# Optimizations for 16GB RAM
shared_buffers = 4GB
effective_cache_size = 12GB
maintenance_work_mem = 1GB
work_mem = 16MB
max_connections = 200
PGCONF

systemctl restart postgresql

# 7. Configurar Nginx básico
echo "🌐 Configurando Nginx..."
cat > /etc/nginx/sites-available/legacymark << 'NGINX'
server {
    listen 80;
    server_name legacymarksas.com www.legacymarksas.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
NGINX

ln -sf /etc/nginx/sites-available/legacymark /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl reload nginx

# 8. Habilitar SSH con password (temporal)
echo "🔐 Habilitando SSH con password..."
sed -i 's/^#*PasswordAuthentication.*/PasswordAuthentication yes/' /etc/ssh/sshd_config
sed -i 's/^#*PermitRootLogin.*/PermitRootLogin yes/' /etc/ssh/sshd_config
systemctl restart sshd

echo ""
echo "✅ =========================================="
echo "   SETUP COMPLETADO"
echo "=========================================="
echo ""
echo "✅ Firewall configurado"
echo "✅ PM2 instalado"
echo "✅ Swap 8GB configurado"
echo "✅ Redis optimizado"
echo "✅ PostgreSQL optimizado"
echo "✅ Nginx configurado"
echo "✅ SSH habilitado con password"
echo ""
echo "📋 Credenciales de DB:"
cat /root/.db_credentials
echo ""
echo "🔑 Ahora puedes conectarte desde tu PC local:"
echo "   ssh root@187.77.98.5"
echo ""
echo "📂 Directorio del proyecto: /var/www/legacymark"
echo ""
echo "🎯 Próximo paso: Subir el código y hacer deploy"
