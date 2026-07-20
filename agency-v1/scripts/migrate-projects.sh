#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
# migrate-projects.sh
# Migra las tablas de proyectos desde la DB antigua al nuevo legacymark_media
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

# ── Configuración ─────────────────────────────────────────────────────────────
OLD_DB="postgresql://legacyuser:g%2Fd1b0VLZJQdTaoRdThivfuzqyT3%2BouU@187.77.195.9:5432/legacymark"
NEW_DB_HOST="localhost"
NEW_DB_USER="legacymark"
NEW_DB_NAME="legacymark_media"
DUMP_DIR="/tmp/migration_projects"

# ── Colores ───────────────────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}  🚀 Migración de Proyectos — LegacyMark               ${NC}"
echo -e "${BLUE}  Origen : 187.77.195.9 / legacymark                   ${NC}"
echo -e "${BLUE}  Destino: localhost / legacymark_media                 ${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# ── Crear directorio temporal ─────────────────────────────────────────────────
mkdir -p "$DUMP_DIR"
echo -e "${YELLOW}📁 Directorio temporal: $DUMP_DIR${NC}"
echo ""

# ── Paso 1: Verificar conexión a DB antigua ───────────────────────────────────
echo -e "${YELLOW}🔌 Verificando conexión a DB antigua...${NC}"
if psql "$OLD_DB" -c "SELECT 1;" > /dev/null 2>&1; then
  echo -e "${GREEN}✅ Conexión a DB antigua OK${NC}"
else
  echo -e "${RED}❌ Error: No se puede conectar a la DB antigua${NC}"
  exit 1
fi

# ── Paso 2: Verificar conexión a DB nueva ─────────────────────────────────────
echo -e "${YELLOW}🔌 Verificando conexión a DB nueva...${NC}"
if psql -U "$NEW_DB_USER" -d "$NEW_DB_NAME" -c "SELECT 1;" > /dev/null 2>&1; then
  echo -e "${GREEN}✅ Conexión a DB nueva OK${NC}"
else
  echo -e "${RED}❌ Error: No se puede conectar a la DB nueva${NC}"
  exit 1
fi
echo ""

# ── Paso 3: Conteos ANTES de la migración ─────────────────────────────────────
echo -e "${YELLOW}📊 Conteos ANTES de la migración:${NC}"
echo ""
echo -e "${BLUE}  [DB ANTIGUA]${NC}"
psql "$OLD_DB" -c "
SELECT
  'tbl_project_categories' AS tabla, COUNT(*) AS filas FROM tbl_project_categories
UNION ALL SELECT 'tbl_projects',       COUNT(*) FROM tbl_projects
UNION ALL SELECT 'tbl_project_tags',   COUNT(*) FROM tbl_project_tags
UNION ALL SELECT 'tbl_project_views',  COUNT(*) FROM tbl_project_views
UNION ALL SELECT 'tbl_project_health_logs', COUNT(*) FROM tbl_project_health_logs
ORDER BY tabla;
"

echo ""
echo -e "${BLUE}  [DB NUEVA]${NC}"
psql -U "$NEW_DB_USER" -d "$NEW_DB_NAME" -c "
SELECT
  'tbl_project_categories' AS tabla, COUNT(*) AS filas FROM tbl_project_categories
UNION ALL SELECT 'tbl_projects',       COUNT(*) FROM tbl_projects
UNION ALL SELECT 'tbl_project_tags',   COUNT(*) FROM tbl_project_tags
UNION ALL SELECT 'tbl_project_views',  COUNT(*) FROM tbl_project_views
UNION ALL SELECT 'tbl_project_health_logs', COUNT(*) FROM tbl_project_health_logs
ORDER BY tabla;
"
echo ""

# ── Función de migración ──────────────────────────────────────────────────────
migrate_table() {
  local TABLE="$1"
  local DUMP_FILE="$DUMP_DIR/${TABLE}.sql"

  echo -e "${YELLOW}📦 Migrando ${TABLE}...${NC}"

  # Dump con INSERT individuales desde la DB antigua
  pg_dump "$OLD_DB" \
    --data-only \
    --table="$TABLE" \
    --inserts \
    --no-comments \
    --no-acl \
    --no-owner \
    2>/dev/null > "$DUMP_FILE"

  # Verificar que el dump no está vacío
  if [ ! -s "$DUMP_FILE" ]; then
    echo -e "${YELLOW}  ⚠️  Tabla vacía, omitiendo.${NC}"
    return
  fi

  # Añadir ON CONFLICT DO NOTHING a cada INSERT para evitar duplicados
  sed -i 's/^\(INSERT INTO .*\);$/\1 ON CONFLICT DO NOTHING;/' "$DUMP_FILE"

  # Importar a la DB nueva
  psql -U "$NEW_DB_USER" -d "$NEW_DB_NAME" -q -f "$DUMP_FILE"

  # Contar filas migradas
  local COUNT
  COUNT=$(psql -U "$NEW_DB_USER" -d "$NEW_DB_NAME" -t -c "SELECT COUNT(*) FROM ${TABLE};" | tr -d ' ')
  echo -e "${GREEN}  ✅ ${TABLE} → ${COUNT} fila(s) en destino${NC}"
}

# ── Paso 4: Migrar tablas en orden (respetar FKs) ─────────────────────────────
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}  📤 Iniciando migración de tablas...                  ${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# 1. Primero categorías (tbl_projects tiene FK a tbl_project_categories)
migrate_table "tbl_project_categories"

# 2. Proyectos
migrate_table "tbl_projects"

# 3. Tags
migrate_table "tbl_project_tags"

# 4. Vistas
migrate_table "tbl_project_views"

# 5. Health logs
migrate_table "tbl_project_health_logs"

echo ""

# ── Paso 5: Conteos DESPUÉS de la migración ───────────────────────────────────
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}  📊 Conteos DESPUÉS de la migración (DB NUEVA):      ${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
psql -U "$NEW_DB_USER" -d "$NEW_DB_NAME" -c "
SELECT
  'tbl_project_categories' AS tabla, COUNT(*) AS filas FROM tbl_project_categories
UNION ALL SELECT 'tbl_projects',       COUNT(*) FROM tbl_projects
UNION ALL SELECT 'tbl_project_tags',   COUNT(*) FROM tbl_project_tags
UNION ALL SELECT 'tbl_project_views',  COUNT(*) FROM tbl_project_views
UNION ALL SELECT 'tbl_project_health_logs', COUNT(*) FROM tbl_project_health_logs
ORDER BY tabla;
"

# ── Limpieza ──────────────────────────────────────────────────────────────────
echo ""
echo -e "${YELLOW}🧹 Limpiando archivos temporales...${NC}"
rm -rf "$DUMP_DIR"

echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}  🎉 ¡Migración completada exitosamente!               ${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
