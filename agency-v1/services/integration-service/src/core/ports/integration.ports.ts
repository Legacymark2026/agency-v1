/**
 * Integration Service — Hexagonal Ports
 */
import { IntegrationDomain } from "../domain/integration.domain";

export interface IIntegrationUseCases {
  connectProvider(dto: { companyId: string; provider: string }): Promise<IntegrationDomain>;
  dispatchWebhook(integrationId: string, eventName: string, data: Record<string, any>): Promise<boolean>;
}

export interface IIntegrationRepositoryPort {
  save(int: IntegrationDomain): Promise<IntegrationDomain>;
  findById(id: string): Promise<IntegrationDomain | null>;
  findByCompanyAndProvider(companyId: string, provider: string): Promise<IntegrationDomain | null>;
}

export interface IWebhookDeliveryPort {
  sendPost(url: string, body: string, signature: string): Promise<boolean>;
}

export interface IIntegrationEventPublisherPort {
  publishEvent(topic: string, event: Record<string, any>): Promise<void>;
}
