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

# Crear las bases de datos lógicas para cada subdominio
create_db "legacymark_auth"
create_db "legacymark_core"
create_db "legacymark_media"
create_db "legacymark_analytics"
