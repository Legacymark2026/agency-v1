import { getProjects, getProjectCategories } from "@/actions/projects";
import Link from "next/link";
import { Plus, Filter, Search, FolderOpen } from "lucide-react";
import { ProjectList } from "@/components/cms/project-list";

interface SearchParams { search?: string; category?: string; status?: string; }

export default async function ProjectsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
    const params = await searchParams;
    const [projects, categories] = await Promise.all([
        getProjects({ search: params.search, categoryId: params.category, status: params.status }),
        getProjectCategories()
    ]);

    const published = projects.filter((p: any) => p.status === 'published').length;
    const drafts = projects.filter((p: any) => p.status === 'draft').length;
    const featured = projects.filter((p: any) => p.featured).length;

    const kpis = [
        { label: "Total Projects", value: projects.length, code: "TOT" },
        { label: "Published", value: published, code: "PUB" },
        { label: "Drafts", value: drafts, code: "DFT" },
        { label: "Featured", value: featured, code: "FTD" },
    ];

    return (
        <div className="ds-page space-y-8">
            {/* Grid overlay */}
            <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.025] pointer-events-none mix-blend-screen" />

            {/* Header */}
            <div className="relative z-10 flex items-start justify-between pb-8 gap-4"
                style={{ borderBottom: '1px solid rgba(30,41,59,0.8)' }}>
                <div>
                    <div className="mb-4">
                        <span className="ds-badge ds-badge-teal">CMS · PORTFOLIO PROJECTS</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="ds-icon-box w-11 h-11">
                            <FolderOpen className="w-5 h-5 text-teal-400" />
                        </div>
                        <div>
                            <h1 className="ds-heading-page">Portfolio Projects</h1>
                            <p className="ds-subtext mt-1">Showcase · Case Studies · Portafolio</p>
                        </div>
                    </div>
                </div>
                <Link href="/dashboard/projects/create"
                    className="flex items-center gap-2 px-4 py-2 font-mono text-[10px] font-bold uppercase tracking-widest text-white rounded-sm transition-all hover:-translate-y-0.5 shrink-0"
                    style={{ background: 'rgba(13,148,136,0.2)', border: '1px solid rgba(13,148,136,0.4)' }}>
                    <Plus size={12} /> New Project
                </Link>
            </div>

            {/* KPI Strip */}
            <div className="relative z-10 grid grid-cols-2 sm:grid-cols-4 gap-4">
                {kpis.map(k => (
                    <div key={k.code} className="ds-kpi group">
                        <span className="absolute top-3 right-3 font-mono text-[8px] text-slate-700 uppercase tracking-widest">[{k.code}]</span>
                        <div className="relative z-10">
                            <p className="ds-stat-value">{k.value}</p>
                            <p className="ds-stat-label">{k.label}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Filters */}
            <div className="relative z-10 ds-section">
                <form className="flex flex-wrap gap-4 items-end">
                    <div className="flex-1 min-w-[200px]">
                        <label className="ds-mono-label mb-2 block">Search</label>
                        <div className="relative">
                            <input type="text" name="search" defaultValue={params.search || ''}
                                placeholder="Buscar proyectos..."
                                className="w-full pl-8 pr-4 py-2 font-mono text-[11px] text-slate-200 rounded-sm transition-all focus:outline-none focus:border-teal-800/50"
                                style={{ background: 'rgba(15,23,42,0.5)', border: '1px solid rgba(30,41,59,0.8)' }} />
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-600" />
                        </div>
                    </div>
                    <div className="w-[180px]">
                        <label className="ds-mono-label mb-2 block">Category</label>
                        <select name="category" defaultValue={params.category || ''}
                            className="w-full px-3 py-2 font-mono text-[11px] text-slate-200 rounded-sm transition-all focus:outline-none focus:border-teal-800/50"
                            style={{ background: 'rgba(15,23,42,0.5)', border: '1px solid rgba(30,41,59,0.8)' }}>
                            <option value="">All Categories</option>
                            {categories.map((cat: any) => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                        </select>
                    </div>
                    <div className="w-[150px]">
                        <label className="ds-mono-label mb-2 block">Status</label>
                        <select name="status" defaultValue={params.status || ''}
                            className="w-full px-3 py-2 font-mono text-[11px] text-slate-200 rounded-sm transition-all focus:outline-none focus:border-teal-800/50"
                            style={{ background: 'rgba(15,23,42,0.5)', border: '1px solid rgba(30,41,59,0.8)' }}>
                            <option value="">All Status</option>
                            <option value="draft">Draft</option>
                            <option value="published">Published</option>
                            <option value="scheduled">Scheduled</option>
                            <option value="archived">Archived</option>
                        </select>
                    </div>
                    <button type="submit"
                        className="flex items-center gap-2 px-4 py-2 font-mono text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-teal-400 transition-all rounded-sm"
                        style={{ background: 'rgba(30,41,59,0.6)', border: '1px solid rgba(30,41,59,0.8)' }}>
                        <Filter size={12} /> Apply
                    </button>
                    {(params.search || params.category || params.status) && (
                        <Link href="/dashboard/projects"
                            className="px-4 py-2 font-mono text-[10px] text-slate-600 hover:text-slate-400 uppercase tracking-widest transition-all">
                            Clear
                        </Link>
                    )}
                </form>
            </div>

            {/* Project List */}
            <div className="relative z-10">
                <ProjectList projects={projects} categories={categories} />
            </div>
        </div>
    );
}
