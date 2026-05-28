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
        // Check domain existence in our DB
        const checkResponse = await fetch(`${API_GATEWAY_URL}/api/integrations/domains/${domain}`, {
            cache: 'no-store'
        });
        
        if (checkResponse.ok) {
            const existing = await checkResponse.json();
            if (existing && existing.companyId !== session.user.companyId) {
                return { success: false, error: "Este dominio ya está en uso por otra empresa." };
            }
        }

        const resendApiKey = process.env.RESEND_API_KEY;

        if (!resendApiKey) {
            return {
                success: false,
                error: "La verificación de dominios de email requiere una API Key de Resend. Configura RESEND_API_KEY en las variables de entorno del servidor para habilitar esta funcionalidad.",
            };
        }

        // ── Real Resend API call ──────────────────────────────────────────────
        // Try to create the domain in Resend (idempotent — returns existing if already registered)
        const resendRes = await fetch('https://api.resend.com/domains', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${resendApiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ name: domain }),
        });

        const resendData = await resendRes.json();

        if (!resendRes.ok) {
            // Domain may already exist — try to get it
            if (resendRes.status === 422 || resendData?.name === 'already_exists') {
                // Fetch existing domain details
                const listRes = await fetch('https://api.resend.com/domains', {
                    headers: { Authorization: `Bearer ${resendApiKey}` },
                });
                if (listRes.ok) {
                    const listData = await listRes.json();
                    const existingDomain = listData?.data?.find((d: any) => d.name === domain);
                    if (existingDomain) {
                        // Fetch full domain details with DNS records
                        const detailRes = await fetch(`https://api.resend.com/domains/${existingDomain.id}`, {
                            headers: { Authorization: `Bearer ${resendApiKey}` },
                        });
                        if (detailRes.ok) {
                            const detail = await detailRes.json();
                            const dnsRecords = (detail.records || []).map((r: any) => ({
                                type: r.type,
                                host: r.name,
                                value: r.value,
                                ttl: r.ttl,
                                priority: r.priority,
                                status: r.status,
                            }));
                            await saveAndReturn(dnsRecords, detail.status || 'pending');
                            return { success: true, records: dnsRecords, resendId: existingDomain.id, status: detail.status };
                        }
                    }
                }
            }

            const errMsg = resendData?.message || resendData?.error || `Error de Resend: HTTP ${resendRes.status}`;
            return { success: false, error: errMsg };
        }

        // Map Resend DNS records to our format
        const dnsRecords = (resendData.records || []).map((r: any) => ({
            type: r.type,
            host: r.name,
            value: r.value,
            ttl: r.ttl,
            priority: r.priority,
            status: r.status,
        }));

        await saveAndReturn(dnsRecords, resendData.status || 'pending');
        return { success: true, records: dnsRecords, resendId: resendData.id, status: resendData.status };

        // ─────────────────────────────────────────────────────────────────────
        async function saveAndReturn(records: any[], status: string) {
            await fetch(`${API_GATEWAY_URL}/api/integrations/domains`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    companyId: session!.user!.companyId,
                    domain,
                    dnsRecords: records,
                    status,
                }),
            });
            revalidatePath('/dashboard/settings/integrations');
        }

    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

