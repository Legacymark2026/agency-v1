/**
 * Inbox Service — Hexagonal Ports (Inbound & Outbound Interfaces)
 * ─────────────────────────────────────────────────────────────────────────────
 */
import {
  ConversationDomain,
  MessageDomain,
  SLAStatus,
  SLAConfigDomain,
} from "../domain/inbox.domain";

export interface SendMessageDTO {
  conversationId: string;
  senderId: string;
  content: string;
  mediaUrl?: string;
}

export interface IncomingMessageDTO {
  companyId: string;
  channel: string;
  senderPhoneOrId: string;
  content: string;
  mediaUrl?: string;
}

export interface IInboxUseCases {
  receiveIncoming(dto: IncomingMessageDTO): Promise<{ conversation: ConversationDomain; message: MessageDomain }>;
  replyMessage(dto: SendMessageDTO): Promise<MessageDomain>;
  getConversationSLA(conversationId: string, config?: SLAConfigDomain): Promise<{ status: SLAStatus; elapsedMinutes: number }>;
}

export interface IInboxRepositoryPort {
  findOrCreateConversation(companyId: string, channel: string, participantId: string): Promise<ConversationDomain>;
  findConversationById(id: string): Promise<ConversationDomain | null>;
  saveConversation(conv: ConversationDomain): Promise<ConversationDomain>;
  saveMessage(msg: MessageDomain): Promise<MessageDomain>;
}

export interface IChannelDispatcherPort {
  dispatch(channel: string, recipient: string, text: string, mediaUrl?: string): Promise<boolean>;
}

export interface IInboxEventPublisherPort {
  publishInboxEvent(topic: string, event: Record<string, any>): Promise<void>;
}
