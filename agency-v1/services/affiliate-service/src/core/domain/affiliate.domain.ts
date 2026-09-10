/**
 * Affiliate Service — Pure Domain Entities & Commission Calculations
 */
export function calculateAffiliateCommission(saleAmount: number, tierRatePct = 15): number {
  return Math.round((saleAmount * (tierRatePct / 100)) * 100) / 100;
}

export class AffiliateDomain {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly referralCode: string,
    public readonly commissionRatePct: number = 15,
    public readonly totalEarnings: number = 0,
    public readonly pendingPayout: number = 0,
    public readonly createdAt: Date = new Date()
  ) {}

  public recordSale(saleAmount: number): AffiliateDomain {
    const earned = calculateAffiliateCommission(saleAmount, this.commissionRatePct);
    return new AffiliateDomain(
      this.id,
      this.userId,
      this.referralCode,
      this.commissionRatePct,
      this.totalEarnings + earned,
      this.pendingPayout + earned,
      this.createdAt
    );
  }
}
