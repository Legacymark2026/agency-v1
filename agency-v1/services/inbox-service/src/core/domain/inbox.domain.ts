/**
 * Inbox Service — Pure Domain Entities & Calculations
 * ─────────────────────────────────────────────────────────────────────────────
 * Zero external framework dependencies.
 */

export type SLAStatus = "OK" | "WARNING" | "CRITICAL" | "BREACHED";

export interface SLAConfigDomain {
  warningThresholdMinutes: number;
  criticalThresholdMinutes: number;
  breachThresholdMinutes: number;
}

export function evaluateSLAStatus(
  lastMessageAt: Date,
  config: SLAConfigDomain = { warningThresholdMinutes: 15, criticalThresholdMinutes: 30, breachThresholdMinutes: 60 }
): { status: SLAStatus; elapsedMinutes: number } {
  const now = new Date();
  const elapsedMs = Math.max(0, now.getTime() - new Date(lastMessageAt).getTime());
  const elapsedMinutes = Math.floor(elapsedMs / (1000 * 60));

  let status: SLAStatus = "OK";
  if (elapsedMinutes >= config.breachThresholdMinutes) {
    status = "BREACHED";
  } else if (elapsedMinutes >= config.criticalThresholdMinutes) {
    status = "CRITICAL";
  } else if (elapsedMinutes >= config.warningThresholdMinutes) {
    status = "WARNING";
  }

  return { status, elapsedMinutes };
}

export class ConversationDomain {
  constructor(
    public readonly id: string,
    public readonly companyId: string,
    public readonly channel: string,
    public readonly participantId: string,
    public readonly status: "OPEN" | "CLOSED" | "RESOLVED" = "OPEN",
    public readonly lastMessageAt: Date = new Date(),
    public readonly unreadCount: number = 0,
    public readonly createdAt: Date = new Date()
  ) {}

  public markAsRead(): ConversationDomain {
    return new ConversationDomain(
      this.id,
      this.companyId,
      this.channel,
      this.participantId,
      this.status,
      this.lastMessageAt,
      0,
      this.createdAt
    );
  }

  public touch(lastMessageDate: Date = new Date()): ConversationDomain {
    return new ConversationDomain(
      this.id,
      this.companyId,
      this.channel,
      this.participantId,
      this.status,
      lastMessageDate,
      this.unreadCount + 1,
      this.createdAt
    );
  }
}

export class MessageDomain {
  constructor(
    public readonly id: string,
    public readonly conversationId: string,
    public readonly senderId: string,
    public readonly direction: "INBOUND" | "OUTBOUND",
    public readonly content: string,
    public readonly mediaUrl?: string,
    public readonly createdAt: Date = new Date()
  ) {}
}
