'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

import { auth } from '@/lib/auth';

import { PostSchema, ProjectSchema, PostFormData, ProjectFormData } from '@/lib/schemas';

// --- Post Actions ---

export async function getPosts() {
    const session = await auth();
    if (!session?.user) throw new Error("Unauthorized");

    return prisma.post.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
            author: { select: { name: true, email: true } },
            categories: true,
            tags: true
        }
    });
}

export async function getPost(id: string) {
    const session = await auth();
    if (!session?.user) throw new Error("Unauthorized");

    return prisma.post.findUnique({
        where: { id },
        include: {
            categories: true,
            tags: true
        }
    });
}

export async function createPost(data: PostFormData) {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");

    const validated = PostSchema.parse(data);
    const { categoryIds, tagNames, scheduledDate, faqs, ...postData } = validated;

    try {
        // Process tags: find existing or create new
        const tagConnections = tagNames?.length ? {
            connectOrCreate: tagNames.map(name => ({
                where: { name },
                create: { name }
            }))
        } : undefined;

        // Process categories
        const categoryConnections = categoryIds?.length ? {
            connect: categoryIds.map(id => ({ id }))
        } : undefined;

        await prisma.post.create({
            data: {
                title: postData.title,
                slug: postData.slug,
                excerpt: postData.excerpt,
                content: postData.content,
                coverImage: postData.coverImage,
                imageAlt: postData.imageAlt,
                published: postData.published,
                metaTitle: postData.metaTitle,
                metaDescription: postData.metaDescription,
                status: postData.status,
                scheduledDate: scheduledDate ? new Date(scheduledDate) : null,
                authorId: session.user.id,
                tags: tagConnections,
                categories: categoryConnections,
                faqs: faqs || [],
            }
        });
        revalidatePath('/dashboard/posts');
        revalidatePath('/blog'); // Revalidate blog index list
        revalidatePath(`/blog/${postData.slug}`, 'page'); // Revalidate specific post page 
        return { success: true };
    } catch (error) {
        console.error("Failed to create post:", error);
        return { success: false, error: "Failed to create post. Slug might be taken." };
    }
}

export async function updatePost(id: string, data: PostFormData) {
    const session = await auth();
    if (!session?.user) throw new Error("Unauthorized");

    const validated = PostSchema.parse(data);
    const { categoryIds, tagNames, scheduledDate, faqs, ...postData } = validated;

    try {
        // Get current post to manage relationships
        const currentPost = await prisma.post.findUnique({
            where: { id },
            include: { tags: true, categories: true }
        });

        if (!currentPost) {
            return { success: false, error: "Post not found" };
        }

        // Process tags
        const tagConnections = tagNames?.length ? {
            set: [], // Disconnect all first
            connectOrCreate: tagNames.map(name => ({
                where: { name },
                create: { name }
            }))
        } : { set: [] };

        // Process categories
        const categoryConnections = categoryIds?.length ? {
            set: categoryIds.map(id => ({ id }))
        } : { set: [] };

        await prisma.post.update({
            where: { id },
            data: {
                title: postData.title,
                slug: postData.slug,
                excerpt: postData.excerpt,
                content: postData.content,
                coverImage: postData.coverImage,
                imageAlt: postData.imageAlt,
                published: postData.published,
                metaTitle: postData.metaTitle,
                metaDescription: postData.metaDescription,
                status: postData.status,
                scheduledDate: scheduledDate ? new Date(scheduledDate) : null,
                tags: tagConnections,
                categories: categoryConnections,
                faqs: faqs || [],
            }
        });
        revalidatePath('/dashboard/posts');
        revalidatePath('/blog'); // Revalidate blog listing
        revalidatePath(`/blog/${postData.slug}`, 'page'); // Revalidate specific new slug
        if (currentPost.slug !== postData.slug) {
            revalidatePath(`/blog/${currentPost.slug}`, 'page'); // Invalidar el viejo también
        }
        return { success: true };
    } catch (error) {
        console.error("Failed to update post:", error);
        return { success: false, error: "Failed to update post" };
    }
}

export async function deletePost(id: string) {
    const session = await auth();
    if (!session?.user) throw new Error("Unauthorized");

    try {
        await prisma.post.delete({ where: { id } });
        revalidatePath('/dashboard/posts');
        return { success: true };
    } catch (error) {
        console.error(error);
        return { success: false, error: "Failed to delete post" };
    }
}

// --- Category Actions ---

