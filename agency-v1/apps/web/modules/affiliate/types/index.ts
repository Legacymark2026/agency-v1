// ─── Enums ───────────────────────────────────────────────────────────────────

export type AffiliateStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
export type PlanType = 'PERCENTAGE' | 'FIXED';
export type PayoutStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'PAID';

// ─── Domain Models ────────────────────────────────────────────────────────────

export interface CommissionPlan {
    id: string;
    name: string;
    type: PlanType;
    value: number;              // percentage or flat amount
    cookieLifetimeInt: number;  // días
    createdAt: string;
    updatedAt: string;
}

export interface AffiliateProfile {
    id: string;
    userId: string;
    code: string;
    status: AffiliateStatus;
    commissionPlanId: string;
    commissionPlan: CommissionPlan;
    createdAt: string;
    updatedAt: string;
}

export interface Click {
    id: string;
    affiliateCode: string;
    ip: string;
    userAgent: string;
    referer: string | null;
    createdAt: string;
}

export interface Referral {
    id: string;
    affiliateId: string;
    orderId: string;
    referredUserId: string;
    status: PayoutStatus;
    commissionAmount: string;   // Decimal serialized as string
    orderAmount: string;        // Decimal serialized as string
    payoutId: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface Payout {
    id: string;
    affiliateId: string;
    amount: string;             // Decimal serialized as string
    status: string;             // PROCESSING | PAID | FAILED
    paidAt: string | null;
    createdAt: string;
    updatedAt: string;
}

// ─── Aggregate / KPI ─────────────────────────────────────────────────────────

export interface AffiliateStats {
    profile: AffiliateProfile | null;
    totalClicks: number;
    convertedClicks: number;
    conversionRate: number;         // 0-100
    totalReferrals: number;
    pendingReferrals: number;
    approvedReferrals: number;
    rejectedReferrals: number;
    totalEarned: string;            // sum of APPROVED commissions
    pendingEarned: string;          // sum of PENDING commissions
    totalPaidOut: string;           // sum of PAID payouts
    pendingPayoutBalance: string;   // totalEarned - totalPaidOut
    last30DaysClicks: number;
    last30DaysReferrals: number;
}
