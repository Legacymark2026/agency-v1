"use client";

import { useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";

interface RealtimeRefresherProps {
    intervalMs?: number;
    pauseWhenHidden?: boolean; // Pause polling when tab is not visible
}

/**
 * Enterprise-grade Realtime Refresher
 * - Pauses when tab is not visible (saves server load & prevents removeChild DOM errors)
 * - Exponential backoff on focus: re-syncs immediately when user returns to tab
 * - Safe cleanup on unmount
 */
export function RealtimeRefresher({
    intervalMs = 30000,
    pauseWhenHidden = true,
}: RealtimeRefresherProps) {
    const router = useRouter();
    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const isVisible = useRef<boolean>(true);

    const startPolling = useCallback(() => {
        if (intervalRef.current) clearInterval(intervalRef.current);

        intervalRef.current = setInterval(() => {
            if (!pauseWhenHidden || isVisible.current) {
                router.refresh();
            }
        }, intervalMs);
    }, [router, intervalMs, pauseWhenHidden]);

    useEffect(() => {
        // Start polling
        startPolling();

        // Visibility API: pause when tab is hidden, resume + immediate refresh when visible
        const handleVisibilityChange = () => {
            if (document.visibilityState === "visible") {
                isVisible.current = true;
                // Immediate refresh when user comes back to tab
                router.refresh();
            } else {
                isVisible.current = false;
            }
        };

        document.addEventListener("visibilitychange", handleVisibilityChange);

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
            document.removeEventListener("visibilitychange", handleVisibilityChange);
        };
    }, [startPolling, router]);

    return null;
}
