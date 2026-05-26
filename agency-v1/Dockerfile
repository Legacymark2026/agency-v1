# ══════════════════════════════════════════════════════════════════════════════
# LegacyMark — Multi-Service Docker Build
# ══════════════════════════════════════════════════════════════════════════════
# Builds all microservices for Docker Hub deployment.
# Usage:
#   docker build --target api-gateway-runner -t legacymark/api-gateway .
#   docker build --target crm-service-runner -t legacymark/crm-service .

FROM node:20-alpine AS manifests
WORKDIR /app
COPY package*.json ./
COPY packages/database/package.json ./packages/database/
COPY packages/events/package.json ./packages/events/

FROM manifests AS base
RUN apk add --no-cache git openssl

# Install all dependencies
RUN npm ci --ignore-scripts || npm install --ignore-scripts

# Copy and build shared packages
COPY packages/database/ ./packages/database/
COPY packages/events/ ./packages/events/

# Copy Prisma schema from web app for shared client generation
COPY apps/web/prisma/schema.prisma ./packages/database/prisma/schema.prisma

WORKDIR /app/packages/database
RUN npx prisma generate --schema=./prisma/schema.prisma
RUN npx tsc --outDir dist

WORKDIR /app/packages/events
RUN npx tsc --outDir dist

WORKDIR /app

# ============================================
# API Gateway
# ============================================
FROM base AS api-gateway-build
COPY services/api-gateway/ ./services/api-gateway/
WORKDIR /app/services/api-gateway
RUN npx tsc --outDir dist

FROM manifests AS api-gateway-deps
COPY services/api-gateway/package.json ./services/api-gateway/
RUN npm ci --omit=dev --workspace=@agency/api-gateway --ignore-scripts || npm install --omit=dev --workspace=@agency/api-gateway --ignore-scripts

FROM node:20-alpine AS api-gateway-runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=api-gateway-build /app/services/api-gateway/dist ./dist
COPY --from=api-gateway-build /app/services/api-gateway/package.json ./
COPY --from=api-gateway-deps /app/node_modules ./node_modules
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s CMD wget -qO- http://127.0.0.1:8080/health || exit 1
CMD ["node", "dist/index.js"]

# ============================================
# Auth Service
# ============================================
FROM base AS auth-service-build
COPY services/auth-service/ ./services/auth-service/
WORKDIR /app/services/auth-service
RUN npx tsc --outDir dist

FROM manifests AS auth-service-deps
COPY services/auth-service/package.json ./services/auth-service/
RUN npm ci --omit=dev --workspace=@agency/auth-service --ignore-scripts || npm install --omit=dev --workspace=@agency/auth-service --ignore-scripts

FROM node:20-alpine AS auth-service-runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=auth-service-build /app/packages/database/dist ./packages/database/dist
COPY --from=auth-service-build /app/packages/database/package.json ./packages/database/
COPY --from=auth-service-build /app/packages/events/dist ./packages/events/dist
COPY --from=auth-service-build /app/packages/events/package.json ./packages/events/
COPY --from=auth-service-build /app/services/auth-service/dist ./dist
COPY --from=auth-service-build /app/services/auth-service/package.json ./
COPY --from=auth-service-deps /app/node_modules ./node_modules
COPY --from=auth-service-build /app/node_modules/.prisma ./node_modules/.prisma
EXPOSE 4001
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s CMD wget -qO- http://127.0.0.1:4001/health || exit 1
CMD ["node", "dist/index.js"]

# ============================================
# CRM Service
# ============================================
FROM base AS crm-service-build
COPY services/crm-service/ ./services/crm-service/
WORKDIR /app/services/crm-service
RUN npx tsc --outDir dist

FROM manifests AS crm-service-deps
COPY services/crm-service/package.json ./services/crm-service/
RUN npm ci --omit=dev --workspace=@agency/crm-service --ignore-scripts || npm install --omit=dev --workspace=@agency/crm-service --ignore-scripts

