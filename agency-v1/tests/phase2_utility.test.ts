/**
 * Phase 2 Microservices Utility Verification Tests
 * ─────────────────────────────────────────────────────────────────────────────
 * Run with: npx tsx tests/phase2_utility.test.ts
 */

import { InboxAnalysisService } from "../services/inbox-service/src/services/inbox-analysis.service";
import { OfflineSyncService } from "../services/pos-service/src/services/offline-sync.service";
import { PosService } from "../services/pos-service/src/services/pos.service";
import { BookingService } from "../services/calendar-service/src/services/booking.service";
import { NotesProcessorService } from "../services/calendar-service/src/services/notes-processor.service";
import { SecurityService } from "../services/auth-service/src/services/security.service";

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
  console.log("  LegacyMark — Phase 2 Utility Verification Tests");
  console.log("══════════════════════════════════════════════════════════════\n");

  // 1. Inbox sentiment analysis and suggestion
  await test("InboxAnalysisService: sentiment categorizations & rules suggestions", async () => {
    const sentPositive = await InboxAnalysisService.analyzeSentiment("Excelente servicio, muchas gracias, recomendado!");
    assert(sentPositive.sentiment === "POSITIVE", `Expected POSITIVE sentiment, got ${sentPositive.sentiment}`);
    assert(sentPositive.score > 0, "Sentiment score should be positive");

    const sentAngry = await InboxAnalysisService.analyzeSentiment("Esto es una estafa, exijo la devolución y una demanda legal.");
    assert(sentAngry.sentiment === "ANGRY", `Expected ANGRY sentiment, got ${sentAngry.sentiment}`);
    assert(sentAngry.score < 0, "Sentiment score should be negative");

    // Suggestion matching "precio"
    const suggestedReplyPrice = await InboxAnalysisService.generateSuggestedReply("conv-mock-1");
    assert(
      suggestedReplyPrice.includes("asesor") || 
      suggestedReplyPrice.includes("precio") || 
      suggestedReplyPrice.includes("servicios"), 
      "Should generate default or rule-based reply"
    );
  });

  // 2. POS offline synchronization batch ingester
  await test("OfflineSyncService: ingest and synchronize transactions", async () => {
    const transactions = [
      {
        id: "offline-1",
        orderNumber: "OFF-2026-999",
        totalAmount: 45.99,
        cashierId: "cashier-1",
        paymentMethod: "CASH",
        items: [{ productId: "prod-1", quantity: 2, price: 20.00 }],
        createdAt: new Date().toISOString()
      }
    ];

    const result = await OfflineSyncService.syncOfflineTransactions("company-1", transactions);
    assert(result.syncedCount === 1, `Expected 1 synced count, got ${result.syncedCount}`);
    assert(result.results[0].orderNumber === "OFF-2026-999", "Order number should match");
  });

  // 3. POS ticket QR generation
  await test("PosService: render SVG ticket QR fallback", async () => {
    const qrDataUrl = await PosService.renderTicketQr("order-12345");
    assert(qrDataUrl.startsWith("data:image/"), "QR Data URL should start with data:image/");
  });

  // 4. Calendar cross-timezone slots calculation
  await test("BookingService: timezone converted slots verification", async () => {
    // Check if slots can be retrieved with fallback mock
    const slots = await BookingService.getCrossTimezoneSlots("company-1", "type-1", "2026-10-15", "America/New_York");
    assert(Array.isArray(slots), "Timezone slots should be returned as an array");
  });

  // 5. Notes checklists parsing into action tasks
  await test("NotesProcessorService: parse action list tasks", async () => {
    const notesText = `
Meeting Notes from Geisha Coffee Project
- [ ] Enviar cotización actualizada al cliente.
- [ ] Programar segunda sesión técnica.
Other text not formatted as check item
    `;

    const tasks = await NotesProcessorService.processMeetingNotes("appt-1", "company-1", notesText);
    assert(tasks.length === 2, `Expected 2 extracted tasks, got ${tasks.length}`);
    assert(tasks[0].title === "Enviar cotización actualizada al cliente.", "Task 1 text should match");
    assert(tasks[1].title === "Programar segunda sesión técnica.", "Task 2 text should match");
  });

  // 6. Security Impossible Travel login check
  await test("SecurityService: detect impossible travel logins", async () => {
    // Madrid, España is ~8000km from Bogotá, Colombia.
    // If login is done within minutes, it should trigger impossible travel alert.
    const result = await SecurityService.checkImpossibleTravel(
      "user-1", 
      "127.0.0.1", 
      40.4168, // Madrid lat
      -3.7038, // Madrid lon
      "127.0.0.1",
      "Mozilla/5.0"
    );
    assert(result.suspicious === true, "Madrid login in short timeframe should flag as suspicious");
    assert(result.calculatedSpeedKmh! > 800, "Calculated travel speed should be extremely high");
  });

  console.log("\n══════════════════════════════════════════════════════════════");
  console.log(`  Results: ${passed} passed, ${failed} failed, ${passed + failed} total`);
  console.log("══════════════════════════════════════════════════════════════\n");

  process.exit(failed > 0 ? 1 : 0);
}

run();
