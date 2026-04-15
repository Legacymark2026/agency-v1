#!/bin/bash

###############################################################################
# Swap Configuration - KVM 4 (16 GB RAM)
# Configura 8GB de swap optimizado para SSD
###############################################################################

set -e

echo "💾 Configurando swap optimizado..."

# Check if swap already exists
if [ $(swapon --show | wc -l) -gt 0 ]; then
    echo "⚠️  Swap ya existe. Desactivando swap actual..."
    sudo swapoff -a
fi

# Create 8GB swap file (50% of RAM)
SWAP_SIZE=8G
SWAP_FILE=/swapfile

echo "📝 Creando archivo swap de ${SWAP_SIZE}..."
sudo fallocate -l $SWAP_SIZE $SWAP_FILE
sudo chmod 600 $SWAP_FILE
sudo mkswap $SWAP_FILE
sudo swapon $SWAP_FILE

# Make swap permanent
if ! grep -q "$SWAP_FILE" /etc/fstab; then
    echo "$SWAP_FILE none swap sw 0 0" | sudo tee -a /etc/fstab
fi

# Optimize swap settings for SSD + high RAM
echo "🔧 Optimizando parámetros de swap..."

# vm.swappiness: How aggressive to use swap (0-100)
# 10 = only use swap when RAM is really full (good for 16GB RAM)
sudo sysctl vm.swappiness=10

# vm.vfs_cache_pressure: Preference for caching inode/dentry vs page cache
# 50 = balanced (default 100)
sudo sysctl vm.vfs_cache_pressure=50

# Make settings permanent
cat << EOF | sudo tee -a /etc/sysctl.conf
# Swap optimization for KVM 4 (16GB RAM + SSD)
vm.swappiness=10
vm.vfs_cache_pressure=50
EOF

echo ""
echo "✅ Swap configurado exitosamente!"
echo ""
echo "📊 Estado actual:"
sudo swapon --show
echo ""
free -h
echo ""
echo "🔍 Verificar configuración:"
echo "   swapon --show"
echo "   cat /proc/sys/vm/swappiness"
