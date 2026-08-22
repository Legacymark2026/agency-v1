"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InboxService = void 0;
const database_1 = require("@agency/database");
const events_1 = require("@agency/events");
const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";
const eventBus = new events_1.EventBus(REDIS_URL, "inbox-service");
class InboxService {
    /**
     * Obtener conversaciones por companyId (o todas si companyId es opcional)
     */
    static async getConversations(companyId, status, page = 1, limit = 20, search) {
        const where = {};
        if (companyId)
            where.companyId = companyId;
        if (status)
            where.status = status;
        if (search) {
            where.OR = [
                { lead: { name: { contains: search, mode: 'insensitive' } } },
                { lead: { email: { contains: search, mode: 'insensitive' } } },
                { lastMessagePreview: { contains: search, mode: 'insensitive' } },
            ];
        }
        const skip = (page - 1) * limit;
        let [conversations, total] = await Promise.all([
            database_1.prisma.conversation.findMany({
                where,
                orderBy: { updatedAt: "desc" },
                take: limit,
                skip,
                include: { lead: true, messages: { take: 1, orderBy: { createdAt: "desc" } } }
            }),
            database_1.prisma.conversation.count({ where })
        ]);
        // Resilient fallback if companyId filter yielded 0 results
        if (conversations.length === 0 && companyId) {
            delete where.companyId;
            [conversations, total] = await Promise.all([
                database_1.prisma.conversation.findMany({
                    where,
                    orderBy: { updatedAt: "desc" },
                    take: limit,
                    skip,
                    include: { lead: true, messages: { take: 1, orderBy: { createdAt: "desc" } } }
                }),
                database_1.prisma.conversation.count({ where })
            ]);
        }
        return { conversations, total, page, limit };
    }
    /**
     * Obtener conversación por ID (o por Lead ID con autocreación si no existe)
     */
    static async getConversationById(id) {
        // 1. Búsqueda por ID de conversación
        let conversation = await database_1.prisma.conversation.findUnique({
            where: { id },
            include: {
                lead: true,
                messages: { take: 50, orderBy: { createdAt: "asc" } }
            }
        });
        // 2. Búsqueda por Lead ID
        if (!conversation) {
            conversation = await database_1.prisma.conversation.findFirst({
                where: { leadId: id },
                include: {
                    lead: true,
                    messages: { take: 50, orderBy: { createdAt: "asc" } }
                },
                orderBy: { updatedAt: "desc" }
            });
        }
        // 3. Autocreación si existe el Lead en la BD
        if (!conversation) {
            const lead = await database_1.prisma.lead.findUnique({ where: { id } });
            if (lead) {
                let targetCompanyId = lead.companyId;
                if (!targetCompanyId) {
                    const firstCompany = await database_1.prisma.company.findFirst({ select: { id: true } });
                    targetCompanyId = firstCompany?.id;
                }
                if (targetCompanyId) {
                    conversation = await database_1.prisma.conversation.create({
                        data: {
                            companyId: targetCompanyId,
                            leadId: lead.id,
                            contactName: lead.name || "Cliente CRM",
                            channel: "WEB_FORM",
                            status: "OPEN",
                            lastMessagePreview: "Conversación iniciada desde el CRM",
                        },
                        include: {
                            lead: true,
                            messages: { take: 50, orderBy: { createdAt: "asc" } }
                        }
                    });
                }
            }
        }
        return conversation;
    }
    /**
     * Obtener mensajes de una conversación
     */
    static async getMessages(conversationId) {
        const messages = await database_1.prisma.message.findMany({
            where: { conversationId },
            orderBy: { createdAt: "asc" }
        });
        return messages;
    }
    /**
     * Actualizar conversación (asignación, estado, etiquetas, etc.)
     */
    static async updateConversation(id, data) {
        const conversation = await database_1.prisma.conversation.update({
            where: { id },
            data,
            include: { lead: true }
        });
        await eventBus.publish("deal.stage_changed", {
            conversationId: conversation.id,
            status: conversation.status,
            assignedTo: conversation.assignedTo,
            timestamp: new Date().toISOString()
        });
        return conversation;
    }
    /**
     * Enviar mensaje dentro de una conversación
     */
    static async sendMessage(input) {
        return database_1.prisma.$transaction(async (tx) => {
            const message = await tx.message.create({
                data: {
                    conversationId: input.conversationId,
                    senderId: input.senderId,
                    senderType: input.senderType || "AGENT",
                    content: input.content,
                    channel: input.channel || "WEB",
                    attachments: input.attachments || [],
                }
            });
            await tx.conversation.update({
                where: { id: input.conversationId },
                data: {
                    lastMessageAt: new Date(),
                    lastMessagePreview: input.content,
                    updatedAt: new Date()
                }
            });
            await eventBus.publish("message.sent", {
                messageId: message.id,
                conversationId: message.conversationId,
                senderId: message.senderId,
                senderType: message.senderType,
                channel: message.channel,
                timestamp: new Date().toISOString()
            });
            return message;
        });
    }
}
exports.InboxService = InboxService;
//# sourceMappingURL=inbox.service.js.map