export async function getCategories() {
    const session = await auth();
    if (!session?.user) throw new Error("Unauthorized");

    return prisma.category.findMany({
        orderBy: { name: 'asc' },
        include: {
            _count: {
                select: { posts: true }
            }
        }
    });
}

export async function createCategory(data: { name: string, slug: string }) {
    const session = await auth();
    if (!session?.user) throw new Error("Unauthorized");

    try {
        await prisma.category.create({
            data: {
                name: data.name,
                slug: data.slug,
            }
        });
        revalidatePath('/dashboard/posts/categories');
        return { success: true };
    } catch (error) {
        console.error("Failed to create category:", error);
        return { success: false, error: "Failed to create category (slug or name might exist)" };
    }
}

export async function updateCategory(id: string, data: { name: string, slug: string }) {
    const session = await auth();
    if (!session?.user) throw new Error("Unauthorized");

    try {
        await prisma.category.update({
            where: { id },
            data: {
                name: data.name,
                slug: data.slug,
            }
        });
        revalidatePath('/dashboard/posts/categories');
        return { success: true };
    } catch (error) {
        console.error("Failed to update category:", error);
        return { success: false, error: "Failed to update category" };
    }
}

export async function deleteCategory(id: string) {
    const session = await auth();
    if (!session?.user) throw new Error("Unauthorized");

    try {
        await prisma.category.delete({ where: { id } });
        revalidatePath('/dashboard/posts/categories');
        return { success: true };
    } catch (error) {
        console.error("Failed to delete category:", error);
        return { success: false, error: "Failed to delete category. Ensure no posts are linked to it." };
    }
}

export async function getTags() {
    const session = await auth();
    if (!session?.user) throw new Error("Unauthorized");

    return prisma.tag.findMany({
        orderBy: { name: 'asc' },
        select: { name: true }
    });
}

// --- Project Actions ---

export async function getProjects() {
    const session = await auth();
    if (!session?.user) throw new Error("Unauthorized");

    return prisma.project.findMany({
        orderBy: { createdAt: 'desc' }
    });
}

export async function getProject(id: string) {
    const session = await auth();
    if (!session?.user) throw new Error("Unauthorized");

    return prisma.project.findUnique({ where: { id } });
}

export async function createProject(data: ProjectFormData) {
    const session = await auth();
    if (!session?.user) throw new Error("Unauthorized");

    const validated = ProjectSchema.parse(data);
    const { tagNames, scheduledDate, startDate, endDate, ...projectData } = validated;

    try {
        const { categoryId, ...restData } = projectData;
        await prisma.project.create({
            data: {
                ...restData,
                scheduledDate: scheduledDate ? new Date(scheduledDate) : null,
                startDate: startDate ? new Date(startDate) : null,
                endDate: endDate ? new Date(endDate) : null,
                ...(categoryId ? { category: { connect: { id: categoryId } } } : {}),
            }
        });
        revalidatePath('/dashboard/projects');
        revalidatePath('/portfolio');
        revalidatePath(`/portfolio/${validated.slug}`, 'page');
        return { success: true };
    } catch (error) {
        console.error(error);
        return { success: false, error: "Failed to create project" };
    }
}

export async function updateProject(id: string, data: ProjectFormData) {
    const session = await auth();
    if (!session?.user) throw new Error("Unauthorized");

    const validated = ProjectSchema.parse(data);
    const { tagNames, scheduledDate, startDate, endDate, ...projectData } = validated;

    try {
        const currentProject = await prisma.project.findUnique({ where: { id } });

        await prisma.project.update({
            where: { id },
            data: {
                ...projectData,
                scheduledDate: scheduledDate ? new Date(scheduledDate) : null,
                startDate: startDate ? new Date(startDate) : null,
                endDate: endDate ? new Date(endDate) : null,
            } as any
        });
        revalidatePath('/dashboard/projects');
        revalidatePath('/portfolio');
        revalidatePath(`/portfolio/${validated.slug}`, 'page');
        if (currentProject && currentProject.slug !== validated.slug) {
            revalidatePath(`/portfolio/${currentProject.slug}`, 'page');
        }
        return { success: true };
    } catch (error) {
        console.error(error);
        return { success: false, error: "Failed to update project" };
    }
}

export async function deleteProject(id: string) {
    const session = await auth();
    if (!session?.user) throw new Error("Unauthorized");

    try {
        await prisma.project.delete({ where: { id } });
        revalidatePath('/dashboard/projects');
        return { success: true };
    } catch (error) {
        console.error(error);
        return { success: false, error: "Failed to delete project" };
    }
}
