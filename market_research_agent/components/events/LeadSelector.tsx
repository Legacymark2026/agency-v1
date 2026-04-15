"use client";

import { useState, useEffect, useRef } from "react";
import { Search, User, X, Loader2 } from "lucide-react";
import { searchLeadsForEvent } from "@/actions/events/event-actions";

interface LeadSelectorProps {
    selectedLeadIds: string[];
    onChange: (leadIds: string[]) => void;
}

export function LeadSelector({ selectedLeadIds, onChange }: LeadSelectorProps) {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<any[]>([]);
    const [selectedLeads, setSelectedLeads] = useState<any[]>([]);
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

    // Initial fetch of already selected leads if needed (simulated by just storing them in state parent, but we might want names)
    // For this simple version, we assume parent just manages IDs and we only show newly selected names if we don't fetch them.
    // In a fully robust version, we'd fetch the names of the pre-selected `selectedLeadIds` on mount.

    useEffect(() => {
        const delayDebounceFn = setTimeout(async () => {
            if (query.trim().length >= 2) {
                setLoading(true);
                const res = await searchLeadsForEvent(query);
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

    const handleSelect = (lead: any) => {
        if (!selectedLeadIds.includes(lead.id)) {
            setSelectedLeads([...selectedLeads, lead]);
            onChange([...selectedLeadIds, lead.id]);
        }
        setQuery("");
        setIsOpen(false);
    };

    const handleRemove = (leadId: string) => {
        setSelectedLeads(selectedLeads.filter(l => l.id !== leadId));
        onChange(selectedLeadIds.filter(id => id !== leadId));
    };

    return (
        <div className="space-y-3" ref={wrapperRef}>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">Invitados (Leads CRM)</label>

            {/* Selected Pills */}
            {selectedLeadIds.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2">
                    {selectedLeadIds.map(id => {
                        const lead = selectedLeads.find(l => l.id === id);
                        return (
                            <div key={id} className="flex items-center gap-1.5 bg-teal-50 text-teal-700 px-3 py-1.5 rounded-lg text-xs font-bold border border-teal-100">
                                <User className="w-3.5 h-3.5" />
                                <span>{lead ? lead.name : "Lead Seleccionado"}</span>
                                <button type="button" onClick={() => handleRemove(id)} className="ml-1 hover:text-teal-900 focus:outline-none">
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Input */}
            <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    {loading ? <Loader2 className="w-4 h-4 text-slate-400 animate-spin" /> : <Search className="w-4 h-4 text-slate-400" />}
                </div>
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => { if (results.length > 0) setIsOpen(true); }}
                    className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all text-sm font-medium text-slate-900 placeholder-slate-400 shadow-sm"
                    placeholder="Buscar lead por nombre o email..."
                />

                {/* Dropdown */}
                {isOpen && results.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                        {results.map((lead) => (
                            <button
                                key={lead.id}
                                type="button"
                                onClick={() => handleSelect(lead)}
                                className="w-full text-left px-4 py-3 hover:bg-slate-50 border-b border-slate-100 last:border-0 flex flex-col transition-colors"
                            >
                                <span className="text-sm font-bold text-slate-800">{lead.name}</span>
                                {lead.email && <span className="text-xs text-slate-500">{lead.email}</span>}
                            </button>
                        ))}
                    </div>
                )}
                {isOpen && query.length >= 2 && results.length === 0 && !loading && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg p-4 text-center text-sm text-slate-500">
                        No se encontraron leads.
                    </div>
                )}
            </div>
        </div>
    );
}
