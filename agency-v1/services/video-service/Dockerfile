FROM node:20-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json ./
COPY packages/database/package.json ./packages/database/
COPY packages/events/package.json ./packages/events/
COPY packages/service-auth/package.json ./packages/service-auth/
COPY services/video-service/package.json ./services/video-service/

RUN npm ci || npm install

COPY packages/database/ ./packages/database/
COPY packages/events/ ./packages/events/
COPY packages/service-auth/ ./packages/service-auth/
COPY apps/web/prisma/schema.prisma ./packages/database/prisma/schema.prisma

WORKDIR /app/packages/database
RUN npx prisma generate --schema=./prisma/schema.prisma
RUN npx tsc --outDir dist
WORKDIR /app/packages/events
RUN npx tsc --outDir dist
WORKDIR /app/packages/service-auth
RUN npx tsc --outDir dist

WORKDIR /app
COPY services/video-service/ ./services/video-service/
WORKDIR /app/services/video-service
RUN npx tsc --outDir dist


FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY packages/database/package.json ./packages/database/
COPY packages/events/package.json ./packages/events/
COPY packages/service-auth/package.json ./packages/service-auth/
COPY services/video-service/package.json ./services/video-service/
RUN npm ci --omit=dev --workspace=@agency/video-service --ignore-scripts || npm install --omit=dev --workspace=@agency/video-service --ignore-scripts

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Install FFmpeg for real video rendering
RUN apk add --no-cache ffmpeg

COPY --from=builder /app/packages/database/dist ./packages/database/dist
COPY --from=builder /app/packages/database/package.json ./packages/database/
COPY --from=builder /app/packages/events/dist ./packages/events/dist
COPY --from=builder /app/packages/events/package.json ./packages/events/
COPY --from=builder /app/packages/service-auth/dist ./packages/service-auth/dist
COPY --from=builder /app/packages/service-auth/package.json ./packages/service-auth/
COPY --from=builder /app/services/video-service/dist ./dist
COPY --from=builder /app/services/video-service/package.json ./
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# Create output directory for rendered videos
RUN mkdir -p /app/renders

EXPOSE 4007
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s CMD wget -qO- http://127.0.0.1:4007/health || exit 1
CMD ["node", "dist/index.js"]
