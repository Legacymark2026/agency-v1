/**
 * Integration Service — Pure Use Cases
 */
import {
  IIntegrationUseCases,
  IIntegrationRepositoryPort,
  IWebhookDeliveryPort,
  IIntegrationEventPublisherPort,
} from "../ports/integration.ports";
import { IntegrationDomain, signWebhookPayload } from "../domain/integration.domain";

export class IntegrationUseCases implements IIntegrationUseCases {
  constructor(
    private readonly repoPort: IIntegrationRepositoryPort,
    private readonly deliveryPort: IWebhookDeliveryPort,
    private readonly eventPublisher: IIntegrationEventPublisherPort
  ) {}

  public async connectProvider(dto: { companyId: string; provider: string }): Promise<IntegrationDomain> {
    const apiKey = "key_" + Math.random().toString(36).substring(2, 14);
    const webhookSecret = "sec_" + Math.random().toString(36).substring(2, 14);
    const integration = new IntegrationDomain(
      "int_" + Math.random().toString(36).substring(2, 9),
      dto.companyId,
      dto.provider,
      apiKey,
      webhookSecret
    );
    const saved = await this.repoPort.save(integration);
    await this.eventPublisher.publishEvent("integration.connected", {
      integrationId: saved.id,
      companyId: saved.companyId,
      provider: saved.provider,
    });
    return saved;
  }

  public async dispatchWebhook(integrationId: string, eventName: string, data: Record<string, any>): Promise<boolean> {
    const int = await this.repoPort.findById(integrationId);
    if (!int) throw new Error(`Integración ${integrationId} no encontrada`);

    const payloadStr = JSON.stringify({ event: eventName, data, timestamp: Date.now() });
    const sig = signWebhookPayload(payloadStr, int.webhookSecret);

    return this.deliveryPort.sendPost("https://hooks.partner.com/incoming", payloadStr, sig);
  }
}
