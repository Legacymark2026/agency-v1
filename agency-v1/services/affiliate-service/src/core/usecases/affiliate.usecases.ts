/**
 * Affiliate Service — Pure Use Cases
 */
import {
  IAffiliateUseCases,
  IAffiliateRepositoryPort,
  IAffiliateEventPublisherPort,
} from "../ports/affiliate.ports";
import { AffiliateDomain } from "../domain/affiliate.domain";

export class AffiliateUseCases implements IAffiliateUseCases {
  constructor(
    private readonly repoPort: IAffiliateRepositoryPort,
    private readonly eventPublisher: IAffiliateEventPublisherPort
  ) {}

  public async registerAffiliate(dto: { userId: string; referralCode: string; ratePct?: number }): Promise<AffiliateDomain> {
    const aff = new AffiliateDomain(
      "aff_" + Math.random().toString(36).substring(2, 9),
      dto.userId,
      dto.referralCode.toUpperCase(),
      dto.ratePct || 15
    );
    const saved = await this.repoPort.save(aff);
    await this.eventPublisher.publishEvent("affiliate.registered", { affiliateId: saved.id, code: saved.referralCode });
    return saved;
  }

  public async creditCommission(referralCode: string, saleAmount: number): Promise<AffiliateDomain> {
    const aff = await this.repoPort.findByCode(referralCode.toUpperCase());
    if (!aff) throw new Error(`Afiliado con código ${referralCode} no encontrado`);
    const updated = aff.recordSale(saleAmount);
    const saved = await this.repoPort.save(updated);
    await this.eventPublisher.publishEvent("affiliate.commission.credited", {
      affiliateId: saved.id,
      saleAmount,
      totalEarnings: saved.totalEarnings,
    });
    return saved;
  }
}
