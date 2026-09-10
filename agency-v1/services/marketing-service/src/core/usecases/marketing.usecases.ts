/**
 * Marketing Service — Pure Use Cases
 */
import {
  IMarketingUseCases,
  IMarketingRepositoryPort,
  IEmailBlastPort,
  IMarketingEventPublisherPort,
} from "../ports/marketing.ports";
import { CampaignDomain } from "../domain/marketing.domain";

export class MarketingUseCases implements IMarketingUseCases {
  constructor(
    private readonly repoPort: IMarketingRepositoryPort,
    private readonly blastPort: IEmailBlastPort,
    private readonly eventPublisher: IMarketingEventPublisherPort
  ) {}

  public async createCampaign(dto: { companyId: string; name: string; subject: string }): Promise<CampaignDomain> {
    const camp = new CampaignDomain(
      "camp_" + Math.random().toString(36).substring(2, 9),
      dto.companyId,
      dto.name,
      dto.subject
    );
    const saved = await this.repoPort.save(camp);
    await this.eventPublisher.publishEvent("marketing.campaign.created", { campaignId: saved.id });
    return saved;
  }

  public async sendCampaign(id: string): Promise<CampaignDomain> {
    const camp = await this.repoPort.findById(id);
    if (!camp) throw new Error(`Campaña ${id} no encontrada`);
    await this.blastPort.dispatchBlast(camp);
    const updated = new CampaignDomain(camp.id, camp.companyId, camp.name, camp.subject, "SENT", camp.recipientCount, camp.spend, camp.revenue, camp.createdAt);
    await this.repoPort.save(updated);
    await this.eventPublisher.publishEvent("marketing.campaign.sent", { campaignId: updated.id });
    return updated;
  }
}
