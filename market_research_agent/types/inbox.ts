export type ChannelType = 'WHATSAPP' | 'MESSENGER' | 'INSTAGRAM' | 'TWITTER' | 'LINKEDIN' | 'EMAIL' | 'SMS' | 'YOUTUBE';

export type ConversationStatus = 'OPEN' | 'CLOSED' | 'SNOOZED' | 'ARCHIVED';

export interface ConnectorConfig {
    enabled: boolean;
    channel: ChannelType;
    credentials?: any;
}

export interface ProcessingResult {
    success: boolean;
    messageId?: string;
    error?: string;
}

export interface User {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
}

export interface Lead {
    id: string;
    name: string;
    email?: string | null;
    phone?: string | null;
    image?: string | null;
    companyId: string;
    status: string;
    source: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface Conversation {
    id: string;
    companyId: string;
    leadId: string;
    lead?: Lead | null;
    channel: ChannelType;
    status: ConversationStatus;
    unreadCount: number;
    lastMessageAt: Date;
    lastMessagePreview?: string | null;
    assignedTo?: string | null;
    assignee?: User | null;
    metadata?: any;
    createdAt: Date;
    updatedAt: Date;
    messages?: Message[];
}

export interface Message {
    id: string;
    conversationId: string;
    content: string;
    direction: 'INBOUND' | 'OUTBOUND';
    status: 'SENT' | 'DELIVERED' | 'READ' | 'RECEIVED' | 'FAILED';
    senderId: string;
    mediaUrl?: string | null;
    mediaType?: string | null;
    metadata?: any;
    createdAt: Date;
    updatedAt: Date;
}
