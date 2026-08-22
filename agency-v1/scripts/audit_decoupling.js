// scripts/audit_decoupling.js
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const servicesDir = path.resolve(ROOT, 'services');
const brainDir = path.resolve(ROOT, '../../brain/cc81cadc-3e41-49bc-b355-4225cbbe56ff');
const auditReportPath = fs.existsSync(brainDir) 
  ? path.resolve(brainDir, 'decoupling_audit_results.md') 
  : path.resolve(ROOT, 'decoupling_audit_results.md');

const expectedServices = [
  "admin-service", "affiliate-service", "agent-team-engine", "ai-engine", "analytics-service",
  "api-gateway", "auth-service", "automation-service", "calendar-service", "crm-service",
  "document-service", "finance-service", "goldneez-rewards-service", "hr-service", "inbox-service",
  "integration-service", "marketing-service", "notification-service", "pos-service",
  "project-service", "public-api-service", "video-service"
];

function run() {
  console.log("🔍 Running microservices decoupling audit...");

  const results = [];

  for (const svc of expectedServices) {
    const svcPath = path.join(servicesDir, svc);
    const indexPath = path.join(svcPath, 'src', 'index.ts');
    const dockerfilePath = path.join(svcPath, 'Dockerfile');
    const packageJsonPath = path.join(svcPath, 'package.json');

    const audit = {
      name: svc,
      hasIndex: false,
      hasPackageJson: false,
      hasDockerfile: false,
      hasRouteVersioning: false,
      hasGracefulShutdown: false,
      usesDynamicDatabase: false,
      usesGrpcContracts: false,
      usesOutboxEvents: false,
      dockerfileHasServiceAuth: false,
      score: 0,
      notes: []
    };

    if (fs.existsSync(packageJsonPath)) {
      audit.hasPackageJson = true;
      const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      const deps = { ...pkg.dependencies, ...pkg.devDependencies };

      if (deps['@agency/database']) {
        audit.usesDynamicDatabase = true;
      }
      if (deps['@agency/grpc']) {
        audit.usesGrpcContracts = true;
      }
      if (deps['@agency/outbox'] || deps['@agency/events']) {
        audit.usesOutboxEvents = true;
      }
    }

    if (fs.existsSync(indexPath)) {
      audit.hasIndex = true;
      const src = fs.readFileSync(indexPath, 'utf8');

      if (src.includes('/api/v1')) {
        audit.hasRouteVersioning = true;
      }
      if (src.includes('setupGracefulShutdown') || src.includes('SIGTERM') || src.includes('process.on')) {
        audit.hasGracefulShutdown = true;
      }
    }

    if (fs.existsSync(dockerfilePath)) {
      audit.hasDockerfile = true;
      const content = fs.readFileSync(dockerfilePath, 'utf8');
      if (content.includes('service-auth')) {
        audit.dockerfileHasServiceAuth = true;
      }
    }

    // Score calculation
    let points = 0;
    if (audit.hasRouteVersioning) points += 20;
    if (audit.hasGracefulShutdown) points += 20;
    if (audit.usesDynamicDatabase) points += 20;
    if (audit.usesGrpcContracts || audit.usesOutboxEvents) points += 20;
    if (audit.dockerfileHasServiceAuth) points += 20;

    audit.score = points;

    if (!audit.hasRouteVersioning && svc !== 'api-gateway') {
      audit.notes.push("Missing /api/v1 route versioning prefix");
    }
    if (!audit.hasGracefulShutdown) {
      audit.notes.push("Missing graceful SIGTERM shutdown handler");
    }
    if (!audit.usesDynamicDatabase && svc !== 'api-gateway') {
      audit.notes.push("Does not reference @agency/database");
    }
    if (!audit.usesGrpcContracts && !audit.usesOutboxEvents) {
      audit.notes.push("No explicit gRPC or Outbox events package references found in dependencies");
    }
    if (!audit.dockerfileHasServiceAuth && audit.hasDockerfile) {
      audit.notes.push("Dockerfile missing service-auth cache dependency steps");
    }

    results.push(audit);
  }

  // Generate markdown report
  const reportLines = [
    "# Microservices Decoupling Alignment Audit Report",
    `*Date: ${new Date().toISOString()}*`,
    "",
    "This audit report systematically evaluates the decoupling level of all 22 microservices in the monorepo based on 5 core architectural parameters:",
    "1. **Database Segregation**: Mapped to segregated databases via `@agency/database` proxy.",
    "2. **Contract-Based Communication**: Sync (gRPC) or Async (Transactional Outbox events).",
    "3. **Route Versioning**: Prefix version alignment (`/api/v1`).",
    "4. **Graceful Shutdown**: Implementation of SIGTERM traps to prevent active transaction leakage during rolling deployments.",
    "5. **Build Decoupling**: Multi-stage Docker builds incorporating standard `@agency/service-auth` blocks.",
    "",
    "## Summary Table",
    "",
    "| Microservice | Versioning (/api/v1) | Graceful Shutdown | DB Segregation | Contracts (gRPC/Events) | Docker Isolation | Score | Status |",
    "| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |"
  ];

  results.forEach(svc => {
    const check = (val) => val ? "✅" : "❌";
    const status = svc.score >= 80 ? "**COMPLIANT**" : "**ACTION REQUIRED**";
    reportLines.push(`| \`${svc.name}\` | ${check(svc.hasRouteVersioning)} | ${check(svc.hasGracefulShutdown)} | ${check(svc.usesDynamicDatabase)} | ${check(svc.usesGrpcContracts || svc.usesOutboxEvents)} | ${check(svc.dockerfileHasServiceAuth || !svc.hasDockerfile)} | ${svc.score}% | ${status} |`);
  });

  reportLines.push("", "## Detailed Audit Findings per Service", "");

  results.forEach(svc => {
    reportLines.push(`### \`${svc.name}\` (${svc.score}% Decoupled)`);
    if (svc.notes.length === 0) {
      reportLines.push("😊 *No issues found. Service complies 100% with the decoupled microservice topology.*");
    } else {
      svc.notes.forEach(note => {
        reportLines.push(`* ⚠️ ${note}`);
      });
    }
    reportLines.push("");
  });

  fs.writeFileSync(auditReportPath, reportLines.join('\n'), 'utf8');
  console.log(`✅ Decoupling audit report successfully written to: ${auditReportPath}`);
}

run();
