"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

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

        // 1. Find or Create Lead
        let lead = await prisma.lead.findFirst({
            where: { email: email },
        });

        if (!lead) {
            // Create new lead with nested conversation and message
            const newLead = await prisma.lead.create({
                data: {
                    name,
                    email,
                    source: "WEB_CHAT",
                    status: "NEW",
                    companyId,
                    conversations: {
                        create: {
                            channel: "WEB_CHAT",
                            platformId: visitorId,
                            status: "OPEN",
                            unreadCount: 1,
                            companyId,
                            messages: {
                                create: {
                                    content: message,
                                    direction: "INBOUND",
                                    status: "SENT",
                                    type: "TEXT"
                                }
                            }
                        }
                    }
                },
                include: { conversations: true }
            });

            const newConversation = newLead.conversations[0];
            safeRevalidate("/dashboard/inbox");

            return {
                success: true,
                conversationId: newConversation.id,
                visitorId: visitorId
            };
        } else {
            // Lead exists, update name if missing
            if (!lead.name && name) {
                await prisma.lead.update({
                    where: { id: lead.id },
                    data: { name },
                });
            }
        }

        // 2. Create Conversation (for existing lead)
        // Try to find open conversation first
        let conversation = await prisma.conversation.findFirst({
            where: {
                leadId: lead.id,
                channel: "WEB_CHAT",
                status: "OPEN",
            },
        });

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
            });
        }

        // 3. Create Initial Message 
        // (Only if we didn't just create the conversation via nested write, 
        // OR if we reused an existing conversation)
        // Wait, the nested create above was ONLY for new Lead. 
        // Here we are in the "Lead exists" branch.
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
export async function sendMessage(conversationId: string, content: string, senderId?: string) {
    try {
        const direction = senderId ? "OUTBOUND" : "INBOUND";

        await prisma.message.create({
            data: {
                conversationId,
                content,
                direction,
                senderId,
                status: "SENT",
            },
        });

        await prisma.conversation.update({
            where: { id: conversationId },
            data: {
                lastMessageAt: new Date(),
                unreadCount: { increment: direction === "INBOUND" ? 1 : 0 },
                lastMessagePreview: content.substring(0, 50)
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
            }
        });
        return { success: true, messages };
    } catch (error) {
        console.error("Error fetching messages:", error); // Log locally only
        return { success: false, messages: [] };
    }
}
