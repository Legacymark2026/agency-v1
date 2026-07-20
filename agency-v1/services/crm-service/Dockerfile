FROM node:20-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json ./
COPY packages/database/package.json ./packages/database/
COPY packages/events/package.json ./packages/events/
COPY packages/grpc/package.json ./packages/grpc/
COPY packages/observability/package.json ./packages/observability/
COPY services/crm-service/package.json ./services/crm-service/

RUN npm ci || npm install

COPY packages/database/ ./packages/database/
COPY packages/events/ ./packages/events/
COPY packages/grpc/ ./packages/grpc/
COPY packages/observability/ ./packages/observability/
COPY apps/web/prisma/schema.prisma ./packages/database/prisma/schema.prisma

WORKDIR /app/packages/database
RUN npx prisma generate --schema=./prisma/schema.prisma
RUN npx tsc --outDir dist
WORKDIR /app/packages/events
RUN npx tsc --outDir dist
WORKDIR /app/packages/grpc
RUN npm run build
WORKDIR /app/packages/observability
RUN npx tsc --outDir dist

WORKDIR /app
COPY services/crm-service/ ./services/crm-service/
WORKDIR /app/services/crm-service
RUN npx tsc --outDir dist


FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY packages/database/package.json ./packages/database/
COPY packages/events/package.json ./packages/events/
COPY packages/grpc/package.json ./packages/grpc/
COPY packages/observability/package.json ./packages/observability/
COPY services/crm-service/package.json ./services/crm-service/
RUN npm ci --omit=dev --ignore-scripts || npm install --omit=dev --ignore-scripts

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/packages/database/dist ./packages/database/dist
COPY --from=builder /app/packages/database/package.json ./packages/database/
COPY --from=builder /app/packages/events/dist ./packages/events/dist
COPY --from=builder /app/packages/events/package.json ./packages/events/
COPY --from=builder /app/packages/grpc/dist ./packages/grpc/dist
COPY --from=builder /app/packages/grpc/package.json ./packages/grpc/
COPY --from=builder /app/packages/observability/dist ./packages/observability/dist
COPY --from=builder /app/packages/observability/package.json ./packages/observability/
COPY --from=builder /app/services/crm-service/dist ./dist
COPY --from=builder /app/services/crm-service/package.json ./
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

EXPOSE 4002
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s CMD wget -qO- http://127.0.0.1:4002/health || exit 1
CMD ["node", "dist/index.js"]
