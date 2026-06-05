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

import * as fs from "fs";
import * as path from "path";
import { execSync } from "child_process";

const workspaceRoot = path.resolve(__dirname, "..");
const dockerComposePath = path.join(workspaceRoot, "docker-compose.yml");

let passed = 0;
let failed = 0;

function test(name: string, fn: () => void | Promise<void>) {
  try {
    fn();
    console.log(`  ✅ ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ❌ ${name}: ${err instanceof Error ? err.message : err}`);
    failed++;
  }
}

function assert(condition: boolean, msg: string) {
  if (!condition) throw new Error(msg);
}

function run() {
  console.log("\n══════════════════════════════════════════════════════════════");
  console.log("  LegacyMark — Infrastructure & Resource Consistency Tests");
  console.log("══════════════════════════════════════════════════════════════\n");

  // 1. Docker Compose Structure Tests
  test("Docker Compose file exists", () => {
    assert(fs.existsSync(dockerComposePath), "docker-compose.yml not found at workspace root");
  });

  if (fs.existsSync(dockerComposePath)) {
    const content = fs.readFileSync(dockerComposePath, "utf-8");

    test("PgBouncer Primary is configured on port 6432", () => {
      assert(content.includes("LISTEN_PORT: 6432") || content.includes("LISTEN_PORT: \"6432\""), "PgBouncer LISTEN_PORT should be 6432");
      assert(content.includes("pgbouncer:"), "pgbouncer service definition should exist");
    });

    test("PgBouncer Replica is configured on port 6433", () => {
      assert(content.includes("LISTEN_PORT: 6433") || content.includes("LISTEN_PORT: \"6433\""), "PgBouncer Replica LISTEN_PORT should be 6433");
      assert(content.includes("pgbouncer-replica:"), "pgbouncer-replica service definition should exist");
    });

    test("pg_stat_statements is preloaded in PostgreSQL primary and replica", () => {
      const occurrences = (content.match(/shared_preload_libraries=pg_stat_statements/g) || []).length;
      assert(occurrences >= 2, `Expected shared_preload_libraries=pg_stat_statements to be defined for primary and replica, found ${occurrences} occurrences`);
    });

    test("Statement timeouts (statement_timeout=10000) are configured", () => {
      assert(content.includes("statement_timeout=10000"), "statement_timeout=10000 should be specified in the connection strings");
    });

    test("Docker resources limits are set for microservices", () => {
      assert(content.includes("cpus: \"0.5\""), "Base microservices should limit CPU to 0.5");
      assert(content.includes("memory: 512M") || content.includes("memory: 256M"), "Base microservices should limit memory");
    });
  }

  // 2. Database Schema & Migration Consistency Tests (Runs Prisma checks if DATABASE_URL is available)
  test("Database Migration Status (Prisma)", () => {
    try {
      // Execute prisma migrate status inside the database package workspace
      console.log("     Running 'prisma migrate status' check...");
      const output = execSync("npm run db:migrate -- --dry-run || npx prisma migrate status --schema=packages/database/prisma/schema.prisma", {
        cwd: workspaceRoot,
        env: { ...process.env, DATABASE_URL: process.env.DATABASE_URL || "postgresql://legacymark:legacymark_dev@localhost:6432/legacymark_core" },
        stdio: "pipe"
      }).toString();
      
      assert(!output.includes("Database schema is not in sync"), "Database schema is out of sync with migrations");
      console.log("     Prisma migrations are in sync.");
    } catch (err: any) {
      // If DB is not running locally (e.g. in test env), warn but don't hard fail if it's just connection issue
      const msg = err.stderr?.toString() || err.message || "";
      if (msg.includes("Can't reach database server") || msg.includes("P1001")) {
        console.warn("     ⚠️  Database server not reachable, skipping live schema checks.");
      } else {
        throw new Error(`Migration check failed: ${msg}`);
      }
    }
  });

  console.log("\n══════════════════════════════════════════════════════════════");
  console.log(`  Results: ${passed} passed, ${failed} failed, ${passed + failed} total`);
  console.log("══════════════════════════════════════════════════════════════\n");

  process.exit(failed > 0 ? 1 : 0);
}

run();
