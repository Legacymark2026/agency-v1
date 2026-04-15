#!/bin/bash

# ==============================================================================
# 🚀 ULTRA-PROFESSIONAL DEPLOYMENT SCRIPT (LEGACYMARK)
# ==============================================================================
# This script automates the deployment process:
# 1. Syncs code with GitHub (Hard Reset)
# 2. Installs dependencies cleanly
# 3. Updates Database & Prisma Client
# 4. Builds the application
# 5. Restarts PM2 process
# ==============================================================================

# Exit immediately if a command exits with a non-zero status
set -e

# Colors for professional output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}======================================================${NC}"
echo -e "${BLUE}   🚀 STARTING LEGACYMARK DEPLOYMENT [$(date)]   ${NC}"
echo -e "${BLUE}======================================================${NC}"

# 1. Check Environment
# ------------------------------------------------------------------------------
if [ ! -f ".env" ]; then
    echo -e "${RED}❌ Error: .env file not found!${NC}"
    echo "Please ensure you are in the project root and .env exists."
    exit 1
fi

# 2. Git Synchronization
# ------------------------------------------------------------------------------
echo -e "${YELLOW}🔄 [1/5] Syncing with Repository...${NC}"
# Fetch latest changes
git fetch origin main

# Hard reset to match remote state exactly (Discards local changes/conflicts)
git reset --hard origin/main
echo -e "${GREEN}✅ Code Synced.${NC}"

# 3. Dependency Management
# ------------------------------------------------------------------------------
echo -e "${YELLOW}📦 [2/5] Installing Dependencies...${NC}"
# Clean install to avoid corruption
rm -rf node_modules
npm install
echo -e "${GREEN}✅ Dependencies Installed.${NC}"

# 4. Database & Prisma
# ------------------------------------------------------------------------------
echo -e "${YELLOW}🗄️  [3/5] Updating Database...${NC}"
# Generate Prisma Client
npx prisma generate
# Deploy Migrations (Safe for production)
npx prisma migrate deploy || echo -e "${YELLOW}⚠️ Migration failed, trying db push...${NC}" && npx prisma db push
echo -e "${GREEN}✅ Database Updated.${NC}"

# 5. Build Application
# ------------------------------------------------------------------------------
echo -e "${YELLOW}🏗️  [4/5] Building Next.js App...${NC}"
npm run build
echo -e "${GREEN}✅ Build Successful.${NC}"

# 6. Restart Service
# ------------------------------------------------------------------------------
echo -e "${YELLOW}🚀 [5/5] Restarting Server...${NC}"
pm2 restart legacymark || pm2 start npm --name "legacymark" -- start
echo -e "${GREEN}✅ Server Restarted.${NC}"

echo -e "${BLUE}======================================================${NC}"
echo -e "${GREEN}   ✨ DEPLOYMENT COMPLETED SUCCESSFULLY! ✨   ${NC}"
echo -e "${BLUE}======================================================${NC}"
