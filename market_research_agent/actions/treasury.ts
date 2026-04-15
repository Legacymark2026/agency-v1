"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { UserRole } from "@/types/auth";
import { revalidatePath } from "next/cache";

export type CreateAccountInput = {
    name: string;
    type: "BANK_ACCOUNT" | "CREDIT_CARD" | "DIGITAL_WALLET" | "CASH";
    currency: string;
    description?: string;
    initialBalance?: number;
};

export type CreateTransactionInput = {
    accountId: string;
    type: "INCOME" | "EXPENSE" | "TRANSFER";
    amount: number;
    category: string;
    description?: string;
    date: string;
    reference?: string;
    invoiceId?: string;
    payrollId?: string;
};

export async function createFinancialAccount(data: CreateAccountInput) {
    try {
        const session = await auth();
        if (!session?.user?.companyId) return { success: false, error: "Unauthorized" };

        const role = session.user.role as UserRole;
        if (role !== UserRole.SUPER_ADMIN && role !== UserRole.ADMIN) {
            return { success: false, error: "Forbidden" };
        }

        const account = await prisma.financialAccount.create({
            data: {
                companyId: session.user.companyId,
                name: data.name,
                type: data.type,
                currency: data.currency,
                description: data.description,
                balance: data.initialBalance || 0,
            }
        });

        revalidatePath("/dashboard/admin/treasury");
        return { success: true, accountId: account.id };
    } catch (error: any) {
        console.error("[CREATE_ACCOUNT]", error);
        return { success: false, error: error.message || "Failed to create account" };
    }
}

export async function getFinancialAccounts() {
    try {
         const session = await auth();
         if (!session?.user?.companyId) return { success: false, data: [] };

         const accounts = await prisma.financialAccount.findMany({
             where: { companyId: session.user.companyId, isActive: true },
             orderBy: { createdAt: 'asc' }
         });

         return { success: true, data: accounts };
    } catch (error) {
         return { success: false, data: [] };
    }
}

export async function recordTransaction(data: CreateTransactionInput) {
    try {
        const session = await auth();
        if (!session?.user?.companyId) return { success: false, error: "Unauthorized" };

        const role = session.user.role as UserRole;
        if (role !== UserRole.SUPER_ADMIN && role !== UserRole.ADMIN) {
            return { success: false, error: "Forbidden" };
        }

        const account = await prisma.financialAccount.findUnique({
            where: { id: data.accountId, companyId: session.user.companyId }
        });

        if (!account) return { success: false, error: "Account not found" };

        // Realizamos la transacción y la actualización de saldo atómicamente
        const tx = await prisma.$transaction(async (prismaTx) => {
            const transaction = await prismaTx.financialTransaction.create({
                data: {
                    accountId: data.accountId,
                    type: data.type,
                    amount: data.amount,
                    category: data.category,
                    description: data.description,
                    date: new Date(data.date),
                    reference: data.reference,
                    invoiceId: data.invoiceId,
                    payrollId: data.payrollId
                }
            });

            // Actualizar balance
            const balanceChange = data.type === "INCOME" ? data.amount : -data.amount;
            
            await prismaTx.financialAccount.update({
                where: { id: data.accountId },
                data: { balance: { increment: balanceChange } }
            });

            return transaction;
        });

        revalidatePath("/dashboard/admin/treasury");
        return { success: true, transactionId: tx.id };
    } catch (error: any) {
        console.error("[RECORD_TRANSACTION]", error);
        return { success: false, error: error.message || "Failed to record transaction" };
    }
}

export async function getRecentTransactions(limit = 10) {
    try {
         const session = await auth();
         if (!session?.user?.companyId) return { success: false, data: [] };

         const transactions = await prisma.financialTransaction.findMany({
             where: { account: { companyId: session.user.companyId } },
             include: { account: { select: { name: true, type: true } } },
             orderBy: { date: 'desc' },
             take: limit
         });

         return { success: true, data: transactions };
    } catch (error) {
         return { success: false, data: [] };
    }
}
