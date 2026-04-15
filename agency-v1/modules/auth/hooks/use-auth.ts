/**
 * Auth Module - Custom Hooks
 */

'use client';

import { useSession as useNextAuthSession } from 'next-auth/react';
import type { AuthUser, AuthState } from '../types';

/**
 * Custom hook for accessing authentication session
 * Wrapper around NextAuth useSession with typed response
 */
export function useSession() {
    const { data: session, status } = useNextAuthSession();

    return {
        session,
        user: session?.user as AuthUser | undefined,
        status,
        isAuthenticated: status === 'authenticated',
        isLoading: status === 'loading',
    };
}

/**
 * Custom hook for authentication state
 * Provides complete auth state with user data and loading states
 */
export function useAuth(): AuthState {
    const { user, isAuthenticated, isLoading } = useSession();

    return {
        user: user || null,
        isAuthenticated,
        isLoading,
        error: null,
    };
}

/**
 * Hook to check if user has specific role
 */
export function useHasRole(role: string | string[]) {
    const { user } = useAuth();

    if (!user) return false;

    if (Array.isArray(role)) {
        return role.includes(user.role);
    }

    return user.role === role;
}

/**
 * Hook to check if user is admin
 */
export function useIsAdmin() {
    return useHasRole('admin');
}
