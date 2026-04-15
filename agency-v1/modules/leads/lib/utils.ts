/**
 * Leads Module - Utilities
 */

import type { LeadSource, LeadStatus, UtmParams } from '../types';

/**
 * Calculate lead score based on various factors
 */
export function calculateLeadScore(lead: {
    email?: string;
    phone?: string;
    company?: string;
    website?: string;
    source?: LeadSource;
}): number {
    let score = 0;

    // Email presence (10 points)
    if (lead.email) score += 10;

    // Phone presence (15 points)
    if (lead.phone) score += 15;

    // Company presence (20 points)
    if (lead.company) score += 20;

    // Website presence (15 points)
    if (lead.website) score += 15;

    // Source quality (0-30 points)
    const sourceScores: Record<LeadSource, number> = {
        LINKEDIN: 30,
        REFERRAL: 25,
        GOOGLE: 20,
        WEBSITE: 20,
        FACEBOOK: 15,
        INSTAGRAM: 15,
        EMAIL: 10,
        PHONE: 10,
        DIRECT: 5,
        OTHER: 5,
    };
    score += sourceScores[lead.source || 'OTHER'];

    // Corporate email bonus (10 points)
    if (lead.email && !isFreeEmail(lead.email)) {
        score += 10;
    }

    return Math.min(score, 100);
}

/**
 * Check if email is from a free provider
 */
export function isFreeEmail(email: string): boolean {
    const freeProviders = [
        'gmail.com',
        'yahoo.com',
        'hotmail.com',
        'outlook.com',
        'aol.com',
        'icloud.com',
        'mail.com',
    ];

    const domain = email.split('@')[1]?.toLowerCase();
    return freeProviders.includes(domain);
}

/**
 * Extract UTM parameters from URL
 */
export function extractUtmParams(url: string): UtmParams {
    try {
        const urlObj = new URL(url);
        return {
            source: urlObj.searchParams.get('utm_source') || undefined,
            medium: urlObj.searchParams.get('utm_medium') || undefined,
            campaign: urlObj.searchParams.get('utm_campaign') || undefined,
            term: urlObj.searchParams.get('utm_term') || undefined,
            content: urlObj.searchParams.get('utm_content') || undefined,
        };
    } catch {
        return {};
    }
}

/**
 * Get status badge color
 */
export function getStatusColor(status: LeadStatus): string {
    const colors: Record<LeadStatus, string> = {
        NEW: 'blue',
        CONTACTED: 'purple',
        QUALIFIED: 'green',
        CONVERTED: 'emerald',
        LOST: 'red',
        ARCHIVED: 'gray',
    };
    return colors[status];
}

/**
 * Get source icon name
 */
export function getSourceIcon(source: LeadSource): string {
    const icons: Record<LeadSource, string> = {
        FACEBOOK: 'facebook',
        INSTAGRAM: 'instagram',
        GOOGLE: 'search',
        LINKEDIN: 'linkedin',
        REFERRAL: 'users',
        DIRECT: 'link',
        WEBSITE: 'globe',
        EMAIL: 'mail',
        PHONE: 'phone',
        OTHER: 'help-circle',
    };
    return icons[source];
}
