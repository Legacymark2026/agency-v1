'use server';

import { auth } from "@/lib/auth";
import type {
    AffiliateStats, AffiliateProfile, Click, Referral, Payout, CommissionPlan
} from "../types";

// ─── HTTP Client ──────────────────────────────────────────────────────────────

const BASE = () => process.env.AFFILIATE_SERVICE_URL ?? 'http://localhost:4019';

async function svcGet<T>(path: string, params?: Record<string, string>): Promise<{ success: boolean; data?: T; error?: string }> {
    try {
        const url = new URL(`${BASE()}${path}`);
        if (params) Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
        const res = await fetch(url.toString(), { cache: 'no-store' });
        if (!res.ok) { const t = await res.text(); return { success: false, error: t }; }
        return res.json();
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

async function svcPost<T>(path: string, body: unknown): Promise<{ success: boolean; data?: T; error?: string }> {
    try {
        const res = await fetch(`${BASE()}${path}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
            cache: 'no-store',
        });
        return res.json();
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

async function svcDelete(path: string): Promise<{ success: boolean; error?: string }> {
    try {
        const res = await fetch(`${BASE()}${path}`, { method: 'DELETE', cache: 'no-store' });
        return res.json();
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

async function getUserId(): Promise<string> {
    const session = await auth();
    if (!session?.user?.id) throw new Error("No autenticado");
    return session.user.id;
}

// ─── Stats Overview ──────────────────────────────────────────────────────────

export async function getAffiliateStats(): Promise<{ success: boolean; data?: AffiliateStats; error?: string }> {
    try {
        const userId = await getUserId();
        return svcGet<AffiliateStats>('/api/affiliates/stats', { userId });
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

// ─── Referrals ────────────────────────────────────────────────────────────────

export async function getMyReferrals(): Promise<{ success: boolean; data?: Referral[]; error?: string }> {
    try {
        const userId = await getUserId();
        return svcGet<Referral[]>('/api/affiliates/referrals', { userId });
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

// ─── Clicks ───────────────────────────────────────────────────────────────────

export async function getMyClicks(): Promise<{ success: boolean; data?: Click[]; error?: string }> {
    try {
        const userId = await getUserId();
        return svcGet<Click[]>('/api/affiliates/clicks', { userId });
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

// ─── Payouts ──────────────────────────────────────────────────────────────────

export async function getMyPayouts(): Promise<{ success: boolean; data?: Payout[]; error?: string }> {
    try {
        const userId = await getUserId();
        return svcGet<Payout[]>('/api/affiliates/payouts', { userId });
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

// ─── Commission Plans (Admin) ────────────────────────────────────────────────

export async function getCommissionPlans(): Promise<{ success: boolean; data?: CommissionPlan[]; error?: string }> {
    return svcGet<CommissionPlan[]>('/api/affiliates/plans');
}

export async function createCommissionPlan(data: {
    name: string;
    type: 'PERCENTAGE' | 'FLAT';
    value: number;
    warrantyDays: number;
}): Promise<{ success: boolean; data?: CommissionPlan; error?: string }> {
    return svcPost<CommissionPlan>('/api/affiliates/plans', {
        name: data.name,
        type: data.type,
        value: data.value,
        cookieLifetimeInt: data.warrantyDays,
    });
}

export async function deleteCommissionPlan(id: string): Promise<{ success: boolean; error?: string }> {
    return svcDelete(`/api/affiliates/plans/${id}`);
}

// ─── Affiliate Profile Management ────────────────────────────────────────────

export async function getAffiliateProfile(): Promise<{ success: boolean; data?: AffiliateProfile | null; error?: string }> {
    try {
        const userId = await getUserId();
        return svcGet<AffiliateProfile>('/api/affiliates/profile', { userId });
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

export async function createAffiliateProfile(data: {
    code: string;
    commissionPlanId: string;
}): Promise<{ success: boolean; data?: AffiliateProfile; error?: string }> {
    try {
        const userId = await getUserId();
        return svcPost<AffiliateProfile>('/api/affiliates/profile', {
            userId,
            code: data.code,
            commissionPlanId: data.commissionPlanId,
        });
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

// ─── All Affiliates (Admin view) ─────────────────────────────────────────────

export async function getAllAffiliates(): Promise<{ success: boolean; data?: any[]; error?: string }> {
    return svcGet('/api/affiliates');
}
