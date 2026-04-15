
import { ChannelType, ProcessingResult } from "@/types/inbox";
import { ChannelProvider, OutboundMessage, InboundMessage } from "./types";

export class LinkedInProvider implements ChannelProvider {
    channel: ChannelType = 'LINKEDIN';
    private accessToken: string;

    constructor(token: string = '') {
        this.accessToken = token;
    }

    async sendMessage(message: OutboundMessage): Promise<ProcessingResult> {
        console.log(`[LinkedInProvider] Sending message to ${message.conversationId}`);

        if (!this.accessToken) {
            await new Promise(resolve => setTimeout(resolve, 700));
            return { success: true, messageId: `li-mock-${Date.now()}` };
        }

        return { success: true, messageId: `li-${Date.now()}` };
    }

    async verifySignature(request: Request): Promise<boolean> {
        return true;
    }

    async validateWebhook(request: Request): Promise<boolean> {
        return true;
    }

    async parseWebhook(request: Request): Promise<InboundMessage | null> {
        return null;
    }
}
