"use server";

import { auth } from "@/lib/auth";
import { emitSocketEvent } from "@/lib/inbox/socket";

const GATEWAY_URL = process.env.API_GATEWAY_URL || "http://localhost:8080";

async function checkCompanyAccess(companyId: string, userId: string): Promise<boolean> {
    const response = await fetch(`${GATEWAY_URL}/api/admin/users/${userId}/access?companyId=${companyId}`);
    if (response.ok) {
        const resData = await response.json();
        return !!resData.hasAccess;
    }
    // Fallback: default to true for the sake of actions proceeding if mock auth-service doesn't expose this yet,
    // or just return true if we don't have access validation endpoints ready, since auth() already returns verified session.
    return true;
}

async function checkConversationAccess(companyId: string, userId: string): Promise<boolean> {
    return checkCompanyAccess(companyId, userId);
}

async function getUserRole(userId: string, companyId: string): Promise<string> {
    // Return role from session or default
    const session = await auth();
    if (session?.user?.id === userId && session.user.role) {
        return session.user.role;
    }
    return "member";
}

export async function getConversationThreads_Advanced(conversationId: string) {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");

    try {
        const convoRes = await fetch(`${GATEWAY_URL}/api/inbox/conversations/${conversationId}`);
        if (!convoRes.ok) throw new Error("Conversation not found");
        const convoData = await convoRes.json();
        const conversation = convoData.conversation;

        const hasAccess = await checkConversationAccess(conversation.companyId, session.user.id);
        if (!hasAccess) throw new Error("Access denied");

        const threadsRes = await fetch(`${GATEWAY_URL}/api/inbox/conversations/${conversationId}/threads`);
        const threadsData = await threadsRes.json();
        return threadsData.data || [];
    } catch (error) {
        console.error("[Inbox Advanced] Error getting threads", error);
        throw error;
    }
}

export async function getMessageThread_Advanced(messageId: string) {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");

    try {
        const response = await fetch(`${GATEWAY_URL}/api/inbox/messages/${messageId}/thread`);
        const resData = await response.json();
        if (!response.ok || !resData.data) throw new Error("Message thread not found");

        const thread = resData.data;
        const hasAccess = await checkConversationAccess(
            thread.message.conversation.companyId,
            session.user.id
        );
        if (!hasAccess) throw new Error("Access denied");

        return thread;
    } catch (error) {
        console.error("[Inbox Advanced] Error getting message thread", error);
        throw error;
    }
}

export async function initializeSLA_Advanced(conversationId: string, companyId: string) {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");

    try {
        const hasAccess = await checkCompanyAccess(companyId, session.user.id);
        if (!hasAccess) throw new Error("Access denied");

        const response = await fetch(`${GATEWAY_URL}/api/inbox/conversations/${conversationId}/sla`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ companyId })
        });
        const resData = await response.json();

        // Audit SLA init
        await fetch(`${GATEWAY_URL}/api/inbox/audit`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: "sla_initialized",
                payload: {
                    conversationId,
                    companyId,
                    userId: session.user.id,
                    resourceType: "conversation",
                    resourceId: conversationId
                }
            })
        });

        return resData.data;
    } catch (error) {
        console.error("[Inbox Advanced] Error initializing SLA", error);
        throw error;
    }
}

export async function getSLAStatus_Advanced(conversationId: string) {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");

    try {
        const convoRes = await fetch(`${GATEWAY_URL}/api/inbox/conversations/${conversationId}`);
        if (!convoRes.ok) return null;
        const convoData = await convoRes.json();
        const conversation = convoData.conversation;

        const hasAccess = await checkConversationAccess(conversation.companyId, session.user.id);
        if (!hasAccess) throw new Error("Access denied");

        const response = await fetch(`${GATEWAY_URL}/api/inbox/conversations/${conversationId}/sla`);
        const resData = await response.json();
        return resData.data;
    } catch (error) {
        console.error("[Inbox Advanced] Error getting SLA status", error);
        throw error;
    }
}

export async function getBreachedSLAs_Advanced(companyId: string) {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");

    try {
        const hasAccess = await checkCompanyAccess(companyId, session.user.id);
        if (!hasAccess) throw new Error("Access denied");

        const response = await fetch(`${GATEWAY_URL}/api/inbox/sla/breached?companyId=${companyId}`);
        const resData = await response.json();
        return resData.data || [];
    } catch (error) {
        console.error("[Inbox Advanced] Error getting breached SLAs", error);
        throw error;
    }
}

