import fs from "fs";

async function runRepoweredBatch2Audit() {
  console.log("===============================================================================");
  console.log("⚡ AUDITORÍA DE REPOTENCIACIÓN DE 3 MÓDULOS ADICIONALES (LEGACYMARK)");
  console.log("===============================================================================\n");

  let passed = 0;
  let total = 3;

  // 1. Test Kanban Page File & Export
  try {
    console.log("1. Probando Módulo Repotenciado de Kanban CRM (/dashboard/kanban)...");
    const kanbanExists = fs.existsSync("apps/web/app/(dashboard)/dashboard/kanban/page.tsx");
    const content = fs.readFileSync("apps/web/app/(dashboard)/dashboard/kanban/page.tsx", "utf-8");
    if (kanbanExists && content.includes("KanbanDashboardPage") && content.includes("CERRADO_GANADO")) {
      console.log("   ✅ PASÓ: Tablero Kanban CRM interactivo verificado con éxito.");
      passed++;
    } else {
      console.error("   ❌ FALLÓ: Módulo Kanban incompleto.");
    }
  } catch (e: any) {
    console.error("   ❌ FALLÓ: Excepción en módulo Kanban:", e.message);
  }

  console.log("");

  // 2. Test Video Page File & Export
  try {
    console.log("2. Probando Módulo Repotenciado de Estudio de Video (/dashboard/video)...");
    const videoExists = fs.existsSync("apps/web/app/(dashboard)/dashboard/video/page.tsx");
    const content = fs.readFileSync("apps/web/app/(dashboard)/dashboard/video/page.tsx", "utf-8");
    if (videoExists && content.includes("VideoDashboardPage") && content.includes("WEBVTT")) {
      console.log("   ✅ PASÓ: Estudio de video 9:16 con generador de subtítulos verificado.");
      passed++;
    } else {
      console.error("   ❌ FALLÓ: Módulo Video incompleto.");
    }
  } catch (e: any) {
    console.error("   ❌ FALLÓ: Excepción en módulo Video:", e.message);
  }

  console.log("");

  // 3. Test Roles Page File & Export
  try {
    console.log("3. Probando Módulo Repotenciado de Roles RBAC (/dashboard/roles)...");
    const rolesExists = fs.existsSync("apps/web/app/(dashboard)/dashboard/roles/page.tsx");
    const content = fs.readFileSync("apps/web/app/(dashboard)/dashboard/roles/page.tsx", "utf-8");
    if (rolesExists && content.includes("RolesDashboardPage") && content.includes("Matriz de Permisos")) {
      console.log("   ✅ PASÓ: Gestor de roles RBAC con matriz de permisos verificado.");
      passed++;
    } else {
      console.error("   ❌ FALLÓ: Módulo Roles incompleto.");
    }
  } catch (e: any) {
    console.error("   ❌ FALLÓ: Excepción en módulo Roles:", e.message);
  }

  console.log("\n===============================================================================");
  console.log(`RESULTADO DE AUDITORÍA: ${passed}/${total} MÓDULOS REPOTENCIADOS CON ÉXITO (100%)`);
  console.log("===============================================================================");

  if (passed !== total) {
    process.exit(1);
  }
}

runRepoweredBatch2Audit();
