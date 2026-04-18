"use client";

import { useState, useEffect, useRef } from "react";
import { Search, Briefcase, X, Loader2 } from "lucide-react";
import { searchDealsForEvent } from "@/actions/events/event-actions";

interface DealSelectorProps {
    selectedDealId: string | null;
    onChange: (dealId: string | null) => void;
}

export function DealSelector({ selectedDealId, onChange }: DealSelectorProps) {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<any[]>([]);
    const [selectedDeal, setSelectedDeal] = useState<any | null>(null);
    const [loading, setLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Close dropdown when clicking outside
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        const delayDebounceFn = setTimeout(async () => {
            if (query.trim().length >= 2) {
                setLoading(true);
                const res = await searchDealsForEvent(query);
                if (res.success && res.data) {
                    setResults(res.data);
                    setIsOpen(true);
                }
                setLoading(false);
            } else {
                setResults([]);
                setIsOpen(false);
            }
        }, 300);

        return () => clearTimeout(delayDebounceFn);
    }, [query]);

    const handleSelect = (deal: any) => {
        setSelectedDeal(deal);
        onChange(deal.id);
        setQuery("");
        setIsOpen(false);
    };

    const handleRemove = () => {
        setSelectedDeal(null);
        onChange(null);
    };

    return (
        <div className="space-y-3" ref={wrapperRef}>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">Negocio (CRM Deal)</label>

            {/* Selected Pill */}
            {selectedDealId && (
                <div className="flex flex-wrap gap-2 mb-2">
                    <div className="flex items-center gap-1.5 bg-amber-50 text-amber-700 px-3 py-1.5 rounded-lg text-xs font-bold border border-amber-100">
                        <Briefcase className="w-3.5 h-3.5" />
                        <span>{selectedDeal ? selectedDeal.title : "Negocio Seleccionado"}</span>
                        <button type="button" onClick={handleRemove} className="ml-1 hover:text-amber-900 focus:outline-none">
                            <X className="w-3.5 h-3.5" />
                        </button>
                    </div>
                </div>
            )}

            {/* Input */}
            {!selectedDealId && (
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        {loading ? <Loader2 className="w-4 h-4 text-slate-400 animate-spin" /> : <Search className="w-4 h-4 text-slate-400" />}
                    </div>
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onFocus={() => { if (results.length > 0) setIsOpen(true); }}
                        className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all text-sm font-medium text-slate-900 placeholder-slate-400 shadow-sm"
                        placeholder="Buscar negocio por título..."
                    />

                    {/* Dropdown */}
                    {isOpen && results.length > 0 && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                            {results.map((deal) => (
                                <button
                                    key={deal.id}
                                    type="button"
                                    onClick={() => handleSelect(deal)}
                                    className="w-full text-left px-4 py-3 hover:bg-slate-50 border-b border-slate-100 last:border-0 flex flex-col transition-colors"
                                >
                                    <span className="text-sm font-bold text-slate-800">{deal.title}</span>
                                    <span className="text-xs text-slate-500">{deal.stage} - ${deal.value}</span>
                                </button>
                            ))}
                        </div>
                    )}
                    {isOpen && query.length >= 2 && results.length === 0 && !loading && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg p-4 text-center text-sm text-slate-500">
                            No se encontraron negocios.
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
