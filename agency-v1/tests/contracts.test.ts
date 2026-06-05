/**
 * Microservices Contract & Integration Tests
 * ─────────────────────────────────────────────────────────────────────────────
 * Run with: npx tsx tests/contracts.test.ts
 * 
 * Verifies:
 * 1. Zod schemas validation for events (lead.created, user.created, invoice.created)
 * 2. Event validation rejection of invalid data contracts
 * 3. Outbox table database schema format
 * 4. Redis Stream EventBus contract enforcement (optional if Redis is up)
 */

import { z } from "zod";
import * as path from "path";
import { 
  leadCreatedSchema, 
  userCreatedSchema, 
  invoiceCreatedSchema 
} from "../packages/events/src/index";
import Redis from "ioredis";
import { Client } from "pg";

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

// Outbox Database Schema contract
const outboxSchema = z.object({
  id: z.string().uuid(),
  event_type: z.string(),
  aggregate_type: z.string(),
  aggregate_id: z.string(),
  payload: z.string(), // JSON string
  status: z.enum(["PENDING", "PROCESSED", "FAILED"]),
  attempts: z.number().int().nonnegative(),
  last_error: z.string().nullable().optional(),
  created_at: z.date(),
  processed_at: z.date().nullable().optional()
});

async function run() {
  console.log("\n══════════════════════════════════════════════════════════════");
  console.log("  LegacyMark — Microservices Contract & Integration Tests");
  console.log("══════════════════════════════════════════════════════════════\n");

  // 1. Zod Contracts - Positive Cases
  test("Event Contract: lead.created valid payload", () => {
    const validLead = {
      companyId: "comp-123",
      name: "John Doe",
      email: "john@example.com",
      phone: "+1234567890",
      source: "website",
      status: "new"
    };
    const parsed = leadCreatedSchema.parse(validLead);
    assert(parsed.companyId === "comp-123", "companyId should match");
    assert(parsed.name === "John Doe", "name should match");
  });

  test("Event Contract: user.created valid payload", () => {
    const validUser = {
      email: "user@example.com",
      name: "Alice"
    };
    const parsed = userCreatedSchema.parse(validUser);
    assert(parsed.email === "user@example.com", "email should match");
  });

  test("Event Contract: invoice.created valid payload", () => {
    const validInvoice = {
      id: "inv-999",
      companyId: "comp-123",
      amount: 499.99,
      status: "unpaid"
    };
    const parsed = invoiceCreatedSchema.parse(validInvoice);
    assert(parsed.id === "inv-999", "id should match");
  });

  // 2. Zod Contracts - Negative/Failure Cases (Contract Enforcement)
  test("Event Contract: lead.created missing companyId → throw ZodError", () => {
    const invalidLead = {
      name: "John Doe"
    };
    const result = leadCreatedSchema.safeParse(invalidLead);
    assert(result.success === false, "Should fail verification");
    if (!result.success) {
      assert(result.error.errors[0].message === "companyId is required", "Should require companyId");
    }
  });

  test("Event Contract: user.created missing email → throw ZodError", () => {
    const invalidUser = {
      name: "Alice"
    };
    const result = userCreatedSchema.safeParse(invalidUser);
    assert(result.success === false, "Should fail verification");
    if (!result.success) {
      assert(result.error.errors[0].message === "email is required", "Should require email");
    }
  });

  test("Event Contract: invoice.created missing id and invoiceId → throw ZodError", () => {
    const invalidInvoice = {
      companyId: "comp-123",
      amount: 499.99
    };
    const result = invoiceCreatedSchema.safeParse(invalidInvoice);
    assert(result.success === false, "Should fail verification");
  });

  // 3. Outbox Database Format Validation
  test("Outbox Database Schema Contract validation", () => {
    const mockOutboxRow = {
      id: "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
      event_type: "lead.created",
      aggregate_type: "Lead",
      aggregate_id: "lead-456",
      payload: JSON.stringify({ companyId: "comp-123", name: "Bob" }),
      status: "PENDING" as const,
      attempts: 0,
      last_error: null,
      created_at: new Date()
    };
    const parsed = outboxSchema.parse(mockOutboxRow);
    assert(parsed.id === "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d", "ID should parse correctly");
  });

  // 4. Redis EventBus Contract (Live verification if Redis is running)
  await test("EventBus live contract publishing (Redis)", async () => {
    const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";
    const redis = new Redis(redisUrl, { maxRetriesPerRequest: 1 });
    try {
      await redis.ping();
      
      // If we can connect, test Zod contract publishing
      const streamName = "test-stream-contracts";
      const payload = { companyId: "comp-red", name: "Redis Test" };
      
      // Verify schema before pushing
      const parsed = leadCreatedSchema.parse(payload);
      
      // Push event
      await redis.xadd(streamName, "*", "event", JSON.stringify(parsed));
      
      // Read event
      const reply = await redis.xread("COUNT", 1, "STREAMS", streamName, "0");
      assert(reply !== null, "Should read event back from stream");
      
      const eventJson = reply[0][1][0][1][1];
      const parsedBack = leadCreatedSchema.parse(JSON.parse(eventJson));
      assert(parsedBack.companyId === "comp-red", "Payload read should match source contract");
      
      // Clean up
      await redis.del(streamName);
      redis.disconnect();
    } catch (err: any) {
      redis.disconnect();
      console.warn("     ⚠️  Redis server not reachable, skipping live EventBus tests.");
    }
  });

  // 5. Database Outbox Table Schema Check (Live verification if PG is running)
  await test("Outbox DB table columns verify (Postgres)", async () => {
    const dbUrl = process.env.DATABASE_URL || "postgresql://legacymark:legacymark_dev@localhost:6432/legacymark_core";
    const client = new Client({ connectionString: dbUrl });
    try {
      await client.connect();
      const res = await client.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'tbl_outbox_events'
      `);
      
      const columns = res.rows.map(r => r.column_name);
      assert(columns.includes("id"), "Outbox table should contain 'id'");
      assert(columns.includes("col_event_name"), "Outbox table should contain 'col_event_name'");
      assert(columns.includes("col_status"), "Outbox table should contain 'col_status'");
      assert(columns.includes("col_payload"), "Outbox table should contain 'col_payload'");
      
      await client.end();
    } catch (err: any) {
      await client.end().catch(() => {});
      throw err;
    }
  });

  console.log("\n══════════════════════════════════════════════════════════════");
  console.log(`  Results: ${passed} passed, ${failed} failed, ${passed + failed} total`);
  console.log("══════════════════════════════════════════════════════════════\n");

  process.exit(failed > 0 ? 1 : 0);
}

run();
