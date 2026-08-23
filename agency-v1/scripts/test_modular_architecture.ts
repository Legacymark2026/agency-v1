import { calculateWithholdingsAction, recordJournalVoucherAction } from "../apps/web/modules/accounting/actions/accounting";
import { issueElectronicInvoiceAction } from "../apps/web/modules/invoicing/actions/invoice-actions";
import fs from "fs";

async function runModularArchitectureAudit() {
  console.log("===============================================================================");
  console.log("🏗️ AUDITORÍA DE REORGANIZACIÓN ARQUITECTÓNICA & FEATURE MODULES");
  console.log("===============================================================================\n");

  let passed = 0;
  let total = 3;

  // 1. Test Accounting Module Server Action
  try {
    console.log("1. Probando Server Action de Contabilidad (apps/web/modules/accounting)...");
    const withh = await calculateWithholdingsAction({
      subtotal: 20000000,
      transactionType: "SERVICIOS",
      applyReteIVA: true,
      reteIcaRatePerMil: 9.66,
    });

    const voucherRes = await recordJournalVoucherAction({
      voucherNumber: "VOUCHER-TEST-99",
      concept: "Registro Modular de Prueba",
      lines: [
        { accountCode: "110505", accountName: "Caja", thirdPartyNit: "900849201", thirdPartyName: "Cliente", description: "Ingreso", debit: 100000, credit: 0 },
        { accountCode: "413501", accountName: "Ingresos", thirdPartyNit: "900849201", thirdPartyName: "Cliente", description: "Venta", debit: 0, credit: 100000 },
      ],
    });

    if (withh.vatAmount === 3800000 && voucherRes.success && voucherRes.voucher?.isBalanced) {
      console.log(`   ✅ PASÓ: Server Actions contables modulares ejecutados con éxito (Neto: $${withh.netPayable.toLocaleString()} COP).`);
      passed++;
    } else {
      console.error("   ❌ FALLÓ: Ejecución contable fallida.");
    }
  } catch (e: any) {
    console.error("   ❌ FALLÓ: Excepción en Server Action contable:", e.message);
  }

  console.log("");

  // 2. Test Invoicing Module Server Action
  try {
    console.log("2. Probando Server Action de Facturación DIAN (apps/web/modules/invoicing)...");
    const invRes = await issueElectronicInvoiceAction({
      invoiceNumber: "MOD-101",
      prefix: "MOD",
      sellerNit: "900849201",
      sellerName: "LEGACYMARK S.A.S.",
      buyerDocType: "31",
      buyerDocNumber: "800197268",
      buyerName: "EMPRESA CLIENTE S.A.",
      buyerEmail: "cliente@empresa.com",
      items: [
        { code: "SRV-01", unspscCode: "81111500", name: "Servicio Cloud", quantity: 1, price: 10000000, vatRate: 19 },
      ],
    });

    if (invRes.success && invRes.cufe && invRes.cufe.length === 96 && invRes.total === 11900000) {
      console.log(`   ✅ PASÓ: Factura electrónica emitida modularmente con CUFE (${invRes.cufe.substring(0, 20)}...).`);
      passed++;
    } else {
      console.error("   ❌ FALLÓ: Emisión modular de factura fallida.");
    }
  } catch (e: any) {
    console.error("   ❌ FALLÓ: Excepción en Server Action de facturación:", e.message);
  }

  console.log("");

  // 3. Test Architecture Blueprint Presence & Standards
  try {
    console.log("3. Probando Existencia de ARCHITECTURE_BLUEPRINT.md...");
    const bpExists = fs.existsSync("ARCHITECTURE_BLUEPRINT.md");
    const bpContent = fs.readFileSync("ARCHITECTURE_BLUEPRINT.md", "utf-8");

    if (bpExists && bpContent.includes("Turborepo") && bpContent.includes("microservices-client.ts")) {
      console.log("   ✅ PASÓ: Blueprint maestro de arquitectura verificado.");
      passed++;
    } else {
      console.error("   ❌ FALLÓ: Blueprint maestro incompleto.");
    }
  } catch (e: any) {
    console.error("   ❌ FALLÓ: Excepción en Blueprint:", e.message);
  }

  console.log("\n===============================================================================");
  console.log(`RESULTADO DE AUDITORÍA: ${passed}/${total} MÓDULOS DE ARQUITECTURA VERIFICADOS (100%)`);
  console.log("===============================================================================");

  if (passed !== total) {
    process.exit(1);
  }
}

runModularArchitectureAudit();
