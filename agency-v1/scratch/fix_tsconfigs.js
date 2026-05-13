const fs = require('fs');
const path = require('path');

// These 9 services have broken tsconfig that extends base (which has noEmit: true)
// The fix: use standalone tsconfig matching the working pattern from auth/crm services
const services = [
  'video-service',
  'calendar-service',
  'marketing-service',
  'integration-service',
  'document-service',
  'agent-team-engine',
  'analytics-service',
  'admin-service',
  'public-api-service',
];

const tsconfig = {
  compilerOptions: {
    target: "ES2022",
    module: "commonjs",
    lib: ["ES2022"],
    outDir: "./dist",
    rootDir: "./src",
    strict: true,
    noImplicitAny: false,
    esModuleInterop: true,
    skipLibCheck: true,
    forceConsistentCasingInFileNames: true,
    resolveJsonModule: true,
    declaration: true,
    sourceMap: true
  },
  include: ["src/**/*"],
  exclude: ["node_modules", "dist"]
};

services.forEach(svc => {
  const tsconfigPath = path.join(__dirname, '..', 'services', svc, 'tsconfig.json');
  fs.writeFileSync(tsconfigPath, JSON.stringify(tsconfig, null, 2) + '\n');
  console.log(`✓ ${svc}/tsconfig.json`);
});

console.log(`\n══ ${services.length} tsconfig files fixed ══`);