FROM node:20-alpine AS crm-service-runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=crm-service-build /app/packages/database/dist ./packages/database/dist
COPY --from=crm-service-build /app/packages/database/package.json ./packages/database/
COPY --from=crm-service-build /app/packages/events/dist ./packages/events/dist
COPY --from=crm-service-build /app/packages/events/package.json ./packages/events/
COPY --from=crm-service-build /app/services/crm-service/dist ./dist
COPY --from=crm-service-build /app/services/crm-service/package.json ./
COPY --from=crm-service-deps /app/node_modules ./node_modules
COPY --from=crm-service-build /app/node_modules/.prisma ./node_modules/.prisma
EXPOSE 4002
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s CMD wget -qO- http://127.0.0.1:4002/health || exit 1
CMD ["node", "dist/index.js"]

# ============================================
# Automation Service
# ============================================
FROM base AS automation-service-build
COPY services/automation-service/ ./services/automation-service/
WORKDIR /app/services/automation-service
RUN npx tsc --outDir dist

FROM manifests AS automation-service-deps
COPY services/automation-service/package.json ./services/automation-service/
RUN npm ci --omit=dev --workspace=@agency/automation-service --ignore-scripts || npm install --omit=dev --workspace=@agency/automation-service --ignore-scripts

FROM node:20-alpine AS automation-service-runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=automation-service-build /app/packages/database/dist ./packages/database/dist
COPY --from=automation-service-build /app/packages/database/package.json ./packages/database/
COPY --from=automation-service-build /app/packages/events/dist ./packages/events/dist
COPY --from=automation-service-build /app/packages/events/package.json ./packages/events/
COPY --from=automation-service-build /app/services/automation-service/dist ./dist
COPY --from=automation-service-build /app/services/automation-service/package.json ./
COPY --from=automation-service-deps /app/node_modules ./node_modules
COPY --from=automation-service-build /app/node_modules/.prisma ./node_modules/.prisma
EXPOSE 4003
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s CMD wget -qO- http://127.0.0.1:4003/health || exit 1
CMD ["node", "dist/index.js"]

# ============================================
# AI Engine
# ============================================
FROM base AS ai-engine-build
COPY services/ai-engine/ ./services/ai-engine/
WORKDIR /app/services/ai-engine
RUN npx tsc --outDir dist

FROM manifests AS ai-engine-deps
COPY services/ai-engine/package.json ./services/ai-engine/
RUN npm ci --omit=dev --workspace=@agency/ai-engine --ignore-scripts || npm install --omit=dev --workspace=@agency/ai-engine --ignore-scripts

FROM node:20-alpine AS ai-engine-runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=ai-engine-build /app/packages/database/dist ./packages/database/dist
COPY --from=ai-engine-build /app/packages/database/package.json ./packages/database/
COPY --from=ai-engine-build /app/packages/events/dist ./packages/events/dist
COPY --from=ai-engine-build /app/packages/events/package.json ./packages/events/
COPY --from=ai-engine-build /app/services/ai-engine/dist ./dist
COPY --from=ai-engine-build /app/services/ai-engine/package.json ./
COPY --from=ai-engine-deps /app/node_modules ./node_modules
COPY --from=ai-engine-build /app/node_modules/.prisma ./node_modules/.prisma
EXPOSE 4004
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s CMD wget -qO- http://127.0.0.1:4004/health || exit 1
CMD ["node", "dist/index.js"]

# ============================================
# Inbox Service
# ============================================
FROM base AS inbox-service-build
COPY services/inbox-service/ ./services/inbox-service/
WORKDIR /app/services/inbox-service
RUN npx tsc --outDir dist

FROM manifests AS inbox-service-deps
COPY services/inbox-service/package.json ./services/inbox-service/
RUN npm ci --omit=dev --workspace=@agency/inbox-service --ignore-scripts || npm install --omit=dev --workspace=@agency/inbox-service --ignore-scripts

FROM node:20-alpine AS inbox-service-runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=inbox-service-build /app/packages/database/dist ./packages/database/dist
COPY --from=inbox-service-build /app/packages/database/package.json ./packages/database/
COPY --from=inbox-service-build /app/packages/events/dist ./packages/events/dist
COPY --from=inbox-service-build /app/packages/events/package.json ./packages/events/
COPY --from=inbox-service-build /app/services/inbox-service/dist ./dist
COPY --from=inbox-service-build /app/services/inbox-service/package.json ./
COPY --from=inbox-service-deps /app/node_modules ./node_modules
COPY --from=inbox-service-build /app/node_modules/.prisma ./node_modules/.prisma
EXPOSE 4005
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s CMD wget -qO- http://127.0.0.1:4005/health || exit 1
CMD ["node", "dist/index.js"]

