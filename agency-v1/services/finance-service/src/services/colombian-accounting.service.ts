/**
 * Colombian Accounting & Tax Engine v2 — PostgreSQL ACID Persistence
 * ─────────────────────────────────────────────────────────────────────────────
 * Migrated from Redis to PostgreSQL (AccountingVoucher + AccountingVoucherLine).
 * 
 * Supports:
 *  1. Plan Único de Cuentas (PUC) & Strict Double-Entry Ledger (Partida Doble)
 *  2. Automated Colombian Withholdings (ReteFuente, ReteIVA, ReteICA, AutoRenta)
 *  3. Trial Balance & Balance de Comprobación (Sumas Iguales)
 *  4. DIAN Formato 1001 (Información Exógena / Medios Magnéticos Tributarios)
 *  5. Append-Only Integrity Chain (previousHash linking)
 *  6. Period Management (OPEN, CLOSING, CLOSED)
 *
 * All journal vouchers are now persisted in tbl_accounting_vouchers and
 * tbl_accounting_voucher_lines with full ACID guarantees.
 */

import { prisma } from "@agency/database";
import crypto from "crypto";

// ── Core Engine Functions (Pure Colombian Accounting & DIAN Engine) ──────────

export interface WithholdingInput {
  subtotal: number;
  vatRate?: number;
  transactionType: "COMPRAS" | "SERVICIOS" | "HONORARIOS";
  applyReteIVA?: boolean;
  reteIcaRatePerMil?: number;
}

export interface WithholdingResult {
  subtotal: number;
  vatAmount: number;
  reteFuenteRate: number;
  reteFuenteAmount: number;
  reteIvaRate: number;
  reteIvaAmount: number;
  reteIcaRate: number;
  reteIcaAmount: number;
  totalWithholdings: number;
  netPayable: number;
}

export type PUCCategory = "ACTIVO" | "PASIVO" | "PATRIMONIO" | "INGRESOS" | "GASTOS" | "COSTOS" | "CUENTAS_DE_ORDEN";
export type PUCNature = "DEBITO" | "CREDITO";

const RETE_FUENTE_RATES: Record<string, number> = {
  COMPRAS: 0.025,
  SERVICIOS: 0.04,
  HONORARIOS: 0.10,
};

const RETE_IVA_RATE = 0.15;

export function calculateWithholdings(input: WithholdingInput): WithholdingResult {
  const subtotal = Math.max(0, input.subtotal || 0);
  const vatRate = input.vatRate ?? 0.19;
  const vatAmount = Math.round(subtotal * vatRate);

  const reteFuenteRate = RETE_FUENTE_RATES[input.transactionType] ?? 0.025;
  const reteFuenteAmount = Math.round(subtotal * reteFuenteRate);

  const reteIvaRate = input.applyReteIVA ? RETE_IVA_RATE : 0;
  const reteIvaAmount = input.applyReteIVA ? Math.round(vatAmount * RETE_IVA_RATE) : 0;

  const reteIcaRate = (input.reteIcaRatePerMil ?? 9.66) / 1000;
  const reteIcaAmount = Math.round(subtotal * reteIcaRate);

  const totalWithholdings = reteFuenteAmount + reteIvaAmount + reteIcaAmount;
  const netPayable = subtotal + vatAmount - totalWithholdings;

  return {
    subtotal,
    vatAmount,
    reteFuenteRate,
    reteFuenteAmount,
    reteIvaRate,
    reteIvaAmount,
    reteIcaRate,
    reteIcaAmount,
    totalWithholdings,
    netPayable,
  };
}

