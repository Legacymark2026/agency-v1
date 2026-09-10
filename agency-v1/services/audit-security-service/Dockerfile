FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json turbo.json ./
COPY packages/database/package.json ./packages/database/
COPY packages/events/package.json ./packages/events/
COPY packages/observability/package.json ./packages/observability/
COPY packages/service-auth/package.json ./packages/service-auth/
COPY services/audit-security-service/package.json ./services/audit-security-service/
RUN npm ci || npm install

FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY package*.json turbo.json ./
COPY packages/database/ ./packages/database/
COPY packages/events/ ./packages/events/
COPY packages/observability/ ./packages/observability/
COPY packages/service-auth/ ./packages/service-auth/
COPY apps/web/prisma/schema.prisma ./packages/database/prisma/schema.prisma
WORKDIR /app/packages/database
RUN npx prisma generate --schema=./prisma/schema.prisma
RUN npx tsc --outDir dist
WORKDIR /app/packages/events
RUN npx tsc --outDir dist
WORKDIR /app/packages/observability
RUN npx tsc --outDir dist
WORKDIR /app/packages/service-auth
RUN npx tsc --outDir dist
WORKDIR /app
COPY services/audit-security-service/ ./services/audit-security-service/
WORKDIR /app/services/audit-security-service
RUN npx tsc --outDir dist

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/database ./packages/database
COPY --from=builder /app/packages/events ./packages/events
COPY --from=builder /app/packages/observability/dist ./packages/observability/dist
COPY --from=builder /app/packages/observability/package.json ./packages/observability/
COPY --from=builder /app/packages/service-auth/dist ./packages/service-auth/dist
COPY --from=builder /app/packages/service-auth/package.json ./packages/service-auth/
COPY --from=builder /app/services/audit-security-service/dist ./dist
COPY --from=builder /app/services/audit-security-service/package.json ./package.json
EXPOSE 4030
HEALTHCHECK --interval=15s --timeout=5s --start-period=10s CMD wget -qO- http://127.0.0.1:4030/health || exit 1
CMD ["node", "dist/index.js"]
