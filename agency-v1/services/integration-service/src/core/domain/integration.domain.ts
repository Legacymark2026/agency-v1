/**
 * Integration Service — Pure Domain Entities
 */
import { createHmac } from "crypto";

export function signWebhookPayload(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("hex");
}

export function verifyWebhookSignature(payload: string, secret: string, signature: string): boolean {
  return signWebhookPayload(payload, secret) === signature;
}

export class IntegrationDomain {
  constructor(
    public readonly id: string,
    public readonly companyId: string,
    public readonly provider: string, // ZAPIER, MAKE, SLACK, SHOPIFY
    public readonly apiKey: string,
    public readonly webhookSecret: string,
    public readonly isEnabled: boolean = true,
    public readonly createdAt: Date = new Date()
  ) {}
}
