#!/bin/bash

# Colores para output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${BLUE}🔍 VERIFICACIÓN COMPLETA DE CONFIGURACIÓN VPS${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Contador de errores
ERRORS=0
WARNINGS=0

# Función helpers
check_pass() {
    echo -e "${GREEN}✓${NC} $1"
}

check_fail() {
    echo -e "${RED}✗${NC} $1"
    ((ERRORS++))
}

check_warn() {
    echo -e "${YELLOW}⚠${NC} $1"
    ((WARNINGS++))
}

check_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

# ═══════════════════════════════════════════════════════
# 1. SISTEMA OPERATIVO Y RECURSOS
# ═══════════════════════════════════════════════════════
echo -e "\n${BLUE}[1/10] Sistema Operativo y Recursos${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# OS
OS_INFO=$(lsb_release -d | cut -f2)
check_info "OS: $OS_INFO"

# CPU
CPU_CORES=$(nproc)
if [ "$CPU_CORES" -ge 4 ]; then
    check_pass "CPU: $CPU_CORES cores (OK para KVM 4)"
else
    check_warn "CPU: $CPU_CORES cores (esperados: 4)"
fi

# RAM
RAM_TOTAL=$(free -h | awk '/^Mem:/ {print $2}')
RAM_GB=$(free -g | awk '/^Mem:/ {print $2}')
if [ "$RAM_GB" -ge 15 ]; then
    check_pass "RAM: $RAM_TOTAL (16GB confirmados)"
else
    check_warn "RAM: $RAM_TOTAL (esperados: 16GB)"
fi

# Disco
DISK_TOTAL=$(df -h / | awk 'NR==2 {print $2}')
DISK_USED=$(df -h / | awk 'NR==2 {print $5}')
check_info "Disco: $DISK_TOTAL total, usado: $DISK_USED"

# ═══════════════════════════════════════════════════════
# 2. NODE.JS Y NPM
# ═══════════════════════════════════════════════════════
echo -e "\n${BLUE}[2/10] Node.js y NPM${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v)
    if [[ "$NODE_VERSION" == v20* ]]; then
        check_pass "Node.js: $NODE_VERSION (v20.x ✓)"
    else
        check_warn "Node.js: $NODE_VERSION (recomendado: v20.x)"
    fi
else
    check_fail "Node.js NO instalado"
fi

if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm -v)
    check_pass "NPM: v$NPM_VERSION"
else
    check_fail "NPM NO instalado"
fi

# ═══════════════════════════════════════════════════════
# 3. PM2
# ═══════════════════════════════════════════════════════
echo -e "\n${BLUE}[3/10] PM2 Process Manager${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if command -v pm2 &> /dev/null; then
    PM2_VERSION=$(pm2 -v)
    check_pass "PM2 instalado: v$PM2_VERSION"
    
    # Verificar PM2 startup
    if systemctl list-unit-files | grep -q "pm2-root.service"; then
        check_pass "PM2 startup configurado"
    else
        check_warn "PM2 startup NO configurado (ejecutar: pm2 startup)"
    fi
else
    check_fail "PM2 NO instalado"
fi

# ═══════════════════════════════════════════════════════
# 4. POSTGRESQL
# ═══════════════════════════════════════════════════════
echo -e "\n${BLUE}[4/10] PostgreSQL${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if command -v psql &> /dev/null; then
    PG_VERSION=$(psql --version | grep -oP '\d+\.\d+' | head -1)
    check_pass "PostgreSQL instalado: v$PG_VERSION"
    
    # Verificar servicio
    if systemctl is-active --quiet postgresql; then
        check_pass "PostgreSQL servicio: ACTIVO"
    else
        check_fail "PostgreSQL servicio: INACTIVO"
    fi
    
    # Verificar base de datos
    if sudo -u postgres psql -lqt | cut -d \| -f 1 | grep -qw legacymark; then
        check_pass "Base de datos 'legacymark' existe"
    else
        check_warn "Base de datos 'legacymark' NO encontrada"
    fi
    
    # Verificar usuario
    if sudo -u postgres psql -tAc "SELECT 1 FROM pg_roles WHERE rolname='legacyuser'" | grep -q 1; then
        check_pass "Usuario 'legacyuser' existe"
    else
        check_warn "Usuario 'legacyuser' NO encontrado"
    fi
    
    # Verificar credenciales guardadas
    if [ -f "/root/.db_credentials" ]; then
        check_pass "Credenciales guardadas en /root/.db_credentials"
        echo -e "${BLUE}    Contenido:${NC}"
        cat /root/.db_credentials | sed 's/^/    /'
    else
        check_warn "Archivo de credenciales NO encontrado"
    fi
