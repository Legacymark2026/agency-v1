import { IPaymentGatewayStrategy } from "../core/ports/payment.ports";
import { CreateCheckoutSessionDTO } from "../core/ports/payment.ports";
import { PaymentProvider, PaymentStatus } from "../core/domain/payment.domain";
import crypto from "crypto";

export class MercadoPagoAdapter implements IPaymentGatewayStrategy {
  providerName: PaymentProvider = "MERCADOPAGO" as PaymentProvider;
  
  isAvailable(): boolean {
    return Boolean(process.env.MERCADOPAGO_ACCESS_TOKEN);
  }

  async createSession(params: CreateCheckoutSessionDTO, txReference: string) {
    if (!this.isAvailable()) throw new Error("MercadoPago not configured");
    
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://legacymarksas.com";
    const response = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}`,
      },
      body: JSON.stringify({
        items: [{
          title: params.title || "Pago LegacyMark",
          quantity: 1,
          unit_price: params.amount,
          currency_id: params.currency || "COP",
        }],
        payer: { email: params.customerEmail },
        external_reference: txReference,
        back_urls: {
          success: params.successUrl || `${baseUrl}/invoice/?payment_success=true`,
          failure: params.cancelUrl || `${baseUrl}/invoice/?payment_canceled=true`,
          pending: params.cancelUrl || `${baseUrl}/invoice/?payment_canceled=true`,
        },
        auto_return: "approved",
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`MP Error: ${err}`);
    }

    const data: any = await response.json();
    return { url: data.init_point, externalId: data.id };
  }

  verifyWebhook(payload: any, signature: string) {
    if (!signature) return { isValid: false, eventType: "UNKNOWN" as any, transactionId: "" };
    const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET;
    if (!secret) return { isValid: true, eventType: "PAYMENT_APPROVED" as any, transactionId: payload?.data?.id || "" };
    
    try {
      const parts = signature.split(",");
      const tsPart = parts.find((p) => p.startsWith("ts="));
      const v1Part = parts.find((p) => p.startsWith("v1="));
      if (!tsPart || !v1Part) return { isValid: false, eventType: "UNKNOWN" as any, transactionId: "" };
      
      const ts = tsPart.split("=")[1];
      const v1 = v1Part.split("=")[1];
      const manifest = `id:${payload?.data?.id};request-id:${payload?.id};ts:${ts};`;
      const hash = crypto.createHmac("sha256", secret).update(manifest).digest("hex");
      
      if (hash === v1) {
        return {
          isValid: true,
          eventType: (payload?.action === "payment.created" ? "PAYMENT_APPROVED" : "UNKNOWN") as any,
          transactionId: payload?.data?.id || "",
        };
      }
      return { isValid: false, eventType: "UNKNOWN" as any, transactionId: "" };
    } catch {
      return { isValid: false, eventType: "UNKNOWN" as any, transactionId: "" };
    }
  }

  async getTransactionStatus(externalId: string): Promise<PaymentStatus> {
    if (!this.isAvailable()) return "PENDING" as PaymentStatus;
    try {
      const res = await fetch(`https://api.mercadopago.com/v1/payments/${externalId}`, {
        headers: { "Authorization": `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}` },
      });
      if (!res.ok) return "PENDING" as PaymentStatus;
      const data: any = await res.json();
      if (data.status === "approved") return "APPROVED";
      if (data.status === "rejected") return "DECLINED";
      return "PENDING";
    } catch {
      return "PENDING";
    }
  }
}
