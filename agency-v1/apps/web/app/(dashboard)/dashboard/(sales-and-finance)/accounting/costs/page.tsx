import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import AdvancedCostAccountingClient from "./costs-client";

export default async function CostAccountingPage() {
    const session = await auth();
    if (!session?.user?.email) redirect("/login");
    
    const dbUser = await prisma.user.findUnique({
        where: { email: session.user.email },
        include: { companyUsers: true }
    });
    
    if (!dbUser || dbUser.companyUsers.length === 0) redirect("/login");
    
    const companyId = dbUser.companyUsers[0].companyId;
    
    // Fetch real data
    const expenses = await prisma.expense.findMany({
        where: { companyId },
        include: { costCenter: true },
        orderBy: { date: 'desc' }
    });
    
    const costCenters = await prisma.costCenter.findMany({
        where: { companyId },
        orderBy: { name: 'asc' }
    });
    
    return (
        <AdvancedCostAccountingClient 
            initialExpenses={expenses} 
            initialCostCenters={costCenters} 
        />
    );
}
