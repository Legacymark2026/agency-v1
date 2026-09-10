FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json tsconfig*.json ./
COPY packages/database/package.json ./packages/database/
COPY packages/events/package.json ./packages/events/
COPY packages/observability/package.json ./packages/observability/
COPY packages/service-auth/package.json ./packages/service-auth/
COPY services/audit-security-service/package.json ./services/audit-security-service/
RUN npm ci --workspace=packages/database --workspace=packages/events --workspace=packages/observability --workspace=packages/service-auth --workspace=services/audit-security-service
COPY apps/web/prisma/schema.prisma ./packages/database/prisma/schema.prisma
RUN npx prisma generate --schema=./packages/database/prisma/schema.prisma
COPY packages/ ./packages/
COPY services/audit-security-service/ ./services/audit-security-service/
WORKDIR /app/services/audit-security-service
RUN npx tsc --outDir dist

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY package.json package-lock.json ./
COPY packages/database/package.json ./packages/database/
COPY packages/events/package.json ./packages/events/
COPY packages/observability/package.json ./packages/observability/
COPY packages/service-auth/package.json ./packages/service-auth/
COPY services/audit-security-service/package.json ./services/audit-security-service/
RUN npm ci --omit=dev --workspace=packages/database --workspace=packages/events --workspace=packages/observability --workspace=packages/service-auth --workspace=services/audit-security-service
COPY --from=builder /app/packages/database ./packages/database
COPY --from=builder /app/packages/events ./packages/events
COPY --from=builder /app/packages/observability ./packages/observability
COPY --from=builder /app/packages/service-auth ./packages/service-auth
COPY --from=builder /app/services/audit-security-service/dist ./services/audit-security-service/dist
WORKDIR /app/services/audit-security-service
EXPOSE 4030
CMD ["node", "dist/index.js"]
