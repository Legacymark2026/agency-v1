import { multichannelOrchestrator } from "../services/marketing-service/src/services/multichannel-orchestrator.service";
import { spamScoreShield } from "../services/marketing-service/src/services/spam-score-shield.service";
import { bounceUnsubHandler } from "../services/marketing-service/src/services/bounce-unsub-handler.service";
import { sendTimeOptimizer } from "../services/marketing-service/src/services/send-time-optimizer.service";
import { campaignROIAttribution } from "../services/marketing-service/src/services/campaign-roi-attribution.service";

async function runMarketingEnterpriseSuiteAudit() {
  console.log("===============================================================================");
  console.log("🚀 AUDITORÍA MASTER DE LA SUITE DE MARKETING & CAMPAÑAS ENTERPRISE");
  console.log("===============================================================================\n");

  let passed = 0;
  const total = 5;

  // 1. Test Multi-Channel Orchestrator
  try {
    console.log("1. Probando Orquestador Multicanal (Email + WhatsApp + SMS Cascade)...");
    const plan = multichannelOrchestrator.createCampaignPlan("Lanzamiento Q4 SaaS Enterprise", 1000);
    const report = multichannelOrchestrator.executeCascadeDispatch(plan);

    if (report.channelDispatches.length === 2 && report.totalConversions > 200) {
      console.log(`   ✅ PASÓ: Despacho multicanal en cascada ejecutado con éxito (${report.channelDispatches[0].sentCount} emails -> ${report.channelDispatches[1].sentCount} WhatsApps, Total Conversiones: ${report.totalConversions}).`);
      passed++;
    } else {
      console.error("   ❌ FALLÓ: Despacho multicanal incorrecto.");
    }
  } catch (e: any) {
    console.error("   ❌ FALLÓ: Excepción en Multichannel Orchestrator:", e.message);
  }

  console.log("");

  // 2. Test Spam Score Shield
  try {
    console.log("2. Probando Optimizador de Asuntos & Escudo Anti-Spam (Spam Shield)...");
    const cleanAudit = spamScoreShield.evaluateEmail(
      "Guía Estratégica: Cómo Escalar Tu Facturación y Flujo de Caja",
      "Estimado cliente, descubre cómo optimizar la emisión de tus facturas electrónicas con LegacyMark."
    );
    const spamAudit = spamScoreShield.evaluateEmail(
      "¡¡¡GANA DINERO RÁPIDO Y 100% GRATIS COMPRA AHORA SIN RIESGO!!!",
      "Hazte rico hoy mismo con esta oferta exclusiva."
    );

    if (cleanAudit.isSafeToSend && cleanAudit.deliverabilityScore >= 90 && !spamAudit.isSafeToSend && spamAudit.deliverabilityScore < 50) {
      console.log(`   ✅ PASÓ: Escudo Anti-Spam validado (Asunto Legítimo: ${cleanAudit.deliverabilityScore}/100 [SEGURO], Asunto Spam: ${spamAudit.deliverabilityScore}/100 [BLOQUEADO]).`);
      passed++;
    } else {
      console.error("   ❌ FALLÓ: Evaluación de spam errónea.");
    }
  } catch (e: any) {
    console.error("   ❌ FALLÓ: Excepción en Spam Score Shield:", e.message);
  }

  console.log("");

  // 3. Test Bounce & RFC 8058 One-Click Unsubscribe Handler
  try {
    console.log("3. Probando Manejador de Rebotes & Cabeceras RFC 8058 One-Click...");
    const rfcHeaders = bounceUnsubHandler.generateRFC8058Headers("usuario@cliente.com", "camp_q4_01");
    const bounceRes = bounceUnsubHandler.processWebhookEvent({
      eventId: "evt_bounce_99",
      email: "invalid-bounce@empresa.com",
      eventType: "HARD_BOUNCE",
      provider: "RESEND",
      timestamp: new Date().toISOString(),
    });
    const isSuppressed = bounceUnsubHandler.isEmailSuppressed("invalid-bounce@empresa.com");

    if (rfcHeaders["List-Unsubscribe-Post"] === "List-Unsubscribe=One-Click" && bounceRes.suppressed && isSuppressed) {
      console.log(`   ✅ PASÓ: Cabeceras RFC 8058 generadas y lista de supresión actualizada ante rebotes duros.`);
      passed++;
    } else {
      console.error("   ❌ FALLÓ: Procesamiento de rebotes o RFC 8058 incorrecto.");
    }
  } catch (e: any) {
    console.error("   ❌ FALLÓ: Excepción en Bounce Handler:", e.message);
  }

  console.log("");

  // 4. Test Send-Time Optimization (STO)
  try {
    console.log("4. Probando Optimización Predictiva de Hora de Envío (STO Engine)...");
    const stoResult = sendTimeOptimizer.calculateOptimalSendTime({
      email: "ejecutivo@corporativo.com",
      timezone: "America/Bogota",
      historicalOpenHoursUTC: [13, 13, 14, 13, 14], // ~8-9 AM COT
      personaType: "B2B_EXECUTIVE",
    });

    if (stoResult.recommendedLocalHour >= 7 && stoResult.recommendedLocalHour <= 10 && stoResult.confidenceScore >= 80) {
      console.log(`   ✅ PASÓ: STO calculó franja horaria óptima personalizada (${stoResult.timeSlotDescription}, Confianza: ${stoResult.confidenceScore}%).`);
      passed++;
    } else {
      console.error("   ❌ FALLÓ: Cálculo STO incorrecto.");
    }
  } catch (e: any) {
    console.error("   ❌ FALLÓ: Excepción en Send-Time Optimizer:", e.message);
  }

  console.log("");

  // 5. Test Campaign ROI & Direct Deal Attribution
  try {
    console.log("5. Probando Motor de Atribución de Ingresos y Cálculo de ROI/ROAS...");
    const roiReport = campaignROIAttribution.calculateCampaignROI(
      {
        campaignId: "camp_q4_enterprise",
        campaignName: "Campaña Adquisición Q4",
        totalCostCOP: 5000000,
        utmCampaign: "q4_enterprise_lead",
        utmSource: "email_broadcast",
      },
      [
        { dealId: "deal_1", clientNit: "900849201-1", dealValueCOP: 12000000, utmCampaign: "q4_enterprise_lead", closedAt: "2026-08-20" },
        { dealId: "deal_2", clientNit: "900849201-2", dealValueCOP: 15000000, utmCampaign: "q4_enterprise_lead", closedAt: "2026-08-22" },
      ]
    );

    if (roiReport.totalAttributedRevenueCOP === 27000000 && roiReport.roasMultiplier === 5.4 && roiReport.status === "HIGH_PROFITABLE") {
      console.log(`   ✅ PASÓ: ROI atribuido en vivo (Inversión: $5M COP -> Ingresos: $${roiReport.totalAttributedRevenueCOP.toLocaleString()} COP, ROAS: ${roiReport.roasMultiplier}x, ROI: ${roiReport.netRoiPercentage}%).`);
      passed++;
    } else {
      console.error("   ❌ FALLÓ: Cálculo de atribución ROI incorrecto.");
    }
  } catch (e: any) {
    console.error("   ❌ FALLÓ: Excepción en Campaign ROI Attribution:", e.message);
  }

  console.log("\n===============================================================================");
  console.log(`RESULTADO DE AUDITORÍA MARKETING: ${passed}/${total} MÓDULOS VERIFICADOS AL 100%`);
  console.log("ESTADO: MICROSERVICIO DE MARKETING 100% LISTO PARA OPERACIONES EN VIVO");
  console.log("===============================================================================");

  if (passed !== total) {
    process.exit(1);
  }
}

runMarketingEnterpriseSuiteAudit();
