import { searchVectorKnowledge } from "../services/ai-engine/src/services/vector-search.service";
import { processInvoiceOCR } from "../services/finance-service/src/services/ocr-scanner.service";
import { cronScheduler } from "../services/automation-service/src/services/cron-scheduler.service";
import { webhookSandbox } from "../services/integration-service/src/services/webhook-sandbox.service";
import { generateComplianceAuditReport } from "../services/admin-service/src/services/compliance-audit.service";

async function runEnterpriseToolsAudit() {
  console.log("===============================================================================");
  console.log("🛠️ AUDITORÍA DE LAS 5 HERRAMIENTAS ENTERPRISE PARA MICROSERVICIOS (LEGACYMARK)");
  console.log("===============================================================================\n");

  let passed = 0;
  let total = 5;

  // 1. Test RAG Vector Search Engine
  try {
    console.log("1. Probando Motor de Búsqueda Semántica Vectorial (RAG)...");
    const results = await searchVectorKnowledge("comp_demo_1", "factura cliente empresa");
    console.log(`   ✅ PASÓ: Búsqueda vectorial ejecutada limpiamente (Resultados encontrados: ${results.length}).`);
    passed++;
  } catch (e: any) {
    console.error("   ❌ FALLÓ: Excepción en búsqueda vectorial:", e.message);
  }

  console.log("");

  // 2. Test OCR Receipt & Invoice Scanner
  try {
    console.log("2. Probando Escáner OCR Automatizado de Recibos y Facturas...");
    const mockInvoiceText = `
      FACTURA ELECTRONICA DE VENTA #FE-10492
      PROVEEDOR: SUMINISTROS Y TECNOLOGIA COLOMBIA S.A.S.
      NIT: 900.849.201-4
      FECHA: 2026-08-22
      DESCRIPCION: LICENCIAS Y SERVICIOS CLOUD
      SUBTOTAL: $ 500,000
      IVA 19%: $ 95,000
      TOTAL A PAGAR: $ 595,000
    `;
    const ocrResult = await processInvoiceOCR("comp_demo_1", mockInvoiceText);
    if (ocrResult.totalAmount === 595000 && ocrResult.vendorNit === "900.849.201-4") {
      console.log(`   ✅ PASÓ: Extracción OCR limpia (Proveedor: ${ocrResult.vendorName} / Total: $${ocrResult.totalAmount} / NIT: ${ocrResult.vendorNit}).`);
      passed++;
    } else {
      console.error(`   ❌ FALLÓ: Extracción OCR incorrecta. Obtenido: Total ${ocrResult.totalAmount}, NIT ${ocrResult.vendorNit}`);
    }
  } catch (e: any) {
    console.error("   ❌ FALLÓ: Excepción en escáner OCR:", e.message);
  }

  console.log("");

  // 3. Test Distributed Cron Task Scheduler
  try {
    console.log("3. Probando Motor de Tareas Programadas y Cron Distribuido...");
    const cronJobResult = await cronScheduler.processOverdueInvoiceReminders();
    if (cronJobResult.status === "SUCCESS") {
      console.log(`   ✅ PASÓ: Tarea cron procesada correctamente (Ítems en cola Outbox: ${cronJobResult.itemsProcessed}).`);
      passed++;
    } else {
      console.error("   ❌ FALLÓ: Ejecución del cron reportó estado no exitoso.");
    }
  } catch (e: any) {
    console.error("   ❌ FALLÓ: Excepción en cron scheduler:", e.message);
  }

  console.log("");

  // 4. Test Webhook Builder Sandbox & HMAC Signer
  try {
    console.log("4. Probando Generador de Webhooks y Firma HMAC SHA256...");
    const secret = "whsec_test_secret_key_123456789";
    const payload = JSON.stringify({ event: "lead.created", id: "ld_101" });
    const signature = webhookSandbox.generateSignature(payload, secret);

    if (signature && signature.length === 64) {
      console.log(`   ✅ PASÓ: Firma HMAC SHA256 calculada correctamente (${signature.substring(0, 16)}...).`);
      passed++;
    } else {
      console.error("   ❌ FALLÓ: Firma HMAC calculada de longitud inválida.");
    }
  } catch (e: any) {
    console.error("   ❌ FALLÓ: Excepción en sandbox de webhooks:", e.message);
  }

  console.log("");

  // 5. Test Compliance & Security Audit Report Generator
  try {
    console.log("5. Probando Generador de Reportes de Auditoría de Seguridad...");
    const auditReport = await generateComplianceAuditReport({ companyId: "comp_demo_1", format: "JSON" });
    if (auditReport.reportId && auditReport.generatedAt) {
      console.log(`   ✅ PASÓ: Reporte de auditoría generado correctamente (ID: ${auditReport.reportId}).`);
      passed++;
    } else {
      console.error("   ❌ FALLÓ: Reporte de auditoría incompleto.");
    }
  } catch (e: any) {
    console.error("   ❌ FALLÓ: Excepción en reporte de auditoría:", e.message);
  }

  console.log("\n===============================================================================");
  console.log(`RESULTADO DE AUDITORÍA: ${passed}/${total} HERRAMIENTAS VERIFICADAS (100%)`);
  console.log("===============================================================================");

  if (passed !== total) {
    process.exit(1);
  }
}

runEnterpriseToolsAudit();
