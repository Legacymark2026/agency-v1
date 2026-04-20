'use client';

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { createProject, updateProject, getProjectCategories, getProjectTags, createProjectCategory, updateProjectCategory, deleteProjectCategory } from "@/actions/projects";
import { ProjectSchema, type ProjectFormData } from "@/lib/schemas";
import { Loader2, Eye, Save, Send, Calendar, ExternalLink, Globe, Lock, FileText, Image as ImageIcon, Copy, Layers, Tag, Code, Video } from "lucide-react";
import { RichTextEditor } from "./rich-text-editor";
import { ImageUploadPreview } from "./image-upload-preview";
import { CharacterCounter } from "./character-counter";
import { ProjectCategorySelector } from "./project-category-selector";
import { ProjectTagInput } from "./project-tag-input";
import { GalleryManager } from "./gallery-manager";
import { TechStackSelector } from "./tech-stack-selector";
import { TeamMemberInput } from "./team-member-input";
import { SocialPreview } from "./social-preview";
import { RelatedProjectSelector } from "./related-project-selector";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";

interface Category {
    id: string;
    name: string;
    slug: string;
    color?: string | null;
}

interface ProjectFormProps {
    project?: {
        id: string;
        title: string;
        slug: string;
        description: string;
        content: string | null;
        client: string | null;
        coverImage: string | null;
        imageAlt: string | null;
        gallery: any;
        published: boolean;
        metaTitle: string | null;
        metaDescription: string | null;
        focusKeyword: string | null;
        status: string;
        scheduledDate: Date | null;
        featured: boolean;
        displayOrder: number;
        startDate: Date | null;
        endDate: Date | null;
        testimonial: string | null;
        results: any;
        projectUrl: string | null;
        categoryId: string | null;
        tags?: { name: string }[];
        // New Fields
        techStack?: any;
        team?: any;
        videoUrl?: string | null;
        private?: boolean;
        pdfUrl?: string | null;
        seoScore?: number;
        clientLogo?: string | null;
        isTemplate?: boolean;
        relatedProjects?: { id: string }[];
    };
}

