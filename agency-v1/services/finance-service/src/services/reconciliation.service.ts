import { prisma } from "@agency/database";

export interface BankTransaction {
  id: string;
  amount: number;
  date: Date;
  referenceText: string;
}

export interface ReconciliationMatch {
  transactionId: string;
  reference: string;
  amount: number;
  matchedInvoiceId: string | null;
  matchedInvoiceNumber: string | null;
  confidenceScore: number;
  status: "RECONCILED" | "UNRESOLVED";
}

export class ReconciliationService {
  /**
   * Fix C-6: Removed hardcoded mock data. Now uses REAL pending invoices from DB.
   * If no pending invoices exist, returns all transactions as UNRESOLVED (correct behavior).
   * Reconciles bank transactions against pending invoices using fuzzy matching.
   */
  static async reconcileTransactions(
    companyId: string,
    transactions: BankTransaction[]
  ): Promise<ReconciliationMatch[]> {
    if (!transactions.length) return [];

    // Fetch real pending invoices — no fallback to mock data
    const invoices = await prisma.invoice.findMany({
      where: { companyId, status: { in: ["DRAFT_AWAITING_PAYMENT", "PENDING"] } },
      select: { id: true, invoiceNumber: true, totalAmount: true, clientName: true },
    });

    const matches: ReconciliationMatch[] = [];

    for (const tx of transactions) {
      let bestMatch: typeof invoices[0] | null = null;
      let highestScore = 0;

      for (const inv of invoices) {
        let score = 0;
        const txAmount = Number(tx.amount);
        const invAmount = Number(inv.totalAmount);

        // 1. Exact amount match (highest confidence)
        if (Math.abs(txAmount - invAmount) < 0.01) {
          score += 50;
        } else if (Math.abs(txAmount - invAmount) / invAmount < 0.02) {
          // Within 2% (bank fees tolerance)
          score += 30;
        }

        // 2. Invoice number reference match
        if (inv.invoiceNumber) {
          const invNumClean = inv.invoiceNumber.toLowerCase().replace(/[^a-z0-9]/g, "");
          const txRefClean = tx.referenceText.toLowerCase().replace(/[^a-z0-9]/g, "");
          if (txRefClean.includes(invNumClean) || invNumClean.includes(txRefClean)) {
            score += 40;
          }
        }

        // 3. Client name partial match
        if (inv.clientName && tx.referenceText.toLowerCase().includes(inv.clientName.toLowerCase())) {
          score += 20;
        }

        if (score > highestScore && score >= 40) {
          highestScore = score;
          bestMatch = inv;
        }
      }

      if (bestMatch) {
        // Mark matched invoice as PAID in DB
        await prisma.invoice.update({
          where: { id: bestMatch.id },
          data: { status: "PAID", paidAt: new Date() },
        }).catch((err) => {
          // Log but don't fail the whole reconciliation if one update fails
          console.error(`[ReconciliationService] Failed to update invoice ${bestMatch!.id}:`, err);
        });

        matches.push({
          transactionId: tx.id,
          reference: tx.referenceText,
          amount: Number(tx.amount),
          matchedInvoiceId: bestMatch.id,
          matchedInvoiceNumber: bestMatch.invoiceNumber,
          confidenceScore: highestScore,
          status: "RECONCILED",
        });
      } else {
        matches.push({
          transactionId: tx.id,
          reference: tx.referenceText,
          amount: Number(tx.amount),
          matchedInvoiceId: null,
          matchedInvoiceNumber: null,
          confidenceScore: 0,
          status: "UNRESOLVED",
        });
      }
    }

    return matches;
  }
}
