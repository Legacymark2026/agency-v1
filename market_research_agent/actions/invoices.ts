"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { UserRole } from "@/types/auth";
import { getStripeSession } from "@/lib/stripe";
import { revalidatePath } from "next/cache";

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

        const invoice = await prisma.invoice.create({
            data: {
                clientName: data.clientName,
                clientNit: data.clientNit,
                clientAddress: data.clientAddress,
                clientCity: data.clientCity,
                clientPhone: data.clientPhone,
                subtotalAmount: data.subtotalAmount,
                taxAmount: data.taxAmount,
                discountAmount: data.discountAmount,
                totalAmount: data.totalAmount,
                advanceAmount: data.advanceAmount,
                finalAmount: data.finalAmount,
                dueDate: data.dueDate,
                notes: data.notes,
                terms: data.terms,
                leadId: data.leadId,
                dealId: data.dealId,
                companyId: session.user.companyId,
                isElectronic: data.isElectronic ?? true,
                status: "DRAFT_AWAITING_PAYMENT",
                items: {
                    create: data.items.map(item => ({
                        title: item.title,
                        description: item.description,
                        quantity: item.quantity,
                        unitPrice: item.unitPrice,
                        taxRate: item.taxRate,
                        totalAmount: item.totalAmount
                    }))
                }
            }
        });

        // Generar Stripe Session para el Final Amount (es lo que se va a cobrar)
        // Usamos el token generado para la URL de retorno
        const successUrl = `${process.env.NEXT_PUBLIC_APP_URL}/es/invoice/${invoice.token}?success=true`;
        const cancelUrl = `${process.env.NEXT_PUBLIC_APP_URL}/es/invoice/${invoice.token}?canceled=true`;

        try {
            const stripeSession = await getStripeSession(
                session.user.companyId,
                data.finalAmount,
                "USD",
                `Factura a ${data.clientName}`,
                { invoiceId: invoice.id, companyId: session.user.companyId },
                successUrl,
                cancelUrl
            );

            if (stripeSession && stripeSession.url) {
                await prisma.invoice.update({
                    where: { id: invoice.id },
                    data: { paymentUrl: stripeSession.url, stripeInvoiceId: stripeSession.id }
                });
            }
        } catch (stripeError) {
             console.error("[Stripe Link Generation Failed]", stripeError);
             // No retornamos error fatal porque la factura ya se creó. Permite reintentar después.
        }

        revalidatePath("/dashboard/admin/invoices");
        return { success: true, invoiceId: invoice.id };

    } catch (error: any) {
        console.error("[CREATE_INVOICE]", error);
        return { success: false, error: error.message || "Failed to create invoice" };
    }
}

export async function updateInvoiceStatus(invoiceId: string, status: string) {
    try {
        const session = await auth();
        if (!session?.user?.companyId) return { success: false, error: "Unauthorized" };

        await prisma.invoice.update({
            where: { id: invoiceId, companyId: session.user.companyId },
            data: { status }
        });

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

        // Aquí iría la integración con Resend
        // Simulando delay de envío
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Actualizamos estado si estaba en draft
        const invoice = await prisma.invoice.findUnique({ where: { id: invoiceId }});
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
            where: { companyId: session.user.companyId },
            select: { totalAmount: true, status: true, dueDate: true }
        });

        const now = new Date();
        let billed = 0;
        let outstanding = 0;
        let overdue = 0;
        let paidCount = 0;
        let totalCount = invoices.length;

        invoices.forEach(inv => {
            if (inv.status === 'PAID') {
                billed += inv.totalAmount;
                paidCount++;
            } else if (inv.status !== 'CANCELLED') {
                outstanding += inv.totalAmount;
                if (inv.dueDate && new Date(inv.dueDate) < now) {
                    overdue += inv.totalAmount;
                }
            }
        });

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
