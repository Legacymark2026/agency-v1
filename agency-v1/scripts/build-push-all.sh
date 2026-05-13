#!/bin/bash
# Build and push all microservices to Docker Hub
set -e

REGISTRY="docker.io/legacymark"
SERVICES=("api-gateway" "auth-service" "crm-service" "automation-service" "ai-engine" "inbox-service" "finance-service")

echo "🔨 Building and pushing microservices to Docker Hub..."
echo "   Registry: $REGISTRY"
echo ""

for SERVICE in "${SERVICES[@]}"; do
    echo "📦 Building $SERVICE..."
    docker build -t ${REGISTRY}/${SERVICE}:latest -t ${REGISTRY}/${SERVICE}:$(git rev-parse --short HEAD) -f services/${SERVICE}/Dockerfile .
    echo "⬆️  Pushing $SERVICE..."
    docker push ${REGISTRY}/${SERVICE}:latest
    docker push ${REGISTRY}/${SERVICE}:$(git rev-parse --short HEAD)
    echo "✅ $SERVICE pushed successfully!"
    echo ""
done

echo "🎉 All services built and pushed!"
