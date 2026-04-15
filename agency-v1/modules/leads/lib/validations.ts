/**
 * Leads Module - Validation Schemas
 */

import { z } from 'zod';

/**
 * Lead sources enum
 */
const leadSourceEnum = z.enum([
    'FACEBOOK',
    'INSTAGRAM',
    'GOOGLE',
    'LINKEDIN',
    'REFERRAL',
    'DIRECT',
    'WEBSITE',
    'EMAIL',
    'PHONE',
    'OTHER',
]);

/**
 * Create lead schema
 */
export const createLeadSchema = z.object({
    name: z.string().max(200).optional(),
    email: z.string().email('Invalid email address'),
    phone: z.string().max(50).optional(),
    company: z.string().max(200).optional(),
    website: z.string().url('Invalid URL').optional().or(z.literal('')),
    jobTitle: z.string().max(100).optional(),
    message: z.string().max(2000).optional(),
    source: leadSourceEnum.default('DIRECT'),
    utmParams: z.object({
        source: z.string().optional(),
        medium: z.string().optional(),
        campaign: z.string().optional(),
        term: z.string().optional(),
        content: z.string().optional(),
    }).optional(),
    tags: z.array(z.string()).optional(),
});

export type CreateLeadFormData = z.infer<typeof createLeadSchema>;

/**
 * Update lead schema
 */
export const updateLeadSchema = z.object({
    name: z.string().max(200).optional(),
    email: z.string().email('Invalid email address').optional(),
    phone: z.string().max(50).optional(),
    company: z.string().max(200).optional(),
    website: z.string().url('Invalid URL').optional().or(z.literal('')),
    jobTitle: z.string().max(100).optional(),
    message: z.string().max(2000).optional(),
    source: leadSourceEnum.optional(),
    status: z.enum(['NEW', 'CONTACTED', 'QUALIFIED', 'CONVERTED', 'LOST', 'ARCHIVED']).optional(),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
    score: z.number().min(0).max(100).optional(),
    assignedToId: z.string().uuid().optional(),
    tags: z.array(z.string()).optional(),
    notes: z.string().max(5000).optional(),
});

export type UpdateLeadFormData = z.infer<typeof updateLeadSchema>;

/**
 * Contact form schema (public-facing)
 */
export const contactFormSchema = z.object({
    name: z.string().min(1, 'Name is required').max(200),
    email: z.string().email('Invalid email address'),
    phone: z.string().optional(),
    company: z.string().optional(),
    message: z.string().min(10, 'Message must be at least 10 characters').max(2000),
});

export type ContactFormData = z.infer<typeof contactFormSchema>;
