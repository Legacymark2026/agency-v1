/**
 * HybridCache Functional & Integration Tests
 * ─────────────────────────────────────────────────────────────────────────────
 * Run with: npx tsx tests/cache.test.ts
 * 
 * Verifies:
 * 1. Cache Miss behavior (first read runs the source function)
 * 2. Cache Hit behavior (subsequent reads return from memory L1 cache instantly)
 * 3. Invalidation behavior (deleting a key forces a reload from source)
 * 4. Explicit writes behavior (setting a value explicitly primes the cache)
 */

import "dotenv/config";
import { hybridCache } from "../packages/database/src/cache-helper";

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
  console.log("  LegacyMark — Hybrid Cache Integration Tests");
  console.log("══════════════════════════════════════════════════════════════\n");

  const testKey = "test:user_profile:12345";
  const mockDbData = { id: "12345", name: "Cache Tester", email: "tester@legacymark.com" };
  
  let databaseCallCount = 0;
  const fetchFromDbMock = async () => {
    databaseCallCount++;
    return mockDbData;
  };

  // Clean start
  await hybridCache.delete(testKey);
  hybridCache.clearLocal();

  // Test 1: Cache Miss
  await test("Cache Miss on first read (calls database/source function)", async () => {
    databaseCallCount = 0;
    const data = await hybridCache.get(testKey, fetchFromDbMock);
    
    assert(data.id === "12345", "Should return the correct data from mock database");
    assert(databaseCallCount === 1, `Database function should have been called once, called ${databaseCallCount} times`);
  });

  // Test 2: Cache Hit
  await test("Cache Hit on second read (retrieved from memory L1/Redis without database call)", async () => {
    databaseCallCount = 0;
    const data = await hybridCache.get(testKey, fetchFromDbMock);
    
    assert(data.id === "12345", "Should return the correct data");
    assert(databaseCallCount === 0, `Database function should NOT be called on cache hit, called ${databaseCallCount} times`);
  });

  // Test 3: Invalidation
  await test("Cache Invalidation (deleting key forces fresh reload on next read)", async () => {
    await hybridCache.delete(testKey);
    
    databaseCallCount = 0;
    const data = await hybridCache.get(testKey, fetchFromDbMock);
    
    assert(data.id === "12345", "Should return correct data");
    assert(databaseCallCount === 1, `Database function should have been called once after invalidation, called ${databaseCallCount} times`);
  });

  // Test 4: Explicit write
  await test("Cache Explicit Set (manually writing a key primes the cache)", async () => {
    const customData = { id: "12345", name: "Custom Value", email: "custom@legacymark.com" };
    await hybridCache.set(testKey, customData);
    
    databaseCallCount = 0;
    const data = await hybridCache.get(testKey, fetchFromDbMock);
    
    assert(data.name === "Custom Value", `Should return 'Custom Value', got '${data.name}'`);
    assert(databaseCallCount === 0, "Database function should NOT be called when cache is primed");
  });

  // Clean up
  await hybridCache.delete(testKey);

  console.log("\n══════════════════════════════════════════════════════════════");
  console.log(`  Results: ${passed} passed, ${failed} failed, ${passed + failed} total`);
  console.log("══════════════════════════════════════════════════════════════\n");

  process.exit(failed > 0 ? 1 : 0);
}

run();
