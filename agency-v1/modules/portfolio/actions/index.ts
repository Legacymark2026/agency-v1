/**
 * Portfolio Module - Server Actions
 */

'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import type { CreateProjectInput, UpdateProjectInput, ProjectFilters } from '../types';
import { createProjectSchema, updateProjectSchema } from '../lib/validations';
import { generateProjectSlug } from '../lib/utils';

/**
 * Get all projects with filters
 */
export async function getProjects(filters?: ProjectFilters) {
    try {
        const {
            category,
            status,
            featured,
            search,
            tags,
            limit = 20,
            offset = 0,
            orderBy = 'createdAt',
            order = 'desc',
        } = filters || {};

        const where: any = {};

        if (category) {
            where.category = Array.isArray(category) ? { in: category } : category;
        }
        if (status) where.status = status;
        if (featured !== undefined) where.featured = featured;

        if (search) {
            where.OR = [
                { title: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
                { client: { contains: search, mode: 'insensitive' } },
            ];
        }

        if (tags && tags.length > 0) {
            where.tags = { hasSome: tags };
        }

        const projects = await prisma.project.findMany({
            where,
            take: limit,
            skip: offset,
            orderBy: { [orderBy]: order },
        });

        const total = await prisma.project.count({ where });

        return {
            success: true,
            projects,
            total,
        };
    } catch (error) {
        console.error('Error fetching projects:', error);
        return {
            success: false,
            error: 'Failed to fetch projects',
        };
    }
}

/**
 * Get a single project by slug
 */
export async function getProjectBySlug(slug: string) {
    try {
        const project = await prisma.project.findUnique({
            where: { slug },
        });

        if (!project) {
            return {
                success: false,
                error: 'Project not found',
            };
        }

        // Increment view count via ProjectView
        await prisma.projectView.create({
            data: { projectId: project.id, ipHash: 'server-fetch' },
        }).catch(() => {/* ignore duplicate */ });

        return {
            success: true,
            project,
        };
    } catch (error) {
        console.error('Error fetching project:', error);
        return {
            success: false,
            error: 'Failed to fetch project',
        };
    }
}

/**
 * Create a new project
 */
export async function createProject(data: CreateProjectInput) {
    try {
        const validData = createProjectSchema.parse(data);

        // Generate slug if not provided
        const slug = validData.slug || generateProjectSlug(validData.title);

        // Check if slug already exists
        const existing = await prisma.project.findUnique({ where: { slug } });
        if (existing) {
            return {
                success: false,
                error: 'A project with this slug already exists',
            };
        }

        const project = await prisma.project.create({
            data: {
                title: validData.title,
                slug,
                description: validData.description || '',
                content: validData.content || '',
                coverImage: validData.coverImage,
                status: validData.status || 'draft',
                featured: validData.featured || false,
                client: validData.client,
                projectUrl: validData.websiteUrl,
            },
        });

        revalidatePath('/portfolio');
        revalidatePath(`/portfolio/${slug}`);

        return {
            success: true,
            project,
        };
    } catch (error) {
        console.error('Error creating project:', error);
        return {
            success: false,
            error: 'Failed to create project',
        };
    }
}

/**
 * Update a project
 */
export async function updateProject(id: string, data: UpdateProjectInput) {
    try {
        const validData = updateProjectSchema.parse(data);

        const updates: any = { ...validData };

        // Update slug if title changed and no custom slug provided
        if (data.title && !data.slug) {
            updates.slug = generateProjectSlug(data.title);
        }

        const project = await prisma.project.update({
            where: { id },
            data: updates,
        });

        revalidatePath('/portfolio');
        revalidatePath(`/portfolio/${project.slug}`);

        return {
            success: true,
            project,
        };
    } catch (error) {
        console.error('Error updating project:', error);
        return {
            success: false,
            error: 'Failed to update project',
        };
    }
}

/**
 * Delete a project
 */
export async function deleteProject(id: string) {
    try {
        await prisma.project.delete({ where: { id } });

        revalidatePath('/portfolio');

        return {
            success: true,
        };
    } catch (error) {
        console.error('Error deleting project:', error);
        return {
            success: false,
            error: 'Failed to delete project',
        };
    }
}

/**
 * Featured projects
 */
export async function getFeaturedProjects(limit: number = 6) {
    try {
        const projects = await prisma.project.findMany({
            where: {
                status: 'PUBLISHED',
                featured: true,
            },
            take: limit,
            orderBy: { createdAt: 'desc' },
        });

        return {
            success: true,
            projects,
        };
    } catch (error) {
        console.error('Error fetching featured projects:', error);
        return {
            success: false,
            error: 'Failed to fetch featured projects',
        };
    }
}
