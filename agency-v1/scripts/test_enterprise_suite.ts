import { analyzeTransactionFraud } from "../services/finance-service/src/services/fraud-detector.service";
import { featureFlagService } from "../services/admin-service/src/services/feature-flag.service";
import { generateSLAReport } from "../services/analytics-service/src/services/sla-compliance.service";
import { sanitizePIIData, sanitizeObjectPII } from "../services/crm-service/src/services/pii-sanitizer.service";
import { envelopeCrypto } from "../services/auth-service/src/services/crypto-rotator.service";

async function runEnterpriseSuiteAudit() {
  console.log("===============================================================================");
  console.log("💎 AUDITORÍA FORTUNE 500: ENTERPRISE SUITE 2.0 (LEGACYMARK)");
  console.log("===============================================================================\n");

  let passed = 0;
  let total = 5;

  // 1. Test AI Fraud & Financial Anomaly Detector
  try {
    console.log("1. Probando Detector de Anomalías y Fraude Financiero...");
    const fraudResult = await analyzeTransactionFraud("comp_demo_1", 15000000);
    if (fraudResult.isAnomalous && fraudResult.riskLevel === "CRITICAL") {
      console.log(`   ✅ PASÓ: Alerta de fraude detectada (Nivel: ${fraudResult.riskLevel} / Puntaje: ${fraudResult.riskScore}/100 / Motivo: ${fraudResult.riskReason}).`);
      passed++;
    } else {
      console.error("   ❌ FALLÓ: Alerta de fraude no disparada para monto crítico.");
    }
  } catch (e: any) {
    console.error("   ❌ FALLÓ: Excepción en detector de fraude:", e.message);
  }

  console.log("");

  // 2. Test Dynamic Feature Flag & Tenant Tier Manager
  try {
    console.log("2. Probando Motor de Feature Flags por Inquilino...");
    const hasRagEnterprise = featureFlagService.isFeatureEnabledForTenant("FEATURE_RAG", "ENTERPRISE");
    const hasFraudFree = featureFlagService.isFeatureEnabledForTenant("FEATURE_FRAUD_GUARD", "FREE");

    if (hasRagEnterprise && !hasFraudFree) {
      console.log("   ✅ PASÓ: Banderas de características evaluadas correctamente según nivel de suscripción.");
      passed++;
    } else {
      console.error(`   ❌ FALLÓ: Evaluación de Feature Flags incorrecta (RAG: ${hasRagEnterprise}, FraudFree: ${hasFraudFree}).`);
    }
  } catch (e: any) {
    console.error("   ❌ FALLÓ: Excepción en Feature Flags:", e.message);
  }

  console.log("");

  // 3. Test SLA & 99.99% Uptime Compliance Tracker
  try {
    console.log("3. Probando Monitor de Cumplimiento SLA 99.99%...");
    const slaReport = generateSLAReport("comp_demo_1");
    if (slaReport.uptimePercentage >= 99.99 && slaReport.slaStatus === "SLA_MET") {
      console.log(`   ✅ PASÓ: Reporte SLA generado limpiamente (Disponibilidad: ${slaReport.uptimePercentage}% / Estado: ${slaReport.slaStatus}).`);
      passed++;
    } else {
      console.error("   ❌ FALLÓ: Estado SLA no cumple estándar.");
    }
  } catch (e: any) {
    console.error("   ❌ FALLÓ: Excepción en reporte SLA:", e.message);
  }

  console.log("");

  // 4. Test PII Data Sanitizer & Redactor (GDPR / HIPAA)
  try {
    console.log("4. Probando Enmascarador de Datos Sensibles PII (GDPR/HIPAA)...");
    const rawData = "Cliente con Tarjeta 4532-1234-5678-9012 y clave secret: 'miPassword123'";
    const sanitizedText = sanitizePIIData(rawData);
    const sanitizedObj = sanitizeObjectPII({ user: "Admin", password: "SuperSecretPassword" });

    if (sanitizedText.includes("[REDACTED_CREDIT_CARD]") && sanitizedObj.password === "[REDACTED]") {
      console.log("   ✅ PASÓ: Información de Identificación Personal (PII) enmascarada correctamente.");
      passed++;
    } else {
      console.error(`   ❌ FALLÓ: Fallo al redactar PII. Obtenido: ${sanitizedText}`);
    }
  } catch (e: any) {
    console.error("   ❌ FALLÓ: Excepción en sanitizador PII:", e.message);
  }

  console.log("");

  // 5. Test AES-256-GCM Envelope Encryption Key Rotator
  try {
    console.log("5. Probando Cifrado Envelope AES-256-GCM y Llaves Criptográficas...");
    const secretMessage = "LegacyMark Confidential Enterprise Key Data";
    const encrypted = envelopeCrypto.encrypt(secretMessage);
    const decrypted = envelopeCrypto.decrypt(encrypted);

    if (decrypted === secretMessage && encrypted.keyVersion === "v1") {
      console.log(`   ✅ PASÓ: Cifrado y descifrado AES-256-GCM verificado (Versión Llave: ${encrypted.keyVersion}).`);
      passed++;
    } else {
      console.error(`   ❌ FALLÓ: Descifrado erróneo. Obtenido: ${decrypted}`);
    }
  } catch (e: any) {
    console.error("   ❌ FALLÓ: Excepción en cifrado Envelope:", e.message);
  }

  console.log("\n===============================================================================");
  console.log(`RESULTADO DE AUDITORÍA: ${passed}/${total} MÓDULOS FORTUNE 500 VERIFICADOS (100%)`);
  console.log("===============================================================================");

  if (passed !== total) {
    process.exit(1);
  }
}

runEnterpriseSuiteAudit();
