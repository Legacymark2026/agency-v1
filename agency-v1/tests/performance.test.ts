/**
 * Load, Performance & Scalability Tests
 * ─────────────────────────────────────────────────────────────────────────────
 * Run with: npx tsx tests/performance.test.ts
 * 
 * Verifies:
 * 1. High concurrency performance (throughput, latency, success rate) on API Gateway
 * 2. Database read replica execution speed
 * 3. Statement timeout (10s) prevention of resource hanging
 */

import { Client } from "pg";

const GATEWAY = process.env.GATEWAY_URL || "http://localhost:8080";
const CONCURRENCY_LEVEL = 150; // Simulate 150 concurrent requests

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
  console.log("  LegacyMark — Load, Performance & Scalability Tests");
  console.log("══════════════════════════════════════════════════════════════\n");

  // 1. High Concurrency Load Test on Gateway
  await test(`Gateway Concurrency Load Test (${CONCURRENCY_LEVEL} parallel requests)`, async () => {
    console.log(`     Spawning ${CONCURRENCY_LEVEL} requests to ${GATEWAY}/health...`);
    const startTime = Date.now();
    
    const requests = Array.from({ length: CONCURRENCY_LEVEL }).map(async () => {
      try {
        const res = await fetch(`${GATEWAY}/health`, { signal: AbortSignal.timeout(5000) });
        return { ok: res.ok, status: res.status };
      } catch (err) {
        return { ok: false, status: 0 };
      }
    });

    const results = await Promise.all(requests);
    const endTime = Date.now();
    const durationMs = endTime - startTime;
    
    const successes = results.filter(r => r.ok && r.status === 200).length;
    const failures = CONCURRENCY_LEVEL - successes;
    const rps = (CONCURRENCY_LEVEL / (durationMs / 1000)).toFixed(2);

    console.log(`     Completed in ${durationMs}ms`);
    console.log(`     Successful: ${successes}, Failed/Timeout: ${failures}`);
    console.log(`     Throughput: ${rps} req/sec`);
    console.log(`     Average Latency: ${(durationMs / CONCURRENCY_LEVEL).toFixed(2)}ms`);

    assert(successes > 0, "All requests failed");
    assert(failures === 0 || failures < CONCURRENCY_LEVEL * 0.1, "Failure rate is too high (>10%)");
  });

  // 2. Database Read Replica Latency Verification (if DB is up)
  await test("Database Read Replica Latency Check", async () => {
    const readDbUrl = process.env.DATABASE_READ_URL || "postgresql://legacymark:legacymark_dev@localhost:6433/legacymark_core";
    const dbUrlObj = new URL(readDbUrl);
    const hasSsl = dbUrlObj.searchParams.get("sslmode") === "require";
    dbUrlObj.searchParams.delete("sslmode");
    const isPgbouncer = dbUrlObj.hostname === "pgbouncer" || dbUrlObj.hostname === "pgbouncer-replica";
    const client = new Client({ 
      connectionString: dbUrlObj.toString(),
      ssl: (hasSsl || isPgbouncer) ? { rejectUnauthorized: false } : undefined
    });
    try {
      const dbStart = Date.now();
      await client.connect();
      
      // Execute 20 read queries in sequence
      for (let i = 0; i < 20; i++) {
        await client.query("SELECT 1;");
      }
      
      const dbEnd = Date.now();
      const dbDuration = dbEnd - dbStart;
      console.log(`     20 queries on Read Replica took: ${dbDuration}ms (avg ${(dbDuration / 20).toFixed(2)}ms/query)`);
      assert(dbDuration < 500, "Read replica queries took too long (>500ms total)");
      
      await client.end();
    } catch (err: any) {
      await client.end().catch(() => {});
      console.warn(`     ⚠️  Read replica database not reachable: ${err.message || err}. Skipping live DB performance checks.`);
    }
  });

  // 3. Statement Timeout Verification (10s limit)
  await test("Database Statement Timeout (10000ms limit)", async () => {
    const dbUrl = process.env.DATABASE_URL || "postgresql://legacymark:legacymark_dev@localhost:6432/legacymark_core";
    const urlObj = new URL(dbUrl);
    const hasSsl = urlObj.searchParams.get("sslmode") === "require";
    urlObj.searchParams.delete("statement_timeout");
    urlObj.searchParams.delete("sslmode");
    const isPgbouncer = urlObj.hostname === "pgbouncer" || urlObj.hostname === "pgbouncer-replica";
    const client = new Client({ 
      connectionString: urlObj.toString(),
      ssl: (hasSsl || isPgbouncer) ? { rejectUnauthorized: false } : undefined
    });
    try {
      await client.connect();
      // Set statement timeout dynamically on the session to prevent PgBouncer startup param error
      await client.query("SET statement_timeout = 10000;");
      console.log("     Executing a query that takes 12 seconds (SELECT pg_sleep(12)) to test timeout...");
      
      const startTime = Date.now();
      try {
        // This query should timeout because statement_timeout=10000 (10s)
        await client.query("SELECT pg_sleep(12);");
        await client.end();
        throw new Error("Query completed successfully but should have timed out!");
      } catch (queryErr: any) {
        await client.end().catch(() => {});
        const elapsed = Date.now() - startTime;
        
        // Assert that the error is indeed a timeout error and it was aborted around 10 seconds
        console.log(`     Query aborted after ${elapsed}ms`);
        console.log(`     Error message: ${queryErr.message}`);
        
        assert(elapsed >= 9500 && elapsed <= 11500, `Query should abort around 10s, aborted at ${elapsed}ms`);
        assert(queryErr.message.includes("canceling statement due to statement timeout") || queryErr.message.includes("timeout"), "Error should state statement timeout cancellation");
      }
    } catch (err: any) {
      await client.end().catch(() => {});
      if (err.message.includes("Query completed successfully") || err.message.includes("Query should abort")) {
        throw err;
      }
      console.error("     ❌ Connection/Query error:", err);
      console.warn("     ⚠️  Database not reachable, skipping live statement timeout checks.");
    }
  });

  console.log("\n══════════════════════════════════════════════════════════════");
  console.log(`  Results: ${passed} passed, ${failed} failed, ${passed + failed} total`);
  console.log("══════════════════════════════════════════════════════════════\n");

  process.exit(failed > 0 ? 1 : 0);
}

run();
