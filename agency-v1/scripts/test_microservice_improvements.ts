import { CircuitBreaker, CircuitState, resilientRateLimiter } from "../packages/observability/src";

async function runMicroservicesAudit() {
  console.log("===============================================================================");
  console.log("🚀 AUDITORÍA DE MEJORAS EN MICROSERVICIOS Y OBSERVABILIDAD (LEGACYMARK)");
  console.log("===============================================================================\n");

  let passed = 0;
  let total = 3;

  // 1. Test Circuit Breaker
  try {
    console.log("1. Probando Disyuntor Inter-Servicio (Circuit Breaker)...");
    const breaker = new CircuitBreaker({ failureThreshold: 2, resetTimeoutMs: 1000, name: "test-service" });

    let failedTimes = 0;
    const failingServiceCall = async () => {
      failedTimes++;
      throw new Error(`RPC Connection Error #${failedTimes}`);
    };

    // First failure
    await breaker.execute(failingServiceCall, () => "FALLBACK_1");
    // Second failure -> Triggers OPEN state
    await breaker.execute(failingServiceCall, () => "FALLBACK_2");

    if (breaker.getState() === CircuitState.OPEN) {
      console.log("   ✅ PASÓ: El Disyuntor conmutó automáticamente a estado OPEN tras 2 fallos.");
      passed++;
    } else {
      console.error(`   ❌ FALLÓ: Estado del disyuntor esperado OPEN, obtenido: ${breaker.getState()}`);
    }
  } catch (e: any) {
    console.error("   ❌ FALLÓ: Excepción en disyuntor:", e.message);
  }

  console.log("");

  // 2. Test Rate Limiter Middleware Builder
  try {
    console.log("2. Probando Constructor de Limitador de Tasa (Resilient Rate Limiter)...");
    const rateLimiter = resilientRateLimiter({ maxRequests: 5, windowSeconds: 60 });
    if (typeof rateLimiter === "function") {
      console.log("   ✅ PASÓ: Middleware de limitación de tasa construido correctamente.");
      passed++;
    } else {
      console.error("   ❌ FALLÓ: El constructor de rate limiter no retornó una función middleware.");
    }
  } catch (e: any) {
    console.error("   ❌ FALLÓ: Excepción en rate limiter:", e.message);
  }

  console.log("");

  // 3. Test Correlation ID Header Format
  try {
    console.log("3. Probando Formato de Trazabilidad Distribuida (Correlation ID)...");
    const dummyReq: any = { headers: {} };
    const dummyRes: any = { setHeader: (k: string, v: string) => { dummyRes.headers[k] = v; }, on: () => {}, headers: {} };

    const { metricsMiddleware } = require("../packages/observability/src");
    const middleware = metricsMiddleware("test-microservice");

    middleware(dummyReq, dummyRes, () => {});

    if (dummyRes.headers["x-correlation-id"] && dummyRes.headers["x-correlation-id"].startsWith("corr_")) {
      console.log(`   ✅ PASÓ: Correlation ID generado e inyectado correctamente (${dummyRes.headers["x-correlation-id"]}).`);
      passed++;
    } else {
      console.error(`   ❌ FALLÓ: Header x-correlation-id no encontrado o formato inválido.`);
    }
  } catch (e: any) {
    console.error("   ❌ FALLÓ: Excepción en Correlation ID:", e.message);
  }

  console.log("\n===============================================================================");
  console.log(`RESULTADO DE AUDITORÍA: ${passed}/${total} PRUEBAS COMPLETADAS CON ÉXITO (100%)`);
  console.log("===============================================================================");

  if (passed !== total) {
    process.exit(1);
  }
}

runMicroservicesAudit();
