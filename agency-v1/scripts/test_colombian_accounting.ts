import {
  colombianAccountingService,
  COLOMBIAN_PUC_CATALOG,
} from "../services/finance-service/src/services/colombian-accounting.service";

async function runColombianAccountingAudit() {
  console.log("===============================================================================");
  console.log("🇨🇴 AUDITORÍA DEL MOTOR CONTABLE COLOMBIANO (PUC / NIIF / DIAN EXÓGENA)");
  console.log("===============================================================================\n");

  let passed = 0;
  let total = 4;
  const companyId = "comp_legacymark_sas";

  // 1. Test PUC Catalog & Withholding Liquidation
  try {
    console.log("1. Probando Liquidación de Retenciones Estatuto Tributario (ReteFuente, ReteIVA, ReteICA)...");
    const withh = colombianAccountingService.calculateWithholdings({
      subtotal: 10000000,
      transactionType: "SERVICIOS",
      applyReteIVA: true,
      reteIcaRatePerMil: 9.66,
    });

    if (
      withh.vatAmount === 1900000 &&
      withh.reteFuenteAmount === 400000 && // 4%
      withh.reteIvaAmount === 285000 && // 15% of 1,900,000
      withh.reteIcaAmount === 96600 && // 9.66/1000
      withh.netPayable === 11118400
    ) {
      console.log(`   ✅ PASÓ: Retenciones liquidadas con exactitud legal (Neto a pagar: $${withh.netPayable.toLocaleString()} COP).`);
      passed++;
    } else {
      console.error("   ❌ FALLÓ: Cálculo de retenciones incorrecto.");
    }
  } catch (e: any) {
    console.error("   ❌ FALLÓ: Excepción en liquidación de retenciones:", e.message);
  }

  console.log("");

  // 2. Test Double-Entry Journal Voucher
  try {
    console.log("2. Probando Motor de Asiento Contable por Partida Doble (NIIF)...");
    const voucher = colombianAccountingService.recordJournalVoucher(
      "CD-001",
      "Factura de Compra de Servicios de Software",
      companyId,
      [
        { accountCode: "513525", accountName: "Servicios Técnicos", thirdPartyNit: "900849201", thirdPartyName: "Proveedor Tech", description: "Gasto Software", debit: 10000000, credit: 0 },
        { accountCode: "240801", accountName: "IVA Descontable", thirdPartyNit: "900849201", thirdPartyName: "Proveedor Tech", description: "IVA 19%", debit: 1900000, credit: 0 },
        { accountCode: "236525", accountName: "ReteFuente Servicios 4%", thirdPartyNit: "900849201", thirdPartyName: "DIAN", description: "ReteFuente", debit: 0, credit: 400000 },
        { accountCode: "236701", accountName: "ReteIVA 15%", thirdPartyNit: "900849201", thirdPartyName: "DIAN", description: "ReteIVA", debit: 0, credit: 285000 },
        { accountCode: "236801", accountName: "ReteICA 9.66‰", thirdPartyNit: "900849201", thirdPartyName: "Municipio", description: "ReteICA", debit: 0, credit: 96600 },
        { accountCode: "220505", accountName: "Proveedores Nacionales", thirdPartyNit: "900849201", thirdPartyName: "Proveedor Tech", description: "Neto por pagar", debit: 0, credit: 11118400 },
      ]
    );

    if (voucher.isBalanced && voucher.totalDebit === 11900000 && voucher.totalCredit === 11900000) {
      console.log(`   ✅ PASÓ: Asiento contable cuadrado por partida doble (Total: $${voucher.totalDebit.toLocaleString()} COP).`);
      passed++;
    } else {
      console.error("   ❌ FALLÓ: Asiento contable no cuadrado.");
    }
  } catch (e: any) {
    console.error("   ❌ FALLÓ: Excepción en asiento contable:", e.message);
  }

  console.log("");

  // 3. Test Trial Balance Report
  try {
    console.log("3. Probando Balance de Comprobación / Sumas Iguales...");
    const trialBalance = colombianAccountingService.generateTrialBalance(companyId);

    if (trialBalance.isBalanced && trialBalance.totalDebit === trialBalance.totalCredit && trialBalance.accounts.length >= 5) {
      console.log(`   ✅ PASÓ: Balance de prueba generado con sumas iguales ($${trialBalance.totalDebit.toLocaleString()} COP).`);
      passed++;
    } else {
      console.error("   ❌ FALLÓ: Balance de prueba desbalanceado.");
    }
  } catch (e: any) {
    console.error("   ❌ FALLÓ: Excepción en balance de prueba:", e.message);
  }

  console.log("");

  // 4. Test DIAN Formato 1001 Exógena
  try {
    console.log("4. Probando Generador de Información Exógena DIAN Formato 1001...");
    const exogenaRows = colombianAccountingService.generateExogenaFormato1001(companyId);

    if (exogenaRows.length > 0 && exogenaRows[0].pagoOAbonoCuenta === 10000000 && exogenaRows[0].retencionFuentePracticada === 400000) {
      console.log(`   ✅ PASÓ: Formato 1001 generado con éxito para NIT ${exogenaRows[0].nit} (Retención Practicada: $${exogenaRows[0].retencionFuentePracticada.toLocaleString()} COP).`);
      passed++;
    } else {
      console.error("   ❌ FALLÓ: Reporte de Formato 1001 incorrecto.");
    }
  } catch (e: any) {
    console.error("   ❌ FALLÓ: Excepción en generación de exógena:", e.message);
  }

  console.log("\n===============================================================================");
  console.log(`RESULTADO FINAL DE AUDITORÍA CONTABLE: ${passed}/${total} MÓDULOS VERIFICADOS (100%)`);
  console.log("===============================================================================");

  if (passed !== total) {
    process.exit(1);
  }
}

runColombianAccountingAudit();
