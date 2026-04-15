"use client";

import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface CRMEmptyStateProps {
    title: string;
    description: string;
    actionLabel: string;
    onAction?: () => void;
}

export function CRMEmptyState({ title, description, actionLabel, onAction }: CRMEmptyStateProps) {
    return (
        <div className="flex min-h-[300px] flex-col items-center justify-center rounded-md border border-dashed p-8 text-center animate-in fade-in-50">
            <div className="mx-auto flex max-w-[420px] flex-col items-center justify-center text-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
                    <Plus className="h-10 w-10 text-muted-foreground" />
                </div>
                <h3 className="mt-4 text-lg font-semibold">{title}</h3>
                <p className="mb-4 mt-2 text-sm text-muted-foreground">
                    {description}
                </p>
                <Button size="sm" onClick={onAction}>
                    {actionLabel}
                </Button>
            </div>
        </div>
    );
}
