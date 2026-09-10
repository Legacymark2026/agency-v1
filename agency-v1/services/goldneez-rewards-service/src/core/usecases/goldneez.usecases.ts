/**
 * Goldneez Rewards Service — Pure Use Cases
 */
import {
  IGoldneezUseCases,
  IRewardRepositoryPort,
  IRewardEventPublisherPort,
} from "../ports/goldneez.ports";
import { RewardWalletDomain } from "../domain/goldneez.domain";

export class GoldneezUseCases implements IGoldneezUseCases {
  constructor(
    private readonly repoPort: IRewardRepositoryPort,
    private readonly eventPublisher: IRewardEventPublisherPort
  ) {}

  public async getWallet(userId: string): Promise<RewardWalletDomain> {
    let wallet = await this.repoPort.findByUserId(userId);
    if (!wallet) {
      wallet = new RewardWalletDomain("wlt_" + Math.random().toString(36).substring(2, 9), userId);
      await this.repoPort.save(wallet);
    }
    return wallet;
  }

  public async creditPoints(userId: string, points: number, reason: string): Promise<RewardWalletDomain> {
    const wallet = await this.getWallet(userId);
    const updated = wallet.addPoints(points);
    const saved = await this.repoPort.save(updated);
    await this.eventPublisher.publishEvent("goldneez.points.credited", {
      userId,
      pointsAdded: points,
      newTier: saved.tier,
      reason,
    });
    return saved;
  }

  public async redeemPoints(userId: string, points: number): Promise<RewardWalletDomain> {
    const wallet = await this.getWallet(userId);
    const updated = wallet.redeemPoints(points);
    const saved = await this.repoPort.save(updated);
    await this.eventPublisher.publishEvent("goldneez.points.redeemed", {
      userId,
      pointsRedeemed: points,
      remainingPoints: saved.points,
    });
    return saved;
  }
}
