
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const GRAPH_API_VERSION = 'v19.0';
const BASE_URL = `https://graph.facebook.com/${GRAPH_API_VERSION}`;

interface PageAccessToken {
    id: string;
    name: string;
    access_token: string;
    category: string;
}

export class MetaService {

    /**
     * Get the User Access Token for the current logged-in user (if linked).
     */
    static async getUserAccessToken(userId: string): Promise<string | null> {
        const account = await prisma.account.findFirst({
            where: {
                userId,
                provider: 'facebook',
            },
            select: { access_token: true }
        });
        return account?.access_token || null;
    }

    /**
     * Get valid Page Access Tokens for all pages the user manages.
     */
    static async getConnectedPages(userId: string): Promise<PageAccessToken[]> {
        const userToken = await this.getUserAccessToken(userId);
        if (!userToken) return [];

        try {
            const response = await fetch(`${BASE_URL}/me/accounts?access_token=${userToken}`);
            const data = await response.json();

            if (data.error) {
                console.error("Meta Graph API Error:", data.error);
                return [];
            }

            return data.data as PageAccessToken[];
        } catch (error) {
            console.error("Failed to fetch pages:", error);
            return [];
        }
    }

    /**
     * Send a text message via Messenger API.
     */
    static async sendTextMessage(pageAccessToken: string, recipientId: string, text: string) {
        const url = `${BASE_URL}/me/messages?access_token=${pageAccessToken}`;

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                recipient: { id: recipientId },
                message: { text: text },
                messaging_type: "RESPONSE"
            })
        });

        const data = await response.json();
        if (data.error) {
            throw new Error(`Meta API Error: ${data.error.message}`);
        }
        return data;
    }

    /**
     * Get User Profile (Name, Photo) from PSID (Page Scoped ID).
     */
    static async getUserProfile(pageAccessToken: string, psid: string) {
        const url = `${BASE_URL}/${psid}?fields=first_name,last_name,profile_pic&access_token=${pageAccessToken}`;
        try {
            const response = await fetch(url);
            return await response.json();
        } catch (e) {
            console.error("Failed to fetch user profile", e);
            return { first_name: "Guest", last_name: "", profile_pic: "" };
        }
    }

    /**
     * Fetch Lead Details from LeadGen ID.
     */
    static async getLeadDetails(pageAccessToken: string, leadgenId: string) {
        // field_data cointains the form answers
        const url = `${BASE_URL}/${leadgenId}?fields=created_time,id,ad_id,form_id,field_data&access_token=${pageAccessToken}`;
        const response = await fetch(url);
        return await response.json();
    }

    /**
     * Fetch Ad Accounts for the user.
     */
    static async getAdAccounts(userAccessToken: string) {
        const url = `${BASE_URL}/me/adaccounts?fields=name,account_id,currency,amount_spent,account_status&access_token=${userAccessToken}`;
        const response = await fetch(url);
        return await response.json();
    }

    /**
     * Fetch Campaign Insights for an Ad Account.
     */
    static async getCampaignInsights(userAccessToken: string, adAccountId: string) {
        // act_<ACCOUNT_ID>/campaigns
        const url = `${BASE_URL}/act_${adAccountId}/campaigns?fields=id,name,status,objective,insights.date_preset(maximum){impressions,clicks,spend,cpc,ctr}&access_token=${userAccessToken}`;
        const response = await fetch(url);
        return await response.json();
    }

    /**
     * Send Server-Side Event (CAPI).
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    static async sendConversionEvent(pixelId: string, accessToken: string, eventName: string, userData: any, customData?: any) {
        const url = `${BASE_URL}/${pixelId}/events?access_token=${accessToken}`;

        const body = {
            data: [{
                event_name: eventName,
                event_time: Math.floor(Date.now() / 1000),
                action_source: "website",
                user_data: userData, // e.g. { em: hash(email), ph: hash(phone) }
                custom_data: customData
            }]
        };

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });

        return await response.json();
    }

    // ==================== INBOX INTEGRATION ====================

    /**
     * Get Page conversations (Messenger).
     * @param pageAccessToken - Page Access Token
     * @param pageId - Facebook Page ID
     * @param limit - Number of conversations to fetch (default: 25)
     */
    static async getPageConversations(pageAccessToken: string, pageId: string, limit: number = 25) {
        const url = `${BASE_URL}/${pageId}/conversations?fields=id,updated_time,participants,messages.limit(1){message,created_time,from}&limit=${limit}&access_token=${pageAccessToken}`;

        try {
            const response = await fetch(url);
            const data = await response.json();

            if (data.error) {
                console.error("Meta Graph API Error (getPageConversations):", data.error);
                return { data: [], paging: null };
            }

            return data;
        } catch (error) {
            console.error("Failed to fetch page conversations:", error);
            return { data: [], paging: null };
        }
    }

    /**
     * Get messages from a specific conversation.
     * @param conversationId - Facebook Conversation ID
     * @param pageAccessToken - Page Access Token
     * @param limit - Number of messages to fetch (default: 25)
     */
    static async getConversationMessages(conversationId: string, pageAccessToken: string, limit: number = 25) {
        const url = `${BASE_URL}/${conversationId}/messages?fields=id,message,created_time,from&limit=${limit}&access_token=${pageAccessToken}`;

        try {
            const response = await fetch(url);
            const data = await response.json();

            if (data.error) {
                console.error("Meta Graph API Error (getConversationMessages):", data.error);
                return { data: [], paging: null };
            }

            return data;
        } catch (error) {
            console.error("Failed to fetch conversation messages:", error);
            return { data: [], paging: null };
        }
    }

    /**
     * Get Instagram Business Account ID from a Facebook Page.
     * @param pageId - Facebook Page ID
     * @param pageAccessToken - Page Access Token
     */
    static async getInstagramAccountId(pageId: string, pageAccessToken: string): Promise<string | null> {
        const url = `${BASE_URL}/${pageId}?fields=instagram_business_account&access_token=${pageAccessToken}`;

        try {
            const response = await fetch(url);
            const data = await response.json();

            if (data.error || !data.instagram_business_account) {
                return null;
            }

            return data.instagram_business_account.id;
        } catch (error) {
            console.error("Failed to fetch Instagram account ID:", error);
            return null;
        }
    }

    /**
     * Get Instagram Direct conversations.
     * @param instagramAccountId - Instagram Business Account ID
     * @param pageAccessToken - Page Access Token
     * @param limit - Number of conversations to fetch (default: 25)
     */
    static async getInstagramConversations(instagramAccountId: string, pageAccessToken: string, limit: number = 25) {
        const url = `${BASE_URL}/${instagramAccountId}/conversations?fields=id,updated_time,participants,messages.limit(1){message,created_time,from}&limit=${limit}&access_token=${pageAccessToken}`;

        try {
            const response = await fetch(url);
            const data = await response.json();

            if (data.error) {
                console.error("Meta Graph API Error (getInstagramConversations):", data.error);
                return { data: [], paging: null };
            }

            return data;
        } catch (error) {
            console.error("Failed to fetch Instagram conversations:", error);
            return { data: [], paging: null };
        }
    }

    /**
     * Send a reply to a Messenger or Instagram conversation.
     * @param recipientId - PSID (Page Scoped ID) or Instagram Scoped ID
     * @param message - Message text to send
     * @param pageAccessToken - Page Access Token
     */
    static async sendReply(recipientId: string, message: string, pageAccessToken: string) {
        return await this.sendTextMessage(pageAccessToken, recipientId, message);
    }
}
