FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
COPY packages/database/package.json ./packages/database/
COPY packages/events/package.json ./packages/events/
COPY services/ai-engine/package.json ./services/ai-engine/
RUN npm ci --workspace=packages/database --workspace=packages/events --workspace=services/ai-engine
COPY packages/ ./packages/
COPY services/ai-engine/ ./services/ai-engine/
RUN npx prisma generate --schema=packages/database/prisma/schema.prisma
RUN npm run build --workspace=packages/database && npm run build --workspace=packages/events && npm run build --workspace=services/ai-engine

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/packages/database/dist ./packages/database/dist
COPY --from=builder /app/packages/database/package.json ./packages/database/
COPY --from=builder /app/packages/events/dist ./packages/events/dist
COPY --from=builder /app/packages/events/package.json ./packages/events/
COPY --from=builder /app/services/ai-engine/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
EXPOSE 4004
HEALTHCHECK --interval=30s --timeout=5s CMD wget -qO- http://localhost:4004/health || exit 1
CMD ["node", "dist/index.js"]
