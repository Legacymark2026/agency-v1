import { IRewardRepositoryPort } from "../core/ports/goldneez.ports";
import { RewardWalletDomain } from "../core/domain/goldneez.domain";

export class PrismaGoldneezAdapter implements IRewardRepositoryPort {
  private mem = new Map<string, RewardWalletDomain>();
  public async save(w: RewardWalletDomain) { this.mem.set(w.userId, w); return w; }
  public async findByUserId(uId: string) { return this.mem.get(uId) || null; }
}
