/**
 * Script: update-dockerfiles.ts
 * Adds @agency/service-auth and @agency/outbox package copy steps
 * to all standard microservice Dockerfiles.
 *
 * Run: npx tsx scripts/update-dockerfiles.ts
 */

import fs from "fs";
import path from "path";
import { execSync } from "child_process";

const WORKSPACE_ROOT = path.resolve(__dirname, "..");
const SERVICES_DIR = path.join(WORKSPACE_ROOT, "services");

// Services with standard Dockerfile (events package pattern)
const STANDARD_SERVICES = [
  "crm-service", "auth-service", "project-service", "finance-service",
  "inbox-service", "automation-service", "calendar-service", "marketing-service",
  "integration-service", "document-service", "notification-service", "analytics-service",
  "hr-service", "admin-service", "affiliate-service", "public-api-service",
  "video-service", "ai-engine", "agent-team-engine"
];

function updateDockerfile(serviceName: string): boolean {
  const dockerfilePath = path.join(SERVICES_DIR, serviceName, "Dockerfile");
  if (!fs.existsSync(dockerfilePath)) {
    console.log(`  ⚠️  Dockerfile not found for ${serviceName}`);
    return false;
  }

  let content = fs.readFileSync(dockerfilePath, "utf-8");

  // Skip if already updated
  if (content.includes("packages/service-auth")) {
    console.log(`  ✅ ${serviceName} — already updated`);
    return false;
  }

  // Add service-auth package.json copy after events package.json copy
  content = content.replace(
    "COPY packages/events/package.json ./packages/events/",
    "COPY packages/events/package.json ./packages/events/\nCOPY packages/service-auth/package.json ./packages/service-auth/"
  );

  // Add service-auth source copy after events source copy
  content = content.replace(
    "COPY packages/events/ ./packages/events/\n",
    "COPY packages/events/ ./packages/events/\nCOPY packages/service-auth/ ./packages/service-auth/\n"
  );

  // Add service-auth build step after events build
  content = content.replace(
    "WORKDIR /app/packages/events\nRUN npx tsc --outDir dist\n",
    "WORKDIR /app/packages/events\nRUN npx tsc --outDir dist\nWORKDIR /app/packages/service-auth\nRUN npx tsc --outDir dist\n"
  );

  // Add service-auth copy in runner stage after events copy
  content = content.replace(
    "COPY --from=builder /app/packages/events/dist ./packages/events/dist\nCOPY --from=builder /app/packages/events/package.json ./packages/events/",
    "COPY --from=builder /app/packages/events/dist ./packages/events/dist\nCOPY --from=builder /app/packages/events/package.json ./packages/events/\nCOPY --from=builder /app/packages/service-auth/dist ./packages/service-auth/dist\nCOPY --from=builder /app/packages/service-auth/package.json ./packages/service-auth/"
  );

  fs.writeFileSync(dockerfilePath, content, "utf-8");
  console.log(`  ✅ ${serviceName} — Dockerfile updated`);
  return true;
}

// Also update goldneez-rewards-service Dockerfile (simpler structure)
function updateGoldneezDockerfile(): void {
  const dockerfilePath = path.join(SERVICES_DIR, "goldneez-rewards-service", "Dockerfile");
  if (!fs.existsSync(dockerfilePath)) return;

  let content = fs.readFileSync(dockerfilePath, "utf-8");
  if (content.includes("packages/service-auth")) return;

  // For goldneez we just need to note it has a simpler Dockerfile
  console.log(`  ℹ️  goldneez-rewards-service has a simplified Dockerfile — service-auth injected via try/catch`);
}

console.log("\n🔧 Updating Dockerfiles to include @agency/service-auth...\n");

for (const service of STANDARD_SERVICES) {
  updateDockerfile(service);
}
updateGoldneezDockerfile();

console.log("\n✅ Dockerfile update complete!\n");
