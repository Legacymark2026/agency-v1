/**
 * Notification Service — Hexagonal Ports (Inbound & Outbound Interfaces)
 * ─────────────────────────────────────────────────────────────────────────────
 */
import {
  NotificationDomain,
  NotificationChannel,
  NotificationPriority,
} from "../domain/notification.domain";

export interface SendNotificationDTO {
  userId: string;
  companyId: string;
  title: string;
  message: string;
  channel?: NotificationChannel;
  priority?: NotificationPriority;
  metadata?: Record<string, any>;
  recipientAddress?: string; // email address or phone number
}

// Inbound Port: Primary Use Cases
export interface INotificationUseCases {
  send(dto: SendNotificationDTO): Promise<NotificationDomain>;
  markAsRead(id: string, userId: string): Promise<NotificationDomain>;
  getStats(userId: string): Promise<{ total: number; unread: number; readRate: number }>;
}

// Outbound Port: Persistence
export interface INotificationRepositoryPort {
  save(notif: NotificationDomain): Promise<NotificationDomain>;
  findById(id: string): Promise<NotificationDomain | null>;
  countByUser(userId: string): Promise<{ total: number; read: number }>;
}

// Outbound Port: External Provider Dispatcher (with multi-provider resilience)
export interface INotificationProviderPort {
  dispatch(
    channel: NotificationChannel,
    recipient: string,
    title: string,
    message: string
  ): Promise<{ success: boolean; providerUsed: string }>;
}

// Outbound Port: Event Publisher
export interface INotificationEventPublisherPort {
  publishEvent(topic: string, event: Record<string, any>): Promise<void>;
}