export function ProjectForm({ project }: ProjectFormProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [categories, setCategories] = useState<Category[]>([]);
    const [tagSuggestions, setTagSuggestions] = useState<string[]>([]);

    // Calculate SEO/Completion Score
    const calculateScore = (data: ProjectFormData) => {
        let score = 0;
        if (data.title) score += 10;
        if (data.description) score += 10;
        if (data.content && data.content.length > 100) score += 10;
        if (data.coverImage) score += 10;
        if (data.metaTitle) score += 10;
        if (data.metaDescription) score += 10;
        if (data.focusKeyword) score += 10;
        if (data.gallery && data.gallery.length > 0) score += 10;
        if (data.techStack && data.techStack.length > 0) score += 10;
        if (data.results && data.results.length > 0) score += 10;
        return Math.min(score, 100);
    };

    const form = useForm<ProjectFormData>({
        resolver: zodResolver(ProjectSchema) as any,
        defaultValues: {
            title: project?.title || "",
            slug: project?.slug || "",
            description: project?.description || "",
            content: project?.content || "",
            client: project?.client || "",
            coverImage: project?.coverImage || "",
            imageAlt: project?.imageAlt || "",
            gallery: project?.gallery || [],
            metaTitle: project?.metaTitle || "",
            metaDescription: project?.metaDescription || "",
            focusKeyword: project?.focusKeyword || "",
            status: (project?.status as any) || "draft",
            scheduledDate: project?.scheduledDate?.toISOString().split('T')[0] || "",
            published: project?.published ?? false,
            featured: project?.featured ?? false,
            displayOrder: project?.displayOrder || 0,
            startDate: project?.startDate?.toISOString().split('T')[0] || "",
            endDate: project?.endDate?.toISOString().split('T')[0] || "",
            testimonial: project?.testimonial || "",
            results: project?.results || [],
            projectUrl: project?.projectUrl || "",
            categoryId: project?.categoryId || "",
            tagNames: project?.tags?.map(t => t.name) || [],
            // New Fields
            techStack: (project?.techStack as string[]) || [],
            team: (project?.team as any[]) || [],
            videoUrl: project?.videoUrl || "",
            private: project?.private ?? false,
            pdfUrl: project?.pdfUrl || "",
            seoScore: project?.seoScore || 0,
            clientLogo: project?.clientLogo || "",
            // isTemplate removed as per schema update
            // relatedProjects removed as per schema update
        },
    });

    // Load categories and tags
    useEffect(() => {
        async function loadData() {
            try {
                const [cats, tags] = await Promise.all([
                    getProjectCategories(),
                    getProjectTags()
                ]);
                setCategories(cats);
                setTagSuggestions(tags.map(t => t.name));
            } catch (error) {
                console.error('Failed to load categories/tags:', error);
            }
        }
        loadData();
    }, []);

    const watchedValues = form.watch();
    const currentScore = calculateScore(watchedValues);

    const onSubmit = async (data: ProjectFormData) => {
        setLoading(true);
        setError(null);
        try {
            // Update SEO Score before submitting
            const score = calculateScore(data);
            data.seoScore = score;

            let result;
            if (project) {
                result = await updateProject(project.id, data);
            } else {
                result = await createProject(data);
            }

            if (result.success) {
                router.push("/dashboard/projects");
                router.refresh();
            } else {
                setError(result.error || "Something went wrong");
            }
        } catch (e) {
            setError("An unexpected error occurred");
        } finally {
            setLoading(false);
        }
    };

    const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        form.setValue("title", e.target.value);
        if (!project) {
            const slug = e.target.value
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "")
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, "-")
                .replace(/(^-|-$)+/g, "");
            form.setValue("slug", slug);
        }
        // Auto-fill meta title if empty
        if (!form.getValues("metaTitle")) {
            form.setValue("metaTitle", e.target.value.slice(0, 60));
        }
    };

    const handleCreateCategory = async (name: string): Promise<Category | null> => {
        const result = await createProjectCategory(name);
        if (result.success && result.category) {
            setCategories(prev => [...prev, result.category!]);
            return result.category;
        }
        return null;
    };

    const handleUpdateCategory = async (id: string, name: string): Promise<Category | null> => {
        const result = await updateProjectCategory(id, name);
        if (result.success && result.category) {
            setCategories(prev => prev.map(c => c.id === id ? result.category! : c));
            return result.category;
        }
        return null;
    };

    const handleDeleteCategory = async (id: string): Promise<boolean> => {
        const result = await deleteProjectCategory(id);
        if (result.success) {
            setCategories(prev => prev.filter(c => c.id !== id));
            if (form.getValues('categoryId') === id) {
                form.setValue('categoryId', "");
            }
            return true;
        } else {
            alert(result.error || "No se pudo eliminar");
            return false;
        }
    };

    const onInvalid = (errors: any) => {
        console.error("Form validation errors:", errors);
        const errorKeys = Object.keys(errors).join(', ');
        alert(`No se puede guardar. Hay campos requeridos incompletos o con error: ${errorKeys}`);
    };

    const saveDraft = async () => {
        form.setValue("status", "draft");
        form.setValue("published", false);
        await form.handleSubmit(onSubmit, onInvalid)();
    };

    const publish = async () => {
        form.setValue("status", "published");
        form.setValue("published", true);
        await form.handleSubmit(onSubmit, onInvalid)();
    };

    return (
        <div className="max-w-6xl mx-auto pb-20">
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 sticky top-0 z-40 bg-[#0a0f1a]/80 backdrop-blur-xl py-6 border-b border-slate-800 -mx-6 px-6 mb-8">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-teal-500/10 rounded-2xl border border-teal-500/20">
                            <Layers className="w-6 h-6 text-teal-400" />
                        </div>
                        <div>
                            <div className="flex items-center gap-3">
                                <h1 className="text-2xl font-black text-white tracking-tight uppercase font-mono">
                                    {project ? "Editar Proyecto" : "Nuevo Proyecto"}
                                </h1>
                                <Badge className="bg-teal-500 text-slate-950 font-bold font-mono">
                                    SEO: {currentScore}/100
                                </Badge>
                            </div>
                            <p className="text-slate-500 text-xs font-bold uppercase tracking-[0.2em] mt-1">
                                {project ? `ID: ${project.id.slice(0, 8)}...` : "Configuración de caso de estudio"}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        {project && (
                            <Button
                                type="button"
                                variant="outline"
                                className="border-slate-800 bg-slate-900/50 hover:bg-slate-800 transition-all text-xs font-bold uppercase tracking-widest px-6"
                                onClick={() => window.open(`/portfolio/${project.slug}`, '_blank')}
                            >
                                <Eye className="h-4 w-4 mr-2" />
                                Vista Previa
                            </Button>
                        )}
                        <Button
                            type="button"
                            variant="outline"
                            className="border-slate-800 bg-slate-900/50 hover:bg-slate-800 transition-all text-xs font-bold uppercase tracking-widest px-6"
                            onClick={saveDraft}
                            disabled={loading}
                        >
                            <Save className="h-4 w-4 mr-2" />
                            Borrador
                        </Button>
                        <Button
                            type="button"
                            className="bg-teal-500 hover:bg-teal-400 text-slate-950 transition-all font-black text-xs uppercase tracking-[0.2em] px-8 shadow-[0_0_20px_rgba(20,184,166,0.2)]"
                            onClick={publish}
                            disabled={loading}
                        >
                            {loading ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <Send className="h-4 w-4 mr-2" />}
                            Publicar
                        </Button>
                    </div>
                </div>

                {error && (
                    <div className="bg-red-950/30 text-red-400 p-4 rounded-lg text-sm border border-red-900/50">
                        {error}
                    </div>
                )}

                <Tabs defaultValue="general" className="w-full">
                    <TabsList className="w-full justify-start bg-[#0d1117] border border-slate-800 p-1.5 rounded-2xl mb-8 overflow-x-auto gap-1">
                        <TabsTrigger value="general" className="px-6 py-2.5 text-xs font-bold uppercase tracking-widest data-[state=active]:bg-teal-500 data-[state=active]:text-slate-950 rounded-xl transition-all">General</TabsTrigger>
                        <TabsTrigger value="content" className="px-6 py-2.5 text-xs font-bold uppercase tracking-widest data-[state=active]:bg-teal-500 data-[state=active]:text-slate-950 rounded-xl transition-all">Contenido</TabsTrigger>
                        <TabsTrigger value="media" className="px-6 py-2.5 text-xs font-bold uppercase tracking-widest data-[state=active]:bg-teal-500 data-[state=active]:text-slate-950 rounded-xl transition-all">Media & Visualizer</TabsTrigger>
                        <TabsTrigger value="seo" className="px-6 py-2.5 text-xs font-bold uppercase tracking-widest data-[state=active]:bg-teal-500 data-[state=active]:text-slate-950 rounded-xl transition-all">SEO & Social</TabsTrigger>
                        <TabsTrigger value="settings" className="px-6 py-2.5 text-xs font-bold uppercase tracking-widest data-[state=active]:bg-teal-500 data-[state=active]:text-slate-950 rounded-xl transition-all">Ajustes</TabsTrigger>
                    </TabsList>

                    {/* GENERAL TAB */}
                    <TabsContent value="general" className="space-y-8 outline-none">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <div className="md:col-span-2 space-y-8">
                                <div className="bg-[#0d1117] p-8 rounded-2xl border border-slate-800 shadow-xl space-y-6">
                                    <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
                                        <div className="w-1.5 h-1.5 bg-teal-500 rounded-full" />
                                        <h2 className="text-sm font-black text-slate-100 uppercase tracking-widest">Información Básica</h2>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Título del Proyecto *</label>
                                            <Input
                                                {...form.register("title")}
                                                onChange={handleTitleChange}
                                                placeholder="Ej: Rediseño de marca TechCorp"
                                                className="bg-slate-950 border-slate-700 h-12 focus:border-teal-500/50"
                                            />
                                            {form.formState.errors.title && (
                                                <p className="text-[10px] font-bold text-red-500 mt-1">{form.formState.errors.title.message}</p>
                                            )}
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Ruta (Slug)</label>
                                            <Input {...form.register("slug")} placeholder="proyecto-slug" className="bg-slate-950 border-slate-700 h-12 font-mono text-xs opacity-60" />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Descripción Corta *</label>
                                        <textarea
                                            {...form.register("description")}
                                            className="w-full min-h-[120px] p-4 bg-slate-950 rounded-xl border border-slate-700 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-teal-500/50 transition-all resize-none"
                                            placeholder="Breve resumen para la cuadrícula del portafolio..."
                                        />
                                        {form.formState.errors.description && (
                                            <p className="text-[10px] font-bold text-red-500 mt-1">{form.formState.errors.description.message}</p>
                                        )}
                                    </div>
                                </div>

                                <div className="bg-[#0d1117] p-8 rounded-2xl border border-slate-800 shadow-xl space-y-6">
                                    <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
                                        <div className="w-1.5 h-1.5 bg-teal-500 rounded-full" />
                                        <h2 className="text-sm font-black text-slate-100 uppercase tracking-widest">Detalles del Cliente</h2>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Nombre del Cliente</label>
                                            <Input {...form.register("client")} placeholder="Nombre o Empresa" className="bg-slate-950 border-slate-700 h-11" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Enlace Externo</label>
                                            <div className="relative">
                                                <Input {...form.register("projectUrl")} placeholder="https://..." className="pr-10 bg-slate-950 border-slate-700 h-11" />
                                                <ExternalLink className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-600" />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">URL Logotipo Cliente</label>
                                        <div className="flex gap-4">
                                            <Input {...form.register("clientLogo")} placeholder="https://.../logo.png" className="bg-slate-950 border-slate-700 h-11" />
                                            {watchedValues.clientLogo && (
                                                <div className="w-11 h-11 bg-slate-950 border border-slate-800 rounded-lg flex items-center justify-center p-2 flex-shrink-0">
                                                    <img src={watchedValues.clientLogo} alt="Logo" className="max-w-full max-h-full object-contain" />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-8">
                                <div className="bg-[#0d1117] p-8 rounded-2xl border border-slate-800 shadow-xl space-y-6">
                                    <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
                                        <Tag className="w-4 h-4 text-teal-500" />
                                        <h2 className="text-sm font-black text-slate-100 uppercase tracking-widest">Organización</h2>
                                    </div>
                                    <Controller
                                        name="categoryId"
                                        control={form.control}
                                        render={({ field }) => (
                                            <ProjectCategorySelector
                                                categories={categories}
                                                selectedId={field.value}
                                                onSelect={(id) => field.onChange(id || "")}
                                                onCreateNew={handleCreateCategory}
                                                onUpdateCategory={handleUpdateCategory}
                                                onDeleteCategory={handleDeleteCategory}
                                            />
                                        )}
                                    />
                                    <Controller
                                        name="tagNames"
                                        control={form.control}
                                        render={({ field }) => (
                                            <ProjectTagInput
                                                tags={field.value || []}
                                                onChange={field.onChange}
                                                suggestions={tagSuggestions}
                                            />
                                        )}
                                    />
                                </div>

                                <div className="bg-[#0d1117] p-8 rounded-2xl border border-slate-800 shadow-xl space-y-6">
                                    <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
                                        <Calendar className="w-4 h-4 text-teal-500" />
                                        <h2 className="text-sm font-black text-slate-100 uppercase tracking-widest">Fechas</h2>
                                    </div>
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Fecha de Inicio</label>
                                            <Input type="date" {...form.register("startDate")} className="bg-slate-950 border-slate-700 h-10 [color-scheme:dark]" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Fecha de Fin</label>
                                            <Input type="date" {...form.register("endDate")} className="bg-slate-950 border-slate-700 h-10 [color-scheme:dark]" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </TabsContent>

                    {/* CONTENT TAB */}
                    <TabsContent value="content" className="space-y-8 outline-none">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            <div className="lg:col-span-2 space-y-8">
                                <div className="bg-[#0d1117] p-8 rounded-2xl border border-slate-800 shadow-xl space-y-6">
                                    <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
                                        <FileText className="w-4 h-4 text-teal-500" />
                                        <h2 className="text-sm font-black text-slate-100 uppercase tracking-widest">Historia del Proyecto (Case Study)</h2>
                                    </div>
                                    <Controller
                                        name="content"
                                        control={form.control}
                                        render={({ field }) => (
                                            <RichTextEditor
                                                initialValue={field.value || ""}
                                                onChange={field.onChange}
                                                placeholder="Cuenta la historia detallada de este proyecto..."
                                            />
                                        )}
                                    />
                                </div>

                                <div className="bg-[#0d1117] p-8 rounded-2xl border border-slate-800 shadow-xl space-y-6">
                                    <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
                                        <div className="w-1.5 h-1.5 bg-teal-500 rounded-full" />
                                        <h2 className="text-sm font-black text-slate-100 uppercase tracking-widest">Resultados & Testimonio</h2>
                                    </div>
                                    <div className="space-y-6">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Testimonio del Cliente</label>
                                            <textarea
                                                {...form.register("testimonial")}
                                                className="w-full min-h-[120px] p-4 bg-slate-950 rounded-xl border border-slate-700 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-teal-500/50 transition-all resize-none italic"
                                                placeholder="¿Qué dijo el cliente sobre el proyecto?..."
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-8">
                                <div className="bg-[#0d1117] p-8 rounded-2xl border border-slate-800 shadow-xl space-y-6">
                                    <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
                                        <Code className="w-4 h-4 text-teal-500" />
                                        <h2 className="text-sm font-black text-slate-100 uppercase tracking-widest">Stack Tecnológico</h2>
                                    </div>
                                    <Controller
                                        name="techStack"
                                        control={form.control}
                                        render={({ field }) => (
                                            <TechStackSelector
                                                value={field.value || []}
                                                onChange={field.onChange}
                                            />
                                        )}
                                    />
                                </div>

                                <div className="bg-[#0d1117] p-8 rounded-2xl border border-slate-800 shadow-xl space-y-6">
                                    <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
                                        <Globe className="w-4 h-4 text-teal-500" />
                                        <h2 className="text-sm font-black text-slate-100 uppercase tracking-widest">Equipo del Proyecto</h2>
                                    </div>
                                    <Controller
                                        name="team"
                                        control={form.control}
                                        render={({ field }) => (
                                            <TeamMemberInput
                                                value={(field.value || []) as any}
                                                onChange={field.onChange}
                                            />
                                        )}
                                    />
                                </div>
                            </div>
                        </div>
                    </TabsContent>

                    {/* MEDIA TAB */}
                    <TabsContent value="media" className="space-y-8 outline-none">
                        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                            <div className="lg:col-span-1 space-y-8">
                                <div className="bg-[#0d1117] p-8 rounded-2xl border border-slate-800 shadow-xl space-y-6">
                                    <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
                                        <ImageIcon className="w-4 h-4 text-teal-500" />
                                        <h2 className="text-sm font-black text-slate-100 uppercase tracking-widest">Imagen de Portada</h2>
                                    </div>
                                    <Controller
                                        name="coverImage"
                                        control={form.control}
                                        render={({ field }) => (
                                            <ImageUploadPreview
                                                imageUrl={field.value || ""}
                                                imageAlt={form.watch("imageAlt") || ""}
                                                onImageUrlChange={field.onChange}
                                                onImageAltChange={(alt) => form.setValue("imageAlt", alt, { shouldDirty: true })}
                                            />
                                        )}
                                    />
                                </div>
                                <div className="bg-[#0d1117] p-8 rounded-2xl border border-slate-800 shadow-xl space-y-6">
                                    <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
                                        <Video className="w-4 h-4 text-teal-500" />
                                        <h2 className="text-sm font-black text-slate-100 uppercase tracking-widest">Video Case Study</h2>
                                    </div>
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">URL del Video</label>
                                            <Input {...form.register("videoUrl")} placeholder="https://youtube.com/..." className="bg-slate-950 border-slate-700 h-10" />
                                            <p className="text-[10px] text-slate-600 font-bold uppercase tracking-wider">YouTube / Vimeo</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="lg:col-span-3">
                                <div className="bg-[#0d1117] p-8 rounded-2xl border border-slate-800 shadow-xl space-y-8">
                                    <div className="flex items-center justify-between border-b border-slate-800 pb-6">
                                        <div className="flex items-center gap-3">
                                            <Layers className="w-5 h-5 text-teal-500" />
                                            <h2 className="text-sm font-black text-slate-100 uppercase tracking-widest">Galería & Simulador de Redes</h2>
                                        </div>
                                        <Badge className="bg-slate-900 border-slate-800 text-slate-400 font-mono text-[10px]">
                                            TOTAL: {watchedValues.gallery?.length || 0} ASSETS
                                        </Badge>
                                    </div>
                                    <div className="bg-slate-950/50 rounded-2xl border border-slate-800/50 p-6">
                                        <Controller
                                            name="gallery"
                                            control={form.control}
                                            render={({ field }) => (
                                                <GalleryManager
                                                    images={field.value?.map((item: any) => {
                                                        if (typeof item === 'string') return { url: item, alt: '', caption: '' };
                                                        return item;
                                                    }) || []}
                                                    onChange={(images) => field.onChange(images)}
                                                />
                                            )}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </TabsContent>

                    {/* SEO TAB */}
                    <TabsContent value="seo" className="space-y-6">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <div className="bg-slate-900 p-6 rounded-xl shadow-sm border border-slate-800 space-y-4">
                                <h2 className="text-lg font-semibold border-b pb-2">Search Engine Optimization</h2>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Meta Title</label>
                                    <Input {...form.register("metaTitle")} placeholder="SEO title (max 60 chars)" />
                                    <CharacterCounter current={watchedValues.metaTitle?.length || 0} max={60} />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Meta Description</label>
                                    <textarea
                                        {...form.register("metaDescription")}
                                        className="w-full min-h-[100px] p-3 rounded-lg border border-slate-700 focus:outline-none focus:ring-2 focus:ring-black resize-none"
                                        placeholder="SEO description (max 160 chars)"
                                    />
                                    <CharacterCounter current={watchedValues.metaDescription?.length || 0} max={160} />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Focus Keyword</label>
                                        <Input {...form.register("focusKeyword")} placeholder="Primary keyword" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Image Alt Text</label>
                                        <Input {...form.register("imageAlt")} placeholder="Describe the cover image" />
                                    </div>
                                </div>
                            </div>

                            <div className="bg-slate-900 p-6 rounded-xl shadow-sm border border-slate-800">
                                <SocialPreview
                                    title={watchedValues.metaTitle || watchedValues.title}
                                    description={watchedValues.metaDescription || watchedValues.description}
                                    image={watchedValues.coverImage || undefined}
                                />
                            </div>
                        </div>
                    </TabsContent>

                    {/* SETTINGS TAB */}
                    <TabsContent value="settings" className="space-y-8 outline-none">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="bg-[#0d1117] p-8 rounded-2xl border border-slate-800 shadow-xl space-y-8">
                                <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
                                    <Globe className="w-4 h-4 text-teal-500" />
                                    <h2 className="text-sm font-black text-slate-100 uppercase tracking-widest">Visibilidad & Estado</h2>
                                </div>

                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Estado de Publicación</label>
                                        <select
                                            {...form.register("status")}
                                            className="w-full h-11 px-4 bg-slate-950 border border-slate-700 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-teal-500/50 appearance-none"
                                        >
                                            <option value="draft">Borrador</option>
                                            <option value="published">Publicado</option>
                                            <option value="scheduled">Programado</option>
                                            <option value="archived">Archivado</option>
                                        </select>
                                    </div>

                                    {watchedValues.status === "scheduled" && (
                                        <div className="space-y-2 animate-in slide-in-from-top-2 duration-200">
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                                                <Calendar className="h-4 w-4" />
                                                Fecha Programada
                                            </label>
                                            <Input type="datetime-local" {...form.register("scheduledDate")} className="bg-slate-950 border-slate-700 h-11 [color-scheme:dark]" />
                                        </div>
                                    )}

                                    <div className="flex items-center justify-between p-5 bg-slate-950 border border-slate-800 rounded-2xl hover:border-slate-700 transition-colors">
                                        <div className="space-y-1">
                                            <label className="text-xs font-black text-slate-200 uppercase tracking-widest">Proyecto Destacado</label>
                                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Resaltar en la página de inicio</p>
                                        </div>
                                        <Switch
                                            checked={watchedValues.featured}
                                            onCheckedChange={(checked) => form.setValue("featured", checked)}
                                        />
                                    </div>

                                    <div className="flex items-center justify-between p-5 bg-slate-950 border border-slate-800 rounded-2xl hover:border-slate-700 transition-colors">
                                        <div className="space-y-1">
                                            <label className="text-xs font-black text-slate-200 uppercase tracking-widest flex items-center gap-2">
                                                <Lock className="h-3.5 w-3.5" />
                                                Privado / Protegido
                                            </label>
                                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Solo accesible vía enlace directo</p>
                                        </div>
                                        <Switch
                                            checked={watchedValues.private}
                                            onCheckedChange={(checked) => form.setValue("private", checked)}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="bg-[#0d1117] p-8 rounded-2xl border border-slate-800 shadow-xl space-y-8">
                                <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
                                    <FileText className="w-4 h-4 text-teal-500" />
                                    <h2 className="text-sm font-black text-slate-100 uppercase tracking-widest">Descargas & Activos</h2>
                                </div>
                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">URL del Case Study PDF</label>
                                        <div className="relative">
                                            <Input {...form.register("pdfUrl")} placeholder="https://..." className="bg-slate-950 border-slate-700 h-11 pr-10" />
                                            <FileText className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-600" />
                                        </div>
                                        <p className="text-[10px] text-slate-600 font-bold uppercase tracking-wider">Enlace a versión descargable</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>

                {/* Footer Actions (Sticky Bottom) */}
                <div className="sticky bottom-4 z-40 bg-[#0d1117] border border-slate-800 p-4 rounded-2xl shadow-2xl flex justify-between items-center animate-in slide-in-from-bottom-4 duration-500">
                    <Button 
                        type="button" 
                        variant="ghost" 
                        className="text-slate-500 hover:text-white transition-colors text-xs font-bold uppercase tracking-widest"
                        onClick={() => router.back()}
                    >
                        Cancelar
                    </Button>
                    <div className="flex gap-4">
                        {project && (
                            <div className="text-[10px] text-slate-600 font-black uppercase tracking-widest self-center hidden md:block">
                                Última edición: {new Date().toLocaleDateString('es-ES')}
                            </div>
                        )}
                        <Button 
                            type="button" 
                            variant="outline" 
                            className="border-slate-800 bg-slate-900/50 hover:bg-slate-800 text-slate-300 transition-all text-xs font-black uppercase tracking-[0.2em] px-6"
                            onClick={saveDraft} 
                            disabled={loading}
                        >
                            <Save className="h-4 w-4 mr-2" />
                            Borrador
                        </Button>
                        <Button 
                            type="button" 
                            className="bg-teal-500 hover:bg-teal-400 text-slate-950 transition-all font-black text-xs uppercase tracking-[0.2em] px-10 shadow-[0_4px_20px_rgba(20,184,166,0.3)]"
                            onClick={publish} 
                            disabled={loading}
                        >
                            {loading && <Loader2 className="animate-spin h-4 w-4 mr-2" />}
                            <Send className="h-4 w-4 mr-2" />
                            Publicar Ahora
                        </Button>
                    </div>
                </div>
            </form>
        </div>
    );
}


