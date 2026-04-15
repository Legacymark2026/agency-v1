'use client';

import { useState, useEffect, useCallback, FormEvent } from 'react';
import { Search, X, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { searchPosts } from '@/actions/blog';
import Link from 'next/link';

interface SearchResult {
    id: string;
    title: string;
    slug: string;
    excerpt?: string | null;
    coverImage?: string | null;
    author?: { name: string | null } | null;
}

interface BlogSearchProps {
    placeholder?: string;
}

export function BlogSearch({ placeholder = "Buscar artículos..." }: BlogSearchProps) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(-1);

    // Debounced search
    useEffect(() => {
        if (!query.trim()) {
            const timer = setTimeout(() => {
                setResults([]);
                setIsOpen(false);
            }, 0);
            return () => clearTimeout(timer);
        }

        const timer = setTimeout(async () => {
            setIsLoading(true);
            const { posts } = await searchPosts(query, 1, 5);
            setResults(posts);
            setIsLoading(false);
            setIsOpen(true);
        }, 300);

        return () => clearTimeout(timer);
    }, [query]);

    // Keyboard navigation
    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (!isOpen) return;

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setSelectedIndex(prev => Math.min(prev + 1, results.length - 1));
                break;
            case 'ArrowUp':
                e.preventDefault();
                setSelectedIndex(prev => Math.max(prev - 1, -1));
                break;
            case 'Enter':
                e.preventDefault();
                if (selectedIndex >= 0 && results[selectedIndex]) {
                    window.location.href = `/blog/${results[selectedIndex].slug}`;
                }
                break;
            case 'Escape':
                setIsOpen(false);
                setQuery('');
                break;
        }
    }, [isOpen, selectedIndex, results]);

    const handleClear = () => {
        setQuery('');
        setResults([]);
        setIsOpen(false);
    };

    return (
        <div className="relative w-full max-w-xl">
            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                    type="search"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onFocus={() => query && setIsOpen(true)}
                    placeholder={placeholder}
                    className="w-full pl-12 pr-12 h-12 rounded-xl text-base border-gray-200 focus:border-gray-400 focus:ring-gray-400"
                />
                {query && (
                    <button
                        onClick={handleClear}
                        className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-gray-100"
                    >
                        {isLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                        ) : (
                            <X className="h-4 w-4 text-gray-400" />
                        )}
                    </button>
                )}
            </div>

            {/* Results Dropdown */}
            {isOpen && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden z-50">
                    {results.length > 0 ? (
                        <ul className="divide-y divide-gray-100">
                            {results.map((post, index) => (
                                <li key={post.id}>
                                    <Link
                                        href={`/blog/${post.slug}`}
                                        className={`block p-4 hover:bg-gray-50 transition-colors ${index === selectedIndex ? 'bg-gray-50' : ''
                                            }`}
                                        onClick={() => setIsOpen(false)}
                                    >
                                        <div className="flex gap-4">
                                            {post.coverImage && (
                                                <div
                                                    className="w-16 h-12 rounded-lg bg-cover bg-center flex-shrink-0"
                                                    style={{ backgroundImage: `url(${post.coverImage})` }}
                                                />
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-medium text-gray-900 truncate">
                                                    {post.title}
                                                </h4>
                                                {post.excerpt && (
                                                    <p className="text-sm text-gray-500 line-clamp-1 mt-1">
                                                        {post.excerpt}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <div className="p-6 text-center text-gray-500">
                            <p>No se encontraron resultados para "{query}"</p>
                        </div>
                    )}

                    {/* Footer */}
                    <div className="p-3 bg-gray-50 border-t border-gray-100 text-center">
                        <Link
                            href={`/blog?q=${encodeURIComponent(query)}`}
                            className="text-sm font-medium text-gray-600 hover:text-gray-900"
                            onClick={() => setIsOpen(false)}
                        >
                            Ver todos los resultados →
                        </Link>
                    </div>
                </div>
            )}

            {/* Overlay to close on click outside */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsOpen(false)}
                />
            )}
        </div>
    );
}

// ==================== SEARCH BAR MODAL ====================

interface SearchModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function SearchModal({ isOpen, onClose }: SearchModalProps) {
    useEffect(() => {
        // Keyboard shortcut Cmd/Ctrl + K
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                // Toggle or open - parent should handle this
            }
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh] bg-black/60 backdrop-blur-sm">
            <div className="w-full max-w-2xl mx-4 animate-in fade-in zoom-in-95 duration-200">
                <BlogSearch placeholder="Buscar artículos, categorías, tags..." />
                <p className="mt-3 text-center text-sm text-gray-400">
                    Presiona <kbd className="px-2 py-1 bg-gray-700 rounded text-xs">ESC</kbd> para cerrar
                </p>
            </div>
            <div
                className="fixed inset-0 -z-10"
                onClick={onClose}
            />
        </div>
    );
}
