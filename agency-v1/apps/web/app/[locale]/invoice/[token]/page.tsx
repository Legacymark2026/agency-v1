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

    try {
        const invoice = await prisma.invoice.findUnique({
            where: { token },
            include: {
                company: true,
                items: true,
            },
        });

        if (!invoice) return notFound();

        const rawPayuConfig = await getPayuConfig(invoice.companyId);
        const payuConfig = rawPayuConfig
            ? {
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
              }
            : null;

        const serializedInvoice = {
            id: invoice.id,
            token: invoice.token || token,
            clientName: invoice.clientName,
            clientNit: invoice.clientNit,
            clientAddress: invoice.clientAddress,
            clientCity: invoice.clientCity,
            clientPhone: invoice.clientPhone,
            subtotalAmount: invoice.subtotalAmount || 0,
            taxAmount: invoice.taxAmount || 0,
            discountAmount: invoice.discountAmount || 0,
            totalAmount: invoice.totalAmount || 0,
            advanceAmount: invoice.advanceAmount || 0,
            finalAmount: invoice.finalAmount || invoice.totalAmount || 0,
            status: invoice.status,
            currency: invoice.currency || "USD",
            isElectronic: invoice.isElectronic,
            paymentUrl: invoice.paymentUrl,
            createdAt: invoice.createdAt.toISOString(),
            dueDate: invoice.dueDate ? invoice.dueDate.toISOString() : null,
            company: invoice.company
                ? {
                      name: invoice.company.name,
                      logoUrl: invoice.company.logoUrl,
                      nit: invoice.company.nit,
                      email: invoice.company.email,
                      phone: invoice.company.phone,
                  }
                : null,
            items: invoice.items.map((item) => ({
                id: item.id,
                title: item.title,
                description: item.description,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                totalAmount: item.totalAmount,
            })),
        };

        return <PaymentPortalClient invoice={serializedInvoice} payuConfig={payuConfig} />;
    } catch (error) {
        console.error("🔴 ERROR INVOICE PAGE:", error);
        return <div className="p-8 text-center text-slate-400">Error interno cargando el portal de pago. Por favor contacta a soporte.</div>;
    }
}
