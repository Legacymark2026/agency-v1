import { prisma } from "@/lib/prisma";
import { requireTenant } from "@/lib/tenant";
import BankingDashboardClient from "./banking-client";

export default async function BankingPage() {
    const { companyId } = await requireTenant(true);
    
    const connections = await prisma.bankConnection.findMany({
        where: { companyId },
        orderBy: { createdAt: 'desc' }
    });
    
    // Get all transactions for connected banks
    const connectionIds = connections.map(c => c.id);
    const transactions = await prisma.bankTransaction.findMany({
        where: { connectionId: { in: connectionIds } },
        orderBy: { date: 'desc' }
    });
    
    return <BankingDashboardClient initialConnections={connections} initialTransactions={transactions} />;
}
