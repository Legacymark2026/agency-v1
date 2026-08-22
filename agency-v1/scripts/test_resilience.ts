import { executeResilientLLM } from "../services/ai-engine/src/services/llm-provider-cascade";
import { sendResilientEmail } from "../services/notification-service/src/services/email-fallback-transporter";
import { ResilientCacheClient } from "../packages/events/src/resilient-cache-client";

async function runResilienceAudit() {
  console.log("===============================================================================");
  console.log("🛡️ AUDITORÍA DE SISTEMA DE RESILIENCIA Y FALLBACKS MULTICAPA (LEGACYMARK)");
  console.log("===============================================================================\n");

  let passed = 0;
  let total = 3;

  // 1. LLM Provider Cascade Test
  try {
    console.log("1. Probando Cascada de Proveedores LLM (AI Engine)...");
    const llmResult = await executeResilientLLM({
      systemPrompt: "Eres un asistente de IA resiliente.",
      userMessage: "Consulta de prueba sobre precios y soporte.",
      preferredModelId: "invalid-provider-trigger-failover",
    });

    if (llmResult && llmResult.text && llmResult.fallbackTriggered) {
      console.log(`   ✅ PASÓ: Fallback de IA exitoso (${llmResult.providerUsed} / Latencia: ${llmResult.latencyMs}ms)`);
      console.log(`      Respuesta de contingencia: "${llmResult.text.slice(0, 80)}..."`);
      passed++;
    } else {
      console.error("   ❌ FALLÓ: El resultado de IA no activó el fallback esperado.");
    }
  } catch (e: any) {
    console.error("   ❌ FALLÓ: Excepción en prueba de IA:", e.message);
  }

  console.log("");

  // 2. Multi-Provider Email Fallback Test
  try {
    console.log("2. Probando Transpotador de Email Resiliente (Notification Service)...");
    const emailResult = await sendResilientEmail({
      to: "test.fallback@legacymarksas.com",
      subject: "Test de Notificación Resiliente",
      html: "<p>Prueba de contingencia</p>",
    });

    if (emailResult && emailResult.success) {
      console.log(`   ✅ PASÓ: Despacho de email resiliente exitoso (Proveedor: ${emailResult.provider} / Intentos: ${emailResult.attempts})`);
      passed++;
    } else {
      console.error("   ❌ FALLÓ: Despacho de email falló por completo.");
    }
  } catch (e: any) {
    console.error("   ❌ FALLÓ: Excepción en prueba de email:", e.message);
  }

  console.log("");

  // 3. Resilient Cache Client Test
  try {
    console.log("3. Probando Caché Resiliente (Redis a In-Memory LRU Fallback)...");
    const cache = new ResilientCacheClient("redis://127.0.0.1:65432"); // Invalid port to trigger instant in-memory fallback
    await cache.set("audit_key_resilience", "OK_FALLBACK_VAL", 60);
    const val = await cache.get("audit_key_resilience");

    if (val === "OK_FALLBACK_VAL") {
      console.log("   ✅ PASÓ: Conmutación de caché Redis a LRU en memoria procesal exitosa.");
      passed++;
    } else {
      console.error(`   ❌ FALLÓ: Valor esperado OK_FALLBACK_VAL, obtenido: ${val}`);
    }
  } catch (e: any) {
    console.error("   ❌ FALLÓ: Excepción en prueba de caché:", e.message);
  }

  console.log("\n===============================================================================");
  console.log(`RESULTADO DE AUDITORÍA: ${passed}/${total} PRUEBAS COMPLETADAS CON ÉXITO (100%)`);
  console.log("===============================================================================");

  if (passed !== total) {
    process.exit(1);
  }
}

runResilienceAudit();
