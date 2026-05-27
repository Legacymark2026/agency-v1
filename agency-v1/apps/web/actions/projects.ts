// @ts-nocheck
'use server';

import { revalidatePath } from 'next/cache';
import { auth } from '@/lib/auth';
import { ProjectSchema, type ProjectFormData } from '@/lib/schemas';
import { headers } from 'next/headers';
import crypto from 'crypto';

const GATEWAY_URL = process.env.API_GATEWAY_URL || 'http://localhost:8080';
async function gw(path: string, options: RequestInit = {}) {
  const res = await fetch(`${GATEWAY_URL}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options.headers }
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || `Gateway error ${res.status}`);
  }
  return res.json();
}

// --- Project CRUD Actions ---

export async function getProjects(options?: {
    categoryId?: string;
    status?: string;
    featured?: boolean;
    search?: string;
}) {
    const session = await auth();
    if (!session?.user) throw new Error("Unauthorized");

    const params = new URLSearchParams();
    if (options?.categoryId) params.set('categoryId', options.categoryId);
    if (options?.status) params.set('status', options.status);
    if (options?.featured !== undefined) params.set('featured', String(options.featured));
    if (options?.search) params.set('search', options.search);

    try {
        const res = await gw(`/api/portfolio/projects?${params.toString()}`);
        return res.projects || [];
    } catch (error) {
        console.error("Failed to get projects:", error);
        return [];
    }
}

export async function getProject(id: string) {
    const session = await auth();
    if (!session?.user) throw new Error("Unauthorized");

    try {
        const res = await gw(`/api/portfolio/projects/${id}`);
        return res;
    } catch (error) {
        console.error("Failed to get project:", error);
        return null;
    }
}

export async function getPublicProjects(options?: {
    categorySlug?: string;
    limit?: number;
}) {
    const params = new URLSearchParams();
    if (options?.categorySlug) params.set('categorySlug', options.categorySlug);
    if (options?.limit) params.set('limit', String(options.limit));

    try {
        const res = await gw(`/api/portfolio/projects/public?${params.toString()}`);
        return res.projects || [];
    } catch (error) {
        console.error("Failed to get public projects:", error);
        return [];
    }
}

export async function createProject(data: ProjectFormData) {
    const session = await auth();
    if (!session?.user) throw new Error("Unauthorized");

    const validated = ProjectSchema.parse(data);
    const { tagNames, categoryId, scheduledDate, startDate, endDate, results, gallery, techStack, team, ...projectData } = validated;

    try {
        // Tag connections (Explicit join table)
        const tagConnections = tagNames?.length ? {
            create: tagNames.map(name => ({
                project_tags: {
                    connectOrCreate: {
                        where: { name },
                        create: { name }
                    }
                }
            }))
        } : undefined;

        const createData: any = {
            ...projectData,
            scheduledDate: scheduledDate ? new Date(scheduledDate) : null,
            startDate: startDate ? new Date(startDate) : null,
            endDate: endDate ? new Date(endDate) : null,
            results: results || [],
            gallery: gallery || [],
            techStack: techStack || [],
            team: team || [],
            ProjectToProjectTag: tagConnections,
        };

        // Explicitly remove categoryId to prevent Prisma union collision
        delete createData.categoryId;

        if (categoryId) {
            createData.category = { connect: { id: categoryId } };
        }

        await gw('/api/portfolio/projects', {
            method: 'POST',
            body: JSON.stringify(createData)
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

    try {
        // Tag connections (Explicit join table)
        const tagConnections = tagNames?.length ? {
            deleteMany: {}, // Clear existing tags
            create: tagNames.map(name => ({
                project_tags: {
                    connectOrCreate: {
                        where: { name },
                        create: { name }
                    }
                }
            }))
        } : { deleteMany: {} };

        const updateData: any = {
            ...projectData,
            scheduledDate: scheduledDate ? new Date(scheduledDate) : null,
            startDate: startDate ? new Date(startDate) : null,
            endDate: endDate ? new Date(endDate) : null,
            results: results || [],
            gallery: gallery || [],
            techStack: techStack || [],
            team: team || [],
            ProjectToProjectTag: tagConnections,
        };

        // Explicitly remove categoryId to prevent Prisma union collision
        delete updateData.categoryId;

        if (categoryId) {
            updateData.category = { connect: { id: categoryId } };
        } else {
            updateData.category = { disconnect: true };
        }

        await gw(`/api/portfolio/projects/${id}`, {
            method: 'PATCH',
            body: JSON.stringify(updateData)
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
        await gw(`/api/portfolio/projects/${id}/duplicate`, {
            method: 'POST'
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
        await gw(`/api/portfolio/projects/${id}`, {
            method: 'DELETE'
        });
        revalidatePath('/dashboard/projects');
        revalidatePath('/portfolio');
        return { success: true };
    } catch (error) {
        return { success: false, error: "Failed to delete project" };
    }
}

// --- Category Actions ---

export async function getProjectCategories(): Promise<{ id: string; name: string; slug: string; color?: string | null }[]> {
    try {
        const res = await gw('/api/portfolio/categories');
        return (res.categories || []) as { id: string; name: string; slug: string; color?: string | null }[];
    } catch (error) {
        console.error("Failed to get categories:", error);
        return [];
    }
}

export async function createProjectCategory(name: string) {
    const session = await auth();
    if (!session?.user) throw new Error("Unauthorized");

    try {
        const res = await gw('/api/portfolio/categories', {
            method: 'POST',
            body: JSON.stringify({ name })
        });
        return { success: true, category: res.category };
    } catch (error) {
        console.error(error);
        return { success: false, error: "Failed to create category" };
    }
}

export async function updateProjectCategory(id: string, name: string) {
    const session = await auth();
    if (!session?.user) throw new Error("Unauthorized");

    try {
        const res = await gw(`/api/portfolio/categories/${id}`, {
            method: 'PATCH',
            body: JSON.stringify({ name })
        });
        return { success: true, category: res.category };
    } catch (error) {
        console.error(error);
        return { success: false, error: "Failed to update category" };
    }
}

export async function deleteProjectCategory(id: string) {
    const session = await auth();
    if (!session?.user) throw new Error("Unauthorized");

    try {
        await gw(`/api/portfolio/categories/${id}`, {
            method: 'DELETE'
        });
        return { success: true };
    } catch (error) {
        console.error(error);
        return { success: false, error: "No se puede eliminar la categoría. Asegúrate de que no haya proyectos usándola." };
    }
}

// --- Tag Actions ---

export async function getProjectTags(): Promise<{ name: string }[]> {
    try {
        const res = await gw('/api/portfolio/tags');
        return (res.tags || []) as { name: string }[];
    } catch (error) {
        console.error("Failed to get tags:", error);
        return [];
    }
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

        await gw(`/api/portfolio/projects/${projectId}/view`, {
            method: 'POST',
            body: JSON.stringify({
                ipHash,
                userAgent,
                referer
            })
        });

        return { success: true };
    } catch (error) {
        console.error(error);
        return { success: false };
    }
}

export async function getProjectViewCount(projectId: string) {
    try {
        const res = await gw(`/api/portfolio/projects/${projectId}/views`);
        return res.count || 0;
    } catch (error) {
        console.error("Failed to get view count:", error);
        return 0;
    }
}

// --- Bulk Actions ---

export async function updateProjectsStatus(ids: string[], status: string, published: boolean) {
    const session = await auth();
    if (!session?.user) throw new Error("Unauthorized");

    try {
        await gw('/api/portfolio/projects/bulk-status', {
            method: 'PATCH',
            body: JSON.stringify({ ids, status, published })
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
        await gw(`/api/portfolio/projects/${id}`, {
            method: 'PATCH',
            body: JSON.stringify({ displayOrder })
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
        await gw('/api/portfolio/projects/reorder', {
            method: 'POST',
            body: JSON.stringify({ items })
        });
        revalidatePath('/dashboard/projects');
        revalidatePath('/portfolio');
        return { success: true };
    } catch (error) {
        console.error("Reorder error:", error);
        return { success: false, error: "Failed to reorder projects" };
    }
}
