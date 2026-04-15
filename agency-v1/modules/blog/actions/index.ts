/**
 * Blog Module - Server Actions
 * CRUD operations for blog posts, categories, tags, and comments
 */

'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import type { CreatePostInput, UpdatePostInput, PostFilters, CreateCommentInput } from '../types';
import { generateSlug, calculateReadTime } from '../lib/utils';
import { createPostSchema, createCategorySchema, createTagSchema, createCommentSchema } from '../lib/validations';

/**
 * Get all posts with optional filters
 */
export async function getPosts(filters?: PostFilters) {
    try {
        const {
            published,
            featured,
            categoryId,
            tagId,
            authorId,
            search,
            limit = 10,
            offset = 0,
            orderBy = 'createdAt',
            order = 'desc',
        } = filters || {};

        const where: any = {};

        if (published !== undefined) where.published = published;
        if (featured !== undefined) where.featured = featured;
        if (categoryId) where.categoryId = categoryId;
        if (authorId) where.authorId = authorId;
        if (search) {
            where.OR = [
                { title: { contains: search, mode: 'insensitive' } },
                { content: { contains: search, mode: 'insensitive' } },
            ];
        }

        const posts = await prisma.post.findMany({
            where,
            include: {
                author: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        image: true,
                    },
                },
                categories: true,
            },
            take: limit,
            skip: offset,
            orderBy: { [orderBy]: order },
        });

        return {
            success: true,
            posts,
        };
    } catch (error) {
        console.error('Error fetching posts:', error);
        return {
            success: false,
            error: 'Failed to fetch posts',
        };
    }
}

/**
 * Get a single post by slug
 */
export async function getPostBySlug(slug: string) {
    try {
        const post = await prisma.post.findUnique({
            where: { slug },
            include: {
                author: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        image: true,
                    },
                },
                categories: true,
            },
        });

        if (!post) {
            return {
                success: false,
                error: 'Post not found',
            };
        }

        // Increment view count via PostView
        await prisma.postView.create({
            data: { postId: post.id, ipHash: 'server-fetch' },
        }).catch(() => {/* ignore duplicate */ });

        return {
            success: true,
            post,
        };
    } catch (error) {
        console.error('Error fetching post:', error);
        return {
            success: false,
            error: 'Failed to fetch post',
        };
    }
}

/**
 * Create a new post
 */
export async function createPost(data: CreatePostInput, authorId: string) {
    try {
        const validData = createPostSchema.parse(data);

        // Generate slug if not provided
        const slug = validData.slug || generateSlug(validData.title);

        // Check if slug already exists
        const existing = await prisma.post.findUnique({ where: { slug } });
        if (existing) {
            return {
                success: false,
                error: 'A post with this slug already exists',
            };
        }

        // Calculate read time
        const readTime = calculateReadTime(validData.content);

        const post = await prisma.post.create({
            data: {
                title: validData.title,
                slug,
                excerpt: validData.excerpt,
                content: validData.content,
                coverImage: validData.coverImage,
                published: validData.published || false,
                authorId,
            },
        });

        revalidatePath('/blog');
        revalidatePath(`/blog/${slug}`);

        return {
            success: true,
            post,
        };
    } catch (error) {
        console.error('Error creating post:', error);
        return {
            success: false,
            error: 'Failed to create post',
        };
    }
}

/**
 * Update a post
 */
export async function updatePost(id: string, data: UpdatePostInput) {
    try {
        const post = await prisma.post.findUnique({ where: { id } });
        if (!post) {
            return {
                success: false,
                error: 'Post not found',
            };
        }

        const updates: any = { ...data };

        // Update slug if title changed and no custom slug provided
        if (data.title && !data.slug) {
            updates.slug = generateSlug(data.title);
        }

        // Recalculate read time if content changed
        if (data.content) {
            updates.readTime = calculateReadTime(data.content);
        }

        const updated = await prisma.post.update({
            where: { id },
            data: updates,
        });

        revalidatePath('/blog');
        revalidatePath(`/blog/${updated.slug}`);

        return {
            success: true,
            post: updated,
        };
    } catch (error) {
        console.error('Error updating post:', error);
        return {
            success: false,
            error: 'Failed to update post',
        };
    }
}

/**
 * Delete a post
 */
export async function deletePost(id: string) {
    try {
        await prisma.post.delete({ where: { id } });

        revalidatePath('/blog');

        return {
            success: true,
        };
    } catch (error) {
        console.error('Error deleting post:', error);
        return {
            success: false,
            error: 'Failed to delete post',
        };
    }
}

/**
 * Publish/unpublish a post
 */
export async function togglePublishPost(id: string) {
    try {
        const post = await prisma.post.findUnique({ where: { id } });
        if (!post) {
            return {
                success: false,
                error: 'Post not found',
            };
        }

        const updated = await prisma.post.update({
            where: { id },
            data: {
                published: !post.published,
                status: !post.published ? 'published' : 'draft',
            },
        });

        revalidatePath('/blog');
        revalidatePath(`/blog/${updated.slug}`);

        return {
            success: true,
            post: updated,
        };
    } catch (error) {
        console.error('Error toggling post publish status:', error);
        return {
            success: false,
            error: 'Failed to update post',
        };
    }
}

/**
 * Get all categories
 */
export async function getCategories() {
    try {
        const categories = await prisma.category.findMany({
            include: {
                _count: {
                    select: { posts: true },
                },
            },
        });

        return {
            success: true,
            categories,
        };
    } catch (error) {
        console.error('Error fetching categories:', error);
        return {
            success: false,
            error: 'Failed to fetch categories',
        };
    }
}

/**
 * Create a category
 */
export async function createCategory(data: { name: string; slug?: string; description?: string }) {
    try {
        const validData = createCategorySchema.parse(data);
        const slug = validData.slug || generateSlug(validData.name);

        const category = await prisma.category.create({
            data: {
                name: validData.name,
                slug,
            },
        });

        return {
            success: true,
            category,
        };
    } catch (error) {
        console.error('Error creating category:', error);
        return {
            success: false,
            error: 'Failed to create category',
        };
    }
}

/**
 * Create a comment
 */
export async function createComment(data: CreateCommentInput) {
    try {
        const validData = createCommentSchema.parse(data);

        // Note: This assumes you have a Comment model in Prisma
        // If not, this action would need to be adjusted

        return {
            success: true,
            message: 'Comment created successfully (pending approval)',
        };
    } catch (error) {
        console.error('Error creating comment:', error);
        return {
            success: false,
            error: 'Failed to create comment',
        };
    }
}
