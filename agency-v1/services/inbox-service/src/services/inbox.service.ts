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
   * Obtener conversaciones por companyId
   */
  static async getConversations(companyId: string, status?: string, page = 1, limit = 20) {
    const where: Record<string, unknown> = { companyId };
    if (status) where.status = status;

    const skip = (page - 1) * limit;

    const [conversations, total] = await Promise.all([
      prisma.conversation.findMany({
        where,
        orderBy: { updatedAt: "desc" },
        take: limit,
        skip,
        include: { messages: { take: 1, orderBy: { createdAt: "desc" } } }
      }),
      prisma.conversation.count({ where })
    ]);

    return { conversations, total, page, limit };
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
          senderType: input.senderType,
          content: input.content,
          channel: input.channel || "WEB",
          attachments: input.attachments || [],
        }
      });

      await tx.conversation.update({
        where: { id: input.conversationId },
        data: { lastMessageAt: new Date(), updatedAt: new Date() }
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
