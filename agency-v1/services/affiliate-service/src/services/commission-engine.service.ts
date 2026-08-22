/**
 * Multi-Tier Affiliate Commission & Payout Calculator
 * ─────────────────────────────────────────────────────────────────────────────
 * Calculates Tier 1 (Direct Referrer) and Tier 2 (Parent Referrer)
 * commission payouts on closed transactions.
 */

export interface SaleCommissionInput {
  saleId: string;
  totalSaleAmount: number;
  tier1AffiliateId: string;
  tier2AffiliateId?: string;
  tier1Rate?: number; // default 0.20 (20%)
  tier2Rate?: number; // default 0.05 (5%)
}

export interface CommissionPayoutResult {
  saleId: string;
  totalSaleAmount: number;
  tier1Payout: { affiliateId: string; rate: number; amount: number };
  tier2Payout?: { affiliateId: string; rate: number; amount: number };
  totalCommissionPaid: number;
  calculatedAt: string;
}

export function calculateAffiliateCommission(input: SaleCommissionInput): CommissionPayoutResult {
  const saleAmount = input.totalSaleAmount || 0;
  const tier1Rate = input.tier1Rate ?? 0.20;
  const tier2Rate = input.tier2Rate ?? 0.05;

  const tier1Amount = Math.round(saleAmount * tier1Rate);
  let tier2Amount = 0;

  const result: CommissionPayoutResult = {
    saleId: input.saleId,
    totalSaleAmount: saleAmount,
    tier1Payout: {
      affiliateId: input.tier1AffiliateId,
      rate: tier1Rate,
      amount: tier1Amount,
    },
    totalCommissionPaid: tier1Amount,
    calculatedAt: new Date().toISOString(),
  };

  if (input.tier2AffiliateId) {
    tier2Amount = Math.round(saleAmount * tier2Rate);
    result.tier2Payout = {
      affiliateId: input.tier2AffiliateId,
      rate: tier2Rate,
      amount: tier2Amount,
    };
    result.totalCommissionPaid += tier2Amount;
  }

  return result;
}
