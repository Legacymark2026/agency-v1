import { ChannelType, ProcessingResult } from "@/types/inbox";

/**
 * T-1 Fix: Attachment tipado correctamente — elimina `any[]`
 */
export interface Attachment {
    url: string;
    type: "image" | "video" | "audio" | "document" | "sticker";
    name?: string;
    mimeType?: string;
    size?: number;
}

export interface OutboundTemplate {
    name: string;
    language: string; // e.g. "es", "en_US"
    components?: any[]; // Meta template components (header/body/buttons params)
}

export interface OutboundMessage {
    conversationId: string;
    content: string;
    attachments?: Attachment[];
    replyToId?: string;
    pageId?: string; // Optional: Context for multi-page/number setups
    template?: OutboundTemplate; // WhatsApp pre-approved template (24h window override)
}

export interface InboundMessage {
    channel: ChannelType;
    externalId: string;
    content: string;
    sender: {
        id: string;
        name: string;
        avatar?: string;
    };
    attachments?: Attachment[];
    metadata?: Record<string, unknown>;
    images?: string[];
}

export interface ChannelProvider {
    channel: ChannelType;
    sendMessage(message: OutboundMessage): Promise<ProcessingResult>;
    verifySignature(request: Request): Promise<boolean>;
    validateWebhook(request: Request): Promise<boolean>;
    parseWebhook(request: Request): Promise<InboundMessage | null>;
}
