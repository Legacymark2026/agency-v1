/**
 * Microservices Utility Expansion Verification Tests
 * ─────────────────────────────────────────────────────────────────────────────
 * Run with: npx tsx tests/utility_expansion.test.ts
 */

import { MemoryVectorService } from "../services/ai-engine/src/services/memory-vector.service";
import { AgentTeamService } from "../services/agent-team-engine/src/services/agent-team.service";
import { MarketingService } from "../services/marketing-service/src/services/marketing.service";
import { ReconciliationService } from "../services/finance-service/src/services/reconciliation.service";

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
  console.log("  LegacyMark — Microservices Utility Expansion Verification");
  console.log("══════════════════════════════════════════════════════════════\n");

  // 1. PgVector Embedding Dimension test
  await test("MemoryVectorService: generate 1536-dimension float embedding", async () => {
    const embedding = await MemoryVectorService.generateEmbedding("Coffee Cupping Event");
    assert(Array.isArray(embedding), "Embedding should be an array");
    assert(embedding.length === 1536, `Embedding length should be 1536, got ${embedding.length}`);
    // Check normalization
    const magnitude = Math.sqrt(embedding.reduce((sum, v) => sum + v * v, 0));
    assert(Math.abs(magnitude - 1.0) < 0.001, `Embedding should be normalized, magnitude got ${magnitude}`);
  });

  // 2. Collaborative Agent Team Sequential Execution test
  await test("AgentTeamService: sequential cooperative execution", async () => {
    const result = await AgentTeamService.runCollaborativeTeam("team-1", "comp-1", "Generate coffee ad campaign");
    assert(result.teamId === "team-1", "Team ID should match");
    assert(result.steps.length === 3, `Should have 3 collaborative steps, got ${result.steps.length}`);
    assert(result.steps[0].agentName === "Research Agent", "First step should be Research Agent");
    assert(result.steps[1].agentName === "Copywriter Agent", "Second step should be Copywriter Agent");
    assert(result.steps[2].agentName === "Manager Agent", "Third step should be Manager Agent");
    assert(result.finalResult.includes("Manager Agent"), "Final result should end with Manager Agent approval step");
  });

  // 3. AI copy generator fallback testing
  await test("MarketingService: AI copy generator channel options", async () => {
    const emailCopy = await MarketingService.generateAiCopy("comp-1", "Specialty Geisha", "email");
    assert(emailCopy.includes("Geisha"), "Email copy should contain topic");
    
    const smsCopy = await MarketingService.generateAiCopy("comp-1", "Barista course", "sms");
    assert(smsCopy.includes("Barista course"), "SMS copy should contain topic");

    const waCopy = await MarketingService.generateAiCopy("comp-1", "Mug promotion", "whatsapp");
    assert(waCopy.includes("Mug promotion"), "WhatsApp copy should contain topic");
  });

  // 4. Financial automated transaction reconciliation testing
  await test("ReconciliationService: bank statement fuzzy matching", async () => {
    const transactions = [
      { id: "tx-1", amount: 1000, date: new Date(), referenceText: "Invoice payment for INV-2026-001" },
      { id: "tx-2", amount: 2500, date: new Date(), referenceText: "TECHCORP LTD TRANSFER" }, // clientName match
      { id: "tx-3", amount: 450, date: new Date(), referenceText: "Random payment" } // unresolved
    ];

    const matches = await ReconciliationService.reconcileTransactions("comp-1", transactions);
    assert(matches.length === 3, "Should return matching results for all 3 transactions");
    
    // tx-1: invoice number + amount match -> reconciled
    assert(matches[0].matchedInvoiceNumber === "INV-2026-001", "tx-1 should match INV-2026-001");
    assert(matches[0].status === "RECONCILED", "tx-1 status should be RECONCILED");

    // tx-2: client name TechCorp match -> reconciled
    assert(matches[1].matchedInvoiceNumber === "INV-2026-002", "tx-2 should match INV-2026-002");
    assert(matches[1].status === "RECONCILED", "tx-2 status should be RECONCILED");

    // tx-3: unresolved
    assert(matches[2].matchedInvoiceId === null, "tx-3 should have no match");
    assert(matches[2].status === "UNRESOLVED", "tx-3 status should be UNRESOLVED");
  });

  console.log("\n══════════════════════════════════════════════════════════════");
  console.log(`  Results: ${passed} passed, ${failed} failed, ${passed + failed} total`);
  console.log("══════════════════════════════════════════════════════════════\n");

  process.exit(failed > 0 ? 1 : 0);
}

run();
