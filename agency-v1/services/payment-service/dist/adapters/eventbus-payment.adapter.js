"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventBusPaymentPublisherAdapter = void 0;
class EventBusPaymentPublisherAdapter {
    bus;
    constructor(bus) {
        this.bus = bus;
    }
    async publishPaymentCompleted(event) {
        try {
            await this.bus.publish("order.completed", {
                orderId: event.orderId || event.reference,
                userId: event.companyId,
                id: event.reference,
            });
            console.log(`[PaymentPublisher] Published order.completed for ref: ${event.reference}`);
        }
        catch (err) {
            console.warn("[PaymentPublisher] Redis event publish skipped:", err.message);
        }
    }
    async publishPaymentFailed(event) {
        console.log(`[PaymentPublisher] Payment failed for ref: ${event.reference}`);
    }
}
exports.EventBusPaymentPublisherAdapter = EventBusPaymentPublisherAdapter;
