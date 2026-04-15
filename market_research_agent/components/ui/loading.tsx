"use client";

import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface DashboardLoadingProps {
  title?: string;
  className?: string;
}

export function DashboardLoading({ title = "Cargando...", className }: DashboardLoadingProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center min-h-[400px] gap-4", className)}>
      <Loader2 className="h-8 w-8 animate-spin text-teal-500" />
      <p className="text-sm text-slate-400 font-medium">{title}</p>
    </div>
  );
}

export function PageLoading() {
  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-sm text-slate-400">Cargando...</span>
      </div>
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-4 space-y-3 animate-pulse">
      <div className="h-4 w-1/3 bg-slate-800 rounded" />
      <div className="h-8 w-2/3 bg-slate-800 rounded" />
      <div className="h-3 w-full bg-slate-800 rounded" />
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-12 bg-slate-800/50 rounded animate-pulse" style={{ width: `${100 - (i * 5)}%` }} />
      ))}
    </div>
  );
}

export function FormSkeleton() {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="h-4 w-24 bg-slate-800 rounded animate-pulse" />
        <div className="h-10 w-full bg-slate-800 rounded animate-pulse" />
      </div>
      <div className="space-y-2">
        <div className="h-4 w-24 bg-slate-800 rounded animate-pulse" />
        <div className="h-10 w-full bg-slate-800 rounded animate-pulse" />
      </div>
    </div>
  );
}