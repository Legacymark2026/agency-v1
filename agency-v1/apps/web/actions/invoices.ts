"use server";

import { auth } from "@/lib/auth";
import { UserRole } from "@/types/auth";
import { getStripeSession } from "@/lib/stripe";
import { revalidatePath } from "next/cache";
import { notifyUsers } from "@/lib/notifications/notification-engine";

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

const GATEWAY_URL = process.env.API_GATEWAY_URL || "http://localhost:8080";

export async function createInvoice(data: InvoiceInput) {
    try {
        const session = await auth();
        if (!session?.user?.companyId) return { success: false, error: "Unauthorized" };

        const role = session.user.role as UserRole;
        if (role !== UserRole.SUPER_ADMIN && role !== UserRole.ADMIN) {
            return { success: false, error: "Forbidden" };
        }

        const response = await fetch(`${GATEWAY_URL}/api/invoices`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                ...data,
                companyId: session.user.companyId,
            })
        });
        const resData = await response.json();
        if (!response.ok) return { success: false, error: resData.error || "Failed to create invoice" };
        const invoice = resData.invoice;

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
                await fetch(`${GATEWAY_URL}/api/invoices/${invoice.id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ paymentUrl: stripeSession.url, stripeInvoiceId: stripeSession.id })
                });
            }
        } catch (stripeError) {
             console.error("[Stripe Link Generation Failed]", stripeError);
             // No retornamos error fatal porque la factura ya se creó. Permite reintentar después.
        }

        revalidatePath("/dashboard/admin/invoices");

        // ─── Enterprise Notification — Invoice Created ────────────────────────
        notifyUsers("FINANCE.INVOICE_CREATED", {
            companyId: session.user.companyId,
            title: "Nueva Factura Creada",
            message: `Factura para ${data.clientName} — $${data.finalAmount.toLocaleString()}`,
            roles: ["super_admin", "admin"],
            data: { invoiceId: invoice.id },
        }).catch(() => {});

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

        const response = await fetch(`${GATEWAY_URL}/api/invoices/${invoiceId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status })
        });
        const resData = await response.json();
        if (!response.ok) return { success: false, error: resData.error || "Failed to update status" };
        const invoice = resData.invoice;

        // ─── Enterprise Notification — Invoice Status ─────────────────────────
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

        const response = await fetch(`${GATEWAY_URL}/api/invoices/${invoiceId}`, {
            method: 'DELETE'
        });
        const resData = await response.json();
        if (!response.ok) return { success: false, error: resData.error || "Failed to delete" };

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
        const invoicesRes = await fetch(`${GATEWAY_URL}/api/invoices?companyId=${session.user.companyId}`);
        const invoicesData = await invoicesRes.json();
        const invoice = (invoicesData.invoices || []).find((inv: any) => inv.id === invoiceId);
        if (invoice && invoice.status === 'DRAFT_AWAITING_PAYMENT') {
            await fetch(`${GATEWAY_URL}/api/invoices/${invoiceId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'SENT' })
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

        const response = await fetch(`${GATEWAY_URL}/api/invoices/stats?companyId=${session.user.companyId}`);
        const resData = await response.json();
        if (!response.ok) return { success: false, data: null };

        return {
            success: true,
            data: resData.data
        };
    } catch (error) {
        return { success: false, data: null };
    }
}