# ============================================
# Finance Service
# ============================================
FROM base AS finance-service-build
COPY services/finance-service/ ./services/finance-service/
WORKDIR /app/services/finance-service
RUN npx tsc --outDir dist

FROM manifests AS finance-service-deps
COPY services/finance-service/package.json ./services/finance-service/
RUN npm ci --omit=dev --workspace=@agency/finance-service --ignore-scripts || npm install --omit=dev --workspace=@agency/finance-service --ignore-scripts

FROM node:20-alpine AS finance-service-runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=finance-service-build /app/packages/database/dist ./packages/database/dist
COPY --from=finance-service-build /app/packages/database/package.json ./packages/database/
COPY --from=finance-service-build /app/packages/events/dist ./packages/events/dist
COPY --from=finance-service-build /app/packages/events/package.json ./packages/events/
COPY --from=finance-service-build /app/services/finance-service/dist ./dist
COPY --from=finance-service-build /app/services/finance-service/package.json ./
COPY --from=finance-service-deps /app/node_modules ./node_modules
COPY --from=finance-service-build /app/node_modules/.prisma ./node_modules/.prisma
EXPOSE 4006
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s CMD wget -qO- http://127.0.0.1:4006/health || exit 1
CMD ["node", "dist/index.js"]

# ============================================
# Video Service
# ============================================
FROM base AS video-service-build
COPY services/video-service/ ./services/video-service/
WORKDIR /app/services/video-service
RUN npx tsc --outDir dist

FROM manifests AS video-service-deps
COPY services/video-service/package.json ./services/video-service/
RUN npm ci --omit=dev --workspace=@agency/video-service --ignore-scripts || npm install --omit=dev --workspace=@agency/video-service --ignore-scripts

FROM node:20-alpine AS video-service-runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=video-service-build /app/packages/database/dist ./packages/database/dist
COPY --from=video-service-build /app/packages/database/package.json ./packages/database/
COPY --from=video-service-build /app/packages/events/dist ./packages/events/dist
COPY --from=video-service-build /app/packages/events/package.json ./packages/events/
COPY --from=video-service-build /app/services/video-service/dist ./dist
COPY --from=video-service-build /app/services/video-service/package.json ./
COPY --from=video-service-deps /app/node_modules ./node_modules
COPY --from=video-service-build /app/node_modules/.prisma ./node_modules/.prisma
EXPOSE 4007
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s CMD wget -qO- http://127.0.0.1:4007/health || exit 1
CMD ["node", "dist/index.js"]

# ============================================
# Calendar Service
# ============================================
FROM base AS calendar-service-build
COPY services/calendar-service/ ./services/calendar-service/
WORKDIR /app/services/calendar-service
RUN npx tsc --outDir dist

FROM manifests AS calendar-service-deps
COPY services/calendar-service/package.json ./services/calendar-service/
RUN npm ci --omit=dev --workspace=@agency/calendar-service --ignore-scripts || npm install --omit=dev --workspace=@agency/calendar-service --ignore-scripts

FROM node:20-alpine AS calendar-service-runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=calendar-service-build /app/packages/database/dist ./packages/database/dist
COPY --from=calendar-service-build /app/packages/database/package.json ./packages/database/
COPY --from=calendar-service-build /app/packages/events/dist ./packages/events/dist
COPY --from=calendar-service-build /app/packages/events/package.json ./packages/events/
COPY --from=calendar-service-build /app/services/calendar-service/dist ./dist
COPY --from=calendar-service-build /app/services/calendar-service/package.json ./
COPY --from=calendar-service-deps /app/node_modules ./node_modules
COPY --from=calendar-service-build /app/node_modules/.prisma ./node_modules/.prisma
EXPOSE 4008
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s CMD wget -qO- http://127.0.0.1:4008/health || exit 1
CMD ["node", "dist/index.js"]

# ============================================
# Marketing Service
# ============================================
FROM base AS marketing-service-build
COPY services/marketing-service/ ./services/marketing-service/
WORKDIR /app/services/marketing-service
RUN npx tsc --outDir dist

FROM manifests AS marketing-service-deps
COPY services/marketing-service/package.json ./services/marketing-service/
RUN npm ci --omit=dev --workspace=@agency/marketing-service --ignore-scripts || npm install --omit=dev --workspace=@agency/marketing-service --ignore-scripts

