"use server";

import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { ChannelType } from "@/types/inbox";
import { rateLimit } from "@/lib/rate-limit";
import { notifyUsers } from "@/lib/notifications/notification-engine";

export interface GetConversationsParams {
    companyId: string;
    status?: string;
    channel?: string;
    assignedTo?: string;
    search?: string;
    page?: number;
    limit?: number;
}

const GATEWAY_URL = process.env.API_GATEWAY_URL || "http://localhost:8080";

export async function getConversations({
    status,
    channel,
    assignedTo,
    search,
    page = 1,
    limit = 20
}: Omit<GetConversationsParams, 'companyId'>) {
    try {
        const session = await auth();
        if (!session?.user?.id) return { success: false, error: "Unauthorized" };

        let companyId = session.user.companyId;

        // Fallback for single-tenant / reset scenarios
        if (!companyId) {
            const companyRes = await fetch(`${GATEWAY_URL}/api/admin/companies`, {
                headers: session?.user?.id ? { 'x-user-id': session.user.id } : {}
            }); // or equivalent public endpoint
            if (companyRes.ok) {
                const compData = await companyRes.json();
                if (compData.companies && compData.companies.length > 0) {
                    companyId = compData.companies[0].id;
                }
            }
        }

        if (!companyId) return { success: false, error: "No company found" };

        const queryParams = new URLSearchParams({
            companyId,
            page: String(page),
            limit: String(limit),
            ...(status && { status }),
            ...(channel && { channel }),
            ...(assignedTo && { assignedTo }),
            ...(search && { search }),
        });

        let conversations: any[] = [];
        let total = 0;

        try {
            const response = await fetch(`${GATEWAY_URL}/api/inbox/conversations?${queryParams.toString()}`);
            if (response.ok) {
                const resData = await response.json();
                conversations = resData.conversations || [];
                total = resData.total || conversations.length;
            }
        } catch (gwErr) {
            console.warn("Gateway fetch conversations failed, using Prisma fallback");
        }

        // Prisma DB fallback if Gateway didn't return data
        if (!conversations || conversations.length === 0) {
            const { prisma } = await import("@/lib/prisma");
            const whereClause: any = { companyId };
            if (status) whereClause.status = status;
            if (channel) whereClause.channel = channel;
            if (assignedTo) whereClause.assignedTo = assignedTo;
            if (search) {
                whereClause.OR = [
                    { contactName: { contains: search, mode: 'insensitive' } },
                    { lastMessagePreview: { contains: search, mode: 'insensitive' } },
                    { lead: { name: { contains: search, mode: 'insensitive' } } },
                ];
            }

            const [dbConversations, dbCount] = await Promise.all([
                prisma.conversation.findMany({
                    where: whereClause,
                    include: {
                        lead: true,
                        messages: {
                            take: 1,
                            orderBy: { createdAt: 'desc' }
                        }
                    },
                    orderBy: { updatedAt: 'desc' },
                    take: limit,
                    skip: (page - 1) * limit,
                }),
                prisma.conversation.count({ where: whereClause })
            ]);

            conversations = dbConversations.map((c: any) => ({
                ...c,
                lastMessagePreview: c.messages?.[0]?.content || c.lastMessagePreview || '',
                unreadCount: c.unreadCount || 0,
            }));
            total = dbCount;
        }

        return {
            success: true,
            data: conversations,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit) || 1
            }
        };
    } catch (error) {
        console.error("Error fetching conversations:", error);
        return { success: false, error: "Failed to fetch conversations" };
    }
}

export async function getConversationById(conversationId: string) {
    try {
        const session = await auth();
        if (!session?.user?.id) return { success: false, error: "Unauthorized" };

        let conversation: any = null;
        try {
            const response = await fetch(`${GATEWAY_URL}/api/inbox/conversations/${conversationId}`);
            if (response.ok) {
                const resData = await response.json();
                conversation = resData.conversation;
            }
        } catch (gwErr) {
            console.warn("Gateway fetch conversation failed, using Prisma fallback");
        }

        if (!conversation) {
            const { prisma } = await import("@/lib/prisma");
            conversation = await prisma.conversation.findUnique({
                where: { id: conversationId },
                include: {
                    lead: true,
                    messages: {
                        take: 50,
                        orderBy: { createdAt: 'asc' }
                    }
                }
            });
        }

        if (!conversation) return { success: false, error: "Conversation not found" };
        return { success: true, data: conversation };
    } catch (error: any) {
        console.error("Error fetching conversation by ID:", error);
        return { success: false, error: error.message };
    }
}


