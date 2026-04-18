/**
 * Blog Module - Custom Hooks
 */

'use client';

import { useState, useEffect } from 'react';
import type { Post, PostFilters, Category } from '../types';
import { getPosts, getCategories } from '../actions';

/**
 * Hook to fetch posts with filters
 */
export function usePosts(filters?: PostFilters) {
    const [posts, setPosts] = useState<Post[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchPosts = async () => {
            setIsLoading(true);
            const result = await getPosts(filters);

            if (result.success && result.posts) {
                setPosts(result.posts as unknown as Post[]);
                setError(null);
            } else {
                setError(result.error || 'Failed to load posts');
            }

            setIsLoading(false);
        };

        fetchPosts();
    }, [filters]);

    return {
        posts,
        isLoading,
        error,
    };
}

/**
 * Hook to fetch categories
 */
export function useCategories() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchCategories = async () => {
            setIsLoading(true);
            const result = await getCategories();

            if (result.success && result.categories) {
                setCategories(result.categories as Category[]);
                setError(null);
            } else {
                setError(result.error || 'Failed to load categories');
            }

            setIsLoading(false);
        };

        fetchCategories();
    }, []);

    return {
        categories,
        isLoading,
        error,
    };
}
