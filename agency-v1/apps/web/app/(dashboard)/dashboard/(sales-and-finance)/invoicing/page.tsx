import { prisma } from "@/lib/prisma";
import { requireTenant } from "@/lib/tenant";
import DianClient from "./dian-client";

export default async function DianPage() {
    const { companyId } = await requireTenant(true);
    
    // In a real app we might only want Draft or Pending invoices, or all for history.
    const invoices = await prisma.invoice.findMany({
        where: { companyId },
        orderBy: { dueDate: 'asc' }
    });
    
    return <DianClient initialInvoices={invoices} />;
}
