'use server';

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { createHash } from "crypto";
import { headers } from "next/headers";
import { revalidatePath, unstable_cache } from "next/cache";

// Helper to hash IP for privacy
function hashIP(ip: string): string {
    return createHash('sha256').update(ip + process.env.NEXTAUTH_SECRET).digest('hex').slice(0, 32);
}

// Helper to get or create session ID (unused)
// function getSessionId(): string {
//     return Math.random().toString(36).substring(2) + Date.now().toString(36);
// }

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
        console.error(error);
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
        console.error(error);
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
                approved: true // Publish immediately without moderation
            }
        });

        return {
            success: true,
            message: 'Tu comentario ha sido publicado correctamente.',
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
                parentId: null
            },
            include: {
                replies: {
                    where: { approved: true },
                    orderBy: { createdAt: 'asc' }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        return comments.map(comment => ({
            ...comment,
            likeCount: comment.likeCount,
            replies: comment.replies.map(reply => ({
                ...reply,
                likeCount: reply.likeCount
            }))
        }));
    } catch (error) {
        console.error(error);
        return [];
    }
}

export async function getCommentCount(postId: string): Promise<number> {
    try {
        return await prisma.comment.count({
            where: { postId, approved: true }
        });
    } catch (error) {
        console.error(error);
        return 0;
    }
}

// ==================== ADMIN COMMENT MANAGEMENT ====================

// ==================== COMMENT LIKES ====================

export async function toggleCommentLike(commentId: string) {
    try {
        const headersList = await headers();
        const forwardedFor = headersList.get('x-forwarded-for');
        const ip = forwardedFor?.split(',')[0] || 'unknown';
        const ipHash = hashIP(ip);

        const existingLike = await prisma.commentLike.findUnique({
            where: {
                commentId_ipHash: { commentId, ipHash }
            }
        });

        if (existingLike) {
            await prisma.commentLike.delete({
                where: { id: existingLike.id }
            });
            await prisma.comment.update({
                where: { id: commentId },
                data: { likeCount: { decrement: 1 } }
            });
            return { success: true, liked: false };
        } else {
            await prisma.commentLike.create({
                data: { commentId, ipHash }
            });
            await prisma.comment.update({
                where: { id: commentId },
                data: { likeCount: { increment: 1 } }
            });
            return { success: true, liked: true };
        }
    } catch (error) {
        console.error('Error toggling comment like:', error);
        return { success: false, liked: false };
    }
}

export async function getCommentLikeStatus(commentId: string) {
    try {
        const headersList = await headers();
        const forwardedFor = headersList.get('x-forwarded-for');
        const ip = forwardedFor?.split(',')[0] || 'unknown';
        const ipHash = hashIP(ip);

        const [count, userLike] = await Promise.all([
            prisma.commentLike.count({ where: { commentId } }),
            prisma.commentLike.findUnique({
                where: { commentId_ipHash: { commentId, ipHash } }
            })
        ]);

        return {
            count,
            isLiked: !!userLike
        };
    } catch (error) {
        console.error(error);
        return { count: 0, isLiked: false };
    }
}

// ==================== ADMIN COMMENT MANAGEMENT ====================

export async function getAllComments(companyId: string, options?: {
    status?: 'all' | 'approved' | 'pending' | 'deleted';
    postId?: string;
    search?: string;
    page?: number;
    limit?: number;
}) {
    try {
        const { status = 'all', postId, search, page = 1, limit = 20 } = options || {};
        
        console.log('[getAllComments] companyId:', companyId);
        
        // Get all users in this company first
        const companyUsers = await prisma.companyUser.findMany({
            where: { companyId: companyId },
            select: { userId: true }
        });
        const userIds = companyUsers.map(cu => cu.userId);
        
        // Get all posts authored by users in this company
        let posts = await prisma.post.findMany({
            where: { authorId: { in: userIds } },
            select: { id: true }
        });
        
        console.log('[getAllComments] posts found via company users:', posts.length);
        
        // If no posts found, try getting all posts as fallback
        if (posts.length === 0) {
            posts = await prisma.post.findMany({
                select: { id: true }
            });
            console.log('[getAllComments] fallback - all posts:', posts.length);
        }
        
        const postIds = posts.map(p => p.id);
        console.log('[getAllComments] postIds:', postIds.length);

        if (postIds.length === 0) {
            return {
                comments: [],
                total: 0,
                pages: 0,
                currentPage: 1
            };
        }

        const where: any = {
            postId: { in: postIds }
        };

        if (status === 'approved') where.approved = true;
        if (status === 'pending') where.approved = false;
        if (status === 'deleted') where.deleted = true;
        if (status === 'all') where.deleted = false;
        
        if (postId) where.postId = postId;
        if (search) where.content = { contains: search };

        console.log('[getAllComments] where:', JSON.stringify(where));

        const [comments, total] = await Promise.all([
            prisma.comment.findMany({
                where,
                include: {
                    post: { select: { id: true, title: true, slug: true } }
                },
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit
            }),
            prisma.comment.count({ where })
        ]);

        console.log('[getAllComments] comments found:', comments.length, 'total:', total);

        return {
            comments: comments.map(c => ({
                id: c.id,
                content: c.content,
                authorName: c.authorName,
                authorEmail: c.authorEmail,
                approved: c.approved,
                deleted: c.deleted,
                createdAt: c.createdAt,
                updatedAt: c.updatedAt,
                post: c.post
            })),
            total,
            pages: Math.ceil(total / limit),
            currentPage: page
        };
    } catch (error) {
        console.error('Error getting all comments:', error);
        return { comments: [], total: 0, pages: 0, currentPage: 1 };
    }
}

