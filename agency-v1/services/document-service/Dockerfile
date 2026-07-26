FROM node:20-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json tsconfig*.json ./
COPY packages/database/package.json ./packages/database/
COPY packages/events/package.json ./packages/events/
COPY packages/service-auth/package.json ./packages/service-auth/
COPY packages/grpc/package.json ./packages/grpc/
COPY packages/observability/package.json ./packages/observability/
COPY services/document-service/package.json ./services/document-service/

RUN npm ci || npm install

COPY packages/database/ ./packages/database/
COPY packages/events/ ./packages/events/
COPY packages/service-auth/ ./packages/service-auth/
COPY packages/grpc/ ./packages/grpc/
COPY packages/observability/ ./packages/observability/
COPY apps/web/prisma/schema.prisma ./packages/database/prisma/schema.prisma

WORKDIR /app/packages/database
RUN npx prisma generate --schema=./prisma/schema.prisma
RUN npx tsc --outDir dist
WORKDIR /app/packages/events
RUN npx tsc --outDir dist
WORKDIR /app/packages/service-auth
RUN npx tsc --outDir dist
WORKDIR /app/packages/grpc
RUN npm run build
WORKDIR /app/packages/observability
RUN npx tsc --outDir dist

WORKDIR /app
COPY services/document-service/ ./services/document-service/
WORKDIR /app/services/document-service
RUN npx tsc --outDir dist

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/packages/database/dist ./packages/database/dist
COPY --from=builder /app/packages/database/package.json ./packages/database/
COPY --from=builder /app/packages/events/dist ./packages/events/dist
COPY --from=builder /app/packages/events/package.json ./packages/events/
COPY --from=builder /app/packages/service-auth/dist ./packages/service-auth/dist
COPY --from=builder /app/packages/service-auth/package.json ./packages/service-auth/
COPY --from=builder /app/packages/grpc/dist ./packages/grpc/dist
COPY --from=builder /app/packages/grpc/package.json ./packages/grpc/
COPY --from=builder /app/packages/observability/dist ./packages/observability/dist
COPY --from=builder /app/packages/observability/package.json ./packages/observability/
COPY --from=builder /app/services/document-service/dist ./dist
COPY --from=builder /app/services/document-service/package.json ./
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 4011
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s CMD wget -qO- http://127.0.0.1:4011/health || exit 1
CMD ["node", "dist/index.js"]
