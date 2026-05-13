const fs = require('fs');
const path = require('path');

// ── Standardized Dockerfile Template ─────────────────────────────────────────
// All services follow the SAME pattern:
//   - Multi-stage build (builder → runner)
//   - npm ci for deterministic installs
//   - Prisma generate for DB access
//   - Consistent output paths: services/<name>/dist/index.js
//   - wget-based healthcheck (available in alpine without extra packages)

const services = [
  { name: 'auth-service',       port: 4001 },
  { name: 'crm-service',        port: 4002 },
  { name: 'automation-service',  port: 4003 },
  { name: 'ai-engine',          port: 4004 },
  { name: 'inbox-service',      port: 4005 },
  { name: 'finance-service',    port: 4006 },
  { name: 'video-service',      port: 4007 },
  { name: 'calendar-service',   port: 4008 },
  { name: 'marketing-service',  port: 4009 },
  { name: 'integration-service', port: 4010 },
  { name: 'document-service',   port: 4011 },
  { name: 'agent-team-engine',  port: 4012 },
  { name: 'analytics-service',  port: 4013 },
  { name: 'admin-service',      port: 4014 },
  { name: 'public-api-service', port: 4015 },
];

// API Gateway is special (no database dependency, different port)
const gatewayDockerfile = `FROM node:20-alpine AS builder
WORKDIR /app

# Copy workspace manifests
COPY package.json package-lock.json ./
COPY services/api-gateway/package.json ./services/api-gateway/

# Install dependencies
RUN npm ci --workspace=services/api-gateway

# Copy source
COPY services/api-gateway/ ./services/api-gateway/

# Build
RUN npm run build --workspace=services/api-gateway

# ── Production Image ──────────────────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/services/api-gateway/dist ./services/api-gateway/dist
COPY --from=builder /app/services/api-gateway/package.json ./services/api-gateway/
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s CMD wget -qO- http://localhost:8080/health || exit 1

CMD ["node", "services/api-gateway/dist/index.js"]
`;

function generateDockerfile(svc) {
  return `FROM node:20-alpine AS builder
WORKDIR /app

# Copy workspace manifests
COPY package.json package-lock.json ./
COPY packages/database/package.json ./packages/database/
COPY packages/events/package.json ./packages/events/
COPY services/${svc.name}/package.json ./services/${svc.name}/

# Install dependencies
RUN npm ci --workspace=packages/database --workspace=packages/events --workspace=services/${svc.name}

# Copy source
COPY packages/database/ ./packages/database/
COPY packages/events/ ./packages/events/
COPY services/${svc.name}/ ./services/${svc.name}/

# Generate Prisma client
RUN npx prisma generate --schema=packages/database/prisma/schema.prisma

# Build
RUN npm run build --workspace=packages/database
RUN npm run build --workspace=packages/events
RUN npm run build --workspace=services/${svc.name}

# ── Production Image ──────────────────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/packages/database/dist ./packages/database/dist
COPY --from=builder /app/packages/database/package.json ./packages/database/
COPY --from=builder /app/packages/database/prisma ./packages/database/prisma
COPY --from=builder /app/packages/events/dist ./packages/events/dist
COPY --from=builder /app/packages/events/package.json ./packages/events/
COPY --from=builder /app/services/${svc.name}/dist ./services/${svc.name}/dist
COPY --from=builder /app/services/${svc.name}/package.json ./services/${svc.name}/
COPY --from=builder /app/node_modules ./node_modules

EXPOSE ${svc.port}
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s CMD wget -qO- http://localhost:${svc.port}/health || exit 1

CMD ["node", "services/${svc.name}/dist/index.js"]
`;
}

// Write all service Dockerfiles
let count = 0;
services.forEach(svc => {
  const dockerfilePath = path.join(__dirname, '..', 'services', svc.name, 'Dockerfile');
  const content = generateDockerfile(svc);
  fs.writeFileSync(dockerfilePath, content);
  console.log(`✓ ${svc.name} (port ${svc.port})`);
  count++;
});

// Write API Gateway Dockerfile
const gwPath = path.join(__dirname, '..', 'services', 'api-gateway', 'Dockerfile');
fs.writeFileSync(gwPath, gatewayDockerfile);
console.log(`✓ api-gateway (port 8080)`);
count++;

console.log(`\n══ ${count} Dockerfiles standardized ══`);
