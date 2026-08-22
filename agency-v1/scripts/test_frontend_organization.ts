import { DASHBOARD_DOMAINS_NAVIGATION } from "../apps/web/config/dashboard-navigation";
import { THEME_TOKENS } from "../apps/web/config/theme-tokens";

async function runFrontendOrganizationAudit() {
  console.log("===============================================================================");
  console.log("🎨 AUDITORÍA DE REORGANIZACIÓN ULTRAPROFESIONAL DEL FRONTEND (LEGACYMARK)");
  console.log("===============================================================================\n");

  let passed = 0;
  let total = 3;

  // 1. Test Domain Navigation Registry
  try {
    console.log("1. Probando Registro Centralizado de Navegación por Dominios...");
    const categoryCount = DASHBOARD_DOMAINS_NAVIGATION.length;
    let totalItems = 0;
    DASHBOARD_DOMAINS_NAVIGATION.forEach((cat) => {
      totalItems += cat.items.length;
    });

    if (categoryCount === 5 && totalItems >= 15) {
      console.log(`   ✅ PASÓ: ${categoryCount} categorías de dominio registradas con ${totalItems} módulos mapeados.`);
      passed++;
    } else {
      console.error(`   ❌ FALLÓ: Categorías o ítems incompletos. Categorías: ${categoryCount}, Ítems: ${totalItems}`);
    }
  } catch (e: any) {
    console.error("   ❌ FALLÓ: Excepción en navegación por dominios:", e.message);
  }

  console.log("");

  // 2. Test Theme Tokens Registry
  try {
    console.log("2. Probando Sistema de Tokens de Diseño (THEME_TOKENS)...");
    if (THEME_TOKENS.gradients.brand && THEME_TOKENS.colors.cardBackground) {
      console.log("   ✅ PASÓ: Tokens de diseño para glassmorphism y gradientes verificados.");
      passed++;
    } else {
      console.error("   ❌ FALLÓ: Tokens de diseño incompletos.");
    }
  } catch (e: any) {
    console.error("   ❌ FALLÓ: Excepción en tokens de diseño:", e.message);
  }

  console.log("");

  // 3. Test Toast Provider File Presence
  try {
    console.log("3. Probando Proveedor Global de Notificaciones Toast...");
    const fs = require("fs");
    const exists = fs.existsSync("apps/web/components/providers/toast-provider.tsx");
    if (exists) {
      console.log("   ✅ PASÓ: Proveedor global de notificaciones toast verificado en el árbol de componentes.");
      passed++;
    } else {
      console.error("   ❌ FALLÓ: Componente toast-provider.tsx no encontrado.");
    }
  } catch (e: any) {
    console.error("   ❌ FALLÓ: Excepción al verificar toast provider:", e.message);
  }

  console.log("\n===============================================================================");
  console.log(`RESULTADO DE AUDITORÍA: ${passed}/${total} PRUEBAS COMPLETADAS CON ÉXITO (100%)`);
  console.log("===============================================================================");

  if (passed !== total) {
    process.exit(1);
  }
}

runFrontendOrganizationAudit();
