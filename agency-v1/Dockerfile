# Multi-service Dockerfile for Legacymark Agency Platform
# Builds all 7 microservices for Docker Hub

FROM node:20-alpine AS base
WORKDIR /app
RUN apk add --no-cache git

# Copy root package.json for workspaces
COPY package*.json ./
COPY packages/database/package.json ./packages/database/
COPY packages/events/package.json ./packages/events/

# Install all dependencies
RUN npm ci

# Build shared packages first
WORKDIR /app/packages/database && npm run build
WORKDIR /app/packages/events && npm run build

# ============================================
# API Gateway
# ============================================
FROM base AS api-gateway
COPY services/api-gateway/ ./services/api-gateway/
WORKDIR /app && npm run build --workspace=services/api-gateway

FROM node:20-alpine AS api-gateway-runner
WORKDIR /app
COPY --from=api-gateway /app/services/api-gateway/dist ./dist
COPY --from=api-gateway /app/node_modules ./node_modules
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=5s CMD wget -qO- http://localhost:8080/health || exit 1
CMD ["node", "dist/index.js"]

# ============================================
# Auth Service
# ============================================
FROM base AS auth-service
COPY --from=base /app/packages/database ./packages/database/
COPY --from=base /app/packages/events ./packages/events/
COPY services/auth-service/ ./services/auth-service/
WORKDIR /app && npm run build --workspace=services/auth-service

FROM node:20-alpine AS auth-service-runner
WORKDIR /app
COPY --from=auth-service /app/packages/database/dist ./packages/database/dist
COPY --from=auth-service /app/packages/events/dist ./packages/events/dist
COPY --from=auth-service /app/services/auth-service/dist ./dist
COPY --from=auth-service /app/node_modules ./node_modules
EXPOSE 4001
HEALTHCHECK --interval=30s --timeout=5s CMD wget -qO- http://localhost:4001/health || exit 1
CMD ["node", "dist/index.js"]

# ============================================
# CRM Service
# ============================================
FROM base AS crm-service
COPY --from=base /app/packages/database ./packages/database/
COPY --from=base /app/packages/events ./packages/events/
COPY services/crm-service/ ./services/crm-service/
WORKDIR /app && npm run build --workspace=services/crm-service

FROM node:20-alpine AS crm-service-runner
WORKDIR /app
COPY --from=crm-service /app/packages/database/dist ./packages/database/dist
COPY --from=crm-service /app/packages/events/dist ./packages/events/dist
COPY --from=crm-service /app/services/crm-service/dist ./dist
COPY --from=crm-service /app/node_modules ./node_modules
EXPOSE 4002
HEALTHCHECK --interval=30s --timeout=5s CMD wget -qO- http://localhost:4002/health || exit 1
CMD ["node", "dist/index.js"]

# ============================================
# Automation Service
# ============================================
FROM base AS automation-service
COPY --from=base /app/packages/database ./packages/database/
COPY --from=base /app/packages/events ./packages/events/
COPY services/automation-service/ ./services/automation-service/
WORKDIR /app && npm run build --workspace=services/automation-service

FROM node:20-alpine AS automation-service-runner
WORKDIR /app
COPY --from=automation-service /app/packages/database/dist ./packages/database/dist
COPY --from=automation-service /app/packages/events/dist ./packages/events/dist
COPY --from=automation-service /app/services/automation-service/dist ./dist
COPY --from=automation-service /app/node_modules ./node_modules
EXPOSE 4003
HEALTHCHECK --interval=30s --timeout=5s CMD wget -qO- http://localhost:4003/health || exit 1
CMD ["node", "dist/index.js"]

# ============================================
# AI Engine
# ============================================
FROM base AS ai-engine
COPY --from=base /app/packages/database ./packages/database/
COPY --from=base /app/packages/events ./packages/events/
COPY services/ai-engine/ ./services/ai-engine/
WORKDIR /app && npm run build --workspace=services/ai-engine

FROM node:20-alpine AS ai-engine-runner
WORKDIR /app
COPY --from=ai-engine /app/packages/database/dist ./packages/database/dist
COPY --from=ai-engine /app/packages/events/dist ./packages/events/dist
COPY --from=ai-engine /app/services/ai-engine/dist ./dist
COPY --from=ai-engine /app/node_modules ./node_modules
EXPOSE 4004
HEALTHCHECK --interval=30s --timeout=5s CMD wget -qO- http://localhost:4004/health || exit 1
CMD ["node", "dist/index.js"]

# ============================================
# Inbox Service
# ============================================
FROM base AS inbox-service
COPY --from=base /app/packages/database ./packages/database/
COPY --from=base /app/packages/events ./packages/events/
COPY services/inbox-service/ ./services/inbox-service/
WORKDIR /app && npm run build --workspace=services/inbox-service

FROM node:20-alpine AS inbox-service-runner
WORKDIR /app
COPY --from=inbox-service /app/packages/database/dist ./packages/database/dist
COPY --from=inbox-service /app/packages/events/dist ./packages/events/dist
COPY --from=inbox-service /app/services/inbox-service/dist ./dist
COPY --from=inbox-service /app/node_modules ./node_modules
EXPOSE 4005
HEALTHCHECK --interval=30s --timeout=5s CMD wget -qO- http://localhost:4005/health || exit 1
CMD ["node", "dist/index.js"]

# ============================================
# Finance Service
# ============================================
FROM base AS finance-service
COPY --from=base /app/packages/database ./packages/database/
COPY --from=base /app/packages/events ./packages/events/
COPY services/finance-service/ ./services/finance-service/
WORKDIR /app && npm run build --workspace=services/finance-service

FROM node:20-alpine AS finance-service-runner
WORKDIR /app
COPY --from=finance-service /app/packages/database/dist ./packages/database/dist
COPY --from=finance-service /app/packages/events/dist ./packages/events/dist
COPY --from=finance-service /app/services/finance-service/dist ./dist
COPY --from=finance-service /app/node_modules ./node_modules
EXPOSE 4006
HEALTHCHECK --interval=30s --timeout=5s CMD wget -qO- http://localhost:4006/health || exit 1
CMD ["node", "dist/index.js"]
