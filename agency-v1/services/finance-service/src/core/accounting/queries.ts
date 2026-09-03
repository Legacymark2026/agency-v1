/**
 * CQRS Query Handlers — Read Side (Projections & Financial Reports)
 * ─────────────────────────────────────────────────────────────────────────────
 * High-performance read models for Trial Balance, General Ledger,
 * DIAN Exógena 1001, and Cryptographic Hash Chain Audit.
 */
import { prisma } from "@agency/database";
import { verifyVoucherIntegrity } from "./hash-chain";

export class AccountingQueryService {
  /**
   * Generates Balance de Comprobación (Trial Balance) with Sumas Iguales validation.
   */
  public static async getTrialBalance(companyId: string, startDate?: string, endDate?: string) {
    const where: any = { companyId, status: { not: "ANULADO" } };
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) where.date.lte = new Date(endDate);
    }

    const vouchers = await (prisma as any).accountingVoucher.findMany({
      where,
      include: { lines: true },
    });

    const accountMap: Record<
      string,
      { accountCode: string; accountName: string; totalDebit: number; totalCredit: number; balance: number }
    > = {};

    let grandTotalDebit = 0;
    let grandTotalCredit = 0;

    for (const v of vouchers) {
      for (const line of v.lines) {
        const code = line.accountCode;
        if (!accountMap[code]) {
          accountMap[code] = {
            accountCode: code,
            accountName: line.accountName,
            totalDebit: 0,
            totalCredit: 0,
            balance: 0,
          };
        }

        const debit = Number(line.debit) || 0;
        const credit = Number(line.credit) || 0;

        accountMap[code].totalDebit += debit;
        accountMap[code].totalCredit += credit;
        grandTotalDebit += debit;
        grandTotalCredit += credit;
      }
    }

    // Calcular saldos finales según naturaleza (Clases 1, 5, 6 débito; Clases 2, 3, 4 crédito)
    const accounts = Object.values(accountMap).map((acc) => {
      const firstDigit = acc.accountCode.charAt(0);
      const isDebitNature = ["1", "5", "6", "7"].includes(firstDigit);
      acc.balance = isDebitNature ? acc.totalDebit - acc.totalCredit : acc.totalCredit - acc.totalDebit;
      return acc;
    });

    accounts.sort((a, b) => a.accountCode.localeCompare(b.accountCode));

    return {
      success: true,
      companyId,
      grandTotalDebit: Math.round(grandTotalDebit * 100) / 100,
      grandTotalCredit: Math.round(grandTotalCredit * 100) / 100,
      isBalanced: Math.abs(grandTotalDebit - grandTotalCredit) < 0.01,
      totalAccounts: accounts.length,
      accounts,
    };
  }

  /**
   * Verifies the cryptographic chain of custody across all tenant journal vouchers.
   * Detects any database tampering or broken links.
   */
  public static async verifyLedgerIntegrityChain(companyId: string) {
    const vouchers = await (prisma as any).accountingVoucher.findMany({
      where: { companyId },
      orderBy: { createdAt: "asc" },
      include: { lines: true },
    });

    let chainValid = true;
    let previousExpectedHash: string | undefined = undefined;
    const report: Array<{ voucherNumber: string; isSelfValid: boolean; isChainLinked: boolean }> = [];

    for (const v of vouchers) {
      const integrity = verifyVoucherIntegrity({
        previousHash: v.previousHash || undefined,
        companyId: v.companyId,
        voucherNumber: v.voucherNumber,
        date: v.date.toISOString().split("T")[0],
        totalDebit: Number(v.totalDebit),
        totalCredit: Number(v.totalCredit),
        lines: v.lines.map((l: any) => ({
          accountCode: l.accountCode,
          debit: Number(l.debit),
          credit: Number(l.credit),
          thirdPartyNit: l.thirdPartyNit || undefined,
        })),
        hashSeal: v.hashSeal || undefined,
      });

      const isChainLinked = previousExpectedHash ? v.previousHash === previousExpectedHash : true;
      if (!integrity.isValid || !isChainLinked) {
        chainValid = false;
      }

      previousExpectedHash = v.hashSeal || undefined;

      report.push({
        voucherNumber: v.voucherNumber,
        isSelfValid: integrity.isValid,
        isChainLinked,
      });
    }

    return {
      success: true,
      totalVouchersChecked: vouchers.length,
      isChainIntact: chainValid,
      report,
    };
  }
}
