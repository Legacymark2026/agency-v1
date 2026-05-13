FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
COPY packages/database/package.json ./packages/database/
COPY packages/events/package.json ./packages/events/
COPY services/calendar-service/package.json ./services/calendar-service/
RUN npm ci --workspace=packages/database --workspace=packages/events --workspace=services/calendar-service
COPY packages/ ./packages/
COPY services/calendar-service/ ./services/calendar-service/
RUN npx prisma generate --schema=packages/database/prisma/schema.prisma
RUN npm run build --workspace=packages/database && npm run build --workspace=packages/events && npm run build --workspace=services/calendar-service

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN apk add --no-cache curl
COPY --from=builder /app/packages/database/dist ./packages/database/dist
COPY --from=builder /app/packages/database/package.json ./packages/database/
COPY --from=builder /app/packages/events/dist ./packages/events/dist
COPY --from=builder /app/packages/events/package.json ./packages/events/
COPY --from=builder /app/services/calendar-service/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/services/calendar-service/package.json ./package.json
EXPOSE 4008
HEALTHCHECK --interval=30s --timeout=5s CMD curl -f http://localhost:4008/health || exit 1
CMD ["node", "dist/index.js"]
