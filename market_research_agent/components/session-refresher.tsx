'use client';

import { useSession } from "next-auth/react";
import { useEffect } from "react";

export function SessionRefresher() {
    const { update } = useSession();

    useEffect(() => {
        // Trigger session update on mount ensuring we have latest data
        update();
    }, [update]);

    return null;
}
