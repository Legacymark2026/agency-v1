
import { ChannelType, ProcessingResult } from "@/types/inbox";
import { ChannelProvider, OutboundMessage, InboundMessage } from "./types";

export class MockProvider implements ChannelProvider {
    channel: ChannelType;

    constructor(channel: ChannelType) {
        this.channel = channel;
    }

    async sendMessage(message: OutboundMessage): Promise<ProcessingResult> {
        console.log(`[MockProvider:${this.channel}] Sending message:`, message);
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 800));
        return { success: true, messageId: `mock-${Date.now()}` };
    }

    async validateWebhook(request: Request): Promise<boolean> {
        return true;
    }

    async parseWebhook(request: Request): Promise<InboundMessage | null> {
        return null;
    }

    async verifySignature(request: Request): Promise<boolean> {
        // Mock: always valid
        return true;
    }
}
