/**
 * Stripe Payment Adapter
 * ─────────────────────────────────────────────────────────────────────────────
 * Encapsulates Stripe SDK interactions: Session checkout, PaymentIntent,
 * and Webhook signature verification.
 */
import Stripe from "stripe";
import { CreateCheckoutSessionDTO } from "../types/payment.types";

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || "";
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || "";

export const stripeClient = STRIPE_SECRET_KEY
  ? new Stripe(STRIPE_SECRET_KEY, { apiVersion: "2025-02-24.acacia" as any })
  : null;

export class StripeAdapter {
  public static isAvailable(): boolean {
    return Boolean(STRIPE_SECRET_KEY && stripeClient);
  }

  public static async createCheckoutSession(params: CreateCheckoutSessionDTO): Promise<{
    sessionId: string;
    url: string;
  }> {
    if (!stripeClient) {
      throw new Error("Stripe secret key not configured.");
    }

    const isCop = (params.currency || "USD").toUpperCase() === "COP";
    const currency = isCop ? "cop" : (params.currency || "usd").toLowerCase();
    const unitAmount = isCop ? Math.round(params.amount) : Math.round(params.amount * 100);

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://legacymarksas.com";
    const successUrl = params.successUrl || `${baseUrl}/invoice/${params.invoiceId}?payment_success=true`;
    const cancelUrl = params.cancelUrl || `${baseUrl}/invoice/${params.invoiceId}?payment_canceled=true`;

    const session = await stripeClient.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency,
            product_data: {
              name: params.title || "Pago de Servicio — LegacyMark",
              metadata: {
                companyId: params.companyId,
                invoiceId: params.invoiceId || "",
                orderId: params.orderId || "",
              },
            },
            unit_amount: unitAmount,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      customer_email: params.customerEmail,
      client_reference_id: params.invoiceId || params.orderId,
      metadata: {
        companyId: params.companyId,
        invoiceId: params.invoiceId || "",
        orderId: params.orderId || "",
        category: params.category || "INVOICE",
      },
      success_url: successUrl,
      cancel_url: cancelUrl,
    });

    return {
      sessionId: session.id,
      url: session.url || "",
    };
  }

  public static verifyWebhookSignature(payload: Buffer | string, signature: string): Stripe.Event {
    if (!stripeClient || !STRIPE_WEBHOOK_SECRET) {
      throw new Error("Stripe webhook credentials missing");
    }
    return stripeClient.webhooks.constructEvent(payload, signature, STRIPE_WEBHOOK_SECRET);
  }
}
