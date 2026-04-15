import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface StatusBadgeProps {
    status: 'connected' | 'disconnected' | 'loading' | 'error';
    className?: string;
    pulse?: boolean;
}

export function StatusBadge({ status, className, pulse = true }: StatusBadgeProps) {
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
