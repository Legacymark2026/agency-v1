#!/bin/bash

###############################################################################
# Monitoring Setup - Production Grade
# Instala y configura herramientas de monitoreo
###############################################################################

set -e

echo "📊 Configurando sistema de monitoreo..."

# 1. Instalar herramientas de monitoreo
echo "📦 Instalando herramientas..."
sudo apt install -y htop iotop nethogs ncdu sysstat

# 2. Configurar sysstat (para sar reports)
sudo systemctl enable sysstat
sudo systemctl start sysstat

# 3. Crear scripts de monitoreo personalizados
echo "🔧 Creando scripts de monitoreo..."

# Script de monitoreo de recursos
cat > /usr/local/bin/monitor-resources << 'EOF'
#!/bin/bash
# Resource Monitoring Script

echo "========================================="
echo "  System Resource Monitor"
echo "  $(date)"
echo "========================================="
echo ""

# CPU Usage
echo "🖥️  CPU Usage:"
top -bn1 | grep "Cpu(s)" | sed "s/.*, *\([0-9.]*\)%* id.*/\1/" | awk '{print "   Usage: " 100 - $1"%"}'
echo ""

# Memory Usage
echo "💾 Memory Usage:"
free -h | awk 'NR==2{printf "   Used: %s / %s (%.2f%%)\n", $3,$2,$3*100/$2 }'
echo ""

# Disk Usage
echo "💿 Disk Usage:"
df -h | grep '^/dev/' | awk '{printf "   %s: %s / %s (%s)\n", $1,$3,$2,$5}'
echo ""

# Network Stats
echo "🌐 Network Connections:"
ss -s | grep TCP | head -1
echo ""

# PM2 Status
if command -v pm2 &> /dev/null; then
    echo "⚡ PM2 Applications:"
    pm2 jlist | jq -r '.[] | "   \(.name): \(.pm2_env.status) - CPU: \(.monit.cpu)% - Memory: \(.monit.memory / 1024 / 1024 | floor)MB"' 2>/dev/null || pm2 status
    echo ""
fi

# PostgreSQL Connections
echo "🗄️  PostgreSQL:"
sudo -u postgres psql -t -c "SELECT count(*) FROM pg_stat_activity WHERE state = 'active';" 2>/dev/null | awk '{printf "   Active connections: %s\n", $1}'
echo ""

# Recent errors in logs
echo "⚠️  Recent Errors (last 10 minutes):"
sudo journalctl --since "10 minutes ago" -p err --no-pager | tail -5 || echo "   No recent errors"
echo ""
echo "========================================="
EOF

chmod +x /usr/local/bin/monitor-resources

# Script de alerta por email
cat > /usr/local/bin/check-alerts << 'EOF'
#!/bin/bash
# Alert Check Script

ALERT_EMAIL="admin@yourdomain.com"
HOSTNAME=$(hostname)

# Check CPU
CPU_USAGE=$(top -bn1 | grep "Cpu(s)" | sed "s/.*, *\([0-9.]*\)%* id.*/\1/" | awk '{print 100 - $1}')
if (( $(echo "$CPU_USAGE > 90" | bc -l) )); then
    echo "High CPU usage: ${CPU_USAGE}% on ${HOSTNAME}" | mail -s "Alert: High CPU" $ALERT_EMAIL
fi

# Check Memory
MEM_USAGE=$(free | grep Mem | awk '{print ($3/$2) * 100.0}')
if (( $(echo "$MEM_USAGE > 90" | bc -l) )); then
    echo "High memory usage: ${MEM_USAGE}% on ${HOSTNAME}" | mail -s "Alert: High Memory" $ALERT_EMAIL
fi

# Check Disk
DISK_USAGE=$(df -h / | tail -1 | awk '{print $5}' | sed 's/%//')
if [ "$DISK_USAGE" -gt 85 ]; then
    echo "High disk usage: ${DISK_USAGE}% on ${HOSTNAME}" | mail -s "Alert: High Disk" $ALERT_EMAIL
fi
EOF

chmod +x /usr/local/bin/check-alerts

# 4. Configurar cron jobs para monitoreo
echo "⏰ Configurando cron jobs..."

# Ejecutar check-alerts cada 5 minutos
(crontab -l 2>/dev/null; echo "*/5 * * * * /usr/local/bin/check-alerts") | crontab -

# Generar reporte diario de recursos
(crontab -l 2>/dev/null; echo "0 0 * * * /usr/local/bin/monitor-resources > /var/log/daily-report-\$(date +\%Y\%m\%d).log") | crontab -

# 5. Configurar logrotate para logs de PM2
cat > /etc/logrotate.d/pm2 << 'EOF'
/var/log/pm2/*.log {
    daily
    rotate 7
    compress
    delaycompress
    missingok
    notifempty
    create 0640 appuser appuser
    sharedscripts
    postrotate
        pm2 reloadLogs
    endscript
}
EOF

echo ""
echo "✅ Sistema de monitoreo configurado!"
echo ""
echo "📋 Comandos disponibles:"
echo "   monitor-resources     - Ver estado actual del sistema"
echo "   check-alerts          - Verificar alertas manualmente"
echo "   htop                  - Monitor interactivo de procesos"
echo "   pm2 monit             - Monitor de aplicaciones PM2"
echo ""
echo "📊 Reportes automáticos:"
echo "   /var/log/daily-report-YYYYMMDD.log - Reportes diarios"
echo ""
echo "⚠️  Alertas configuradas para:"
echo "   - CPU > 90%"
echo "   - Memoria > 90%"
echo "   - Disco > 85%"
