// CRM Module Types
// Centralized type definitions for the CRM module

export interface Deal {
    id: string;
    title: string;
    value: number;
    stage: DealStage | string;
    probability: number;
    closeDate: Date | string;
    contactId?: string;
    contactName?: string;
    contactEmail?: string;
    priority?: string;
    lastActivity?: Date | string;
    companyId?: string;
    ownerId?: string;
    source?: LeadSource | string;
    tags?: string[];
    customFields?: Record<string, any>;
    createdAt: Date | string;
    updatedAt: Date | string;
}

export enum DealStage {
    LEAD = 'lead',
    QUALIFIED = 'qualified',
    PROPOSAL = 'proposal',
    NEGOTIATION = 'negotiation',
    CLOSED_WON = 'closed_won',
    CLOSED_LOST = 'closed_lost',
    WON = 'WON',
    LOST = 'LOST',
    NEW = 'NEW',
    CONTACTED = 'CONTACTED'
}

export enum LeadSource {
    WEBSITE = 'website',
    REFERRAL = 'referral',
    SOCIAL_MEDIA = 'social_media',
    EMAIL_CAMPAIGN = 'email_campaign',
    PAID_ADS = 'paid_ads',
    EVENT = 'event',
    COLD_OUTREACH = 'cold_outreach',
    OTHER = 'other'
}

export interface Activity {
    id: string;
    type: ActivityType;
    title: string;
    description?: string;
    dealId?: string;
    contactId?: string;
    userId: string;
    dueDate?: Date | string;
    completedAt?: Date | string;
    createdAt: Date | string;
}

export enum ActivityType {
    CALL = 'call',
    EMAIL = 'email',
    MEETING = 'meeting',
    TASK = 'task',
    NOTE = 'note'
}

export interface Contact {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    company?: string;
    title?: string;
    source?: LeadSource;
    deals?: Deal[];
    activities?: Activity[];
    createdAt: Date | string;
    updatedAt: Date | string;
}
