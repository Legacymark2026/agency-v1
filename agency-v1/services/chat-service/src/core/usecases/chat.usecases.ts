/**
 * Chat Use Cases (Core Application Logic)
 * ─────────────────────────────────────────────────────────────────────────────
 * Implements IChatUseCases with strict tenant boundary enforcement.
 */
import {
  IChatUseCases,
  IChatPersistencePort,
  IRealtimePubSubPort,
  SendMessageDTO,
  CreateChannelDTO
} from "../ports/chat.ports";
import { ChatChannelDomain, ChatMessageDomain } from "../domain/chat.domain";

export class ChatUseCases implements IChatUseCases {
  constructor(
    private readonly persistence: IChatPersistencePort,
    private readonly pubSub: IRealtimePubSubPort
  ) {}

  public async sendMessage(dto: SendMessageDTO): Promise<ChatMessageDomain> {
    if (!dto.content || dto.content.trim().length === 0) {
      throw new Error("Message content cannot be empty.");
    }

    // Multitenant boundary check: User must be member of channel in company
    const isMember = await this.persistence.isUserMemberOfChannel(dto.companyId, dto.channelId, dto.senderId);
    if (!isMember) {
      throw new Error("Unauthorized: User does not belong to this channel or company.");
    }

    const savedMessage = await this.persistence.saveMessage({
      companyId: dto.companyId,
      channelId: dto.channelId,
      senderId: dto.senderId,
      senderName: dto.senderName,
      content: dto.content.trim(),
      type: dto.type || "TEXT",
      metadata: dto.metadata || {}
    });

    // Broadcast in real-time across all horizontal pods
    await this.pubSub.publishChannelEvent(dto.companyId, dto.channelId, {
      event: "message.created",
      tenantId: dto.companyId,
      channelId: dto.channelId,
      payload: savedMessage,
      timestamp: new Date().toISOString()
    });

    return savedMessage;
  }

  public async getChannelMessages(
    companyId: string,
    channelId: string,
    limit: number = 50,
    beforeCursor?: string
  ): Promise<ChatMessageDomain[]> {
    const beforeDate = beforeCursor ? new Date(beforeCursor) : undefined;
    return this.persistence.findMessagesByChannel(companyId, channelId, limit, beforeDate);
  }

  public async createChannel(dto: CreateChannelDTO): Promise<ChatChannelDomain> {
    if (!dto.name || dto.name.trim().length === 0) {
      throw new Error("Channel name is required.");
    }

    const members = dto.memberIds || [];
    if (!members.includes(dto.createdById)) {
      members.push(dto.createdById);
    }

    return this.persistence.createChannel(
      {
        companyId: dto.companyId,
        name: dto.name.trim(),
        description: dto.description || null,
        type: dto.type,
        createdById: dto.createdById
      },
      members
    );
  }

  public async listUserChannels(companyId: string, userId: string): Promise<ChatChannelDomain[]> {
    return this.persistence.findChannelsForUser(companyId, userId);
  }

  public async setUserPresence(
    companyId: string,
    userId: string,
    status: "ONLINE" | "AWAY" | "OFFLINE"
  ): Promise<void> {
    await this.pubSub.setPresence({
      companyId,
      userId,
      status,
      lastSeenAt: Date.now()
    });
  }

  public async broadcastTyping(
    companyId: string,
    channelId: string,
    userId: string,
    userName: string
  ): Promise<void> {
    await this.pubSub.setTyping({
      companyId,
      channelId,
      userId,
      userName,
      timestamp: Date.now()
    });
  }
}
