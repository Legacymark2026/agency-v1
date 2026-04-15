/**
 * Portfolio Module - Validation Schemas
 */

import { z } from 'zod';

/**
 * Project category enum
 */
const projectCategoryEnum = z.enum([
    'WEB_DESIGN',
    'WEB_DEVELOPMENT',
    'MOBILE_APP',
    'BRANDING',
    'MARKETING',
    'ECOMMERCE',
    'UI_UX',
    'OTHER',
]);

/**
 * Create project schema
 */
export const createProjectSchema = z.object({
    title: z.string().min(1, 'Title is required').max(200),
    slug: z.string().regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens').optional(),
    description: z.string().max(1000).optional(),
    excerpt: z.string().max(500).optional(),
    content: z.string().optional(),
    coverImage: z.string().url('Invalid image URL').optional(),
    images: z.array(z.string().url()).optional(),
    category: projectCategoryEnum,
    status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).optional().default('DRAFT'),
    featured: z.boolean().optional().default(false),
    client: z.string().max(200).optional(),
    clientLogo: z.string().url('Invalid logo URL').optional(),
    websiteUrl: z.string().url('Invalid website URL').optional().or(z.literal('')),
    completedAt: z.date().optional(),
    technologies: z.array(z.string()).optional(),
    tags: z.array(z.string()).optional(),
    metrics: z.object({
        trafficIncrease: z.number().optional(),
        conversionRate: z.number().optional(),
        revenueGrowth: z.number().optional(),
        customMetrics: z.record(z.string(), z.union([z.string(), z.number()])).optional(),
    }).optional(),
});

export type CreateProjectFormData = z.infer<typeof createProjectSchema>;

/**
 * Update project schema
 */
export const updateProjectSchema = createProjectSchema.partial();

export type UpdateProjectFormData = z.infer<typeof updateProjectSchema>;
