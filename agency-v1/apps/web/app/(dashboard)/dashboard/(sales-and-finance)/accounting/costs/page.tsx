import { prisma } from "@/lib/prisma";
import { requireTenant } from "@/lib/tenant";
import AdvancedCostAccountingClient from "./costs-client";

export default async function CostAccountingPage() {
    // Boilerplate reduced from 15 lines to 1 line!
    const { companyId } = await requireTenant(true);
    
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
            initialExpenses={JSON.parse(JSON.stringify(expenses))} 
            initialCostCenters={JSON.parse(JSON.stringify(costCenters))} 
        />
    );
}
