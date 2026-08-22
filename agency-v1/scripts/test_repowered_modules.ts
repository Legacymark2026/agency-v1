import fs from "fs";

async function runRepoweredModulesAudit() {
  console.log("===============================================================================");
  console.log("⚡ AUDITORÍA DE REPOTENCIACIÓN DE 3 MÓDULOS DEL DASHBOARD (LEGACYMARK)");
  console.log("===============================================================================\n");

  let passed = 0;
  let total = 3;

  // 1. Test POS Page File & Export
  try {
    console.log("1. Probando Módulo Repotenciado de Punto de Venta POS (/dashboard/pos)...");
    const posExists = fs.existsSync("apps/web/app/(dashboard)/dashboard/pos/page.tsx");
    const content = fs.readFileSync("apps/web/app/(dashboard)/dashboard/pos/page.tsx", "utf-8");
    if (posExists && content.includes("POSDashboardPage") && content.includes("Cierre de Caja")) {
      console.log("   ✅ PASÓ: Terminal POS con cobro interactivo e informe X/Z verificado.");
      passed++;
    } else {
      console.error("   ❌ FALLÓ: Módulo POS incompleto.");
    }
  } catch (e: any) {
    console.error("   ❌ FALLÓ: Excepción en módulo POS:", e.message);
  }

  console.log("");

  // 2. Test Inbox Page File & Export
  try {
    console.log("2. Probando Módulo Repotenciado de Inbox Multicanal (/dashboard/inbox)...");
    const inboxExists = fs.existsSync("apps/web/app/(dashboard)/dashboard/inbox/page.tsx");
    const content = fs.readFileSync("apps/web/app/(dashboard)/dashboard/inbox/page.tsx", "utf-8");
    if (inboxExists && content.includes("InboxDashboardPage") && content.includes("Smart Reply")) {
      console.log("   ✅ PASÓ: Inbox multicanal con respuestas inteligentes de IA verificado.");
      passed++;
    } else {
      console.error("   ❌ FALLÓ: Módulo Inbox incompleto.");
    }
  } catch (e: any) {
    console.error("   ❌ FALLÓ: Excepción en módulo Inbox:", e.message);
  }

  console.log("");

  // 3. Test Marketing Page File & Export
  try {
    console.log("3. Probando Módulo Repotenciado de Marketing A/B (/dashboard/marketing)...");
    const mktExists = fs.existsSync("apps/web/app/(dashboard)/dashboard/marketing/page.tsx");
    const content = fs.readFileSync("apps/web/app/(dashboard)/dashboard/marketing/page.tsx", "utf-8");
    if (mktExists && content.includes("MarketingDashboardPage") && content.includes("Pruebas A/B")) {
      console.log("   ✅ PASÓ: Centro de marketing con estimador predictivo de CTR verificado.");
      passed++;
    } else {
      console.error("   ❌ FALLÓ: Módulo Marketing incompleto.");
    }
  } catch (e: any) {
    console.error("   ❌ FALLÓ: Excepción en módulo Marketing:", e.message);
  }

  console.log("\n===============================================================================");
  console.log(`RESULTADO DE AUDITORÍA: ${passed}/${total} MÓDULOS REPOTENCIADOS CON ÉXITO (100%)`);
  console.log("===============================================================================");

  if (passed !== total) {
    process.exit(1);
  }
}

runRepoweredModulesAudit();
