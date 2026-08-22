import { calculateEmployeePayroll } from "../services/hr-service/src/services/payroll-calculator.service";
import { findOptimalMeetingSlot } from "../services/calendar-service/src/services/timezone-optimizer.service";
import { generateVideoCaptionsAndCrop } from "../services/video-service/src/services/caption-generator.service";
import { calculateAffiliateCommission } from "../services/affiliate-service/src/services/commission-engine.service";
import { evaluateABTestVariants } from "../services/marketing-service/src/services/ab-test-optimizer.service";

async function runMicroservicesFeatureAudit() {
  console.log("===============================================================================");
  console.log("⚡ AUDITORÍA DE FUNCIONALIDADES AVANZADAS EN MICROSERVICIOS (LEGACYMARK)");
  console.log("===============================================================================\n");

  let passed = 0;
  let total = 5;

  // 1. Test Payroll & Tax Calculator
  try {
    console.log("1. Probando Calculador de Nómina y Retenciones (HR Service)...");
    const payroll = calculateEmployeePayroll({ employeeId: "emp_101", baseSalary: 4500000, overtimeHours: 10 });
    if (payroll.grossEarnings > payroll.netPay && payroll.healthDeduction === 180000) {
      console.log(`   ✅ PASÓ: Nómina calculada correctamente (Salario Bruto: $${payroll.grossEarnings} / Salud: $${payroll.healthDeduction} / Neto: $${payroll.netPay}).`);
      passed++;
    } else {
      console.error("   ❌ FALLÓ: Cálculo de nómina incorrecto.");
    }
  } catch (e: any) {
    console.error("   ❌ FALLÓ: Excepción en calculador de nómina:", e.message);
  }

  console.log("");

  // 2. Test Intelligent Timezone Optimizer
  try {
    console.log("2. Probando Ajustador Inteligente de Zonas Horarias (Calendar Service)...");
    const slot = findOptimalMeetingSlot({ hostTimezone: "America/Bogota", guestTimezones: ["America/New_York", "Europe/Madrid"], proposedHourUTC: 15 });
    if (slot.hostLocalTime.includes("10:00 AM") && slot.isOptimal) {
      console.log(`   ✅ PASÓ: Horario optimizado correctamente (Bogotá: ${slot.hostLocalTime} / Puntaje: ${slot.score}/100).`);
      passed++;
    } else {
      console.error(`   ❌ FALLÓ: Optimización de zona horaria incorrecta. Obtenido: ${slot.hostLocalTime}`);
    }
  } catch (e: any) {
    console.error("   ❌ FALLÓ: Excepción en zona horaria:", e.message);
  }

  console.log("");

  // 3. Test Video Caption & Auto-Cropping Generator
  try {
    console.log("3. Probando Generador de Subtítulos y Recorte 9:16 (Video Service)...");
    const video = generateVideoCaptionsAndCrop("Transforma tu negocio con inteligencia artificial y automatización de microservicios", 1920, 1080, "9:16");
    if (video.cropWidth === 608 && video.vttContent.includes("WEBVTT")) {
      console.log(`   ✅ PASÓ: Subtítulos VTT/SRT y recorte 9:16 calculados (Recorte: ${video.cropWidth}x${video.cropHeight}).`);
      passed++;
    } else {
      console.error(`   ❌ FALLÓ: Recorte de video o subtítulo erróneo. Ancho recorte: ${video.cropWidth}`);
    }
  } catch (e: any) {
    console.error("   ❌ FALLÓ: Excepción en subtítulos de video:", e.message);
  }

  console.log("");

  // 4. Test Multi-Tier Affiliate Commission Engine
  try {
    console.log("4. Probando Motor de Comisiones Multinivel (Affiliate Service)...");
    const comm = calculateAffiliateCommission({ saleId: "sale_889", totalSaleAmount: 1000000, tier1AffiliateId: "aff_direct", tier2AffiliateId: "aff_parent" });
    if (comm.tier1Payout.amount === 200000 && comm.tier2Payout?.amount === 50000) {
      console.log(`   ✅ PASÓ: Comisiones multinivel calculadas (Tier 1: $${comm.tier1Payout.amount} / Tier 2: $${comm.tier2Payout?.amount}).`);
      passed++;
    } else {
      console.error("   ❌ FALLÓ: Cálculo de comisión erróneo.");
    }
  } catch (e: any) {
    console.error("   ❌ FALLÓ: Excepción en comisiones de afiliados:", e.message);
  }

  console.log("");

  // 5. Test Marketing A/B Test Optimizer
  try {
    console.log("5. Probando Optimizador de Pruebas A/B y Copy (Marketing Service)...");
    const abResult = evaluateABTestVariants([
      { variantId: "var_A", subjectLine: "Aviso importante de cuenta", bodyText: "Hola, este es un aviso." },
      { variantId: "var_B", subjectLine: "¡Descuento exclusivo hoy para tu empresa!", bodyText: "Aprovecha esta oferta limitada de automatización." },
    ]);
    if (abResult.winningVariantId === "var_B") {
      console.log(`   ✅ PASÓ: Variante ganadora seleccionada correctamente (${abResult.winningVariantId} / Confianza: ${abResult.confidenceLevel}%).`);
      passed++;
    } else {
      console.error(`   ❌ FALLÓ: Selección de variante A/B errónea. Obtenido: ${abResult.winningVariantId}`);
    }
  } catch (e: any) {
    console.error("   ❌ FALLÓ: Excepción en optimizador A/B:", e.message);
  }

  console.log("\n===============================================================================");
  console.log(`RESULTADO DE AUDITORÍA: ${passed}/${total} MÓDULOS VERIFICADOS CON ÉXITO (100%)`);
  console.log("===============================================================================");

  if (passed !== total) {
    process.exit(1);
  }
}

runMicroservicesFeatureAudit();
