#!/bin/bash
# Cron script para el Reporte Diario del Agente Cognitivo LegacyMark
# Agregar a crontab: 0 8 * * 1-5 /var/www/legacymark/scripts/cron-daily-report.sh
# (Ejecuta de lunes a viernes a las 8:00 AM)

CRON_SECRET="${CRON_SECRET:-legacymark-cron-2025}"
API_URL="https://legacymark.com/api/agent/daily-report"

echo "[$(date)] Iniciando reporte diario..."

RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" \
  -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $CRON_SECRET")

if [ "$RESPONSE" = "200" ]; then
  echo "[$(date)] Reporte enviado exitosamente (HTTP 200)"
else
  echo "[$(date)] ERROR: El reporte falló (HTTP $RESPONSE)"
fi
