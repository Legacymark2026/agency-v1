/**
 * Frontend Component Verification Tests
 * ─────────────────────────────────────────────────────────────────────────────
 * Run with: npx tsx tests/frontend_components.test.ts
 */

import fs from "fs";
import path from "path";

let passed = 0;
let failed = 0;

function test(name: string, fn: () => void) {
  try {
    fn();
    console.log(`  ✅ ${name}`);
    passed++;
  } catch (err: any) {
    console.error(`  ❌ ${name}: ${err.message}`);
    failed++;
  }
}

function assert(condition: boolean, msg: string) {
  if (!condition) throw new Error(msg);
}

function run() {
  console.log("\n══════════════════════════════════════════════════════════════");
  console.log("  LegacyMark — Frontend Component Verification Tests");
  console.log("══════════════════════════════════════════════════════════════\n");

  const componentsDir = path.join(process.cwd(), "apps", "web", "components");

  test("PredictiveSalesWidget file existence & structure", () => {
    const file = path.join(componentsDir, "analytics", "predictive-sales-widget.tsx");
    assert(fs.existsSync(file), "predictive-sales-widget.tsx must exist");
    const content = fs.readFileSync(file, "utf-8");
    assert(content.includes("export function PredictiveSalesWidget"), "Must export PredictiveSalesWidget");
    assert(content.includes("Predicción de Ventas IA"), "Must contain UI title text");
  });

  test("SentimentBadge file existence & structure", () => {
    const file = path.join(componentsDir, "inbox", "sentiment-badge.tsx");
    assert(fs.existsSync(file), "sentiment-badge.tsx must exist");
    const content = fs.readFileSync(file, "utf-8");
    assert(content.includes("export function SentimentBadge"), "Must export SentimentBadge");
    assert(content.includes("POSITIVE"), "Must handle POSITIVE sentiment");
    assert(content.includes("ANGRY"), "Must handle ANGRY sentiment");
  });

  test("OfflineSyncBanner file existence & structure", () => {
    const file = path.join(componentsDir, "pos", "offline-sync-banner.tsx");
    assert(fs.existsSync(file), "offline-sync-banner.tsx must exist");
    const content = fs.readFileSync(file, "utf-8");
    assert(content.includes("export function OfflineSyncBanner"), "Must export OfflineSyncBanner");
    assert(content.includes("Modo Offline Activo"), "Must contain offline status text");
  });

  test("TicketQrModal file existence & structure", () => {
    const file = path.join(componentsDir, "pos", "ticket-qr-modal.tsx");
    assert(fs.existsSync(file), "ticket-qr-modal.tsx must exist");
    const content = fs.readFileSync(file, "utf-8");
    assert(content.includes("export function TicketQrModal"), "Must export TicketQrModal");
    assert(content.includes("Imprimir Ticket Térmico"), "Must contain print button");
  });

  test("ImpossibleTravelAlert file existence & structure", () => {
    const file = path.join(componentsDir, "security", "impossible-travel-alert.tsx");
    assert(fs.existsSync(file), "impossible-travel-alert.tsx must exist");
    const content = fs.readFileSync(file, "utf-8");
    assert(content.includes("export function ImpossibleTravelAlert"), "Must export ImpossibleTravelAlert");
    assert(content.includes("Viaje Imposible"), "Must contain travel security warning text");
  });

  console.log("\n══════════════════════════════════════════════════════════════");
  console.log(`  Results: ${passed} passed, ${failed} failed, ${passed + failed} total`);
  console.log("══════════════════════════════════════════════════════════════\n");

  process.exit(failed > 0 ? 1 : 0);
}

run();
