#!/bin/bash
# Quick build script for api-gateway only
set -e

cd services/api-gateway
docker build -t docker.io/legacymark2026/api-gateway:latest .
docker push docker.io/legacymark2026/api-gateway:latest
echo "✅ api-gateway built and pushed!"
