'use server';

import { prisma } from "@/lib/prisma";

interface SearchResult {
    type: 'blog' | 'project' | 'service';
    id: string;
    title: string;
    description: string;
    url: string;
    image?: string | null;
}

export async function globalSearch(query: string): Promise<SearchResult[]> {
    if (!query || query.length < 2) {
        return [];
    }

    try {
        const results: SearchResult[] = [];
        const searchTerm = { contains: query, mode: 'insensitive' as const };

        const [posts, projects, services] = await Promise.all([
            prisma.post.findMany({
                where: {
                    published: true,
                    OR: [
                        { title: searchTerm },
                        { content: searchTerm },
                        { excerpt: searchTerm }
                    ]
                },
                select: {
                    id: true,
                    title: true,
                    excerpt: true,
                    slug: true,
                    coverImage: true
                },
                take: 5
            }),
            prisma.project.findMany({
                where: {
                    published: true,
                    OR: [
                        { title: searchTerm },
                        { description: searchTerm },
                        { client: searchTerm }
                    ]
                },
                select: {
                    id: true,
                    title: true,
                    description: true,
                    slug: true,
                    coverImage: true
                },
                take: 5
            }),
            prisma.service.findMany({
                where: {
                    OR: [
                        { name: searchTerm },
                        { description: searchTerm }
                    ]
                },
                select: {
                    id: true,
                    name: true,
                    description: true,
                    slug: true,
                    icon: true
                },
                take: 5
            })
        ]);

        posts.forEach(post => {
            results.push({
                type: 'blog',
                id: post.id,
                title: post.title,
                description: post.excerpt || '',
                url: `/blog/${post.slug}`,
                image: post.coverImage
            });
        });

        projects.forEach(project => {
            results.push({
                type: 'project',
                id: project.id,
                title: project.title,
                description: project.description,
                url: `/portfolio/${project.slug}`,
                image: project.coverImage
            });
        });

        services.forEach(service => {
            results.push({
                type: 'service',
                id: service.id,
                title: service.name,
                description: service.description || '',
                url: `/servicios/${service.slug}`,
                image: null
            });
        });

        return results;
    } catch (error) {
        console.error('Error in global search:', error);
        return [];
    }
}
