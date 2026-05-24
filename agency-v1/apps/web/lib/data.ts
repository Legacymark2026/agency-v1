import { prisma } from "@/lib/prisma";
import { safeTableQuery } from "@/lib/db-utils";

export async function getRecentPosts(limit: number = 3) {
    return safeTableQuery("tbl_posts", async () =>
        prisma.post.findMany({
            where: { published: true },
            orderBy: { createdAt: "desc" },
            take: limit,
            include: { author: { select: { name: true } } }
        }),
        []
    );
}

export async function getAllPosts() {
    return safeTableQuery("tbl_posts", async () =>
        prisma.post.findMany({
            where: { published: true },
            orderBy: { createdAt: "desc" },
            include: { author: { select: { name: true } } }
        }),
        []
    );
}

export async function getPostBySlug(slug: string) {
    return safeTableQuery("tbl_posts", async () =>
        prisma.post.findUnique({
            where: { slug },
            include: {
                author: { select: { name: true, image: true } },
                categories: { select: { id: true, name: true } },
                tags: { select: { name: true } }
            }
        }),
        null
    );
}

export async function getRelatedPosts(currentPostId: string, categoryIds: string[], limit: number = 3) {
    return safeTableQuery("tbl_posts", async () =>
        prisma.post.findMany({
            where: {
                published: true,
                id: { not: currentPostId },
                ...(categoryIds.length > 0
                    ? {
                        categories: {
                            some: { id: { in: categoryIds } }
                        }
                    }
                    : {})
            },
            orderBy: { createdAt: "desc" },
            take: limit,
            select: {
                id: true,
                title: true,
                slug: true,
                excerpt: true,
                coverImage: true
            }
        }),
        []
    );
}

// --- Projects ---

export async function getRecentProjects(limit: number = 3) {
    return safeTableQuery("tbl_projects", async () =>
        prisma.project.findMany({
            where: { published: true },
            orderBy: { createdAt: "desc" },
            take: limit
        }),
        []
    );
}

export async function getAllProjects() {
    return safeTableQuery("tbl_projects", async () =>
        prisma.project.findMany({
            where: { published: true },
            orderBy: { createdAt: "desc" }
        }),
        []
    );
}

export async function getProjectBySlug(slug: string) {
    return safeTableQuery("tbl_projects", async () =>
        prisma.project.findUnique({
            where: { slug }
        }),
        null
    );
}
