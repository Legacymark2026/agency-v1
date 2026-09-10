import { IAffiliateRepositoryPort } from "../core/ports/affiliate.ports";
import { AffiliateDomain } from "../core/domain/affiliate.domain";

export class PrismaAffiliateAdapter implements IAffiliateRepositoryPort {
  private mem = new Map<string, AffiliateDomain>();
  public async save(a: AffiliateDomain) { this.mem.set(a.id, a); return a; }
  public async findByCode(code: string) { return Array.from(this.mem.values()).find(a => a.referralCode === code) || null; }
  public async findById(id: string) { return this.mem.get(id) || null; }
}