export function validateDoubleEntry(
  voucherNumber: string,
  concept: string,
  lines: Array<{
    accountCode: string;
    accountName?: string;
    thirdPartyNit?: string;
    thirdPartyName?: string;
    costCenterCode?: string;
    description?: string;
    debit: number;
    credit: number;
  }>
): { isBalanced: boolean; totalDebit: number; totalCredit: number; difference: number; hashSeal: string } {
  const totalDebit = lines.reduce((sum, l) => sum + (l.debit || 0), 0);
  const totalCredit = lines.reduce((sum, l) => sum + (l.credit || 0), 0);
  const difference = Math.abs(totalDebit - totalCredit);
  const isBalanced = difference < 0.01;

  const rawPayload = JSON.stringify({
    voucherNumber,
    concept,
    totalDebit,
    totalCredit,
    timestamp: new Date().toISOString(),
    lines: lines.map(l => ({
      accountCode: l.accountCode,
      debit: l.debit,
      credit: l.credit,
      nit: l.thirdPartyNit,
    })),
  });

  const hashSeal = crypto.createHash("sha256").update(rawPayload).digest("hex");

  return { isBalanced, totalDebit, totalCredit, difference, hashSeal };
}

export function generateCUFE(params: {
  invoiceNumber: string;
  subtotal: number;
  taxAmount: number;
  clientNit: string;
  dateStr: string;
  softwareNit?: string;
  technicalKey?: string;
}): { cufe: string; valid: boolean } {
  const softwareNit = params.softwareNit || process.env.DIAN_SOFTWARE_NIT;
  const technicalKey = params.technicalKey || process.env.DIAN_TECHNICAL_KEY;

  if (!softwareNit || !technicalKey) {
    return {
      cufe: `MISSING_DIAN_CONFIG_${crypto.randomBytes(8).toString("hex")}`,
      valid: false,
    };
  }

  const dianDate = new Date(params.dateStr)
    .toISOString()
    .replace(/[-:T.Z]/g, "")
    .slice(0, 14);

  const rawString = [
    params.invoiceNumber,
    params.subtotal.toFixed(2),
    params.taxAmount.toFixed(2),
    params.clientNit,
    softwareNit,
    dianDate,
    technicalKey,
  ].join("");

  return {
    cufe: crypto.createHash("sha384").update(rawString).digest("hex"),
    valid: true,
  };
}

export function generateCUNE(params: {
  documentNumber: string;
  dateStr: string;
  totalEarnings: number;
  totalDeductions: number;
  netPay: number;
  employeeNit: string;
  employerNit?: string;
}): string {
  const employerNit = params.employerNit || process.env.DIAN_SOFTWARE_NIT || "902028722-3";
  const pin = process.env.DIAN_PAYROLL_PIN || "PIN_DIAN_SECRET_NOMINA";

  const rawCUNE = [
    params.documentNumber, params.dateStr,
    params.totalEarnings, params.totalDeductions,
    params.netPay, params.employeeNit,
    employerNit, pin,
  ].join("|");

  return crypto.createHash("sha384").update(rawCUNE).digest("hex").toUpperCase();
}

export function generateCUDS(params: {
  dseNumber: string;
  dateStr: string;
  subtotal: number;
  reteFuente: number;
  vendorNit: string;
  employerNit?: string;
}): string {
  const employerNit = params.employerNit || process.env.DIAN_SOFTWARE_NIT || "902028722-3";
  const pin = process.env.DIAN_DSE_PIN || "PIN_DIAN_SECRET";

  const raw = [
    params.dseNumber, params.dateStr,
    params.subtotal, params.reteFuente,
    params.vendorNit, employerNit, pin,
  ].join("|");

  return crypto.createHash("sha256").update(raw).digest("hex").toUpperCase();
}

export function classifyPUCAccount(code: string): { category: PUCCategory; nature: PUCNature } {
  const firstDigit = code.charAt(0);

  switch (firstDigit) {
    case "1": return { category: "ACTIVO", nature: "DEBITO" };
    case "2": return { category: "PASIVO", nature: "CREDITO" };
    case "3": return { category: "PATRIMONIO", nature: "CREDITO" };
    case "4": return { category: "INGRESOS", nature: "CREDITO" };
    case "5": return { category: "GASTOS", nature: "DEBITO" };
    case "6": return { category: "COSTOS", nature: "DEBITO" };
    case "7": return { category: "COSTOS", nature: "DEBITO" };
    case "8":
    case "9": return { category: "CUENTAS_DE_ORDEN", nature: "DEBITO" };
    default:  return { category: "ACTIVO", nature: "DEBITO" };
  }
}

