FROM node:20-alpine AS builder
WORKDIR /app

# Copy workspace dependency manifests
COPY package.json package-lock.json ./
COPY packages/database/package.json ./packages/database/
COPY packages/events/package.json ./packages/events/
COPY services/auth-service/package.json ./services/auth-service/

# Install all dependencies
RUN npm ci --workspace=packages/database --workspace=packages/events --workspace=services/auth-service

# Copy source code
COPY packages/database/ ./packages/database/
COPY packages/events/ ./packages/events/
COPY services/auth-service/ ./services/auth-service/

# Generate Prisma client
RUN npx prisma generate --schema=packages/database/prisma/schema.prisma

# Build
RUN npm run build --workspace=packages/database
RUN npm run build --workspace=packages/events
RUN npm run build --workspace=services/auth-service

# ── Production Image ──────────────────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Copy built artifacts
COPY --from=builder /app/packages/database/dist ./packages/database/dist
COPY --from=builder /app/packages/database/package.json ./packages/database/
COPY --from=builder /app/packages/database/prisma ./packages/database/prisma
COPY --from=builder /app/packages/events/dist ./packages/events/dist
COPY --from=builder /app/packages/events/package.json ./packages/events/
COPY --from=builder /app/services/auth-service/dist ./services/auth-service/dist
COPY --from=builder /app/services/auth-service/package.json ./services/auth-service/
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 4001
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s CMD wget -qO- http://localhost:4001/health || exit 1

CMD ["node", "services/auth-service/dist/index.js"]
