'use server';

import { auth } from "@/lib/auth";
import { revalidatePath, unstable_noStore as noStore } from "next/cache";

const API_GATEWAY_URL = process.env.API_GATEWAY_URL || 'http://localhost:8080';

export async function getConnectedIntegrations() {
    noStore(); // Disable caching for this server action
    const session = await auth();
    if (!session?.user) return [];

    try {
        const response = await fetch(`${API_GATEWAY_URL}/api/integrations/accounts?userId=${session.user.id}`, {
            cache: 'no-store'
        });
        if (!response.ok) {
            console.error("[getConnectedIntegrations] Failed to fetch accounts from gateway:", response.statusText);
            return [];
        }
        
        const { accounts } = await response.json();

        // Map to a cleaner structure
        const providers = [
            {
                id: 'facebook',
                name: 'Meta (Facebook)',
                isConfigured: !!process.env.FACEBOOK_CLIENT_ID && !!process.env.FACEBOOK_CLIENT_SECRET
            }
        ];

        return providers.map(p => {
            const account = accounts.find((a: any) => a.provider === p.id);
            return {
                provider: p.id,
                name: p.name,
                connected: !!account,
                accountId: account?.providerAccountId,
                isConfigured: p.isConfigured
            };
        });
    } catch (e) {
        console.error("[getConnectedIntegrations] Error:", e);
        return [];
    }
}

export async function disconnectIntegration(provider: string) {
    const session = await auth();
    if (!session?.user) throw new Error("Unauthorized");

    const response = await fetch(`${API_GATEWAY_URL}/api/integrations/accounts`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            userId: session.user.id,
            provider,
            companyId: session.user.companyId
        })
    });

    if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || "Failed to disconnect integration");
    }

    revalidatePath('/dashboard/settings/integrations');
    return { success: true };
}

export async function saveIntegration(provider: string, config: any) {
    const session = await auth();
    if (!session?.user?.companyId) throw new Error("Unauthorized");
    
    const response = await fetch(`${API_GATEWAY_URL}/api/integrations/config`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            companyId: session.user.companyId,
            provider,
            config
        })
    });

    if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || "Failed to save integration");
    }

    revalidatePath('/dashboard/settings/integrations');
    return { success: true };
}

// ─────────────────────────────────────────────────────────────────────────────
// WhatsApp & Email Domains Actions (Fase 2)
// ─────────────────────────────────────────────────────────────────────────────

export async function connectWhatsApp(data: { wabaId: string; phoneNumberId: string; phoneNumber: string; accessToken: string }) {
    const session = await auth();
    if (!session?.user?.companyId) return { success: false, error: "Unauthorized" };

    try {
        const response = await fetch(`${API_GATEWAY_URL}/api/integrations/whatsapp`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                companyId: session.user.companyId,
                wabaId: data.wabaId,
                phoneNumberId: data.phoneNumberId,
                phoneNumber: data.phoneNumber,
                accessToken: data.accessToken
            })
        });

        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            return { success: false, error: err.error || "Failed to connect WhatsApp" };
        }

        revalidatePath('/dashboard/settings/integrations');
        return { success: true };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

export async function createEmailDomainVerification(domain: string) {
    const session = await auth();
    if (!session?.user?.companyId) return { success: false, error: "Unauthorized" };

    try {
        // Check domain existence
        const checkResponse = await fetch(`${API_GATEWAY_URL}/api/integrations/domains/${domain}`, {
            cache: 'no-store'
        });
        
        if (checkResponse.ok) {
            const existing = await checkResponse.json();
            if (existing && existing.companyId !== session.user.companyId) {
                return { success: false, error: "Este dominio ya está en uso por otra empresa." };
            }
        }

        // Mocking DNS records that the user should add. 
        // In a real scenario, this would call Resend/AWS SES API.
        const mockDnsRecords = [
            { type: 'TXT', host: `_resend.${domain}`, value: 'resend-k123abc' },
            { type: 'TXT', host: domain, value: 'v=spf1 include:resend.com ~all' }
        ];

        const response = await fetch(`${API_GATEWAY_URL}/api/integrations/domains`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                companyId: session.user.companyId,
                domain,
                dnsRecords: mockDnsRecords,
                status: 'pending'
            })
        });

        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            return { success: false, error: err.error || "Failed to create email domain verification" };
        }

        revalidatePath('/dashboard/settings/integrations');
        return { success: true, records: mockDnsRecords };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

