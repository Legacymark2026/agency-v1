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
   * Verifies incoming webhook checksum from Wompi.
   */
  public static verifyWebhookChecksum(
    transactionData: { id: string; status: string; amount_in_cents: number },
    timestamp: number,
    receivedChecksum: string
  ): boolean {
    const raw = `${transactionData.id}${transactionData.status}${transactionData.amount_in_cents}${timestamp}${WOMPI_INTEGRITY_SECRET}`;
    const calculated = crypto.createHash("sha256").update(raw).digest("hex");
    return calculated === receivedChecksum;
  }
}
