/**
 * Portfolio Module - Custom Hooks
 */

'use client';

import { useState, useEffect } from 'react';
import type { Project, ProjectFilters } from '../types';
import { getProjects, getFeaturedProjects } from '../actions';

/**
 * Hook to fetch projects with filters
 */
export function useProjects(filters?: ProjectFilters) {
    const [projects, setProjects] = useState<Project[]>([]);
    const [total, setTotal] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchProjects = async () => {
            setIsLoading(true);
            const result = await getProjects(filters);

            if (result.success && result.projects) {
                setProjects(result.projects as Project[]);
                setTotal(result.total || 0);
                setError(null);
            } else {
                setError(result.error || 'Failed to load projects');
            }

            setIsLoading(false);
        };

        fetchProjects();
    }, [filters]);

    return {
        projects,
        total,
        isLoading,
        error,
    };
}

/**
 * Hook to fetch featured projects
 */
export function useFeaturedProjects(limit: number = 6) {
    const [projects, setProjects] = useState<Project[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchProjects = async () => {
            setIsLoading(true);
            const result = await getFeaturedProjects(limit);

            if (result.success && result.projects) {
                setProjects(result.projects as Project[]);
                setError(null);
            } else {
                setError(result.error || 'Failed to load featured projects');
            }

            setIsLoading(false);
        };

        fetchProjects();
    }, [limit]);

    return {
        projects,
        isLoading,
        error,
    };
}
