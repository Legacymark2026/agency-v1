'use server';

import { revalidatePath } from 'next/cache';
import { auth } from '@/lib/auth';
import { PostSchema, PostFormData } from '@/lib/schemas';
import { ok, fail, type ActionResult } from '@/types/actions';
import { prisma } from '@/lib/prisma';

// --- Post Actions ---

export async function getPosts() {
    const session = await auth();
    if (!session?.user) return fail('Unauthorized', 401);

    try {
        const posts = await prisma.post.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                author: { select: { name: true, email: true } },
                categories: true,
                tags: true
            }
        });
        return ok(posts);
    } catch (error) {
        console.error('Failed to get posts:', error);
        return fail('Failed to fetch posts', 500);
    }
}

export async function getPost(id: string) {
    const session = await auth();
    if (!session?.user) return fail('Unauthorized', 401);

    try {
        const post = await prisma.post.findUnique({
            where: { id },
            include: { categories: true, tags: true }
        });
        return ok(post);
    } catch (error) {
        console.error('Failed to get post:', error);
        return fail('Failed to fetch post', 500);
    }
}

export async function createPost(data: PostFormData): Promise<ActionResult<{ id: string }>> {
    const session = await auth();
    if (!session?.user?.id) return fail('Unauthorized', 401);

    const validated = PostSchema.parse(data);
    const { categoryIds, tagNames, scheduledDate, faqs, ...postData } = validated;

    try {
        const tagConnections = tagNames?.length ? {
            connectOrCreate: tagNames.map(name => ({
                where: { name },
                create: { name }
            }))
        } : undefined;

        const categoryConnections = categoryIds?.length ? {
            connect: categoryIds.map(id => ({ id }))
        } : undefined;

        const post = await prisma.post.create({
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
        revalidatePath('/blog');
        revalidatePath(`/blog/${postData.slug}`, 'page');
        return ok({ id: post.id });
    } catch (error) {
        console.error('Failed to create post:', error);
        return fail('No se pudo crear el post. El slug puede estar ocupado.', 409);
    }
}

export async function updatePost(id: string, data: PostFormData) {
    const session = await auth();
    if (!session?.user) throw new Error("Unauthorized");

    const validated = PostSchema.parse(data);
    const { categoryIds, tagNames, scheduledDate, faqs, ...postData } = validated;

    try {
        // Fetch current post first via prisma to manage paths during revalidation
        const currentPost = await prisma.post.findUnique({
            where: { id }
        }).catch(() => null);

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
        if (currentPost && currentPost.slug !== postData.slug) {
            revalidatePath(`/blog/${currentPost.slug}`, 'page'); // Invalidar el viejo también
        }
        return { success: true };
    } catch (error) {
        console.error("Failed to update post:", error);
        return { success: false, error: "Failed to update post" };
    }
}

export async function deletePost(id: string): Promise<ActionResult<void>> {
    const session = await auth();
    if (!session?.user) return fail('Unauthorized', 401);

    try {
        await prisma.post.delete({
            where: { id }
        });
        revalidatePath('/dashboard/posts');
        return ok(undefined);
    } catch (error) {
        console.error(error);
        return fail('No se pudo eliminar el post', 500);
    }
}

// --- Category Actions ---

export async function getCategories() {
    const session = await auth();
    if (!session?.user) throw new Error("Unauthorized");

    try {
        const categories = await prisma.category.findMany({
            orderBy: { name: 'asc' },
            include: { _count: { select: { posts: true } } }
        });
        return categories;
    } catch (error) {
        console.error("Failed to get categories:", error);
        return [];
    }
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

export async function deleteCategory(id: string): Promise<ActionResult<void>> {
    const session = await auth();
    if (!session?.user) return fail('Unauthorized', 401);

    try {
        await prisma.category.delete({
            where: { id }
        });
        revalidatePath('/dashboard/posts/categories');
        return ok(undefined);
    } catch (error) {
        console.error('Failed to delete category:', error);
        return fail('No se pudo eliminar la categoría. Asegúrate de que no tenga posts vinculados.', 409);
    }
}

export async function getTags() {
    const session = await auth();
    if (!session?.user) throw new Error("Unauthorized");

    try {
        const tags = await prisma.tag.findMany({
            orderBy: { name: 'asc' },
            select: { name: true }
        });
        return tags;
    } catch (error) {
        console.error("Failed to get tags:", error);
        return [];
    }
}
