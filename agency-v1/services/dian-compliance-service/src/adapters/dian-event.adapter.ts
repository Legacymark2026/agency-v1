/**
 * Redis EventBus Adapter for DIAN Service
 */
import { EventBus } from "@agency/events";
import { IDianEventPublisherPort } from "../core/ports/dian.ports";

const eventBus = new EventBus(process.env.REDIS_URL || "redis://localhost:6379", "dian-compliance-service");

export class RedisDianEventAdapter implements IDianEventPublisherPort {
  async publishDocumentApproved(payload: {
    documentId: string;
    companyId: string;
    cufe: string;
    documentNumber: string;
  }): Promise<void> {
    try {
      await eventBus.publish("dian.document.approved" as any, payload);
    } catch (err: any) {
      console.warn("[DianEventAdapter] Failed to publish dian.document.approved:", err.message);
    }
  }

  async publishDocumentRejected(payload: { documentId: string; companyId: string; errors: any }): Promise<void> {
    try {
      await eventBus.publish("dian.document.rejected" as any, payload);
    } catch (err: any) {
      console.warn("[DianEventAdapter] Failed to publish dian.document.rejected:", err.message);
    }
  }
}
