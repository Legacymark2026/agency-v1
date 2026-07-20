#!/bin/bash
# =============================================================================
# SCRIPT DE MIGRACIÓN DE BLOG
# Origen:  postgresql://legacyuser@187.77.195.9:5432/legacymark
# Destino: legacymark_media (dentro de Docker)
# =============================================================================

set -e  # Detener si hay error

OLD_HOST="187.77.195.9"
OLD_PORT="5432"
OLD_DB="legacymark"
OLD_USER="legacyuser"
OLD_PASS="g/d1b0VLZJQdTaoRdThivfuzqyT3+ouU"

NEW_DB="legacymark_media"
NEW_USER="legacymark"

echo "======================================================"
echo "  MIGRACIÓN DE BLOG: legacymark → legacymark_media"
echo "======================================================"
echo ""

# ---------------------------------------------------------------------------
# PASO 1: Crear tablas faltantes en legacymark_media
# ---------------------------------------------------------------------------
echo "→ [1/5] Creando tablas faltantes en legacymark_media..."

docker compose exec -T postgres psql -U "$NEW_USER" -d "$NEW_DB" <<'NEWSQL'

-- tbl_post_series (debe ir antes que tbl_posts depende de ella)
CREATE TABLE IF NOT EXISTS tbl_post_series (
    id                 TEXT        NOT NULL PRIMARY KEY,
    title              TEXT        NOT NULL,
    slug               TEXT        NOT NULL UNIQUE,
    description        TEXT,
    cover_image        TEXT,
    created_at         TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at         TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    col_schema_version INT         NOT NULL DEFAULT 0,
    col_deleted_at     TIMESTAMP(3)
);

-- tbl_post_views
CREATE TABLE IF NOT EXISTS tbl_post_views (
    id                 TEXT        NOT NULL PRIMARY KEY,
    post_id            TEXT        NOT NULL,
    ip_hash            TEXT        NOT NULL,
    user_agent         TEXT,
    referer            TEXT,
    created_at         TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    col_schema_version INT         NOT NULL DEFAULT 0,
    col_deleted_at     TIMESTAMP(3)
);
CREATE INDEX IF NOT EXISTS post_views_post_id_idx ON tbl_post_views(post_id);
CREATE INDEX IF NOT EXISTS post_views_created_at_idx ON tbl_post_views(created_at);

-- tbl_post_likes
CREATE TABLE IF NOT EXISTS tbl_post_likes (
    id                 TEXT        NOT NULL PRIMARY KEY,
    post_id            TEXT        NOT NULL,
    session_id         TEXT        NOT NULL,
    created_at         TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    col_schema_version INT         NOT NULL DEFAULT 0,
    col_deleted_at     TIMESTAMP(3),
    UNIQUE(post_id, session_id)
);
CREATE INDEX IF NOT EXISTS post_likes_post_id_idx ON tbl_post_likes(post_id);

-- tbl_comments
CREATE TABLE IF NOT EXISTS tbl_comments (
    id                 TEXT        NOT NULL PRIMARY KEY,
    content            TEXT        NOT NULL,
    author_name        TEXT        NOT NULL,
    author_email       TEXT        NOT NULL,
    author_url         TEXT,
    post_id            TEXT        NOT NULL,
    parent_id          TEXT,
    approved           BOOLEAN     NOT NULL DEFAULT false,
    flagged            BOOLEAN     NOT NULL DEFAULT false,
    ip_hash            TEXT,
    created_at         TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at         TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted            BOOLEAN     NOT NULL DEFAULT false,
    like_count         INT         NOT NULL DEFAULT 0,
    col_schema_version INT         NOT NULL DEFAULT 0,
    col_deleted_at     TIMESTAMP(3)
);
CREATE INDEX IF NOT EXISTS comments_post_id_idx ON tbl_comments(post_id);
CREATE INDEX IF NOT EXISTS comments_parent_id_idx ON tbl_comments(parent_id);
CREATE INDEX IF NOT EXISTS comments_approved_idx ON tbl_comments(approved);
CREATE INDEX IF NOT EXISTS comments_deleted_idx ON tbl_comments(deleted);

-- tbl_comment_likes
CREATE TABLE IF NOT EXISTS tbl_comment_likes (
    id                 TEXT        NOT NULL PRIMARY KEY,
    comment_id         TEXT        NOT NULL,
    ip_hash            TEXT        NOT NULL,
    created_at         TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    col_schema_version INT         NOT NULL DEFAULT 0,
    col_deleted_at     TIMESTAMP(3),
    UNIQUE(comment_id, ip_hash)
);
CREATE INDEX IF NOT EXISTS comment_likes_comment_id_idx ON tbl_comment_likes(comment_id);

NEWSQL

echo "   ✓ Tablas creadas correctamente."

# ---------------------------------------------------------------------------
# PASO 2: Migrar tbl_post_series (sin FK externas)
# ---------------------------------------------------------------------------
echo "→ [2/5] Migrando tbl_post_series..."