export async function getCommentById(commentId: string) {
    try {
        const comment = await prisma.comment.findUnique({
            where: { id: commentId },
            include: {
                post: { select: { id: true, title: true, slug: true } },
                replies: {
                    orderBy: { createdAt: 'asc' }
                }
            } as any
        }) as any;

        if (!comment) return null;

        return {
            id: comment.id,
            content: comment.content,
            authorName: comment.authorName,
            authorEmail: comment.authorEmail,
            approved: comment.approved,
            deleted: comment.deleted,
            createdAt: comment.createdAt,
            updatedAt: comment.updatedAt,
            post: (comment as any).post,
            author: (comment as any).author,
            replies: (comment as any).replies
        };
    } catch (error) {
        console.error('Error getting comment:', error);
        return null;
    }
}

export async function updateComment(commentId: string, content: string) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return { success: false, error: 'No autorizado' };
        }

        const comment = await prisma.comment.update({
            where: { id: commentId },
            data: { content }
        });

        revalidatePath('/dashboard/admin/blog');
        return { success: true, comment };
    } catch (error) {
        console.error('Error updating comment:', error);
        return { success: false, error: 'Error al actualizar el comentario' };
    }
}

export async function deleteComment(commentId: string) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return { success: false, error: 'No autorizado' };
        }

        // Soft delete - mark as deleted instead of removing
        await prisma.comment.update({
            where: { id: commentId },
            data: { deleted: true }
        });

        revalidatePath('/dashboard/admin/blog');
        return { success: true };
    } catch (error) {
        console.error('Error deleting comment:', error);
        return { success: false, error: 'Error al eliminar el comentario' };
    }
}

export async function approveComment(commentId: string, approved: boolean) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return { success: false, error: 'No autorizado' };
        }

        await prisma.comment.update({
            where: { id: commentId },
            data: { approved }
        });

        revalidatePath('/dashboard/admin/blog');
        return { success: true };
    } catch (error) {
        console.error('Error approving comment:', error);
        return { success: false, error: 'Error al aprobar el comentario' };
    }
}

export async function restoreComment(commentId: string) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return { success: false, error: 'No autorizado' };
        }

        await prisma.comment.update({
            where: { id: commentId },
            data: { deleted: false }
        });

        revalidatePath('/dashboard/admin/blog');
        return { success: true };
    } catch (error) {
        console.error('Error restoring comment:', error);
        return { success: false, error: 'Error al restaurar el comentario' };
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
        console.error(error);
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
        console.error(error);
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
        console.error(error);
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
        console.error(error);
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
        console.error(error);
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
        console.error(error);
        return [];
    }
}

// ==================== OPTIMIZED FORM FETCHERS ====================

export const getCategoriesForForm = unstable_cache(
    async () => {
        try {
            return await prisma.category.findMany({
                select: { id: true, name: true },
                orderBy: { name: 'asc' }
            });
        } catch (error) {
            console.error("Error fetching categories for form:", error);
            return [];
        }
    },
    ['form-categories'],
    { revalidate: 3600, tags: ['categories'] } // Cache for 1 hour, or revalidate on demand
);

export const getTagsForForm = unstable_cache(
    async () => {
        try {
            return await prisma.tag.findMany({
                select: { name: true },
                orderBy: { name: 'asc' }
            });
        } catch (error) {
            console.error("Error fetching tags for form:", error);
            return [];
        }
    },
    ['form-tags'],
    { revalidate: 3600, tags: ['tags'] } // Cache for 1 hour, or revalidate on demand
);
