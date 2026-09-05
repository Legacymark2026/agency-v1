/**
 * Chat Ports (Hexagonal Architecture)
 * ─────────────────────────────────────────────────────────────────────────────
 * Inbound (Driver) & Outbound (Driven) Ports
 */
import {
  ChatChannelDomain,
  ChatMessageDomain,
  PresenceStatus,
  TypingIndicator,
  RealtimeEnvelope
} from "../domain/chat.domain";

export interface SendMessageDTO {
  companyId: string;
  channelId: string;
  senderId: string;
  senderName: string;
  content: string;
  type?: "TEXT" | "IMAGE" | "FILE" | "RICHTEXT_CARD";
  metadata?: Record<string, any>;
}

export interface CreateChannelDTO {
  companyId: string;
  name: string;
  description?: string;
  type: "PUBLIC" | "PRIVATE" | "DIRECT_MESSAGE";
  createdById: string;
  memberIds?: string[];
}

// Inbound Ports (Use Cases)
export interface IChatUseCases {
  sendMessage(dto: SendMessageDTO): Promise<ChatMessageDomain>;
  getChannelMessages(companyId: string, channelId: string, limit?: number, beforeCursor?: string): Promise<ChatMessageDomain[]>;
  createChannel(dto: CreateChannelDTO): Promise<ChatChannelDomain>;
  listUserChannels(companyId: string, userId: string): Promise<ChatChannelDomain[]>;
  setUserPresence(companyId: string, userId: string, status: "ONLINE" | "AWAY" | "OFFLINE"): Promise<void>;
  broadcastTyping(companyId: string, channelId: string, userId: string, userName: string): Promise<void>;
}

// Outbound Ports (Driven Adapters)
export interface IChatPersistencePort {
  saveMessage(msg: Omit<ChatMessageDomain, "id" | "createdAt" | "updatedAt" | "isEdited">): Promise<ChatMessageDomain>;
  findMessagesByChannel(companyId: string, channelId: string, limit: number, beforeDate?: Date): Promise<ChatMessageDomain[]>;
  createChannel(channel: Omit<ChatChannelDomain, "id" | "createdAt" | "updatedAt" | "isArchived">, memberIds?: string[]): Promise<ChatChannelDomain>;
  findChannelsForUser(companyId: string, userId: string): Promise<ChatChannelDomain[]>;
  isUserMemberOfChannel(companyId: string, channelId: string, userId: string): Promise<boolean>;
}

export interface IRealtimePubSubPort {
  publishChannelEvent(tenantId: string, channelId: string, envelope: RealtimeEnvelope): Promise<void>;
  subscribeToTenant(tenantId: string, handler: (envelope: RealtimeEnvelope) => void): Promise<void>;
  setPresence(presence: PresenceStatus): Promise<void>;
  getPresence(companyId: string, userId: string): Promise<PresenceStatus | null>;
  setTyping(typing: TypingIndicator): Promise<void>;
}
