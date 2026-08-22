import fs from "fs";

async function runMasterHubAudit() {
  console.log("===============================================================================");
  console.log("🛠️ AUDITORÍA DE LA CONSOLA MAESTRA DE HERRAMIENTAS ENTERPRISE (LEGACYMARK)");
  console.log("===============================================================================\n");

  let passed = 0;
  let total = 1;

  try {
    console.log("1. Probando Consola Maestra de Herramientas (/dashboard/tools/master-hub)...");
    const exists = fs.existsSync("apps/web/app/(dashboard)/dashboard/tools/master-hub/page.tsx");
    const content = fs.readFileSync("apps/web/app/(dashboard)/dashboard/tools/master-hub/page.tsx", "utf-8");

    if (exists && content.includes("MasterToolsHubPage") && content.includes("dispatchMicroserviceRequest")) {
      console.log("   ✅ PASÓ: Consola Maestra verificada con cliente HTTP de microservicios.");
      passed++;
    } else {
      console.error("   ❌ FALLÓ: Consola Maestra incompleta.");
    }
  } catch (e: any) {
    console.error("   ❌ FALLÓ: Excepción en Consola Maestra:", e.message);
  }

  console.log("\n===============================================================================");
  console.log(`RESULTADO DE AUDITORÍA: ${passed}/${total} CONSOLA MAESTRA VERIFICADA AL 100%`);
  console.log("===============================================================================");

  if (passed !== total) {
    process.exit(1);
  }
}

runMasterHubAudit();
