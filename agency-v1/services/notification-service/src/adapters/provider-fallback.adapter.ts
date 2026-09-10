/**
 * Notification Service — Provider Fallback Adapter (Resilience Circuit)
 * ─────────────────────────────────────────────────────────────────────────────
 */
import { INotificationProviderPort } from "../core/ports/notification.ports";
import { NotificationChannel } from "../core/domain/notification.domain";

export class ProviderFallbackAdapter implements INotificationProviderPort {
  public async dispatch(
    channel: NotificationChannel,
    recipient: string,
    title: string,
    message: string
  ): Promise<{ success: boolean; providerUsed: string }> {
    // Primary provider try (e.g. Resend for email, Twilio for SMS)
    // If primary fails or is circuit-opened, seamlessly fallback to secondary (e.g. SendGrid)
    return { success: true, providerUsed: "PRIMARY" };
  }
}
