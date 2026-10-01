/**
 * Wompi (Bancolombia) Payment Gateway Adapter
 * ─────────────────────────────────────────────────────────────────────────────
 * Generates official Wompi integrity signatures, builds payment links,
 * and validates asynchronous webhook notifications.
 */
import crypto from "crypto";

const WOMPI_PUBLIC_KEY = process.env.WOMPI_PUBLIC_KEY || "";
const WOMPI_INTEGRITY_SECRET = process.env.WOMPI_INTEGRITY_SECRET || "";

export class WompiAdapter {
  public static isAvailable(): boolean {
    return Boolean(WOMPI_PUBLIC_KEY && WOMPI_INTEGRITY_SECRET);
  }

  public static async getTransactionStatus(transactionId: string): Promise<string> {
    try {
      const pubKey = process.env.WOMPI_PUBLIC_KEY || "";
      const response = await fetch(`https://production.wompi.co/v1/transactions/${transactionId}`, {
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

  /**
   * Generates Wompi SHA-256 integrity signature.
   * Formula: SHA-256(reference + amountInCents + currency + integritySecret)
   */
  public static computeIntegritySignature(
    reference: string,
    amountInCents: number,
    currency = "COP",
    expirationTime?: string
  ): string {
    const raw = `${reference}${amountInCents}${currency}${expirationTime || ""}${WOMPI_INTEGRITY_SECRET}`;
    return crypto.createHash("sha256").update(raw).digest("hex");
  }

  /**
   * Verifies incoming Wompi webhook signature.
   * Reference: https://docs.wompi.co/docs/en/webhooks
   * Formula: SHA256(transaction.id + transaction.status + transaction.amount_in_cents + timestamp + eventsSecret)
   */
  public static verifyWebhookSignature(
    payload: {
      data: { transaction: { id: string; status: string; amount_in_cents: number } };
      timestamp: number;
      signature: { checksum: string };
    }
  ): boolean {
    const eventsSecret = process.env.WOMPI_EVENTS_SECRET || WOMPI_INTEGRITY_SECRET;
    if (!eventsSecret) {
      console.warn("[WompiAdapter] WOMPI_EVENTS_SECRET not configured — webhook validation skipped (insecure).");
      return true; // Degraded mode: allow but log warning
    }

    const { transaction } = payload.data;
    const raw = `${transaction.id}${transaction.status}${transaction.amount_in_cents}${payload.timestamp}${eventsSecret}`;
    const calculated = crypto.createHash("sha256").update(raw).digest("hex");

    const isValid = crypto.timingSafeEqual(
      Buffer.from(calculated, "hex"),
      Buffer.from(payload.signature.checksum, "hex")
    );

    if (!isValid) {
      console.error("[WompiAdapter] ❌ Webhook signature INVALID — potential spoofing attempt detected.");
    }

    return isValid;
  }
}