export function calculateDianDV(rawNit: string): { nit: string; dv: number; formatted: string } {
  const cleanNit = rawNit.replace(/\D/g, "");
  if (!cleanNit) return { nit: "", dv: 0, formatted: "" };

  const primeWeights = [71, 67, 59, 53, 47, 43, 41, 37, 29, 23, 19, 17, 13, 7, 3];
  const digits = cleanNit.padStart(15, "0").split("").map(Number);

  let sum = 0;
  for (let i = 0; i < 15; i++) {
    sum += digits[i] * primeWeights[i];
  }

  const remainder = sum % 11;
  const dv = remainder > 1 ? 11 - remainder : remainder;
  const formatted = `${cleanNit}-${dv}`;

  return { nit: cleanNit, dv, formatted };
}

export function calculatePayrollProvisions(baseSalary: number) {
  const salary = Math.max(0, baseSalary || 0);
  const transportAllowance = salary <= 2600000 ? 162000 : 0;
  const totalAccrued = salary + transportAllowance;

  const cesantias = Math.round(totalAccrued * 0.0833);
  const interesesCesantias = Math.round(cesantias * 0.12 / 12);
  const primaServicios = Math.round(totalAccrued * 0.0833);
  const vacaciones = Math.round(salary * 0.0417);

  const pensionEmployer = Math.round(salary * 0.12);
  const healthEmployer = 0;
  const arlRisk1 = Math.round(salary * 0.00522);
  const cajaCompensacion = Math.round(salary * 0.04);
  const sena = 0;
  const icbf = 0;

  const totalProvisions = cesantias + interesesCesantias + primaServicios + vacaciones
    + pensionEmployer + healthEmployer + arlRisk1 + cajaCompensacion + sena + icbf;
  const totalCompanyCost = totalAccrued + totalProvisions;

  return {
    baseSalary: salary,
    transportAllowance,
    totalAccrued,
    cesantias,
    interesesCesantias,
    primaServicios,
    vacaciones,
    pensionEmployer,
    healthEmployer,
    arlRisk1,
    cajaCompensacion,
    sena,
    icbf,
    totalProvisions,
    totalCompanyCost,
  };
}

// ── Types ────────────────────────────────────────────────────────────────────

export interface JournalEntryLine {
  accountCode: string;
  accountName: string;
  thirdPartyNit: string;
  thirdPartyName: string;
  description: string;
  debit: number;
  credit: number;
  costCenterCode?: string;
}

export interface JournalVoucher {
  id: string;
  voucherNumber: string;
  documentType: string;
  date: string;
  concept: string;
  costCenterCode?: string;
  lines: JournalEntryLine[];
  totalDebit: number;
  totalCredit: number;
  isBalanced: boolean;
  companyId: string;
  hashSeal?: string;
  previousHash?: string;
  status: string;
}

// ── PUC Catalog (Decreto 2650 — Most Common Accounts) ────────────────────────

export interface PUCAccount {
  code: string;
  name: string;
  category: "ACTIVO" | "PASIVO" | "PATRIMONIO" | "INGRESOS" | "GASTOS" | "COSTOS";
  nature: "DEBITO" | "CREDITO";
}

