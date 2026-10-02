/**
 * Stripe Payment Adapter
 * ─────────────────────────────────────────────────────────────────────────────
 * Encapsulates Stripe SDK interactions: Session checkout, PaymentIntent,
 * and Webhook signature verification.
 */
import Stripe from "stripe";
import { IPaymentGatewayStrategy, CreateCheckoutSessionDTO } from "../core/ports/payment.ports";
import { PaymentStatus } from "../core/domain/payment.domain";
import { gatewayRegistry } from "../infrastructure/gateway-registry";

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || "";
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || "";

export const stripeClient = STRIPE_SECRET_KEY
  ? new Stripe(STRIPE_SECRET_KEY, { apiVersion: "2025-02-24.acacia" as any })
  : null;

export class StripeGateway implements IPaymentGatewayStrategy {
  providerName: "STRIPE" = "STRIPE";

  isAvailable(): boolean {
    return Boolean(STRIPE_SECRET_KEY && stripeClient);
  }

  async getTransactionStatus(externalId: string): Promise<PaymentStatus> {
    if (!stripeClient) throw new Error("Stripe not configured");
    const session = await stripeClient.checkout.sessions.retrieve(externalId);
    if (session.payment_status === "paid") return "APPROVED";
    if (session.payment_status === "unpaid" && session.status === "expired") return "DECLINED";
    return "PENDING";
  }

  async createSession(params: CreateCheckoutSessionDTO, txReference: string): Promise<{ url: string; externalId?: string }> {
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
      client_reference_id: txReference, // use txReference instead of invoiceId
      metadata: {
        companyId: params.companyId,
        invoiceId: params.invoiceId || "",
        orderId: params.orderId || "",
        reference: txReference
      },
      success_url: successUrl,
      cancel_url: cancelUrl,
    });

    return {
      url: session.url || "",
      externalId: session.id,
    };
  }

  verifyWebhook(payload: any, signature: string): { isValid: boolean; eventType: "PAYMENT_APPROVED" | "PAYMENT_DECLINED" | "UNKNOWN"; transactionId: string; amount?: number; currency?: string } {
    if (!stripeClient || !STRIPE_WEBHOOK_SECRET) {
      throw new Error("Stripe webhook credentials missing");
    }
    
    try {
      const event = stripeClient.webhooks.constructEvent(payload, signature, STRIPE_WEBHOOK_SECRET);
      
      if (event.type === "checkout.session.completed") {
        const session = event.data.object as any;
        const ref = session.client_reference_id || session.id;
        return {
          isValid: true,
          eventType: "PAYMENT_APPROVED",
          transactionId: session.id,
          amount: (session.amount_total || 0) / 100,
          currency: (session.currency || "usd").toUpperCase()
        };
      }
      
      return { isValid: true, eventType: "UNKNOWN", transactionId: "" };
    } catch (err) {
      return { isValid: false, eventType: "UNKNOWN", transactionId: "" };
    }
  }
}

export const StripeAdapter = new StripeGateway(); // For backwards compatibility
gatewayRegistry.register(StripeAdapter);

