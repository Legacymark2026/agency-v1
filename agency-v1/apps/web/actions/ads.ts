'use server';

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { MetaService } from "@/lib/meta-service";

export async function getMarketingData() {
    const session = await auth();
    if (!session?.user) return null;

    // 1. Get User Token
    const userId = session.user.id;
    if (!userId) return { error: "User ID not found" };

    const userToken = await MetaService.getUserAccessToken(userId);
    if (!userToken) return { error: "Meta account not connected" };

    // 2. Fetch Ad Accounts
    const adAccounts = await MetaService.getAdAccounts(userToken);

    if (adAccounts.data && adAccounts.data.length > 0) {
        // For MVP, just fetch insights for the first active account
        const account = adAccounts.data[0];
        const campaigns = await MetaService.getCampaignInsights(userToken, account.account_id);

        return {
            account: account,
            campaigns: campaigns.data || []
        };
    }

    return { error: "No Ad Accounts found" };
}
