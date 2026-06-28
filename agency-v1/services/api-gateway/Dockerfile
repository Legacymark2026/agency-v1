FROM node:20-alpine AS builder
WORKDIR /app

# Copy workspace manifests
COPY package.json package-lock.json ./
COPY packages/observability/package.json ./packages/observability/
COPY services/api-gateway/package.json ./services/api-gateway/

# Install dependencies
RUN npm ci || npm install

# Copy shared packages
COPY packages/observability/ ./packages/observability/

# Build shared packages
WORKDIR /app/packages/observability
RUN npx tsc --outDir dist

# Copy source
WORKDIR /app
COPY services/api-gateway/ ./services/api-gateway/

# Build
WORKDIR /app/services/api-gateway
RUN npx tsc --outDir dist

# ── Production Image ──────────────────────────────────────────────────────────

FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY packages/observability/package.json ./packages/observability/
COPY services/api-gateway/package.json ./services/api-gateway/
RUN npm ci --omit=dev --ignore-scripts || npm install --omit=dev --ignore-scripts

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/packages/observability/dist ./packages/observability/dist
COPY --from=builder /app/packages/observability/package.json ./packages/observability/
COPY --from=builder /app/services/api-gateway/dist ./dist
COPY --from=builder /app/services/api-gateway/package.json ./
COPY --from=deps /app/node_modules ./node_modules

EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s CMD wget -qO- http://127.0.0.1:8080/health || exit 1

CMD ["node", "dist/index.js"]
