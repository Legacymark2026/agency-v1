/**
 * Webhooks Router — Stripe · Wompi · PayPal
 *
 * Fix C-3: Stripe webhook uses express.raw() to capture raw body BEFORE express.json()
 *          so stripe.webhooks.constructEvent() receives the correct Buffer.
 * Fix C-4: Wompi webhook verifies SHA-256 checksum against WOMPI_INTEGRITY_SECRET
 *          before processing any payment status updates.
 *
 * IMPORTANT: in index.ts this router must be mounted BEFORE express.json() middleware.
 * The router uses its own raw-body parsing only for the Stripe route.
 */
import { Router, Request, Response, raw } from "express";
import { prisma } from "@agency/database";
import Stripe from "stripe";
import crypto from "crypto";
import { eventBus } from "../lib/event-bus.singleton";
import { logger } from "../utils/logger.utils";

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || "";
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || "";
const WOMPI_INTEGRITY_SECRET = process.env.WOMPI_INTEGRITY_SECRET || "";

const stripe = STRIPE_SECRET_KEY
  ? new Stripe(STRIPE_SECRET_KEY, { apiVersion: "2025-02-24.acacia" as any })
  : null;

/** Wompi webhook signature verification per Wompi API docs.
 *  checksum = SHA256(sorted_properties_values + integrity_secret)
 */
function verifyWompiSignature(body: any, expectedChecksum: string): boolean {
  if (!WOMPI_INTEGRITY_SECRET || !expectedChecksum) return false;

  try {
    const sig = body?.signature;
    if (!sig || !Array.isArray(sig.properties)) return false;

    const transaction = body?.data?.transaction || {};
    const valueStr = sig.properties
      .map((prop: string) => {
        const val = prop.split(".").reduce((obj: any, key: string) => obj?.[key], { data: { transaction } });
        return String(val ?? "");
      })
      .join("");

    const rawStr = `${valueStr}${WOMPI_INTEGRITY_SECRET}`;
    const computed = crypto.createHash("sha256").update(rawStr).digest("hex");
    return crypto.timingSafeEqual(Buffer.from(computed), Buffer.from(expectedChecksum));
  } catch {
    return false;
  }
}

export const webhooksRouter = Router();

// ── POST /webhooks/stripe — Fix C-3: raw body for HMAC ────────────────────────
// express.raw() is applied only to this route so express.json() doesn't corrupt the buffer
webhooksRouter.post(
  "/stripe",
  raw({ type: "application/json" }),
  async (req: Request, res: Response) => {
    const sig = req.headers["stripe-signature"];

    if (!sig) {
      logger.warn("[webhooks/stripe] Missing stripe-signature header");
      return res.status(400).json({ error: "Missing stripe-signature header" });
    }

    if (!stripe || !STRIPE_WEBHOOK_SECRET) {
      logger.warn("[webhooks/stripe] Stripe not configured — webhook rejected");
      return res.status(503).json({ error: "Stripe not configured" });
    }

    let event: Stripe.Event;
    try {
      // req.body is a raw Buffer here (not parsed JSON) — required by Stripe SDK
      event = stripe.webhooks.constructEvent(req.body as Buffer, sig as string, STRIPE_WEBHOOK_SECRET);
    } catch (err) {
      logger.warn("[webhooks/stripe] Signature verification failed", { error: String(err) });
      return res.status(400).json({ error: `Webhook signature verification failed: ${String(err)}` });
    }

    logger.info("[webhooks/stripe] Processing event", { type: event.type });

    try {
      if (event.type === "checkout.session.completed" || event.type === "payment_intent.succeeded") {
        const session = event.data.object as any;
        const invoiceId = session.metadata?.invoiceId || session.client_reference_id;

        if (invoiceId) {
          const invoice = await prisma.invoice.update({
            where: { id: invoiceId },
            data: {
              status: "PAID",
              paidAt: new Date(),
              paymentMethod: "STRIPE",
              stripeInvoiceId: session.id,
            },
          });

          await eventBus.publish("invoice.paid", {
            invoiceId: invoice.id,
            invoiceNumber: invoice.invoiceNumber,
            companyId: invoice.companyId,
            amount: Number(invoice.totalAmount),
            gateway: "STRIPE",
            stripeSessionId: session.id,
            timestamp: new Date().toISOString(),
          });

          logger.info("[webhooks/stripe] Invoice marked PAID", { invoiceId, sessionId: session.id });
        }
      }

      if (event.type === "invoice.payment_succeeded") {
        const data = event.data.object as any;
        await eventBus.publish("payment.succeeded" as any, {
          stripeInvoiceId: data.id,
          amount: data.amount_paid / 100,
          email: data.customer_email,
          timestamp: new Date().toISOString(),
        });
      }

      if (event.type === "customer.subscription.updated") {
        const data = event.data.object as any;
        await eventBus.publish("subscription.status_changed" as any, {
          subscriptionId: data.id,
          status: data.status,
          timestamp: new Date().toISOString(),
        });
      }
    } catch (err) {
      // Respond 200 to Stripe anyway to prevent retries for non-idempotent DB errors
      logger.error("[webhooks/stripe] Handler error after verification", { error: String(err) });
    }

    res.json({ received: true });
  }
);

