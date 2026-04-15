'use server';

import { db } from "@/lib/db";
import { prisma } from "@/lib/prisma"; // A-2: static import (no dynamic)
import { auth } from "@/lib/auth";    // A-2: static import (no dynamic)
import { revalidatePath } from "next/cache";
import { ChannelType } from "@/types/inbox";
import { rateLimit } from "@/lib/rate-limit"; // A-5: rate limiting
import { createLead } from "@/modules/leads/actions/leads";
// --- Types ---
export interface GetConversationsParams {
    companyId: string;
    status?: string;
    channel?: string;
    assignedTo?: string;
    search?: string;
    page?: number;
    limit?: number;
}

// --- Actions ---

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


        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            include: { companies: true }
        });
        let companyId = user?.companies[0]?.companyId;

        // Fallback for single-tenant / reset scenarios: Use default company
        if (!companyId) {
            const defaultCompany = await prisma.company.findFirst();
            if (defaultCompany) {
                companyId = defaultCompany.id;
            }
        }

        if (!companyId) return { success: false, error: "No company found" };
        const skip = (page - 1) * limit;

        const where: any /* eslint-disable-line @typescript-eslint/no-explicit-any */ = {
            companyId,
            ...(status && { status }),
            ...(channel && { channel }),
            ...(assignedTo && { assignedTo }),
        };

        if (search) {
            where.OR = [
                { lead: { name: { contains: search, mode: 'insensitive' } } },
                { lead: { email: { contains: search, mode: 'insensitive' } } },
                { messages: { some: { content: { contains: search, mode: 'insensitive' } } } }
            ];
        }

        const [conversations, total] = await Promise.all([
            db.conversation.findMany({
                where,
                include: {
                    lead: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            // image: true, // Field does not exist on Lead model
                        }
                    },
                    assignee: {
                        select: {
                            id: true,
                            name: true,
                            image: true
                        }
                    },
                    _count: {
                        select: { messages: true }
                    }
                },
                orderBy: {
                    lastMessageAt: 'desc'
                },
                skip,
                take: limit
            }),
            db.conversation.count({ where })
        ]);

        return {
            success: true,
            data: conversations,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        };
    } catch (error) {
        console.error("Error fetching conversations:", error);
        return { success: false, error: "Failed to fetch conversations" };
    }
}

