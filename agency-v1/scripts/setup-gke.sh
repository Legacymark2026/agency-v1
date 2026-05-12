#!/bin/bash
# ══════════════════════════════════════════════════════════════════════════════
# LegacyMark — GKE Cluster Setup Script
# ══════════════════════════════════════════════════════════════════════════════
# Run this ONCE to create the initial GKE cluster and configure secrets.
#
# Prerequisites:
#   - gcloud CLI installed and authenticated
#   - kubectl installed
#   - A GCP project with billing enabled
#
# Usage: chmod +x scripts/setup-gke.sh && ./scripts/setup-gke.sh
# ══════════════════════════════════════════════════════════════════════════════

set -euo pipefail

# ── Configuration ─────────────────────────────────────────────────────────────
PROJECT_ID="${GCP_PROJECT:-legacymark}"
CLUSTER_NAME="legacymark-cluster"
ZONE="us-central1-a"
MACHINE_TYPE="e2-standard-4"    # 4 vCPU, 16GB RAM
MIN_NODES=2
MAX_NODES=10
NAMESPACE="legacymark"

echo "══════════════════════════════════════════════════════════════"
echo "  LegacyMark — GKE Cluster Setup"
echo "══════════════════════════════════════════════════════════════"
echo "  Project:  $PROJECT_ID"
echo "  Cluster:  $CLUSTER_NAME"
echo "  Zone:     $ZONE"
echo "  Nodes:    $MIN_NODES → $MAX_NODES ($MACHINE_TYPE)"
echo "══════════════════════════════════════════════════════════════"

# ── Step 1: Enable required APIs ──────────────────────────────────────────────
echo "📦 Enabling GCP APIs..."
gcloud services enable \
  container.googleapis.com \
  artifactregistry.googleapis.com \
  cloudbuild.googleapis.com \
  --project=$PROJECT_ID

# ── Step 2: Create Artifact Registry ─────────────────────────────────────────
echo "🐳 Creating Artifact Registry..."
gcloud artifacts repositories create legacymark \
  --repository-format=docker \
  --location=us-central1 \
  --description="LegacyMark container images" \
  --project=$PROJECT_ID 2>/dev/null || echo "  Registry already exists"

# ── Step 3: Create GKE Cluster ────────────────────────────────────────────────
echo "☸️  Creating GKE cluster..."
gcloud container clusters create $CLUSTER_NAME \
  --zone=$ZONE \
  --project=$PROJECT_ID \
  --machine-type=$MACHINE_TYPE \
  --num-nodes=$MIN_NODES \
  --enable-autoscaling \
  --min-nodes=$MIN_NODES \
  --max-nodes=$MAX_NODES \
  --enable-autorepair \
  --enable-autoupgrade \
  --enable-ip-alias \
  --enable-network-policy \
  --release-channel=stable \
  --workload-pool=$PROJECT_ID.svc.id.goog \
  --disk-size=50GB \
  --disk-type=pd-standard

# ── Step 4: Get credentials ───────────────────────────────────────────────────
echo "🔑 Configuring kubectl..."
gcloud container clusters get-credentials $CLUSTER_NAME \
  --zone=$ZONE \
  --project=$PROJECT_ID

# ── Step 5: Create namespace ──────────────────────────────────────────────────
echo "📁 Creating namespace..."
kubectl create namespace $NAMESPACE 2>/dev/null || echo "  Namespace already exists"

# ── Step 6: Create secrets ────────────────────────────────────────────────────
echo "🔐 Creating secrets..."
echo "  ⚠️  You must update these with real values!"

kubectl create secret generic db-credentials \
  --namespace=$NAMESPACE \
  --from-literal=url="postgresql://USER:PASS@HOST:5432/legacymark" \
  --dry-run=client -o yaml | kubectl apply -f -

kubectl create secret generic redis-credentials \
  --namespace=$NAMESPACE \
  --from-literal=url="redis://HOST:6379" \
  --dry-run=client -o yaml | kubectl apply -f -

kubectl create secret generic service-secrets \
  --namespace=$NAMESPACE \
  --from-literal=JWT_SECRET="CHANGE-ME-TO-STRONG-SECRET" \
  --from-literal=STRIPE_SECRET_KEY="" \
  --from-literal=WHATSAPP_VERIFY_TOKEN="" \
  --from-literal=GOOGLE_GENERATIVE_AI_API_KEY="" \
  --from-literal=OPENAI_API_KEY="" \
  --from-literal=ANTHROPIC_API_KEY="" \
  --dry-run=client -o yaml | kubectl apply -f -

# ── Step 7: Install metrics-server (required for HPA) ─────────────────────────
echo "📊 Installing metrics-server..."
kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml 2>/dev/null || echo "  Metrics server already installed"

# ── Step 8: Deploy ────────────────────────────────────────────────────────────
echo "🚀 Deploying services..."
kubectl apply -k infrastructure/k8s/overlays/production

echo ""
echo "══════════════════════════════════════════════════════════════"
echo "  ✅ GKE cluster ready!"
echo "══════════════════════════════════════════════════════════════"
echo ""
echo "  Next steps:"
echo "  1. Update secrets: kubectl edit secret db-credentials -n $NAMESPACE"
echo "  2. Build & push images: docker build & docker push"
echo "  3. Get external IP: kubectl get svc api-gateway -n $NAMESPACE"
echo "  4. Monitor: kubectl get pods -n $NAMESPACE -w"
echo ""
