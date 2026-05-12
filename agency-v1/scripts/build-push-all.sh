#!/bin/bash
# ══════════════════════════════════════════════════════════════════════════════
# Build & Push all service images to Google Artifact Registry
# Usage: ./scripts/build-push-all.sh
# ══════════════════════════════════════════════════════════════════════════════

set -euo pipefail

PROJECT_ID="${GCP_PROJECT:-legacymark}"
REGION="us-central1"
REGISTRY="$REGION-docker.pkg.dev/$PROJECT_ID/legacymark"
TAG="${1:-latest}"

SERVICES=(
  "api-gateway"
  "auth-service"
  "crm-service"
  "automation-service"
  "ai-engine"
  "inbox-service"
  "finance-service"
)

echo "══════════════════════════════════════════════════════════════"
echo "  Building & pushing ${#SERVICES[@]} service images"
echo "  Registry: $REGISTRY"
echo "  Tag: $TAG"
echo "══════════════════════════════════════════════════════════════"

# Configure Docker for GCR
gcloud auth configure-docker $REGION-docker.pkg.dev --quiet

for SERVICE in "${SERVICES[@]}"; do
  IMAGE="$REGISTRY/$SERVICE:$TAG"
  echo ""
  echo "🐳 Building $SERVICE → $IMAGE"
  docker build -t "$IMAGE" -f "services/$SERVICE/Dockerfile" .
  echo "📤 Pushing $IMAGE..."
  docker push "$IMAGE"
  echo "✅ $SERVICE done"
done

echo ""
echo "══════════════════════════════════════════════════════════════"
echo "  ✅ All images pushed!"
echo "  Deploy: npm run k8s:prod"
echo "══════════════════════════════════════════════════════════════"
