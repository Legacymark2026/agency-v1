/**
 * Webhook Builder Sandbox & HMAC Signer Service
 * ─────────────────────────────────────────────────────────────────────────────
 * Builds, signs (HMAC SHA256), tests, and dispatches custom webhook events
 * to external URLs (Make, Zapier, n8n, ERPs).
 */

import crypto from "crypto";

export interface WebhookDispatchOptions {
  targetUrl: string;
  secret: string;
  eventType: string;
  payload: Record<string, any>;
}

export interface WebhookDispatchResult {
  success: boolean;
  statusCode: number;
  signature: string;
  attemptDurationMs: number;
  responseBody?: string;
  error?: string;
}

export class WebhookSandboxService {
  /**
   * Generates HMAC SHA256 signature for webhook payload verification
   */
  public generateSignature(payloadString: string, secret: string): string {
    return crypto.createHmac("sha256", secret).update(payloadString).digest("hex");
  }

  /**
   * Dispatches signed webhook with signature header
   */
  public async dispatchWebhook(options: WebhookDispatchOptions): Promise<WebhookDispatchResult> {
    const startTime = Date.now();
    const payloadString = JSON.stringify({
      event: options.eventType,
      timestamp: new Date().toISOString(),
      data: options.payload,
    });

    const signature = this.generateSignature(payloadString, options.secret);

    try {
      const response = await fetch(options.targetUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-legacymark-signature": signature,
          "x-legacymark-event": options.eventType,
          "User-Agent": "LegacyMark-Webhook/2.0",
        },
        body: payloadString,
      });

      const text = await response.text();
      const attemptDurationMs = Date.now() - startTime;

      return {
        success: response.ok,
        statusCode: response.status,
        signature,
        attemptDurationMs,
        responseBody: text.slice(0, 500),
      };
    } catch (err: any) {
      return {
        success: false,
        statusCode: 500,
        signature,
        attemptDurationMs: Date.now() - startTime,
        error: err instanceof Error ? err.message : String(err),
      };
    }
  }
}

export const webhookSandbox = new WebhookSandboxService();
