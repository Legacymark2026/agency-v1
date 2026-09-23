#!/usr/bin/env bash
# ══════════════════════════════════════════════════════════════════════════════
# LegacyMark — Hostinger KVM 4 (4 Cores / 16 GB RAM / 200 GB SSD) VPS Tuning
# ══════════════════════════════════════════════════════════════════════════════
# Este script optimiza el kernel de Ubuntu 24.04, el subsistema de memoria,
# descriptores de archivo y activa compresión en memoria (zram) para evitar OOM
# y exprimir el máximo rendimiento físico de los 16 GB de RAM y 4 vCPUs.
# ══════════════════════════════════════════════════════════════════════════════

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}══════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  Optimizando Host Físico: Hostinger KVM 4 (4 Cores / 16 GB)  ${NC}"
echo -e "${BLUE}══════════════════════════════════════════════════════════════${NC}"

if [ "$(id -u)" -ne 0 ]; then
  echo -e "${RED}❌ Este script debe ejecutarse como root.${NC}"
  exit 1
fi

# 1. Configurar y persistir Sysctl
echo -e "\n${YELLOW}[1/5] Configurando parámetros del kernel (Sysctl)...${NC}"
cat << 'EOF' > /etc/sysctl.d/99-legacymark-kvm4.conf
# Optimización de Memoria para 16 GB RAM en Microservicios
vm.swappiness = 10
vm.vfs_cache_pressure = 50
vm.overcommit_memory = 1
vm.dirty_background_ratio = 5
vm.dirty_ratio = 10

# Optimización de Conexiones de Red y Sockets
net.core.somaxconn = 65535
net.core.netdev_max_backlog = 10000
net.ipv4.tcp_max_syn_backlog = 8192
net.ipv4.ip_local_port_range = 1024 65535
net.ipv4.tcp_tw_reuse = 1
net.ipv4.tcp_fin_timeout = 15

# Límites de Descriptores de Archivos e inotify
fs.file-max = 2097152
fs.inotify.max_user_watches = 524288
fs.inotify.max_user_instances = 1024
EOF

sysctl --system > /dev/null
echo -e "${GREEN}✔ Parámetros del kernel aplicados y persistidos en /etc/sysctl.d/99-legacymark-kvm4.conf${NC}"

# 2. Descriptores de Archivos (limits.conf)
echo -e "\n${YELLOW}[2/5] Optimizando límites de descriptores de archivos...${NC}"
cat << 'EOF' > /etc/security/limits.d/99-legacymark.conf
* soft nofile 65535
* hard nofile 65535
root soft nofile 65535
root hard nofile 65535
EOF
echo -e "${GREEN}✔ Límites de procesos y descriptores aumentados a 65535.${NC}"

# 3. Configurar zram (Compresión ultrarrápida de memoria en RAM)
echo -e "\n${YELLOW}[3/5] Configurando ZRAM (Compresión en RAM para evitar OOM)...${NC}"
apt-get update -qq
apt-get install -y -qq zram-tools > /dev/null

cat << 'EOF' > /etc/default/zramswap
# Asignar 25% de la RAM (4 GB) como swap comprimido en RAM con zstd
ALGO=zstd
PERCENT=25
PRIORITY=100
EOF

systemctl restart zramswap || service zramswap restart || true
echo -e "${GREEN}✔ ZRAM activado con compresión zstd (4 GB extra de memoria efectiva).${NC}"

# 4. Optimizar Docker Daemon (Live-restore y límites)
echo -e "\n${YELLOW}[4/5] Ajustando daemon de Docker (/etc/docker/daemon.json)...${NC}"
mkdir -p /etc/docker

if [ -f /etc/docker/daemon.json ]; then
  # Si ya existe, hacer backup
  cp /etc/docker/daemon.json /etc/docker/daemon.json.bak
fi

cat << 'EOF' > /etc/docker/daemon.json
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  },
  "default-ulimits": {
    "nofile": {
      "Name": "nofile",
      "Hard": 65535,
      "Soft": 65535
    }
  },
  "live-restore": true
}
EOF

systemctl reload docker || systemctl restart docker || true
echo -e "${GREEN}✔ Docker daemon optimizado con live-restore y límites ampliados.${NC}"

# 5. Verificación de estado
echo -e "\n${YELLOW}[5/5] Verificando estado del servidor...${NC}"
echo -e "Memoria física disponible:"
free -h
echo -e "\nEstado de zram:"
zramctl 2>/dev/null || swapon --show

echo -e "\n${GREEN}══════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  ¡Tuning del host completado con éxito!                     ${NC}"
echo -e "${GREEN}  El servidor KVM 4 ahora aprovecha al 100% sus 16 GB y 4 CPU  ${NC}"
echo -e "${GREEN}══════════════════════════════════════════════════════════════${NC}"
