"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireTenant } from "@/lib/tenant";

// 1. Connect a Bank Account
export async function connectBankAction(provider: string, bankName: string, accountType: string) {
    const { companyId } = await requireTenant(false);
    
    // Simulate API connection delay
    await new Promise(res => setTimeout(res, 1500));
    
    // Create a connection
    const connection = await prisma.bankConnection.create({
        data: {
            companyId,
            bankName,
            provider,
            accountId: `ACC-${Math.floor(Math.random() * 1000000)}`,
            accountType,
            currency: "COP",
            balance: Math.floor(Math.random() * 50000000) + 10000000,
            lastSyncedAt: new Date(),
        }
    });

    // Generate 5 random pending transactions to reconcile
    const mockTx = [
        { desc: "Pago Arriendo Oficina", amount: -4500000 },
        { desc: "Ingreso Cliente A", amount: 12000000 },
        { desc: "Pago Proveedor X", amount: -1250000 },
        { desc: "Suscripción Software", amount: -450000 },
        { desc: "Transferencia Recibida", amount: 8000000 },
    ];

    for (const tx of mockTx) {
        await prisma.bankTransaction.create({
            data: {
                connectionId: connection.id,
                providerTxId: `TX-${Math.floor(Math.random() * 10000000)}`,
                date: new Date(),
                amount: tx.amount,
                description: tx.desc,
                status: "PENDING",
            }
        });
    }
    
    revalidatePath("/dashboard/admin/treasury/banking");
}

// 2. Auto-Reconcile Algorithm
export async function runAutoReconciliationAction() {
    const { companyId } = await requireTenant(false);
    
    // Get all pending bank transactions for this company
    const connections = await prisma.bankConnection.findMany({
        where: { companyId },
        select: { id: true }
    });
    
    const connectionIds = connections.map(c => c.id);
    
    const pendingTx = await prisma.bankTransaction.findMany({
        where: { connectionId: { in: connectionIds }, status: "PENDING" }
    });

    let reconciledCount = 0;

    // A VERY simple heuristic: 
    // If it's a negative amount, look for an Expense with the exact same amount.
    for (const tx of pendingTx) {
        if (tx.amount < 0) {
            const absoluteAmount = Math.abs(tx.amount);
            const matchingExpense = await prisma.expense.findFirst({
                where: { 
                    companyId, 
                    amount: absoluteAmount,
                    // in a real system we'd check status="PENDING" and date proximity
                }
            });

            if (matchingExpense) {
                // Match found!
                await prisma.bankTransaction.update({
                    where: { id: tx.id },
                    data: {
                        status: "RECONCILED",
                        reconciledType: "EXPENSE",
                        reconciledToId: matchingExpense.id
                    }
                });
                
                // Update expense status to PAID
                await prisma.expense.update({
                    where: { id: matchingExpense.id },
                    data: { status: "PAID" }
                });
                
                reconciledCount++;
            }
        }
    }
    
    revalidatePath("/dashboard/admin/treasury/banking");
    revalidatePath("/dashboard/accounting/costs"); // Update ledger as well
    
    return reconciledCount;
}
