"use server";

import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { createLocalNotification } from "./notifications";

const GATEWAY_URL = process.env.API_GATEWAY_URL || "http://localhost:8080";

const safeRevalidate = (path: string) => {
    try {
        revalidatePath(path);
    } catch (e) {
        // Ignore in script context
    }
};

// Initialize Chat (Start Conversation)
export async function initializeChat(data: {
    name: string;
    email: string;
    message: string;
    visitorId: string; // From localStorage
    companyId?: string;
}) {
    const { name, email, message, visitorId, companyId: providedCompanyId } = data;

    try {
        // 0. Get CompanyId or default
        let companyId = providedCompanyId;
        if (!companyId) {
            const companyRes = await fetch(`${GATEWAY_URL}/api/admin/companies`); // default check if any public endpoint exists
            if (companyRes.ok) {
                const compData = await companyRes.json();
                if (compData.companies && compData.companies.length > 0) {
                    companyId = compData.companies[0].id;
                }
            }
        }

        // 1. Find existing conversation by platformId/channel
        let conversation;
        if (companyId) {
            const searchConvoRes = await fetch(`${GATEWAY_URL}/api/inbox/conversations?companyId=${companyId}&platformId=${visitorId}&channel=WEB_CHAT`);
            if (searchConvoRes.ok) {
                const searchConvoData = await searchConvoRes.json();
                if (searchConvoData.conversations && searchConvoData.conversations.length > 0) {
                    conversation = searchConvoData.conversations[0];
                }
            }
        }

        let lead;
        if (conversation?.lead) {
            lead = conversation.lead;
            if ((!lead.name && name) || (!lead.email && email)) {
                // Update lead details in CRM service
                const updateLeadRes = await fetch(`${GATEWAY_URL}/api/leads/${lead.id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        name: lead.name || name,
                        email: lead.email || email
                    })
                });
                if (updateLeadRes.ok) {
                    const leadData = await updateLeadRes.json();
                    lead = leadData.lead;
                }
            }
        } else {
            // Try to find lead by email in CRM service
            if (companyId) {
                const leadSearchRes = await fetch(`${GATEWAY_URL}/api/leads?companyId=${companyId}&search=${email}`);
                if (leadSearchRes.ok) {
                    const searchData = await leadSearchRes.json();
                    if (searchData.leads && searchData.leads.length > 0) {
                        lead = searchData.leads[0];
                    }
                }
            }

            if (!lead && companyId) {
                // Create new lead in CRM service
                const createLeadRes = await fetch(`${GATEWAY_URL}/api/leads`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        name,
                        email,
                        source: "WEB_CHAT",
                        status: "NEW",
                        companyId,
                    })
                });
                if (createLeadRes.ok) {
                    const leadData = await createLeadRes.json();
                    lead = leadData.lead;
                }
            }
        }

        if (!lead) throw new Error("Could not initialize lead for chat");
        if (!companyId) companyId = lead.companyId;

        // 4. Create or Update Conversation
        if (!conversation) {
            const createConvoRes = await fetch(`${GATEWAY_URL}/api/inbox/conversations`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ companyId, leadId: lead.id, channel: "WEB_CHAT" })
            });
            const convoData = await createConvoRes.json();
            if (!createConvoRes.ok) throw new Error(convoData.error || "Failed to create conversation");
            conversation = convoData.data;

            // Patch platformId and unreadCount
            const patchConvoRes = await fetch(`${GATEWAY_URL}/api/inbox/conversations/${conversation.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ platformId: visitorId, unreadCount: 1 })
            });
            if (patchConvoRes.ok) {
                const patchData = await patchConvoRes.json();
                conversation = patchData.data;
            }

            // Notify admins only for COMPLETELY NEW conversations
            try {
                // Fetch admins from admin-service or public list
                const adminsRes = await fetch(`${GATEWAY_URL}/api/admin/users?companyId=${companyId}&roles=admin,super_admin,content_manager`);
                if (adminsRes.ok) {
                    const adminsData = await adminsRes.json();
                    const admins = adminsData.users || [];
                    const notificationPromises = admins.map((admin: any) =>
                        createLocalNotification({
                            companyId: companyId!,
                            userId: admin.id,
                            type: 'NEW_MESSAGE',
                            title: `Nuevo chat de ${name || lead.name || email}`,
                            message: message.substring(0, 100),
                            link: `/dashboard/inbox?conversation=${conversation!.id}`
                        })
                    );
                    await Promise.all(notificationPromises);
                }
            } catch (notifError) {
                console.error("[chat] Failed to create notification:", notifError);
            }
        } else {
            // Re-open and link to lead
            const patchConvoRes = await fetch(`${GATEWAY_URL}/api/inbox/conversations/${conversation.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    status: "OPEN",
                    leadId: lead.id,
                    unreadCount: (conversation.unreadCount || 0) + 1
                })
            });
            if (patchConvoRes.ok) {
                const patchData = await patchConvoRes.json();
                conversation = patchData.data;
            }
        }

        if (!conversation) throw new Error("Conversation should exist after if/else");

        // 5. Create the initial message
        await fetch(`${GATEWAY_URL}/api/inbox/conversations/${conversation.id}/messages`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                content: message,
                direction: "INBOUND",
                status: "SENT",
                type: "TEXT",
            })
        });

        safeRevalidate("/dashboard/inbox");
        return {
            success: true,
            conversationId: conversation.id,
            visitorId: visitorId
        };
    } catch (error) {
        console.error("Error initializing chat:", error);
        return { success: false, error: "Failed to start chat" };
    }
}

// Send Message (Ongoing)
export async function sendMessage(conversationId: string, content: string, senderId?: string, mediaUrl?: string, mediaType?: string) {
    try {
        const convoRes = await fetch(`${GATEWAY_URL}/api/inbox/conversations/${conversationId}`);
        if (!convoRes.ok) {
            console.error("[sendMessage] Conversation not found:", conversationId);
            return { success: false, error: "Conversation not found" };
        }

        const direction = senderId ? "OUTBOUND" : "INBOUND";

        const msgRes = await fetch(`${GATEWAY_URL}/api/inbox/conversations/${conversationId}/messages`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                content,
                direction,
                senderId,
                status: "SENT",
                mediaUrl,
                mediaType,
                type: content ? "TEXT" : "MEDIA"
            })
        });

        if (!msgRes.ok) {
            return { success: false, error: "Failed to send message" };
        }

        safeRevalidate(`/dashboard/inbox/${conversationId}`);
        return { success: true };
    } catch (error) {
        console.error("Error sending message:", error);
        return { success: false, error: "Failed to send message" };
    }
}

// Get Messages (Polling)
export async function getMessages(conversationId: string) {
    try {
        const response = await fetch(`${GATEWAY_URL}/api/inbox/conversations/${conversationId}/messages`);
        const resData = await response.json();

        if (!response.ok) {
            return { success: false, data: [] };
        }

        const messages = resData.messages || [];
        const messagesWithAttachments = messages.map((m: any) => ({
            ...m,
            attachments: m.mediaUrl ? [{ url: m.mediaUrl, type: m.mediaType || 'DOCUMENT', name: 'Archivo' }] : []
        }));

        return { success: true, data: messagesWithAttachments };
    } catch (error) {
        console.error("Error getting messages:", error);
        return { success: false, data: [] };
    }
}

// Verify Conversation Exists
export async function verifyConversation(conversationId: string): Promise<boolean> {
    try {
        const response = await fetch(`${GATEWAY_URL}/api/inbox/conversations/${conversationId}`);
        return response.ok;
    } catch {
        return false;
    }
}
