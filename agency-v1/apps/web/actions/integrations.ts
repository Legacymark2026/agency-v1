'use server';

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath, unstable_noStore as noStore } from "next/cache";

export async function getConnectedIntegrations() {
    noStore(); // Disable caching for this server action
    const session = await auth();
    if (!session?.user) return [];

    const accounts = await prisma.account.findMany({
        where: { userId: session.user.id },
        select: {
            provider: true,
            providerAccountId: true,
            // createdAt: true, // Field does not exist on Account model
        }
    });

    // Map to a cleaner structure
    const providers = [
        {
            id: 'facebook',
            name: 'Meta (Facebook)',
            isConfigured: !!process.env.FACEBOOK_CLIENT_ID && !!process.env.FACEBOOK_CLIENT_SECRET
        }
    ];

    return providers.map(p => {
        const account = accounts.find(a => a.provider === p.id);
        return {
            provider: p.id,
            name: p.name,
            connected: !!account,
            accountId: account?.providerAccountId,
            isConfigured: p.isConfigured
        };
    });
}

export async function disconnectIntegration(provider: string) {
    const session = await auth();
    if (!session?.user) throw new Error("Unauthorized");

    const PROVIDER_ALIASES: Record<string, string[]> = {
        'facebook': ['facebook', 'facebook-page', 'meta-app', 'instagram-page'],
        'facebook-pixel': ['facebook-pixel', 'meta-pixel'],
        'tiktok-pixel': ['tiktok-pixel', 'tiktok-ads'],
        'tiktok-messages': ['tiktok-messages'],
        'linkedin-insight': ['linkedin-insight', 'linkedin-ads'],
        'linkedin-webhook': ['linkedin-webhook'],
        'whatsapp': ['whatsapp'],
        'google-ads': ['google-ads'],
        'google-analytics': ['google-analytics'],
        'google-tag-manager': ['google-tag-manager'],
        'hotjar': ['hotjar'],
    };

    const providersToDelete = PROVIDER_ALIASES[provider] || [provider];

    // Delete from Account table (NextAuth)
    await prisma.account.deleteMany({
        where: {
            userId: session.user.id,
            provider: { in: providersToDelete }
        }
    });

    // Also delete from IntegrationConfig (stores the accessToken)
    const activeCompanyId = session.user.companyId;
    
    if (activeCompanyId) {
        await prisma.integrationConfig.deleteMany({
            where: {
                companyId: activeCompanyId,
                provider: { in: providersToDelete }
            }
        });
    } else {
        const companyUser = await prisma.companyUser.findFirst({
            where: { userId: session.user.id },
            select: { companyId: true }
        });

        if (companyUser) {
            await prisma.integrationConfig.deleteMany({
                where: {
                    companyId: companyUser.companyId,
                    provider: { in: providersToDelete }
                }
            });
        }
    }

    revalidatePath('/dashboard/settings/integrations');
    return { success: true };
}

export async function saveIntegration(provider: string, config: any) {
    const session = await auth();
    if (!session?.user?.companyId) throw new Error("Unauthorized");
    
    await prisma.integrationConfig.upsert({
        where: { companyId_provider: { companyId: session.user.companyId, provider } },
        update: { config, isEnabled: true },
        create: {
            companyId: session.user.companyId,
            provider,
            config,
            isEnabled: true
        }
    });

    revalidatePath('/dashboard/settings/integrations');
    return { success: true };
}
