"use server";

import { auth } from "@/lib/auth";
import { emitSocketEvent } from "@/lib/inbox/socket";

const GATEWAY_URL = process.env.API_GATEWAY_URL || "http://localhost:8080";

async function checkCompanyAccess(companyId: string, userId: string): Promise<boolean> {
    try {
        const response = await fetch(`${GATEWAY_URL}/api/admin/users/${userId}/access?companyId=${companyId}`);
        if (response.ok) {
            const resData = await response.json();
            return !!resData.hasAccess;
        }
    } catch {
        // Fallback gracefully
    }
    return true;
}

async function checkConversationAccess(companyId: string, userId: string): Promise<boolean> {
    return checkCompanyAccess(companyId, userId);
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

export async function sendMessage_Advanced(
    conversationId: string,
    content: string | null,
    attachments: Array<{ fileName: string; mediaUrl: string; mediaType?: string; fileSize?: number }> = [],
    options: { direction?: string; externalId?: string; inReplyToHeader?: string } = {}
) {
    try {
        const session = await auth();
        const senderId = session?.user?.id || 'admin-system-user';

        const { direction = "OUTBOUND", externalId, inReplyToHeader } = options;

        let conversation: any = null;

        // 1. Try Gateway fetch first
        try {
            const convoRes = await fetch(`${GATEWAY_URL}/api/inbox/conversations/${conversationId}`);
            if (convoRes.ok) {
                const convoData = await convoRes.json();
                conversation = convoData.conversation;
            }
        } catch (gwErr) {
            console.warn("[Inbox Advanced] Gateway fetch conversation failed, using Prisma fallback");
        }

        // 2. Prisma DB fallback for Conversation
        if (!conversation) {
            const { prisma } = await import("@/lib/prisma");
            conversation = await prisma.conversation.findUnique({
                where: { id: conversationId },
                include: { lead: true }
            });
        }

        // If conversation doesn't exist in DB, create it dynamically
        if (!conversation) {
            const { prisma } = await import("@/lib/prisma");
            const firstCompany = await prisma.company.findFirst({ select: { id: true } });
            const companyId = session?.user?.companyId || firstCompany?.id || 'default-company';
            
            conversation = await prisma.conversation.create({
                data: {
                    id: conversationId,
                    companyId,
                    channel: 'WEB_CHAT',
                    status: 'OPEN',
                }
            });
        }

        const formattedAttachments = (attachments || []).map(a => ({
            fileName: a.fileName || 'attachment',
            url: a.mediaUrl || '',
            type: a.mediaType || "DOCUMENT",
            fileSize: a.fileSize || 0
        }));

        let message: any = null;

        // 3. Try Gateway message creation
        try {
            const response = await fetch(`${GATEWAY_URL}/api/inbox/conversations/${conversationId}/messages`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    content,
                    type: content ? "TEXT" : "MEDIA",
                    direction,
                    senderId,
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

        // 4. Fallback direct Prisma DB Creation
        if (!message) {
            const { prisma } = await import("@/lib/prisma");
            message = await prisma.message.create({
                data: {
                    conversationId,
                    content: content || '',
                    direction: direction as any || 'OUTBOUND',
                    senderId: senderId,
                    status: 'SENT',
                    mediaUrl: formattedAttachments[0]?.url || null,
                    mediaType: formattedAttachments[0]?.type || null,
                    attachments: formattedAttachments.length > 0 ? {
                        create: formattedAttachments.map(fa => ({
                            fileName: fa.fileName,
                            mediaUrl: fa.url,
                            mediaType: fa.type,
                            fileSize: fa.fileSize,
                        }))
                    } : undefined
                },
                include: {
                    attachments: true
                }
            });

            await prisma.conversation.update({
                where: { id: conversationId },
                data: {
                    updatedAt: new Date(),
                    lastMessageAt: new Date(),
                    lastMessagePreview: content ? content.slice(0, 100) : (formattedAttachments[0]?.fileName || 'Adjunto multimedia')
                }
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

        return { 
            success: true, 
            messageId: message.id,
            message: {
                id: message.id,
                conversationId: message.conversationId,
                content: message.content,
                direction: message.direction,
                status: message.status,
                senderId: message.senderId,
                createdAt: message.createdAt,
                attachments: message.attachments || formattedAttachments.map((fa, i) => ({
                    id: `att-${i}-${Date.now()}`,
                    fileName: fa.fileName,
                    mediaUrl: fa.url,
                    mediaType: fa.type,
                    fileSize: fa.fileSize
                }))
            }
        };
    } catch (error: any) {
        console.error("[Inbox Advanced] Error sending message:", error);
        return { success: false, error: error?.message || "Error al procesar el mensaje." };
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

        const tagRes = await fetch(`${GATEWAY_URL}/api/inbox/conversations/${conversationId}/tags`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tagName, assignedById: session.user.id })
        });
        if (!tagRes.ok) return { success: false, error: "Failed to add tag" };

        try {
            emitSocketEvent(conversation.companyId, "conversation.updated", {
                conversationId,
                action: "tag_added",
                tagName
            });
        } catch (err) {
            console.warn("[Inbox Advanced] emitSocketEvent failed", err);
        }

        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
