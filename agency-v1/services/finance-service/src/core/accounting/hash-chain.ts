/**
 * Accounting Hash Chain & Cryptographic Audit Seal
 * ─────────────────────────────────────────────────────────────────────────────
 * Implements blockchain-style hash linking (ISO/IEC 27001 Control A.8.15 & Ley 527/1999).
 * Every journal voucher is cryptographically sealed with the hash of the preceding voucher.
 */
import crypto from "crypto";

export const GENESIS_ACCOUNTING_HASH = "GENESIS_LEGACYMARK_COLOMBIA_FINANCE_HASH_2026";

export interface VoucherSealInput {
  previousHash?: string;
  companyId: string;
  voucherNumber: string;
  date: string;
  totalDebit: number;
  totalCredit: number;
  lines: Array<{
    accountCode: string;
    debit: number;
    credit: number;
    thirdPartyNit?: string;
  }>;
}

/**
 * Computes deterministic SHA-256 integrity seal for a journal voucher.
 */
export function computeVoucherHashSeal(input: VoucherSealInput): string {
  const linesSignature = (input.lines || [])
    .map((l) => `${l.accountCode}:${Number(l.debit || 0).toFixed(2)}:${Number(l.credit || 0).toFixed(2)}:${l.thirdPartyNit || ""}`)
    .sort()
    .join(";");

  const raw = [
    input.previousHash || GENESIS_ACCOUNTING_HASH,
    input.companyId,
    input.voucherNumber,
    input.date,
    Number(input.totalDebit || 0).toFixed(2),
    Number(input.totalCredit || 0).toFixed(2),
    linesSignature,
  ].join("|");

  return crypto.createHash("sha256").update(raw).digest("hex");
}

/**
 * Verifies whether a voucher's hash seal matches its actual ledger contents (tamper detection).
 */
export function verifyVoucherIntegrity(voucher: VoucherSealInput & { hashSeal?: string }): {
  isValid: boolean;
  computedHash: string;
  recordedHash?: string;
} {
  const computed = computeVoucherHashSeal(voucher);
  return {
    isValid: computed === voucher.hashSeal,
    computedHash: computed,
    recordedHash: voucher.hashSeal,
  };
}