export async function getMessages(conversationId: string) {
    try {
        const session = await auth();
        if (!session?.user?.id) return { success: false, error: 'Unauthorized' };

        let rawMessages: any[] = [];
        try {
            const response = await fetch(`${GATEWAY_URL}/api/inbox/conversations/${conversationId}/messages`);
            if (response.ok) {
                const resData = await response.json();
                rawMessages = resData.messages || [];
            }
        } catch (gwErr) {
            console.warn("Gateway fetch messages failed, using Prisma fallback");
        }

        // Prisma DB fallback if Gateway did not return messages
        if (!rawMessages || rawMessages.length === 0) {
            const { prisma } = await import("@/lib/prisma");
            rawMessages = await prisma.message.findMany({
                where: { conversationId },
                orderBy: { createdAt: 'asc' }
            });
        }

        const messagesWithAttachments = rawMessages.map((m: any) => ({
            ...m,
            attachments: m.attachments && m.attachments.length > 0
                ? m.attachments
                : m.mediaUrl ? [{ url: m.mediaUrl, type: m.mediaType || 'DOCUMENT', name: 'Archivo' }] : []
        }));

        return { success: true, data: messagesWithAttachments };
    } catch (error) {
        console.error("Error fetching messages:", error);
        return { success: false, error: "Failed to fetch messages" };
    }
}