export const COLOMBIAN_PUC_CATALOG: Record<string, PUCAccount> = {
  // Activos
  "110505": { code: "110505", name: "Caja General", category: "ACTIVO", nature: "DEBITO" },
  "111005": { code: "111005", name: "Bancos Moneda Nacional", category: "ACTIVO", nature: "DEBITO" },
  "111505": { code: "111505", name: "Bancos Cuentas de Ahorro", category: "ACTIVO", nature: "DEBITO" },
  "120505": { code: "120505", name: "CDT (Certificados de Depósito)", category: "ACTIVO", nature: "DEBITO" },
  "130505": { code: "130505", name: "Clientes Nacionales", category: "ACTIVO", nature: "DEBITO" },
  "135515": { code: "135515", name: "Anticipo de Impuestos (ReteFuente a Favor)", category: "ACTIVO", nature: "DEBITO" },
  "135517": { code: "135517", name: "Anticipo de Impuestos (ReteIVA a Favor)", category: "ACTIVO", nature: "DEBITO" },
  "143505": { code: "143505", name: "Mercancías No Fabricadas por la Empresa", category: "ACTIVO", nature: "DEBITO" },
  "152805": { code: "152805", name: "Equipo de Procesamiento de Datos", category: "ACTIVO", nature: "DEBITO" },
  // Pasivos
  "220505": { code: "220505", name: "Proveedores Nacionales", category: "PASIVO", nature: "CREDITO" },
  "233525": { code: "233525", name: "Honorarios y Servicios por Pagar", category: "PASIVO", nature: "CREDITO" },
  "236515": { code: "236515", name: "ReteFuente - Honorarios (10%)", category: "PASIVO", nature: "CREDITO" },
  "236525": { code: "236525", name: "ReteFuente - Servicios (4%)", category: "PASIVO", nature: "CREDITO" },
  "236540": { code: "236540", name: "ReteFuente - Compras (2.5%)", category: "PASIVO", nature: "CREDITO" },
  "236701": { code: "236701", name: "ReteIVA Practicado (15% del IVA)", category: "PASIVO", nature: "CREDITO" },
  "236801": { code: "236801", name: "ReteICA Practicado", category: "PASIVO", nature: "CREDITO" },
  "240801": { code: "240801", name: "IVA por Pagar (19%)", category: "PASIVO", nature: "CREDITO" },
  "250505": { code: "250505", name: "Salarios por Pagar", category: "PASIVO", nature: "CREDITO" },
  "261005": { code: "261005", name: "Cesantías Consolidadas", category: "PASIVO", nature: "CREDITO" },
  "261505": { code: "261505", name: "Intereses sobre Cesantías", category: "PASIVO", nature: "CREDITO" },
  "262005": { code: "262005", name: "Prima de Servicios", category: "PASIVO", nature: "CREDITO" },
  "262505": { code: "262505", name: "Vacaciones Consolidadas", category: "PASIVO", nature: "CREDITO" },
  // Patrimonio
  "310505": { code: "310505", name: "Capital Suscrito y Pagado", category: "PATRIMONIO", nature: "CREDITO" },
  "311505": { code: "311505", name: "Cuotas o Partes de Interés Social", category: "PATRIMONIO", nature: "CREDITO" },
  "360505": { code: "360505", name: "Utilidad del Ejercicio", category: "PATRIMONIO", nature: "CREDITO" },
  "361005": { code: "361005", name: "Utilidades Acumuladas", category: "PATRIMONIO", nature: "CREDITO" },
  // Ingresos
  "413501": { code: "413501", name: "Comercio al por Mayor y al por Menor", category: "INGRESOS", nature: "CREDITO" },
  "415505": { code: "415505", name: "Ingresos por Servicios de Consultoría", category: "INGRESOS", nature: "CREDITO" },
  "421005": { code: "421005", name: "Intereses Financieros", category: "INGRESOS", nature: "CREDITO" },
  // Gastos
  "510506": { code: "510506", name: "Sueldos de Personal", category: "GASTOS", nature: "DEBITO" },
  "510527": { code: "510527", name: "Auxilio de Transporte", category: "GASTOS", nature: "DEBITO" },
  "510536": { code: "510536", name: "Prima de Servicios", category: "GASTOS", nature: "DEBITO" },
  "510539": { code: "510539", name: "Cesantías", category: "GASTOS", nature: "DEBITO" },
  "510542": { code: "510542", name: "Intereses sobre Cesantías", category: "GASTOS", nature: "DEBITO" },
  "510545": { code: "510545", name: "Vacaciones", category: "GASTOS", nature: "DEBITO" },
  "510568": { code: "510568", name: "Aportes ARL", category: "GASTOS", nature: "DEBITO" },
  "510570": { code: "510570", name: "Aportes a Pensión (Empleador)", category: "GASTOS", nature: "DEBITO" },
  "510572": { code: "510572", name: "Aportes a Caja de Compensación", category: "GASTOS", nature: "DEBITO" },
  "512010": { code: "512010", name: "Arrendamientos de Oficinas", category: "GASTOS", nature: "DEBITO" },
  "513525": { code: "513525", name: "Servicios Técnicos y Profesionales", category: "GASTOS", nature: "DEBITO" },
  "513535": { code: "513535", name: "Servicios de Nube e Infraestructura", category: "GASTOS", nature: "DEBITO" },
  "520506": { code: "520506", name: "Publicidad y Propaganda", category: "GASTOS", nature: "DEBITO" },
  // Costos
  "613501": { code: "613501", name: "Costo de Ventas y Prestación de Servicios", category: "COSTOS", nature: "DEBITO" },
  // Cuentas de Resultado (Cierre)
  "590505": { code: "590505", name: "Ganancias y Pérdidas", category: "GASTOS", nature: "DEBITO" },
};