docker compose exec -T postgres sh -c \
  "PGPASSWORD='$OLD_PASS' pg_dump \
    -h $OLD_HOST -p $OLD_PORT -U $OLD_USER -d $OLD_DB \
    --table=tbl_post_series \
    --data-only \
    --column-inserts \
    --no-acl --no-owner \
    --on-conflict-do-nothing" \
  | docker compose exec -T postgres psql -U "$NEW_USER" -d "$NEW_DB"

echo "   ✓ tbl_post_series migrada."

# ---------------------------------------------------------------------------
# PASO 3: Migrar tbl_posts (sin FK a tbl_users — se elimina la constraint)
# ---------------------------------------------------------------------------
echo "→ [3/5] Migrando tbl_posts (sin constraint de author_id)..."

# Verificar si la FK author_id existe en la tabla destino y eliminarla temporalmente
docker compose exec -T postgres psql -U "$NEW_USER" -d "$NEW_DB" -c "
ALTER TABLE tbl_posts DROP CONSTRAINT IF EXISTS posts_author_id_fkey;
ALTER TABLE tbl_posts DROP CONSTRAINT IF EXISTS posts_series_id_fkey;
" 2>/dev/null || true

# Exportar e importar datos de posts
docker compose exec -T postgres sh -c \
  "PGPASSWORD='$OLD_PASS' pg_dump \
    -h $OLD_HOST -p $OLD_PORT -U $OLD_USER -d $OLD_DB \
    --table=tbl_posts \
    --data-only \
    --column-inserts \
    --no-acl --no-owner \
    --on-conflict-do-nothing" \
  | docker compose exec -T postgres psql -U "$NEW_USER" -d "$NEW_DB"

echo "   ✓ tbl_posts migrada."

# ---------------------------------------------------------------------------
# PASO 4: Migrar tbl_categories, tbl_tags y tablas de relación
# ---------------------------------------------------------------------------
echo "→ [4/5] Migrando categorías, tags y relaciones..."

for TABLE in tbl_categories tbl_tags _CategoryToPost _PostToTag; do
  echo "   → Migrando $TABLE..."
  docker compose exec -T postgres sh -c \
    "PGPASSWORD='$OLD_PASS' pg_dump \
      -h $OLD_HOST -p $OLD_PORT -U $OLD_USER -d $OLD_DB \
      --table='$TABLE' \
      --data-only \
      --column-inserts \
      --no-acl --no-owner \
      --on-conflict-do-nothing" \
    | docker compose exec -T postgres psql -U "$NEW_USER" -d "$NEW_DB"
  echo "   ✓ $TABLE migrada."
done

# ---------------------------------------------------------------------------
# PASO 5: Migrar tbl_comments, tbl_comment_likes, tbl_post_views, tbl_post_likes
# ---------------------------------------------------------------------------
echo "→ [5/5] Migrando comentarios, likes y vistas..."

for TABLE in tbl_comments tbl_comment_likes tbl_post_views tbl_post_likes; do
  echo "   → Migrando $TABLE..."
  docker compose exec -T postgres sh -c \
    "PGPASSWORD='$OLD_PASS' pg_dump \
      -h $OLD_HOST -p $OLD_PORT -U $OLD_USER -d $OLD_DB \
      --table='$TABLE' \
      --data-only \
      --column-inserts \
      --no-acl --no-owner \
      --on-conflict-do-nothing" \
    | docker compose exec -T postgres psql -U "$NEW_USER" -d "$NEW_DB"
  echo "   ✓ $TABLE migrada."
done

# ---------------------------------------------------------------------------
# VERIFICACIÓN FINAL
# ---------------------------------------------------------------------------
echo ""
echo "======================================================"
echo "  VERIFICACIÓN DE REGISTROS MIGRADOS"
echo "======================================================"

docker compose exec -T postgres psql -U "$NEW_USER" -d "$NEW_DB" <<'VERIFYSQL'
SELECT 'tbl_posts'         AS tabla, COUNT(*) AS registros FROM tbl_posts
UNION ALL
SELECT 'tbl_categories',           COUNT(*) FROM tbl_categories
UNION ALL
SELECT 'tbl_tags',                 COUNT(*) FROM tbl_tags
UNION ALL
SELECT 'tbl_post_series',          COUNT(*) FROM tbl_post_series
UNION ALL
SELECT 'tbl_post_views',           COUNT(*) FROM tbl_post_views
UNION ALL
SELECT 'tbl_post_likes',           COUNT(*) FROM tbl_post_likes
UNION ALL
SELECT 'tbl_comments',             COUNT(*) FROM tbl_comments
UNION ALL
SELECT 'tbl_comment_likes',        COUNT(*) FROM tbl_comment_likes
UNION ALL
SELECT '_CategoryToPost',          COUNT(*) FROM "_CategoryToPost"
UNION ALL
SELECT '_PostToTag',               COUNT(*) FROM "_PostToTag";
VERIFYSQL

echo ""
echo "======================================================"
echo "  ✅ MIGRACIÓN DE BLOG COMPLETADA"
echo "======================================================"
