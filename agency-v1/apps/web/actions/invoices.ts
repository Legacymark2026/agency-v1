"use server";

import { auth } from "@/lib/auth";
import { UserRole } from "@/types/auth";
import { getStripeSession } from "@/lib/stripe";
import { revalidatePath } from "next/cache";
import { notifyUsers } from "@/lib/notifications/notification-engine";
import { prisma } from "@/lib/prisma";
import { randomUUID } from "crypto";

export type InvoiceInput = {
    clientName: string;
    clientNit?: string;
    clientAddress?: string;
    clientCity?: string;
    clientPhone?: string;
    subtotalAmount: number;
    taxAmount: number;
    discountAmount: number;
    totalAmount: number;
    advanceAmount: number;
    finalAmount: number;
    currency?: string;
    dueDate?: Date;
    notes?: string;
    terms?: string;
    isElectronic?: boolean;
    leadId?: string;
    dealId?: string;
    items: {
        title: string;
        description?: string;
        quantity: number;
        unitPrice: number;
        taxRate: number;
        totalAmount: number;
    }[];
};

export async function createInvoice(data: InvoiceInput) {
    try {
        const session = await auth();
        if (!session?.user?.companyId) return { success: false, error: "Unauthorized" };

        const role = session.user.role as UserRole;
        if (role !== UserRole.SUPER_ADMIN && role !== UserRole.ADMIN) {
            return { success: false, error: "Forbidden" };
        }

        const token = randomUUID();

        const invoice = await prisma.invoice.create({
            data: {
                clientName: data.clientName,
                clientNit: data.clientNit,
                clientAddress: data.clientAddress,
                clientCity: data.clientCity,
                clientPhone: data.clientPhone,
                subtotalAmount: data.subtotalAmount,
                taxAmount: data.taxAmount,
                discountAmount: data.discountAmount || 0,
                totalAmount: data.totalAmount,
                advanceAmount: data.advanceAmount,
                finalAmount: data.finalAmount,
                currency: data.currency || "USD",
                dueDate: data.dueDate,
                notes: data.notes,
                terms: data.terms,
                isElectronic: data.isElectronic ?? true,
                leadId: data.leadId,
                dealId: data.dealId,
                token: token,
                companyId: session.user.companyId,
                items: data.items && data.items.length > 0 ? {
                    create: data.items.map(item => ({
                        title: item.title,
                        description: item.description,
                        quantity: item.quantity,
                        unitPrice: item.unitPrice,
                        taxRate: item.taxRate,
                        totalAmount: item.totalAmount,
                    }))
                } : undefined,
            }
        });

        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://legacymarksas.com";
        const successUrl = `${baseUrl}/es/invoice/${token}?success=true`;
        const cancelUrl = `${baseUrl}/es/invoice/${token}?canceled=true`;

        try {
            const stripeSession = await getStripeSession(
                session.user.companyId,
                data.finalAmount,
                data.currency || "USD",
                `Factura a ${data.clientName}`,
                { invoiceId: invoice.id, companyId: session.user.companyId },
                successUrl,
                cancelUrl
            );

            if (stripeSession && stripeSession.url) {
                await prisma.invoice.update({
                    where: { id: invoice.id },
                    data: {
                        paymentUrl: stripeSession.url,
                        stripeInvoiceId: stripeSession.id,
                    }
                });
            }
        } catch (stripeError) {
             console.warn("[Stripe Link Generation Notice]", stripeError);
        }

        revalidatePath("/dashboard/admin/invoices");

        notifyUsers("FINANCE.INVOICE_CREATED", {
            companyId: session.user.companyId,
            title: "Nueva Factura Creada",
            message: `Factura para ${data.clientName} — $${data.finalAmount.toLocaleString()}`,
            roles: ["super_admin", "admin"],
            data: { invoiceId: invoice.id, token: invoice.token },
        }).catch(() => {});

        return { success: true, invoiceId: invoice.id, token: invoice.token };

    } catch (error: any) {
        console.error("[CREATE_INVOICE]", error);
        return { success: false, error: error.message || "Failed to create invoice" };
    }
}

export async function updateInvoiceStatus(invoiceId: string, status: string) {
    try {
        const session = await auth();
        if (!session?.user?.companyId) return { success: false, error: "Unauthorized" };

        const invoice = await prisma.invoice.update({
            where: { id: invoiceId, companyId: session.user.companyId },
            data: { status }
        });

        if (status === "PAID") {
            notifyUsers("FINANCE.INVOICE_PAID", {
                companyId: session.user.companyId,
                title: "Factura Pagada ✅",
                message: `${invoice.clientName} — $${invoice.totalAmount.toLocaleString()}`,
                roles: ["super_admin", "admin"],
                data: { invoiceId },
            }).catch(() => {});
        }

        revalidatePath("/dashboard/admin/invoices");
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message || "Failed to update status" };
    }
}

export async function deleteInvoice(invoiceId: string) {
    try {
        const session = await auth();
        if (!session?.user?.companyId) return { success: false, error: "Unauthorized" };

        await prisma.invoice.delete({
            where: { id: invoiceId, companyId: session.user.companyId }
        });

        revalidatePath("/dashboard/admin/invoices");
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message || "Failed to delete" };
    }
}

export async function sendInvoiceEmail(invoiceId: string) {
    try {
        const session = await auth();
        if (!session?.user?.companyId) return { success: false, error: "Unauthorized" };

        const invoice = await prisma.invoice.findFirst({
            where: { id: invoiceId, companyId: session.user.companyId }
        });

        if (invoice && invoice.status === 'DRAFT_AWAITING_PAYMENT') {
            await prisma.invoice.update({
                where: { id: invoiceId },
                data: { status: 'SENT' }
            });
        }

        revalidatePath("/dashboard/admin/invoices");
        return { success: true };
    } catch (error: any) {
         return { success: false, error: "Error sending email" };
    }
}

export async function getInvoiceStats() {
    try {
        const session = await auth();
        if (!session?.user?.companyId) return { success: false, data: null };

        const invoices = await prisma.invoice.findMany({
            where: { companyId: session.user.companyId }
        });

        const billed = invoices
            .filter(i => i.status === 'PAID')
            .reduce((acc, i) => acc + (i.finalAmount || 0), 0);

        const outstanding = invoices
            .filter(i => i.status === 'DRAFT_AWAITING_PAYMENT' || i.status === 'SENT')
            .reduce((acc, i) => acc + (i.finalAmount || 0), 0);

        const overdue = invoices
            .filter(i => (i.status === 'DRAFT_AWAITING_PAYMENT' || i.status === 'SENT') && i.dueDate && new Date(i.dueDate) < new Date())
            .reduce((acc, i) => acc + (i.finalAmount || 0), 0);

        const totalCount = invoices.length;
        const paidCount = invoices.filter(i => i.status === 'PAID').length;
        const successRate = totalCount > 0 ? Math.round((paidCount / totalCount) * 100) : 0;

        return {
            success: true,
            data: {
                billed,
                outstanding,
                overdue,
                successRate
            }
        };
    } catch (error) {
        return { success: false, data: null };
    }
}
