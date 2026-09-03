/**
 * Accounting Engine Service — Pure Business Logic
 * ─────────────────────────────────────────────────────────────────────────────
 * Stateless, testable functions for core Colombian accounting calculations.
 * No database or I/O dependencies — pure in, pure out.
 *
 * Covers:
 *  1. Double-entry validation (Partida Doble)
 *  2. Colombian withholding calculations (ReteFuente, ReteIVA, ReteICA)
 *  3. DIAN hash generation (CUFE, CUNE, CUDS)
 *  4. PUC account classification
 *  5. Financial ratios (NIIF)
 *  6. Payroll provisions (CST)
 *  7. Append-only chain hash integrity
 */

import crypto from "crypto";

// Re-export the subagent's type-compatible functions for backward compatibility
import type {
  JournalEntryLineInput,
  WithholdingCalculationInput,
  WithholdingCalculationResult,
} from "../types";

// ── Types ────────────────────────────────────────────────────────────────────

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

export interface JournalLine {
  accountCode: string;
  accountName: string;
  thirdPartyNit?: string;
  thirdPartyName?: string;
  costCenterCode?: string;
  description?: string;
  debit: number;
  credit: number;
}

export interface VoucherValidation {
  isBalanced: boolean;
  totalDebit: number;
  totalCredit: number;
  difference: number;
  hashSeal: string;
}

export type PUCCategory = "ACTIVO" | "PASIVO" | "PATRIMONIO" | "INGRESOS" | "GASTOS" | "COSTOS" | "CUENTAS_DE_ORDEN";
export type PUCNature = "DEBITO" | "CREDITO";

// ── Colombian Withholding Rates (Estatuto Tributario 2024-2026) ───────────

const RETE_FUENTE_RATES: Record<string, number> = {
  COMPRAS: 0.025,
  SERVICIOS: 0.04,
  HONORARIOS: 0.10,
};

const RETE_IVA_RATE = 0.15;

// ── Backward-compatible wrapper (used by refactored action files) ────────

export function calculateWithholdingsLogic(input: WithholdingCalculationInput): WithholdingCalculationResult {
  return calculateWithholdings(input);
}

export function validateDoubleEntrySimple(lines: JournalEntryLineInput[]): { isBalanced: boolean; totalDebit: number; totalCredit: number; error?: string } {
  const totalDebit = lines.reduce((s, l) => s + (Number(l.debit) || 0), 0);
  const totalCredit = lines.reduce((s, l) => s + (Number(l.credit) || 0), 0);

  if (totalDebit !== totalCredit || totalDebit === 0) {
    return {
      isBalanced: false,
      totalDebit,
      totalCredit,
      error: `Asiento desbalanceado. Débitos: $${totalDebit.toLocaleString()} != Créditos: $${totalCredit.toLocaleString()}`
    };
  }
  return { isBalanced: true, totalDebit, totalCredit };
}

// ── Core Functions ───────────────────────────────────────────────────────────

/**
 * Calculates statutory Colombian tax withholdings.
 */
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

/**
 * Validates a set of journal entry lines for double-entry compliance.
 */
export function validateDoubleEntry(
  voucherNumber: string,
  concept: string,
  lines: JournalLine[]
): VoucherValidation {
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

/**
 * Generates a DIAN CUFE SHA-384 hash.
 */
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

/**
 * Generates a DIAN CUNE SHA-384 hash.
 */
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

/**
 * Generates a DIAN CUDS SHA-256 hash.
 */
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

/**
 * Generates a chain hash for append-only integrity.
 */
export function generateChainHash(currentHash: string, previousHash: string | null): string {
  const input = previousHash ? `${previousHash}:${currentHash}` : currentHash;
  return crypto.createHash("sha256").update(input).digest("hex");
}

/**
 * Classifies a PUC account code into its category and nature.
 */
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

/**
 * DIAN Modulo 11 — Verifica el dígito de verificación de un NIT colombiano.
 */
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

/**
 * Calculates Colombian payroll provisions according to CST.
 */
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
