/**
 * Lead Source Detection Utility
 * 
 * Automatically detects the source of a lead based on:
 * 1. UTM parameters (highest priority)
 * 2. Referer URL domain matching
 * 3. Campaign code matching
 * 4. Default to DIRECT
 */

export type LeadSource =
    | 'FACEBOOK'
    | 'GOOGLE'
    | 'LINKEDIN'
    | 'INSTAGRAM'
    | 'TIKTOK'
    | 'TWITTER'
    | 'YOUTUBE'
    | 'EMAIL'
    | 'REFERRAL'
    | 'DIRECT'
    | 'ORGANIC'
    | 'PAID'
    | 'OTHER';

export type LeadMedium =
    | 'cpc'
    | 'organic'
    | 'social'
    | 'email'
    | 'referral'
    | 'display'
    | 'video'
    | 'affiliate'
    | 'none';

export interface UTMParams {
    utm_source?: string;
    utm_medium?: string;
    utm_campaign?: string;
    utm_term?: string;
    utm_content?: string;
}

export interface SourceDetectionResult {
    source: LeadSource;
    medium: LeadMedium;
    utmSource?: string;
    utmMedium?: string;
    utmCampaign?: string;
    utmTerm?: string;
    utmContent?: string;
}

// Domain to source mapping
const DOMAIN_SOURCE_MAP: Record<string, LeadSource> = {
    'facebook.com': 'FACEBOOK',
    'fb.com': 'FACEBOOK',
    'instagram.com': 'INSTAGRAM',
    'linkedin.com': 'LINKEDIN',
    'google.com': 'GOOGLE',
    'google.co': 'GOOGLE',
    'bing.com': 'GOOGLE', // Group under Google for simplicity
    'youtube.com': 'YOUTUBE',
    'twitter.com': 'TWITTER',
    'x.com': 'TWITTER',
    'tiktok.com': 'TIKTOK',
    't.co': 'TWITTER',
};

// UTM source to LeadSource mapping
const UTM_SOURCE_MAP: Record<string, LeadSource> = {
    'facebook': 'FACEBOOK',
    'fb': 'FACEBOOK',
    'instagram': 'INSTAGRAM',
    'ig': 'INSTAGRAM',
    'linkedin': 'LINKEDIN',
    'google': 'GOOGLE',
    'adwords': 'GOOGLE',
    'youtube': 'YOUTUBE',
    'twitter': 'TWITTER',
    'tiktok': 'TIKTOK',
    'email': 'EMAIL',
    'newsletter': 'EMAIL',
};

/**
 * Extract domain from URL
 */
function extractDomain(url: string): string | null {
    try {
        const urlObj = new URL(url);
        return urlObj.hostname.replace('www.', '').toLowerCase();
    } catch {
        return null;
    }
}

/**
 * Parse UTM parameters from URL or search params
 */
export function parseUTMParams(urlOrParams: string | URLSearchParams | Record<string, string>): UTMParams {
    let params: URLSearchParams;

    if (typeof urlOrParams === 'string') {
        try {
            const url = new URL(urlOrParams);
            params = url.searchParams;
        } catch {
            params = new URLSearchParams(urlOrParams);
        }
    } else if (urlOrParams instanceof URLSearchParams) {
        params = urlOrParams;
    } else {
        params = new URLSearchParams(urlOrParams as Record<string, string>);
    }

    return {
        utm_source: params.get('utm_source') || undefined,
        utm_medium: params.get('utm_medium') || undefined,
        utm_campaign: params.get('utm_campaign') || undefined,
        utm_term: params.get('utm_term') || undefined,
        utm_content: params.get('utm_content') || undefined,
    };
}

/**
 * Detect lead source from UTM parameters and referer
 */