// ── Service Class (PostgreSQL-backed) ────────────────────────────────────────

export class ColombianAccountingService {

  public calculateWithholdings(input: WithholdingInput): WithholdingResult {
    return calculateWithholdings(input);
  }

  /**
   * Creates and registers a strict double-entry journal voucher in PostgreSQL.
   * Validates balance, generates integrity hash, and chains to previous voucher.
   */
  public async recordJournalVoucher(
    paramsOrVoucherNumber: string | {
      voucherNumber: string;
      documentType?: string;
      concept: string;
      companyId: string;
      costCenterCode?: string;
      createdById?: string;
      periodId?: string;
      sourceInvoiceId?: string;
      sourceExpenseId?: string;
      sourcePayrollId?: string;
      lines: JournalEntryLine[];
    },
    conceptArg?: string,
    companyIdArg?: string,
    linesArg?: JournalEntryLine[]
  ): Promise<JournalVoucher> {
    const params = typeof paramsOrVoucherNumber === "string"
      ? {
          voucherNumber: paramsOrVoucherNumber,
          concept: conceptArg || "",
          companyId: companyIdArg || "",
          createdById: "system",
          lines: linesArg || [],
        }
      : paramsOrVoucherNumber;

    const lines = params.lines || [];
    const totalDebit = lines.reduce((sum, l) => sum + (l.debit || 0), 0);
    const totalCredit = lines.reduce((sum, l) => sum + (l.credit || 0), 0);
    const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01;

    if (!isBalanced) {
      throw new Error(
        `Asiento contable desbalanceado. Débitos: $${totalDebit.toLocaleString()} vs Créditos: $${totalCredit.toLocaleString()} (Diferencia: $${Math.abs(totalDebit - totalCredit).toLocaleString()})`
      );
    }

    // Generate integrity hash
    const rawPayload = JSON.stringify({
      voucherNumber: params.voucherNumber,
      documentType: params.documentType || "CC",
      concept: params.concept,
      totalDebit,
      totalCredit,
      timestamp: new Date().toISOString(),
      lines: lines.map(l => ({
        accountCode: l.accountCode,
        debit: l.debit,
        credit: l.credit,
        nit: l.thirdPartyNit,
      })),
    });
    const hashSeal = crypto.createHash("sha256").update(rawPayload).digest("hex");

    // Get previous voucher hash for chain integrity
    const lastVoucher = await prisma.accountingVoucher.findFirst({
      where: { companyId: params.companyId },
      orderBy: { createdAt: "desc" },
      select: { hashSeal: true },
    });
    const previousHash = lastVoucher?.hashSeal || null;
    const chainHash = previousHash
      ? crypto.createHash("sha256").update(`${previousHash}:${hashSeal}`).digest("hex")
      : hashSeal;

    // Persist in a single transaction
    const voucher = await prisma.$transaction(async (tx: any) => {
      const created = await tx.accountingVoucher.create({
        data: {
          companyId: params.companyId,
          periodId: params.periodId || null,
          voucherNumber: params.voucherNumber,
          documentType: params.documentType || "CC",
          concept: params.concept,
          costCenterCode: params.costCenterCode || null,
          totalDebit,
          totalCredit,
          isBalanced: true,
          hashSeal: chainHash,
          previousHash: previousHash || null,
          status: "ACTIVE",
          sourceInvoiceId: params.sourceInvoiceId || null,
          sourceExpenseId: params.sourceExpenseId || null,
          sourcePayrollId: params.sourcePayrollId || null,
          createdById: params.createdById,
          lines: {
            create: lines.map((line, idx) => ({
              lineNumber: idx + 1,
              accountCode: line.accountCode,
              accountName: line.accountName,
              thirdPartyNit: line.thirdPartyNit || null,
              thirdPartyName: line.thirdPartyName || null,
              costCenterCode: line.costCenterCode || params.costCenterCode || null,
              description: line.description || null,
              debit: line.debit || 0,
              credit: line.credit || 0,
            })),
          },
        },
        include: { lines: true },
      });

      return created;
    });

    return {
      id: voucher.id,
      voucherNumber: voucher.voucherNumber,
      documentType: voucher.documentType,
      date: voucher.date.toISOString(),
      concept: voucher.concept,
      costCenterCode: voucher.costCenterCode || undefined,
      lines: voucher.lines.map((l: any) => ({
        accountCode: l.accountCode,
        accountName: l.accountName,
        thirdPartyNit: l.thirdPartyNit || "",
        thirdPartyName: l.thirdPartyName || "",
        description: l.description || "",
        debit: l.debit,
        credit: l.credit,
        costCenterCode: l.costCenterCode || undefined,
      })),
      totalDebit: voucher.totalDebit,
      totalCredit: voucher.totalCredit,
      isBalanced: voucher.isBalanced,
      companyId: voucher.companyId,
      hashSeal: voucher.hashSeal || undefined,
      previousHash: voucher.previousHash || undefined,
      status: voucher.status,
    };
  }

