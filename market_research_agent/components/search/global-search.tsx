'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Search, X, FileText, Briefcase, Wrench } from 'lucide-react';
import { globalSearch } from '@/actions/search';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

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
        <div ref={containerRef} className="relative w-full max-w-md">
            <div className="relative">
                <Input
                    type="text"
                    placeholder="Buscar..."
                    value={query}
                    onChange={(e) => {
                        setQuery(e.target.value);
                        setIsOpen(true);
                    }}
                    onFocus={() => setIsOpen(true)}
                    className={cn(
                        "h-10 pl-10 pr-10 bg-white/90 backdrop-blur-sm border-gray-200/50 rounded-full text-gray-800 placeholder:text-gray-400",
                        "focus:ring-2 focus:ring-black/20 focus:border-black focus:bg-white transition-all"
                    )}
                />
                <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                    {isLoading ? (
                        <div className="h-4 w-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                    ) : (
                        <Search className="h-4 w-4 text-gray-400" />
                    )}
                </div>
                {query && (
                    <button
                        onClick={() => {
                            setQuery('');
                            setResults([]);
                        }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                        <X className="h-4 w-4" />
                    </button>
                )}
            </div>

            {/* Dropdown Results */}
            {isOpen && query.length >= 2 && (
                <div className="absolute top-full mt-2 left-0 right-0 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50 max-h-[500px] overflow-y-auto">
                    {results.length === 0 && !isLoading ? (
                        <div className="p-8 text-center">
                            <Search className="h-12 w-12 text-gray-200 mx-auto mb-3" />
                            <p className="text-gray-500 font-medium">No se encontraron resultados</p>
                            <p className="text-gray-400 text-sm">Intenta con otras palabras</p>
                        </div>
                    ) : (
                        <div className="py-2">
                            {Object.entries(groupedResults).map(([type, items]) => (
                                <div key={type} className="mb-2">
                                    <div className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider bg-gray-50/50 flex items-center gap-2">
                                        {getIcon(type)}
                                        {getTypeLabel(type)}
                                        <span className="ml-auto text-xs bg-gray-200/50 px-2 py-0.5 rounded-full">{items.length}</span>
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
                                                className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors group"
                                            >
                                                {result.image ? (
                                                    <img
                                                        src={result.image}
                                                        alt={result.title}
                                                        className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                                                    />
                                                ) : (
                                                    <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0 text-gray-400">
                                                        {getIcon(result.type)}
                                                    </div>
                                                )}
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="font-medium text-gray-900 group-hover:text-black truncate">
                                                        {result.title}
                                                    </h4>
                                                    <p className="text-sm text-gray-500 truncate">
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
                        <div className="p-3 border-t border-gray-100 bg-gray-50/50">
                            <Link
                                href={`/buscar?q=${encodeURIComponent(query)}`}
                                onClick={() => {
                                    setIsOpen(false);
                                    setQuery('');
                                }}
                                className="block text-center text-sm font-medium text-black hover:text-gray-600 transition-colors"
                            >
                                Ver todos los resultados →
                            </Link>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
