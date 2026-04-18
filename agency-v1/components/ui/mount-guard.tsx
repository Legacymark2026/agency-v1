"use client";

import { useEffect, useState, ReactNode } from "react";

/**
 * MountGuard - Prevents hydration mismatches (Error #418) 
 * by ensuring children only render after the initial mount.
 * 
 * Performance Architect Choice: This is the safest pattern for 
 * React 19 / Next.js 16 environments when dealing with 
 * environment-dependent structural nodes.
 */
export function MountGuard({ children, fallback = null }: { children: ReactNode; fallback?: ReactNode }) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return <>{fallback}</>;
    }

    return <>{children}</>;
}
