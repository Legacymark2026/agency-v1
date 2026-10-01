#!/usr/bin/env bash
# ══════════════════════════════════════════════════════════════════════════════
# LegacyMark — Server Initial Setup
# ══════════════════════════════════════════════════════════════════════════════
# Run once on a fresh Ubuntu 24.04 VPS BEFORE deploying.
# Usage: bash scripts/server-setup.sh
# ══════════════════════════════════════════════════════════════════════════════
set -euo pipefail

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m'

# 1. Verify root
if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}Please run as root (use sudo)${NC}"
    exit 1
fi

# 2. Verify RAM and Disk
TOTAL_RAM=$(free -m | awk '/^Mem:/{print $2}')
if [ "$TOTAL_RAM" -lt 7000 ]; then
    echo -e "${YELLOW}Warning: Less than 8GB RAM detected ($TOTAL_RAM MB). Recommended 8GB.${NC}"
fi

TOTAL_DISK=$(df -m / | awk 'NR==2 {print $2}')
if [ "$TOTAL_DISK" -lt 45000 ]; then
    echo -e "${YELLOW}Warning: Less than 50GB disk detected ($TOTAL_DISK MB). Recommended 50GB.${NC}"
fi

# 3. Install Docker
echo -e "${GREEN}Installing Docker...${NC}"
if ! command -v docker &> /dev/null; then
    apt-get update
    apt-get install -y ca-certificates curl gnupg
    install -m 0755 -d /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    chmod a+r /etc/apt/keyrings/docker.gpg
    echo "deb [arch="$(dpkg --print-architecture)" signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu "$(. /etc/os-release && echo "$VERSION_CODENAME")" stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
    apt-get update
    apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
else
    echo "Docker is already installed."
fi

# 4. Install Node.js 20 via nvm
echo -e "${GREEN}Installing Node.js...${NC}"
if ! command -v nvm &> /dev/null; then
    export NVM_DIR="$HOME/.nvm"
    if [ ! -s "$NVM_DIR/nvm.sh" ]; then
        curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
    fi
    [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
    nvm install 20
    nvm use 20
else
    echo "nvm already installed."
fi

# 5. Configure Swap
echo -e "${GREEN}Configuring Swap...${NC}"
if ! swapon --show | grep -q "/swapfile"; then
    fallocate -l 4G /swapfile
    chmod 600 /swapfile
    mkswap /swapfile
    swapon /swapfile
    if ! grep -q "/swapfile none swap sw 0 0" /etc/fstab; then
        echo '/swapfile none swap sw 0 0' >> /etc/fstab
    fi
    echo "Swap created."
else
    echo "Swap already exists."
fi

# 6. Configure system limits
echo -e "${GREEN}Configuring System Limits...${NC}"
if ! grep -q "vm.max_map_count=262144" /etc/sysctl.conf; then
    echo "vm.max_map_count=262144" >> /etc/sysctl.conf
fi
if ! grep -q "net.core.somaxconn=65535" /etc/sysctl.conf; then
    echo "net.core.somaxconn=65535" >> /etc/sysctl.conf
fi
sysctl -p || true

# 7. Create Directories
echo -e "${GREEN}Creating directories...${NC}"
mkdir -p /var/backups/legacymark
mkdir -p /var/log/legacymark/
chmod 700 /var/backups/legacymark

# 8. Configure logrotate
echo -e "${GREEN}Configuring logrotate...${NC}"
cat << 'EOF' > /etc/logrotate.d/legacymark
/var/log/legacymark/*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 root root
}
EOF

# 9. Configure cron job
echo -e "${GREEN}Configuring cron job...${NC}"
CRON_CMD="0 3 * * * /bin/bash /root/agency-v1/agency-v1/scripts/backup-database.sh >> /var/log/legacymark-backup.log 2>&1"
if ! (crontab -l 2>/dev/null | grep -q "backup-database.sh"); then
    (crontab -l 2>/dev/null || true; echo "$CRON_CMD") | crontab -
fi

# 10. Create .env
if [ ! -f .env ]; then
    touch .env
    echo -e "${GREEN}Created empty .env file.${NC}"
fi

echo -e "${GREEN}Setup complete!${NC}"
echo -e "${YELLOW}Next steps:${NC}"
echo -e "1. Clone the repository into ~/agency-v1/agency-v1"
echo -e "2. Run: bash scripts/generate-production-secrets.sh"
echo -e "3. Fill in .env with your specific settings"
echo -e "4. Run: make up"
