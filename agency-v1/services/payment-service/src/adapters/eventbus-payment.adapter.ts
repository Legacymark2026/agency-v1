/**
 * Payment Service — EventBus Driven Adapter
 * ─────────────────────────────────────────────────────────────────────────────
 */
import { EventBus } from "@agency/events";
import { IPaymentEventPublisherPort } from "../core/ports/payment.ports";

export class EventBusPaymentPublisherAdapter implements IPaymentEventPublisherPort {
  constructor(private readonly bus: EventBus) {}

  async publishPaymentCompleted(event: {
    reference: string;
    amount: number;
    currency: string;
    companyId: string;
    provider: string;
    orderId?: string;
    invoiceId?: string;
  }): Promise<void> {
    try {
      await this.bus.publish("order.completed", {
        orderId: event.orderId || event.reference,
        userId: event.companyId,
        id: event.reference,
      });
      console.log(`[PaymentPublisher] Published order.completed for ref: ${event.reference}`);
    } catch (err: any) {
      console.warn("[PaymentPublisher] Redis event publish skipped:", err.message);
    }
  }

  async publishPaymentFailed(event: {
    reference: string;
    companyId: string;
    provider: string;
    reason?: string;
  }): Promise<void> {
    console.log(`[PaymentPublisher] Payment failed for ref: ${event.reference}`);
  }
}
