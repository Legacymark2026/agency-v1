'use client';

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { MessageSquareDashed, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface EmptyStateProps {
    title: string;
    description?: string;
    icon?: ReactNode;
    action?: ReactNode;
    code?: string;
    variant?: 'default' | 'inbox' | 'crm';
    className?: string;
    // For CRM variant backward compatibility
    actionLabel?: string;
    onAction?: () => void;
}

export function EmptyState({
    title,
    description,
    icon,
    action,
    code,
    variant = 'default',
    className,
    actionLabel,
    onAction
}: EmptyStateProps) {
    if (variant === 'inbox') {
        return (
            <div className={cn("flex flex-col items-center justify-center h-full text-center p-8 bg-transparent", className)}>
                <div className="w-[72px] h-[72px] rounded-full bg-slate-800/60 border border-slate-800/90 flex items-center justify-center mb-5">
                    {icon || <MessageSquareDashed size={32} className="text-slate-900" />}
                </div>
                <h3 className="text-base font-extrabold text-slate-700 mb-2 font-mono">{title}</h3>
                <p className="text-xs text-slate-900 max-w-[280px] leading-relaxed font-mono">
                    {description}
                </p>
                {action}
            </div>
        );
    }

    if (variant === 'crm') {
        return (
            <div className={cn("flex min-h-[300px] flex-col items-center justify-center rounded-md border border-dashed p-8 text-center animate-in fade-in-50", className)}>
                <div className="mx-auto flex max-w-[420px] flex-col items-center justify-center text-center">
                    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
                        {icon || <Plus className="h-10 w-10 text-muted-foreground" />}
                    </div>
                    <h3 className="mt-4 text-lg font-semibold">{title}</h3>
                    <p className="mb-4 mt-2 text-sm text-muted-foreground">
                        {description}
                    </p>
                    {action || (actionLabel && (
                        <Button size="sm" onClick={onAction}>
                            {actionLabel}
                        </Button>
                    ))}
                </div>
            </div>
        );
    }

    // Default variant (Dashboard style)
    return (
        <div className={cn("flex flex-col items-center justify-center text-center py-20 space-y-4", className)}>
            {icon && <div className="opacity-20 text-5xl">{icon}</div>}
            {code && <p className="ds-code-tag">&gt; [{code}]</p>}
            <p className="ds-heading-section">{title}</p>
            {description && <p className="text-sm text-slate-500 font-mono max-w-sm uppercase tracking-wider">{description}</p>}
            {action}
        </div>
    );
}
