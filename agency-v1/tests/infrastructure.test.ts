/**
 * Infrastructure Consistency & Resource Provisioning Tests
 * ─────────────────────────────────────────────────────────────────────────────
 * Run with: npx tsx tests/infrastructure.test.ts
 * 
 * Verifies:
 * 1. Docker Compose config consistency (services, ports, structures, limits)
 * 2. PgBouncer Primary and Replica port assignments
 * 3. pg_stat_statements preload in both PostgreSQL nodes
 * 4. Statement timeouts in database connection URLs
 * 5. Database Schema & Migration consistency status via Prisma
 */

import "dotenv/config";
import * as fs from "fs";
import * as path from "path";
import { execSync } from "child_process";
import { Client } from "pg";

const workspaceRoot = path.resolve(__dirname, "..");
const dockerComposePath = path.join(workspaceRoot, "docker-compose.yml");

let passed = 0;
let failed = 0;

function test(name: string, fn: () => void | Promise<void>) {
  try {
    const result = fn();
    if (result instanceof Promise) {
      return result
        .then(() => {
          console.log(`  ✅ ${name}`);
          passed++;
        })
        .catch((err) => {
          console.error(`  ❌ ${name}: ${err instanceof Error ? err.message : err}`);
          failed++;
        });
    } else {
      console.log(`  ✅ ${name}`);
      passed++;
    }
  } catch (err) {
    console.error(`  ❌ ${name}: ${err instanceof Error ? err.message : err}`);
    failed++;
  }
}

function assert(condition: boolean, msg: string) {
  if (!condition) throw new Error(msg);
}

