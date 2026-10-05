FROM node:20-alpine AS base
WORKDIR /app

RUN apk add --no-cache curl wget

COPY package*.json ./
COPY packages/ ./packages/
COPY services/policy-service/package*.json ./services/policy-service/

RUN npm install --workspace=@agency/policy-service --include-workspace-root=false

COPY services/policy-service/ ./services/policy-service/

WORKDIR /app/services/policy-service
RUN npx tsc || true

EXPOSE 4050
CMD ["npm", "start"]
