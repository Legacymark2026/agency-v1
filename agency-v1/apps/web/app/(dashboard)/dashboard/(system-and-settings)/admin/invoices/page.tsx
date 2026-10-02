import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@/types/auth";
import { InvoicesClient } from "./invoices-client";
import { getInvoiceStats } from "@/actions/invoices";

export default async function AdminInvoicesPage() {
    const session = await auth();
    if (!session?.user) redirect("/auth/login");

    const role = session.user.role as UserRole;
    if (role === UserRole.GUEST || role === UserRole.EXTERNAL_CLIENT) {
        redirect("/dashboard/unauthorized");
    }

    const invoices = await prisma.invoice.findMany({
        where: { companyId: session.user.companyId },
        orderBy: { createdAt: 'desc' },
    });

    const statsRes = await getInvoiceStats();
    const stats = statsRes.success && statsRes.data ? statsRes.data : { billed: 0, outstanding: 0, overdue: 0, successRate: 0 };

    return <InvoicesClient invoices={invoices} stats={stats} />;
}
