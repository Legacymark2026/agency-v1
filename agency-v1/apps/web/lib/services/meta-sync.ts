import { prisma } from "@/lib/prisma";
import { getMetaAppConfig, getFacebookPageConfig } from "@/actions/integration-config";

export const MetaService = {
    async getConnectedPages(userId: string, companyId?: string) {
        let pages: any[] = [];
        let hasAccountEntry = false;

        try {
            // FIRST: Try new family config (meta-app + facebook-page)
            if (companyId) {
                const metaApp = await getMetaAppConfig(companyId);
                const fbPage = await getFacebookPageConfig(companyId);
                
                if (fbPage?.manualPageId && fbPage?.manualPageToken) {
                    console.log('[MetaSync] Using NEW family config: facebook-page');
                    pages.push({
                        id: fbPage.manualPageId,
                        name: 'Manual Page',
                        category: 'Page',
                        access_token: fbPage.manualPageToken
                    });
                    hasAccountEntry = true;
                    return { pages, hasAccountEntry };
                }
                
                if (metaApp?.appId && fbPage?.accessToken) {
                    console.log('[MetaSync] Using NEW family config: meta-app + facebook-page');
                    hasAccountEntry = true;
                    // Try to fetch pages with the page access token
                    try {
                        const response = await fetch(
                            `https://graph.facebook.com/v19.0/me/accounts?access_token=${fbPage.accessToken}&fields=id,name,category,access_token`
                        );
                        const data = await response.json();
                        if (data.data) {
                            pages = data.data;
                        }
                    } catch (e) {
                        console.error('[MetaSync] Error fetching pages from new config:', e);
                    }
                    return { pages, hasAccountEntry };
                }
            }
            
            // FALLBACK: Try legacy NextAuth account
            const user = await prisma.user.findUnique({
                where: { id: userId },
                include: { profile: true, accounts: true }
            });

            if (!user) return { pages: [], hasAccountEntry: false };

            const account = user.accounts.find(a => a.provider === 'facebook');
            hasAccountEntry = !!account;

            if (account && account.access_token) {
                console.log('[MetaSync] Found Facebook Account. Token Length:', account.access_token.length);
                
                // First, verify the token is valid by checking /me
                try {
                    const meResponse = await fetch(
                        `https://graph.facebook.com/v19.0/me?access_token=${account.access_token}`
                    );
                    const meData = await meResponse.json();
                    
                    if (meData.error) {
                        console.error('[MetaSync] Token invalid or expired:', meData.error.message);
                        // Try to refresh or indicate issue
                    } else {
                        console.log('[MetaSync] Token valid for user:', meData.name || meData.id);
                    }
                } catch (e) {
                    console.error('[MetaSync] Error validating token:', e);
                }
                
                try {
                    const response = await fetch(
                        `https://graph.facebook.com/v19.0/me/accounts?access_token=${account.access_token}&fields=id,name,category,access_token`
                    );
                    const data = await response.json();

                    if (data.error) {
                        console.error('[MetaSync] Facebook API Error (getConnectedPages):', data.error);
                        // More specific error handling
                        if (data.error?.code === 190) {
                            console.error('[MetaSync] Token expired or invalidated. User needs to reconnect Facebook.');
                            return { pages: [], hasAccountEntry: true, error: 'token_expired' };
                        }
                    } else {
                        pages = data.data || [];
                        console.log(`[MetaSync] Facebook Pages Found via API: ${pages.length}`);
                        if (pages.length > 0) {
                            console.log('[MetaSync] Page IDs:', pages.map(p => p.id).join(', '));
                        }
                    }
                } catch (error) {
                    console.error('[MetaSync] Error fetching pages:', error);
                }
            } else {
                console.log('[MetaSync] No Facebook OAuth account or token found, checking manual fallbacks.');
            }

            // --- MANUAL OVERRIDE CHECK (From Profile Metadata) ---
            const profile = user.profile;
            if (profile && profile.metadata) {
                const meta = profile.metadata as any;
                if (meta.manualConnectedPageId) {
                    console.log(`[MetaSync] Found MANUAL PAGE override: ${meta.manualConnectedPageId}`);
                    const exists = pages.find((p: any) => p.id === meta.manualConnectedPageId);
                    if (!exists) {
                        pages.push({
                            id: meta.manualConnectedPageId,
                            name: meta.manualConnectedPageName || 'Manually Linked Page',
                            category: 'Manual Link',
                            tasks: ['MANAGE', 'MESSAGING'],
                            access_token: meta.manualConnectedPageToken
                        });
                        console.log('[MetaSync] Injected profile manual page into sync list.');
                    }
                }
            }

            // --- MANUAL OVERRIDE CHECK (From IntegrationConfig) ---
            if (pages.length === 0 && companyId) {
                const fallbackConfig = await prisma.integrationConfig.findFirst({
                    where: { provider: 'facebook', companyId }
                });

                const fbConfigObj = fallbackConfig?.config as any;

                // First try: manualPageId + manualPageToken (new fields from UI)
                if (fbConfigObj?.manualPageId && fbConfigObj?.manualPageToken) {
                    console.log(`[MetaSync] Using MANUAL Page config: ${fbConfigObj.manualPageId}`);
                    pages.push({
                        id: fbConfigObj.manualPageId,
                        name: 'Manual Page',
                        category: 'Page',
                        tasks: ['MANAGE', 'MESSAGING'],
                        access_token: fbConfigObj.manualPageToken
                    });
                    console.log('[MetaSync] Added manual page from IntegrationConfig.');
                }
                // Second try: old accessToken fallback
                else if (fbConfigObj && fbConfigObj.accessToken) {
                    console.log('[MetaSync] API returned 0 pages, trying manual accessToken from IntegrationConfig.');
                    // Use the token to fetch "me/accounts" since OAuth gives a User token.
                    const accountsRes = await fetch(`https://graph.facebook.com/v19.0/me/accounts?access_token=${fbConfigObj.accessToken}`);
                    const accountsData = await accountsRes.json();

                    if (accountsData.error) {
                        console.error('[MetaSync] Fallback IntegrationConfig token error:', accountsData.error);
                    } else if (accountsData.data && accountsData.data.length > 0) {
                        pages.push(...accountsData.data);
                        console.log(`[MetaSync] Recovered ${accountsData.data.length} Pages via IntegrationConfig token fallback.`);
                    } else {
                        console.log('[MetaSync] Fallback token valid but no pages found.');
                    }
                }
            }

        } catch (e) {
            console.error('[MetaSync] Fatal Error in getConnectedPages:', e);
        }

        return { pages, hasAccountEntry, tokenError: (pages.length === 0 && hasAccountEntry) ? 'no_pages' : undefined };
    },

    // 2. Get conversations for a page (Generic)
    async getPageConversations(pageId: string, accessToken: string, platform: 'instagram' | 'messenger' = 'messenger', folder: 'inbox' | 'general' = 'inbox') {
        try {
            // Note: 'folder' param support varies by version/platform, but we try it for IG 'general'
            let url = platform === 'instagram'
                ? `https://graph.facebook.com/v19.0/${pageId}/conversations?platform=instagram&access_token=${accessToken}`
                : `https://graph.facebook.com/v19.0/${pageId}/conversations?platform=messenger&access_token=${accessToken}`;

            if (platform === 'instagram' && folder === 'general') {
                url += '&folder=general';
            }

            console.log(`[MetaSync] Fetching ${platform} conversations (${folder})...`);
            const response = await fetch(url);
            const data = await response.json();

            if (data.error) {
                // Ignore "folder not found" errors casually
                if (data.error.code !== 10 && data.error.code !== 100) {
                    console.log(`[MetaSync] Waring fetching ${platform}/${folder}:`, data.error.message);
                }
                return [];
            }

            return data.data || [];
        } catch (error) {
            console.error(`Error fetching ${platform} conversations:`, error);
            return [];
        }
    },

    // 3. Get messages for a conversation
    async getConversationMessages(conversationId: string, accessToken: string) {
        try {
            const response = await fetch(
                `https://graph.facebook.com/v19.0/${conversationId}/messages?fields=id,message,created_time,from,to,attachments&access_token=${accessToken}`
            );
            const data = await response.json();
            return data.data || [];
        } catch (error) {
            console.error('Error fetching messages:', error);
            return [];
        }
    },

    // 4. Get Page Access Token (Needed for syncing)
    async getPageAccessToken(pageId: string, userAccessToken: string) {
        try {
            const response = await fetch(
                `https://graph.facebook.com/v19.0/${pageId}?fields=access_token&access_token=${userAccessToken}`
            );
            const data = await response.json();
            return data.access_token;
        } catch (error) {
            console.error('Error fetching page access token:', error);
            return null;
        }
    },

    // 5. Send Reply (New)
    async sendReply(recipientId: string, pageId: string, content: string, accessToken: string) {
        try {
            const payload = {
                recipient: { id: recipientId },
                message: { text: content },
                messaging_type: 'RESPONSE'
            };

            let response = await fetch(
                `https://graph.facebook.com/v19.0/${pageId}/messages?access_token=${accessToken}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                }
            );
            let data = await response.json();

            // Handle Meta 24-hour window limit specifically (Error Code 10, Subcode 2018278)
            if (data.error && data.error.code === 10) {
                console.log("[MetaSync] 24h window limit hit. Retrying with HUMAN_AGENT tag...");
                const retryPayload = {
                    ...payload,
                    messaging_type: 'MESSAGE_TAG',
                    tag: 'HUMAN_AGENT'
                };
                
                response = await fetch(
                    `https://graph.facebook.com/v19.0/${pageId}/messages?access_token=${accessToken}`,
                    {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(retryPayload)
                    }
                );
                data = await response.json();
            }

            if (data.error) {
                console.error('[MetaSync] Error sending reply:', data.error);
                return { success: false, error: data.error };
            }

            return { success: true, data };
        } catch (error) {
            console.error('[MetaSync] Exception sending reply:', error);
            return { success: false, error };
        }
    }
};

