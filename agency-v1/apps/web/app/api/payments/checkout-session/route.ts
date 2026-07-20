import { NextRequest, NextResponse } from "next/server";
import { getStripeSession } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { invoiceId, amount, currency = "USD", title, customerEmail } = body;

        if (!invoiceId || !amount) {
            return NextResponse.json({ error: "invoiceId and amount required" }, { status: 400 });
        }

        const invoice = await prisma.invoice.findUnique({
            where: { id: invoiceId },
            select: { id: true, companyId: true, token: true, clientName: true }
        });

        if (!invoice) {
            return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
        }

        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://legacymarksas.com";
        const successUrl = `${baseUrl}/es/invoice/${invoice.token || invoice.id}?success=true`;
        const cancelUrl = `${baseUrl}/es/invoice/${invoice.token || invoice.id}?canceled=true`;

        const session = await getStripeSession(
            invoice.companyId,
            parseFloat(amount),
            currency.toUpperCase(),
            title || `Factura a ${invoice.clientName}`,
            { invoiceId: invoice.id, companyId: invoice.companyId },
            successUrl,
            cancelUrl
        );

        if (!session || !session.url) {
            return NextResponse.json({ error: "Could not create Stripe checkout session" }, { status: 500 });
        }

        // Update paymentUrl on invoice
        await prisma.invoice.update({
            where: { id: invoice.id },
            data: { paymentUrl: session.url, stripeInvoiceId: session.id }
        });

        return NextResponse.json({ success: true, url: session.url });

    } catch (error: any) {
        console.error("🔴 Error in checkout-session route:", error);
        return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
    }
}