export async function markConversationAsRead(conversationId: string) {
    try {
        const session = await auth();
        if (!session?.user?.id) return { success: false, error: 'Unauthorized' };

        const response = await fetch(`${GATEWAY_URL}/api/inbox/conversations/${conversationId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ unreadCount: 0 })
        });
        if (!response.ok) {
            return { success: false, error: "Failed to mark as read" };
        }
        return { success: true };
    } catch (error) {
        console.error("Error marking conversation as read:", error);
        return { success: false, error: "Failed to mark as read" };
    }
}

export interface SendTemplate {
    name: string;
    language: string;
    components?: any[];
}

export async function sendMessage(conversationId: string, content: string, userId: string, attachments: any[] = [], template?: SendTemplate) {
    try {
        if (!content && (!attachments || attachments.length === 0) && !template) {
            return { success: false, error: "Message content or attachment required" };
        }

        let message: any = null;

        try {
            const response = await fetch(`${GATEWAY_URL}/api/inbox/conversations/${conversationId}/messages`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    content,
                    direction: 'OUTBOUND',
                    senderId: userId,
                    status: 'SENT',
                    attachments,
                    type: content ? "TEXT" : "MEDIA"
                })
            });
            if (response.ok) {
                const resData = await response.json();
                message = resData.message;
            }
        } catch (gwErr) {
            console.warn("Gateway sendMessage failed, using Prisma fallback");
        }

        if (!message) {
            const { prisma } = await import("@/lib/prisma");
            message = await prisma.message.create({
                data: {
                    conversationId,
                    content: content || '',
                    direction: 'OUTBOUND',
                    senderId: userId,
                    status: 'SENT',
                    mediaUrl: attachments[0]?.url || attachments[0]?.mediaUrl || null,
                    mediaType: attachments[0]?.type || attachments[0]?.mediaType || null,
                }
            });

            await prisma.conversation.update({
                where: { id: conversationId },
                data: { updatedAt: new Date() }
            });
        }

        let conversation: any = null;
        try {
            const convoRes = await fetch(`${GATEWAY_URL}/api/inbox/conversations/${conversationId}`);
            if (convoRes.ok) {
                const convoData = await convoRes.json();
                conversation = convoData.conversation;
            }
        } catch (gwConvoErr) {
            console.warn("Gateway fetch conversation failed, using Prisma fallback");
        }

        if (!conversation) {
            const { prisma } = await import("@/lib/prisma");
            conversation = await prisma.conversation.findUnique({
                where: { id: conversationId },
                include: { lead: true }
            });
        }

        if (conversation && (conversation.channel === 'MESSENGER' || conversation.channel === 'INSTAGRAM') && conversation.metadata) {
            const { MetaService } = await import("@/lib/services/meta-sync");
            const meta = conversation.metadata as any;
            const { pages } = await MetaService.getConnectedPages(userId, conversation.companyId);
            const page = pages.find((p: any) => p.id === meta.pageId);

            if (page && meta.recipientId) {
                const result = await MetaService.sendReply(
                    meta.recipientId,
                    page.id,
                    content,
                    page.access_token
                );
                if (result && result.success === false) {
                    await fetch(`${GATEWAY_URL}/api/inbox/messages/${message.id}`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ status: 'FAILED' })
                    });
                    return { success: false, error: "Meta API falló: " + JSON.stringify(result.error) };
                }
            } else {
                await fetch(`${GATEWAY_URL}/api/inbox/messages/${message.id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ status: 'FAILED' })
                });
                return { success: false, error: "Falta configuración de la página o ID del destinatario en la metadata del Lead." };
            }
        } else if (conversation && conversation.channel === 'WHATSAPP') {
            if (!template) {
                const messagesRes = await fetch(`${GATEWAY_URL}/api/inbox/conversations/${conversationId}/messages`);
                const messagesData = await messagesRes.json();
                const lastInboundMsg = (messagesData.messages || [])
                    .reverse()
                    .find((m: any) => m.direction === 'INBOUND');

                if (lastInboundMsg) {
                    const hoursSinceLastMessage = (Date.now() - new Date(lastInboundMsg.createdAt).getTime()) / (1000 * 60 * 60);
                    if (hoursSinceLastMessage >= 24) {
                        await fetch(`${GATEWAY_URL}/api/inbox/messages/${message.id}`, {
                            method: 'PATCH',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ status: 'FAILED' })
                        });
                        return {
                            success: false,
                            error: "Ventana de 24h de WhatsApp expirada. Para reanudar el contacto debes enviar una Plantilla pre-aprobada (HSM).",
                            requiresTemplate: true,
                        };
                    }
                }
            }

            const { automationHub } = await import("@/lib/integrations/providers");
            const waProvider = automationHub.get('WHATSAPP');
            if (waProvider) {
                if (template) {
                    const tplResult = await waProvider.sendMessage({
                        conversationId: conversation.platformId || conversation.lead?.phone || '',
                        content: content || `[Template:${template.name}]`,
                        template,
                    });
                    if (tplResult && tplResult.success === false) {
                        await fetch(`${GATEWAY_URL}/api/inbox/messages/${message.id}`, {
                            method: 'PATCH',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ status: 'FAILED' })
                        });
                        return { success: false, error: "WhatsApp Template falló: " + JSON.stringify(tplResult.error) };
                    }
                    revalidatePath(`/dashboard/inbox`);
                    return { success: true, data: message };
                }

                const audioAttachment = attachments.find((a: any) => a.type === 'AUDIO');
                let waResult;
                if (audioAttachment) {
                    const audioUrl = audioAttachment.url || '';
                    const isWhatsAppMedia = audioUrl.includes('/api/media/whatsapp/');

                    if (isWhatsAppMedia) {
                        waResult = await waProvider.sendMessage({
                            conversationId: conversation.platformId || conversation.lead?.phone || '',
                            content: '',
                            attachments: [{ type: 'audio', url: audioUrl }]
                        });
                    }

                    if (!waResult || waResult.success === false) {
                        const linkContent = audioUrl.startsWith('http')
                            ? `🎤 Nota de Voz: ${audioUrl}`
                            : content;
                        waResult = await waProvider.sendMessage({
                            conversationId: conversation.platformId || conversation.lead?.phone || '',
                            content: linkContent,
                            attachments: []
                        });
                    }
                } else {
                    waResult = await waProvider.sendMessage({
                        conversationId: conversation.platformId || conversation.lead?.phone || '',
                        content: content,
                        attachments: attachments
                    });
                }

                if (waResult && waResult.success === false) {
                    await fetch(`${GATEWAY_URL}/api/inbox/messages/${message.id}`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ status: 'FAILED' })
                    });
                    return { success: false, error: "WhatsApp API falló: " + JSON.stringify(waResult.error) };
                }
            } else {
                await fetch(`${GATEWAY_URL}/api/inbox/messages/${message.id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ status: 'FAILED' })
                });
                return { success: false, error: "Proveedor de WhatsApp no configurado o inactivo." };
            }
        } else if (conversation && ['TIKTOK', 'LINKEDIN', 'TWITTER', 'YOUTUBE', 'SMS'].includes(conversation.channel)) {
            try {
                const { automationHub } = await import("@/lib/integrations/providers");
                const provider = automationHub.get(conversation.channel as any);
                if (provider && typeof provider.sendMessage === 'function') {
                    await provider.sendMessage({
                        conversationId: conversation.platformId || '',
                        content: content,
                        attachments: attachments
                    });
                }
            } catch (channelErr) {
                console.warn(`[Inbox] Error sending via ${conversation.channel}:`, channelErr);
            }
        }

        revalidatePath(`/dashboard/inbox`);
        return { success: true, data: message };
    } catch (error: any) {
        console.error("Error sending message:", error);
        return { success: false, error: error?.message || "Failed to send message" };
    }
}

export async function updateLeadStatusFromInbox(conversationId: string, newStatus: string) {
    try {
        const session = await auth();
        if (!session?.user?.id) return { success: false, error: "Unauthorized" };

        const convoRes = await fetch(`${GATEWAY_URL}/api/inbox/conversations/${conversationId}`);
        const convoData = await convoRes.json();
        const conversation = convoData.conversation;

        if (!conversation || !conversation.leadId) {
            return { success: false, error: "Lead no encontrado en la conversación" };
        }

        const leadUpdateRes = await fetch(`${GATEWAY_URL}/api/leads/${conversation.leadId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus })
        });

        if (!leadUpdateRes.ok) {
            return { success: false, error: "Fallo actualizando status del lead" };
        }

        revalidatePath(`/dashboard/inbox`);
        return { success: true };
    } catch (error: any) {
        console.error("Error updating lead status directly:", error);
        return { success: false, error: error.message || "Fallo actualizando status" };
    }
}

