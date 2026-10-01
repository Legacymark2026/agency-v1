const fs = require('fs');
const path = require('path');

const servicesDir = path.join(__dirname, '../services');

const dirs = fs.readdirSync(servicesDir);

for (const dir of dirs) {
  const dockerfilePath = path.join(servicesDir, dir, 'Dockerfile');
  if (!fs.existsSync(dockerfilePath)) continue;

  let content = fs.readFileSync(dockerfilePath, 'utf-8');

  // Skip if already contains vault-client
  if (content.includes('packages/vault-client')) {
    continue;
  }

  // 1. In AS builder, under COPY packages/database/package.json
  content = content.replace(
    'COPY packages/database/package.json ./packages/database/',
    'COPY packages/vault-client/package.json ./packages/vault-client/\nCOPY packages/database/package.json ./packages/database/'
  );

  // 2. In AS builder, under COPY packages/database/
  content = content.replace(
    'COPY packages/database/ ./packages/database/',
    'COPY packages/vault-client/ ./packages/vault-client/\nCOPY packages/database/ ./packages/database/'
  );

  // 3. Build vault-client before database
  content = content.replace(
    'WORKDIR /app/packages/database\nRUN npx prisma generate',
    'WORKDIR /app/packages/vault-client\nRUN npx tsc --outDir dist\nWORKDIR /app/packages/database\nRUN npx prisma generate'
  );

  // 4. In AS deps, under COPY packages/database/package.json
  content = content.replace(
    /FROM node:20-alpine AS deps\nWORKDIR \/app\nCOPY package.json package-lock.json .\/\nCOPY packages\/database\/package.json .\/packages\/database\//,
    'FROM node:20-alpine AS deps\nWORKDIR /app\nCOPY package.json package-lock.json ./\nCOPY packages/vault-client/package.json ./packages/vault-client/\nCOPY packages/database/package.json ./packages/database/'
  );
  // fallback for deps stage if the first one didn't match
  if (!content.includes('COPY packages/vault-client/package.json ./packages/vault-client/') && content.includes('AS deps')) {
    content = content.replace(
      'COPY packages/database/package.json ./packages/database/',
      'COPY packages/vault-client/package.json ./packages/vault-client/\nCOPY packages/database/package.json ./packages/database/'
    );
  }

  // 5. In AS runner, under COPY --from=builder /app/packages/database/dist
  content = content.replace(
    'COPY --from=builder /app/packages/database/dist ./packages/database/dist',
    'COPY --from=builder /app/packages/vault-client/dist ./packages/vault-client/dist\nCOPY --from=builder /app/packages/database/dist ./packages/database/dist'
  );
  
  content = content.replace(
    'COPY --from=builder /app/packages/database/package.json ./packages/database/',
    'COPY --from=builder /app/packages/vault-client/package.json ./packages/vault-client/\nCOPY --from=builder /app/packages/database/package.json ./packages/database/'
  );

  fs.writeFileSync(dockerfilePath, content);
  console.log(`Patched ${dockerfilePath}`);
}
