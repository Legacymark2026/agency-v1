// Marketing Module Types

export interface Campaign {
    id: string;
    name: string;
    type: CampaignType;
    status: CampaignStatus;
    budget: number;
    spent: number;
    startDate: Date | string;
    endDate?: Date | string;
    metrics: CampaignMetrics;
    createdAt: Date | string;
    updatedAt: Date | string;
}

export enum CampaignType {
    EMAIL = 'email',
    SOCIAL = 'social',
    PAID_ADS = 'paid_ads',
    SEO = 'seo',
    CONTENT = 'content',
    EVENT = 'event'
}

export enum CampaignStatus {
    DRAFT = 'draft',
    SCHEDULED = 'scheduled',
    ACTIVE = 'active',
    PAUSED = 'paused',
    COMPLETED = 'completed'
}

export interface CampaignMetrics {
    impressions: number;
    clicks: number;
    conversions: number;
    ctr: number; // Click-through rate
    roi: number; // Return on investment
}

export interface DateRange {
    from: Date;
    to: Date;
}
