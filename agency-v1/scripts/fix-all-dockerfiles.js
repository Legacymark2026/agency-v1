const fs = require("fs");
const path = require("path");

const servicesDir = path.join(__dirname, "../services");
const services = fs.readdirSync(servicesDir);

let updatedCount = 0;

for (const svc of services) {
  const dockerfilePath = path.join(servicesDir, svc, "Dockerfile");
  if (!fs.existsSync(dockerfilePath)) continue;

  let content = fs.readFileSync(dockerfilePath, "utf8");

  // 1. Manifest copy stage
  if (!content.includes("COPY packages/service-auth/package.json ./packages/service-auth/")) {
    if (content.includes("COPY packages/events/package.json ./packages/events/")) {
      content = content.replace(
        "COPY packages/events/package.json ./packages/events/",
        "COPY packages/events/package.json ./packages/events/\nCOPY packages/service-auth/package.json ./packages/service-auth/"
      );
    }
  }

  // 2. Source copy stage
  if (!content.includes("COPY packages/service-auth/ ./packages/service-auth/")) {
    if (content.includes("COPY packages/events/ ./packages/events/")) {
      content = content.replace(
        "COPY packages/events/ ./packages/events/",
        "COPY packages/events/ ./packages/events/\nCOPY packages/service-auth/ ./packages/service-auth/"
      );
    }
  }

  // 3. Package build stage
  if (!content.includes("WORKDIR /app/packages/service-auth")) {
    if (content.includes("WORKDIR /app/packages/events\nRUN npx tsc --outDir dist")) {
      content = content.replace(
        "WORKDIR /app/packages/events\nRUN npx tsc --outDir dist",
        "WORKDIR /app/packages/events\nRUN npx tsc --outDir dist\nWORKDIR /app/packages/service-auth\nRUN npx tsc --outDir dist"
      );
    } else if (content.includes("WORKDIR /app/packages/events\r\nRUN npx tsc --outDir dist")) {
      content = content.replace(
        "WORKDIR /app/packages/events\r\nRUN npx tsc --outDir dist",
        "WORKDIR /app/packages/events\r\nRUN npx tsc --outDir dist\r\nWORKDIR /app/packages/service-auth\r\nRUN npx tsc --outDir dist"
      );
    }
  }

  // 4. Runner stage copy
  if (!content.includes("COPY --from=builder /app/packages/service-auth/dist ./packages/service-auth/dist")) {
    if (content.includes("COPY --from=builder /app/packages/events/dist ./packages/events/dist")) {
      content = content.replace(
        "COPY --from=builder /app/packages/events/dist ./packages/events/dist\nCOPY --from=builder /app/packages/events/package.json ./packages/events/",
        "COPY --from=builder /app/packages/events/dist ./packages/events/dist\nCOPY --from=builder /app/packages/events/package.json ./packages/events/\nCOPY --from=builder /app/packages/service-auth/dist ./packages/service-auth/dist\nCOPY --from=builder /app/packages/service-auth/package.json ./packages/service-auth/"
      );
    }
  }

  fs.writeFileSync(dockerfilePath, content, "utf8");
  console.log(`Updated Dockerfile for: ${svc}`);
  updatedCount++;
}

console.log(`\nFinished updating ${updatedCount} Dockerfiles.`);
