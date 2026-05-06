"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { createLocalNotification } from "./notifications";

const safeRevalidate = (path: string) => {
    try {
        revalidatePath(path);
    } catch (e) {
        // Ignore in script context
    }
};

// Initialize Chat (Start Conversation)
// 1. Find or Create Lead based on email
// 2. Create Conversation (channel: WEB_CHAT) linked to Lead
// 3. Create Initial Message
export async function initializeChat(data: {
    name: string;
    email: string;
    message: string;
    visitorId: string; // From localStorage
}) {
    const { name, email, message, visitorId } = data;

    try {
        // 0. Get Default Company (for single-tenant setup)
        const company = await prisma.company.findFirst();
        if (!company) throw new Error("No default company found");
        const companyId = company.id;

        // 1. Find existing conversation by platformId/channel (Unique identifier for the session)
        let conversation = await prisma.conversation.findFirst({
            where: {
                platformId: visitorId,
                channel: "WEB_CHAT",
            },
            include: { lead: true }
        });

        let lead;
        if (conversation?.lead) {
            // Re-use lead linked to this session
            lead = conversation.lead;
            
            // Update name/email if provided and lead is missing them
            if ((!lead.name && name) || (!lead.email && email)) {
                lead = await prisma.lead.update({
                    where: { id: lead.id },
                    data: { 
                        name: lead.name || name,
                        email: lead.email || email
                    }
                });
            }
        } else {
            // 2. No conversation found or not linked to a lead. Try to find lead by email.
            lead = await prisma.lead.findFirst({
                where: { email: email },
            });

            if (!lead) {
                // 3. Create new lead
                lead = await prisma.lead.create({
                    data: {
                        name,
                        email,
                        source: "WEB_CHAT",
                        status: "NEW",
                        companyId,
                    }
                });
            }
        }

        // 4. Create or Update Conversation
        if (!conversation) {
            conversation = await prisma.conversation.create({
                data: {
                    channel: "WEB_CHAT",
                    platformId: visitorId,
                    leadId: lead.id,
                    status: "OPEN",
                    unreadCount: 1,
                    companyId,
                },
                include: { lead: true },
            });

            // Notify admins only for COMPLETELY NEW conversations
            try {
                const admins = await prisma.user.findMany({
                    where: {
                        companies: {
                            some: {
                                companyId,
                                roleName: { in: ['super_admin', 'admin', 'content_manager'] }
                            }
                        }
                    },
                    select: { id: true }
                });

                const notificationPromises = admins.map(admin => 
                    createLocalNotification({
                        companyId,
                        userId: admin.id,
                        type: 'NEW_MESSAGE',
                        title: `Nuevo chat de ${name || lead.name || email}`,
                        message: message.substring(0, 100),
                        link: `/dashboard/inbox?conversation=${conversation!.id}`
                    })
                );

                await Promise.all(notificationPromises);
            } catch (notifError) {
                console.error("[chat] Failed to create notification:", notifError);
            }
        } else {
            // Re-open and link to lead if needed
            conversation = await prisma.conversation.update({
                where: { id: conversation.id },
                data: {
                    status: "OPEN",
                    leadId: lead.id,
                    unreadCount: { increment: 1 }
                },
                include: { lead: true },
            });
        }

        if (!conversation) throw new Error("Conversation should exist after if/else");

        // 5. Create the initial message
        await prisma.message.create({
            data: {
                conversationId: conversation.id,
                content: message,
                direction: "INBOUND",
                status: "SENT",
                type: "TEXT",
            },
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
        // Verify conversation exists
        const conversation = await prisma.conversation.findUnique({
            where: { id: conversationId }
        });

        if (!conversation) {
            console.error("[sendMessage] Conversation not found:", conversationId);
            return { success: false, error: "Conversation not found" };
        }

        const direction = senderId ? "OUTBOUND" : "INBOUND";

        await prisma.message.create({
            data: {
                conversationId,
                content,
                direction,
                senderId,
                status: "SENT",
                mediaUrl,
                mediaType,
            },
        });

        await prisma.conversation.update({
            where: { id: conversationId },
            data: {
                lastMessageAt: new Date(),
                unreadCount: { increment: direction === "INBOUND" ? 1 : 0 },
                lastMessagePreview: content ? content.substring(0, 50) : (mediaType === 'AUDIO' ? '🎤 Nota de voz' : '📎 Archivo')
            }
        });

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
        const messages = await prisma.message.findMany({
            where: { conversationId },
            orderBy: { createdAt: 'asc' },
            select: {
                id: true,
                content: true,
                direction: true,
                createdAt: true,
                senderId: true,
                status: true,
                mediaUrl: true,
                mediaType: true,
            }
        });
        const messagesWithAttachments = messages.map(m => ({
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
        const conversation = await prisma.conversation.findUnique({
            where: { id: conversationId }
        });
        return !!conversation;
    } catch {
        return false;
    }
}
