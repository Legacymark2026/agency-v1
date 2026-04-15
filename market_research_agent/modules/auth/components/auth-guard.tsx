/**
 * Auth Guard Component
 * HOC for protecting routes - redirects to login if not authenticated
 */

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from '../hooks';
import { Loader2 } from 'lucide-react';

interface AuthGuardProps {
    children: React.ReactNode;
    requiredRole?: string | string[];
    fallbackUrl?: string;
    loadingComponent?: React.ReactNode;
}

export function AuthGuard({
    children,
    requiredRole,
    fallbackUrl = '/auth/login',
    loadingComponent,
}: AuthGuardProps) {
    const router = useRouter();
    const { user, isLoading, isAuthenticated } = useSession();

    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            // Store intended destination
            const currentPath = window.location.pathname;
            const returnUrl = currentPath !== '/auth/login' ? `?returnUrl=${encodeURIComponent(currentPath)}` : '';
            router.push(`${fallbackUrl}${returnUrl}`);
        }
    }, [isLoading, isAuthenticated, fallbackUrl, router]);

    useEffect(() => {
        if (!isLoading && isAuthenticated && requiredRole && user) {
            const hasRequiredRole = Array.isArray(requiredRole)
                ? requiredRole.includes(user.role)
                : user.role === requiredRole;

            if (!hasRequiredRole) {
                router.push('/unauthorized');
            }
        }
    }, [isLoading, isAuthenticated, requiredRole, user, router]);

    if (isLoading) {
        return loadingComponent || (
            <div className="flex min-h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!isAuthenticated) {
        return null;
    }

    if (requiredRole && user) {
        const hasRequiredRole = Array.isArray(requiredRole)
            ? requiredRole.includes(user.role)
            : user.role === requiredRole;

        if (!hasRequiredRole) {
            return null;
        }
    }

    return <>{children}</>;
}

/**
 * Wrapper for admin-only routes
 */
export function AdminGuard({ children }: { children: React.ReactNode }) {
    return (
        <AuthGuard requiredRole="admin">
            {children}
        </AuthGuard>
    );
}

/**
 * Wrapper for guest-only routes (redirects to dashboard if authenticated)
 */
export function GuestGuard({
    children,
    redirectUrl = '/dashboard',
}: {
    children: React.ReactNode;
    redirectUrl?: string;
}) {
    const router = useRouter();
    const { isLoading, isAuthenticated } = useSession();

    useEffect(() => {
        if (!isLoading && isAuthenticated) {
            router.push(redirectUrl);
        }
    }, [isLoading, isAuthenticated, redirectUrl, router]);

    if (isLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (isAuthenticated) {
        return null;
    }

    return <>{children}</>;
}
