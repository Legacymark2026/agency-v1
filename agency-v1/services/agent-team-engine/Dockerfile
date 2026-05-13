FROM node:20-alpine AS base
WORKDIR /app
RUN npm install -g pnpm turbo

FROM base AS builder
COPY . .
RUN turbo prune --scope=@agency/agent-team-engine --docker

FROM base AS installer
COPY --from=builder /app/out/json/ .
RUN pnpm install --frozen-lockfile

COPY --from=builder /app/out/full/ .
COPY turbo.json turbo.json
RUN pnpm turbo run build --filter=@agency/agent-team-engine...

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN apk add --no-cache curl

COPY --from=installer /app/node_modules ./node_modules
COPY --from=installer /app/services/agent-team-engine/dist ./dist
COPY --from=installer /app/services/agent-team-engine/package.json ./package.json

EXPOSE 4012
CMD ["node", "dist/index.js"]
