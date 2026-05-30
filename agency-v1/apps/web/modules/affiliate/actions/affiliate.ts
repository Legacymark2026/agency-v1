'use server';

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import type {
    AffiliateStats, AffiliateProfile, Click, Referral, Payout, CommissionPlan
} from "../types";

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function requireAffiliate() {
    const session = await auth();
    if (!session?.user?.id) throw new Error("No autenticado");
    const profile = await (prisma as any).affiliateProfile.findUnique({
        where: { userId: session.user.id },
        include: { commission: true },
    });
    return { session, profile };
}

function toNum(decimal: any): string {
    return decimal?.toString?.() ?? "0.00";
}

// ─── Stats Overview ──────────────────────────────────────────────────────────

export async function getAffiliateStats(): Promise<{ success: boolean; data?: AffiliateStats; error?: string }> {
    try {
        const { session, profile } = await requireAffiliate();

        if (!profile) {
            return { success: true, data: { profile: null, totalClicks: 0, convertedClicks: 0, conversionRate: 0, totalReferrals: 0, pendingReferrals: 0, approvedReferrals: 0, rejectedReferrals: 0, totalEarned: "0.00", pendingEarned: "0.00", totalPaidOut: "0.00", pendingPayoutBalance: "0.00", last30DaysClicks: 0, last30DaysReferrals: 0 } };
        }

        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const [
            totalClicks, convertedClicks, last30DaysClicks,
            referralAgg, pendingReferrals, approvedReferrals, rejectedReferrals,
            last30DaysReferrals,
            earnedAgg, pendingAgg, paidAgg,
        ] = await Promise.all([
            (prisma as any).click.count({ where: { affiliateId: profile.id } }),
            (prisma as any).click.count({ where: { affiliateId: profile.id, converted: true } }),
            (prisma as any).click.count({ where: { affiliateId: profile.id, createdAt: { gte: thirtyDaysAgo } } }),
            (prisma as any).referral.count({ where: { affiliateId: profile.id } }),
            (prisma as any).referral.count({ where: { affiliateId: profile.id, status: 'PENDING' } }),
            (prisma as any).referral.count({ where: { affiliateId: profile.id, status: 'APPROVED' } }),
            (prisma as any).referral.count({ where: { affiliateId: profile.id, status: 'REJECTED' } }),
            (prisma as any).referral.count({ where: { affiliateId: profile.id, createdAt: { gte: thirtyDaysAgo } } }),
            (prisma as any).referral.aggregate({ where: { affiliateId: profile.id, status: 'APPROVED' }, _sum: { commissionAmount: true } }),
            (prisma as any).referral.aggregate({ where: { affiliateId: profile.id, status: 'PENDING' }, _sum: { commissionAmount: true } }),
            (prisma as any).payout.aggregate({ where: { affiliateId: profile.id, status: 'PAID' }, _sum: { amount: true } }),
        ]);

        const totalEarned = toNum(earnedAgg._sum.commissionAmount);
        const pendingEarned = toNum(pendingAgg._sum.commissionAmount);
        const totalPaidOut = toNum(paidAgg._sum.amount);
        const balance = (parseFloat(totalEarned) - parseFloat(totalPaidOut)).toFixed(2);

        const stats: AffiliateStats = {
            profile: { ...profile, commission: { ...profile.commission, value: Number(profile.commission.value) } },
            totalClicks, convertedClicks,
            conversionRate: totalClicks > 0 ? Math.round((convertedClicks / totalClicks) * 100) : 0,
            totalReferrals: referralAgg,
            pendingReferrals, approvedReferrals, rejectedReferrals,
            totalEarned, pendingEarned, totalPaidOut,
            pendingPayoutBalance: balance,
            last30DaysClicks, last30DaysReferrals,
        };

        return { success: true, data: stats };
    } catch (err: any) {
        console.error("[getAffiliateStats]", err);
        return { success: false, error: err.message };
    }
}

// ─── Referrals ────────────────────────────────────────────────────────────────

export async function getMyReferrals(): Promise<{ success: boolean; data?: Referral[]; error?: string }> {
    try {
        const { profile } = await requireAffiliate();
        if (!profile) return { success: true, data: [] };

        const rows = await (prisma as any).referral.findMany({
            where: { affiliateId: profile.id },
            orderBy: { createdAt: 'desc' },
            take: 100,
        });

        return { success: true, data: rows.map((r: any) => ({ ...r, commissionAmount: toNum(r.commissionAmount), orderTotal: toNum(r.orderTotal) })) };
    } catch (err: any) {
        return { success: false, error: err.message };
    }
}

