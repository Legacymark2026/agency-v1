/**
 * Blog Module - Validation Schemas
 * Zod schemas for blog posts, categories, and comments
 */

import { z } from 'zod';

/**
 * Create post schema
 */
export const createPostSchema = z.object({
    title: z
        .string()
        .min(1, 'Title is required')
        .max(200, 'Title must be less than 200 characters'),
    slug: z
        .string()
        .regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens')
        .optional(),
    excerpt: z.string().max(500, 'Excerpt must be less than 500 characters').optional(),
    content: z.string().min(1, 'Content is required'),
    coverImage: z.string().url('Invalid image URL').optional(),
    published: z.boolean().optional().default(false),
    featured: z.boolean().optional().default(false),
    categoryIds: z.array(z.string()).optional(),
    tagIds: z.array(z.string()).optional(),
});

export type CreatePostFormData = z.infer<typeof createPostSchema>;

/**
 * Update post schema
 */
export const updatePostSchema = createPostSchema.partial();

export type UpdatePostFormData = z.infer<typeof updatePostSchema>;

/**
 * Create category schema
 */
export const createCategorySchema = z.object({
    name: z
        .string()
        .min(1, 'Category name is required')
        .max(100, 'Category name must be less than 100 characters'),
    slug: z
        .string()
        .regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens')
        .optional(),
    description: z.string().max(500, 'Description must be less than 500 characters').optional(),
});

export type CreateCategoryFormData = z.infer<typeof createCategorySchema>;

/**
 * Create tag schema
 */
export const createTagSchema = z.object({
    name: z
        .string()
        .min(1, 'Tag name is required')
        .max(50, 'Tag name must be less than 50 characters'),
});

export type CreateTagFormData = z.infer<typeof createTagSchema>;

/**
 * Create comment schema
 */
export const createCommentSchema = z.object({
    postId: z.string().min(1, 'Post ID is required'),
    content: z
        .string()
        .min(1, 'Comment is required')
        .max(1000, 'Comment must be less than 1000 characters'),
    authorName: z
        .string()
        .min(1, 'Name is required')
        .max(100, 'Name must be less than 100 characters'),
    authorEmail: z.string().email('Invalid email address'),
    authorWebsite: z.string().url('Invalid website URL').optional().or(z.literal('')),
    parentId: z.string().optional(),
});

export type CreateCommentFormData = z.infer<typeof createCommentSchema>;
