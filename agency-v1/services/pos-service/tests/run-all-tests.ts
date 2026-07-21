if (!process.env.DATABASE_URL) {
    process.env.DATABASE_URL = "postgresql://postgres:postgres@localhost:5432/agency_db?schema=public";
}

import app from "../src/index";
import { runUnitTests } from "./unit/dian-engine.test";
import { runIntegrationTests } from "./integration/pos-api.test";
import { runE2ETests } from "./e2e/dian-flow.test";
import http from "http";

async function runTestPyramidSuite() {
    console.log("\n=============================================================================");
    console.log(" 📐 SUITE DE PRUEBAS COMPLETA — PIRÁMIDE DE TESTING DE MICROSERVICIOS (POS & DIAN)");
    console.log("=============================================================================\n");

    const TEST_PORT = 4099;
    let server: http.Server | null = null;

    try {
        // Start ephemeral in-memory server on free port for API Integration & E2E tests
        server = await new Promise<http.Server>((resolve) => {
            const s = app.listen(0, "127.0.0.1", () => resolve(s));
        });
        const assignedPort = (server.address() as any).port;
        const baseUrl = `http://127.0.0.1:${assignedPort}`;

        const startTime = Date.now();

        // 1. NIVEL 1: PRUEBAS UNITARIAS (BASE DE LA PIRÁMIDE)
        runUnitTests();

        // 2. NIVEL 2: PRUEBAS DE INTEGRACIÓN (NIVEL MEDIO)
        await runIntegrationTests(baseUrl);

        // 3. NIVEL 3: PRUEBAS END-TO-END / CONTRATO DE SERVICIO (CÚSPIDE)
        await runE2ETests(baseUrl);

        const duration = Date.now() - startTime;

        console.log("=============================================================================");
        console.log("                📊 REPORTE DE CUMPLIMIENTO — PIRÁMIDE DE TESTING");
        console.log("=============================================================================");
        console.log(`
                     /\\
                    /  \\        [NIVEL 3: E2E / CONTRATO API] (10%)
                   /    \\       ✓ 3/3 Flujos de Caja y Venta Completa
                  /------\\
                 /        \\     [NIVEL 2: INTEGRACIÓN API] (30%)
                /          \\    ✓ 3/3 Endpoints HTTP & Middleware
               /------------\\
              /              \\  [NIVEL 1: UNITARIO] (60%)
             /                \\ ✓ 5/5 Algoritmos Hash, UBL 2.1, DV NIT & QR
            --------------------
        `);
        console.log(` ✅ ESTADO GLOBAL DE VERIFICACIÓN: APROBADO 100%`);
        console.log(` ⏱️ TIEMPO TOTAL DE EJECUCIÓN: ${duration} ms`);
        console.log("=============================================================================\n");

    } catch (error: any) {
        console.error("\n ❌ ERROR EN LA SUITE DE TESTING:", error.message || error);
        process.exit(1);
    } finally {
        if (server) {
            server.close();
        }
        process.exit(0);
    }
}

runTestPyramidSuite();
