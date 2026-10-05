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
        amount: event.amount,
        orderAmount: event.amount,
        currency: event.currency,
      });
      await (this.bus as any).publish("payment.succeeded", {
        reference: event.reference,
        invoiceId: event.invoiceId,
        orderId: event.orderId,
        companyId: event.companyId,
        amount: event.amount,
        currency: event.currency,
        provider: event.provider,
      });
      console.log(`[PaymentPublisher] Published order.completed & payment.succeeded for ref: ${event.reference}`);
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

