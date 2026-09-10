/**
 * Notification Service — Pure Hexagonal Use Cases Orchestration
 * ─────────────────────────────────────────────────────────────────────────────
 */
import {
  INotificationUseCases,
  INotificationRepositoryPort,
  INotificationProviderPort,
  INotificationEventPublisherPort,
  SendNotificationDTO,
} from "../ports/notification.ports";
import {
  NotificationDomain,
  calculateReadRate,
} from "../domain/notification.domain";

export class NotificationUseCases implements INotificationUseCases {
  constructor(
    private readonly repoPort: INotificationRepositoryPort,
    private readonly providerPort: INotificationProviderPort,
    private readonly eventPublisher: INotificationEventPublisherPort
  ) {}

  public async send(dto: SendNotificationDTO): Promise<NotificationDomain> {
    const notif = NotificationDomain.create(dto);
    const saved = await this.repoPort.save(notif);

    if (saved.channel !== "IN_APP" && dto.recipientAddress) {
      await this.providerPort.dispatch(
        saved.channel,
        dto.recipientAddress,
        saved.title,
        saved.message
      );
    }

    await this.eventPublisher.publishEvent("notification.sent", {
      notificationId: saved.id,
      userId: saved.userId,
      channel: saved.channel,
      priority: saved.priority,
    });

    return saved;
  }

  public async markAsRead(id: string, userId: string): Promise<NotificationDomain> {
    const notif = await this.repoPort.findById(id);
    if (!notif) throw new Error(`Notificación ${id} no encontrada`);
    if (notif.userId !== userId) throw new Error("No autorizado");

    const read = notif.markRead();
    const updated = await this.repoPort.save(read);

    await this.eventPublisher.publishEvent("notification.read", {
      notificationId: updated.id,
      userId: updated.userId,
    });

    return updated;
  }

  public async getStats(userId: string): Promise<{ total: number; unread: number; readRate: number }> {
    const { total, read } = await this.repoPort.countByUser(userId);
    const unread = Math.max(0, total - read);
    const readRate = calculateReadRate(total, read);

    return { total, unread, readRate };
  }
}
