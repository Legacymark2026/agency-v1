'use client';

import Link from 'next/link';
import { Tag, FolderOpen, X } from 'lucide-react';

interface Category {
    id: string;
    name: string;
    slug: string;
    _count?: { posts: number };
}

interface Tag {
    name: string;
    _count?: { posts: number };
}

interface BlogFiltersProps {
    categories: Category[];
    tags: Tag[];
    selectedCategory?: string;
    selectedTag?: string;
    baseUrl?: string;
}

export function BlogFilters({
    categories,
    tags,
    selectedCategory,
    selectedTag,
    baseUrl = '/blog'
}: BlogFiltersProps) {
    const hasActiveFilter = selectedCategory || selectedTag;

    return (
        <div className="space-y-6">
            {/* Active Filter Badge + Clear */}
            {hasActiveFilter && (
                <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm text-gray-500">Filtrando por:</span>
                    {selectedCategory && (
                        <Link
                            href={baseUrl}
                            className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium hover:bg-blue-200 transition-colors"
                        >
                            <FolderOpen className="h-3 w-3" />
                            {categories.find(c => c.slug === selectedCategory)?.name || selectedCategory}
                            <X className="h-3 w-3" />
                        </Link>
                    )}
                    {selectedTag && (
                        <Link
                            href={baseUrl}
                            className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium hover:bg-green-200 transition-colors"
                        >
                            <Tag className="h-3 w-3" />
                            #{selectedTag}
                            <X className="h-3 w-3" />
                        </Link>
                    )}
                </div>
            )}

            {/* Categories */}
            {categories.length > 0 && (
                <div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <FolderOpen className="h-4 w-4" />
                        Categorías
                    </h3>
                    <div className="flex flex-wrap gap-2">
                        {categories.map((category) => (
                            <Link
                                key={category.id}
                                href={`${baseUrl}?category=${category.slug}`}
                                className={`
                                    inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-all
                                    ${selectedCategory === category.slug
                                        ? 'bg-gray-900 text-white'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }
                                `}
                            >
                                {category.name}
                                {category._count && (
                                    <span className={`text-xs ${selectedCategory === category.slug ? 'text-gray-300' : 'text-gray-500'}`}>
                                        ({category._count.posts})
                                    </span>
                                )}
                            </Link>
                        ))}
                    </div>
                </div>
            )}

            {/* Tags */}
            {tags.length > 0 && (
                <div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <Tag className="h-4 w-4" />
                        Etiquetas populares
                    </h3>
                    <div className="flex flex-wrap gap-2">
                        {tags.slice(0, 15).map((tag) => (
                            <Link
                                key={tag.name}
                                href={`${baseUrl}?tag=${encodeURIComponent(tag.name)}`}
                                className={`
                                    inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm transition-all
                                    ${selectedTag === tag.name
                                        ? 'bg-green-600 text-white'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }
                                `}
                            >
                                #{tag.name}
                                {tag._count && (
                                    <span className={`text-xs ${selectedTag === tag.name ? 'text-green-200' : 'text-gray-400'}`}>
                                        {tag._count.posts}
                                    </span>
                                )}
                            </Link>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

// ==================== COMPACT SIDEBAR VERSION ====================

export function BlogFiltersSidebar({
    categories,
    tags,
    selectedCategory,
    selectedTag,
    baseUrl = '/blog'
}: BlogFiltersProps) {
    return (
        <aside className="space-y-6">
            {/* Categories */}
            {categories.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                    <h3 className="text-sm font-bold text-gray-900 mb-4 uppercase tracking-wider">
                        Categorías
                    </h3>
                    <ul className="space-y-2">
                        {categories.map((category) => (
                            <li key={category.id}>
                                <Link
                                    href={`${baseUrl}?category=${category.slug}`}
                                    className={`
                                        flex items-center justify-between py-2 px-3 rounded-lg text-sm transition-all
                                        ${selectedCategory === category.slug
                                            ? 'bg-gray-900 text-white'
                                            : 'text-gray-700 hover:bg-gray-100'
                                        }
                                    `}
                                >
                                    <span>{category.name}</span>
                                    {category._count && (
                                        <span className={`text-xs font-medium ${selectedCategory === category.slug ? 'text-gray-400' : 'text-gray-400'}`}>
                                            {category._count.posts}
                                        </span>
                                    )}
                                </Link>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Tags Cloud */}
            {tags.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                    <h3 className="text-sm font-bold text-gray-900 mb-4 uppercase tracking-wider">
                        Etiquetas
                    </h3>
                    <div className="flex flex-wrap gap-2">
                        {tags.slice(0, 20).map((tag) => (
                            <Link
                                key={tag.name}
                                href={`${baseUrl}?tag=${encodeURIComponent(tag.name)}`}
                                className={`
                                    px-2 py-1 text-xs rounded transition-all
                                    ${selectedTag === tag.name
                                        ? 'bg-gray-900 text-white'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }
                                `}
                            >
                                #{tag.name}
                            </Link>
                        ))}
                    </div>
                </div>
            )}
        </aside>
    );
}
