import { getProjectBySlug } from "@/lib/data";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { ProjectGallery } from "@/components/portfolio/project-gallery";

export default async function ProjectPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const project = await getProjectBySlug(slug);

    if (!project) {
        notFound();
    }

    const coverUrl = project.coverImage ? project.coverImage.replace('/uploads/', '/api/serve/') : null;

    return (
        <article className="min-h-screen bg-slate-950 pb-24">
            {/* IMMERSIVE HERO SECTION */}
            <div className="relative w-full h-[65vh] min-h-[500px] flex items-end pb-16 pt-32 lg:pb-24">
                {/* Background Cover Image with Gradient fade */}
                {coverUrl ? (
                    <>
                        <div 
                            className="absolute inset-0 bg-cover bg-center" 
                            style={{ backgroundImage: `url(${coverUrl})` }} 
                        />
                        {/* Smooth fade to dark near the bottom */}
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/70 to-slate-900/30" />
                    </>
                ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-teal-950/40 to-slate-950" />
                )}

                {/* Hero Content */}
                <div className="relative z-10 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
                    <Link href="/portfolio">
                        <Button variant="ghost" className="mb-8 -ml-3 pl-2 text-slate-300 hover:text-white hover:bg-white/10 backdrop-blur-md rounded-full transition-all">
                            <ArrowLeft className="mr-2 h-4 w-4" /> Volver al Portafolio
                        </Button>
                    </Link>

                    <div className="flex items-center gap-5 mb-8">
                        {project.clientLogo && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img 
                                src={project.clientLogo.replace('/uploads/', '/api/serve/')} 
                                alt={`${project.client || 'Client'} logo`}
                                className="h-16 w-auto object-contain rounded-xl bg-white/10 backdrop-blur-md p-2.5 border border-white/10 shadow-xl"
                            />
                        )}
                        {project.client && (
                            <span className="inline-block rounded-full bg-teal-500/20 border border-teal-500/30 shadow-[0_0_15px_rgba(20,184,166,0.15)] px-4 py-1.5 text-xs font-bold text-teal-300 tracking-widest uppercase backdrop-blur-sm">
                                {project.client}
                            </span>
                        )}
                    </div>
                    
                    <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-white mb-6 drop-shadow-2xl">{project.title}</h1>
                    <p className="text-xl md:text-2xl text-slate-300 max-w-3xl leading-relaxed drop-shadow-lg font-light">{project.description}</p>
                </div>
            </div>

            {/* MAIN CONTENT AREA */}
            <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 mt-16">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
                    
                    {/* LEFT COLUMN: Metadata Sidebar (3 cols) */}
                    <div className="lg:col-span-3 space-y-8 sticky top-32">
                        <div className="rounded-2xl border border-slate-800/80 bg-slate-900/40 p-6 backdrop-blur-xl shadow-xl">
                            <h3 className="text-xs font-bold text-teal-500 uppercase tracking-widest mb-6 border-b border-slate-800 pb-4">Detalles del Proyecto</h3>
                            <dl className="space-y-6 text-sm">
                                <div>
                                    <dt className="text-slate-500 mb-1 font-medium">Cliente Oficial</dt>
                                    <dd className="font-semibold text-slate-200 text-base">{project.client || 'No especificado'}</dd>
                                </div>
                                <div>
                                    <dt className="text-slate-500 mb-1 font-medium">Categoría</dt>
                                    <dd className="font-semibold text-slate-300">
                                        {project.categoryId ? 'Joyería Fina' : 'Contenido Premium'}
                                    </dd>
                                </div>
                                {/* Future-proofing: add date or team members here easily */}
                            </dl>
                        </div>
                    </div>

                    {/* RIGHT COLUMN: Typography & Gallery (9 cols) */}
                    <div className="lg:col-span-9">
                        
                        {/* Rich Text Editor Content */}
                        <div className="rounded-3xl border border-slate-800/60 bg-slate-900/30 p-8 md:p-12 shadow-2xl backdrop-blur-sm mb-20">
                            {project.content ? (
                                <div 
                                    className="prose prose-invert prose-lg md:prose-xl max-w-none text-slate-300 prose-headings:font-bold prose-headings:text-white prose-a:text-teal-400 prose-strong:text-teal-50 prose-strong:font-bold leading-relaxed tracking-wide"
                                    dangerouslySetInnerHTML={{ __html: project.content }} 
                                />
                            ) : (
                                <div className="text-center py-12">
                                    <p className="italic text-slate-500">Detalles técnicos del caso de estudio próximamente...</p>
                                </div>
                            )}
                        </div>

                        {/* GALLERY SEPARATOR */}
                        {project.gallery && (project.gallery as any[]).length > 0 && (
                            <div className="mb-12 flex flex-col items-center">
                                <span className="text-teal-500 font-bold tracking-[0.2em] uppercase text-xs mb-3 block">Dirección de Arte</span>
                                <h2 className="text-3xl md:text-4xl font-bold text-white text-center">Galería Visual</h2>
                                <div className="w-16 h-1.5 bg-gradient-to-r from-teal-500 to-teal-900 mx-auto mt-6 rounded-full opacity-80" />
                            </div>
                        )}
                        
                        {/* INTERNAL GALLERY COMPONENT */}
                        <ProjectGallery gallery={project.gallery as any[]} />
                        
                    </div>
                </div>
            </div>
        </article>
    );
}
