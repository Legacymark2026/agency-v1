FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
COPY packages/database/package.json ./packages/database/
COPY packages/events/package.json ./packages/events/
COPY services/admin-service/package.json ./services/admin-service/
RUN npm ci --workspace=packages/database --workspace=packages/events --workspace=services/admin-service
COPY packages/ ./packages/
COPY services/admin-service/ ./services/admin-service/
RUN npx prisma generate --schema=packages/database/prisma/schema.prisma
RUN npm run build --workspace=packages/database && npm run build --workspace=packages/events && npm run build --workspace=services/admin-service

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN apk add --no-cache curl
COPY --from=builder /app/packages/database/dist ./packages/database/dist
COPY --from=builder /app/packages/database/package.json ./packages/database/
COPY --from=builder /app/packages/events/dist ./packages/events/dist
COPY --from=builder /app/packages/events/package.json ./packages/events/
COPY --from=builder /app/services/admin-service/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/services/admin-service/package.json ./package.json
EXPOSE 4014
HEALTHCHECK --interval=30s --timeout=5s CMD curl -f http://localhost:4014/health || exit 1
CMD ["node", "dist/index.js"]
