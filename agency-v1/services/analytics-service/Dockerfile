FROM node:20-alpine AS base
WORKDIR /app
RUN npm install -g pnpm turbo

FROM base AS builder
COPY . .
RUN turbo prune --scope=@agency/analytics-service --docker

FROM base AS installer
COPY --from=builder /app/out/json/ .
RUN pnpm install --frozen-lockfile

COPY --from=builder /app/out/full/ .
COPY turbo.json turbo.json
RUN pnpm turbo run build --filter=@agency/analytics-service...

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN apk add --no-cache curl

COPY --from=installer /app/node_modules ./node_modules
COPY --from=installer /app/services/analytics-service/dist ./dist
COPY --from=installer /app/services/analytics-service/package.json ./package.json

EXPOSE 4013
CMD ["node", "dist/index.js"]
