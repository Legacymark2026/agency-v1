import { prisma } from "@/lib/prisma";

export async function getRecentPosts(limit: number = 3) {
    try {
        return await prisma.post.findMany({
            where: { published: true },
            orderBy: { createdAt: 'desc' },
            take: limit,
            include: { author: { select: { name: true } } }
        });
    } catch (error) {
        console.error('Failed to fetch recent posts:', error);
        return [];
    }
}

export async function getAllPosts() {
    try {
        return await prisma.post.findMany({
            where: { published: true },
            orderBy: { createdAt: 'desc' },
            include: { author: { select: { name: true } } }
        });
    } catch (error) {
        return [];
    }
}

export async function getPostBySlug(slug: string) {
    try {
        return await prisma.post.findUnique({
            where: { slug },
            include: {
                author: { select: { name: true, image: true } },
                categories: { select: { id: true, name: true } },
                tags: { select: { name: true } }
            }
        });
    } catch (error) {
        return null;
    }
}

export async function getRelatedPosts(currentPostId: string, categoryIds: string[], limit: number = 3) {
    try {
        return await prisma.post.findMany({
            where: {
                published: true,
                id: { not: currentPostId },
                ...(categoryIds.length > 0 ? {
                    categories: {
                        some: { id: { in: categoryIds } }
                    }
                } : {})
            },
            orderBy: { createdAt: 'desc' },
            take: limit,
            select: {
                id: true,
                title: true,
                slug: true,
                excerpt: true,
                coverImage: true
            }
        });
    } catch (error) {
        return [];
    }
}

// --- Projects ---

export async function getRecentProjects(limit: number = 3) {
    try {
        return await prisma.project.findMany({
            where: { published: true },
            orderBy: { createdAt: 'desc' },
            take: limit,
        });
    } catch (error) {
        return [];
    }
}

export async function getAllProjects() {
    try {
        return await prisma.project.findMany({
            where: { published: true },
            orderBy: { createdAt: 'desc' },
        });
    } catch (error) {
        return [];
    }
}

export async function getProjectBySlug(slug: string) {
    try {
        return await prisma.project.findUnique({
            where: { slug },
        });
    } catch (error) {
        return null;
    }
}
