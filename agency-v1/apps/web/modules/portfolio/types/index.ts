/**
 * Portfolio Module - Type Definitions
 * Types for portfolio projects and case studies
 */

/**
 * Project status
 */
export type ProjectStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

/**
 * Project category
 */
export type ProjectCategory =
    | 'WEB_DESIGN'
    | 'WEB_DEVELOPMENT'
    | 'MOBILE_APP'
    | 'BRANDING'
    | 'MARKETING'
    | 'ECOMMERCE'
    | 'UI_UX'
    | 'OTHER';

/**
 * Portfolio project
 */
export interface Project {
    id: string;
    title: string;
    slug: string;
    description?: string | null;
    excerpt?: string | null;
    content?: string | null;
    coverImage?: string | null;
    images?: string[];
    categoryId?: string | null;
    category?: ProjectCategory | null;
    status: ProjectStatus;
    featured?: boolean;
    client?: string | null;
    clientLogo?: string | null;
    websiteUrl?: string | null;
    completedAt?: Date | null;
    technologies?: string[];
    tags?: string[];
    metrics?: ProjectMetrics;
    createdAt: Date;
    updatedAt: Date;
    viewCount?: number;
}

/**
 * Project metrics/results
 */
export interface ProjectMetrics {
    trafficIncrease?: number;
    conversionRate?: number;
    revenueGrowth?: number;
    customMetrics?: Record<string, string | number>;
}

/**
 * Create project input
 */
export interface CreateProjectInput {
    title: string;
    slug?: string;
    description?: string;
    excerpt?: string;
    content?: string;
    coverImage?: string;
    images?: string[];
    category: ProjectCategory;
    status?: ProjectStatus;
    featured?: boolean;
    client?: string;
    clientLogo?: string;
    websiteUrl?: string;
    completedAt?: Date;
    technologies?: string[];
    tags?: string[];
    metrics?: ProjectMetrics;
}

/**
 * Update project input
 */
export interface UpdateProjectInput {
    title?: string;
    slug?: string;
    description?: string;
    excerpt?: string;
    content?: string;
    coverImage?: string;
    images?: string[];
    category?: ProjectCategory;
    status?: ProjectStatus;
    featured?: boolean;
    client?: string;
    clientLogo?: string;
    websiteUrl?: string;
    completedAt?: Date;
    technologies?: string[];
    tags?: string[];
    metrics?: ProjectMetrics;
}

/**
 * Project filters
 */
export interface ProjectFilters {
    category?: ProjectCategory | ProjectCategory[];
    status?: ProjectStatus;
    featured?: boolean;
    search?: string;
    tags?: string[];
    limit?: number;
    offset?: number;
    orderBy?: 'createdAt' | 'completedAt' | 'title' | 'viewCount';
    order?: 'asc' | 'desc';
}

/**
 * Portfolio statistics
 */
export interface PortfolioStats {
    total: number;
    published: number;
    featured: number;
    byCategory: Record<ProjectCategory, number>;
    totalViews: number;
}
