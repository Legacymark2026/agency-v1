"use client";

import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Search, Grid, List, Eye, Star, ChevronLeft, ChevronRight, Filter } from "lucide-react";

interface Project {
    id: string;
    title: string;
    slug: string;
    client?: string | null;
    description: string;
    coverImage?: string | null;
    featured?: boolean;
    category?: {
        id: string;
        name: string;
        slug: string;
        color?: string | null;
    } | null;
    tags?: { name: string }[];
    _count?: { views: number };
}

interface Category {
    id: string;
    name: string;
    slug: string;
    color?: string | null;
}

interface PortfolioListProps {
    projects: Project[];
    categories: Category[];
}

const ITEMS_PER_PAGE = 9;

export function PortfolioList({ projects, categories }: PortfolioListProps) {
    const [search, setSearch] = useState("");
    const [activeCategory, setActiveCategory] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
    const [currentPage, setCurrentPage] = useState(1);

    // Filter projects
    const filteredProjects = projects.filter(project => {
        const matchesSearch = search === "" ||
            project.title.toLowerCase().includes(search.toLowerCase()) ||
            project.client?.toLowerCase().includes(search.toLowerCase()) ||
            project.description.toLowerCase().includes(search.toLowerCase()) ||
            project.tags?.some(t => t.name.toLowerCase().includes(search.toLowerCase()));

        const matchesCategory = !activeCategory || project.category?.id === activeCategory;

        return matchesSearch && matchesCategory;
    });

    // Pagination
    const totalPages = Math.ceil(filteredProjects.length / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const paginatedProjects = filteredProjects.slice(startIndex, startIndex + ITEMS_PER_PAGE);

    // Reset to page 1 when filters change
    useEffect(() => {
        const timer = setTimeout(() => setCurrentPage(1), 0);
        return () => clearTimeout(timer);
    }, [search, activeCategory]);

    return (
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {/* Header */}
            <div className="mb-12 text-center">
                <h1 className="text-4xl font-bold tracking-tight text-white mb-4">Nuestro Portfolio</h1>
                <p className="text-xl text-slate-400 max-w-2xl mx-auto">
                    Casos de éxito que demuestran el poder de la transformación digital y la creatividad estratégica.
                </p>
            </div>

            {/* Filters Bar */}
            <div className="mb-8 bg-slate-900 p-4 rounded-2xl shadow-sm border border-slate-800">
                <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                    {/* Search */}
                    <div className="relative w-full md:w-80">
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Buscar proyectos..."
                            className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-black focus:bg-slate-900 transition-all"
                        />
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                    </div>

                    {/* View Mode Toggle */}
                    <div className="flex items-center gap-2 bg-slate-900/50 p-1 rounded-lg">
                        <button
                            onClick={() => setViewMode("grid")}
                            className={`p-2 rounded-md transition-all ${viewMode === "grid" ? "bg-slate-900 shadow-sm text-white" : "text-slate-400 hover:text-white"}`}
                            aria-label="Grid view"
                        >
                            <Grid className="h-5 w-5" />
                        </button>
                        <button
                            onClick={() => setViewMode("list")}
                            className={`p-2 rounded-md transition-all ${viewMode === "list" ? "bg-slate-900 shadow-sm text-white" : "text-slate-400 hover:text-white"}`}
                            aria-label="List view"
                        >
                            <List className="h-5 w-5" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Category Filters */}
            <div className="mb-8 flex flex-wrap justify-center gap-2">
                <button
                    onClick={() => setActiveCategory(null)}
                    className={`rounded-full px-6 py-2.5 text-sm font-medium transition-all ${!activeCategory
                        ? "bg-teal-500 text-white shadow-lg"
                        : "bg-slate-900/50 text-slate-400 hover:bg-gray-200 hover:text-white"
                        }`}
                >
                    Todos
                </button>
                {categories.map((cat) => (
                    <button
                        key={cat.id}
                        onClick={() => setActiveCategory(cat.id)}
                        className={`rounded-full px-6 py-2.5 text-sm font-medium transition-all ${activeCategory === cat.id
                            ? "bg-teal-500 text-white shadow-lg"
                            : "bg-slate-900/50 text-slate-400 hover:bg-gray-200 hover:text-white"
                            }`}
                        style={activeCategory === cat.id && cat.color ? { backgroundColor: cat.color } : {}}
                    >
                        {cat.name}
                    </button>
                ))}
            </div>

            {/* Results count */}
            <div className="mb-6 text-sm text-slate-400 text-center">
                {filteredProjects.length} proyecto{filteredProjects.length !== 1 ? 's' : ''} encontrado{filteredProjects.length !== 1 ? 's' : ''}
            </div>

            {/* Projects Grid */}
            {viewMode === "grid" ? (
                <motion.div
                    layout
                    className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3"
                >
                    {paginatedProjects.map((project, index) => (
                        <motion.div
                            layout
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 20 }}
                            transition={{ duration: 0.3, delay: index * 0.05 }}
                            key={project.id}
                            className="group relative overflow-hidden rounded-2xl bg-slate-900/50 cursor-pointer aspect-[4/3] shadow-sm hover:shadow-xl transition-all duration-500"
                        >
                            <Link href={`/portfolio/${project.slug}`} className="block h-full w-full">
                                <div
                                    className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
                                    style={{ backgroundImage: `url(${project.coverImage || 'https://images.unsplash.com/photo-1497215728101-856f4ea42174?q=80&w=2070&auto=format&fit=crop'})` }}
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent opacity-80 group-hover:opacity-70 transition-opacity duration-500" />

                                {/* Featured badge */}
                                {project.featured && (
                                    <div className="absolute top-4 left-4">
                                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-yellow-400 text-yellow-900 rounded-full text-xs font-semibold">
                                            <Star className="h-3 w-3 fill-current" />
                                            Destacado
                                        </span>
                                    </div>
                                )}

                                {/* Views badge */}
                                {project._count?.views ? (
                                    <div className="absolute top-4 right-4">
                                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-slate-900/20 backdrop-blur-sm text-white rounded-full text-xs">
                                            <Eye className="h-3 w-3" />
                                            {project._count.views}
                                        </span>
                                    </div>
                                ) : null}

                                <div className="absolute bottom-0 left-0 p-6 w-full">
                                    <div className="flex flex-col gap-2">
                                        {project.category && (
                                            <span
                                                className="inline-block self-start rounded-full px-3 py-1 text-xs font-semibold"
                                                style={{
                                                    backgroundColor: project.category.color ? `${project.category.color}40` : 'rgba(59, 130, 246, 0.3)',
                                                    color: project.category.color || '#3b82f6'
                                                }}
                                            >
                                                {project.category.name}
                                            </span>
                                        )}
                                        <h3 className="text-xl font-bold text-white group-hover:text-blue-200 transition-colors">{project.title}</h3>
                                        <p className="text-sm text-slate-500 line-clamp-2">{project.description}</p>
                                        {project.client && (
                                            <p className="text-xs text-slate-400 font-mono">Cliente: {project.client}</p>
                                        )}
                                    </div>
                                </div>
                            </Link>
                        </motion.div>
                    ))}
                </motion.div>
            ) : (
                /* List View */
                <div className="space-y-4">
                    {paginatedProjects.map((project, index) => (
                        <motion.div
                            key={project.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.3, delay: index * 0.05 }}
                        >
                            <Link
                                href={`/portfolio/${project.slug}`}
                                className="flex gap-6 bg-slate-900 p-4 rounded-xl border border-slate-800 hover:border-teal-500/50 hover:shadow-md transition-all group"
                            >
                                {/* Thumbnail */}
                                <div
                                    className="w-48 h-32 bg-slate-900/50 rounded-lg bg-cover bg-center flex-shrink-0 group-hover:scale-105 transition-transform duration-500"
                                    style={{ backgroundImage: `url(${project.coverImage || 'https://images.unsplash.com/photo-1497215728101-856f4ea42174?q=80&w=2070&auto=format&fit=crop'})` }}
                                />

                                {/* Content */}
                                <div className="flex-1 flex flex-col justify-center">
                                    <div className="flex items-center gap-3 mb-2">
                                        {project.featured && (
                                            <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                                        )}
                                        {project.category && (
                                            <span
                                                className="px-2 py-0.5 text-xs rounded-full"
                                                style={{
                                                    backgroundColor: project.category.color ? `${project.category.color}20` : '#f3f4f6',
                                                    color: project.category.color || '#6b7280'
                                                }}
                                            >
                                                {project.category.name}
                                            </span>
                                        )}
                                    </div>
                                    <h3 className="text-lg font-bold text-slate-100 group-hover:text-blue-600 transition-colors">{project.title}</h3>
                                    <p className="text-sm text-slate-400 line-clamp-2 mt-1">{project.description}</p>
                                    <div className="flex items-center gap-4 mt-3 text-xs text-slate-400">
                                        {project.client && <span>Cliente: {project.client}</span>}
                                        {project._count?.views ? (
                                            <span className="flex items-center gap-1">
                                                <Eye className="h-3 w-3" />
                                                {project._count.views} vistas
                                            </span>
                                        ) : null}
                                    </div>
                                </div>
                            </Link>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Empty State */}
            {filteredProjects.length === 0 && (
                <div className="text-center py-16">
                    <div className="w-20 h-20 bg-slate-900/50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Filter className="h-10 w-10 text-slate-500" />
                    </div>
                    <p className="text-slate-400 text-lg">No se encontraron proyectos</p>
                    <p className="text-slate-400 text-sm mt-1">Intenta con otros filtros de búsqueda</p>
                    <button
                        onClick={() => {
                            setSearch("");
                            setActiveCategory(null);
                        }}
                        className="mt-4 text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                        Limpiar filtros
                    </button>
                </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="mt-12 flex items-center justify-center gap-2">
                    <button
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="p-2 rounded-lg border border-slate-700 hover:bg-slate-950 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <ChevronLeft className="h-5 w-5" />
                    </button>

                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                        <button
                            key={page}
                            onClick={() => setCurrentPage(page)}
                            className={`w-10 h-10 rounded-lg font-medium transition-all ${currentPage === page
                                ? "bg-teal-500 text-white"
                                : "border border-slate-700 hover:bg-slate-950"
                                }`}
                        >
                            {page}
                        </button>
                    ))}

                    <button
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="p-2 rounded-lg border border-slate-700 hover:bg-slate-950 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <ChevronRight className="h-5 w-5" />
                    </button>
                </div>
            )}
        </div>
    );
}
