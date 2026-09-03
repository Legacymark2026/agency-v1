/**
 * Payment Service Core Domain Logic
 * ─────────────────────────────────────────────────────────────────────────────
 * Decoupled orchestration for all payment providers.
 * Emits events to Redis EventBus for asynchronous decoupling from finance-service and pos-service.
 */
import { prisma } from "@agency/database";
import { EventBus } from "@agency/events";
import {
  CreateCheckoutSessionDTO,
  CreatePOSPaymentDTO,
  UnifiedPaymentTransaction,
} from "../types/payment.types";
import { StripeAdapter } from "../adapters/stripe.adapter";
import { WompiAdapter } from "../adapters/wompi.adapter";
import { PayPalAdapter } from "../adapters/paypal.adapter";
import { BoldPosAdapter } from "../adapters/bold.adapter";

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";
export const paymentEventBus = new EventBus(REDIS_URL, "payment-service");

export class PaymentService {
  /**
   * Derives active gateway capabilities based on environment presence.
   */
  public getAvailableGateways() {
    return {
      stripe: { enabled: StripeAdapter.isAvailable(), currency: "USD" },
      wompi: { enabled: WompiAdapter.isAvailable(), currency: "COP" },
      paypal: { enabled: PayPalAdapter.isAvailable(), currency: "USD" },
      bold: { enabled: true, currency: "COP" },
    };
  }

  /**
   * Unified Checkout Session Creator (Web / Invoicing / Subscriptions)
   */
  public async createCheckoutSession(params: CreateCheckoutSessionDTO): Promise<{
    url: string;
    reference: string;
    provider: string;
  }> {
    const reference = `REF-PAY-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

    // If preferred provider is Stripe, or default to Stripe for USD
    const isUSD = (params.currency || "USD").toUpperCase() === "USD";
    if ((params.preferredProvider === "STRIPE" || isUSD) && StripeAdapter.isAvailable()) {
      const session = await StripeAdapter.createCheckoutSession(params);
      return {
        url: session.url,
        reference,
        provider: "STRIPE",
      };
    }

    // Wompi for COP
    if (params.currency === "COP" && WompiAdapter.isAvailable()) {
      const amountInCents = Math.round(params.amount * 100);
      const signature = WompiAdapter.computeIntegritySignature(reference, amountInCents, "COP");
      const publicKey = process.env.WOMPI_PUBLIC_KEY || "";
      const wompiUrl = `https://checkout.wompi.co/p/?public-key=${publicKey}&currency=COP&amount-in-cents=${amountInCents}&reference=${reference}&signature:integrity=${signature}`;

      return {
        url: wompiUrl,
        reference,
        provider: "WOMPI",
      };
    }

    // PayPal fallback for international
    if (params.preferredProvider === "PAYPAL" && PayPalAdapter.isAvailable()) {
      const order = await PayPalAdapter.createOrder(params.amount, params.currency, params.title);
      return {
        url: order.approvalUrl,
        reference: order.orderId,
        provider: "PAYPAL",
      };
    }

    // Simulation / Direct transfer fallback
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://legacymarksas.com";
    return {
      url: `${baseUrl}/invoice/${params.invoiceId || reference}?mock_payment=true`,
      reference,
      provider: "TRANSFER",
    };
  }

  /**
   * Process and register an in-store POS card/terminal transaction
   */
  public async processPOSPayment(payload: CreatePOSPaymentDTO): Promise<UnifiedPaymentTransaction> {
    const tx = BoldPosAdapter.createPOSTransaction(payload);

    // Asynchronously notify subscribers via EventBus (Event-Driven Decoupling)
    paymentEventBus.publish("payment.succeeded", {
      transactionId: tx.id,
      companyId: tx.companyId,
      orderId: tx.orderId,
      reference: tx.reference,
      amount: tx.amount,
      currency: tx.currency,
      provider: tx.provider,
      approvalCode: tx.approvalCode,
      rrn: tx.rrn,
      timestamp: tx.createdAt,
    }).catch((err) => console.warn("[PaymentService] Event publish warning:", err.message));

    return tx;
  }

  /**
   * Handles incoming webhooks from payment providers.
   * Decouples provider verification and emits normalized `payment.succeeded` event.
   */
  public async handleWebhook(
    provider: string,
    rawPayload: any,
    signatureHeader?: string
  ): Promise<{ acknowledged: boolean; eventDispatched: boolean; reference?: string }> {
    const providerUpper = provider.toUpperCase();

    if (providerUpper === "STRIPE") {
      let event: any = rawPayload;
      if (signatureHeader && StripeAdapter.isAvailable()) {
        event = StripeAdapter.verifyWebhookSignature(rawPayload, signatureHeader);
      }

      if (event.type === "checkout.session.completed") {
        const session = event.data.object;
        const invoiceId = session.metadata?.invoiceId || session.client_reference_id;
        const companyId = session.metadata?.companyId;

        // Publish normalized event
        await paymentEventBus.publish("payment.succeeded", {
          companyId,
          invoiceId,
          reference: session.id,
          amount: (session.amount_total || 0) / 100,
          currency: (session.currency || "USD").toUpperCase(),
          provider: "STRIPE",
          timestamp: new Date().toISOString(),
        });

        return { acknowledged: true, eventDispatched: true, reference: session.id };
      }
    }

    if (providerUpper === "WOMPI") {
      const data = rawPayload.data?.transaction;
      if (data && data.status === "APPROVED") {
        await paymentEventBus.publish("payment.succeeded", {
          reference: data.reference,
          amount: (data.amount_in_cents || 0) / 100,
          currency: data.currency || "COP",
          provider: "WOMPI",
          timestamp: new Date().toISOString(),
        });

        return { acknowledged: true, eventDispatched: true, reference: data.reference };
      }
    }

    return { acknowledged: true, eventDispatched: false };
  }
}

export const paymentService = new PaymentService();
