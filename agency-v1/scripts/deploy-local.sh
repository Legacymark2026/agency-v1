#!/usr/bin/env bash
# Emergency manual deploy script
# Usage: bash scripts/deploy-local.sh [service-name]
# If no service specified, deploys all services.
set -euo pipefail

SERVICE=${1:-""}
echo "Starting emergency deployment..."

cd "$(dirname "$0")/.."

# Get current hash for rollback
PREV_SHA=$(git rev-parse HEAD)
echo "Current commit: $PREV_SHA"

echo "Pulling latest changes from main..."
git pull origin main

echo "Building services to avoid memory issues (per service)..."
if [ -n "$SERVICE" ]; then
  docker compose build "$SERVICE"
  docker compose up -d --no-build "$SERVICE"
else
  # Getting all service names
  SERVICES=$(docker compose config --services)
  for s in $SERVICES; do
    echo "Building $s..."
    docker compose build "$s"
  done
  docker compose up -d --no-build
fi

echo "Waiting for services to start..."
sleep 15

echo "Running smoke test..."
if curl -s -f http://localhost:3000/api/health > /dev/null; then
  echo "Smoke test passed! Deployment successful."
else
  echo "Smoke test failed! Rolling back to $PREV_SHA..."
  git reset --hard "$PREV_SHA"
  
  if [ -n "$SERVICE" ]; then
    docker compose build "$SERVICE"
    docker compose up -d --no-build "$SERVICE"
  else
    SERVICES=$(docker compose config --services)
    for s in $SERVICES; do
      echo "Building $s..."
      docker compose build "$s"
    done
    docker compose up -d --no-build
  fi
  echo "Rollback complete."
  exit 1
fi
