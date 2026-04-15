import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

export type BadgeVariant = 'teal' | 'green' | 'amber' | 'red' | 'blue' | 'slate' | 'purple';

interface StatusBadgeProps {
    status?: 'connected' | 'disconnected' | 'loading' | 'error';
    label?: string;
    variant?: BadgeVariant;
    live?: boolean;
    className?: string;
    pulse?: boolean;
}

export function StatusBadge({ status, label, variant = 'teal', live, className, pulse = true }: StatusBadgeProps) {
    // Legacy support for HUD style (DashboardUI)
    if (label) {
        return (
            <span className={cn(`ds-badge ds-badge-${variant}`, className)}>
                {live && (
                    <span className="relative flex h-1.5 w-1.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-teal-500" />
                    </span>
                )}
                {label}
            </span>
        );
    }

    // Default status behavior
    if (!status) return null;

    const styles = {
        connected: "bg-emerald-50 text-emerald-700 border-emerald-200",
        disconnected: "bg-gray-100 text-gray-500 border-gray-200",
        loading: "bg-blue-50 text-blue-700 border-blue-200",
        error: "bg-red-50 text-red-700 border-red-200",
    };

    const dotStyles = {
        connected: "bg-emerald-500",
        disconnected: "bg-gray-400",
        loading: "bg-blue-500",
        error: "bg-red-500",
    };

    const labels = {
        connected: "Active",
        disconnected: "Inactive",
        loading: "Checking...",
        error: "Error",
    };

    return (
        <div
            className={cn(
                "inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full text-xs font-medium border transition-colors",
                styles[status],
                className
            )}
        >
            <span className="relative flex h-2 w-2">
                {pulse && status === 'connected' && (
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                )}
                <span className={cn("relative inline-flex rounded-full h-2 w-2", dotStyles[status])}></span>
            </span>
            {status === 'loading' && <Loader2 className="h-3 w-3 animate-spin mr-1" />}
            {labels[status]}
        </div>
    );
}
