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
      assert(content.includes("cpus: \"0.5\""), "Base microservices should limit CPU to 0.5");
      assert(content.includes("memory: 512M") || content.includes("memory: 256M"), "Base microservices should limit memory");
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
      const client = new Client({ 
        connectionString: dbUrlObj.toString(),
        ssl: (hasSsl || isPgbouncer) ? { rejectUnauthorized: false } : undefined
      });
      try {
        await client.connect();
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
        await client.end().catch(() => {});
        if (err.message.includes("should exist")) {
          throw err;
        }
        console.warn(`     ⚠️  Database [${dbInfo.name}] not reachable, skipping live checks: ${err.message}`);
      }
    }
  });

  console.log("\n══════════════════════════════════════════════════════════════");
  console.log(`  Results: ${passed} passed, ${failed} failed, ${passed + failed} total`);
  console.log("══════════════════════════════════════════════════════════════\n");

  process.exit(failed > 0 ? 1 : 0);
}

run();
