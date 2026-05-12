FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
COPY packages/database/package.json ./packages/database/
COPY packages/events/package.json ./packages/events/
COPY services/automation-service/package.json ./services/automation-service/
RUN npm ci --workspace=packages/database --workspace=packages/events --workspace=services/automation-service
COPY packages/ ./packages/
COPY services/automation-service/ ./services/automation-service/
RUN npx prisma generate --schema=packages/database/prisma/schema.prisma
RUN npm run build --workspace=packages/database && npm run build --workspace=packages/events && npm run build --workspace=services/automation-service

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/packages/database/dist ./packages/database/dist
COPY --from=builder /app/packages/database/package.json ./packages/database/
COPY --from=builder /app/packages/events/dist ./packages/events/dist
COPY --from=builder /app/packages/events/package.json ./packages/events/
COPY --from=builder /app/services/automation-service/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
EXPOSE 4003
HEALTHCHECK --interval=30s --timeout=5s CMD wget -qO- http://localhost:4003/health || exit 1
CMD ["node", "dist/index.js"]
