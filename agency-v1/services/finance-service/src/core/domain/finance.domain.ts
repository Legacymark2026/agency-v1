/**
 * Finance Service — Pure Domain Entities & Business Rules
 * ─────────────────────────────────────────────────────────────────────────────
 * Zero external framework dependencies (Prisma, Express, Redis, etc.)
 */
import { createHash } from "crypto";

export type InvoiceStatus = "DRAFT" | "SENT" | "PAID" | "OVERDUE" | "CANCELLED";

export interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
}

export function calculateInvoiceTotals(
  items: InvoiceItem[],
  taxRate = 0.19,
  discountPercent = 0
) {
  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const discountAmount = subtotal * (discountPercent / 100);
  const taxableAmount = Math.max(0, subtotal - discountAmount);
  const taxAmount = taxableAmount * taxRate;
  const total = taxableAmount + taxAmount;

  return {
    subtotal: Math.round(subtotal * 100) / 100,
    discountAmount: Math.round(discountAmount * 100) / 100,
    taxableAmount: Math.round(taxableAmount * 100) / 100,
    taxAmount: Math.round(taxAmount * 100) / 100,
    total: Math.round(total * 100) / 100,
  };
}

export function convertToStripeCents(amount: number): number {
  return Math.round(amount * 100);
}

export function calculateStripeFee(amount: number, feePercent = 3.5, fixedFee = 0.3) {
  const fee = amount * (feePercent / 100) + fixedFee;
  const net = amount - fee;
  return {
    fee: Math.round(fee * 100) / 100,
    net: Math.round(net * 100) / 100,
  };
}

export function isValidStatusTransition(currentStatus: InvoiceStatus, newStatus: InvoiceStatus): boolean {
  const allowedTransitions: Record<InvoiceStatus, InvoiceStatus[]> = {
    DRAFT: ["SENT", "CANCELLED"],
    SENT: ["PAID", "OVERDUE", "CANCELLED"],
    OVERDUE: ["PAID", "CANCELLED"],
    PAID: [],
    CANCELLED: [],
  };

  return (allowedTransitions[currentStatus] || []).includes(newStatus);
}

export const GENESIS_ACCOUNTING_HASH = "0".repeat(64);

export interface VoucherLineInput {
  accountCode: string;
  accountName?: string;
  thirdPartyNit?: string;
  thirdPartyName?: string;
  debit: number;
  credit: number;
  description?: string;
  costCenterCode?: string;
}

export function validateDoubleEntry(lines: VoucherLineInput[]): { balanced: boolean; totalDebit: number; totalCredit: number; diff: number } {
  if (!lines || lines.length < 2) {
    throw new Error("El comprobante contable debe contener al menos dos líneas.");
  }
  const totalDebit = lines.reduce((sum, l) => sum + (Number(l.debit) || 0), 0);
  const totalCredit = lines.reduce((sum, l) => sum + (Number(l.credit) || 0), 0);
  const diff = Math.abs(totalDebit - totalCredit);
  const balanced = diff <= 0.01;

  if (!balanced) {
    throw new Error(
      `Desbalance en partida doble: Débitos ($${totalDebit.toFixed(2)}) no coinciden con Créditos ($${totalCredit.toFixed(2)})`
    );
  }

  return { balanced, totalDebit, totalCredit, diff };
}

export function computeVoucherHashSeal(voucher: {
  previousHash: string;
  companyId: string;
  voucherNumber: string;
  date: string;
  totalDebit: number;
  totalCredit: number;
  lines: Array<{ accountCode: string; debit: number; credit: number }>;
}): string {
  const canonicalPayload = JSON.stringify({
    prev: voucher.previousHash,
    comp: voucher.companyId,
    num: voucher.voucherNumber,
    dt: voucher.date,
    td: voucher.totalDebit.toFixed(2),
    tc: voucher.totalCredit.toFixed(2),
    ln: voucher.lines.map((l) => ({
      a: l.accountCode,
      d: Number(l.debit).toFixed(2),
      c: Number(l.credit).toFixed(2),
    })),
  });

  return createHash("sha256").update(canonicalPayload, "utf8").digest("hex");
}

export function verifyVoucherIntegrity(voucher: {
  previousHash: string;
  companyId: string;
  voucherNumber: string;
  date: string;
  totalDebit: number;
  totalCredit: number;
  lines: Array<{ accountCode: string; debit: number; credit: number }>;
  hashSeal: string;
}): boolean {
  const calculated = computeVoucherHashSeal(voucher);
  return calculated === voucher.hashSeal;
}

export class VoucherDomain {
  constructor(
    public readonly id: string,
    public readonly companyId: string,
    public readonly voucherNumber: string,
    public readonly documentType: string,
    public readonly date: string,
    public readonly concept: string,
    public readonly totalDebit: number,
    public readonly totalCredit: number,
    public readonly previousHash: string,
    public readonly hashSeal: string,
    public readonly lines: VoucherLineInput[],
    public readonly createdAt: Date = new Date()
  ) {}

  public static create(dto: {
    id?: string;
    companyId: string;
    voucherNumber: string;
    documentType: string;
    date: string;
    concept: string;
    previousHash?: string;
    lines: VoucherLineInput[];
  }): VoucherDomain {
    const { totalDebit, totalCredit } = validateDoubleEntry(dto.lines);
    const prevHash = dto.previousHash || GENESIS_ACCOUNTING_HASH;
    const hashSeal = computeVoucherHashSeal({
      previousHash: prevHash,
      companyId: dto.companyId,
      voucherNumber: dto.voucherNumber,
      date: dto.date,
      totalDebit,
      totalCredit,
      lines: dto.lines,
    });

    return new VoucherDomain(
      dto.id || "vouch_" + Math.random().toString(36).substring(2, 9),
      dto.companyId,
      dto.voucherNumber,
      dto.documentType,
      dto.date,
      dto.concept,
      totalDebit,
      totalCredit,
      prevHash,
      hashSeal,
      dto.lines
    );
  }
}
