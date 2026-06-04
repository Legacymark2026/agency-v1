FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
COPY services/goldneez-rewards-service/package.json ./services/goldneez-rewards-service/
RUN npm ci || npm install
COPY services/goldneez-rewards-service/ ./services/goldneez-rewards-service/
WORKDIR /app/services/goldneez-rewards-service
RUN npx tsc --outDir dist

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY services/goldneez-rewards-service/package.json ./
COPY --from=builder /app/services/goldneez-rewards-service/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
EXPOSE 4020
CMD ["node", "dist/index.js"]
