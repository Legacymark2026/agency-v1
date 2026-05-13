const fs = require('fs');
const path = require('path');

const services = [
  { name: 'agent-team-engine', port: 4012, desc: 'Agent Team Engine', routes: ['/api/agent', '/api/test-flow'] },
  { name: 'analytics-service', port: 4013, desc: 'Analytics Service', routes: ['/api/analytics', '/api/track'] },
  { name: 'admin-service', port: 4014, desc: 'Admin Service', routes: ['/api/admin', '/api/diagnostics', '/api/debug'] },
  { name: 'public-api-service', port: 4015, desc: 'Public API Service', routes: ['/api/v1', '/api/public', '/api/serve'] }
];

const tsConfig = `{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src",
    "moduleResolution": "node",
    "module": "commonjs",
    "target": "es2022",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}`;

services.forEach(svc => {
  const dir = path.join(__dirname, '..', 'services', svc.name);
  const srcDir = path.join(dir, 'src');
  
  if (!fs.existsSync(srcDir)) {
    fs.mkdirSync(srcDir, { recursive: true });
  }

  // package.json
  const pkg = {
    name: `@agency/${svc.name}`,
    version: "1.0.0",
    private: true,
    scripts: {
      dev: "tsx watch src/index.ts",
      build: "tsc",
      start: "node dist/index.js"
    },
    dependencies: {
      "@agency/database": "file:../../packages/database",
      "@agency/events": "file:../../packages/events",
      "express": "^5.1.0",
      "cors": "^2.8.5",
      "helmet": "^8.1.0",
      "zod": "^3.24.0",
      "ioredis": "^5.6.1"
    },
    devDependencies: {
      "@types/express": "^5.0.0",
      "@types/cors": "^2.8.17",
      "@types/node": "^20",
      "typescript": "^5",
      "tsx": "^4.21.0"
    }
  };
  fs.writeFileSync(path.join(dir, 'package.json'), JSON.stringify(pkg, null, 2));

  // tsconfig.json
  fs.writeFileSync(path.join(dir, 'tsconfig.json'), tsConfig);

  // Dockerfile
  const dockerfile = `FROM node:20-alpine AS base
WORKDIR /app
RUN npm install -g pnpm turbo

FROM base AS builder
COPY . .
RUN turbo prune --scope=@agency/${svc.name} --docker

FROM base AS installer
COPY --from=builder /app/out/json/ .
RUN pnpm install --frozen-lockfile

COPY --from=builder /app/out/full/ .
COPY turbo.json turbo.json
RUN pnpm turbo run build --filter=@agency/${svc.name}...

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN apk add --no-cache curl

COPY --from=installer /app/node_modules ./node_modules
COPY --from=installer /app/services/${svc.name}/dist ./dist
COPY --from=installer /app/services/${svc.name}/package.json ./package.json

EXPOSE ${svc.port}
CMD ["node", "dist/index.js"]
`;
  fs.writeFileSync(path.join(dir, 'Dockerfile'), dockerfile);

  // src/index.ts
  let routesStr = svc.routes.map(r => `app.use('${r}', (req, res) => { res.status(200).json({ message: '${r} handled by ${svc.name}' }); });`).join('\n');

  const indexTs = `import express from 'express';
import cors from 'cors';
import helmet from 'helmet';

const app = express();
const port = process.env.PORT || ${svc.port};

app.use(helmet());
app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: '${svc.name}' });
});

${routesStr}

app.listen(port, () => {
  console.log(\`${svc.desc} listening at http://localhost:\${port}\`);
});
`;
  fs.writeFileSync(path.join(srcDir, 'index.ts'), indexTs);
  console.log(`Scaffolded ${svc.name}`);
});
