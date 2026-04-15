'use server';

import { prisma } from "@/lib/prisma";
import { createHash } from "crypto";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

// Helper to hash IP for privacy
function hashIP(ip: string): string {
    return createHash('sha256').update(ip + process.env.NEXTAUTH_SECRET).digest('hex').slice(0, 32);
}

// Helper to get or create session ID
function getSessionId(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

// ==================== VIEW TRACKING ====================

export async function recordPostView(postId: string) {
    try {
        const headersList = await headers();
        const forwardedFor = headersList.get('x-forwarded-for');
        const ip = forwardedFor?.split(',')[0] || 'unknown';
        const userAgent = headersList.get('user-agent') || undefined;
        const referer = headersList.get('referer') || undefined;

        const ipHash = hashIP(ip);

        // Try to create a view (unique constraint will prevent duplicates per day)
        await prisma.postView.create({
            data: {
                postId,
                ipHash,
                userAgent,
                referer
            }
        }).catch(() => {
            // Ignore duplicate view errors
        });

        return { success: true };
    } catch (error) {
        console.error('Error recording view:', error);
        return { success: false };
    }
}

export async function getPostViewCount(postId: string): Promise<number> {
    try {
        const count = await prisma.postView.count({
            where: { postId }
        });
        return count;
    } catch (error) {
        return 0;
    }
}

// ==================== LIKE SYSTEM ====================

export async function togglePostLike(postId: string, sessionId: string) {
    try {
        // Check if already liked
        const existingLike = await prisma.postLike.findUnique({
            where: {
                postId_sessionId: { postId, sessionId }
            }
        });

        if (existingLike) {
            // Unlike
            await prisma.postLike.delete({
                where: { id: existingLike.id }
            });
            return { success: true, liked: false };
        } else {
            // Like
            await prisma.postLike.create({
                data: { postId, sessionId }
            });
            return { success: true, liked: true };
        }
    } catch (error) {
        console.error('Error toggling like:', error);
        return { success: false, liked: false };
    }
}

export async function getPostLikeStatus(postId: string, sessionId: string) {
    try {
        const [count, userLike] = await Promise.all([
            prisma.postLike.count({ where: { postId } }),
            prisma.postLike.findUnique({
                where: { postId_sessionId: { postId, sessionId } }
            })
        ]);

        return {
            count,
            isLiked: !!userLike
        };
    } catch (error) {
        return { count: 0, isLiked: false };
    }
}

// ==================== COMMENTS ====================

interface CommentData {
    postId: string;
    content: string;
    authorName: string;
    authorEmail: string;
    authorUrl?: string;
    parentId?: string;
}

export async function submitComment(data: CommentData) {
    try {
        const headersList = await headers();
        const forwardedFor = headersList.get('x-forwarded-for');
        const ip = forwardedFor?.split(',')[0] || 'unknown';
        const ipHash = hashIP(ip);

        const comment = await prisma.comment.create({
            data: {
                ...data,
                ipHash,
                approved: false // Require moderation
            }
        });

        return {
            success: true,
            message: 'Tu comentario ha sido enviado y está pendiente de moderación.',
            commentId: comment.id
        };
    } catch (error) {
        console.error('Error submitting comment:', error);
        return { success: false, message: 'Error al enviar el comentario.' };
    }
}

export async function getPostComments(postId: string) {
    try {
        const comments = await prisma.comment.findMany({
            where: {
                postId,
                approved: true,
                parentId: null // Only top-level comments
            },
            include: {
                replies: {
                    where: { approved: true },
                    orderBy: { createdAt: 'asc' }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        return comments;
    } catch (error) {
        return [];
    }
}

export async function getCommentCount(postId: string): Promise<number> {
    try {
        return await prisma.comment.count({
            where: { postId, approved: true }
        });
    } catch (error) {
        return 0;
    }
}

// ==================== NEWSLETTER ====================

export async function subscribeToNewsletter(email: string, name?: string, source: string = 'blog') {
    try {
        // Check if already subscribed
        const existing = await prisma.newsletterSubscription.findUnique({
            where: { email }
        });

        if (existing) {
            if (existing.unsubscribed) {
                // Resubscribe
                await prisma.newsletterSubscription.update({
                    where: { email },
                    data: { unsubscribed: false, unsubscribedAt: null }
                });
                return { success: true, message: '¡Bienvenido de nuevo! Te has suscrito nuevamente.' };
            }
            return { success: true, message: 'Ya estás suscrito a nuestro newsletter.' };
        }

        // Generate confirmation token
        const confirmToken = Math.random().toString(36).substring(2) + Date.now().toString(36);

        await prisma.newsletterSubscription.create({
            data: {
                email,
                name,
                source,
                confirmToken,
                confirmed: true // Set to false if you want double opt-in
            }
        });

        return {
            success: true,
            message: '¡Gracias por suscribirte! Recibirás nuestras últimas publicaciones.'
        };
    } catch (error) {
        console.error('Error subscribing to newsletter:', error);
        return { success: false, message: 'Error al suscribirse. Por favor, intenta de nuevo.' };
    }
}

// ==================== READING LIST ====================

export async function addToReadingList(userId: string, postSlug: string) {
    try {
        await prisma.readingListItem.create({
            data: { userId, postSlug }
        });
        revalidatePath('/dashboard/reading-list');
        return { success: true };
    } catch (error) {
        // Probably already in list
        return { success: false, error: 'Already in reading list' };
    }
}

export async function removeFromReadingList(userId: string, postSlug: string) {
    try {
        await prisma.readingListItem.delete({
            where: { userId_postSlug: { userId, postSlug } }
        });
        revalidatePath('/dashboard/reading-list');
        return { success: true };
    } catch (error) {
        return { success: false };
    }
}

export async function getReadingList(userId: string) {
    try {
        const items = await prisma.readingListItem.findMany({
            where: { userId },
            orderBy: { addedAt: 'desc' }
        });
        return items.map(item => item.postSlug);
    } catch (error) {
        return [];
    }
}

export async function isInReadingList(userId: string, postSlug: string): Promise<boolean> {
    try {
        const item = await prisma.readingListItem.findUnique({
            where: { userId_postSlug: { userId, postSlug } }
        });
        return !!item;
    } catch (error) {
        return false;
    }
}

// ==================== SEARCH ====================

export async function searchPosts(query: string, page: number = 1, limit: number = 10) {
    try {
        const skip = (page - 1) * limit;

        const [posts, total] = await Promise.all([
            prisma.post.findMany({
                where: {
                    published: true,
                    OR: [
                        { title: { contains: query, mode: 'insensitive' } },
                        { excerpt: { contains: query, mode: 'insensitive' } },
                        { content: { contains: query, mode: 'insensitive' } }
                    ]
                },
                select: {
                    id: true,
                    title: true,
                    slug: true,
                    excerpt: true,
                    coverImage: true,
                    createdAt: true,
                    author: { select: { name: true } }
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit
            }),
            prisma.post.count({
                where: {
                    published: true,
                    OR: [
                        { title: { contains: query, mode: 'insensitive' } },
                        { excerpt: { contains: query, mode: 'insensitive' } },
                        { content: { contains: query, mode: 'insensitive' } }
                    ]
                }
            })
        ]);

        return {
            posts,
            total,
            pages: Math.ceil(total / limit),
            currentPage: page
        };
    } catch (error) {
        return { posts: [], total: 0, pages: 0, currentPage: 1 };
    }
}

// ==================== FILTERS ====================

export async function getPostsByCategory(categorySlug: string, page: number = 1, limit: number = 10) {
    try {
        const skip = (page - 1) * limit;

        const [posts, total] = await Promise.all([
            prisma.post.findMany({
                where: {
                    published: true,
                    categories: { some: { slug: categorySlug } }
                },
                include: {
                    author: { select: { name: true } },
                    categories: true
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit
            }),
            prisma.post.count({
                where: {
                    published: true,
                    categories: { some: { slug: categorySlug } }
                }
            })
        ]);

        return { posts, total, pages: Math.ceil(total / limit) };
    } catch (error) {
        return { posts: [], total: 0, pages: 0 };
    }
}

export async function getPostsByTag(tagName: string, page: number = 1, limit: number = 10) {
    try {
        const skip = (page - 1) * limit;

        const [posts, total] = await Promise.all([
            prisma.post.findMany({
                where: {
                    published: true,
                    tags: { some: { name: tagName } }
                },
                include: {
                    author: { select: { name: true } },
                    tags: true
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit
            }),
            prisma.post.count({
                where: {
                    published: true,
                    tags: { some: { name: tagName } }
                }
            })
        ]);

        return { posts, total, pages: Math.ceil(total / limit) };
    } catch (error) {
        return { posts: [], total: 0, pages: 0 };
    }
}

export async function getAllCategories() {
    try {
        return await prisma.category.findMany({
            include: {
                _count: { select: { posts: true } }
            },
            orderBy: { name: 'asc' }
        });
    } catch (error) {
        return [];
    }
}

export async function getAllTags() {
    try {
        return await prisma.tag.findMany({
            include: {
                _count: { select: { posts: true } }
            },
            orderBy: { name: 'asc' }
        });
    } catch (error) {
        return [];
    }
}
