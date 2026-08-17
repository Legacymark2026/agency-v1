import { prisma } from "@agency/database";
import { EventBus } from "@agency/events";

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";
const eventBus = new EventBus(REDIS_URL, "inbox-service");

export interface SendMessageInput {
  conversationId: string;
  senderId: string;
  senderType: "AGENT" | "CUSTOMER" | "BOT" | "SYSTEM";
  content: string;
  channel?: string;
  attachments?: any[];
}

export class InboxService {
  /**
   * Obtener conversaciones por companyId (o todas si companyId es opcional)
   */
  static async getConversations(companyId?: string, status?: string, page = 1, limit = 20, search?: string) {
    const where: Record<string, unknown> = {};
    if (companyId) where.companyId = companyId;
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { lead: { name: { contains: search, mode: 'insensitive' } } },
        { lead: { email: { contains: search, mode: 'insensitive' } } },
        { lastMessagePreview: { contains: search, mode: 'insensitive' } },
      ];
    }

    const skip = (page - 1) * limit;

    let [conversations, total] = await Promise.all([
      prisma.conversation.findMany({
        where,
        orderBy: { updatedAt: "desc" },
        take: limit,
        skip,
        include: { lead: true, messages: { take: 1, orderBy: { createdAt: "desc" } } }
      }),
      prisma.conversation.count({ where })
    ]);

    // Resilient fallback if companyId filter yielded 0 results
    if (conversations.length === 0 && companyId) {
      delete where.companyId;
      [conversations, total] = await Promise.all([
        prisma.conversation.findMany({
          where,
          orderBy: { updatedAt: "desc" },
          take: limit,
          skip,
          include: { lead: true, messages: { take: 1, orderBy: { createdAt: "desc" } } }
        }),
        prisma.conversation.count({ where })
      ]);
    }

    return { conversations, total, page, limit };
  }

  /**
   * Obtener conversación por ID (o por Lead ID con autocreación si no existe)
   */
  static async getConversationById(id: string) {
    // 1. Búsqueda por ID de conversación
    let conversation = await prisma.conversation.findUnique({
      where: { id },
      include: {
        lead: true,
        messages: { take: 50, orderBy: { createdAt: "asc" } }
      }
    });

    // 2. Búsqueda por Lead ID
    if (!conversation) {
      conversation = await prisma.conversation.findFirst({
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
      const lead = await prisma.lead.findUnique({ where: { id } });
      if (lead) {
        let targetCompanyId = lead.companyId;
        if (!targetCompanyId) {
          const firstCompany = await prisma.company.findFirst({ select: { id: true } });
          targetCompanyId = firstCompany?.id;
        }

        if (targetCompanyId) {
          conversation = await prisma.conversation.create({
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
  static async getMessages(conversationId: string) {
    const messages = await prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: "asc" }
    });

    return messages;
  }

  /**
   * Actualizar conversación (asignación, estado, etiquetas, etc.)
   */
  static async updateConversation(id: string, data: Record<string, unknown>) {
    const conversation = await prisma.conversation.update({
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
  static async sendMessage(input: SendMessageInput) {
    return prisma.$transaction(async (tx: any) => {
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

