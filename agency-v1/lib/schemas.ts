import { z } from 'zod';

export const PostSchema = z.object({
    title: z.string().min(3, "Title must be at least 3 characters"),
    slug: z.string().min(3, "Slug must be at least 3 characters").regex(/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric with dashes"),
    excerpt: z.string().optional(),
    content: z.string().min(10, "Content must be at least 10 characters"),
    coverImage: z.string().optional().or(z.literal("")),
    imageAlt: z.string().max(125, "Alt text should be under 125 characters").optional(),

    // SEO Optimization
    metaTitle: z.string().max(60, "Meta title should be 60 characters or less").optional(),
    metaDescription: z.string().max(160, "Meta description should be 160 characters or less").optional(),

    // Workflow Management
    status: z.enum(["draft", "published", "scheduled"]).default("draft"),
    scheduledDate: z.string().optional(), // ISO date string
    published: z.boolean().default(false), // Keep for backward compatibility

    // Categorization
    categoryIds: z.array(z.string()).optional(),
    tagNames: z.array(z.string()).optional(),
});

export const ProjectSchema = z.object({
    title: z.string().min(3, "Title must be at least 3 characters"),
    slug: z.string().min(3, "Slug must be at least 3 characters").regex(/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric with dashes"),
    description: z.string().min(10, "Description must be at least 10 characters"),
    content: z.string().optional(),
    client: z.string().optional(),
    coverImage: z.string().optional().or(z.literal("")),
    imageAlt: z.string().max(125, "Alt text should be under 125 characters").optional(),
    gallery: z.any().optional(),

    // SEO Optimization
    metaTitle: z.string().max(60, "Meta title should be 60 characters or less").optional(),
    metaDescription: z.string().max(160, "Meta description should be 160 characters or less").optional(),
    focusKeyword: z.string().optional(),

    // Workflow Management
    status: z.enum(["draft", "published", "scheduled", "archived"]).default("draft"),
    scheduledDate: z.string().optional(),
    published: z.boolean().default(false),
    featured: z.boolean().default(false),
    displayOrder: z.number().int().optional(),

    // Project Details
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    testimonial: z.string().optional(),
    results: z.array(z.object({
        metric: z.string(),
        value: z.string(),
    })).optional(),
    projectUrl: z.string().url().optional().or(z.literal("")),

    // New Power Fields
    clientLogo: z.string().optional().nullable(),
    techStack: z.array(z.string()).optional().default([]),
    team: z.array(z.object({
        name: z.string(),
        role: z.string(),
        image: z.string().optional()
    })).optional().default([]),
    videoUrl: z.string().optional().nullable(),
    private: z.boolean().default(false),
    pdfUrl: z.string().optional().nullable(),
    seoScore: z.number().default(0),

    // Categorization
    categoryId: z.string().optional(),
    tagNames: z.array(z.string()).optional(),
});

export type PostFormData = z.infer<typeof PostSchema>;
export type ProjectFormData = z.infer<typeof ProjectSchema>;

export const SettingsSchema = z.object({
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    phone: z.string().optional(),
    jobTitle: z.string().optional(),
    bio: z.string().optional(),
    linkedin: z.string().url().optional().or(z.literal("")),
    github: z.string().url().optional().or(z.literal("")),
    theme: z.enum(["light", "dark", "system"]).default("system"),
    language: z.enum(["es", "en", "pt"]).default("es"),
    emailNotifications: z.boolean().default(true),
    image: z.string().optional().nullable(),
    coverImage: z.string().optional().nullable(),
    timezone: z.string().optional().default("America/Bogota"),
    currency: z.string().optional().default("USD"),
});

export const IntegrationsSchema = z.object({
    gaPropertyId: z.string().optional(),
    gaClientEmail: z.string().email().optional().or(z.literal("")),
    gaPrivateKey: z.string().optional(),
    // Facebook
    fbPixelId: z.string().optional(),
});

export type SettingsFormData = z.infer<typeof SettingsSchema>;
export type IntegrationsFormData = z.infer<typeof IntegrationsSchema>;
