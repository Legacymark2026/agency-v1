import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { getPayuConfig, generatePayuSignature } from "@/lib/payu";
import PaymentPortalClient from "./payment-portal-client";

interface InvoicePageProps {
    params: {
        token: string;
        locale: string;
    };
}

export default async function PublicInvoicePage({ params }: InvoicePageProps) {
    const resolvedParams = await params;
    const { token } = resolvedParams;

    let invoice: any = null;

    try {
        invoice = await prisma.invoice.findUnique({
            where: { token },
            include: {
                company: true,
                items: true,
            },
        });
    } catch (error) {
        console.error("🔴 ERROR FETCHING INVOICE FROM DATABASE:", error);
    }

    if (!invoice) {
        notFound();
    }

    let payuConfig: any = null;
    try {
        const rawPayuConfig = await getPayuConfig(invoice.companyId);
        if (rawPayuConfig && rawPayuConfig.apiKey && rawPayuConfig.merchantId) {
            payuConfig = {
                merchantId: rawPayuConfig.merchantId,
                accountId: rawPayuConfig.accountId,
                checkoutUrl: rawPayuConfig.checkoutUrl,
                test: String(rawPayuConfig.test),
                signature: generatePayuSignature(
                    rawPayuConfig,
                    invoice.id,
                    invoice.finalAmount || invoice.totalAmount || 0,
                    invoice.currency || "COP"
                ),
            };
        }
    } catch (err) {
        console.warn("⚠️ Error generating PayU signature:", err);
    }

    const serializedInvoice = {
        id: invoice.id,
        token: invoice.token || token,
        clientName: invoice.clientName || "Cliente",
        clientNit: invoice.clientNit || null,
        clientAddress: invoice.clientAddress || null,
        clientCity: invoice.clientCity || null,
        clientPhone: invoice.clientPhone || null,
        subtotalAmount: invoice.subtotalAmount || 0,
        taxAmount: invoice.taxAmount || 0,
        discountAmount: invoice.discountAmount || 0,
        totalAmount: invoice.totalAmount || 0,
        advanceAmount: invoice.advanceAmount || 0,
        finalAmount: invoice.finalAmount || invoice.totalAmount || 0,
        status: invoice.status || "DRAFT_AWAITING_PAYMENT",
        currency: invoice.currency || "USD",
        isElectronic: Boolean(invoice.isElectronic),
        paymentUrl: invoice.paymentUrl || null,
        createdAt: invoice.createdAt ? new Date(invoice.createdAt).toISOString() : new Date().toISOString(),
        dueDate: invoice.dueDate ? new Date(invoice.dueDate).toISOString() : null,
        company: invoice.company
            ? {
                  name: invoice.company.name || "LegacyMark S.A.S.",
                  logoUrl: invoice.company.logoUrl || null,
                  nit: invoice.company.nit || null,
                  email: invoice.company.email || null,
                  phone: invoice.company.phone || null,
              }
            : null,
        items: (invoice.items || []).map((item: any) => ({
            id: item.id,
            title: item.title || "Concepto de Servicio",
            description: item.description || null,
            quantity: item.quantity || 1,
            unitPrice: item.unitPrice || 0,
            totalAmount: item.totalAmount || 0,
        })),
    };

    return <PaymentPortalClient invoice={serializedInvoice} payuConfig={payuConfig} />;
}
