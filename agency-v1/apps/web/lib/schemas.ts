import { z } from 'zod';

// ─── CRM SCHEMAS ──────────────────────────────────────────────────────────────

const DealStageEnum = z.enum(["NEW", "CONTACTED", "QUALIFIED", "PROPOSAL", "NEGOTIATION", "WON", "LOST"]);
const PriorityEnum = z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]);

export const CreateDealSchema = z.object({
    title: z.string().min(2, "El título debe tener al menos 2 caracteres").max(200, "El título es demasiado largo"),
    value: z.number({ invalid_type_error: "El valor debe ser un número" }).min(0, "El valor no puede ser negativo"),
    stage: DealStageEnum.default("NEW"),
    priority: PriorityEnum.default("MEDIUM"),
    probability: z.number().int().min(0).max(100).default(10),
    contactName: z.string().max(150).optional(),
    contactEmail: z.string().email("Email inválido").optional().or(z.literal("")),
    contactPhone: z.string().max(30).optional(),
    contactCompany: z.string().max(150).optional(),
    companyId: z.string().min(1, "companyId requerido"),
    notes: z.string().max(5000).optional(),
    expectedClose: z.string().datetime({ offset: true }).optional().or(z.string().regex(/^\d{4}-\d{2}-\d{2}/).optional()),
    source: z.string().max(50).default("MANUAL"),
    utmSource: z.string().optional(),
    utmMedium: z.string().optional(),
    utmCampaign: z.string().optional(),
});

export const UpdateDealSchema = CreateDealSchema.partial().omit({ companyId: true });

export const CreateLeadSchema = z.object({
    email: z.string().email("Email inválido").min(1, "El email es requerido"),
    name: z.string().max(150).optional(),
    phone: z.string().max(30).optional(),
    company: z.string().max(150).optional(),
    source: z.string().min(1, "La fuente es requerida").max(50),
    message: z.string().max(5000).optional(),
    companyId: z.string().min(1, "companyId requerido"),
    utmSource: z.string().max(100).optional(),
    utmMedium: z.string().max(100).optional(),
    utmCampaign: z.string().max(100).optional(),
    formData: z.record(z.unknown()).optional(),
    pipelineStage: z.string().optional(),
});

export const UpdateLeadSchema = z.object({
    name: z.string().max(150).optional(),
    phone: z.string().max(30).optional(),
    company: z.string().max(150).optional(),
    status: z.enum(["NEW", "CONTACTED", "QUALIFIED", "CONVERTED", "LOST"]).optional(),
    source: z.string().max(50).optional(),
    score: z.number().int().min(0).max(100).optional(),
    assignedTo: z.string().optional().nullable(),
    tags: z.array(z.string()).optional(),
    notes: z.string().max(5000).optional(),
});

export const BulkUpdateLeadsSchema = z.object({
    ids: z.array(z.string().min(1)).min(1, "Se requiere al menos un ID").max(500, "Máximo 500 registros por operación"),
    data: UpdateLeadSchema,
});

export const CreateCampaignSchema = z.object({
    name: z.string().min(2, "El nombre debe tener al menos 2 caracteres").max(150),
    code: z.string().min(2).max(50).regex(/^[A-Za-z0-9\s\-_]+$/, "El código solo puede contener letras, números, guiones y guiones bajos"),
    platform: z.enum(["META", "GOOGLE", "TIKTOK", "LINKEDIN", "EMAIL", "ORGANIC", "OTHER"]),
    budget: z.number().min(0).optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    description: z.string().max(1000).optional(),
    companyId: z.string().min(1),
});

export type CreateDealInput = z.infer<typeof CreateDealSchema>;
export type UpdateDealInput = z.infer<typeof UpdateDealSchema>;
export type CreateLeadInput = z.infer<typeof CreateLeadSchema>;
export type UpdateLeadInput = z.infer<typeof UpdateLeadSchema>;
export type BulkUpdateLeadsInput = z.infer<typeof BulkUpdateLeadsSchema>;
export type CreateCampaignInput = z.infer<typeof CreateCampaignSchema>;

// ─── CMS SCHEMAS ──────────────────────────────────────────────────────────────

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

    // FAQs
    faqs: z.array(z.object({
        question: z.string().min(5, "Question is too short"),
        answer: z.string().min(10, "Answer is too short")
    })).optional().default([]),
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