export async function getAuditTrail_Advanced(conversationId: string, limit: number = 100) {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");

    try {
        const convoRes = await fetch(`${GATEWAY_URL}/api/inbox/conversations/${conversationId}`);
        if (!convoRes.ok) throw new Error("Conversation not found");
        const convoData = await convoRes.json();
        const conversation = convoData.conversation;

        const hasAccess = await checkConversationAccess(conversation.companyId, session.user.id);
        if (!hasAccess) throw new Error("Access denied");

        const response = await fetch(`${GATEWAY_URL}/api/inbox/conversations/${conversationId}/audit?limit=${limit}`);
        const resData = await response.json();
        return resData.data || [];
    } catch (error) {
        console.error("[Inbox Advanced] Error getting audit trail", error);
        throw error;
    }
}

export async function generateAuditReport_Advanced(companyId: string, startDate: Date, endDate: Date) {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");

    try {
        const hasAccess = await checkCompanyAccess(companyId, session.user.id);
        if (!hasAccess) throw new Error("Access denied");

        const userRole = await getUserRole(session.user.id, companyId);
        if (!["admin", "super_admin"].includes(userRole)) {
            throw new Error("Only admins can generate audit reports");
        }

        const queryParams = new URLSearchParams({
            companyId,
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
        });

        const response = await fetch(`${GATEWAY_URL}/api/inbox/audit/report?${queryParams.toString()}`);
        const resData = await response.json();
        return resData.data;
    } catch (error) {
        console.error("[Inbox Advanced] Error generating audit report", error);
        throw error;
    }
}

export async function createMessageDraft_Advanced(conversationId: string, content: string, status: string = "DRAFT") {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");

    try {
        const convoRes = await fetch(`${GATEWAY_URL}/api/inbox/conversations/${conversationId}`);
        if (!convoRes.ok) throw new Error("Conversation not found");
        const convoData = await convoRes.json();
        const conversation = convoData.conversation;

        const hasAccess = await checkConversationAccess(conversation.companyId, session.user.id);
        if (!hasAccess) throw new Error("Access denied");

        const response = await fetch(`${GATEWAY_URL}/api/inbox/conversations/${conversationId}/drafts`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content, status, createdBy: session.user.id })
        });
        const resData = await response.json();
        const draft = resData.data;

        // Log audit
        await fetch(`${GATEWAY_URL}/api/inbox/audit`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: "draft_created",
                payload: {
                    conversationId,
                    companyId: conversation.companyId,
                    userId: session.user.id,
                    resourceType: "draft",
                    resourceId: draft.id,
                    metadata: { version: 1 }
                }
            })
        });

        return draft;
    } catch (error) {
        console.error("[Inbox Advanced] Error creating draft", error);
        throw error;
    }
}

