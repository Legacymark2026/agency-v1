/**
 * Inbox Service — Prisma Infrastructure Adapter (Driven Outbound Port)
 * ─────────────────────────────────────────────────────────────────────────────
 */
import { prisma } from "@agency/database";
import { IInboxRepositoryPort } from "../core/ports/inbox.ports";
import { ConversationDomain, MessageDomain } from "../core/domain/inbox.domain";

export class PrismaInboxAdapter implements IInboxRepositoryPort {
  public async findOrCreateConversation(
    companyId: string,
    channel: string,
    participantId: string
  ): Promise<ConversationDomain> {
    try {
      let conv = await (prisma as any).conversation.findFirst({
        where: { companyId, channel, participantId },
      });

      if (!conv) {
        conv = await (prisma as any).conversation.create({
          data: {
            companyId,
            channel,
            participantId,
            status: "OPEN",
          },
        });
      }

      return new ConversationDomain(
        conv.id,
        conv.companyId,
        conv.channel,
        conv.participantId,
        conv.status,
        conv.updatedAt || new Date(),
        conv.unreadCount || 0,
        conv.createdAt
      );
    } catch {
      return new ConversationDomain("mock_id", companyId, channel, participantId);
    }
  }

  public async findConversationById(id: string): Promise<ConversationDomain | null> {
    try {
      const conv = await (prisma as any).conversation.findUnique({ where: { id } });
      if (!conv) return null;
      return new ConversationDomain(
        conv.id,
        conv.companyId,
        conv.channel,
        conv.participantId,
        conv.status,
        conv.updatedAt || new Date(),
        conv.unreadCount || 0,
        conv.createdAt
      );
    } catch {
      return null;
    }
  }

  public async saveConversation(conv: ConversationDomain): Promise<ConversationDomain> {
    try {
      await (prisma as any).conversation.update({
        where: { id: conv.id },
        data: {
          status: conv.status,
          updatedAt: conv.lastMessageAt,
          unreadCount: conv.unreadCount,
        },
      });
    } catch {}
    return conv;
  }

  public async saveMessage(msg: MessageDomain): Promise<MessageDomain> {
    try {
      await (prisma as any).message.create({
        data: {
          id: msg.id,
          conversationId: msg.conversationId,
          senderId: msg.senderId,
          direction: msg.direction,
          content: msg.content,
          mediaUrl: msg.mediaUrl,
          createdAt: msg.createdAt,
        },
      });
    } catch {}
    return msg;
  }
}
