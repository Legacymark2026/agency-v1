import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getStripeInstance, getStripeWebhookSecret } from "@/lib/stripe";

export async function POST(req: Request) {
  const body = await req.text();
  const headersList = await headers();
  const signature = headersList.get("Stripe-Signature") as string;

  let event: Stripe.Event;

  try {
    // 1. Extraer companyId del JSON raw SIN verificar (para saber de qué empresa es la llave)
    const rawParsed = JSON.parse(body);
    const companyId = rawParsed?.data?.object?.metadata?.companyId;

    if (!companyId) {
      console.error("❌ Webhook Error: No companyId in metadata", rawParsed?.data?.object?.metadata);
      return new NextResponse("Webhook Error: Metadata companyId missing", { status: 400 });
    }

    // 2. Traer el Stripe y Secret correcto de la Base de Datos
    const stripe = await getStripeInstance(companyId);
    const webhookSecret = await getStripeWebhookSecret(companyId);

    if (!webhookSecret) {
      return new NextResponse("Webhook Error: Secret not configured for this company", { status: 400 });
    }

    // 3. Verificar la firma criptográfica con la llave específica
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      webhookSecret
    );
  } catch (error: any) {
    console.error(`❌ Webhook Signature Verification Error: ${error.message}`);
    return new NextResponse(`Webhook Error: ${error.message}`, { status: 400 });
  }

  const session = event.data.object as Stripe.Checkout.Session;

  if (event.type === "checkout.session.completed") {
    const invoiceId = session.metadata?.invoiceId;

    if (invoiceId) {
      // Marcar Factura como Pagada
      await prisma.invoice.update({
        where: { id: invoiceId },
        data: {
          status: "PAID",
          stripeInvoiceId: session.payment_intent as string,
        },
      });

      console.log(`✅ Factura ${invoiceId} marcada como pagada (SaaS Multi-Tenant Mode).`);
    }
  }

  return new NextResponse(null, { status: 200 });
}
