import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPayuConfig, validatePayuConfirmationSignature } from "@/lib/payu";

export async function POST(req: Request) {
    try {
        // PayU sends confirmation via application/x-www-form-urlencoded
        const formData = await req.formData();
        
        const state_pol = formData.get("state_pol") as string;
        const reference_sale = formData.get("reference_sale") as string;
        const value = formData.get("value") as string;
        const currency = formData.get("currency") as string;
        const sign = formData.get("sign") as string;
        
        // Custom field we send to identify the invoice (could be token or ID)
        const extra1 = formData.get("extra1") as string; // We'll pass the invoice ID here

        const invoiceId = extra1 || reference_sale;
        
        // Find invoice to get companyId
        const invoice = await prisma.invoice.findUnique({
            where: { id: invoiceId }
        });

        if (!invoice) {
            console.error(`[PayU Webhook] Factura no encontrada: ${invoiceId}`);
            return new NextResponse("Invoice not found", { status: 404 });
        }

        const payuConfig = await getPayuConfig(invoice.companyId);

        if (!payuConfig) {
            console.error(`[PayU Webhook] PayU config not found for company ${invoice.companyId}`);
            return new NextResponse("Configuration error", { status: 400 });
        }

        if (!validatePayuConfirmationSignature(payuConfig, reference_sale, value, currency, state_pol, sign)) {
            console.error("[PayU Webhook] Invalid Signature");
            return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
        }

        // State 4 = APROBADO en PayU
        if (state_pol === "4") {
            // Mark invoice as paid
            await prisma.invoice.update({
                where: { id: invoice.id },
                data: { status: "PAID" }
            });
            console.log(`[PayU Webhook] Factura ${invoice.id} marcada como PAGADA.`);
        }

        // Always return 200 OK so PayU stops retrying
        return new NextResponse("OK", { status: 200 });

    } catch (error) {
        console.error("[PayU Webhook Error]", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
