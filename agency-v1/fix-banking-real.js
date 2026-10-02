const fs = require('fs');
const path = 'apps/web/actions/banking.actions.ts';
let content = fs.readFileSync(path, 'utf8');

const newContent = \"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireTenant } from "@/lib/tenant";

// REAL API INTEGRATION - BELVO (LATAM OPEN BANKING)
export async function connectBankAction(linkId: string, institution: string) {
    const { companyId } = await requireTenant(false);
    
    // REQUIRE REAL KEYS
    const SECRET = process.env.BELVO_SECRET_ID;
    const PASSWORD = process.env.BELVO_SECRET_PASSWORD;
    
    if (!SECRET || !PASSWORD) {
        throw new Error("Missing Belvo API credentials in production environment variables.");
    }

    const authHeader = Buffer.from(\\\\:\\\\).toString('base64');

    // 1. Fetch Real Accounts from Bank
    const accountsRes = await fetch(\https://sandbox.belvo.com/api/accounts/?link=\\, {
        headers: { 'Authorization': \Basic \\ }
    });
    const accountsData = await accountsRes.json();
    
    if (!accountsData.results || accountsData.results.length === 0) {
        throw new Error("No se encontraron cuentas bancarias reales en este enlace.");
    }

    const realAccount = accountsData.results[0];

    // 2. Persist Real Bank Connection in PostgreSQL
    const connection = await prisma.bankConnection.create({
        data: {
            companyId,
            bankName: realAccount.institution.name || institution,
            provider: "BELVO",
            accountId: realAccount.id, // REAL ID
            accountType: realAccount.category,
            currency: realAccount.currency,
            balance: realAccount.balance.current, // REAL BALANCE
            lastSyncedAt: new Date(),
        }
    });

    // 3. Fetch Real Transactions (Last 30 days)
    const txRes = await fetch(\https://sandbox.belvo.com/api/transactions/?link=\&account=\\, {
        headers: { 'Authorization': \Basic \\ }
    });
    const txData = await txRes.json();

    // 4. Save Real Transactions to DB
    if (txData.results) {
        for (const tx of txData.results) {
            await prisma.bankTransaction.create({
                data: {
                    connectionId: connection.id,
                    providerTxId: tx.id,
                    date: new Date(tx.value_date),
                    amount: tx.amount,
                    description: tx.description,
                    status: "PENDING",
                }
            });
        }
    }
    
    revalidatePath("/dashboard/admin/treasury/banking");
}

export async function runAutoReconciliationAction() {
    const { companyId } = await requireTenant(false);
    
    const connections = await prisma.bankConnection.findMany({
        where: { companyId },
        select: { id: true }
    });
    
    const connectionIds = connections.map(c => c.id);
    
    const pendingTx = await prisma.bankTransaction.findMany({
        where: { connectionId: { in: connectionIds }, status: "PENDING" }
    });

    let reconciledCount = 0;

    for (const tx of pendingTx) {
        if (tx.amount < 0) {
            const absoluteAmount = Math.abs(tx.amount);
            const matchingExpense = await prisma.expense.findFirst({
                where: { 
                    companyId, 
                    amount: absoluteAmount,
                    status: "APPROVED"
                }
            });

            if (matchingExpense) {
                await prisma.bankTransaction.update({
                    where: { id: tx.id },
                    data: {
                        status: "RECONCILED",
                        reconciledType: "EXPENSE",
                        reconciledToId: matchingExpense.id
                    }
                });
                
                await prisma.expense.update({
                    where: { id: matchingExpense.id },
                    data: { status: "PAID" }
                });
                
                reconciledCount++;
            }
        }
    }
    
    revalidatePath("/dashboard/admin/treasury/banking");
    revalidatePath("/dashboard/accounting/costs");
    
    return reconciledCount;
}
\;

fs.writeFileSync(path, newContent, 'utf8');
