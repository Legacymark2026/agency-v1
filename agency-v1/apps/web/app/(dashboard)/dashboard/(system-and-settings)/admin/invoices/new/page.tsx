import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { CreditCard, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { UserRole } from "@/types/auth";
import { InvoiceForm } from "./invoice-form";

export default async function NewInvoicePage() {
    const session = await auth();
    if (!session?.user) redirect("/auth/login");

    const role = session.user.role as UserRole;
    if (role === UserRole.GUEST || role === UserRole.EXTERNAL_CLIENT) {
        redirect("/dashboard/unauthorized");
    }

    const leads = await prisma.lead.findMany({
        where: { companyId: session.user.companyId },
        select: { id: true, name: true, company: true, email: true },
        orderBy: { createdAt: 'desc' }
    });

    return (
        <div className="flex flex-col h-[calc(100vh-theme(spacing.16))] p-6 md:p-8 bg-slate-950 text-slate-200 overflow-y-auto w-full max-w-[1200px] mx-auto">
            <div className="mb-6">
                <Link
                    href="/dashboard/admin/invoices"
                    className="inline-flex items-center text-sm font-medium text-slate-400 hover:text-white transition-colors"
                >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Volver a Facturas
                </Link>
            </div>

            <header className="flex flex-col mb-8">
                <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
                    <CreditCard className="h-6 w-6 text-teal-400" />
                    Emitir Nueva Factura
                </h1>
                <p className="text-sm text-slate-400 mt-1">
                    Crea una factura con enlace de PayU. Se puede vincular a un lead del CRM.
                </p>
            </header>

            <InvoiceForm leads={leads} />
        </div>
    );
}