export async function createConversation(companyId: string, leadId: string, channel: string) {
    try {
        const response = await fetch(`${GATEWAY_URL}/api/inbox/conversations`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ companyId, leadId, channel })
        });
        const resData = await response.json();
        if (!response.ok) {
            return { success: false, error: resData.error || "Failed to create conversation" };
        }

        revalidatePath(`/dashboard/inbox`);
        return { success: true, data: resData.data, isNew: resData.isNew };
    } catch (error) {
        console.error("Error creating conversation:", error);
        return { success: false, error: "Failed to create conversation" };
    }
}

export async function updateConversationStatus(conversationId: string, status: string) {
    try {
        const response = await fetch(`${GATEWAY_URL}/api/inbox/conversations/${conversationId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status })
        });
        const resData = await response.json();
        if (!response.ok) {
            return { success: false, error: resData.error || "Failed to update status" };
        }

        revalidatePath(`/dashboard/inbox`);
        return { success: true, data: resData.data };
    } catch (error) {
        console.error("Error updating status:", error);
        return { success: false, error: "Failed to update status" };
    }
}

export async function logLeadContact(leadId: string, channel: string) {
    try {
        const session = await auth();
        if (!session?.user?.id) return { success: false, error: "Unauthorized" };

        const response = await fetch(`${GATEWAY_URL}/api/inbox/log-contact`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ leadId, channel })
        });
        const resData = await response.json();
        if (!response.ok) {
            return { success: false, error: resData.error || "Failed to log contact" };
        }

        revalidatePath('/dashboard/inbox');
        return { success: true, conversationId: resData.conversationId };
    } catch (error: any) {
        console.error("Error logging lead contact:", error);
        return { success: false, error: error?.message || "Failed to log contact" };
    }
}

export async function simulateIncomingMessage(params: {
    channel: ChannelType;
    senderName: string;
    senderHandle: string;
    content: string;
    companyId: string;
}) {
    try {
        let { channel, senderName, senderHandle, content, companyId } = params;

        if (companyId === 'default-company-id' || !companyId) {
            const session = await auth();
            if (session?.user?.id) {
                const allowed = rateLimit(`simulate_msg:${session.user.id}`, 10, 60_000);
                if (!allowed) return { success: false, error: "Rate limit: demasiadas simulaciones. Espera un momento." };
                companyId = session.user.companyId || "";
            }
        }

        if (!companyId) {
            // Find a default company via gateway
            const companyRes = await fetch(`${GATEWAY_URL}/api/admin/companies`);
            if (companyRes.ok) {
                const compData = await companyRes.json();
                if (compData.companies && compData.companies.length > 0) {
                    companyId = compData.companies[0].id;
                }
            }
        }

        if (!companyId) throw new Error("Company ID is required for simulation");

        // 1. Find or Create Lead via CRM REST API
        let lead;
        const leadSearchRes = await fetch(`${GATEWAY_URL}/api/leads?companyId=${companyId}&search=${senderHandle}`);
        if (leadSearchRes.ok) {
            const searchData = await leadSearchRes.json();
            if (searchData.leads && searchData.leads.length > 0) {
                lead = searchData.leads[0];
            }
        }

        if (!lead) {
            const leadCreateRes = await fetch(`${GATEWAY_URL}/api/leads`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    companyId,
                    name: senderName || 'Social User',
                    email: senderHandle.includes('@') ? senderHandle : `temp-${Date.now()}@example.com`,
                    phone: !senderHandle.includes('@') ? senderHandle : undefined,
                    utmSource: channel,
                    tags: [`${channel.toLowerCase()}-inbound`, 'simulated']
                })
            });
            const leadCreateData = await leadCreateRes.json();
            if (leadCreateRes.ok) {
                lead = leadCreateData.lead;
            }
        }

        if (!lead) throw new Error("Could not find or create lead");

        // 2. Create/Reopen Conversation
        const convoResponse = await fetch(`${GATEWAY_URL}/api/inbox/conversations`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ companyId, leadId: lead.id, channel })
        });
        const convoData = await convoResponse.json();
        if (!convoResponse.ok) throw new Error(convoData.error || "Failed to create conversation");
        const conversation = convoData.data;

        // 3. Create Inbound Message
        const msgResponse = await fetch(`${GATEWAY_URL}/api/inbox/conversations/${conversation.id}/messages`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                content,
                direction: 'INBOUND',
                status: 'RECEIVED',
                senderId: lead.id,
                type: 'TEXT'
            })
        });

        if (!msgResponse.ok) throw new Error("Failed to create simulated message");

        revalidatePath('/dashboard/inbox');

        // 4. Trigger AI Copilot in background
        const { triggerOmnichannelAgent } = await import("@/lib/services/ai-inbox");
        triggerOmnichannelAgent(conversation.id, companyId).catch(err =>
             console.error("[simulateIncomingMessage] Error in background AI dispatch:", err)
        );

        // 5. Send notifications
        const channelLabel = channel === 'WHATSAPP' ? 'WhatsApp' : channel === 'INSTAGRAM' ? 'Instagram' : channel === 'MESSENGER' ? 'Messenger' : channel === 'EMAIL' ? 'Email' : 'Mensaje';
        notifyUsers("INBOX.MESSAGE_RECEIVED", {
            companyId,
            title: `Nuevo ${channelLabel} de ${lead.name || 'Contacto'}`,
            message: content.substring(0, 100),
            roles: ["super_admin", "admin", "content_manager"],
            data: { conversationId: conversation.id },
        }).catch(() => {});

        return { success: true };
    } catch (error: any) {
        console.error("Simulation error:", error);
        return { success: false, error: error.message };
    }
}

export async function syncMetaConversations() {
    try {
        const session = await auth();
        if (!session?.user?.id) return { success: false, error: "Unauthorized" };

        const allowed = rateLimit(`sync_meta:${session.user.id}`, 5, 60_000);
        if (!allowed) return { success: false, error: "Rate limit: espera antes de sincronizar de nuevo." };

        const companyId = session.user.companyId;
        if (!companyId) return { success: false, error: "No company found for user" };

        const { MetaSyncService } = await import("@/lib/services/meta-sync");
        const result = await MetaSyncService.syncAllConversations(
            session.user.id,
            companyId
        );

        revalidatePath('/dashboard/inbox');
        return result;
    } catch (error: any) {
        console.error("[syncMetaConversations] Error:", error);
        return {
            success: false,
            conversationsSynced: 0,
            messagesSynced: 0,
            errors: [error.message]
        };
    }
}

export async function getLeadDetails(leadId: string) {
    try {
        const response = await fetch(`${GATEWAY_URL}/api/leads/${leadId}`);
        if (!response.ok) return null;
        const resData = await response.json();
        return resData.lead;
    } catch (error) {
        console.error("Error fetching lead details:", error);
        return null;
    }
}

export async function draftCopilotServerAction(conversationId: string, userInstruction?: string) {
    try {
        const session = await auth();
        if (!session?.user?.id) return { success: false, error: "Unauthorized" };

        const { draftCopilotReply } = await import("@/lib/services/ai-inbox");
        const reply = await draftCopilotReply(conversationId, userInstruction);

        return { success: true, draft: reply };
    } catch (error: any) {
        console.error("Error drafting reply:", error);
        return { success: false, error: error.message };
    }
}


export async function executeMacro(conversationId: string, macroId: string) {
    try {
        const session = await auth();
        if (!session?.user?.id) return { success: false, error: "Unauthorized" };

        const convoRes = await fetch(`${GATEWAY_URL}/api/inbox/conversations/${conversationId}`);
        const convoData = await convoRes.json();
        const conversation = convoData.conversation;
        if (!conversation) return { success: false, error: "Conversation not found" };

        const macroRes = await fetch(`${GATEWAY_URL}/api/inbox/macros`);
        const macrosData = await macroRes.json();
        const macro = (macrosData.data || []).find((m: any) => m.id === macroId);

        if (!macro || !macro.isActive || macro.companyId !== conversation.companyId) {
            return { success: false, error: "Macro not available" };
        }

        const payload = macro.payload || {};
        let systemNoteText = '';
        let messageToSend = '';

        switch (macro.actionType) {
            case 'TEXT_REPLY': {
                messageToSend = payload.textTemplate || 'Respuesta rápida de macro';
                if (conversation.lead?.name) {
                    messageToSend = messageToSend.replace('{{lead.name}}', conversation.lead.name.split(' ')[0]);
                }
                systemNoteText = `🤖 [MACRO: ${macro.title}] Ejecutado.`;
                break;
            }
            case 'ASSIGN_TAG': {
                const currentTags = Array.isArray(conversation.tags) ? conversation.tags : [];
                const newTags = payload.tagsToAdd || [];
                const mergedTags = Array.from(new Set([...currentTags, ...newTags]));

                await fetch(`${GATEWAY_URL}/api/inbox/conversations/${conversation.id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ tags: mergedTags })
                });
                systemNoteText = `🤖 [MACRO: ${macro.title}] Agregó etiquetas: ${newTags.join(', ')}`;
                break;
            }
            case 'ESCALATE': {
                const targetUserId = payload.assignToId;
                if (targetUserId) {
                    const userRes = await fetch(`${GATEWAY_URL}/api/admin/users/${targetUserId}`); // or public equivalent
                    if (userRes.ok) {
                        await fetch(`${GATEWAY_URL}/api/inbox/conversations/${conversation.id}`, {
                            method: 'PATCH',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ assignedTo: targetUserId })
                        });
                        systemNoteText = `🤖 [MACRO: ${macro.title}] Derivó la conversación al agente ${targetUserId}`;
                    } else {
                        systemNoteText = `🤖 [MACRO: ${macro.title}] (Fallo de escalamiento: ID de agente no válido o no existe)`;
                    }
                } else {
                    systemNoteText = `🤖 [MACRO: ${macro.title}] (Fallo de escalamiento: Faltó ID de agente)`;
                }
                break;
            }
            case 'SEND_PAYMENT_LINK': {
                const invoicesRes = await fetch(`${GATEWAY_URL}/api/invoices?companyId=${conversation.companyId}`);
                const invoicesData = await invoicesRes.json();
                const leadInvoice = (invoicesData.invoices || []).find((inv: any) => inv.leadId === conversation.leadId);

                let payUrl = '';
                if (leadInvoice) {
                    payUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://legacymark.com'}/es/invoice/${leadInvoice.token}`;
                } else {
                    payUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://legacymark.com'}/checkout`;
                }

                messageToSend = `Por favor, realiza tu pago seguro a través de este enlace:\n${payUrl}`;
                systemNoteText = `🤖 [MACRO: ${macro.title}] Generó y envió enlace de pago.`;
                break;
            }
            case 'WEBHOOK': {
                systemNoteText = `🤖 [MACRO: ${macro.title}] Llamó al Webhook en ${payload.webhookUrl}`;
                // Optional: Execute webhook via backend/node logic
                break;
            }
            default:
                systemNoteText = `🤖 [MACRO: ${macro.title}] Acción ejecutada.`;
        }

        if (messageToSend) {
            const result = await sendMessage(conversation.id, messageToSend, session.user.id, []);
            if (!result.success) {
                return { success: false, error: "Failed to send macro message" };
            }
        }

        if (systemNoteText && !messageToSend) {
            await fetch(`${GATEWAY_URL}/api/inbox/conversations/${conversationId}/messages`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    content: systemNoteText,
                    direction: 'INTERNAL',
                    senderId: session.user.id,
                    status: 'SENT',
                    type: 'TEXT'
                })
            });
        }

        await fetch(`${GATEWAY_URL}/api/inbox/conversations/${conversationId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                status: 'OPEN',
                lastMessagePreview: messageToSend ? messageToSend.substring(0, 50) : systemNoteText.substring(0, 50)
            })
        });

        revalidatePath('/dashboard/inbox');
        return { success: true };
    } catch (error: any) {
        console.error("Error executing macro:", error);
        return { success: false, error: error.message };
    }
}

export async function deleteMessage(messageId: string) {
    try {
        const session = await auth();
        if (!session?.user?.id) return { success: false, error: "Unauthorized" };

        const response = await fetch(`${GATEWAY_URL}/api/inbox/messages/${messageId}`, {
            method: 'DELETE'
        });
        if (!response.ok) return { success: false, error: "Failed to delete message" };

        revalidatePath(`/dashboard/inbox`);
        return { success: true };
    } catch (error: any) {
        console.error("Error deleting message:", error);
        return { success: false, error: error?.message || "Failed to delete message" };
    }
}

export async function deleteConversation(conversationId: string) {
    try {
        const session = await auth();
        if (!session?.user?.id) return { success: false, error: "Unauthorized" };

        const response = await fetch(`${GATEWAY_URL}/api/inbox/conversations/${conversationId}`, {
            method: 'DELETE'
        });
        if (!response.ok) return { success: false, error: "Failed to delete conversation" };

        revalidatePath(`/dashboard/inbox`);
        return { success: true };
    } catch (error: any) {
        console.error("Error deleting conversation:", error);
        return { success: false, error: error?.message || "Failed to delete conversation" };
    }
}

export async function updateConversationAssignment(conversationId: string, agentId: string | null) {
    try {
        const session = await auth();
        if (!session?.user?.id) return { success: false, error: 'Unauthorized' };

        const response = await fetch(`${GATEWAY_URL}/api/inbox/conversations/${conversationId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ assignedTo: agentId })
        });

        if (!response.ok) {
            // Prisma fallback
            const { prisma } = await import('@/lib/prisma');
            await prisma.conversation.update({
                where: { id: conversationId },
                data: { assignedTo: agentId }
            });
        }

        revalidatePath('/dashboard/inbox');
        return { success: true };
    } catch (error: any) {
        console.error('Error updating assignment:', error);
        return { success: false, error: error.message };
    }
}

