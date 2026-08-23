/**
 * Automated Bounce Ingestion & RFC 8058 One-Click Unsubscribe Handler
 * ─────────────────────────────────────────────────────────────────────────────
 * Processes webhooks for Hard/Soft Bounces, Spam Complaints, and generates
 * compliant RFC 8058 List-Unsubscribe headers mandatory for Gmail & Yahoo inboxing.
 * Includes High-Throughput Batch Ingestion for processing >10,000 events.
 */

export type BounceType = "HARD_BOUNCE" | "SOFT_BOUNCE" | "SPAM_COMPLAINT" | "UNSUBSCRIBE_CLICK" | "DELIVERY_SUCCESS";

export interface ProviderWebhookEvent {
  eventId: string;
  email: string;
  eventType: BounceType;
  provider: "RESEND" | "AWS_SES" | "SENDGRID" | "GENERIC";
  timestamp: string;
  reason?: string;
}

export interface SuppressionEntry {
  email: string;
  reason: BounceType;
  addedAt: string;
  isActive: boolean;
}

export interface BatchIngestionResult {
  totalProcessed: number;
  suppressedCount: number;
  deliveredCount: number;
  durationMs: number;
}

export class BounceUnsubHandlerService {
  private suppressionList = new Map<string, SuppressionEntry>();

  /**
   * Generates RFC 8058 compliant email headers for One-Click Unsubscribe.
   */
  public generateRFC8058Headers(recipientEmail: string, campaignId: string): Record<string, string> {
    const unsubUrl = `https://legacymarksas.com/api/v1/marketing-service/unsubscribe?email=${encodeURIComponent(recipientEmail)}&cid=${campaignId}`;
    const mailto = `mailto:unsubscribe@legacymarksas.com?subject=unsubscribe-${campaignId}`;

    return {
      "List-Unsubscribe": `<${unsubUrl}>, <${mailto}>`,
      "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
    };
  }

  /**
   * Processes a single incoming bounce or complaint webhook.
   */
  public processWebhookEvent(event: ProviderWebhookEvent): { suppressed: boolean; message: string } {
    if (event.eventType === "HARD_BOUNCE" || event.eventType === "SPAM_COMPLAINT" || event.eventType === "UNSUBSCRIBE_CLICK") {
      this.suppressionList.set(event.email.toLowerCase(), {
        email: event.email.toLowerCase(),
        reason: event.eventType,
        addedAt: new Date().toISOString(),
        isActive: true,
      });

      return {
        suppressed: true,
        message: `Email ${event.email} agregado a la lista de supresión permanente (${event.eventType}).`,
      };
    }

    return {
      suppressed: false,
      message: `Evento ${event.eventType} registrado sin supresión inmediata.`,
    };
  }

  /**
   * High-Throughput Batch Ingestion for marketing webhooks
   * Processes bulk arrays of events in memory with deduplication.
   */
  public processBatchEvents(events: ProviderWebhookEvent[]): BatchIngestionResult {
    const startTime = Date.now();
    let suppressedCount = 0;
    let deliveredCount = 0;

    for (const event of events) {
      if (event.eventType === "HARD_BOUNCE" || event.eventType === "SPAM_COMPLAINT" || event.eventType === "UNSUBSCRIBE_CLICK") {
        this.suppressionList.set(event.email.toLowerCase(), {
          email: event.email.toLowerCase(),
          reason: event.eventType,
          addedAt: event.timestamp || new Date().toISOString(),
          isActive: true,
        });
        suppressedCount++;
      } else if (event.eventType === "DELIVERY_SUCCESS") {
        deliveredCount++;
      }
    }

    return {
      totalProcessed: events.length,
      suppressedCount,
      deliveredCount,
      durationMs: Date.now() - startTime,
    };
  }

  /**
   * Checks if an email is suppressed before dispatching.
   */
  public isEmailSuppressed(email: string): boolean {
    return this.suppressionList.has(email.toLowerCase());
  }

  public getSuppressedCount(): number {
    return this.suppressionList.size;
  }
}

export const bounceUnsubHandler = new BounceUnsubHandlerService();
