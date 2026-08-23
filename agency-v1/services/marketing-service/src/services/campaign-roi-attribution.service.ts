/**
 * Campaign ROI & Direct Revenue Attribution Engine
 * ─────────────────────────────────────────────────────────────────────────────
 * Links UTM campaign clicks to CRM closed-won deals and PostgreSQL invoices,
 * calculating Cost Per Acquisition (CPA), Return on Ad Spend (ROAS), and net ROI.
 */

export interface CampaignCostInput {
  campaignId: string;
  campaignName: string;
  totalCostCOP: number;
  utmCampaign: string;
  utmSource: string;
}

export interface ConvertedDealEvent {
  dealId: string;
  clientNit: string;
  dealValueCOP: number;
  utmCampaign: string;
  closedAt: string;
}

export interface CampaignROIReport {
  campaignId: string;
  campaignName: string;
  totalSpendCOP: number;
  totalAttributedRevenueCOP: number;
  convertedDealsCount: number;
  cpaCOP: number; // Cost Per Acquisition
  roasMultiplier: number; // e.g. 5.4x
  netRoiPercentage: number; // e.g. 440%
  status: "HIGH_PROFITABLE" | "BREAK_EVEN" | "UNPROFITABLE";
}

export class CampaignROIAttributionService {
  /**
   * Computes financial ROI and attribution metrics for a marketing campaign.
   */
  public calculateCampaignROI(
    cost: CampaignCostInput,
    conversions: ConvertedDealEvent[]
  ): CampaignROIReport {
    const matchedConversions = conversions.filter((c) => c.utmCampaign === cost.utmCampaign);
    const totalAttributedRevenue = matchedConversions.reduce((sum, c) => sum + c.dealValueCOP, 0);
    const count = matchedConversions.length;

    const cpa = count > 0 ? Math.round(cost.totalCostCOP / count) : 0;
    const roas = cost.totalCostCOP > 0 ? Math.round((totalAttributedRevenue / cost.totalCostCOP) * 100) / 100 : 0;
    const netProfit = totalAttributedRevenue - cost.totalCostCOP;
    const netRoi = cost.totalCostCOP > 0 ? Math.round((netProfit / cost.totalCostCOP) * 100) : 0;

    let status: "HIGH_PROFITABLE" | "BREAK_EVEN" | "UNPROFITABLE" = "BREAK_EVEN";
    if (roas >= 2.5) status = "HIGH_PROFITABLE";
    else if (roas < 1.0) status = "UNPROFITABLE";

    return {
      campaignId: cost.campaignId,
      campaignName: cost.campaignName,
      totalSpendCOP: cost.totalCostCOP,
      totalAttributedRevenueCOP: totalAttributedRevenue,
      convertedDealsCount: count,
      cpaCOP: cpa,
      roasMultiplier: roas,
      netRoiPercentage: netRoi,
      status,
    };
  }
}

export const campaignROIAttribution = new CampaignROIAttributionService();
