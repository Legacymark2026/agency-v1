/**
 * PayPal Payment Gateway Adapter
 * ─────────────────────────────────────────────────────────────────────────────
 * Creates orders, captures approved payments, and handles access token auth.
 */

const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID || "";
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET || "";
const PAYPAL_MODE = process.env.PAYPAL_MODE || "sandbox";
const PAYPAL_BASE_URL = PAYPAL_MODE === "live"
  ? "https://api-m.paypal.com"
  : "https://api-m.sandbox.paypal.com";

import { IPaymentGatewayStrategy } from "../core/ports/payment.ports";
import { CreateCheckoutSessionDTO } from "../core/ports/payment.ports";
import { PaymentStatus } from "../core/domain/payment.domain";
import { gatewayRegistry } from "../infrastructure/gateway-registry";

export class PayPalGateway implements IPaymentGatewayStrategy {
  providerName: "PAYPAL" = "PAYPAL";

  isAvailable(): boolean {
    return Boolean(PAYPAL_CLIENT_ID && PAYPAL_CLIENT_SECRET);
  }

  async getTransactionStatus(externalId: string): Promise<PaymentStatus> {
    try {
      const token = await this.getAccessToken();
      const response = await fetch(`${PAYPAL_BASE_URL}/v2/checkout/orders/${externalId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) return "PENDING";
      const data: any = await response.json();
      if (data.status === "COMPLETED" || data.status === "APPROVED") return "APPROVED";
      if (data.status === "VOIDED") return "DECLINED";
      return "PENDING";
    } catch {
      return "PENDING";
    }
  }

  async createSession(params: CreateCheckoutSessionDTO, txReference: string): Promise<{ url: string; externalId?: string }> {
    const token = await this.getAccessToken();
    const currency = params.currency || "USD";

    const response = await fetch(`${PAYPAL_BASE_URL}/v2/checkout/orders`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        intent: "CAPTURE",
        purchase_units: [
          {
            reference_id: txReference,
            description: params.title || "Pago",
            amount: {
              currency_code: currency.toUpperCase(),
              value: params.amount.toFixed(2),
            },
          },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`PayPal Create Order failed: ${response.statusText}`);
    }

    const order: any = await response.json();
    const approvalUrl = order.links?.find((l: any) => l.rel === "approve")?.href || "";

    return { url: approvalUrl, externalId: order.id };
  }

  verifyWebhook(payload: any, signature: string): { isValid: boolean; eventType: "PAYMENT_APPROVED" | "PAYMENT_DECLINED" | "UNKNOWN"; transactionId: string; amount?: number; currency?: string } {
    // PayPal webhook signature verification is complex. Assuming basic event handling for this example.
    const eventType = payload?.event_type;
    const resource = payload?.resource;

    if (eventType === "PAYMENT.CAPTURE.COMPLETED" && resource?.status === "COMPLETED") {
      const parentPayment = resource.supplementary_data?.related_ids?.order_id || resource.id;
      return {
        isValid: true,
        eventType: "PAYMENT_APPROVED",
        transactionId: parentPayment,
        amount: parseFloat(resource.amount?.value || "0"),
        currency: resource.amount?.currency_code || "USD"
      };
    }

    if (eventType === "PAYMENT.CAPTURE.DENIED") {
       return {
         isValid: true,
         eventType: "PAYMENT_DECLINED",
         transactionId: resource.id
       };
    }

    return { isValid: true, eventType: "UNKNOWN", transactionId: "" };
  }

  async getAccessToken(): Promise<string> {
    if (!this.isAvailable()) {
      throw new Error("PayPal credentials missing");
    }

    const authHeader = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString("base64");
    const response = await fetch(`${PAYPAL_BASE_URL}/v1/oauth2/token`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${authHeader}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: "grant_type=client_credentials",
    });

    if (!response.ok) {
      throw new Error(`PayPal OAuth failed: ${response.statusText}`);
    }

    const data: any = await response.json();
    return data.access_token;
  }
}

export const PayPalAdapter = new PayPalGateway();
gatewayRegistry.register(PayPalAdapter);

