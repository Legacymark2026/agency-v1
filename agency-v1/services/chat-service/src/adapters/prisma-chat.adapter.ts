/**
 * Prisma PostgreSQL Chat Persistence Adapter
 * ─────────────────────────────────────────────────────────────────────────────
 * Implements IChatPersistencePort with ACID relational isolation.
 */
import { prisma } from "@agency/database";
import { IChatPersistencePort } from "../core/ports/chat.ports";
import { ChatChannelDomain, ChatMessageDomain } from "../core/domain/chat.domain";

export class PrismaChatPersistenceAdapter implements IChatPersistencePort {
  public async saveMessage(
    msg: Omit<ChatMessageDomain, "id" | "createdAt" | "updatedAt" | "isEdited">
  ): Promise<ChatMessageDomain> {
    const created = await (prisma as any).chatMessage.create({
      data: {
        companyId: msg.companyId,
        channelId: msg.channelId,
        senderId: msg.senderId,
        senderName: msg.senderName,
        content: msg.content,
        type: msg.type,
        metadata: msg.metadata || {}
      }
    });

    return {
      id: created.id,
      companyId: created.companyId,
      channelId: created.channelId,
      senderId: created.senderId,
      senderName: created.senderName,
      content: created.content,
      type: created.type as any,
      metadata: created.metadata as any,
      isEdited: created.isEdited,
      createdAt: created.createdAt,
      updatedAt: created.updatedAt
    };
  }

  public async findMessagesByChannel(
    companyId: string,
    channelId: string,
    limit: number,
    beforeDate?: Date
  ): Promise<ChatMessageDomain[]> {
    const whereClause: any = {
      companyId,
      channelId
    };

    if (beforeDate) {
      whereClause.createdAt = { lt: beforeDate };
    }

    const messages = await (prisma as any).chatMessage.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
      take: limit
    });

    return messages.reverse().map((m: any) => ({
      id: m.id,
      companyId: m.companyId,
      channelId: m.channelId,
      senderId: m.senderId,
      senderName: m.senderName,
      content: m.content,
      type: m.type as any,
      metadata: m.metadata as any,
      isEdited: m.isEdited,
      createdAt: m.createdAt,
      updatedAt: m.updatedAt
    }));
  }

  public async createChannel(
    channel: Omit<ChatChannelDomain, "id" | "createdAt" | "updatedAt" | "isArchived">,
    memberIds: string[] = []
  ): Promise<ChatChannelDomain> {
    const created = await (prisma as any).chatChannel.create({
      data: {
        companyId: channel.companyId,
        name: channel.name,
        description: channel.description,
        type: channel.type,
        createdById: channel.createdById,
        members: {
          create: memberIds.map((userId) => ({
            companyId: channel.companyId,
            userId,
            role: userId === channel.createdById ? "OWNER" : "MEMBER"
          }))
        }
      }
    });

    return {
      id: created.id,
      companyId: created.companyId,
      name: created.name,
      description: created.description,
      type: created.type as any,
      isArchived: created.isArchived,
      createdById: created.createdById,
      createdAt: created.createdAt,
      updatedAt: created.updatedAt
    };
  }

  public async findChannelsForUser(companyId: string, userId: string): Promise<ChatChannelDomain[]> {
    const channels = await (prisma as any).chatChannel.findMany({
      where: {
        companyId,
        isArchived: false,
        OR: [
          { type: "PUBLIC" },
          { members: { some: { userId } } }
        ]
      },
      orderBy: { updatedAt: "desc" }
    });

    return channels.map((c: any) => ({
      id: c.id,
      companyId: c.companyId,
      name: c.name,
      description: c.description,
      type: c.type as any,
      isArchived: c.isArchived,
      createdById: c.createdById,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt
    }));
  }

  public async isUserMemberOfChannel(companyId: string, channelId: string, userId: string): Promise<boolean> {
    const channel = await (prisma as any).chatChannel.findFirst({
      where: {
        id: channelId,
        companyId,
        isArchived: false
      },
      include: {
        members: {
          where: { userId }
        }
      }
    });

    if (!channel) return false;
    if (channel.type === "PUBLIC") return true;
    return channel.members.length > 0;
  }
}
