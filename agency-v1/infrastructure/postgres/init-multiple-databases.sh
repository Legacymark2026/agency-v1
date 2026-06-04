#!/bin/bash
set -e

# Esperar a que Postgres esté listo para recibir conexiones
until pg_isready -U "$POSTGRES_USER" -d "$POSTGRES_DB"; do
  echo "Waiting for PostgreSQL to be ready..."
  sleep 1
done

# Función para crear una base de datos si no existe
create_db() {
  local db=$1
  if ! psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -tAc "SELECT 1 FROM pg_database WHERE datname='$db'" | grep -q 1; then
    echo "Creating database $db..."
    psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "CREATE DATABASE $db;"
  else
    echo "Database $db already exists."
  fi
}

# Función para crear la extensión pg_stat_statements en una base de datos
create_extension() {
  local db=$1
  echo "Enabling pg_stat_statements extension in $db..."
  psql -U "$POSTGRES_USER" -d "$db" -c "CREATE EXTENSION IF NOT EXISTS pg_stat_statements;"
}

# Crear las bases de datos lógicas para cada subdominio y habilitar la extensión
for db in "legacymark_auth" "legacymark_core" "legacymark_media" "legacymark_analytics"; do
  create_db "$db"
  create_extension "$db"
done

# También habilitar la extensión en la base de datos principal legacymark
create_extension "legacymark"
