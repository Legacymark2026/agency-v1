/**
 * Marketing Service — Hexagonal Ports
 */
import { CampaignDomain } from "../domain/marketing.domain";

export interface IMarketingUseCases {
  createCampaign(dto: { companyId: string; name: string; subject: string }): Promise<CampaignDomain>;
  sendCampaign(id: string): Promise<CampaignDomain>;
}

export interface IMarketingRepositoryPort {
  save(camp: CampaignDomain): Promise<CampaignDomain>;
  findById(id: string): Promise<CampaignDomain | null>;
}

export interface IEmailBlastPort {
  dispatchBlast(campaign: CampaignDomain): Promise<{ sentCount: number }>;
}

export interface IMarketingEventPublisherPort {
  publishEvent(topic: string, event: Record<string, any>): Promise<void>;
}
