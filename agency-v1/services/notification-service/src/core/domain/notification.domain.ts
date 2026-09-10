/**
 * Notification Service — Pure Domain Entities & Business Rules
 * ─────────────────────────────────────────────────────────────────────────────
 * Zero external framework dependencies.
 */

export type NotificationChannel = "EMAIL" | "SMS" | "PUSH" | "IN_APP";
export type NotificationPriority = "LOW" | "NORMAL" | "HIGH" | "URGENT";

export function sanitizeNotificationText(str: unknown): string {
  if (typeof str !== "string") return "";
  return str
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/on\w+="[^"]*"/gi, "")
    .trim();
}

export function calculateReadRate(totalCount: number, readCount: number): number {
  if (totalCount <= 0) return 0;
  return Math.round((readCount / totalCount) * 100);
}

export class NotificationDomain {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly companyId: string,
    public readonly title: string,
    public readonly message: string,
    public readonly channel: NotificationChannel = "IN_APP",
    public readonly priority: NotificationPriority = "NORMAL",
    public readonly isRead: boolean = false,
    public readonly metadata: Record<string, any> = {},
    public readonly createdAt: Date = new Date()
  ) {}

  public static create(dto: {
    id?: string;
    userId: string;
    companyId: string;
    title: string;
    message: string;
    channel?: NotificationChannel;
    priority?: NotificationPriority;
    metadata?: Record<string, any>;
  }): NotificationDomain {
    return new NotificationDomain(
      dto.id || "notif_" + Math.random().toString(36).substring(2, 9),
      dto.userId,
      dto.companyId,
      sanitizeNotificationText(dto.title),
      sanitizeNotificationText(dto.message),
      dto.channel || "IN_APP",
      dto.priority || "NORMAL",
      false,
      dto.metadata || {},
      new Date()
    );
  }

  public markRead(): NotificationDomain {
    return new NotificationDomain(
      this.id,
      this.userId,
      this.companyId,
      this.title,
      this.message,
      this.channel,
      this.priority,
      true,
      this.metadata,
      this.createdAt
    );
  }
}
