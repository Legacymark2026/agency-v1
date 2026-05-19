FROM node:20-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json ./
COPY packages/database/package.json ./packages/database/
COPY packages/events/package.json ./packages/events/
COPY services/integration-service/package.json ./services/integration-service/

RUN npm ci 2>/dev/null || npm install

COPY packages/database/ ./packages/database/
COPY packages/events/ ./packages/events/
COPY apps/web/prisma/schema.prisma ./packages/database/prisma/schema.prisma

WORKDIR /app/packages/database
RUN npx prisma generate --schema=./prisma/schema.prisma 2>/dev/null || true
RUN npx tsc --outDir dist 2>/dev/null || true
WORKDIR /app/packages/events
RUN npx tsc --outDir dist 2>/dev/null || true

WORKDIR /app
COPY services/integration-service/ ./services/integration-service/
WORKDIR /app/services/integration-service
RUN npx tsc --outDir dist 2>/dev/null || true

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/packages/database/dist ./packages/database/dist
COPY --from=builder /app/packages/database/package.json ./packages/database/
COPY --from=builder /app/packages/events/dist ./packages/events/dist
COPY --from=builder /app/packages/events/package.json ./packages/events/
COPY --from=builder /app/services/integration-service/dist ./dist
COPY --from=builder /app/services/integration-service/package.json ./
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 4010
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s CMD wget -qO- http://localhost:4010/health || exit 1
CMD ["node", "dist/index.js"]