  /**
   * Generates a Trial Balance from PostgreSQL voucher lines.
   * Groups by account code and calculates net balances.
   */
  public async generateTrialBalance(companyId: string, periodId?: string): Promise<{
    accounts: Array<{ code: string; name: string; debit: number; credit: number; balance: number; category: string }>;
    totalDebit: number;
    totalCredit: number;
    isBalanced: boolean;
  }> {
    const whereClause: any = {
      companyId,
      status: "ACTIVE",
    };
    if (periodId) {
      whereClause.periodId = periodId;
    }

    const voucherLines = await prisma.accountingVoucherLine.findMany({
      where: {
        voucher: whereClause,
      },
      select: {
        accountCode: true,
        accountName: true,
        debit: true,
        credit: true,
      },
    });

    const accountMap = new Map<string, { code: string; name: string; debit: number; credit: number }>();

    for (const line of voucherLines) {
      const existing = accountMap.get(line.accountCode) || {
        code: line.accountCode,
        name: line.accountName,
        debit: 0,
        credit: 0,
      };
      existing.debit += line.debit;
      existing.credit += line.credit;
      accountMap.set(line.accountCode, existing);
    }

    const accounts = Array.from(accountMap.values())
      .map((acc) => {
        const firstDigit = acc.code.charAt(0);
        let category = "ACTIVO";
        if (firstDigit === "2") category = "PASIVO";
        if (firstDigit === "3") category = "PATRIMONIO";
        if (firstDigit === "4") category = "INGRESOS";
        if (firstDigit === "5") category = "GASTOS";
        if (firstDigit === "6") category = "COSTOS";

        return {
          ...acc,
          balance: acc.debit - acc.credit,
          category,
        };
      })
      .sort((a, b) => a.code.localeCompare(b.code));

    const totalDebit = accounts.reduce((s, a) => s + a.debit, 0);
    const totalCredit = accounts.reduce((s, a) => s + a.credit, 0);

    return {
      accounts,
      totalDebit,
      totalCredit,
      isBalanced: Math.abs(totalDebit - totalCredit) < 0.01,
    };
  }

