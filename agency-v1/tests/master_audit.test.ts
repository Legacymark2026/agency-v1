/**
 * Master Audit & Regression Verification Runner
 * ─────────────────────────────────────────────────────────────────────────────
 * Run with: npx tsx tests/master_audit.test.ts
 */

import { execSync } from "child_process";

const testFiles = [
  "tests/utility_expansion.test.ts",
  "tests/phase2_utility.test.ts",
  "tests/phase3_utility.test.ts",
  "tests/contracts.test.ts"
];

console.log("\n══════════════════════════════════════════════════════════════");
console.log("  LegacyMark — Comprehensive Platform Bug & Regression Audit");
console.log("══════════════════════════════════════════════════════════════\n");

let passedCount = 0;
let failedCount = 0;

for (const testFile of testFiles) {
  console.log(`▶ Executing audit suite: ${testFile}`);
  try {
    const output = execSync(`npx tsx ${testFile}`, { encoding: "utf-8" });
    console.log(output);
    console.log(`✅ Passed: ${testFile}\n`);
    passedCount++;
  } catch (err: any) {
    console.error(`❌ Failed: ${testFile}`);
    console.error(err.stdout || err.message);
    failedCount++;
  }
}

console.log("══════════════════════════════════════════════════════════════");
console.log(`  Master Audit Summary: ${passedCount} suites passed, ${failedCount} suites failed.`);
console.log("══════════════════════════════════════════════════════════════\n");

process.exit(failedCount > 0 ? 1 : 0);
