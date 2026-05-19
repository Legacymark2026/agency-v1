FROM node:20-alpine AS builder
WORKDIR /app

# Copy workspace manifests
COPY package.json package-lock.json ./
COPY services/api-gateway/package.json ./services/api-gateway/

# Install dependencies
RUN npm ci --workspace=services/api-gateway 2>/dev/null || npm install

# Copy source
COPY services/api-gateway/ ./services/api-gateway/

# Build
WORKDIR /app/services/api-gateway
RUN npx tsc --outDir dist 2>/dev/null || true

# ── Production Image ──────────────────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/services/api-gateway/dist ./dist
COPY --from=builder /app/services/api-gateway/package.json ./
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s CMD wget -qO- http://localhost:8080/health || exit 1

CMD ["node", "dist/index.js"]