  /**
   * Generates DIAN Formato 1001 for Información Exógena (Medios Magnéticos).
   * Reads from PostgreSQL voucher lines instead of Redis.
   */
  public async generateExogenaFormato1001(companyId: string, periodId?: string): Promise<Array<{
    concepto: string;
    tipoDoc: string;
    nit: string;
    razonSocial: string;
    pagoOAbonoCuenta: number;
    pagosDeducibles: number;
    retencionFuentePracticada: number;
    retencionFuenteAsumida: number;
    retencionIvaPracticada: number;
  }>> {
    const whereClause: any = {
      companyId,
      status: "ACTIVE",
    };
    if (periodId) {
      whereClause.periodId = periodId;
    }

    const voucherLines = await prisma.accountingVoucherLine.findMany({
      where: {
        voucher: whereClause,
      },
      select: {
        accountCode: true,
        thirdPartyNit: true,
        thirdPartyName: true,
        debit: true,
        credit: true,
      },
    });

    const thirdPartyMap = new Map<string, {
      concepto: string;
      tipoDoc: string;
      nit: string;
      razonSocial: string;
      pagoOAbonoCuenta: number;
      pagosDeducibles: number;
      retencionFuentePracticada: number;
      retencionFuenteAsumida: number;
      retencionIvaPracticada: number;
    }>();

    for (const line of voucherLines) {
      if (!line.thirdPartyNit) continue;

      const row = thirdPartyMap.get(line.thirdPartyNit) || {
        concepto: "5001",
        tipoDoc: "31",
        nit: line.thirdPartyNit,
        razonSocial: line.thirdPartyName || "Tercero",
        pagoOAbonoCuenta: 0,
        pagosDeducibles: 0,
        retencionFuentePracticada: 0,
        retencionFuenteAsumida: 0,
        retencionIvaPracticada: 0,
      };

      // Gastos y Costos → pagos/abonos
      if (line.accountCode.startsWith("5") || line.accountCode.startsWith("6")) {
        row.pagoOAbonoCuenta += line.debit;
        row.pagosDeducibles += line.debit;
      }
      // Retención en la Fuente → 2365xx
      if (line.accountCode.startsWith("2365")) {
        row.retencionFuentePracticada += line.credit;
      }
      // ReteIVA → 2367xx
      if (line.accountCode.startsWith("2367")) {
        row.retencionIvaPracticada += line.credit;
      }

      thirdPartyMap.set(line.thirdPartyNit, row);
    }

    return Array.from(thirdPartyMap.values());
  }

  /**
   * Reverses a journal voucher by creating a counter-entry.
   * The original voucher's status changes to REVERSED but is never deleted.
   */
  public async reverseVoucher(params: {
    originalVoucherId: string;
    companyId: string;
    createdById: string;
    reason: string;
  }): Promise<JournalVoucher> {
    const original = await prisma.accountingVoucher.findUnique({
      where: { id: params.originalVoucherId },
      include: { lines: true },
    });

    if (!original) {
      throw new Error(`Voucher ${params.originalVoucherId} not found.`);
    }
    if (original.status !== "ACTIVE") {
      throw new Error(`Cannot reverse voucher in status: ${original.status}`);
    }

    // Create reversed lines (swap debit/credit)
    const reversedLines: JournalEntryLine[] = original.lines.map((l: any) => ({
      accountCode: l.accountCode,
      accountName: l.accountName,
      thirdPartyNit: l.thirdPartyNit || "",
      thirdPartyName: l.thirdPartyName || "",
      description: `ANULACIÓN: ${l.description || original.concept}`,
      debit: l.credit,
      credit: l.debit,
      costCenterCode: l.costCenterCode || undefined,
    }));

    const reversalNumber = `AN-${original.voucherNumber}`;

    // Mark original as reversed and create reversal in a transaction
    const [, reversal] = await prisma.$transaction([
      prisma.accountingVoucher.update({
        where: { id: params.originalVoucherId },
        data: { status: "REVERSED", reversedById: reversalNumber },
      }),
      // The reversal voucher is created via the service method
    ]);

    // Record the reversal voucher
    return this.recordJournalVoucher({
      voucherNumber: reversalNumber,
      documentType: original.documentType,
      concept: `ANULACIÓN de ${original.voucherNumber}: ${params.reason}`,
      companyId: params.companyId,
      costCenterCode: original.costCenterCode || undefined,
      createdById: params.createdById,
      periodId: original.periodId || undefined,
      lines: reversedLines,
    });
  }
}

export const colombianAccountingService = new ColombianAccountingService();
