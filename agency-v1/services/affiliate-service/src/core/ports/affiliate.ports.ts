/**
 * Affiliate Service — Hexagonal Ports
 */
import { AffiliateDomain } from "../domain/affiliate.domain";

export interface IAffiliateUseCases {
  registerAffiliate(dto: { userId: string; referralCode: string; ratePct?: number }): Promise<AffiliateDomain>;
  creditCommission(referralCode: string, saleAmount: number): Promise<AffiliateDomain>;
}

export interface IAffiliateRepositoryPort {
  save(aff: AffiliateDomain): Promise<AffiliateDomain>;
  findByCode(code: string): Promise<AffiliateDomain | null>;
  findById(id: string): Promise<AffiliateDomain | null>;
}

export interface IAffiliateEventPublisherPort {
  publishEvent(topic: string, event: Record<string, any>): Promise<void>;
}
