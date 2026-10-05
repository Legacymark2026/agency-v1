FROM node:20-alpine AS base
WORKDIR /app

RUN apk add --no-cache curl wget

COPY package*.json ./
COPY packages/ ./packages/
COPY services/authorization-service/package*.json ./services/authorization-service/

RUN npm install --workspace=@agency/authorization-service --include-workspace-root=false

COPY services/authorization-service/ ./services/authorization-service/

WORKDIR /app/services/authorization-service
RUN npx tsc || true

EXPOSE 4055
CMD ["npm", "start"]
