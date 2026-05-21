# ══════════════════════════════════════════════════════════════════════════════
# LegacyMark — Next.js Web App Dockerfile
# ══════════════════════════════════════════════════════════════════════════════
# Build context should be the monorepo root directory.

FROM node:20-alpine AS base
WORKDIR /app
RUN apk add --no-cache git openssl

# Copy root workspace manifests and configs
COPY package*.json turbo.json tsconfig*.json ./
COPY packages/database/package.json ./packages/database/
COPY packages/events/package.json ./packages/events/
COPY packages/rbac/package.json ./packages/rbac/
COPY packages/video-agent/package.json ./packages/video-agent/
COPY packages/video-editor/package.json ./packages/video-editor/
COPY apps/web/package.json ./apps/web/

# Install dependencies
RUN npm ci --ignore-scripts || npm install --ignore-scripts

# Copy shared packages
COPY packages/database/ ./packages/database/
COPY packages/events/ ./packages/events/
COPY packages/rbac/ ./packages/rbac/
COPY packages/video-agent/ ./packages/video-agent/
COPY packages/video-editor/ ./packages/video-editor/

# Copy web files
COPY apps/web/ ./apps/web/

# Generate Prisma client using schema in web app
WORKDIR /app/apps/web
RUN npx prisma generate

# Build Next.js app using turbo from the root
WORKDIR /app
RUN NODE_OPTIONS="--max-old-space-size=4096" npx turbo build --filter=web

# Runner stage
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Copy output files (standalone)
COPY --from=base /app/apps/web/.next/standalone/ ./apps/web/
COPY --from=base /app/apps/web/public ./apps/web/public
COPY --from=base /app/apps/web/prisma ./apps/web/prisma
COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/packages ./packages

EXPOSE 3000
WORKDIR /app/apps/web
CMD ["node", "server.js"]
