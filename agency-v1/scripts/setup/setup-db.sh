#!/bin/bash

# Generar contraseña segura
DB_PASSWORD=$(openssl rand -base64 12 | tr -dc 'a-zA-Z0-9')

echo "🔍 Checking Docker installation..."
if ! command -v docker &> /dev/null; then
    echo "📦 Installing Docker and Docker Compose..."
    curl -fsSL https://get.docker.com | sh
    systemctl enable docker
    systemctl start docker
else
    echo "✅ Docker is already installed."
fi

echo "🚀 Deploying PostgreSQL Connection..."

# Verificar si ya existe el contenedor
if [ "$(docker ps -aq -f name=legacymark-db)" ]; then
    echo "⚠️  Container 'legacymark-db' already exists. Skipping creation."
else
    docker run -d \
      --name legacymark-db \
      -e POSTGRES_USER=legacymark \
      -e POSTGRES_PASSWORD=$DB_PASSWORD \
      -e POSTGRES_DB=legacymark \
      -p 5433:5432 \
      -v legacymark_pgdata:/var/lib/postgresql/data \
      --restart always \
      postgres:15-alpine
      
    echo "✅ Database Container Started!"
    echo "---------------------------------------------------"
    echo "💾 YOUR DATABASE CREDENTIALS (SAVE THIS!):"
    echo ""
    echo "DATABASE_URL=\"postgresql://legacymark:$DB_PASSWORD@localhost:5433/legacymark?schema=public\""
    echo ""
    echo "👉 ACTION REQUIRED: Copy the line above and add it to your .env file."
    echo "---------------------------------------------------"
fi
