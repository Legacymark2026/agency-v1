const fs = require('fs');
const path = require('path');

const services = [
  { name: 'video-service', port: 4007 },
  { name: 'calendar-service', port: 4008 },
  { name: 'marketing-service', port: 4009 },
  { name: 'integration-service', port: 4010 },
  { name: 'document-service', port: 4011 },
  { name: 'agent-team-engine', port: 4012 },
  { name: 'analytics-service', port: 4013 },
  { name: 'admin-service', port: 4014 },
  { name: 'public-api-service', port: 4015 }
];

services.forEach(svc => {
  const dockerfilePath = path.join(__dirname, '..', 'services', svc.name, 'Dockerfile');
  
  const content = `FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
COPY packages/database/package.json ./packages/database/
COPY packages/events/package.json ./packages/events/
COPY services/${svc.name}/package.json ./services/${svc.name}/
RUN npm ci --workspace=packages/database --workspace=packages/events --workspace=services/${svc.name}
COPY packages/ ./packages/
COPY services/${svc.name}/ ./services/${svc.name}/
RUN npx prisma generate --schema=packages/database/prisma/schema.prisma
RUN npm run build --workspace=packages/database && npm run build --workspace=packages/events && npm run build --workspace=services/${svc.name}

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN apk add --no-cache curl
COPY --from=builder /app/packages/database/dist ./packages/database/dist
COPY --from=builder /app/packages/database/package.json ./packages/database/
COPY --from=builder /app/packages/events/dist ./packages/events/dist
COPY --from=builder /app/packages/events/package.json ./packages/events/
COPY --from=builder /app/services/${svc.name}/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/services/${svc.name}/package.json ./package.json
EXPOSE ${svc.port}
HEALTHCHECK --interval=30s --timeout=5s CMD curl -f http://localhost:${svc.port}/health || exit 1
CMD ["node", "dist/index.js"]
`;

  fs.writeFileSync(dockerfilePath, content);
  console.log(`Fixed Dockerfile for ${svc.name}`);
});
