/**
 * Marketing Service — Pure Domain Entities & Calculations
 */
export function calculateCampaignROI(revenue: number, spend: number): { roiPercent: number; netProfit: number } {
  if (spend <= 0) return { roiPercent: 0, netProfit: revenue };
  const netProfit = revenue - spend;
  const roiPercent = Math.round((netProfit / spend) * 100);
  return { roiPercent, netProfit };
}

export class CampaignDomain {
  constructor(
    public readonly id: string,
    public readonly companyId: string,
    public readonly name: string,
    public readonly subject: string,
    public readonly status: "DRAFT" | "SCHEDULED" | "SENDING" | "SENT" = "DRAFT",
    public readonly recipientCount: number = 0,
    public readonly spend: number = 0,
    public readonly revenue: number = 0,
    public readonly createdAt: Date = new Date()
  ) {}

  public get roi() {
    return calculateCampaignROI(this.revenue, this.spend);
  }
}
