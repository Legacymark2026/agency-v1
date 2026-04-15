
import { ChannelType, ProcessingResult } from "@/types/inbox";
import { ChannelProvider, OutboundMessage } from "./types";

class ChannelProviderRegistry {
    private providers: Map<ChannelType, ChannelProvider> = new Map();

    register(provider: ChannelProvider) {
        this.providers.set(provider.channel, provider);
        console.log(`[Integrations] Registered provider for ${provider.channel}`);
    }

    get(channel: ChannelType): ChannelProvider | undefined {
        return this.providers.get(channel);
    }

    async sendMessage(channel: ChannelType, message: OutboundMessage): Promise<ProcessingResult> {
        const provider = this.get(channel);
        if (!provider) {
            console.warn(`[Integrations] No provider found for channel ${channel}`);
            return { success: false, error: `No provider for channel ${channel}` };
        }
        return provider.sendMessage(message);
    }
}


import { FacebookProvider } from "./facebook";
import { InstagramProvider } from "./instagram";
import { WhatsAppProvider } from "./whatsapp";
import { TwitterProvider } from "./twitter";
import { LinkedInProvider } from "./linkedin";
import { YouTubeProvider } from "./youtube";

export const automationHub = new ChannelProviderRegistry();

// Initialize Providers (In a real app, load config from DB/Env)
automationHub.register(new FacebookProvider('MESSENGER'));
automationHub.register(new InstagramProvider());
automationHub.register(new WhatsAppProvider());
automationHub.register(new TwitterProvider());
automationHub.register(new LinkedInProvider());
automationHub.register(new YouTubeProvider());

