"use client";

import { useUIStore } from "@/lib/stores/ui-store";
import { useEffect } from "react";

export function SidebarController({ children }: { children: React.ReactNode }) {
    const { sidebarCollapsed, toggleSidebar } = useUIStore();

    useEffect(() => {
        // Keyboard shortcut: Ctrl+B or Cmd+B
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === "b") {
                e.preventDefault();
                toggleSidebar();
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [toggleSidebar]);

    return <>{children}</>;
}