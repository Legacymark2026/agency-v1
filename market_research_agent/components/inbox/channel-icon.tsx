
import React from 'react';
import { ChannelType } from '@/types/inbox';
import {
    FaWhatsapp,
    FaFacebookMessenger,
    FaInstagram,
    FaTwitter,
    FaLinkedin,
    FaYoutube
} from 'react-icons/fa';
import { MdEmail, MdSms } from 'react-icons/md';
import { cn } from '@/lib/utils';

interface ChannelIconProps {
    channel: ChannelType;
    className?: string;
    variant?: 'default' | 'color';
}

export const ChannelIcon: React.FC<ChannelIconProps> = ({
    channel,
    className,
    variant = 'color'
}) => {
    // Brand colors
    const colors: Record<ChannelType, string> = {
        WHATSAPP: 'text-green-500',
        MESSENGER: 'text-blue-500',
        INSTAGRAM: 'text-pink-500', // Gradient usually, but text color for icon
        TWITTER: 'text-sky-500', // X branding is black/white usually, but twitter blue is recognizable
        LINKEDIN: 'text-blue-700',
        EMAIL: 'text-gray-500',
        SMS: 'text-indigo-500',
        YOUTUBE: 'text-red-500'
    };

    const colorClass = variant === 'color' ? colors[channel] : '';

    const getIcon = () => {
        switch (channel) {
            case 'WHATSAPP': return <FaWhatsapp />;
            case 'MESSENGER': return <FaFacebookMessenger />;
            case 'INSTAGRAM': return <FaInstagram />;
            case 'TWITTER': return <FaTwitter />;
            case 'LINKEDIN': return <FaLinkedin />;
            case 'YOUTUBE': return <FaYoutube />;
            case 'EMAIL': return <MdEmail />;
            case 'SMS': return <MdSms />;
            default: return <MdEmail />;
        }
    };

    return (
        <span className={cn("inline-flex items-center justify-center", colorClass, className)}>
            {getIcon()}
        </span>
    );
};