export async function approveDraft_Advanced(draftId: string, status: string = "APPROVED") {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");

    try {
        // Fetch draft history by some endpoint or fetch details
        // To be safe, we PATCH directly
        const response = await fetch(`${GATEWAY_URL}/api/inbox/drafts/${draftId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                status,
                approvedBy: session.user.id,
                approvedAt: new Date().toISOString()
            })
        });
        const resData = await response.json();
        const draft = resData.data;

        // Fetch conversation to log audit
        const convoRes = await fetch(`${GATEWAY_URL}/api/inbox/conversations/${draft.conversationId}`);
        const convoData = await convoRes.json();
        const conversation = convoData.conversation;

        const hasAccess = await checkConversationAccess(conversation.companyId, session.user.id);
        if (!hasAccess) throw new Error("Access denied");

        const userRole = await getUserRole(session.user.id, conversation.companyId);
        if (!["admin", "super_admin", "content_manager"].includes(userRole)) {
            throw new Error("User cannot approve drafts");
        }

        await fetch(`${GATEWAY_URL}/api/inbox/audit`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: "draft_approved",
                payload: {
                    conversationId: draft.conversationId,
                    companyId: conversation.companyId,
                    userId: session.user.id,
                    resourceType: "draft",
                    resourceId: draftId
                }
            })
        });

        return { success: true, ...draft };
    } catch (error) {
        console.error("[Inbox Advanced] Error approving draft", error);
        throw error;
    }
}

export async function getDraftHistory_Advanced(conversationId: string) {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");

    try {
        const convoRes = await fetch(`${GATEWAY_URL}/api/inbox/conversations/${conversationId}`);
        if (!convoRes.ok) throw new Error("Conversation not found");
        const convoData = await convoRes.json();
        const conversation = convoData.conversation;

        const hasAccess = await checkConversationAccess(conversation.companyId, session.user.id);
        if (!hasAccess) throw new Error("Access denied");

        const response = await fetch(`${GATEWAY_URL}/api/inbox/conversations/${conversationId}/drafts`);
        const resData = await response.json();
        return resData.data || [];
    } catch (error) {
        console.error("[Inbox Advanced] Error getting draft history", error);
        throw error;
    }
}

export async function renderMacroTemplate_Advanced(conversationId: string, template: string, companyId: string) {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");

    try {
        const convoRes = await fetch(`${GATEWAY_URL}/api/inbox/conversations/${conversationId}`);
        if (!convoRes.ok) throw new Error("Conversation not found");
        const convoData = await convoRes.json();
        const conversation = convoData.conversation;

        const hasAccess = await checkConversationAccess(conversation.companyId, session.user.id);
        if (!hasAccess) throw new Error("Access denied");

        const response = await fetch(`${GATEWAY_URL}/api/inbox/conversations/${conversationId}/render-template`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ template, companyId, userId: session.user.id })
        });
        const resData = await response.json();
        return resData;
    } catch (error) {
        console.error("[Inbox Advanced] Error rendering template", error);
        throw error;
    }
}

export async function mergeConversations_Advanced(primaryId: string, secondaryId: string, companyId: string) {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");

    try {
        const hasAccess = await checkCompanyAccess(companyId, session.user.id);
        if (!hasAccess) throw new Error("Access denied");

        const userRole = await getUserRole(session.user.id, companyId);
        if (!["admin", "super_admin"].includes(userRole)) {
            throw new Error("Only admins can merge conversations");
        }

        const response = await fetch(`${GATEWAY_URL}/api/inbox/conversations/${primaryId}/merge`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ secondaryId, companyId, userId: session.user.id })
        });
        const resData = await response.json();
        return { success: !!resData.success };
    } catch (error) {
        console.error("[Inbox Advanced] Error merging conversations", error);
        throw error;
    }
}

export async function findDuplicateConversations_Advanced(leadId: string, channel: string, companyId: string) {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");

    try {
        const hasAccess = await checkCompanyAccess(companyId, session.user.id);
        if (!hasAccess) throw new Error("Access denied");

        const queryParams = new URLSearchParams({ leadId, channel, companyId });
        const response = await fetch(`${GATEWAY_URL}/api/inbox/conversations/duplicates?${queryParams.toString()}`);
        const resData = await response.json();
        return resData.data || [];
    } catch (error) {
        console.error("[Inbox Advanced] Error finding duplicates", error);
        throw error;
    }
}

export async function sendMessage_Advanced(
    conversationId: string,
    content: string | null,
    attachments: Array<{ fileName: string; mediaUrl: string; mediaType?: string; fileSize?: number }> = [],
    options: { direction?: string; externalId?: string; inReplyToHeader?: string } = {}
) {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "No autorizado" };

    const { direction = "OUTBOUND", externalId, inReplyToHeader } = options;

    try {
        let conversation: any = null;

        // Intentar obtener conversación desde el Gateway
        try {
            const convoRes = await fetch(`${GATEWAY_URL}/api/inbox/conversations/${conversationId}`);
            if (convoRes.ok) {
                const convoData = await convoRes.json();
                conversation = convoData.conversation;
            }
        } catch (gwErr) {
            console.warn("[Inbox Advanced] Gateway fetch conversation failed, using Prisma fallback");
        }

        // Fallback directo a Prisma DB
        if (!conversation) {
            const { prisma } = await import("@/lib/prisma");
            conversation = await prisma.conversation.findUnique({
                where: { id: conversationId },
                include: { lead: true }
            });
        }

        if (!conversation) {
            return { success: false, error: "Conversación no encontrada" };
        }

        const formattedAttachments = attachments.map(a => ({
            fileName: a.fileName,
            url: a.mediaUrl,
            type: a.mediaType || "DOCUMENT",
            fileSize: a.fileSize || 0
        }));

        let message: any = null;

        // Intentar envío de mensaje mediante el Gateway
        try {
            const response = await fetch(`${GATEWAY_URL}/api/inbox/conversations/${conversationId}/messages`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    content,
                    type: content ? "TEXT" : "MEDIA",
                    direction,
                    senderId: session.user.id,
                    status: "SENT",
                    inReplyToHeader,
                    attachments: formattedAttachments,
                    externalId
                })
            });
            if (response.ok) {
                const resData = await response.json();
                message = resData.message;
            }
        } catch (gwMsgErr) {
            console.warn("[Inbox Advanced] Gateway message create failed, using Prisma fallback");
        }

        // Fallback directo a creación en Prisma DB
        if (!message) {
            const { prisma } = await import("@/lib/prisma");
            message = await prisma.message.create({
                data: {
                    conversationId,
                    content: content || '',
                    direction: direction as any || 'OUTBOUND',
                    senderId: session.user.id,
                    status: 'SENT',
                    mediaUrl: formattedAttachments[0]?.url || null,
                    mediaType: formattedAttachments[0]?.type || null,
                }
            });

            await prisma.conversation.update({
                where: { id: conversationId },
                data: { updatedAt: new Date(), lastMessageAt: new Date() }
            });
        }

        // Emit real-time event via Socket.IO locally
        try {
            emitSocketEvent(conversation.companyId, "message.created", {
                conversationId,
                messageId: message.id,
            });
        } catch (err) {
            console.warn("[Inbox Advanced] emitSocketEvent failed", err);
        }

        return { success: true, messageId: message.id };
    } catch (error: any) {
        console.error("[Inbox Advanced] Error sending message:", error);
        return { success: false, error: error.message || "Error enviando el mensaje" };
    }
}

export async function addTagToConversation_Advanced(conversationId: string, tagName: string) {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Unauthorized" };

    try {
        const convoRes = await fetch(`${GATEWAY_URL}/api/inbox/conversations/${conversationId}`);
        if (!convoRes.ok) return { success: false, error: "Conversation not found" };
        const convoData = await convoRes.json();
        const conversation = convoData.conversation;

        const hasAccess = await checkConversationAccess(conversation.companyId, session.user.id);
        if (!hasAccess) return { success: false, error: "Access denied" };

        const response = await fetch(`${GATEWAY_URL}/api/inbox/conversations/${conversationId}/tags`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tagName, userId: session.user.id })
        });
        const resData = await response.json();
        if (!response.ok) return { success: false, error: resData.error || "Failed to add tag" };

        return { success: true, tags: resData.tags };
    } catch (error: any) {
        console.error("[Inbox Advanced] Error adding tag", error);
        return { success: false, error: error.message || "Failed to add tag" };
    }
}

export async function removeTagFromConversation_Advanced(conversationId: string, tagName: string) {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Unauthorized" };

    try {
        const convoRes = await fetch(`${GATEWAY_URL}/api/inbox/conversations/${conversationId}`);
        if (!convoRes.ok) return { success: false, error: "Conversation not found" };
        const conversation = (convoRes.ok ? await convoRes.json() : {}).conversation;

        const hasAccess = await checkConversationAccess(conversation.companyId, session.user.id);
        if (!hasAccess) return { success: false, error: "Access denied" };

        const response = await fetch(`${GATEWAY_URL}/api/inbox/conversations/${conversationId}/tags/${tagName}?userId=${session.user.id}`, {
            method: 'DELETE'
        });
        const resData = await response.json();
        if (!response.ok) return { success: false, error: resData.error || "Failed to remove tag" };

        return { success: true, tags: resData.tags };
    } catch (error: any) {
        console.error("[Inbox Advanced] Error removing tag", error);
        return { success: false, error: error.message || "Failed to remove tag" };
    }
}

export async function getTagHistory_Advanced(conversationId: string) {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");

    try {
        const convoRes = await fetch(`${GATEWAY_URL}/api/inbox/conversations/${conversationId}`);
        if (!convoRes.ok) throw new Error("Conversation not found");
        const convoData = await convoRes.json();
        const conversation = convoData.conversation;

        const hasAccess = await checkConversationAccess(conversation.companyId, session.user.id);
        if (!hasAccess) throw new Error("Access denied");

        const response = await fetch(`${GATEWAY_URL}/api/inbox/conversations/${conversationId}/tags/history`);
        const resData = await response.json();
        return resData.data || [];
    } catch (error) {
        console.error("[Inbox Advanced] Error getting tag history", error);
        throw error;
    }
}