export function detectLeadSource(
    utmParams?: UTMParams,
    referer?: string | null
): SourceDetectionResult {
    // Default result
    const result: SourceDetectionResult = {
        source: 'DIRECT',
        medium: 'none',
    };

    // Priority 1: UTM parameters
    if (utmParams?.utm_source) {
        const normalizedSource = utmParams.utm_source.toLowerCase();
        result.source = UTM_SOURCE_MAP[normalizedSource] || 'OTHER';
        result.utmSource = utmParams.utm_source;
        result.utmMedium = utmParams.utm_medium;
        result.utmCampaign = utmParams.utm_campaign;
        result.utmTerm = utmParams.utm_term;
        result.utmContent = utmParams.utm_content;

        // Determine medium from utm_medium
        if (utmParams.utm_medium) {
            const medium = utmParams.utm_medium.toLowerCase();
            if (['cpc', 'ppc', 'paid'].includes(medium)) {
                result.medium = 'cpc';
            } else if (['organic', 'seo'].includes(medium)) {
                result.medium = 'organic';
            } else if (['social', 'social-media'].includes(medium)) {
                result.medium = 'social';
            } else if (['email', 'newsletter'].includes(medium)) {
                result.medium = 'email';
            } else if (['referral', 'partner'].includes(medium)) {
                result.medium = 'referral';
            } else if (['display', 'banner'].includes(medium)) {
                result.medium = 'display';
            } else if (['video', 'youtube'].includes(medium)) {
                result.medium = 'video';
            } else if (['affiliate'].includes(medium)) {
                result.medium = 'affiliate';
            }
        }

        return result;
    }

    // Priority 2: Referer URL
    if (referer) {
        const domain = extractDomain(referer);
        if (domain) {
            // Check domain mapping
            for (const [domainPattern, source] of Object.entries(DOMAIN_SOURCE_MAP)) {
                if (domain.includes(domainPattern)) {
                    result.source = source;
                    result.medium = source === 'GOOGLE' ? 'organic' : 'social';
                    return result;
                }
            }

            // If we have a referer but no match, it's a referral
            result.source = 'REFERRAL';
            result.medium = 'referral';
            return result;
        }
    }

    // No UTM and no referer = DIRECT
    return result;
}

/**
 * Calculate initial lead score based on data completeness
 */
export function calculateLeadScore(leadData: {
    email?: string;
    name?: string;
    phone?: string;
    company?: string;
    jobTitle?: string;
    source?: string;
}): number {
    let score = 0;

    // Base points for required fields
    if (leadData.email) score += 20;
    if (leadData.name) score += 15;
    if (leadData.phone) score += 20;
    if (leadData.company) score += 15;
    if (leadData.jobTitle) score += 10;

    // Bonus for quality sources
    if (leadData.source) {
        const sourceScores: Record<string, number> = {
            'REFERRAL': 20,
            'LINKEDIN': 15,
            'GOOGLE': 10,
            'FACEBOOK': 5,
            'DIRECT': 5,
        };
        score += sourceScores[leadData.source] || 0;
    }

    return Math.min(100, score);
}

/**
 * Get source display info (icon and color)
 */
export function getSourceDisplayInfo(source: LeadSource): { icon: string; color: string; label: string } {
    const info: Record<LeadSource, { icon: string; color: string; label: string }> = {
        'FACEBOOK': { icon: '📘', color: 'bg-blue-500', label: 'Facebook' },
        'GOOGLE': { icon: '🔍', color: 'bg-red-500', label: 'Google' },
        'LINKEDIN': { icon: '💼', color: 'bg-blue-700', label: 'LinkedIn' },
        'INSTAGRAM': { icon: '📷', color: 'bg-pink-500', label: 'Instagram' },
        'TIKTOK': { icon: '🎵', color: 'bg-black', label: 'TikTok' },
        'TWITTER': { icon: '🐦', color: 'bg-sky-500', label: 'Twitter/X' },
        'YOUTUBE': { icon: '▶️', color: 'bg-red-600', label: 'YouTube' },
        'EMAIL': { icon: '📧', color: 'bg-amber-500', label: 'Email' },
        'REFERRAL': { icon: '🤝', color: 'bg-green-500', label: 'Referral' },
        'DIRECT': { icon: '🏠', color: 'bg-gray-500', label: 'Direct' },
        'ORGANIC': { icon: '🌿', color: 'bg-green-600', label: 'Organic' },
        'PAID': { icon: '💰', color: 'bg-amber-600', label: 'Paid' },
        'OTHER': { icon: '❓', color: 'bg-gray-400', label: 'Other' },
    };
    return info[source] || info['OTHER'];
}
