/**
 * Admin Service — Pure Domain Entities
 */
export type SubscriptionTier = "STARTER" | "PROFESSIONAL" | "ENTERPRISE";

export class TenantDomain {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly domain: string,
    public readonly tier: SubscriptionTier = "STARTER",
    public readonly isActive: boolean = true,
    public readonly createdAt: Date = new Date()
  ) {}

  public upgradeTier(newTier: SubscriptionTier): TenantDomain {
    return new TenantDomain(this.id, this.name, this.domain, newTier, this.isActive, this.createdAt);
  }
}
