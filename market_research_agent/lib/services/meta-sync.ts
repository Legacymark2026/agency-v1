import { prisma } from "@/lib/prisma";
import { createLead } from "@/modules/leads/actions/leads";

export const MetaService = {
    async getConnectedPages(userId: string, companyId?: string) {
        let pages: any[] = [];
        let hasAccountEntry = false;

        try {
            const user = await prisma.user.findUnique({
                where: { id: userId },
                include: { profile: true, accounts: true }
            });

            if (!user) return { pages: [], hasAccountEntry: false };

            const account = user.accounts.find(a => a.provider === 'facebook');
            hasAccountEntry = !!account;

            if (account && account.access_token) {
                console.log('[MetaSync] Found Facebook Account. Token Length:', account.access_token.length);
                try {
                    const response = await fetch(
                        `https://graph.facebook.com/v19.0/me/accounts?access_token=${account.access_token}`
                    );
                    const data = await response.json();

                    if (data.error) {
                        console.error('[MetaSync] Facebook API Error (getConnectedPages):', data.error);
                    } else {
                        pages = data.data || [];
                        console.log(`[MetaSync] Facebook Pages Found via API: ${pages.length}`);
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

                if (fbConfigObj && fbConfigObj.accessToken) {
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

        return { pages, hasAccountEntry };
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
            const response = await fetch(
                `https://graph.facebook.com/v19.0/${pageId}/messages?access_token=${accessToken}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        recipient: { id: recipientId },
                        message: { text: content },
                        messaging_type: 'RESPONSE'
                    })
                }
            );
            const data = await response.json();

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
            return {
                success: false,
                error: hasAccountEntry
                    ? "Meta account is connected, but no Facebook pages were found. Ensure you have granted page permissions and have a business page."
                    : "No Meta account connected for this workspace. Please connect Facebook in Settings > Integrations."
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

                if (messages.length > 0) {
                    const lastMessage = messages[messages.length - 1]; // Newest

                    // Determine sender (Lead)
                    // Logic: If message 'from' is NOT the page, it's the lead
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const leadData = messages.find((m: any) => m.from.id !== page.id)?.from;

                    if (leadData) {
                        // Find or Create Lead
                        let lead = await prisma.lead.findFirst({
                            where: {
                                companyId,
                                // For social, we might store the scoped ID in a social_id field, 
                                // but for now using a "fake" email based on ID if not exists
                                email: `${conv.platform === 'INSTAGRAM' ? 'ig' : 'fb'}-${leadData.id}@social.user`
                            }
                        });

                        if (!lead) {
                            const result = await createLead({
                                companyId,
                                name: leadData.username || leadData.name || 'Social User',
                                email: `${conv.platform === 'INSTAGRAM' ? 'ig' : 'fb'}-${leadData.id}@social.user`,
                                utmSource: conv.platform,
                                tags: [`${conv.platform.toLowerCase()}-inbound`]
                            });

                            if (result.success && result.data) {
                                lead = result.data as any;
                            } else {
                                console.error("[MetaSync] Could not use createLead, falling back to manual prisma insertion:", result.error);
                                lead = await prisma.lead.create({
                                    data: {
                                        companyId,
                                        name: leadData.username || leadData.name || 'Social User',
                                        email: `${conv.platform === 'INSTAGRAM' ? 'ig' : 'fb'}-${leadData.id}@social.user`,
                                        source: conv.platform,
                                        status: 'NEW'
                                    }
                                });
                            }
                        }

                        // Find or Create Conversation
                        let dbConv = await prisma.conversation.findFirst({
                            where: {
                                companyId,
                                leadId: lead.id,
                                channel: conv.platform
                            }
                        });

                        if (!dbConv) {
                            dbConv = await prisma.conversation.create({
                                data: {
                                    companyId,
                                    leadId: lead.id,
                                    channel: conv.platform,
                                    status: 'OPEN',
                                    lastMessageAt: new Date(lastMessage.created_time),
                                    lastMessagePreview: lastMessage.message || '[Media]',
                                    metadata: {
                                        pageId: page.id,
                                        recipientId: leadData.id
                                    }
                                }
                            });
                        } else {
                            // Update existing conversation metadata if needed
                            await prisma.conversation.update({
                                where: { id: dbConv.id },
                                data: {
                                    metadata: {
                                        pageId: page.id,
                                        recipientId: leadData.id
                                    }
                                }
                            });
                        }

                        // Sync Messages
                        let hasNewInbound = false;
                        for (const msg of messages) {
                            const exists = await prisma.message.findFirst({
                                where: {
                                    conversationId: dbConv!.id,
                                    content: msg.message || '[Media]',
                                    createdAt: new Date(msg.created_time)
                                }
                            });

                            if (!exists) {
                                const isOutbound = msg.from.id === page.id;
                                await prisma.message.create({
                                    data: {
                                        conversationId: dbConv!.id,
                                        content: msg.message || '[Media]',
                                        direction: isOutbound ? 'OUTBOUND' : 'INBOUND',
                                        status: 'SENT', // assumed
                                        senderId: isOutbound ? userId : lead.id,
                                        createdAt: new Date(msg.created_time)
                                    }
                                });
                                totalMessages++;
                                if (!isOutbound) hasNewInbound = true;
                            }
                        }
                        totalConversations++;

                        // Trigger Omnichannel AI Agent if there are new messages from the Lead
                        if (hasNewInbound) {
                            const { triggerOmnichannelAgent } = await import("@/lib/services/ai-inbox");
                            triggerOmnichannelAgent(dbConv!.id, companyId).catch(err => 
                                console.error("[MetaSync] AI Background Dispatch failed:", err)
                            );
                        }
                    }
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