FROM node:20-alpine AS marketing-service-runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=marketing-service-build /app/packages/database/dist ./packages/database/dist
COPY --from=marketing-service-build /app/packages/database/package.json ./packages/database/
COPY --from=marketing-service-build /app/packages/events/dist ./packages/events/dist
COPY --from=marketing-service-build /app/packages/events/package.json ./packages/events/
COPY --from=marketing-service-build /app/services/marketing-service/dist ./dist
COPY --from=marketing-service-build /app/services/marketing-service/package.json ./
COPY --from=marketing-service-deps /app/node_modules ./node_modules
COPY --from=marketing-service-build /app/node_modules/.prisma ./node_modules/.prisma
EXPOSE 4009
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s CMD wget -qO- http://127.0.0.1:4009/health || exit 1
CMD ["node", "dist/index.js"]

# ============================================
# Integration Service
# ============================================
FROM base AS integration-service-build
COPY services/integration-service/ ./services/integration-service/
WORKDIR /app/services/integration-service
RUN npx tsc --outDir dist

FROM manifests AS integration-service-deps
COPY services/integration-service/package.json ./services/integration-service/
RUN npm ci --omit=dev --workspace=@agency/integration-service --ignore-scripts || npm install --omit=dev --workspace=@agency/integration-service --ignore-scripts

FROM node:20-alpine AS integration-service-runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=integration-service-build /app/packages/database/dist ./packages/database/dist
COPY --from=integration-service-build /app/packages/database/package.json ./packages/database/
COPY --from=integration-service-build /app/packages/events/dist ./packages/events/dist
COPY --from=integration-service-build /app/packages/events/package.json ./packages/events/
COPY --from=integration-service-build /app/services/integration-service/dist ./dist
COPY --from=integration-service-build /app/services/integration-service/package.json ./
COPY --from=integration-service-deps /app/node_modules ./node_modules
COPY --from=integration-service-build /app/node_modules/.prisma ./node_modules/.prisma
EXPOSE 4010
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s CMD wget -qO- http://127.0.0.1:4010/health || exit 1
CMD ["node", "dist/index.js"]

# ============================================
# Document Service
# ============================================
FROM base AS document-service-build
COPY services/document-service/ ./services/document-service/
WORKDIR /app/services/document-service
RUN npx tsc --outDir dist

FROM manifests AS document-service-deps
COPY services/document-service/package.json ./services/document-service/
RUN npm ci --omit=dev --workspace=@agency/document-service --ignore-scripts || npm install --omit=dev --workspace=@agency/document-service --ignore-scripts

FROM node:20-alpine AS document-service-runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=document-service-build /app/packages/database/dist ./packages/database/dist
COPY --from=document-service-build /app/packages/database/package.json ./packages/database/
COPY --from=document-service-build /app/packages/events/dist ./packages/events/dist
COPY --from=document-service-build /app/packages/events/package.json ./packages/events/
COPY --from=document-service-build /app/services/document-service/dist ./dist
COPY --from=document-service-build /app/services/document-service/package.json ./
COPY --from=document-service-deps /app/node_modules ./node_modules
COPY --from=document-service-build /app/node_modules/.prisma ./node_modules/.prisma
EXPOSE 4011
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s CMD wget -qO- http://127.0.0.1:4011/health || exit 1
CMD ["node", "dist/index.js"]

# ============================================
# Agent Team Engine
# ============================================
FROM base AS agent-team-engine-build
COPY services/agent-team-engine/ ./services/agent-team-engine/
WORKDIR /app/services/agent-team-engine
RUN npx tsc --outDir dist

FROM manifests AS agent-team-engine-deps
COPY services/agent-team-engine/package.json ./services/agent-team-engine/
RUN npm ci --omit=dev --workspace=@agency/agent-team-engine --ignore-scripts || npm install --omit=dev --workspace=@agency/agent-team-engine --ignore-scripts

FROM node:20-alpine AS agent-team-engine-runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=agent-team-engine-build /app/packages/database/dist ./packages/database/dist
COPY --from=agent-team-engine-build /app/packages/database/package.json ./packages/database/
COPY --from=agent-team-engine-build /app/packages/events/dist ./packages/events/dist
COPY --from=agent-team-engine-build /app/packages/events/package.json ./packages/events/
COPY --from=agent-team-engine-build /app/services/agent-team-engine/dist ./dist
COPY --from=agent-team-engine-build /app/services/agent-team-engine/package.json ./
COPY --from=agent-team-engine-deps /app/node_modules ./node_modules
COPY --from=agent-team-engine-build /app/node_modules/.prisma ./node_modules/.prisma
EXPOSE 4012
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s CMD wget -qO- http://127.0.0.1:4012/health || exit 1
CMD ["node", "dist/index.js"]