async function run() {
  console.log("\n══════════════════════════════════════════════════════════════");
  console.log("  LegacyMark — Infrastructure & Resource Consistency Tests");
  console.log("══════════════════════════════════════════════════════════════\n");

  // 1. Docker Compose Structure Tests
  await test("Docker Compose file exists", () => {
    assert(fs.existsSync(dockerComposePath), "docker-compose.yml not found at workspace root");
  });

  if (fs.existsSync(dockerComposePath)) {
    const content = fs.readFileSync(dockerComposePath, "utf-8");

    await test("PgBouncer Primary is configured on port 6432", () => {
      assert(content.includes("LISTEN_PORT: 6432") || content.includes("LISTEN_PORT: \"6432\""), "PgBouncer LISTEN_PORT should be 6432");
      assert(content.includes("pgbouncer:"), "pgbouncer service definition should exist");
    });

    await test("PgBouncer Replica is configured on port 6433", () => {
      assert(content.includes("LISTEN_PORT: 6433") || content.includes("LISTEN_PORT: \"6433\""), "PgBouncer Replica LISTEN_PORT should be 6433");
      assert(content.includes("pgbouncer-replica:"), "pgbouncer-replica service definition should exist");
    });

    await test("pg_stat_statements is preloaded in PostgreSQL primary and replica", () => {
      const occurrences = (content.match(/shared_preload_libraries=pg_stat_statements/g) || []).length;
      assert(occurrences >= 2, `Expected shared_preload_libraries=pg_stat_statements to be defined for primary and replica, found ${occurrences} occurrences`);
    });

    await test("Statement timeouts (statement_timeout=10000) are configured", () => {
      assert(content.includes("statement_timeout=10000"), "statement_timeout=10000 should be specified in the connection strings");
    });

    await test("Docker resources limits are set for microservices", () => {
      assert(content.includes("cpus: \"0.5\"") || content.includes("cpus: \"0.50\""), "Base microservices should limit CPU to 0.5");
      assert(content.includes("memory: 512M") || content.includes("memory: 384M") || content.includes("memory: 256M"), "Base microservices should limit memory");
    });

    await test("All 22 microservices are configured in Docker Compose with Traefik Mesh & healthchecks", () => {
      const expectedMicroservices = [
        "admin-service",
        "affiliate-service",
        "agent-team-engine",
        "ai-engine",
        "analytics-service",
        "api-gateway",
        "auth-service",
        "automation-service",
        "calendar-service",
        "crm-service",
        "document-service",
        "finance-service",
        "goldneez-rewards-service",
        "hr-service",
        "inbox-service",
        "integration-service",
        "marketing-service",
        "notification-service",
        "pos-service",
        "project-service",
        "public-api-service",
        "video-service"
      ];

      for (const ms of expectedMicroservices) {
        assert(content.includes(`${ms}:`), `Microservice '${ms}' must be defined in docker-compose.yml`);
      }
    });

    await test("Service Mesh & API Gateway configuration files are present and valid", () => {
      const meshConfig = path.join(workspaceRoot, "infrastructure", "monitoring", "service-mesh-config.yml");
      const mtlsPolicy = path.join(workspaceRoot, "infrastructure", "k8s", "base", "mtls-policy.yml");
      const traefikConfig = path.join(workspaceRoot, "infrastructure", "traefik", "traefik.yml");

      assert(fs.existsSync(meshConfig), "service-mesh-config.yml must exist");
      assert(fs.existsSync(mtlsPolicy), "mtls-policy.yml must exist");
      assert(fs.existsSync(traefikConfig), "traefik.yml must exist");

      const meshContent = fs.readFileSync(meshConfig, "utf-8");
      assert(meshContent.includes("STRICT"), "mTLS mode should be set to STRICT in Service Mesh config");
      assert(meshContent.includes("roundRobin"), "Load balancing algorithm should be roundRobin");
    });
  }

  // 2. Database Schema & Migration Consistency Tests (Runs checks if DATABASE_URL is available)
  await test("Database Migration Status (Prisma / Segregated DBs)", async () => {
    const baseDbUrl = process.env.DATABASE_URL || "postgresql://legacymark:legacymark_dev@localhost:6432/legacymark_core";
    
    // Construct URLs for all 4 databases
    const getDbUrlFor = (dbName: string) => {
      const url = new URL(baseDbUrl);
      url.pathname = `/${dbName}`;
      return url.toString();
    };

    const dbsToCheck = [
      { name: "auth", db: "legacymark_auth", table: "tbl_users" },
      { name: "core", db: "legacymark_core", table: "tbl_outbox_events" },
      { name: "media", db: "legacymark_media", table: "tbl_posts" },
      { name: "analytics", db: "legacymark_analytics", table: "tbl_user_activity_logs" }
    ];

    for (const dbInfo of dbsToCheck) {
      const dbUrl = getDbUrlFor(dbInfo.db);
      const dbUrlObj = new URL(dbUrl);
      const hasSsl = dbUrlObj.searchParams.get("sslmode") === "require";
      dbUrlObj.searchParams.delete("sslmode");
      const isPgbouncer = dbUrlObj.hostname === "pgbouncer" || dbUrlObj.hostname === "pgbouncer-replica";
      
      const connectWithFallback = async (useSsl: boolean) => {
        const client = new Client({
          connectionString: dbUrlObj.toString(),
          ssl: useSsl ? { rejectUnauthorized: false } : undefined,
          connectionTimeoutMillis: 3000
        });
        await client.connect();
        return client;
      };

      try {
        let client: Client;
        try {
          client = await connectWithFallback(hasSsl || isPgbouncer);
        } catch (sslErr: any) {
          if (sslErr.message && sslErr.message.includes("does not support SSL")) {
            client = await connectWithFallback(false);
          } else {
            throw sslErr;
          }
        }

        // Query to check if the table exists
        const res = await client.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_name = '${dbInfo.table}'
          );
        `);
        const exists = res.rows[0].exists;
        assert(exists, `Table '${dbInfo.table}' should exist in database '${dbInfo.db}'`);
        console.log(`     Database [${dbInfo.name}] is reachable and table '${dbInfo.table}' exists.`);
        await client.end();
      } catch (err: any) {
        if (err.message && err.message.includes("should exist")) {
          throw err;
        }
        console.warn(`     ⚠️  Database [${dbInfo.name}] not reachable, skipping live checks: ${err.message}`);
      }
    }
  });


  // ── Test 10: @agency/service-auth package exists ────────────────────────────
  test("@agency/service-auth package is present", () => {
    const pkgPath = path.join(workspaceRoot, "packages", "service-auth", "package.json");
    assert(fs.existsSync(pkgPath), "packages/service-auth/package.json should exist");
    const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
    assert(pkg.name === "@agency/service-auth", "package name should be @agency/service-auth");
    const srcPath = path.join(workspaceRoot, "packages", "service-auth", "src", "index.ts");
    assert(fs.existsSync(srcPath), "packages/service-auth/src/index.ts should exist");
    const src = fs.readFileSync(srcPath, "utf-8");
    assert(src.includes("signServiceToken"), "service-auth should export signServiceToken");
    assert(src.includes("requireServiceAuth"), "service-auth should export requireServiceAuth");
    assert(src.includes("setupGracefulShutdown"), "service-auth should export setupGracefulShutdown");
    assert(src.includes("idempotencyMiddleware"), "service-auth should export idempotencyMiddleware");
  });

  // ── Test 11: @agency/outbox package exists ───────────────────────────────────
  test("@agency/outbox package is present with OutboxWriter and OutboxWorker", () => {
    const pkgPath = path.join(workspaceRoot, "packages", "outbox", "package.json");
    assert(fs.existsSync(pkgPath), "packages/outbox/package.json should exist");
    const srcPath = path.join(workspaceRoot, "packages", "outbox", "src", "index.ts");
    assert(fs.existsSync(srcPath), "packages/outbox/src/index.ts should exist");
    const src = fs.readFileSync(srcPath, "utf-8");
    assert(src.includes("OutboxWriter"), "outbox should export OutboxWriter");
    assert(src.includes("OutboxWorker"), "outbox should export OutboxWorker");
    assert(src.includes("OUTBOX_SETUP_SQL"), "outbox should export OUTBOX_SETUP_SQL");
    assert(src.includes("SKIP LOCKED"), "outbox worker should use FOR UPDATE SKIP LOCKED");
    assert(src.includes("dead-letter"), "outbox should have DLQ support");
  });

  // ── Test 12: @agency/openapi package exists ──────────────────────────────────
  test("@agency/openapi package is present with AgencyOpenAPIRegistry", () => {
    const pkgPath = path.join(workspaceRoot, "packages", "openapi", "package.json");
    assert(fs.existsSync(pkgPath), "packages/openapi/package.json should exist");
    const srcPath = path.join(workspaceRoot, "packages", "openapi", "src", "index.ts");
    assert(fs.existsSync(srcPath), "packages/openapi/src/index.ts should exist");
    const src = fs.readFileSync(srcPath, "utf-8");
    assert(src.includes("AgencyOpenAPIRegistry"), "openapi should export AgencyOpenAPIRegistry");
    assert(src.includes("serveSwaggerUI"), "openapi should export serveSwaggerUI");
  });

  // ── Test 13: API v1 versioning in all 22 service index.ts ────────────────────
  test("All 22 microservices use /api/v1/ route versioning", () => {
    const services = [
      "crm-service", "auth-service", "project-service", "finance-service", "inbox-service",
      "automation-service", "calendar-service", "marketing-service", "integration-service",
      "document-service", "notification-service", "analytics-service", "pos-service",
      "hr-service", "admin-service", "affiliate-service", "public-api-service", "video-service",
      "ai-engine", "agent-team-engine", "goldneez-rewards-service", "api-gateway"
    ];

    const missingV1: string[] = [];
    for (const svc of services) {
      const indexPath = path.join(workspaceRoot, "services", svc, "src", "index.ts");
      if (!fs.existsSync(indexPath)) {
        missingV1.push(`${svc} (index.ts missing)`);
        continue;
      }
      const src = fs.readFileSync(indexPath, "utf-8");
      if (!src.includes("/api/v1")) {
        missingV1.push(svc);
      }
    }
    assert(
      missingV1.length === 0,
      `Services missing /api/v1 versioning: ${missingV1.join(", ")}`
    );
  });

  // ── Test 14: Graceful shutdown in all services ───────────────────────────────
  test("All 22 microservices implement graceful shutdown", () => {
    const services = [
      "crm-service", "auth-service", "project-service", "finance-service", "inbox-service",
      "automation-service", "calendar-service", "marketing-service", "integration-service",
      "document-service", "notification-service", "analytics-service", "pos-service",
      "hr-service", "admin-service", "affiliate-service", "public-api-service", "video-service",
      "ai-engine", "agent-team-engine", "goldneez-rewards-service", "api-gateway"
    ];

    const missingShutdown: string[] = [];
    for (const svc of services) {
      const indexPath = path.join(workspaceRoot, "services", svc, "src", "index.ts");
      if (!fs.existsSync(indexPath)) continue;
      const src = fs.readFileSync(indexPath, "utf-8");
      if (!src.includes("setupGracefulShutdown") && !src.includes("SIGTERM") && !src.includes("process.on")) {
        missingShutdown.push(svc);
      }
    }
    assert(
      missingShutdown.length === 0,
      `Services missing graceful shutdown: ${missingShutdown.join(", ")}`
    );
  });

  // ── Test 15: Dockerfiles include service-auth ─────────────────────────────────
  test("Standard microservice Dockerfiles include @agency/service-auth build steps", () => {
    const standardServices = [
      "crm-service", "auth-service", "project-service", "finance-service", "inbox-service",
      "automation-service", "calendar-service", "marketing-service", "integration-service",
      "document-service", "notification-service", "analytics-service", "hr-service",
      "admin-service", "affiliate-service", "public-api-service", "video-service",
      "ai-engine", "agent-team-engine"
    ];

    const missingAuth: string[] = [];
    for (const svc of standardServices) {
      const dockerfilePath = path.join(workspaceRoot, "services", svc, "Dockerfile");
      if (!fs.existsSync(dockerfilePath)) continue;
      const content = fs.readFileSync(dockerfilePath, "utf-8");
      if (!content.includes("service-auth")) {
        missingAuth.push(svc);
      }
    }
    assert(
      missingAuth.length === 0,
      `Dockerfiles missing service-auth: ${missingAuth.join(", ")}`
    );
  });

  console.log("\n══════════════════════════════════════════════════════════════");
  console.log(`  Results: ${passed} passed, ${failed} failed, ${passed + failed} total`);
  console.log("══════════════════════════════════════════════════════════════\n");

  process.exit(failed > 0 ? 1 : 0);
}

run();

