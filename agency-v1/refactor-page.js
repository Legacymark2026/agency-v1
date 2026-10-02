const fs = require('fs');
const path = 'apps/web/app/(dashboard)/dashboard/(sales-and-finance)/accounting/costs/page.tsx';
let content = fs.readFileSync(path, 'utf8');

const newContent = \import { prisma } from "@/lib/prisma";
import { requireTenant } from "@/lib/tenant";
import AdvancedCostAccountingClient from "./costs-client";

export default async function CostAccountingPage() {
    const { companyId } = await requireTenant(true);
    
    const expenses = await prisma.expense.findMany({
        where: { companyId },
        include: { costCenter: true },
        orderBy: { date: 'desc' }
    });
    
    const costCenters = await prisma.costCenter.findMany({
        where: { companyId },
        orderBy: { name: 'asc' }
    });
    
    return <AdvancedCostAccountingClient initialExpenses={expenses} initialCostCenters={costCenters} />;
}
\;

fs.writeFileSync(path, newContent, 'utf8');
