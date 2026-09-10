import { IMarketingRepositoryPort } from "../core/ports/marketing.ports";
import { CampaignDomain } from "../core/domain/marketing.domain";

export class PrismaMarketingAdapter implements IMarketingRepositoryPort {
  private mem = new Map<string, CampaignDomain>();
  public async save(c: CampaignDomain) { this.mem.set(c.id, c); return c; }
  public async findById(id: string) { return this.mem.get(id) || null; }
}
