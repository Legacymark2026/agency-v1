"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function RealtimeRefresher({ intervalMs = 5000 }: { intervalMs?: number }) {
    const router = useRouter();

    useEffect(() => {
        const intervalId = setInterval(() => {
            // router.refresh() triggers a server-side revalidation of the current route,
            // fetching new messages/conversations without losing client-side state
            // or causing a full page reload.
            router.refresh();
        }, intervalMs);

        return () => clearInterval(intervalId);
    }, [router, intervalMs]);

    return null; // Invisible component
}
