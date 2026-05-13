FROM node:20-alpine AS builder
WORKDIR /app

# Copy workspace manifests
COPY package.json package-lock.json ./
COPY packages/database/package.json ./packages/database/
COPY packages/events/package.json ./packages/events/
COPY services/video-service/package.json ./services/video-service/

# Install dependencies
RUN npm ci --workspace=packages/database --workspace=packages/events --workspace=services/video-service

# Copy source
COPY packages/database/ ./packages/database/
COPY packages/events/ ./packages/events/
COPY services/video-service/ ./services/video-service/

# Generate Prisma client
RUN npx prisma generate --schema=packages/database/prisma/schema.prisma

# Build
RUN npm run build --workspace=packages/database
RUN npm run build --workspace=packages/events
RUN npm run build --workspace=services/video-service

# ── Production Image ──────────────────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/packages/database/dist ./packages/database/dist
COPY --from=builder /app/packages/database/package.json ./packages/database/
COPY --from=builder /app/packages/database/prisma ./packages/database/prisma
COPY --from=builder /app/packages/events/dist ./packages/events/dist
COPY --from=builder /app/packages/events/package.json ./packages/events/
COPY --from=builder /app/services/video-service/dist ./services/video-service/dist
COPY --from=builder /app/services/video-service/package.json ./services/video-service/
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 4007
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s CMD wget -qO- http://localhost:4007/health || exit 1

CMD ["node", "services/video-service/dist/index.js"]
