/**
 * Leads Module - Type Definitions
 * Types for lead management and tracking
 */

/**
 * Lead status
 */
export type LeadStatus = 'NEW' | 'CONTACTED' | 'QUALIFIED' | 'CONVERTED' | 'LOST' | 'ARCHIVED';

/**
 * Lead source
 */
export type LeadSource =
    | 'FACEBOOK'
    | 'INSTAGRAM'
    | 'GOOGLE'
    | 'LINKEDIN'
    | 'REFERRAL'
    | 'DIRECT'
    | 'WEBSITE'
    | 'EMAIL'
    | 'PHONE'
    | 'OTHER';

/**
 * Lead priority
 */
export type LeadPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

/**
 * UTM Parameters for tracking
 */
export interface UtmParams {
    source?: string;
    medium?: string;
    campaign?: string;
    term?: string;
    content?: string;
}

/**
 * Lead entity
 */
export interface Lead {
    id: string;
    name?: string | null;
    email: string;
    phone?: string | null;
    company?: string | null;
    website?: string | null;
    jobTitle?: string | null;
    message?: string | null;
    source: LeadSource;
    status: LeadStatus;
    priority?: LeadPriority;
    score?: number;
    utmParams?: UtmParams | null;
    assignedToId?: string | null;  // kept for backward compat
    assignedTo?: string | null;    // actual Prisma field: stored user ID
    tags?: string[];
    notes?: string;
    contactedAt?: Date | null;
    convertedAt?: Date | null;
    createdAt: Date;
    updatedAt: Date;
}

/**
 * Lead assignee
 */
export interface LeadAssignee {
    id: string;
    name: string;
    email?: string;
    image?: string | null;
}

/**
 * Create lead input
 */
export interface CreateLeadInput {
    name?: string;
    email: string;
    phone?: string;
    company?: string;
    website?: string;
    jobTitle?: string;
    message?: string;
    source: LeadSource;
    utmParams?: UtmParams;
    tags?: string[];
}

/**
 * Update lead input
 */
export interface UpdateLeadInput {
    name?: string;
    email?: string;
    phone?: string;
    company?: string;
    website?: string;
    jobTitle?: string;
    message?: string;
    source?: LeadSource;
    status?: LeadStatus;
    priority?: LeadPriority;
    score?: number;
    assignedTo?: string;
    tags?: string[];
    notes?: string;
}

/**
 * Lead filters
 */
export interface LeadFilters {
    status?: LeadStatus | LeadStatus[];
    source?: LeadSource | LeadSource[];
    priority?: LeadPriority;
    assignedToId?: string;
    search?: string;
    dateFrom?: Date;
    dateTo?: Date;
    limit?: number;
    offset?: number;
    orderBy?: 'createdAt' | 'updatedAt' | 'score' | 'name';
    order?: 'asc' | 'desc';
}

/**
 * Lead statistics
 */
export interface LeadStats {
    total: number;
    new: number;
    contacted: number;
    qualified: number;
    converted: number;
    lost: number;
    conversionRate: number;
    averageScore: number;
    bySource: Record<LeadSource, number>;
    byStatus: Record<LeadStatus, number>;
}
