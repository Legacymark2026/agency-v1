/**
 * Chat Domain Models & Value Objects
 * ─────────────────────────────────────────────────────────────────────────────
 * Pure hexagonal domain layer with strict multitenant boundary.
 */

export interface ChatChannelDomain {
  id: string;
  companyId: string;
  name: string;
  description?: string | null;
  type: "PUBLIC" | "PRIVATE" | "DIRECT_MESSAGE";
  isArchived: boolean;
  createdById: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ChatMessageDomain {
  id: string;
  channelId: string;
  companyId: string;
  senderId: string;
  senderName: string;
  content: string;
  type: "TEXT" | "IMAGE" | "FILE" | "RICHTEXT_CARD";
  metadata?: Record<string, any>;
  isEdited: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface PresenceStatus {
  userId: string;
  companyId: string;
  status: "ONLINE" | "AWAY" | "OFFLINE";
  lastSeenAt: number;
}

export interface TypingIndicator {
  channelId: string;
  companyId: string;
  userId: string;
  userName: string;
  timestamp: number;
}

export interface RealtimeEnvelope<T = any> {
  event: "message.created" | "typing.updated" | "presence.updated" | "channel.joined";
  tenantId: string;
  channelId?: string;
  payload: T;
  timestamp: string;
}