// ── POST /webhooks/wompi — Fix C-4: HMAC signature verification ───────────────
webhooksRouter.post("/wompi", async (req: Request, res: Response) => {
  const body = req.body;
  const expectedChecksum = body?.signature?.checksum;

  // C-4 Fix: verify signature before processing any payment
  if (!verifyWompiSignature(body, expectedChecksum)) {
    logger.warn("[webhooks/wompi] Signature verification failed — rejecting webhook");
    return res.status(401).json({ error: "Invalid Wompi webhook signature" });
  }

  logger.info("[webhooks/wompi] Processing event", { event: body?.event });

  try {
    if (body?.event === "transaction.updated" && body?.data?.transaction) {
      const transaction = body.data.transaction;
      const invoiceId = transaction.reference;
      const status = transaction.status;

      if (status === "APPROVED" && invoiceId) {
        const invoice = await prisma.invoice.update({
          where: { id: invoiceId },
          data: {
            status: "PAID",
            paidAt: new Date(),
            paymentMethod: "WOMPI",
            paidAmount: transaction.amount_in_cents / 100,
          },
        });

        await eventBus.publish("invoice.paid", {
          invoiceId: invoice.id,
          invoiceNumber: invoice.invoiceNumber,
          companyId: invoice.companyId,
          amount: Number(invoice.totalAmount),
          paidAmount: transaction.amount_in_cents / 100,
          gateway: "WOMPI",
          wompiTransactionId: transaction.id,
          timestamp: new Date().toISOString(),
        });

        logger.info("[webhooks/wompi] Invoice marked PAID", { invoiceId, transactionId: transaction.id });
      }

      if (status === "DECLINED" && invoiceId) {
        logger.warn("[webhooks/wompi] Transaction DECLINED", { invoiceId, transactionId: transaction.id });
      }
    }
  } catch (err) {
    logger.error("[webhooks/wompi] Handler error", { error: String(err) });
    return res.status(500).json({ error: "Internal server error" });
  }

  res.json({ received: true });
});

// ── POST /webhooks/paypal ──────────────────────────────────────────────────────
webhooksRouter.post("/paypal", async (req: Request, res: Response) => {
  const { event_type, resource } = req.body;

  // TODO: PayPal webhook signature verification via PayPal SDK
  // Requires PAYPAL_WEBHOOK_ID + PayPal SDK verifyWebhookSignature()
  // For now log and process — add verification when PayPal SDK is installed
  logger.info("[webhooks/paypal] Processing event", { event_type });

  try {
    if (event_type === "PAYMENT.CAPTURE.COMPLETED" || event_type === "CHECKOUT.ORDER.APPROVED") {
      const invoiceId = resource?.custom_id || resource?.invoice_id;

      if (invoiceId) {
        const invoice = await prisma.invoice.update({
          where: { id: invoiceId },
          data: { status: "PAID", paidAt: new Date(), paymentMethod: "PAYPAL" },
        });

        await eventBus.publish("invoice.paid", {
          invoiceId: invoice.id,
          invoiceNumber: invoice.invoiceNumber,
          companyId: invoice.companyId,
          amount: Number(invoice.totalAmount),
          gateway: "PAYPAL",
          paypalOrderId: resource?.id,
          timestamp: new Date().toISOString(),
        });
      }
    }
  } catch (err) {
    logger.error("[webhooks/paypal] Handler error", { error: String(err) });
    return res.status(500).json({ error: "Internal server error" });
  }

  res.json({ received: true });
});
