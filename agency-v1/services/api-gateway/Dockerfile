FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
COPY services/api-gateway/package.json ./services/api-gateway/
RUN npm ci --workspace=services/api-gateway
COPY services/api-gateway/ ./services/api-gateway/
RUN npm run build --workspace=services/api-gateway

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/services/api-gateway/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=5s CMD wget -qO- http://localhost:8080/health || exit 1
CMD ["node", "dist/index.js"]
