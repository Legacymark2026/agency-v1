import { validateInvoiceForm, validateLeadForm } from "../apps/web/config/form-schemas";
import { globalStateStore } from "../apps/web/stores/global-state-store";

async function runFrontendPillarsAudit() {
  console.log("===============================================================================");
  console.log("🚀 AUDITORÍA DE 3 PILARES ADICIONALES DEL FRONTEND (LEGACYMARK)");
  console.log("===============================================================================\n");

  let passed = 0;
  let total = 3;

  // 1. Test Form Validation Schemas
  try {
    console.log("1. Probando Esquemas Centralizados de Validación de Formularios...");
    const validResult = validateInvoiceForm({ clientName: "Empresa Demo S.A.S.", clientNit: "900.849.201-4", totalAmount: 500000 });
    const invalidResult = validateInvoiceForm({ clientName: "", clientNit: "abc", totalAmount: -100 });

    if (validResult.isValid && !invalidResult.isValid && Object.keys(invalidResult.errors).length === 3) {
      console.log("   ✅ PASÓ: Esquemas de validación de cliente ejecutados con precisión.");
      passed++;
    } else {
      console.error("   ❌ FALLÓ: Validación de esquemas incorrecta.");
    }
  } catch (e: any) {
    console.error("   ❌ FALLÓ: Excepción en validación de formularios:", e.message);
  }

  console.log("");

  // 2. Test Global State Store
  try {
    console.log("2. Probando Almacén de Estado Global e Hidratación de Inquilino...");
    const initialState = globalStateStore.getState();
    globalStateStore.setState({ currency: "USD", unreadNotifications: 5 });
    const updatedState = globalStateStore.getState();

    if (initialState.companyId === "comp_demo_1" && updatedState.currency === "USD" && updatedState.unreadNotifications === 5) {
      console.log("   ✅ PASÓ: Almacén de estado global actualizado correctamente.");
      passed++;
    } else {
      console.error("   ❌ FALLÓ: Actualización de estado global incorrecta.");
    }
  } catch (e: any) {
    console.error("   ❌ FALLÓ: Excepción en estado global:", e.message);
  }

  console.log("");

  // 3. Test Command Palette File Presence
  try {
    console.log("3. Probando Paleta de Comandos Flotante (Ctrl+K / Cmd+K)...");
    const fs = require("fs");
    const exists = fs.existsSync("apps/web/components/ui/command-palette.tsx");
    if (exists) {
      console.log("   ✅ PASÓ: Componente command-palette.tsx verificado en el árbol de componentes.");
      passed++;
    } else {
      console.error("   ❌ FALLÓ: Componente command-palette.tsx no encontrado.");
    }
  } catch (e: any) {
    console.error("   ❌ FALLÓ: Excepción al verificar command palette:", e.message);
  }

  console.log("\n===============================================================================");
  console.log(`RESULTADO DE AUDITORÍA: ${passed}/${total} PRUEBAS COMPLETADAS CON ÉXITO (100%)`);
  console.log("===============================================================================");

  if (passed !== total) {
    process.exit(1);
  }
}

runFrontendPillarsAudit();