# ============================================
# Analytics Service
# ============================================
FROM base AS analytics-service-build
COPY services/analytics-service/ ./services/analytics-service/
WORKDIR /app/services/analytics-service
RUN npx tsc --outDir dist

FROM manifests AS analytics-service-deps
COPY services/analytics-service/package.json ./services/analytics-service/
RUN npm ci --omit=dev --workspace=@agency/analytics-service --ignore-scripts || npm install --omit=dev --workspace=@agency/analytics-service --ignore-scripts

FROM node:20-alpine AS analytics-service-runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=analytics-service-build /app/packages/database/dist ./packages/database/dist
COPY --from=analytics-service-build /app/packages/database/package.json ./packages/database/
COPY --from=analytics-service-build /app/packages/events/dist ./packages/events/dist
COPY --from=analytics-service-build /app/packages/events/package.json ./packages/events/
COPY --from=analytics-service-build /app/services/analytics-service/dist ./dist
COPY --from=analytics-service-build /app/services/analytics-service/package.json ./
COPY --from=analytics-service-deps /app/node_modules ./node_modules
COPY --from=analytics-service-build /app/node_modules/.prisma ./node_modules/.prisma
EXPOSE 4013
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s CMD wget -qO- http://127.0.0.1:4013/health || exit 1
CMD ["node", "dist/index.js"]

# ============================================
# Admin Service
# ============================================
FROM base AS admin-service-build
COPY services/admin-service/ ./services/admin-service/
WORKDIR /app/services/admin-service
RUN npx tsc --outDir dist

FROM manifests AS admin-service-deps
COPY services/admin-service/package.json ./services/admin-service/
RUN npm ci --omit=dev --workspace=@agency/admin-service --ignore-scripts || npm install --omit=dev --workspace=@agency/admin-service --ignore-scripts

FROM node:20-alpine AS admin-service-runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=admin-service-build /app/packages/database/dist ./packages/database/dist
COPY --from=admin-service-build /app/packages/database/package.json ./packages/database/
COPY --from=admin-service-build /app/packages/events/dist ./packages/events/dist
COPY --from=admin-service-build /app/packages/events/package.json ./packages/events/
COPY --from=admin-service-build /app/services/admin-service/dist ./dist
COPY --from=admin-service-build /app/services/admin-service/package.json ./
COPY --from=admin-service-deps /app/node_modules ./node_modules
COPY --from=admin-service-build /app/node_modules/.prisma ./node_modules/.prisma
EXPOSE 4014
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s CMD wget -qO- http://127.0.0.1:4014/health || exit 1
CMD ["node", "dist/index.js"]

# ============================================
# Public API Service
# ============================================
FROM base AS public-api-service-build
COPY services/public-api-service/ ./services/public-api-service/
WORKDIR /app/services/public-api-service
RUN npx tsc --outDir dist

FROM manifests AS public-api-service-deps
COPY services/public-api-service/package.json ./services/public-api-service/
RUN npm ci --omit=dev --workspace=@agency/public-api-service --ignore-scripts || npm install --omit=dev --workspace=@agency/public-api-service --ignore-scripts

FROM node:20-alpine AS public-api-service-runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=public-api-service-build /app/packages/database/dist ./packages/database/dist
COPY --from=public-api-service-build /app/packages/database/package.json ./packages/database/
COPY --from=public-api-service-build /app/packages/events/dist ./packages/events/dist
COPY --from=public-api-service-build /app/packages/events/package.json ./packages/events/
COPY --from=public-api-service-build /app/services/public-api-service/dist ./dist
COPY --from=public-api-service-build /app/services/public-api-service/package.json ./
COPY --from=public-api-service-deps /app/node_modules ./node_modules
COPY --from=public-api-service-build /app/node_modules/.prisma ./node_modules/.prisma
EXPOSE 4015
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s CMD wget -qO- http://127.0.0.1:4015/health || exit 1
CMD ["node", "dist/index.js"]