else
    check_fail "PostgreSQL NO instalado"
fi

# ═══════════════════════════════════════════════════════
# 5. REDIS
# ═══════════════════════════════════════════════════════
echo -e "\n${BLUE}[5/10] Redis${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if command -v redis-cli &> /dev/null; then
    REDIS_VERSION=$(redis-cli --version | grep -oP '\d+\.\d+\.\d+' | head -1)
    check_pass "Redis instalado: v$REDIS_VERSION"
    
    # Verificar servicio
    if systemctl is-active --quiet redis-server || systemctl is-active --quiet redis; then
        check_pass "Redis servicio: ACTIVO"
        
        # Test conexión
        if redis-cli ping &> /dev/null; then
            check_pass "Redis responde a PING"
        else
            check_warn "Redis NO responde a PING"
        fi
    else
        check_fail "Redis servicio: INACTIVO"
    fi
    
    # Verificar configuración maxmemory
    MAXMEM=$(redis-cli config get maxmemory | tail -1)
    if [ "$MAXMEM" != "0" ]; then
        MAXMEM_GB=$(echo "scale=2; $MAXMEM/1024/1024/1024" | bc)
        check_pass "Redis maxmemory: ${MAXMEM_GB}GB configurado"
    else
        check_warn "Redis maxmemory: SIN LÍMITE (considera configurar)"
    fi
else
    check_fail "Redis NO instalado"
fi

# ═══════════════════════════════════════════════════════
# 6. NGINX
# ═══════════════════════════════════════════════════════
echo -e "\n${BLUE}[6/10] Nginx${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if command -v nginx &> /dev/null; then
    NGINX_VERSION=$(nginx -v 2>&1 | grep -oP '\d+\.\d+\.\d+')
    check_pass "Nginx instalado: v$NGINX_VERSION"
    
    # Verificar servicio
    if systemctl is-active --quiet nginx; then
        check_pass "Nginx servicio: ACTIVO"
    else
        check_fail "Nginx servicio: INACTIVO"
    fi
    
    # Verificar configuración
    if nginx -t &> /dev/null; then
        check_pass "Nginx configuración: VÁLIDA"
    else
        check_fail "Nginx configuración: ERRORES"
        nginx -t 2>&1 | sed 's/^/    /'
    fi
    
    # Verificar site legacymark
    if [ -f "/etc/nginx/sites-available/legacymark" ]; then
        check_pass "Sitio 'legacymark' configurado"
        
        if [ -L "/etc/nginx/sites-enabled/legacymark" ]; then
            check_pass "Sitio 'legacymark' habilitado"
        else
            check_warn "Sitio 'legacymark' NO habilitado"
        fi
    else
        check_warn "Sitio 'legacymark' NO encontrado"
    fi
    
    # Verificar puerto 80
    if netstat -tuln | grep -q ":80 "; then
        check_pass "Nginx escuchando en puerto 80"
    else
        check_warn "Nginx NO escuchando en puerto 80"
    fi
else
    check_fail "Nginx NO instalado"
fi

# ═══════════════════════════════════════════════════════
# 7. FIREWALL (UFW)
# ═══════════════════════════════════════════════════════
echo -e "\n${BLUE}[7/10] Firewall (UFW)${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if command -v ufw &> /dev/null; then
    UFW_STATUS=$(ufw status | head -1)
    
    if echo "$UFW_STATUS" | grep -q "active"; then
        check_pass "UFW: ACTIVO"
        
        # Verificar reglas
        if ufw status | grep -q "OpenSSH"; then
            check_pass "Regla: OpenSSH ALLOW"
        else
            check_warn "Regla: OpenSSH NO configurada"
        fi
        
        if ufw status | grep -q "Nginx Full"; then
            check_pass "Regla: Nginx Full ALLOW"
        else
            check_warn "Regla: Nginx Full NO configurada"
        fi
    else
        check_warn "UFW: INACTIVO"
    fi
else
    check_warn "UFW NO instalado"
fi

# ═══════════════════════════════════════════════════════
# 8. SWAP
# ═══════════════════════════════════════════════════════
echo -e "\n${BLUE}[8/10] Swap${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

SWAP_TOTAL=$(free -h | awk '/^Swap:/ {print $2}')
SWAP_USED=$(free -h | awk '/^Swap:/ {print $3}')