export async function getAgentList(companyId?: string) {
    try {
        const session = await auth();
        if (!session?.user?.id) return { success: false, error: 'Unauthorized', data: [] };

        const resolvedCompanyId = companyId || session.user.companyId;
        if (!resolvedCompanyId) return { success: false, error: 'No company', data: [] };

        const response = await fetch(`${GATEWAY_URL}/api/admin/agents?companyId=${resolvedCompanyId}`);
        if (response.ok) {
            const data = await response.json();
            return { success: true, data: data.agents || [] };
        }

        // Prisma fallback
        const { prisma } = await import('@/lib/prisma');
        const agents = await prisma.user.findMany({
            where: { companyId: resolvedCompanyId, isActive: true },
            select: { id: true, name: true, email: true, image: true, role: true }
        });
        return { success: true, data: agents };
    } catch (error: any) {
        console.error('Error fetching agents:', error);
        return { success: false, error: error.message, data: [] };
    }
}

export async function markConversationAsSpam(conversationId: string) {
    try {
        const session = await auth();
        if (!session?.user?.id) return { success: false, error: 'Unauthorized' };

        const response = await fetch(`${GATEWAY_URL}/api/inbox/conversations/${conversationId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'SPAM', tags: ['SPAM'] })
        });

        if (!response.ok) {
            const { prisma } = await import('@/lib/prisma');
            await prisma.conversation.update({
                where: { id: conversationId },
                data: { status: 'SPAM' }
            });
        }

        revalidatePath('/dashboard/inbox');
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function pinConversation(conversationId: string, pinned: boolean) {
    try {
        const session = await auth();
        if (!session?.user?.id) return { success: false, error: 'Unauthorized' };

        const { prisma } = await import('@/lib/prisma');
        // Store pin state in metadata field
        const current = await prisma.conversation.findUnique({ where: { id: conversationId }, select: { metadata: true } });
        const meta = (current?.metadata as any) || {};
        await prisma.conversation.update({
            where: { id: conversationId },
            data: { metadata: { ...meta, pinned, pinnedAt: pinned ? new Date().toISOString() : null } }
        });

        revalidatePath('/dashboard/inbox');
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function saveInternalNote(conversationId: string, content: string) {
    try {
        const session = await auth();
        if (!session?.user?.id) return { success: false, error: 'Unauthorized' };
        if (!content?.trim()) return { success: false, error: 'Note content required' };

        // Save as an INTERNAL direction message in the conversation
        const response = await fetch(`${GATEWAY_URL}/api/inbox/conversations/${conversationId}/messages`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                content: content.trim(),
                direction: 'INTERNAL',
                senderId: session.user.id,
                status: 'SENT',
                type: 'NOTE'
            })
        });

        if (!response.ok) {
            // Prisma fallback
            const { prisma } = await import('@/lib/prisma');
            await prisma.message.create({
                data: {
                    conversationId,
                    content: content.trim(),
                    direction: 'INTERNAL',
                    senderId: session.user.id,
                    status: 'SENT',
                }
            });
        }

        revalidatePath(`/dashboard/inbox`);
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function bulkUpdateConversations(
    conversationIds: string[],
    action: 'close' | 'assign' | 'spam' | 'unassign',
    payload?: { agentId?: string; tag?: string }
) {
    try {
        const session = await auth();
        if (!session?.user?.id) return { success: false, error: 'Unauthorized' };
        if (!conversationIds.length) return { success: false, error: 'No conversations selected' };

        const updates: Promise<any>[] = conversationIds.map(id => {
            if (action === 'close') return fetch(`${GATEWAY_URL}/api/inbox/conversations/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'CLOSED' }) });
            if (action === 'spam') return fetch(`${GATEWAY_URL}/api/inbox/conversations/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'SPAM' }) });
            if (action === 'assign' && payload?.agentId) return fetch(`${GATEWAY_URL}/api/inbox/conversations/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ assignedTo: payload.agentId }) });
            if (action === 'unassign') return fetch(`${GATEWAY_URL}/api/inbox/conversations/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ assignedTo: null }) });
            return Promise.resolve();
        });

        await Promise.allSettled(updates);
        revalidatePath('/dashboard/inbox');
        return { success: true, count: conversationIds.length };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
