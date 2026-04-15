'use client';

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { createProject, updateProject, getProjectCategories, getProjectTags, createProjectCategory, updateProjectCategory, deleteProjectCategory } from "@/actions/projects";
import { ProjectSchema, type ProjectFormData } from "@/lib/schemas";
import { Loader2, Eye, Save, Send, Calendar, ExternalLink, Globe, Lock, FileText, Image as ImageIcon, Copy } from "lucide-react";
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
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 sticky top-0 z-10 bg-slate-950/80/80 backdrop-blur-sm py-4 border-b border-slate-800 -mx-4 px-4 md:mx-0 md:px-0">
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-bold text-slate-100">
                                {project ? "Edit Project" : "Create New Project"}
                            </h1>
                            <Badge variant={currentScore > 80 ? "default" : currentScore > 50 ? "secondary" : "outline"}>
                                SEO Score: {currentScore}/100
                            </Badge>
                        </div>
                        <p className="text-slate-400 text-sm mt-1">
                            Showcase your work with a detailed case study
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        {project && (
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => window.open(`/portfolio/${project.slug}`, '_blank')}
                            >
                                <Eye className="h-4 w-4 mr-2" />
                                Preview
                            </Button>
                        )}
                        <Button
                            type="button"
                            variant="outline"
                            onClick={saveDraft}
                            disabled={loading}
                        >
                            <Save className="h-4 w-4 mr-2" />
                            Save Draft
                        </Button>
                        <Button
                            type="button"
                            onClick={publish}
                            disabled={loading}
                        >
                            {loading ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <Send className="h-4 w-4 mr-2" />}
                            Publish
                        </Button>
                    </div>
                </div>

                {error && (
                    <div className="bg-red-950/30 text-red-400 p-4 rounded-lg text-sm border border-red-900/50">
                        {error}
                    </div>
                )}

                <Tabs defaultValue="general" className="w-full">
                    <TabsList className="w-full justify-start bg-slate-900 border border-slate-800 p-1 rounded-lg mb-6 overflow-x-auto">
                        <TabsTrigger value="general" className="px-4 py-2">General</TabsTrigger>
                        <TabsTrigger value="content" className="px-4 py-2">Content</TabsTrigger>
                        <TabsTrigger value="media" className="px-4 py-2">Media</TabsTrigger>
                        <TabsTrigger value="seo" className="px-4 py-2">SEO & Social</TabsTrigger>
                        <TabsTrigger value="settings" className="px-4 py-2">Settings</TabsTrigger>
                    </TabsList>

                    {/* GENERAL TAB */}
                    <TabsContent value="general" className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <div className="md:col-span-2 space-y-6">
                                <div className="bg-slate-900 p-6 rounded-xl shadow-sm border border-slate-800 space-y-4">
                                    <h2 className="text-lg font-semibold border-b pb-2">Basic Info</h2>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">Project Title *</label>
                                            <Input
                                                {...form.register("title")}
                                                onChange={handleTitleChange}
                                                placeholder="e.g., Brand Redesign for TechCorp"
                                            />
                                            {form.formState.errors.title && (
                                                <p className="text-sm text-red-500">{form.formState.errors.title.message}</p>
                                            )}
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">Slug</label>
                                            <Input {...form.register("slug")} placeholder="project-slug" />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Short Description *</label>
                                        <textarea
                                            {...form.register("description")}
                                            className="w-full min-h-[100px] p-3 rounded-lg border border-slate-700 focus:outline-none focus:ring-2 focus:ring-black resize-none"
                                            placeholder="Brief description shown in portfolio grid..."
                                        />
                                        {form.formState.errors.description && (
                                            <p className="text-sm text-red-500">{form.formState.errors.description.message}</p>
                                        )}
                                    </div>
                                </div>

                                <div className="bg-slate-900 p-6 rounded-xl shadow-sm border border-slate-800 space-y-4">
                                    <h2 className="text-lg font-semibold border-b pb-2">Client Details</h2>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">Client Name</label>
                                            <Input {...form.register("client")} placeholder="Client Name" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">Project URL</label>
                                            <div className="relative">
                                                <Input {...form.register("projectUrl")} placeholder="https://..." className="pr-10" />
                                                <ExternalLink className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Client Logo URL</label>
                                        <div className="flex gap-2">
                                            <Input {...form.register("clientLogo")} placeholder="https://.../logo.png" />
                                            {watchedValues.clientLogo && (
                                                <img src={watchedValues.clientLogo} alt="Logo" className="h-10 w-10 object-contain bg-slate-900 border rounded" />
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div className="bg-slate-900 p-6 rounded-xl shadow-sm border border-slate-800 space-y-4">
                                    <h2 className="text-lg font-semibold">Categorization</h2>
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

                                <div className="bg-slate-900 p-6 rounded-xl shadow-sm border border-slate-800 space-y-4">
                                    <h2 className="text-lg font-semibold">Project Dates</h2>
                                    <div className="space-y-3">
                                        <div className="space-y-1">
                                            <label className="text-sm font-medium">Start Date</label>
                                            <Input type="date" {...form.register("startDate")} />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-sm font-medium">End Date</label>
                                            <Input type="date" {...form.register("endDate")} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </TabsContent>

                    {/* CONTENT TAB */}
                    <TabsContent value="content" className="space-y-6">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            <div className="lg:col-span-2 space-y-6">
                                <div className="bg-slate-900 p-6 rounded-xl shadow-sm border border-slate-800">
                                    <h2 className="text-lg font-semibold mb-4">Case Study Story</h2>
                                    <Controller
                                        name="content"
                                        control={form.control}
                                        render={({ field }) => (
                                            <RichTextEditor
                                                initialValue={field.value || ""}
                                                onChange={field.onChange}
                                                placeholder="Tell the story of this project..."
                                            />
                                        )}
                                    />
                                </div>

                                <div className="bg-slate-900 p-6 rounded-xl shadow-sm border border-slate-800">
                                    <h2 className="text-lg font-semibold mb-4">Results & Testimonial</h2>
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">Client Testimonial</label>
                                            <textarea
                                                {...form.register("testimonial")}
                                                className="w-full min-h-[100px] p-3 rounded-lg border border-slate-700 focus:outline-none focus:ring-2 focus:ring-black resize-none"
                                                placeholder="What did the client say about the project?"
                                            />
                                        </div>
                                        {/* Future: Key Results Builder can go here, for now relying on RichText or custom JSON field in future */}
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div className="bg-slate-900 p-6 rounded-xl shadow-sm border border-slate-800">
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

                                <div className="bg-slate-900 p-6 rounded-xl shadow-sm border border-slate-800">
                                    <Controller
                                        name="team"
                                        control={form.control}
                                        render={({ field }) => (
                                            <TeamMemberInput
                                                value={field.value || []}
                                                onChange={field.onChange}
                                            />
                                        )}
                                    />
                                </div>
                            </div>
                        </div>
                    </TabsContent>

                    {/* MEDIA TAB */}
                    <TabsContent value="media" className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-6">
                                <div className="bg-slate-900 p-6 rounded-xl shadow-sm border border-slate-800">
                                    <h2 className="text-lg font-semibold mb-4">Cover Image</h2>
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
                                <div className="bg-slate-900 p-6 rounded-xl shadow-sm border border-slate-800">
                                    <h2 className="text-lg font-semibold mb-4">Video Case Study</h2>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Video URL (YouTube/Vimeo)</label>
                                        <Input {...form.register("videoUrl")} placeholder="https://youtube.com/watch?v=..." />
                                        <p className="text-xs text-slate-400">Paste a link to embed a video player.</p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-slate-900 p-6 rounded-xl shadow-sm border border-slate-800">
                                <h2 className="text-lg font-semibold mb-4">Project Gallery</h2>
                                <div className="border-t border-slate-800 pt-4">
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
                    <TabsContent value="settings" className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="bg-slate-900 p-6 rounded-xl shadow-sm border border-slate-800 space-y-6">
                                <h2 className="text-lg font-semibold border-b pb-2">Visibility & Status</h2>

                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Publication Status</label>
                                        <select
                                            {...form.register("status")}
                                            className="w-full px-3 py-2 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                                        >
                                            <option value="draft">Draft</option>
                                            <option value="published">Published</option>
                                            <option value="scheduled">Scheduled</option>
                                            <option value="archived">Archived</option>
                                        </select>
                                    </div>

                                    {watchedValues.status === "scheduled" && (
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium flex items-center gap-2">
                                                <Calendar className="h-4 w-4" />
                                                Schedule Date
                                            </label>
                                            <Input type="datetime-local" {...form.register("scheduledDate")} />
                                        </div>
                                    )}

                                    <div className="flex items-center justify-between p-3 border rounded-lg">
                                        <div className="space-y-0.5">
                                            <label className="text-sm font-medium">Featured Project</label>
                                            <p className="text-xs text-slate-400">Highlight this project on the homepage</p>
                                        </div>
                                        <Switch
                                            checked={watchedValues.featured}
                                            onCheckedChange={(checked) => form.setValue("featured", checked)}
                                        />
                                    </div>

                                    <div className="flex items-center justify-between p-3 border rounded-lg">
                                        <div className="space-y-0.5">
                                            <label className="text-sm font-medium flex items-center gap-2">
                                                <Lock className="h-4 w-4" />
                                                Private / Password Protected
                                            </label>
                                            <p className="text-xs text-slate-400">Only accessible via direct link or password</p>
                                        </div>
                                        <Switch
                                            checked={watchedValues.private}
                                            onCheckedChange={(checked) => form.setValue("private", checked)}
                                        />
                                    </div>

                                    {/* isTemplate UI removed as per schema update */}

                                    {/* relatedProjects UI removed as per schema update */}
                                </div>
                            </div>

                            <div className="bg-slate-900 p-6 rounded-xl shadow-sm border border-slate-800 space-y-6">
                                <h2 className="text-lg font-semibold border-b pb-2">Downloads & Assets</h2>
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium flex items-center gap-2">
                                            <FileText className="h-4 w-4" />
                                            PDF Case Study URL
                                        </label>
                                        <Input {...form.register("pdfUrl")} placeholder="https://..." />
                                        <p className="text-xs text-slate-400">Link to a downloadable PDF version</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>

                {/* Footer Actions (Sticky Bottom) */}
                <div className="sticky bottom-0 bg-slate-900 border-t border-slate-800 p-4 -mx-4 md:mx-0 flex justify-between items-center z-10">
                    <Button type="button" variant="ghost" onClick={() => router.back()}>
                        Cancel
                    </Button>
                    <div className="flex gap-3">
                        {project && (
                            <div className="text-xs text-slate-500 self-center hidden md:block">
                                Last edited: {new Date().toLocaleDateString()}
                            </div>
                        )}
                        <Button type="button" variant="outline" onClick={saveDraft} disabled={loading}>
                            <Save className="h-4 w-4 mr-2" />
                            Save Draft
                        </Button>
                        <Button type="button" onClick={publish} disabled={loading}>
                            {loading && <Loader2 className="animate-spin h-4 w-4 mr-2" />}
                            <Send className="h-4 w-4 mr-2" />
                            Publish
                        </Button>
                    </div>
                </div>
            </form>
        </div>
    );
}
