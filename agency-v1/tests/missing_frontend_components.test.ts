/**
 * Verification Tests for 4 Missing Frontend Components
 * ─────────────────────────────────────────────────────────────────────────────
 * Run with: npx tsx tests/missing_frontend_components.test.ts
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
  console.log("  LegacyMark — 4 Missing Frontend Components Verification");
  console.log("══════════════════════════════════════════════════════════════\n");

  const componentsDir = path.join(process.cwd(), "apps", "web", "components");

  test("PayslipCalculator file structure & export", () => {
    const file = path.join(componentsDir, "payroll", "payslip-calculator.tsx");
    assert(fs.existsSync(file), "payslip-calculator.tsx must exist");
    const content = fs.readFileSync(file, "utf-8");
    assert(content.includes("export function PayslipCalculator"), "Must export PayslipCalculator");
    assert(content.includes("Calculador de Nómina y Payslip"), "Must contain UI title");
  });

  test("LeadPreferencesPortal file structure & export", () => {
    const file = path.join(componentsDir, "crm", "lead-preferences-portal.tsx");
    assert(fs.existsSync(file), "lead-preferences-portal.tsx must exist");
    const content = fs.readFileSync(file, "utf-8");
    assert(content.includes("export function LeadPreferencesPortal"), "Must export LeadPreferencesPortal");
    assert(content.includes("Portal de Preferencias de Contacto CRM"), "Must contain UI title");
  });

  test("WatermarkStudio file structure & export", () => {
    const file = path.join(componentsDir, "video-editor", "watermark-studio.tsx");
    assert(fs.existsSync(file), "watermark-studio.tsx must exist");
    const content = fs.readFileSync(file, "utf-8");
    assert(content.includes("export function WatermarkStudio"), "Must export WatermarkStudio");
    assert(content.includes("Estudio de Marca de Agua y Optimización Video"), "Must contain UI title");
  });

  test("MeetingNotesProcessor file structure & export", () => {
    const file = path.join(componentsDir, "events", "meeting-notes-processor.tsx");
    assert(fs.existsSync(file), "meeting-notes-processor.tsx must exist");
    const content = fs.readFileSync(file, "utf-8");
    assert(content.includes("export function MeetingNotesProcessor"), "Must export MeetingNotesProcessor");
    assert(content.includes("Extractor de Tareas desde Minutas de Reunión"), "Must contain UI title");
  });

  console.log("\n══════════════════════════════════════════════════════════════");
  console.log(`  Results: ${passed} passed, ${failed} failed, ${passed + failed} total`);
  console.log("══════════════════════════════════════════════════════════════\n");

  process.exit(failed > 0 ? 1 : 0);
}

run();
