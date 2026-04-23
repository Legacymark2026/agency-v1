/**
 * app/api/webhooks/stripe/route.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Webhook de Stripe para autorizar Pagos y Actualizar Tiers de Agencias.
 */

import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import type Stripe from "stripe";

export async function POST(req: Request) {
  const payload = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "No signature" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    const secret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!secret) throw new Error("Stripe webhook secret is missing.");
    event = stripe.webhooks.constructEvent(payload, signature, secret);
  } catch (err: any) {
    console.error("[Stripe Webhook Error]", err.message);
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  // Despachador de Eventos Core
  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode === "subscription" && session.client_reference_id) {
          const companyId = session.client_reference_id;
          const tierName = session.metadata?.tierName || "premium";
          
          await prisma.company.update({
             where: { id: companyId },
             data: {
                subscriptionStatus: "active",
                subscriptionTier: tierName,
                stripeSubscriptionId: session.subscription as string
             }
          });
          console.log(`[Billing] 🟢 Company ${companyId} upgraded to ${tierName}`);
        }
        break;
      }
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        await prisma.company.updateMany({
           where: { stripeSubscriptionId: subscription.id },
           data: {
              subscriptionStatus: "canceled",
              subscriptionTier: "free"
           }
        });
        console.log(`[Billing] 🔴 Subscription ${subscription.id} canceled. Account frozen to free tier.`);
        break;
      }
case "invoice.payment_failed": {
          const invoice = event.data.object as Stripe.Invoice;
          const subId = (invoice as any).subscription_details?.subscription ?? (invoice as any).subscription;
          if (subId) {
            await prisma.company.updateMany({
                where: { stripeSubscriptionId: subId as string },
                data: {
                   subscriptionStatus: "past_due"
                }
             });
          }
          break;
        }
      default:
        console.log(`[Stripe Webhook] Unhandled event type ${event.type}`);
    }
  } catch(error) {
      console.error("[Stripe Update DB Error]", error);
      return NextResponse.json({ error: "Failed to update database" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
