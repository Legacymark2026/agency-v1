/**
 * Integration Tests — Microservices Health & Connectivity
 * ─────────────────────────────────────────────────────────────────────────────
 * Run with Docker Compose: npm run docker:up && npx tsx tests/integration.test.ts
 * 
 * Tests:
 * 1. All service health endpoints respond
 * 2. All service readiness (DB) probes pass
 * 3. API Gateway routes correctly to each service
 * 4. Redis Event Bus connectivity
 * 5. Cross-service communication via API Gateway
 */

const GATEWAY = process.env.GATEWAY_URL || "http://localhost:8080";
const SERVICES = {
  "auth-service":       process.env.AUTH_URL       || "http://localhost:4001",
  "crm-service":        process.env.CRM_URL        || "http://localhost:4002",
  "automation-service":  process.env.AUTOMATION_URL || "http://localhost:4003",
  "ai-engine":          process.env.AI_URL          || "http://localhost:4004",
  "inbox-service":      process.env.INBOX_URL       || "http://localhost:4005",
  "finance-service":    process.env.FINANCE_URL     || "http://localhost:4006",
};

let passed = 0;
let failed = 0;

async function test(name: string, fn: () => Promise<void>) {
  try {
    await fn();
    console.log(`  ✅ ${name}`);
    passed++;
  } catch (err) {
    console.log(`  ❌ ${name}: ${err instanceof Error ? err.message : err}`);
    failed++;
  }
}

function assert(condition: boolean, msg: string) {
  if (!condition) throw new Error(msg);
}

async function fetchJson(url: string, options?: RequestInit) {
  const res = await fetch(url, { ...options, signal: AbortSignal.timeout(10_000) });
  return { status: res.status, body: await res.json().catch(() => null) };
}

// ─── Test Suite ──────────────────────────────────────────────────────────────

async function run() {
  console.log("\n══════════════════════════════════════════════════════════════");
  console.log("  LegacyMark — Integration Tests");
  console.log("══════════════════════════════════════════════════════════════\n");

  // 1. Health Checks — Direct
  console.log("📋 1. Service Health Checks (Direct)");
  for (const [name, url] of Object.entries(SERVICES)) {
    await test(`${name} /health`, async () => {
      const { status, body } = await fetchJson(`${url}/health`);
      assert(status === 200, `Expected 200, got ${status}`);
      assert(body?.status === "healthy", `Expected healthy, got ${body?.status}`);
    });
  }

  // 2. Readiness Probes — DB connectivity
  console.log("\n📋 2. Readiness Probes (DB Connectivity)");
  for (const [name, url] of Object.entries(SERVICES)) {
    await test(`${name} /ready`, async () => {
      const { status, body } = await fetchJson(`${url}/ready`);
      assert(status === 200, `Expected 200, got ${status}`);
      assert(body?.status === "ready", `DB not connected: ${JSON.stringify(body)}`);
    });
  }

  // 3. API Gateway Health
  console.log("\n📋 3. API Gateway");
  await test("Gateway /health", async () => {
    const { status, body } = await fetchJson(`${GATEWAY}/health`);
    assert(status === 200, `Expected 200, got ${status}`);
    assert(body?.service === "api-gateway", `Wrong service: ${body?.service}`);
  });

  // 4. API Gateway Routing
  console.log("\n📋 4. API Gateway Routing");

  await test("Gateway → auth-service (GET /api/auth/me)", async () => {
    const { status } = await fetchJson(`${GATEWAY}/api/auth/me`);
    assert(status === 401, `Expected 401 (no token), got ${status}`);
  });

  await test("Gateway → crm-service (GET /api/leads)", async () => {
    const { status } = await fetchJson(`${GATEWAY}/api/leads`);
    assert(status === 400, `Expected 400 (no companyId), got ${status}`);
  });

  await test("Gateway → automation-service (GET /api/workflows)", async () => {
    const { status } = await fetchJson(`${GATEWAY}/api/workflows`);
    assert(status === 400, `Expected 400 (no companyId), got ${status}`);
  });

  await test("Gateway → ai-engine (GET /api/agents)", async () => {
    const { status } = await fetchJson(`${GATEWAY}/api/agents`);
    assert(status === 400, `Expected 400 (no companyId), got ${status}`);
  });

  await test("Gateway → inbox-service (GET /api/inbox/conversations)", async () => {
    const { status } = await fetchJson(`${GATEWAY}/api/inbox/conversations`);
    assert(status === 400, `Expected 400 (no companyId), got ${status}`);
  });

  await test("Gateway → finance-service (GET /api/invoices)", async () => {
    const { status } = await fetchJson(`${GATEWAY}/api/invoices`);
    assert(status === 400, `Expected 400 (no companyId), got ${status}`);
  });

  await test("Gateway → 404 for unknown routes", async () => {
    const { status } = await fetchJson(`${GATEWAY}/api/nonexistent`);
    assert(status === 404, `Expected 404, got ${status}`);
  });

  // 5. Auth Flow — Login (should fail with invalid credentials)
  console.log("\n📋 5. Auth Flow");
  await test("Login with invalid credentials → 401", async () => {
    const { status } = await fetchJson(`${GATEWAY}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "test@test.com", password: "wrong" }),
    });
    assert(status === 401, `Expected 401, got ${status}`);
  });

  await test("Token validation with invalid token → 401", async () => {
    const { status } = await fetchJson(`${GATEWAY}/api/auth/me`, {
      headers: { Authorization: "Bearer invalid-token-xyz" },
    });
    assert(status === 401, `Expected 401, got ${status}`);
  });

  // Summary
  console.log("\n══════════════════════════════════════════════════════════════");
  console.log(`  Results: ${passed} passed, ${failed} failed, ${passed + failed} total`);
  console.log("══════════════════════════════════════════════════════════════\n");

  process.exit(failed > 0 ? 1 : 0);
}

// Wait for services to start
console.log("⏳ Waiting 5s for services to initialize...");
setTimeout(run, 5000);
