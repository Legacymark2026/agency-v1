"use client";

import { Input } from "@/components/ui/input";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useDebouncedCallback } from "use-debounce";

const EVENT_TYPES = [
    { value: "all", label: "Todos los eventos" },
    { value: "login", label: "Logins" },
    { value: "error", label: "Errores / Fallos" },
    { value: "role", label: "Cambios de Rol" },
    { value: "reset", label: "Resets y Revocaciones" },
];

export function LogsFilter() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const currentType = searchParams.get("type") || "all";

    const handleSearch = useDebouncedCallback((term: string) => {
        const params = new URLSearchParams(searchParams);
        params.set("page", "1");
        if (term) { params.set("search", term); } else { params.delete("search"); }
        router.replace(`?${params.toString()}`);
    }, 300);

    const handleTypeChange = (value: string) => {
        const params = new URLSearchParams(searchParams);
        params.set("page", "1");
        if (value && value !== "all") { params.set("type", value); } else { params.delete("type"); }
        router.replace(`?${params.toString()}`);
    };

    const handleClearAll = () => {
        router.replace("?");
    };

    const hasFilters = searchParams.get("search") || (searchParams.get("type") && searchParams.get("type") !== "all");

    return (
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-4 bg-slate-900/60 border border-slate-800 rounded-xl">
            {/* Search */}
            <div className="relative flex-1 min-w-0">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
                <Input
                    placeholder="Buscar por usuario, acción o IP..."
                    className="pl-9 bg-slate-950 border-slate-800 text-slate-200 placeholder-slate-600 h-9 text-sm focus:border-teal-500/50 transition-colors"
                    onChange={(e) => handleSearch(e.target.value)}
                    defaultValue={searchParams.get("search")?.toString()}
                />
            </div>

            {/* Filter chips */}
            <div className="flex items-center gap-2 flex-wrap">
                <SlidersHorizontal size={13} className="text-slate-500 flex-shrink-0" />
                {EVENT_TYPES.map(t => (
                    <button
                        key={t.value}
                        onClick={() => handleTypeChange(t.value)}
                        className={`text-xs font-mono px-3 py-1.5 rounded-full border transition-all ${
                            currentType === t.value
                                ? "bg-teal-500/15 text-teal-400 border-teal-500/30 shadow-[0_0_8px_rgba(20,184,166,0.15)]"
                                : "border-slate-800 text-slate-500 hover:text-slate-300 hover:border-slate-700"
                        }`}
                    >
                        {t.label}
                    </button>
                ))}
                {hasFilters && (
                    <button
                        onClick={handleClearAll}
                        className="text-xs font-mono px-2 py-1.5 rounded-full border border-red-500/20 text-red-400 hover:bg-red-500/10 transition-all flex items-center gap-1"
                    >
                        <X size={10} /> Limpiar
                    </button>
                )}
            </div>
        </div>
    );
}