if [ "$SWAP_TOTAL" != "0B" ]; then
    check_pass "Swap configurado: $SWAP_TOTAL total, usado: $SWAP_USED"
    
    # Verificar swappiness
    SWAPPINESS=$(cat /proc/sys/vm/swappiness)
    if [ "$SWAPPINESS" -le 10 ]; then
        check_pass "Swappiness: $SWAPPINESS (optimizado para SSD)"
    else
        check_warn "Swappiness: $SWAPPINESS (recomendado: 10)"
    fi
    
    # Verificar en fstab
    if grep -q "/swapfile" /etc/fstab; then
        check_pass "Swap persistente en /etc/fstab"
    else
        check_warn "Swap NO persistente (no está en fstab)"
    fi
else
    check_warn "Swap NO configurado"
fi

# ═══════════════════════════════════════════════════════
# 9. DIRECTORIOS Y PERMISOS
# ═══════════════════════════════════════════════════════
echo -e "\n${BLUE}[9/10] Directorios y Permisos${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Directorio aplicación
if [ -d "/var/www/legacymark" ]; then
    check_pass "Directorio /var/www/legacymark existe"
    DIR_SIZE=$(du -sh /var/www/legacymark 2>/dev/null | cut -f1)
    check_info "Tamaño: $DIR_SIZE"
else
    check_warn "Directorio /var/www/legacymark NO existe"
fi

# Directorio logs PM2
if [ -d "/var/log/pm2" ]; then
    check_pass "Directorio /var/log/pm2 existe"
else
    check_warn "Directorio /var/log/pm2 NO existe"
fi

# ═══════════════════════════════════════════════════════
# 10. CERTIFICADOS SSL (Certbot)
# ═══════════════════════════════════════════════════════
echo -e "\n${BLUE}[10/10] Certbot y SSL${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if command -v certbot &> /dev/null; then
    CERTBOT_VERSION=$(certbot --version 2>&1 | grep -oP '\d+\.\d+\.\d+' | head -1)
    check_pass "Certbot instalado: v$CERTBOT_VERSION"
    
    # Verificar certificados existentes
    if [ -d "/etc/letsencrypt/live" ]; then
        CERT_COUNT=$(ls -1 /etc/letsencrypt/live 2>/dev/null | wc -l)
        if [ "$CERT_COUNT" -gt 0 ]; then
            check_pass "Certificados SSL: $CERT_COUNT dominio(s)"
            ls -1 /etc/letsencrypt/live | sed 's/^/    - /'
        else
            check_info "Sin certificados SSL"
        fi
    fi
else
    check_warn "Certbot NO instalado"
fi

# ═══════════════════════════════════════════════════════
# RESUMEN FINAL
# ═══════════════════════════════════════════════════════
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${BLUE}📊 RESUMEN DE VERIFICACIÓN${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}✓ PERFECTO!${NC} Configuración completamente correcta"
elif [ $ERRORS -eq 0 ]; then
    echo -e "${YELLOW}⚠ BUENO${NC} con $WARNINGS advertencia(s) menor(es)"
else
    echo -e "${RED}✗ ATENCIÓN${NC}: $ERRORS error(es) encontrado(s)"
    [ $WARNINGS -gt 0 ] && echo -e "  También hay $WARNINGS advertencia(s)"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${BLUE}📝 PRÓXIMOS PASOS RECOMENDADOS:${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Verificar si falta algo crítico
NEEDS_DEPLOY=false

if [ ! -d "/var/www/legacymark/.git" ]; then
    echo "1. Clonar código de la aplicación:"
    echo "   cd /var/www/legacymark && git clone <TU-REPO> ."
    NEEDS_DEPLOY=true
fi

if [ ! -f "/var/www/legacymark/.env.production" ]; then
    echo "2. Configurar variables de entorno:"
    echo "   cp /var/www/legacymark/.env.production.example /var/www/legacymark/.env.production"
    echo "   nano /var/www/legacymark/.env.production"
    NEEDS_DEPLOY=true
fi

if ! pm2 list | grep -q "legacymark"; then
    echo "3. Deploy con PM2:"
    echo "   cd /var/www/legacymark"
    echo "   npm install && npm run build"
    echo "   pm2 start ecosystem.config.json"
    echo "   pm2 save && pm2 startup"
    NEEDS_DEPLOY=true
fi

if [ ! -d "/etc/letsencrypt/live/legacymarksas.com" ]; then
    echo "4. Obtener certificado SSL:"
    echo "   certbot --nginx -d legacymarksas.com -d www.legacymarksas.com"
fi

if [ "$NEEDS_DEPLOY" = false ]; then
    echo -e "${GREEN}✓ Sistema listo para producción!${NC}"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
