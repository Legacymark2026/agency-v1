/**
 * app/api/webhooks/stripe/route.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Webhook de Stripe para autorizar Pagos y Actualizar Tiers de Agencias.
 *
 * EVENTOS MANEJADOS:
 *  - checkout.session.completed      → Upgrade de plan tras pago inicial
 *  - customer.subscription.updated   → Cambio de plan / ciclo desde el portal
 *  - customer.subscription.deleted   → Cancelación → downgrade a free
 *  - invoice.payment_failed          → Marca cuenta como past_due
 *  - invoice.paid                    → Reactiva cuenta tras pago fallido / renovación
 *
 * IDEMPOTENCIA:
 *  Usa Redis (Upstash) para marcar eventos ya procesados (TTL 24h).
 *  Si Redis no está disponible, procesa normalmente (fail-open).
 */

import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import type Stripe from "stripe";

// ── Idempotencia via Upstash Redis ────────────────────────────────────────────

async function markEventProcessed(eventId: string): Promise<boolean> {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) return false; // Sin Redis: permitir siempre

  try {
    const key = `stripe:event:${eventId}`;
    const res = await fetch(`${url}/pipeline`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      // SET NX: solo lo setea si NO existe. EXPIRE: 24h TTL.
      body: JSON.stringify([
        ["SET", key, "1", "NX", "EX", "86400"],
      ]),
    });

    if (!res.ok) throw new Error(`Upstash HTTP error: ${res.status}`);
    const data = await res.json() as [{ result: string | null }];
    // Si result es null → la clave ya existía → evento duplicado
    return data[0].result !== null;
  } catch (err) {
    logger.warn("[Stripe Webhook] Idempotency check failed — processing anyway", {
      eventId,
      error: err instanceof Error ? err.message : String(err),
    });
    return true; // fail-open
  }
}

// ── Helper: extraer tier legible desde metadata o price ───────────────────────

function resolveTierName(subscription: Stripe.Subscription): string {
  // 1. Intentar desde metadata del subscription
  if (subscription.metadata?.tierName) return subscription.metadata.tierName.toLowerCase();

  // 2. Intentar desde metadata del primer item price
  const priceId = subscription.items.data[0]?.price?.id || "";
  const proPrices = [
    process.env.STRIPE_PRICE_PRO_MONTHLY,
    process.env.STRIPE_PRICE_PRO_YEARLY,
  ].filter(Boolean);
  const agencyPrices = [
    process.env.STRIPE_PRICE_AGENCY_MONTHLY,
    process.env.STRIPE_PRICE_AGENCY_YEARLY,
  ].filter(Boolean);

  if (agencyPrices.includes(priceId)) return "agency";
  if (proPrices.includes(priceId)) return "pro";

  return "pro"; // fallback seguro
}

// ── Handler principal ─────────────────────────────────────────────────────────

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
    logger.error("[Stripe Webhook] Signature verification failed", { error: err.message });
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  // ── Idempotency check ─────────────────────────────────────────────────────
  const shouldProcess = await markEventProcessed(event.id);
  if (!shouldProcess) {
    logger.info("[Stripe Webhook] Duplicate event ignored", { eventId: event.id, type: event.type });
    return NextResponse.json({ received: true, duplicate: true });
  }

  // ── Despachador de Eventos ────────────────────────────────────────────────
  try {
    switch (event.type) {

      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode === "subscription" && session.client_reference_id) {
          const companyId = session.client_reference_id;
          const tierName = session.metadata?.tierName || "pro";
          const subId = session.subscription as string;

          // ── DB-Level Idempotency check for fail-open scenarios ──
          const company = await prisma.company.findUnique({
            where: { id: companyId },
            select: { stripeSubscriptionId: true }
          });

          if (company?.stripeSubscriptionId === subId) {
            logger.info(`[Billing] Company ${companyId} already has subscription ${subId}. Ignoring duplicate checkout event.`);
            break;
          }

          await prisma.company.update({
            where: { id: companyId },
            data: {
              subscriptionStatus: "active",
              subscriptionTier: tierName.toLowerCase(),
              stripeSubscriptionId: subId,
            },
          });
          logger.info(`[Billing] 🟢 Company ${companyId} upgraded to ${tierName} via checkout`);
        }
        break;
      }

      // ── Cambio de plan o ciclo desde el portal de Stripe ─────────────────
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const tierName = resolveTierName(subscription);
        const status = subscription.status === "active" ? "active" : subscription.status;

        const updated = await prisma.company.updateMany({
          where: { stripeSubscriptionId: subscription.id },
          data: {
            subscriptionTier: tierName,
            subscriptionStatus: status,
          },
        });

        if (updated.count === 0) {
          // Fallback: buscar por customerId
          const company = await prisma.company.findFirst({
            where: { stripeCustomerId: subscription.customer as string },
          });
          if (company) {
            await prisma.company.update({
              where: { id: company.id },
              data: {
                subscriptionTier: tierName,
                subscriptionStatus: status,
                stripeSubscriptionId: subscription.id,
              },
            });
          }
        }

        logger.info(`[Billing] 🔄 Subscription ${subscription.id} updated → tier: ${tierName}, status: ${status}`);
        break;
      }

      // ── Cancelación / expiración ──────────────────────────────────────────
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        await prisma.company.updateMany({
          where: { stripeSubscriptionId: subscription.id },
          data: {
            subscriptionStatus: "canceled",
            subscriptionTier: "free",
          },
        });
        logger.info(`[Billing] 🔴 Subscription ${subscription.id} canceled → downgraded to free`);
        break;
      }

      // ── Pago fallido → past_due ───────────────────────────────────────────
      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const subId = (invoice as any).subscription ?? (invoice as any).subscription_details?.subscription;
        if (subId) {
          await prisma.company.updateMany({
            where: { stripeSubscriptionId: subId as string },
            data: { subscriptionStatus: "past_due" },
          });
          logger.warn(`[Billing] ⚠️ Invoice payment failed for subscription ${subId}`);
        }
        break;
      }

      // ── Generación de factura → inyectar uso (Metered Billing) ─────────────
      case "invoice.created": {
        const invoice = event.data.object as Stripe.Invoice;
        const subId = (invoice as any).subscription;
        if (subId && invoice.status === "draft") {
          const company = await prisma.company.findFirst({
            where: { stripeSubscriptionId: subId as string },
            select: { id: true }
          });
          
          if (company) {
            // Reportar uso acumulado a Stripe ANTES de que se cobre la factura
            const { reportUsageToStripe } = await import("@/lib/billing/usage");
            await reportUsageToStripe(company.id);
            logger.info(`[Billing] 📊 Usage reported for invoice ${invoice.id}`);
          }
        }
        break;
      }

      // ── Renovación automática pagada → reactivar ──────────────────────────
      case "invoice.paid": {
        const invoice = event.data.object as Stripe.Invoice;
        const subId = (invoice as any).subscription;
        // Solo actuar si era past_due (no interferir con checkout.session.completed)
        if (subId) {
          await prisma.company.updateMany({
            where: {
              stripeSubscriptionId: subId as string,
              subscriptionStatus: "past_due",
            },
            data: { subscriptionStatus: "active" },
          });
          logger.info(`[Billing] ✅ Invoice paid — subscription ${subId} reactivated`);
        }
        break;
      }

      default:
        logger.info(`[Stripe Webhook] Unhandled event type: ${event.type}`);
    }
  } catch (error) {
    logger.error("[Stripe Webhook] DB update failed", {
      eventId: event.id,
      type: event.type,
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: "Failed to update database" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
