/**
 * Payments Router
 * Fix A-1: extracts all /api/payments/* handlers from index.ts God Object
 * Fix C-2: protected by requireUserOrServiceAuth
 * Fix M-6: gateway availability derived from actual env var presence (not hardcoded true)
 */
import { Router, Request, Response } from "express";
import { z } from "zod";
import { prisma } from "@agency/database";
import { requireUserOrServiceAuth } from "@agency/service-auth";
import crypto from "crypto";
import Stripe from "stripe";
import { logger } from "../utils/logger.utils";

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || "";
const WOMPI_INTEGRITY_SECRET = process.env.WOMPI_INTEGRITY_SECRET || "";

const stripe = STRIPE_SECRET_KEY
  ? new Stripe(STRIPE_SECRET_KEY, { apiVersion: "2025-02-24.acacia" as any })
  : null;

// ── Validation Schemas ────────────────────────────────────────────────────────
const checkoutSchema = z.object({
  invoiceId: z.string().optional(),
  amount: z.number().positive().optional(),
  currency: z.string().default("USD"),
  customerEmail: z.string().email().optional(),
  title: z.string().default("Invoice Payment"),
  successUrl: z.string().url().optional(),
  cancelUrl: z.string().url().optional(),
  mode: z.enum(["payment", "subscription"]).default("payment"),
});

const intentSchema = z.object({
  amount: z.number().positive("amount required and must be positive"),
  currency: z.string().default("usd"),
  invoiceId: z.string().optional(),
});

const wompiSignatureSchema = z.object({
  reference: z.string().min(1, "reference required"),
  amountInCents: z.number().int().positive("amountInCents required"),
  currency: z.string().default("COP"),
  expirationTime: z.string().optional(),
});

export const paymentsRouter = Router();

paymentsRouter.use(requireUserOrServiceAuth);

// ── GET /payments/gateways — Fix M-6: real availability from env ───────────────
paymentsRouter.get("/gateways", async (_req, res: Response) => {
  // Availability is derived from actual env var presence, not hardcoded
  const stripeEnabled = Boolean(STRIPE_SECRET_KEY);
  const wompiEnabled = Boolean(process.env.WOMPI_PUBLIC_KEY && WOMPI_INTEGRITY_SECRET);
  const paypalEnabled = Boolean(process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET);
  const mercadopagoEnabled = Boolean(process.env.MERCADOPAGO_ACCESS_TOKEN);

  res.json({
    success: true,
    gateways: {
      stripe: {
        enabled: stripeEnabled,
        mode: STRIPE_SECRET_KEY.startsWith("sk_live") ? "live" : "test",
        currency: "USD",
      },
      wompi: {
        enabled: wompiEnabled,
        currency: "COP",
        publicKey: wompiEnabled ? process.env.WOMPI_PUBLIC_KEY : null,
      },
      paypal: {
        enabled: paypalEnabled,
        currency: "USD",
      },
      mercadopago: {
        enabled: mercadopagoEnabled,
        currency: "COP",
      },
    },
  });
});

// ── POST /payments/checkout-session ───────────────────────────────────────────
paymentsRouter.post("/checkout-session", async (req: Request, res: Response) => {
  try {
    const parsed = checkoutSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, error: "Invalid payload", details: parsed.error.errors });
    }

    const { invoiceId, amount, currency, customerEmail, title, successUrl, cancelUrl, mode } = parsed.data;

    let targetInvoice: any = null;
    if (invoiceId) {
      targetInvoice = await prisma.invoice.findUnique({ where: { id: invoiceId } });
      if (!targetInvoice) return res.status(404).json({ success: false, error: "Invoice not found" });
    }

    const payAmount = targetInvoice ? Number(targetInvoice.totalAmount) : amount;
    if (!payAmount || payAmount <= 0) {
      return res.status(400).json({ success: false, error: "Invalid amount for payment session" });
    }

    if (!stripe) {
      // Explicit error in production — no silent mock fallback
      if (process.env.NODE_ENV === "production") {
        return res.status(503).json({
          success: false,
          error: "Stripe is not configured. Set STRIPE_SECRET_KEY env var.",
        });
      }
      // Dev/staging: explicit mock response (not a real URL)
      const mockUrl = `https://dev-mock.legacymarksas.com/pay/${invoiceId || "direct"}?amount=${payAmount}&cur=${currency}&mock=true`;
      if (targetInvoice) {
        await prisma.invoice.update({ where: { id: targetInvoice.id }, data: { paymentUrl: mockUrl } });
      }
      return res.json({ success: true, url: mockUrl, mock: true, message: "Mock payment session (Stripe not configured)" });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: mode === "subscription" ? "subscription" : "payment",
      customer_email: customerEmail || undefined,
      line_items: [{
        price_data: {
          currency: currency.toLowerCase(),
          product_data: {
            name: title,
            description: targetInvoice ? `Invoice #${targetInvoice.invoiceNumber || targetInvoice.id}` : "Service Payment",
          },
          unit_amount: Math.round(payAmount * 100),
        },
        quantity: 1,
      }],
      success_url: successUrl || `${process.env.APP_URL || "https://legacymarksas.com"}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl || `${process.env.APP_URL || "https://legacymarksas.com"}/checkout/cancel`,
      metadata: {
        invoiceId: invoiceId || "",
        companyId: targetInvoice?.companyId || "",
      },
    });

    if (targetInvoice) {
      await prisma.invoice.update({
        where: { id: targetInvoice.id },
        data: { paymentUrl: session.url, stripeInvoiceId: session.id },
      });
    }

    res.json({ success: true, url: session.url, sessionId: session.id });
  } catch (err) {
    logger.error("[payments] POST /checkout-session failed", { error: String(err) });
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

// ── POST /payments/create-intent ───────────────────────────────────────────────
paymentsRouter.post("/create-intent", async (req: Request, res: Response) => {
  try {
    const parsed = intentSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, error: "Invalid payload", details: parsed.error.errors });
    }

    const { amount, currency, invoiceId } = parsed.data;

    if (!stripe) {
      if (process.env.NODE_ENV === "production") {
        return res.status(503).json({ success: false, error: "Stripe is not configured" });
      }
      return res.json({ success: true, clientSecret: `mock_secret_${Date.now()}`, mock: true });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency: currency.toLowerCase(),
      metadata: { invoiceId: invoiceId || "" },
    });

    res.json({ success: true, clientSecret: paymentIntent.client_secret, paymentIntentId: paymentIntent.id });
  } catch (err) {
    logger.error("[payments] POST /create-intent failed", { error: String(err) });
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

// ── POST /payments/wompi/signature ─────────────────────────────────────────────
paymentsRouter.post("/wompi/signature", async (req: Request, res: Response) => {
  try {
    const parsed = wompiSignatureSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, error: "Invalid payload", details: parsed.error.errors });
    }

    if (!WOMPI_INTEGRITY_SECRET) {
      return res.status(503).json({ success: false, error: "WOMPI_INTEGRITY_SECRET not configured" });
    }

    const { reference, amountInCents, currency, expirationTime } = parsed.data;
    const rawString = `${reference}${amountInCents}${currency}${expirationTime || ""}${WOMPI_INTEGRITY_SECRET}`;
    const signature = crypto.createHash("sha256").update(rawString).digest("hex");

    res.json({
      success: true,
      reference,
      amountInCents,
      currency,
      signature,
      publicKey: process.env.WOMPI_PUBLIC_KEY || null,
    });
  } catch (err) {
    logger.error("[payments] POST /wompi/signature failed", { error: String(err) });
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});
