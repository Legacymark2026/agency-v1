/**
 * Wompi (Bancolombia) Payment Gateway Adapter
 * ─────────────────────────────────────────────────────────────────────────────
 * Generates official Wompi integrity signatures, builds payment links,
 * and validates asynchronous webhook notifications.
 */
import crypto from "crypto";

const WOMPI_PUBLIC_KEY = process.env.WOMPI_PUBLIC_KEY || "";
const WOMPI_INTEGRITY_SECRET = process.env.WOMPI_INTEGRITY_SECRET || "";

import { IPaymentGatewayStrategy } from "../core/ports/payment.ports";
import { CreateCheckoutSessionDTO } from "../core/ports/payment.ports";
import { PaymentStatus } from "../core/domain/payment.domain";
import { gatewayRegistry } from "../infrastructure/gateway-registry";

export class WompiGateway implements IPaymentGatewayStrategy {
  providerName: "WOMPI" = "WOMPI";

  isAvailable(): boolean {
    return Boolean(WOMPI_PUBLIC_KEY && WOMPI_INTEGRITY_SECRET);
  }

  async getTransactionStatus(externalId: string): Promise<PaymentStatus> {
    try {
      const pubKey = process.env.WOMPI_PUBLIC_KEY || "";
      const response = await fetch(`https://production.wompi.co/v1/transactions/${externalId}`, {
        headers: { Authorization: `Bearer ${pubKey}` }
      });
      if (!response.ok) return "PENDING";
      const data = await response.json();
      const status = data?.data?.status;
      if (status === "APPROVED") return "APPROVED";
      if (status === "DECLINED" || status === "VOIDED" || status === "ERROR") return "DECLINED";
      return "PENDING";
    } catch {
      return "PENDING";
    }
  }

  async createSession(params: CreateCheckoutSessionDTO, txReference: string): Promise<{ url: string; externalId?: string }> {
    const amountInCents = Math.round(params.amount * 100);
    const signature = this.computeIntegritySignature(txReference, amountInCents, "COP");
    const publicKey = WOMPI_PUBLIC_KEY;
    const url = `https://checkout.wompi.co/p/?public-key=${publicKey}&currency=COP&amount-in-cents=${amountInCents}&reference=${txReference}&signature:integrity=${signature}`;
    
    return { url };
  }

  verifyWebhook(payload: any, signature: string): { isValid: boolean; eventType: "PAYMENT_APPROVED" | "PAYMENT_DECLINED" | "UNKNOWN"; transactionId: string; amount?: number; currency?: string } {
    const eventsSecret = process.env.WOMPI_EVENTS_SECRET || WOMPI_INTEGRITY_SECRET;
    
    if (payload?.signature && payload?.timestamp && eventsSecret) {
      const { transaction } = payload.data;
      const raw = `${transaction.id}${transaction.status}${transaction.amount_in_cents}${payload.timestamp}${eventsSecret}`;
      const calculated = crypto.createHash("sha256").update(raw).digest("hex");

      const isValid = crypto.timingSafeEqual(
        Buffer.from(calculated, "hex"),
        Buffer.from(payload.signature.checksum, "hex")
      );

      if (!isValid) {
        return { isValid: false, eventType: "UNKNOWN", transactionId: "" };
      }
    }

    const event = payload?.data?.transaction;
    if (event && payload?.event === "transaction.updated") {
      const isApproved = event.status === "APPROVED";
      return {
        isValid: true,
        eventType: isApproved ? "PAYMENT_APPROVED" : "PAYMENT_DECLINED",
        transactionId: event.id,
        amount: event.amount_in_cents / 100,
        currency: event.currency
      };
    }

    return { isValid: true, eventType: "UNKNOWN", transactionId: "" };
  }

  computeIntegritySignature(
    reference: string,
    amountInCents: number,
    currency = "COP",
    expirationTime?: string
  ): string {
    const raw = `${reference}${amountInCents}${currency}${expirationTime || ""}${WOMPI_INTEGRITY_SECRET}`;
    return crypto.createHash("sha256").update(raw).digest("hex");
  }
}

export const WompiAdapter = new WompiGateway();
gatewayRegistry.register(WompiAdapter);