export const MetaSyncService = {
    async syncAllConversations(userId: string, companyId: string) {
        console.log(`[MetaSync] Starting sync for user ${userId} in company ${companyId}`);

        // 1. Get user's pages
        const { pages, hasAccountEntry } = await MetaService.getConnectedPages(userId, companyId);

        if (pages.length === 0) {
            console.error('[MetaSync] No pages found. Aborting.');
            
            // More helpful error message
            let errorMsg = hasAccountEntry
                ? "Meta account is connected, but no Facebook pages were found. Ensure you have granted page permissions and have a business page."
                : "No Meta account connected for this workspace. Please connect Facebook in Settings > Integrations.";
            
            // Check if there's a token but no pages - likely permissions issue
            if (hasAccountEntry) {
                // The token exists but returned no pages - this usually means:
                // 1. User has no pages
                // 2. User is not an admin of any page
                // 3. Token doesn't have pages_show_list scope (should be in OAuth)
                errorMsg = "Meta account connected but no pages found. Possible causes:\n" +
                    "1. You don't have any Facebook Page\n" +
                    "2. You're not an admin of the Page\n" +
                    "3. The Page is unpublished\n\n" +
                    "Go to Facebook > Pages and create or verify your page admin status.";
            }
            
            return {
                success: false,
                error: errorMsg
            };
        }

        let totalConversations = 0;
        let totalMessages = 0;
        const account = await prisma.account.findFirst({
            where: { userId, provider: 'facebook' }
        });

        // 2. Iterate pages
        for (const page of pages) {
            console.log(`[MetaSync] Processing page: ${page.name} (${page.id})`);

            // Use existing token (from manual override) or fetch new one
            let pageAccessToken = (page as any).access_token;
            if (!pageAccessToken && account?.access_token) {
                pageAccessToken = await MetaService.getPageAccessToken(page.id, account.access_token);
            }

            if (!pageAccessToken) {
                console.error(`[MetaSync] Could not get Access Token for page ${page.id}. Disconnected or missing token.`);
                continue;
            }

            // 3. Get Conversations (BOTH Instagram & Messenger)
            console.log(`[MetaSync] Fetching ${page.name} conversations (IG + FB)...`);

            // IG: Primary + General
            const igInbox = await MetaService.getPageConversations(page.id, pageAccessToken, 'instagram', 'inbox');
            console.log(`[MetaSync] IG Inbox Count: ${igInbox.length}`);

            const igGeneral = await MetaService.getPageConversations(page.id, pageAccessToken, 'instagram', 'general');
            console.log(`[MetaSync] IG General Count: ${igGeneral.length}`);

            const igConversations = [...igInbox, ...igGeneral];

            const messengerConversations = await MetaService.getPageConversations(page.id, pageAccessToken, 'messenger', 'inbox');
            console.log(`[MetaSync] Messenger Count: ${messengerConversations.length}`);

            const allConversations = [
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                ...igConversations.map((c: any) => ({ ...c, platform: 'INSTAGRAM' })),
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                ...messengerConversations.map((c: any) => ({ ...c, platform: 'MESSENGER' }))
            ];

            console.log(`[MetaSync] Found ${allConversations.length} total conversations for page ${page.name}`);

            for (const conv of allConversations) {
                // 4. Find or Create Lead/Conversation in our DB
                const messages = await MetaService.getConversationMessages(conv.id, pageAccessToken);

                if (messages.length === 0) continue;

                const lastMessage = messages[messages.length - 1];
                const leadData = messages.find((m: any) => m.from.id !== page.id)?.from;
                if (!leadData) continue;

                const placeholderEmail = `${conv.platform === 'INSTAGRAM' ? 'ig' : 'fb'}-${leadData.id}@social.user`;

                // Atomic upsert for Lead — uses [companyId, email] unique constraint
                const lead = await prisma.lead.upsert({
                    where: { companyId_email: { companyId, email: placeholderEmail } },
                    update: {},
                    create: {
                        companyId,
                        email: placeholderEmail,
                        name: leadData.username || leadData.name || 'Social User',
                        source: conv.platform,
                        utmSource: conv.platform,
                        tags: [`${conv.platform.toLowerCase()}-inbound`],
                        status: 'NEW',
                    },
                });

                // Atomic upsert for Conversation — uses [platformId, channel] unique constraint
                // platformId is the Meta thread/conversation id (conv.id), stable across syncs.
                const dbConv = await prisma.conversation.upsert({
                    where: { platformId_channel: { platformId: conv.id, channel: conv.platform } },
                    update: {
                        status: 'OPEN',
                        lastMessageAt: new Date(lastMessage.created_time),
                        lastMessagePreview: lastMessage.message || '[Media]',
                        leadId: lead.id,
                        metadata: { pageId: page.id, recipientId: leadData.id },
                    },
                    create: {
                        companyId,
                        leadId: lead.id,
                        channel: conv.platform,
                        platformId: conv.id,
                        status: 'OPEN',
                        lastMessageAt: new Date(lastMessage.created_time),
                        lastMessagePreview: lastMessage.message || '[Media]',
                        metadata: { pageId: page.id, recipientId: leadData.id },
                    },
                });

                // Sync messages atomically per conversation. Deduplication uses
                // the [externalId, conversationId] unique constraint shared with
                // the inbound webhook (route.ts), so the two paths cannot create
                // duplicates of the same message.
                let createdInThisBatch = 0;
                let hasNewInbound = false;

                await prisma.$transaction(async tx => {
                    for (const msg of messages) {
                        const isOutbound = msg.from.id === page.id;
                        try {
                            await tx.message.create({
                                data: {
                                    conversationId: dbConv.id,
                                    externalId: msg.id,
                                    content: msg.message || '[Media]',
                                    direction: isOutbound ? 'OUTBOUND' : 'INBOUND',
                                    status: 'SENT',
                                    senderId: isOutbound ? userId : lead.id,
                                    createdAt: new Date(msg.created_time),
                                    metadata: { platformMessageId: msg.id, pageId: page.id },
                                },
                            });
                            createdInThisBatch++;
                            if (!isOutbound) hasNewInbound = true;
                        } catch (e: any) {
                            // P2002 = unique constraint violation → already synced, skip
                            if (e?.code !== 'P2002') throw e;
                        }
                    }
                });

                totalMessages += createdInThisBatch;
                totalConversations++;

                if (hasNewInbound) {
                    const { triggerOmnichannelAgent } = await import("@/lib/services/ai-inbox");
                    triggerOmnichannelAgent(dbConv.id, companyId).catch(err =>
                        console.error("[MetaSync] AI Background Dispatch failed:", err)
                    );
                }
            }
        }

        return {
            success: true,
            conversationsSynced: totalConversations,
            messagesSynced: totalMessages
        };
    }
};
