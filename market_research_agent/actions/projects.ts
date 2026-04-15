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
            category: true,
            // relatedProjects: {
            //     select: { id: true, title: true, slug: true, coverImage: true }
            // }
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
    const { tagNames, categoryId, scheduledDate, startDate, endDate, results, gallery, techStack, team, ...projectData } = validated;

    // Handle new fields safely
    const isTemplate = (data as any).isTemplate || false;
    const relatedProjects = (data as any).relatedProjects || [];

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
                techStack: techStack || [],
                team: team || [],
                categoryId: categoryId || null,
            }
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
    const { tagNames, categoryId, scheduledDate, startDate, endDate, results, gallery, techStack, team, ...projectData } = validated;

    // Handle new fields safely
    const isTemplate = (data as any).isTemplate || false;
    const relatedProjects = (data as any).relatedProjects || [];

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
                techStack: techStack || [],
                team: team || [],
                categoryId: categoryId || null,
            }
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

export async function duplicateProject(id: string) {
    const session = await auth();
    if (!session?.user) throw new Error("Unauthorized");

    try {
        const project = await prisma.project.findUnique({
            where: { id },
            include: {}
        });

        if (!project) return { success: false, error: "Project not found" };

        const newSlug = `${project.slug}-copy-${Date.now()}`;
        const newTitle = `${project.title} (Copy)`;

        // Destructure to exclude unique/auto fields
        const { id: _id, createdAt, updatedAt, slug, title, ...dataToCopy } = project;

        await prisma.project.create({
            data: {
                ...dataToCopy,
                gallery: dataToCopy.gallery as any,
                results: dataToCopy.results as any,
                techStack: dataToCopy.techStack as any,
                team: dataToCopy.team as any,
                title: newTitle,
                slug: newSlug,
                status: 'draft',
                published: false,
                displayOrder: 0,
                // Skip related projects or copy them? Copying them seems better but strictly they are new relations.
                // Let's copy them.
                // relatedProjects: { connect: ... } // Complexity. Skip for now.
            }
        });

        revalidatePath('/dashboard/projects');
        return { success: true };
    } catch (error) {
        console.error("Duplicate error:", error);
        return { success: false, error: "Failed to duplicate project" };
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
        console.error(error);
        return { success: false, error: "Failed to create category" };
    }
}

export async function updateProjectCategory(id: string, name: string) {
    const session = await auth();
    if (!session?.user) throw new Error("Unauthorized");

    const slug = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');

    try {
        const category = await prisma.projectCategory.update({
            where: { id },
            data: { name, slug }
        });
        return { success: true, category };
    } catch (error) {
        console.error(error);
        return { success: false, error: "Failed to update category" };
    }
}

export async function deleteProjectCategory(id: string) {
    const session = await auth();
    if (!session?.user) throw new Error("Unauthorized");

    try {
        await prisma.projectCategory.delete({
            where: { id }
        });
        return { success: true };
    } catch (error) {
        console.error(error);
        return { success: false, error: "No se puede eliminar la categoría. Asegúrate de que no haya proyectos usándola." };
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
        console.error(error);
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
        console.error(error);
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
        console.error(error);
        return { success: false, error: "Failed to update order" };
    }
}

export async function reorderProjects(items: { id: string; displayOrder: number }[]) {
    const session = await auth();
    if (!session?.user) throw new Error("Unauthorized");

    try {
        const transaction = items.map((item) =>
            prisma.project.update({
                where: { id: item.id },
                data: { displayOrder: item.displayOrder },
            })
        );
        await prisma.$transaction(transaction);
        revalidatePath('/dashboard/projects');
        revalidatePath('/portfolio');
        return { success: true };
    } catch (error) {
        console.error("Reorder error:", error);
        return { success: false, error: "Failed to reorder projects" };
    }
}
