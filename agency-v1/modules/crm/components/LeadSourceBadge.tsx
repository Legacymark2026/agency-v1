"use client"

import { Badge } from "@/components/ui/badge"
import { getSourceDisplayInfo, type LeadSource } from "@/lib/lead-source-detector"

interface LeadSourceBadgeProps {
    source: LeadSource | string;
    showLabel?: boolean;
    size?: 'sm' | 'md' | 'lg';
}

/**
 * Visual badge showing lead/deal source with icon and color
 */
export function LeadSourceBadge({ source, showLabel = true, size = 'md' }: LeadSourceBadgeProps) {
    const info = getSourceDisplayInfo(source as LeadSource);

    const sizeClasses = {
        sm: 'text-[9px] px-1.5 py-0.5',
        md: 'text-[10px] px-2 py-1',
        lg: 'text-xs px-2.5 py-1.5'
    };

    return (
        <Badge
            variant="outline"
            className={`${sizeClasses[size]} font-medium inline-flex items-center gap-1`}
            style={{
                backgroundColor: `${info.color}15`,
                borderColor: `${info.color}40`,
                color: info.color.replace('bg-', ''),
            }}
        >
            <span>{info.icon}</span>
            {showLabel && <span>{info.label}</span>}
        </Badge>
    );
}

/**
 * Compact source indicator (just icon)
 */
export function SourceIcon({ source }: { source: LeadSource | string }) {
    const info = getSourceDisplayInfo(source as LeadSource);
    return (
        <span
            className="inline-flex items-center justify-center w-5 h-5 rounded-full text-xs"
            style={{ backgroundColor: `${info.color}20` }}
            title={info.label}
        >
            {info.icon}
        </span>
    );
}

/**
 * Source statistics mini bar
 */
export function SourceStatsBar({ sources }: { sources: { source: string; count: number }[] }) {
    const total = sources.reduce((sum, s) => sum + s.count, 0);
    if (total === 0) return null;

    return (
        <div className="flex h-2 rounded-full overflow-hidden bg-gray-100">
            {sources.map((s, i) => {
                const info = getSourceDisplayInfo(s.source as LeadSource);
                const width = (s.count / total) * 100;

                return (
                    <div
                        key={s.source}
                        className={`${info.color} transition-all`}
                        style={{ width: `${width}%` }}
                        title={`${info.label}: ${s.count} (${width.toFixed(1)}%)`}
                    />
                );
            })}
        </div>
    );
}