export async function getMessages(conversationId: string) {
    try {
        const messages = await db.message.findMany({
            where: { conversationId },
            orderBy: { createdAt: 'asc' },
            include: {
                conversation: {
                    select: {
                        channel: true,
                        lead: {
                            select: {
                                id: true,
                                name: true,
                                email: true
                            }
                        }
                    }
                }
            }
        });

        // Mark as read when fetching
        await db.conversation.update({
            where: { id: conversationId },
            data: { unreadCount: 0 }
        });

        return { success: true, data: messages };
    } catch (error) {
        console.error("Error fetching messages:", error);
        return { success: false, error: "Failed to fetch messages" };
    }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function sendMessage(conversationId: string, content: string, userId: string, attachments: any[] = []) {
    try {
        if (!content && attachments.length === 0) {
            return { success: false, error: "Message content or attachment required" };
        }

        // 1. Create the message in DB
        const message = await db.message.create({
            data: {
                conversationId,
                content,
                direction: 'OUTBOUND',
                senderId: userId,
                status: 'SENT',
                // For MVP, handling first attachment as mediaUrl if present
                mediaUrl: attachments.length > 0 ? attachments[0].url : null,
                mediaType: attachments.length > 0 ? attachments[0].type : null,
            }
        });

        // 2. Update Conversation (last message, preview)
        await db.conversation.update({
            where: { id: conversationId },
            data: {
                lastMessageAt: new Date(),
                lastMessagePreview: content.substring(0, 50) + (content.length > 50 ? '...' : ''),
                status: 'OPEN' // Re-open if closed
            }
        });

        // 3. Integrate with Meta API
        const conversation = await db.conversation.findUnique({
            where: { id: conversationId },
            include: { lead: true }
        });

        if (conversation && (conversation.channel === 'FACEBOOK' || conversation.channel === 'MESSENGER' || conversation.channel === 'INSTAGRAM') && conversation.metadata) {

            // Dynamic Import to avoid cycle
            const { MetaService } = await import("@/lib/services/meta-sync");

            const meta = conversation.metadata as any; // Cast JSON to expected shape

            // We need the page access token.
            // Improvement: Store pageAccessToken in Account or Metadata. For now, fetch from User Accounts.
            const { pages } = await MetaService.getConnectedPages(userId, conversation.companyId);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const page = pages.find((p: any) => p.id === meta.pageId);

            if (page && meta.recipientId) {
                await MetaService.sendReply(
                    meta.recipientId,
                    page.id,
                    content,
                    page.access_token
                );
            } else {
                console.warn("[Inbox] Cannot send Meta reply: Missing Page Context or Recipient ID in metadata");
            }
        } else if (conversation && conversation.channel === 'WHATSAPP') {
            const { automationHub } = await import("@/lib/integrations/providers");
            const waProvider = automationHub.get('WHATSAPP');
            if (waProvider) {
                await waProvider.sendMessage({
                    conversationId: conversation.platformId || conversation.lead?.phone || '',
                    content: content,
                    attachments: attachments
                });
            } else {
                console.warn("[Inbox] WhatsApp provider not configured");
            }
        }

        revalidatePath(`/dashboard/inbox`);
        return { success: true, data: message };
    } catch (error) {
        console.error("Error sending message:", error);
        return { success: false, error: "Failed to send message" };
    }
}

export async function createConversation(companyId: string, leadId: string, channel: string) {
    try {
        // Check if exists
        const existing = await db.conversation.findFirst({
            where: {
                companyId,
                leadId,
                channel,
                status: { not: 'ARCHIVED' }
            }
        });

        if (existing) {
            return { success: true, data: existing, isNew: false };
        }

        const conversation = await db.conversation.create({
            data: {
                companyId,
                leadId,
                channel,
                status: 'OPEN',
                lastMessageAt: new Date(),
                lastMessagePreview: 'New conversation started'
            }
        });

        revalidatePath(`/dashboard/inbox`);
        return { success: true, data: conversation, isNew: true };
    } catch (error) {
        console.error("Error creating conversation:", error);
        return { success: false, error: "Failed to create conversation" };
    }
}

export async function updateConversationStatus(conversationId: string, status: string) {
    try {
        const conversation = await db.conversation.update({
            where: { id: conversationId },
            data: { status }
        });

        revalidatePath(`/dashboard/inbox`);
        return { success: true, data: conversation };
    } catch (error) {
        console.error("Error updating status:", error);
        return { success: false, error: "Failed to update status" };
    }
}

/**
 * Logs a contact attempt from the CRM Lead profile into the Inbox
 * by creating or ensuring an open conversation exists for the channel.
 */
export async function logLeadContact(leadId: string, channel: string) {
    try {
        const session = await auth();
        if (!session?.user?.id) return { success: false, error: "Unauthorized" };

        const lead = await db.lead.findUnique({
            where: { id: leadId },
            select: { companyId: true, email: true, phone: true }
        });

        if (!lead) return { success: false, error: "Lead not found" };

        // 1. Ensure conversation exists
        let conversation = await db.conversation.findFirst({
            where: {
                companyId: lead.companyId,
                leadId: leadId,
                channel: channel
            }
        });

        if (!conversation) {
            let platformId = undefined;
            if (channel === 'WHATSAPP' || channel === 'PHONE' || channel === 'SMS') platformId = lead.phone;
            if (channel === 'EMAIL') platformId = lead.email;

            conversation = await db.conversation.create({
                data: {
                    companyId: lead.companyId,
                    leadId: leadId,
                    channel: channel,
                    status: 'OPEN',
                    platformId: platformId,
                    lastMessageAt: new Date(),
                    lastMessagePreview: `Contact initiated via ${channel}`
                }
            });
        } else if (conversation.status === 'ARCHIVED' || conversation.status === 'CLOSED') {
            conversation = await db.conversation.update({
                where: { id: conversation.id },
                data: { status: 'OPEN', lastMessageAt: new Date(), lastMessagePreview: `Contact initiated via ${channel} (Reopened)` }
            });
        }

        // Note: For a true OmniChannel feeling, we could also log a system message here.
        // But simply creating the conversation is enough for the inbox to track it.

        revalidatePath('/dashboard/inbox');
        return { success: true, conversationId: conversation.id };
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

        // Auto-detect company from session if creating a simulation manually
        if (companyId === 'default-company-id' || !companyId) {
            const session = await auth();
            if (session?.user?.id) {
                // A-5: Rate limit para simulación de mensajes entrantes (10/min)
                const allowed = rateLimit(`simulate_msg:${session.user.id}`, 10, 60_000);
                if (!allowed) return { success: false, error: "Rate limit: demasiadas simulaciones. Espera un momento." };

                const userCompany = await prisma.companyUser.findFirst({
                    where: { userId: session.user.id },
                    select: { companyId: true }
                });
                if (userCompany) {
                    companyId = userCompany.companyId;
                }
            }
        }

        // 1. Find or Create Lead
        let lead = await db.lead.findFirst({
            where: {
                companyId,
                OR: [
                    { email: senderHandle.includes('@') ? senderHandle : undefined },
                    { phone: !senderHandle.includes('@') ? senderHandle : undefined }
                ]
            }
        });

        if (!lead) {
            const result = await createLead({
                companyId,
                name: senderName || 'Social User',
                email: senderHandle.includes('@') ? senderHandle : `temp-${Date.now()}@example.com`,
                phone: !senderHandle.includes('@') ? senderHandle : undefined,
                utmSource: channel,
                tags: [`${channel.toLowerCase()}-inbound`, 'simulated']
            });

            if (result.success && result.data) {
                lead = result.data as any;
            } else {
                console.error("[simulateIncomingMessage] Could not use createLead, falling back to manual prisma insertion:", result.error);
                lead = await db.lead.create({
                    data: {
                        companyId,
                        name: senderName,
                        email: senderHandle.includes('@') ? senderHandle : `temp-${Date.now()}@example.com`,
                        phone: !senderHandle.includes('@') ? senderHandle : undefined,
                        status: 'NEW',
                        source: channel
                    }
                });
            }
        }
        
        if (!lead) throw new Error("Could not find or create lead");

        // 2. Find or Create Conversation
        let conversation = await db.conversation.findFirst({
            where: {
                companyId,
                leadId: lead.id,
                channel,
                status: { not: 'ARCHIVED' }
            }
        });

        if (!conversation) {
            conversation = await db.conversation.create({
                data: {
                    companyId,
                    leadId: lead.id,
                    channel,
                    status: 'OPEN',
                    lastMessageAt: new Date(),
                    lastMessagePreview: content.substring(0, 50)
                }
            });
        } else {
            await db.conversation.update({
                where: { id: conversation.id },
                data: {
                    status: 'OPEN',
                    lastMessageAt: new Date(),
                    lastMessagePreview: content.substring(0, 50)
                }
            });
        }

        // 3. Create Message
        await db.message.create({
            data: {
                conversationId: conversation.id,
                content,
                direction: 'INBOUND',
                status: 'RECEIVED',
                senderId: lead.id
            }
        });

        revalidatePath('/dashboard/inbox');

        // 4. Trigger Omnichannel AI Agent (Copilot) in the background
        const { triggerOmnichannelAgent } = await import("@/lib/services/ai-inbox");
        triggerOmnichannelAgent(conversation.id, companyId).catch(err => 
             console.error("[simulateIncomingMessage] Error in background AI dispatch:", err)
        );

        return { success: true };

    } catch (error: any) /* eslint-disable-line @typescript-eslint/no-explicit-any */ {
        console.error("Simulation error:", error);
        return { success: false, error: error.message };
    }
}

// ==================== META INBOX INTEGRATION ====================

export async function syncMetaConversations() {
    const session = await auth();

    if (!session?.user?.id) {
        console.error("[syncMetaConversations] Unauthorized. No session.");
        return { success: false, error: "Unauthorized" };
    }
    console.log(`[syncMetaConversations] Caller: ${session.user.id}`);

    // A-5: Rate limit para sincronización Meta (5 veces por minuto)
    const allowed = rateLimit(`sync_meta:${session.user.id}`, 5, 60_000);
    if (!allowed) return { success: false, error: "Rate limit: espera antes de sincronizar de nuevo." };

    // Get user's company
    const userCompany = await prisma.companyUser.findFirst({
        where: { userId: session.user.id },
        select: { companyId: true }
    });

    if (!userCompany) {
        return { success: false, error: "No company found for user" };
    }

    try {
        console.log(`[syncMetaConversations] Executing for user ${session.user.id}, company ${userCompany.companyId}`);
        const { MetaSyncService } = await import("@/lib/services/meta-sync");
        const result = await MetaSyncService.syncAllConversations(
            session.user.id,
            userCompany.companyId
        );

        // Revalidate inbox page to show new conversations
        revalidatePath('/dashboard/inbox');

        return result;
    } catch (error: any) /* eslint-disable-line @typescript-eslint/no-explicit-any */ {
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
        const lead = await prisma.lead.findUnique({
            where: { id: leadId },
            include: {
                marketingEvents: {
                    orderBy: { createdAt: 'desc' },
                    take: 10
                },
                campaign: true,
                conversations: {
                    orderBy: { lastMessageAt: 'desc' },
                    take: 5,
                    select: {
                        id: true,
                        channel: true,
                        status: true,
                        lastMessageAt: true
                    }
                }
            }
        });

        if (!lead) return null;

        return lead;
    } catch (error) {
        console.error("Error fetching lead details:", error);
        return null;
    }
}

export async function draftCopilotServerAction(conversationId: string) {
    try {
        const session = await auth();
        if (!session?.user?.id) return { success: false, error: "Unauthorized" };

        const { draftCopilotReply } = await import("@/lib/services/ai-inbox");
        const reply = await draftCopilotReply(conversationId);
        
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
        
        // 1. Get Conversation & Macro
        const conversation = await db.conversation.findUnique({
            where: { id: conversationId },
            include: { lead: true }
        });
        if (!conversation) return { success: false, error: "Conversation not found" };

        const macro: any = await db.inboxMacro.findUnique({
            where: { id: macroId }
        });

        if (!macro || !macro.isActive || macro.companyId !== conversation.companyId) {
            return { success: false, error: "Macro not available" };
        }

        const payload = macro.payload as any || {};
        let systemNoteText = '';
        let messageToSend = '';

        // 2. Execute Logic based on ActionType
        switch (macro.actionType) {
            case 'TEXT_REPLY': {
                messageToSend = payload.textTemplate || 'Respuesta rápida de macro';
                // Very basic variable replacement
                if (conversation.lead?.name) {
                    messageToSend = messageToSend.replace('{{lead.name}}', conversation.lead.name.split(' ')[0]);
                }
                systemNoteText = `🤖 [MACRO: ${macro.title}] Ejecutado.`;
                break;
            }
            case 'ASSIGN_TAG': {
                const newTags = payload.tagsToAdd || [];
                // Update Conversation Tags (Assuming we store tags as array)
                const currentTags = Array.isArray((conversation as any).tags) ? (conversation as any).tags : [];
                const mergedTags = Array.from(new Set([...currentTags, ...newTags]));
                
                await db.conversation.update({
                    where: { id: conversation.id },
                    data: { tags: mergedTags } as any
                });
                systemNoteText = `🤖 [MACRO: ${macro.title}] Agregó etiquetas: ${newTags.join(', ')}`;
                break;
            }
            case 'ESCALATE': {
                const targetUserId = payload.assignToId;
                if (targetUserId) {
                    // Pre-validate that the agent exists to avoid foreign key failures
                    const targetUser = await db.user.findUnique({ where: { id: targetUserId } });
                    
                    if (targetUser) {
                        await db.conversation.update({
                            where: { id: conversation.id },
                            data: { assignedTo: targetUserId }
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
                const leadInvoice = await db.invoice.findFirst({
                    where: { leadId: conversation.leadId || undefined },
                    orderBy: { createdAt: 'desc' }
                });
                
                let payUrl = '';
                if (leadInvoice) {
                    payUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://legacymark.com'}/es/invoice/${leadInvoice.token}`;
                } else {
                    payUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://legacymark.com'}/checkout`;
                }
                
                messageToSend = `Por favor, realiza tu pago seguro a través de este enlace de PayU:\n${payUrl}`;
                systemNoteText = `🤖 [MACRO: ${macro.title}] Generó y envió enlace de PayU.`;
                break;
            }
            case 'WEBHOOK': {
                // Mock webhook simulation
                systemNoteText = `🤖 [MACRO: ${macro.title}] Llamó al Webhook en ${payload.webhookUrl}`;
                break;
            }
            default:
                systemNoteText = `🤖 [MACRO: ${macro.title}] Acción ejecutada.`;
        }
        
        // 3. Send out the message to lead if required
        if (messageToSend) {
             const result = await sendMessage(conversation.id, messageToSend, session.user.id, []);
             if (!result.success) {
                  return { success: false, error: "Failed to send macro message" };
             }
        }

        // 4. Record the internal macro event if we have a systemNoteText
        if (systemNoteText && !messageToSend) {
            await db.message.create({
                data: {
                    conversationId,
                    content: systemNoteText,
                    direction: 'INTERNAL',
                    senderId: session.user.id,
                    status: 'SENT'
                }
            });
        }

        // 5. Re-open / Update Status
        await db.conversation.update({
            where: { id: conversationId },
            data: {
                status: 'OPEN',
                lastMessageAt: new Date(),
                // Keep the preview as message or note
                lastMessagePreview: messageToSend ? messageToSend.substring(0, 50) : systemNoteText.substring(0, 50)
            }
        });
        
        revalidatePath('/dashboard/inbox');
        return { success: true };
    } catch (error: any) {
        console.error("Error executing macro:", error);
        return { success: false, error: error.message };
    }
}
