/**
 * @deprecated Este archivo es código legado y será eliminado en v2.0.
 * Toda la lógica de dominio ha sido migrada a src/core/usecases/payment.usecases.ts
 * La instancia de paymentEventBus ahora está en src/infrastructure/event-bus.ts
 * No agregar nueva funcionalidad aquí.
 * 
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

import { gatewayRegistry } from "../infrastructure/gateway-registry";

export class PaymentService {
  /**
   * Derives active gateway capabilities based on environment presence.
   */
  public getAvailableGateways() {
    const available = gatewayRegistry.getAvailableProviders();
    const result: Record<string, { enabled: boolean; currency: string }> = {};
    for (const provider of available) {
      const currency = ["WOMPI", "BOLD", "PSE", "EPAYCO"].includes(provider) ? "COP" : "USD";
      result[provider.toLowerCase()] = { enabled: true, currency };
    }
    return result;
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

    let provider = params.preferredProvider || "TRANSFER";
    if (provider !== "TRANSFER") {
      try {
        const gateway = gatewayRegistry.get(provider);
        const session = await gateway.createSession(params, reference);
        return {
          url: session.url,
          reference,
          provider,
        };
      } catch (e) {
        console.warn(`[PaymentService Legacy] Could not create session for ${provider}:`, e);
      }
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
    const gateway = gatewayRegistry.get(payload.provider);
    
    let tx: any;
    if (typeof (gateway as any).createPOSTransaction === "function") {
       tx = (gateway as any).createPOSTransaction(payload);
    } else {
       tx = { id: "unknown", reference: "unknown", amount: payload.amount, currency: "COP", provider: payload.provider };
    }

    // Asynchronously notify subscribers via EventBus (Event-Driven Decoupling)
    (paymentEventBus as any).publish("payment.succeeded", {
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
    }).catch((err: any) => console.warn("[PaymentService] Event publish warning:", err.message));

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

    try {
      const gateway = gatewayRegistry.get(providerUpper);
      const result = gateway.verifyWebhook(rawPayload, signatureHeader || "");
      
      if (result.isValid && result.eventType === "PAYMENT_APPROVED") {
        await (paymentEventBus as any).publish("payment.succeeded", {
          reference: result.transactionId,
          amount: result.amount || 0,
          currency: result.currency || "USD",
          provider: providerUpper,
          timestamp: new Date().toISOString(),
        });
        return { acknowledged: true, eventDispatched: true, reference: result.transactionId };
      }
      return { acknowledged: true, eventDispatched: false };
    } catch (e) {
      console.error("[PaymentService Legacy] Webhook failed:", e);
      return { acknowledged: true, eventDispatched: false };
    }
  }
}

export const paymentService = new PaymentService();
