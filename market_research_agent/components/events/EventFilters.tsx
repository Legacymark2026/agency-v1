"use client";

import { Search } from "lucide-react";

interface EventFiltersProps {
    filters: any;
    onChange: (filters: any) => void;
}

export function EventFilters({ filters, onChange }: EventFiltersProps) {
    return (
        <div className="flex items-center gap-4">
            {/* Search Input */}
            <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                    type="text"
                    placeholder="Buscar eventos..."
                    value={filters.query || ''}
                    onChange={(e) => onChange({ ...filters, query: e.target.value })}
                    className="pl-9 pr-4 py-2 w-64 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium text-slate-700 placeholder:text-slate-400"
                />
            </div>

            <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl border border-slate-200 overflow-hidden">
                <button
                    onClick={() => onChange({ ...filters, type: 'ALL' })}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${filters.type === 'ALL' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    Todos
                </button>
                <button
                    onClick={() => onChange({ ...filters, type: 'ONLINE' })}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${filters.type === 'ONLINE' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-blue-500'}`}
                >
                    Online
                </button>
                <button
                    onClick={() => onChange({ ...filters, type: 'PHYSICAL' })}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${filters.type === 'PHYSICAL' ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-500 hover:text-orange-500'}`}
                >
                    Presencial
                </button>
                <button
                    onClick={() => onChange({ ...filters, type: 'HYBRID' })}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${filters.type === 'HYBRID' ? 'bg-white text-purple-600 shadow-sm' : 'text-slate-500 hover:text-purple-500'}`}
                >
                    Híbrido
                </button>
            </div>
        </div>
    );
}
