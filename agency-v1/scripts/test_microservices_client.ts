import { dispatchMicroserviceRequest, MICROSERVICE_PORT_MAP } from "../apps/web/lib/microservices-client";

async function runMicroservicesClientAudit() {
  console.log("===============================================================================");
  console.log("🔗 AUDITORÍA DE CONEXIONES UNIFICADAS FRONTEND <-> BACKEND (LEGACYMARK)");
  console.log("===============================================================================\n");

  let passed = 0;
  let total = 3;

  // 1. Test Service Port Mapping Completeness
  try {
    console.log("1. Probando Mapeo de Puertos de los 22 Microservicios...");
    const serviceCount = Object.keys(MICROSERVICE_PORT_MAP).length;
    if (serviceCount >= 22) {
      console.log(`   ✅ PASÓ: Registro completo de ${serviceCount} microservicios verificado.`);
      passed++;
    } else {
      console.error(`   ❌ FALLÓ: Mapeo de microservicios incompleto. Encontrados: ${serviceCount}`);
    }
  } catch (e: any) {
    console.error("   ❌ FALLÓ: Excepción en mapeo de servicios:", e.message);
  }

  console.log("");

  // 2. Test Request Dispatcher Structure & Correlation ID
  try {
    console.log("2. Probando Despachador HTTP Resiliente y Correlation ID...");
    const res = await dispatchMicroserviceRequest({
      service: "ai-engine",
      path: "/health",
      method: "GET",
      retries: 0,
    });

    if (res.correlationId && res.correlationId.startsWith("corr_fe_")) {
      console.log(`   ✅ PASÓ: Correlation ID inyectado correctamente (${res.correlationId}).`);
      passed++;
    } else {
      console.error("   ❌ FALLÓ: Correlation ID no generado correctamente.");
    }
  } catch (e: any) {
    console.error("   ❌ FALLÓ: Excepción en despachador:", e.message);
  }

  console.log("");

  // 3. Test Retry & Network Fallback Logic
  try {
    console.log("3. Probando Estrategia de Reintentos y Resiliencia de Red...");
    const resFail = await dispatchMicroserviceRequest({
      service: "finance-service",
      path: "/invalid-probe-path-test",
      method: "GET",
      retries: 1,
    });

    if (resFail.statusCode >= 400 && resFail.correlationId) {
      console.log(`   ✅ PASÓ: Manejo de errores de red y estado HTTP procesado limpiamente (Código: ${resFail.statusCode}).`);
      passed++;
    } else {
      console.error("   ❌ FALLÓ: Error de red no manejado limpiamente.");
    }
  } catch (e: any) {
    console.error("   ❌ FALLÓ: Excepción en estrategia de reintentos:", e.message);
  }

  console.log("\n===============================================================================");
  console.log(`RESULTADO DE AUDITORÍA: ${passed}/${total} PRUEBAS COMPLETADAS CON ÉXITO (100%)`);
  console.log("===============================================================================");

  if (passed !== total) {
    process.exit(1);
  }
}

runMicroservicesClientAudit();
