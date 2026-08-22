/**
 * Phase 3 Microservices Utility Verification Tests
 * ─────────────────────────────────────────────────────────────────────────────
 * Run with: npx tsx tests/phase3_utility.test.ts
 */

import { VideoProcessorService } from "../services/video-service/src/services/video-processor.service";
import { PredictiveService } from "../services/analytics-service/src/services/predictive.service";
import { PayrollService } from "../services/hr-service/src/services/payroll.service";
import { PreferencesService } from "../services/crm-service/src/services/preferences.service";
import { PriorityQueueService } from "../services/notification-service/src/services/priority-queue.service";

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
  console.log("  LegacyMark — Phase 3 Utility Verification Tests");
  console.log("══════════════════════════════════════════════════════════════\n");

  // 1. Video optimization and watermarking
  await test("VideoProcessorService: optimize and watermark stubs", async () => {
    const optResult = await VideoProcessorService.optimizeVideoForWeb("campaign.mp4");
    assert(optResult.success === true, "Optimization should be successful");
    assert(optResult.optimizedPath.endsWith(".webm"), "Optimized path should be WebM");

    const wmResult = await VideoProcessorService.applyWatermark("campaign.mp4", "logo.png", "TOP_LEFT");
    assert(wmResult.success === true, "Watermarking should be successful");
    assert(wmResult.position === "TOP_LEFT", "Watermark position should match input");
  });

  // 2. Analytics regression sales forecast and PDF report
  await test("PredictiveService: linear regression sales forecast and report generation", async () => {
    const forecast = await PredictiveService.predictNextWeekSales("company-abc");
    assert(forecast.predictedSales > 0, "Forecast sales should be positive");
    assert(forecast.historicalWeeksCount === 4, "Should run linear regression over 4 weeks");

    const reportBase64 = await PredictiveService.generateReportHtml("company-abc");
    assert(reportBase64.length > 100, "Base64 HTML report data should be a non-empty string");
  });

  // 3. HR payroll slip calculations
  await test("PayrollService: salary and tax deductions calculations", async () => {
    // Check gross salary = 40 hours * $50/hr = $2000
    // Deductions: Health (4% = $80), Pension (4% = $80), Tax (10% on >$2000 = $200) -> total: $360
    // Net: $1640
    const pay = await PayrollService.calculatePayroll({
      employeeId: "emp-001",
      hoursWorked: 40,
      ratePerHour: 50,
      bonus: 100 // Gross: 2100 -> tax: 10% = 210, health/pension: 84+84=168 -> total: 378 -> Net: 1722
    });

    assert(pay.grossSalary === 2100, `Expected Gross 2100, got ${pay.grossSalary}`);
    assert(pay.deductions.health === 84, `Expected Health deduction 84, got ${pay.deductions.health}`);
    assert(pay.deductions.pension === 84, `Expected Pension deduction 84, got ${pay.deductions.pension}`);
    assert(pay.deductions.tax === 210, `Expected Tax withholding 210, got ${pay.deductions.tax}`);
    assert(pay.netSalary === 1722, `Expected Net 1722, got ${pay.netSalary}`);
  });

  // 4. CRM opt-out unsubscribe
  await test("PreferencesService: lead unsubscribe opt-out persistence", async () => {
    const result = await PreferencesService.unsubscribeLead("client@marketing.com", "SMS");
    assert(result.success === true, "Unsubscribe should succeed");
    assert(result.unsubscribedChannel === "SMS", "Unsubscribed channel should be SMS");
    assert(result.status === "LOST", "Unsubscribed status should update to LOST");
  });

  // 5. Notification Priority QoS Queue
  await test("PriorityQueueService: priority enqueuing sorting", async () => {
    const payload = { title: "2FA Code", body: "123456" };
    const result = await PriorityQueueService.enqueueNotification(payload, "HIGH");
    assert(result.priority === "HIGH", "Notification priority should be HIGH");
    assert(result.queueName === "notifications:queue:high", "High priority should go to high queue");
  });

  console.log("\n══════════════════════════════════════════════════════════════");
  console.log(`  Results: ${passed} passed, ${failed} failed, ${passed + failed} total`);
  console.log("══════════════════════════════════════════════════════════════\n");

  process.exit(failed > 0 ? 1 : 0);
}

run();
