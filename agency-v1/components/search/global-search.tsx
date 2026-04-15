'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Search, X, FileText, Briefcase, Wrench } from 'lucide-react';
import { globalSearch } from '@/actions/search';

interface SearchResult {
    type: 'blog' | 'project' | 'service';
    id: string;
    title: string;
    description: string;
    url: string;
    image?: string | null;
}

export function GlobalSearch() {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        const search = async () => {
            if (query.length < 2) {
                setResults([]);
                return;
            }

            setIsLoading(true);
            try {
                const data = await globalSearch(query);
                setResults(data);
            } catch (error) {
                console.error('Search error:', error);
            } finally {
                setIsLoading(false);
            }
        };

        const debounce = setTimeout(search, 300);
        return () => clearTimeout(debounce);
    }, [query]);

    const getIcon = (type: string) => {
        switch (type) {
            case 'blog':
                return <FileText className="h-4 w-4" />;
            case 'project':
                return <Briefcase className="h-4 w-4" />;
            case 'service':
                return <Wrench className="h-4 w-4" />;
            default:
                return <FileText className="h-4 w-4" />;
        }
    };

    const getTypeLabel = (type: string) => {
        switch (type) {
            case 'blog':
                return 'Blog';
            case 'project':
                return 'Proyecto';
            case 'service':
                return 'Servicio';
            default:
                return type;
        }
    };

    const groupedResults = results.reduce((acc, result) => {
        if (!acc[result.type]) {
            acc[result.type] = [];
        }
        acc[result.type].push(result);
        return acc;
    }, {} as Record<string, SearchResult[]>);

    return (
        <div ref={containerRef} className="relative w-full">
            <div className="relative">
                <input
                    ref={inputRef}
                    type="text"
                    placeholder="Buscar..."
                    value={query}
                    onChange={(e) => {
                        setQuery(e.target.value);
                        setIsOpen(true);
                    }}
                    onFocus={() => setIsOpen(true)}
                    className="h-10 w-full pl-10 pr-10 bg-slate-900/40 backdrop-blur-md border border-white/10 rounded-full text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/30 transition-all font-mono text-xs"
                />
                <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center pointer-events-none">
                    {isLoading ? (
                        <div className="h-4 w-4 border-2 border-slate-700 border-t-teal-500 rounded-full animate-spin" />
                    ) : (
                        <Search className="h-4 w-4 text-slate-500" />
                    )}
                </div>
                {query && (
                    <button
                        onClick={() => {
                            setQuery('');
                            setResults([]);
                            inputRef.current?.focus();
                        }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 cursor-pointer transition-colors"
                    >
                        <X className="h-4 w-4" />
                    </button>
                )}
            </div>

            {/* Dropdown Results */}
            {isOpen && query.length >= 2 && (
                <div className="absolute top-full mt-2 left-0 right-0 bg-slate-950/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/5 overflow-hidden z-50 max-h-[500px] overflow-y-auto">
                    {results.length === 0 && !isLoading ? (
                        <div className="p-8 text-center bg-slate-900/50">
                            <Search className="h-12 w-12 text-slate-800 mx-auto mb-3" />
                            <p className="text-slate-400 font-medium font-mono text-sm tracking-tighter uppercase">No intel found</p>
                            <p className="text-slate-600 text-xs mt-1">Try alternate parameters</p>
                        </div>
                    ) : (
                        <div className="py-2">
                            {Object.entries(groupedResults).map(([type, items]) => (
                                <div key={type} className="mb-2">
                                    <div className="px-4 py-2 text-[10px] font-bold text-teal-500/70 uppercase tracking-widest bg-white/5 flex items-center gap-2 font-mono">
                                        {getIcon(type)}
                                        {getTypeLabel(type)}
                                        <span className="ml-auto text-[9px] bg-teal-500/10 text-teal-400 px-2 py-0.5 rounded-full border border-teal-500/20">{items.length}</span>
                                    </div>
                                    <div className="py-1">
                                        {items.map((result) => (
                                            <Link
                                                key={`${result.type}-${result.id}`}
                                                href={result.url}
                                                onClick={() => {
                                                    setIsOpen(false);
                                                    setQuery('');
                                                }}
                                                className="flex items-start gap-3 px-4 py-3 hover:bg-white/5 transition-colors group"
                                            >
                                                {result.image ? (
                                                    <img
                                                        src={result.image}
                                                        alt={result.title}
                                                        className="w-10 h-10 rounded-lg object-cover flex-shrink-0 border border-white/10"
                                                    />
                                                ) : (
                                                    <div className="w-10 h-10 rounded-lg bg-slate-900 border border-white/5 flex items-center justify-center flex-shrink-0 text-slate-500 group-hover:text-teal-400 transition-colors">
                                                        {getIcon(result.type)}
                                                    </div>
                                                )}
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="font-medium text-slate-200 group-hover:text-teal-400 truncate transition-colors text-sm">
                                                        {result.title}
                                                    </h4>
                                                    <p className="text-xs text-slate-500 group-hover:text-slate-400 truncate transition-colors">
                                                        {result.description}
                                                    </p>
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {results.length > 0 && (
                        <div className="p-3 border-t border-white/5 bg-white/5">
                            <Link
                                href={`/buscar?q=${encodeURIComponent(query)}`}
                                onClick={() => {
                                    setIsOpen(false);
                                    setQuery('');
                                }}
                                className="block text-center text-[10px] font-bold text-teal-500 hover:text-teal-400 transition-colors uppercase tracking-widest font-mono"
                            >
                                ACCESS COMPLETE DATABASE →
                            </Link>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