// ─── Clicks ───────────────────────────────────────────────────────────────────

export async function getMyClicks(): Promise<{ success: boolean; data?: Click[]; error?: string }> {
    try {
        const { profile } = await requireAffiliate();
        if (!profile) return { success: true, data: [] };

        const rows = await (prisma as any).click.findMany({
            where: { affiliateId: profile.id },
            orderBy: { createdAt: 'desc' },
            take: 200,
        });

        return { success: true, data: rows };
    } catch (err: any) {
        return { success: false, error: err.message };
    }
}

// ─── Payouts ──────────────────────────────────────────────────────────────────

export async function getMyPayouts(): Promise<{ success: boolean; data?: Payout[]; error?: string }> {
    try {
        const { profile } = await requireAffiliate();
        if (!profile) return { success: true, data: [] };

        const rows = await (prisma as any).payout.findMany({
            where: { affiliateId: profile.id },
            orderBy: { createdAt: 'desc' },
        });

        return { success: true, data: rows.map((p: any) => ({ ...p, amount: toNum(p.amount) })) };
    } catch (err: any) {
        return { success: false, error: err.message };
    }
}

// ─── Commission Plans (Admin) ────────────────────────────────────────────────

export async function getCommissionPlans(): Promise<{ success: boolean; data?: CommissionPlan[]; error?: string }> {
    try {
        const rows = await (prisma as any).commissionPlan.findMany({ orderBy: { createdAt: 'desc' } });
        return { success: true, data: rows.map((p: any) => ({ ...p, value: Number(p.value) })) };
    } catch (err: any) {
        return { success: false, error: err.message };
    }
}

export async function createCommissionPlan(data: {
    name: string;
    type: 'PERCENTAGE' | 'FLAT';
    value: number;
    warrantyDays: number;
}): Promise<{ success: boolean; data?: CommissionPlan; error?: string }> {
    try {
        const plan = await (prisma as any).commissionPlan.create({ data });
        revalidatePath('/dashboard/affiliate/plans');
        return { success: true, data: { ...plan, value: Number(plan.value) } };
    } catch (err: any) {
        return { success: false, error: err.message };
    }
}

export async function deleteCommissionPlan(id: string): Promise<{ success: boolean; error?: string }> {
    try {
        await (prisma as any).commissionPlan.delete({ where: { id } });
        revalidatePath('/dashboard/affiliate/plans');
        return { success: true };
    } catch (err: any) {
        return { success: false, error: err.message };
    }
}

// ─── Affiliate Profile Management ────────────────────────────────────────────

export async function getAffiliateProfile(): Promise<{ success: boolean; data?: AffiliateProfile | null; error?: string }> {
    try {
        const { profile } = await requireAffiliate();
        if (!profile) return { success: true, data: null };
        return { success: true, data: { ...profile, commission: { ...profile.commission, value: Number(profile.commission.value) } } };
    } catch (err: any) {
        return { success: false, error: err.message };
    }
}

export async function createAffiliateProfile(data: {
    code: string;
    commissionId: string;
}): Promise<{ success: boolean; data?: AffiliateProfile; error?: string }> {
    try {
        const session = await auth();
        if (!session?.user?.id) throw new Error("No autenticado");

        const profile = await (prisma as any).affiliateProfile.create({
            data: { userId: session.user.id, code: data.code.toUpperCase(), commissionId: data.commissionId },
            include: { commission: true },
        });
        revalidatePath('/dashboard/affiliate');
        return { success: true, data: { ...profile, commission: { ...profile.commission, value: Number(profile.commission.value) } } };
    } catch (err: any) {
        return { success: false, error: err.message };
    }
}

// ─── All Affiliates (Admin view) ─────────────────────────────────────────────

export async function getAllAffiliates(): Promise<{ success: boolean; data?: any[]; error?: string }> {
    try {
        const rows = await (prisma as any).affiliateProfile.findMany({
            include: { commission: true },
            orderBy: { createdAt: 'desc' },
        });
        return { success: true, data: rows };
    } catch (err: any) {
        return { success: false, error: err.message };
    }
}
