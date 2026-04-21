'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { auth } from '@/lib/auth';
import { ProjectSchema, type ProjectFormData } from '@/lib/schemas';
import { headers } from 'next/headers';
import crypto from 'crypto';

// --- Project CRUD Actions ---

export async function getProjects(options?: {
    categoryId?: string;
    status?: string;
    featured?: boolean;
    search?: string;
}) {
    const session = await auth();
    if (!session?.user) throw new Error("Unauthorized");

    const where: any /* eslint-disable-line @typescript-eslint/no-explicit-any */ = {};

    if (options?.categoryId) {
        where.categoryId = options.categoryId;
    }
    if (options?.status) {
        where.status = options.status;
    }
    if (options?.featured !== undefined) {
        where.featured = options.featured;
    }
    if (options?.search) {
        where.OR = [
            { title: { contains: options.search, mode: 'insensitive' } },
            { client: { contains: options.search, mode: 'insensitive' } },
            { description: { contains: options.search, mode: 'insensitive' } },
        ];
    }

    return prisma.project.findMany({
        where,
        orderBy: [
            { featured: 'desc' },
            { displayOrder: 'asc' },
            { createdAt: 'desc' }
        ],
        include: {
            category: true,
            _count: {
                select: { views: true }
            }
        }
    });
}

export async function getProject(id: string) {
    const session = await auth();
    if (!session?.user) throw new Error("Unauthorized");

    return prisma.project.findUnique({
        where: { id },
        include: {
            category: true
        }
    });
}

export async function getPublicProjects(options?: {
    categorySlug?: string;
    limit?: number;
}) {
    const where: any /* eslint-disable-line @typescript-eslint/no-explicit-any */ = {
        status: 'published',
        published: true
    };

    if (options?.categorySlug) {
        where.category = { slug: options.categorySlug };
    }

    return prisma.project.findMany({
        where,
        take: options?.limit,
        orderBy: [
            { featured: 'desc' },
            { displayOrder: 'asc' },
            { createdAt: 'desc' }
        ],
        include: {
            category: true,
            _count: {
                select: { views: true }
            }
        }
    });
}

export async function createProject(data: ProjectFormData) {
    const session = await auth();
    if (!session?.user) throw new Error("Unauthorized");

    const validated = ProjectSchema.parse(data);
    const { tagNames, categoryId, scheduledDate, startDate, endDate, results, gallery, ...projectData } = validated;

    try {
        // Process tags
        const tagConnections = tagNames?.length ? {
            connectOrCreate: tagNames.map(name => ({
                where: { name },
                create: { name }
            }))
        } : undefined;

        await prisma.project.create({
            data: {
                ...projectData,
                scheduledDate: scheduledDate ? new Date(scheduledDate) : null,
                startDate: startDate ? new Date(startDate) : null,
                endDate: endDate ? new Date(endDate) : null,
                results: results || [],
                gallery: gallery || [],
                categoryId: categoryId || null,
            } as any
        });

        revalidatePath('/dashboard/projects');
        revalidatePath('/portfolio');
        return { success: true };
    } catch (error) {
        console.error("Failed to create project:", error);
        return { success: false, error: "Failed to create project. Slug might be taken." };
    }
}

export async function updateProject(id: string, data: ProjectFormData) {
    const session = await auth();
    if (!session?.user) throw new Error("Unauthorized");

    const validated = ProjectSchema.parse(data);
    const { tagNames, categoryId, scheduledDate, startDate, endDate, results, gallery, ...projectData } = validated;

    try {
        // Process tags
        const tagConnections = tagNames?.length ? {
            set: [],
            connectOrCreate: tagNames.map(name => ({
                where: { name },
                create: { name }
            }))
        } : { set: [] };

        await prisma.project.update({
            where: { id },
            data: {
                ...projectData,
                scheduledDate: scheduledDate ? new Date(scheduledDate) : null,
                startDate: startDate ? new Date(startDate) : null,
                endDate: endDate ? new Date(endDate) : null,
                results: results || [],
                gallery: gallery || [],
                categoryId: categoryId || null,
            } as any
        });

        revalidatePath('/dashboard/projects');
        revalidatePath('/portfolio');
        revalidatePath(`/portfolio/${projectData.slug}`);
        return { success: true };
    } catch (error) {
        console.error("Failed to update project:", error);
        return { success: false, error: "Failed to update project" };
    }
}

export async function deleteProject(id: string) {
    const session = await auth();
    if (!session?.user) throw new Error("Unauthorized");

    try {
        await prisma.project.delete({ where: { id } });
        revalidatePath('/dashboard/projects');
        revalidatePath('/portfolio');
        return { success: true };
    } catch (error) {
        return { success: false, error: "Failed to delete project" };
    }
}

// --- Category Actions ---

export async function getProjectCategories() {
    return prisma.projectCategory.findMany({
        orderBy: { name: 'asc' }
    });
}

export async function createProjectCategory(name: string) {
    const session = await auth();
    if (!session?.user) throw new Error("Unauthorized");

    const slug = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');

    try {
        const category = await prisma.projectCategory.create({
            data: { name, slug }
        });
        return { success: true, category };
    } catch (error) {
        return { success: false, error: "Failed to create category" };
    }
}

// --- Tag Actions ---

export async function getProjectTags() {
    return prisma.projectTag.findMany({
        orderBy: { name: 'asc' },
        select: { name: true }
    });
}

// --- Analytics Actions ---

export async function recordProjectView(projectId: string) {
    try {
        const headersList = await headers();
        const ip = headersList.get('x-forwarded-for') || 'unknown';
        const userAgent = headersList.get('user-agent') || undefined;
        const referer = headersList.get('referer') || undefined;

        // Hash IP for privacy
        const ipHash = crypto.createHash('sha256').update(ip).digest('hex').substring(0, 32);

        // Try to create view (unique constraint prevents duplicates per day)
        await prisma.projectView.create({
            data: {
                projectId,
                ipHash,
                userAgent,
                referer
            }
        });

        return { success: true };
    } catch (error) {
        // Likely duplicate - ignore
        return { success: false };
    }
}

export async function getProjectViewCount(projectId: string) {
    const count = await prisma.projectView.count({
        where: { projectId }
    });
    return count;
}

// --- Bulk Actions ---

export async function updateProjectsStatus(ids: string[], status: string, published: boolean) {
    const session = await auth();
    if (!session?.user) throw new Error("Unauthorized");

    try {
        await prisma.project.updateMany({
            where: { id: { in: ids } },
            data: { status, published }
        });

        revalidatePath('/dashboard/projects');
        revalidatePath('/portfolio');
        return { success: true };
    } catch (error) {
        return { success: false, error: "Failed to update projects" };
    }
}

export async function updateProjectOrder(id: string, displayOrder: number) {
    const session = await auth();
    if (!session?.user) throw new Error("Unauthorized");

    try {
        await prisma.project.update({
            where: { id },
            data: { displayOrder }
        });
        return { success: true };
    } catch (error) {
        return { success: false, error: "Failed to update order" };
    }
}
