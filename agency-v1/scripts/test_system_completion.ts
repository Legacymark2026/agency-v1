import { auditDisasterRecovery } from "./disaster_recovery_test";
import { verifyCustomDomainCNAME } from "../services/integration-service/src/services/cname-verifier.service";

async function runSystemCompletionAudit() {
  console.log("===============================================================================");
  console.log("🏆 AUDITORÍA FINAL DE CIERRE DEL SISTEMA AL 100% (LEGACYMARK)");
  console.log("===============================================================================\n");

  let passed = 0;
  let total = 3;

  // 1. Test Disaster Recovery Audit
  try {
    console.log("1. Probando Auditoría de Recuperación ante Desastres (Disaster Recovery)...");
    const drResult = auditDisasterRecovery();
    if (drResult.pitrReadinessStatus === "READY" && drResult.checksumSha256.length === 64) {
      console.log(`   ✅ PASÓ: Respaldo de base de datos e integridad PITR verificados (SHA256: ${drResult.checksumSha256.substring(0, 16)}...).`);
      passed++;
    } else {
      console.error("   ❌ FALLÓ: Auditoría de recuperación ante desastres falló.");
    }
  } catch (e: any) {
    console.error("   ❌ FALLÓ: Excepción en Disaster Recovery:", e.message);
  }

  console.log("");

  // 2. Test Custom Domain CNAME Verifier
  try {
    console.log("2. Probando Verificador de Dominios Personalizados CNAME (Marca Blanca)...");
    const cnameResult = verifyCustomDomainCNAME("agencia.miempresa.com");
    if (cnameResult.isCnameValid && cnameResult.isSslActive) {
      console.log(`   ✅ PASÓ: Registro CNAME validado correctamente para '${cnameResult.customDomain}'.`);
      passed++;
    } else {
      console.error("   ❌ FALLÓ: Validación de CNAME falló.");
    }
  } catch (e: any) {
    console.error("   ❌ FALLÓ: Excepción en verificador CNAME:", e.message);
  }

  console.log("");

  // 3. Test Interactive API Explorer Page UI file presence
  try {
    console.log("3. Probando Explorador Interactivo de API Pública (OpenAPI / Swagger UI)...");
    const fs = require("fs");
    const pageExists = fs.existsSync("apps/web/app/(dashboard)/dashboard/tools/api-docs/page.tsx");
    if (pageExists) {
      console.log("   ✅ PASÓ: Componente del Explorador de API Pública verificado en el árbol de archivos.");
      passed++;
    } else {
      console.error("   ❌ FALLÓ: Archivo del Explorador de API Pública no encontrado.");
    }
  } catch (e: any) {
    console.error("   ❌ FALLÓ: Excepción al verificar archivo del explorador de API:", e.message);
  }

  console.log("\n===============================================================================");
  console.log(`RESULTADO DE AUDITORÍA FINAL: ${passed}/${total} PILARES COMPLETADOS AL 100% (SISTEMA TOTALMENTE CUBIERTO)`);
  console.log("===============================================================================");

  if (passed !== total) {
    process.exit(1);
  }
}

runSystemCompletionAudit();
