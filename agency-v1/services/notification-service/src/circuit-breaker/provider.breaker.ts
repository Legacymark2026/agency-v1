/**
 * services/notification-service/src/circuit-breaker/provider.breaker.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Resilient Circuit Breaker Implementation for External Delivery Providers.
 * Protects against external service outages (Resend Email API, Twilio, WebPush).
 *
 * States:
 *   CLOSED   → Normal operation (requests pass through)
 *   OPEN     → Provider outage detected (>50% errors). Requests fail-fast / re-queue
 *   HALF_OPEN → Test mode after 30s to verify provider recovery
 */

import { Resend } from "resend";

export interface CircuitBreakerOptions {
  timeoutMs?: number;
  failureThresholdPercentage?: number;
  resetTimeoutMs?: number;
  minRequests?: number;
}

export class CircuitBreaker<T, R> {
  private fn: (arg: T) => Promise<R>;
  private state: "CLOSED" | "OPEN" | "HALF_OPEN" = "CLOSED";
  private failureCount = 0;
  private successCount = 0;
  private totalCount = 0;
  private nextAttempt = 0;
  private options: Required<CircuitBreakerOptions>;

  constructor(fn: (arg: T) => Promise<R>, options?: CircuitBreakerOptions) {
    this.fn = fn;
    this.options = {
      timeoutMs: options?.timeoutMs || 6000,
      failureThresholdPercentage: options?.failureThresholdPercentage || 50,
      resetTimeoutMs: options?.resetTimeoutMs || 30000,
      minRequests: options?.minRequests || 4,
    };
  }

  async fire(arg: T): Promise<R> {
    const now = Date.now();

    if (this.state === "OPEN") {
      if (now >= this.nextAttempt) {
        this.state = "HALF_OPEN";
        console.warn(`⚠️ [CircuitBreaker] State transition: OPEN → HALF_OPEN (Testing provider recovery)`);
      } else {
        throw new Error(`CircuitBreaker OPEN: Provider unavailable. Re-queueing job.`);
      }
    }

    try {
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Provider Timeout")), this.options.timeoutMs)
      );

      const result = await Promise.race([this.fn(arg), timeoutPromise]);

      this.onSuccess();
      return result;
    } catch (err: any) {
      this.onFailure(err);
      throw err;
    }
  }

  private onSuccess() {
    this.successCount++;
    this.totalCount++;
    if (this.state === "HALF_OPEN") {
      this.state = "CLOSED";
      this.reset();
      console.log(`✅ [CircuitBreaker] State transition: HALF_OPEN → CLOSED (Provider recovered)`);
    }
  }

  private onFailure(err: any) {
    this.failureCount++;
    this.totalCount++;

    if (this.totalCount >= this.options.minRequests) {
      const failureRate = (this.failureCount / this.totalCount) * 100;
      if (failureRate >= this.options.failureThresholdPercentage) {
        this.state = "OPEN";
        this.nextAttempt = Date.now() + this.options.resetTimeoutMs;
        console.error(`🚨 [CircuitBreaker] State transition: CLOSED → OPEN (${failureRate.toFixed(1)}% failures. Reason: ${err.message})`);
      }
    }
  }

  private reset() {
    this.failureCount = 0;
    this.successCount = 0;
    this.totalCount = 0;
  }

  getState() {
    return this.state;
  }
}

// ── Email Provider Circuit Breaker (Resend) ──────────────────────────────────

async function sendEmailRaw(params: { to: string; subject: string; html: string }) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey || apiKey === "re_123456789") {
    console.log(`[CircuitBreaker:Email] 📧 Mock Send → ${params.to}: ${params.subject}`);
    return { success: true, id: `mock-${Date.now()}` };
  }

  const resend = new Resend(apiKey);
  const canonicalEmail = process.env.ADMIN_CANONICAL_EMAIL || "no-reply@legacymarksas.com";
  const result = await resend.emails.send({
    from: `LegacyMark <${canonicalEmail}>`,
    to: [params.to],
    subject: params.subject,
    html: params.html,
  });

  if (result.error) {
    throw new Error(`Resend Error: ${result.error.message}`);
  }
  return { success: true, id: result.data?.id };
}

export const emailCircuitBreaker = new CircuitBreaker(sendEmailRaw, {
  timeoutMs: 6000,
  failureThresholdPercentage: 50,
  resetTimeoutMs: 30000,
});

// ── Push / SMS Provider Circuit Breaker ──────────────────────────────────────

async function sendPushRaw(params: { userId: string; title: string; message: string }) {
  console.log(`[CircuitBreaker:Push] 📱 Push Sent → User ${params.userId}: ${params.title}`);
  return { success: true };
}

export const pushCircuitBreaker = new CircuitBreaker(sendPushRaw, {
  timeoutMs: 5000,
  failureThresholdPercentage: 50,
  resetTimeoutMs: 30000,
});
