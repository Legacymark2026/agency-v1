/**
 * Redis Pub/Sub Event Publisher Adapter for Supplier Catalog (Hexagonal Driven Adapter)
 */
import { EventBus } from "@agency/events";
import { ISupplierEventPublisherPort } from "../core/ports/supplier.ports";

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";
const eventBus = new EventBus(REDIS_URL, "supplier-catalog-engine");

export class RedisSupplierEventAdapter implements ISupplierEventPublisherPort {
  async publishSupplierCreated(payload: {
    supplierId: string;
    companyId: string;
    name: string;
    taxId: string;
  }): Promise<void> {
    await eventBus.publish("supplier.created" as any, {
      ...payload,
      timestamp: new Date().toISOString(),
    });
  }

  async publishSupplierStatusChanged(payload: {
    supplierId: string;
    companyId: string;
    previousStatus: string;
    newStatus: string;
    reason?: string;
  }): Promise<void> {
    await eventBus.publish("supplier.status_changed" as any, {
      ...payload,
      timestamp: new Date().toISOString(),
    });
  }

  async publishDocumentExpiring(payload: {
    supplierId: string;
    companyId: string;
    documentId: string;
    title: string;
    expiryDate: Date;
  }): Promise<void> {
    await eventBus.publish("supplier.document_expiring" as any, {
      ...payload,
      expiryDate: payload.expiryDate.toISOString(),
      timestamp: new Date().toISOString(),
    });
  }

  async publishSupplierComplianceAlert(payload: {
    supplierId: string;
    companyId: string;
    missingDocs: string[];
  }): Promise<void> {
    await eventBus.publish("supplier.compliance_alert" as any, {
      ...payload,
      timestamp: new Date().toISOString(),
    });
  }
}
