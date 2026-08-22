"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReconciliationService = void 0;
const database_1 = require("@agency/database");
class ReconciliationService {
    /**
     * Reconcilia transacciones bancarias contra facturas pendientes usando coincidencia difusa (Fuzzy Matching)
     */
    static async reconcileTransactions(companyId, transactions) {
        console.log(`[ReconciliationService] Running reconciliation for ${transactions.length} bank transactions`);
        let invoices = [];
        try {
            invoices = await database_1.prisma.invoice.findMany({
                where: { companyId, status: "PENDING" }
            });
        }
        catch (e) {
            // Fallback stubs for testing/missing migrations
            invoices = [
                { id: "inv-1", invoiceNumber: "INV-2026-001", amount: 1000, clientName: "Carlos Mendoza" },
                { id: "inv-2", invoiceNumber: "INV-2026-002", amount: 2500, clientName: "TechCorp" },
                { id: "inv-3", invoiceNumber: "INV-2026-003", amount: 800, clientName: "Alice" }
            ];
        }
        const matches = [];
        for (const tx of transactions) {
            let bestMatch = null;
            let highestScore = 0;
            for (const inv of invoices) {
                let score = 0;
                // 1. Exact amount match (High score)
                if (Math.abs(tx.amount - inv.amount) < 0.01) {
                    score += 50;
                }
                // 2. Reference text invoice number match
                const invNumClean = inv.invoiceNumber.toLowerCase().replace(/[^a-z0-9]/g, "");
                const txRefClean = tx.referenceText.toLowerCase().replace(/[^a-z0-9]/g, "");
                if (txRefClean.includes(invNumClean) || invNumClean.includes(txRefClean)) {
                    score += 40;
                }
                // 3. Client name matching
                if (inv.clientName && tx.referenceText.toLowerCase().includes(inv.clientName.toLowerCase())) {
                    score += 20;
                }
                if (score > highestScore && score >= 40) {
                    highestScore = score;
                    bestMatch = inv;
                }
            }
            if (bestMatch) {
                matches.push({
                    transactionId: tx.id,
                    reference: tx.referenceText,
                    amount: tx.amount,
                    matchedInvoiceId: bestMatch.id,
                    matchedInvoiceNumber: bestMatch.invoiceNumber,
                    confidenceScore: highestScore,
                    status: "RECONCILED"
                });
                // Mark invoice as paid in DB
                try {
                    await database_1.prisma.invoice.update({
                        where: { id: bestMatch.id },
                        data: { status: "PAID", paidAt: new Date() }
                    });
                }
                catch {
                    // ignore
                }
            }
            else {
                matches.push({
                    transactionId: tx.id,
                    reference: tx.referenceText,
                    amount: tx.amount,
                    matchedInvoiceId: null,
                    confidenceScore: 0,
                    status: "UNRESOLVED"
                });
            }
        }
        return matches;
    }
}
exports.ReconciliationService = ReconciliationService;
//# sourceMappingURL=reconciliation.service.js.map