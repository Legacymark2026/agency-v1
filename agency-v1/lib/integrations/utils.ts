
import { ChannelType } from "@/types/inbox";

export const getChannelLabel = (channel: ChannelType): string => {
    switch (channel) {
        case 'WHATSAPP': return 'WhatsApp';
        case 'MESSENGER': return 'Messenger';
        case 'INSTAGRAM': return 'Instagram';
        case 'TWITTER': return 'X (Twitter)';
        case 'LINKEDIN': return 'LinkedIn';
        case 'YOUTUBE': return 'YouTube';
        case 'EMAIL': return 'Email';
        case 'SMS': return 'SMS';
        default: return channel;
    }
};

export const getChannelColor = (channel: ChannelType): string => {
    switch (channel) {
        case 'WHATSAPP': return '#25D366';
        case 'MESSENGER': return '#0084FF';
        case 'INSTAGRAM': return '#E1306C';
        case 'TWITTER': return '#1DA1F2';
        case 'LINKEDIN': return '#0A66C2';
        case 'YOUTUBE': return '#FF0000';
        case 'EMAIL': return '#737373';
        case 'SMS': return '#6366F1';
        default: return '#000000';
    }
};
