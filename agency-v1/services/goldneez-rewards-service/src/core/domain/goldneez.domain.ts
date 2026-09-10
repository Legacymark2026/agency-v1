/**
 * Goldneez Rewards Service — Pure Domain Entities & Loyalty Points
 */
export type RewardTier = "BRONZE" | "SILVER" | "GOLD" | "DIAMOND";

export function evaluateTier(points: number): RewardTier {
  if (points >= 50000) return "DIAMOND";
  if (points >= 20000) return "GOLD";
  if (points >= 5000) return "SILVER";
  return "BRONZE";
}

export class RewardWalletDomain {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly points: number = 0,
    public readonly tier: RewardTier = "BRONZE",
    public readonly createdAt: Date = new Date()
  ) {}

  public addPoints(amount: number): RewardWalletDomain {
    const nextPoints = this.points + amount;
    return new RewardWalletDomain(this.id, this.userId, nextPoints, evaluateTier(nextPoints), this.createdAt);
  }

  public redeemPoints(amount: number): RewardWalletDomain {
    if (this.points < amount) throw new Error("Puntos insuficientes");
    const nextPoints = this.points - amount;
    return new RewardWalletDomain(this.id, this.userId, nextPoints, evaluateTier(nextPoints), this.createdAt);
  }
}
