FROM node:20-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json ./
COPY packages/database/package.json ./packages/database/
COPY packages/events/package.json ./packages/events/
COPY packages/service-auth/package.json ./packages/service-auth/
COPY packages/voicebox/package.json ./packages/voicebox/
COPY services/ai-engine/package.json ./services/ai-engine/

RUN npm ci || npm install

COPY packages/database/ ./packages/database/
COPY packages/events/ ./packages/events/
COPY packages/service-auth/ ./packages/service-auth/
COPY packages/voicebox/ ./packages/voicebox/
COPY apps/web/prisma/schema.prisma ./packages/database/prisma/schema.prisma

WORKDIR /app/packages/database
RUN npx prisma generate --schema=./prisma/schema.prisma
RUN npx tsc --outDir dist
WORKDIR /app/packages/events
RUN npx tsc --outDir dist
WORKDIR /app/packages/service-auth
RUN npx tsc --outDir dist
WORKDIR /app/packages/voicebox
RUN npx tsc -p tsconfig.json --noEmit false

WORKDIR /app
COPY services/ai-engine/ ./services/ai-engine/
WORKDIR /app/services/ai-engine
RUN npx tsc --outDir dist


FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY packages/database/package.json ./packages/database/
COPY packages/events/package.json ./packages/events/
COPY services/ai-engine/package.json ./services/ai-engine/
RUN npm ci --omit=dev --workspace=@agency/ai-engine --ignore-scripts || npm install --omit=dev --workspace=@agency/ai-engine --ignore-scripts

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/packages/database/dist ./packages/database/dist
COPY --from=builder /app/packages/database/package.json ./packages/database/
COPY --from=builder /app/packages/events/dist ./packages/events/dist
COPY --from=builder /app/packages/events/package.json ./packages/events/
COPY --from=builder /app/packages/voicebox/dist ./packages/voicebox/dist
COPY --from=builder /app/packages/voicebox/package.json ./packages/voicebox/
COPY --from=builder /app/services/ai-engine/dist ./dist
COPY --from=builder /app/services/ai-engine/package.json ./
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

EXPOSE 4004
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s CMD wget -qO- http://127.0.0.1:4004/health || exit 1
CMD ["node", "dist/index.js"]
