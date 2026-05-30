// ─── Enums ───────────────────────────────────────────────────────────────────

export type AffiliateStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
export type CommissionType = 'PERCENTAGE' | 'FLAT';
export type ReferralStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type PayoutStatus = 'PENDING' | 'PROCESSING' | 'PAID' | 'FAILED';

// ─── Domain Models ────────────────────────────────────────────────────────────

export interface CommissionPlan {
    id: string;
    name: string;
    type: CommissionType;
    value: number;  // percentage or flat amount
    warrantyDays: number;
    createdAt: string;
    updatedAt: string;
}

export interface AffiliateProfile {
    id: string;
    userId: string;
    code: string;
    status: AffiliateStatus;
    commissionId: string;
    commission: CommissionPlan;
    createdAt: string;
    updatedAt: string;
}

export interface Click {
    id: string;
    affiliateId: string;
    ip: string | null;
    userAgent: string | null;
    referrer: string | null;
    country: string | null;
    converted: boolean;
    createdAt: string;
}

export interface Referral {
    id: string;
    affiliateId: string;
    orderId: string;
    buyerUserId: string;
    status: ReferralStatus;
    commissionAmount: string;   // Decimal serialized as string
    orderTotal: string;         // Decimal serialized as string
    createdAt: string;
    updatedAt: string;
}

export interface Payout {
    id: string;
    affiliateId: string;
    amount: string;             // Decimal serialized as string
    status: PayoutStatus;
    referralIds: string[];
    idempotencyKey: string;
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
