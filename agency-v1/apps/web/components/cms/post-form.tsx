'use client';

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { createPost, updatePost } from "@/actions/cms";
import { PostSchema, type PostFormData } from "@/lib/schemas";
import { Loader2, Calendar, CheckCircle2, AlertCircle, Save } from "lucide-react";
import { CharacterCounter } from "./character-counter";
import { ImageUploadPreview } from "./image-upload-preview";
import { CategorySelector } from "./category-selector";
import { TagInput } from "./tag-input";
import { format } from "date-fns";
import { FAQManager } from "./faq-manager";

// Fix rendimiento: Tiptap (~300KB) se carga de forma lazy.
// No bloquea el primer render de la página.
const RichTextEditor = dynamic(
    () => import("./rich-text-editor").then((m) => m.RichTextEditor),
    {
        ssr: false,
        loading: () => (
            <div className="border border-gray-200 rounded-md overflow-hidden animate-pulse">
                <div className="bg-gray-50 border-b p-2 flex gap-2">
                    {Array.from({ length: 7 }).map((_, i) => (
                        <div key={i} className="h-8 w-8 bg-gray-200 rounded" />
                    ))}
                </div>
                <div className="min-h-[300px] p-4 space-y-3">
                    <div className="h-4 bg-gray-100 rounded w-3/4" />
                    <div className="h-4 bg-gray-100 rounded w-full" />
                    <div className="h-4 bg-gray-100 rounded w-5/6" />
                </div>
            </div>
        ),
    }
);

interface Category {
    id: string;
    name: string;
}

interface Tag {
    name: string;
}

interface PostFormProps {
    post?: {
        id: string;
        title: string;
        slug: string;
        excerpt?: string | null;
        content: string;
        coverImage?: string | null;
        imageAlt?: string | null;
        published: boolean;
        metaTitle?: string | null;
        metaDescription?: string | null;
        status: string;
        scheduledDate?: Date | null;
        categories?: Category[];
        tags?: Tag[];
        faqs?: any; // JSON field
    };
    availableCategories?: Category[];
    availableTags?: string[];
}

export function PostForm({ post, availableCategories = [], availableTags = [] }: PostFormProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const form = useForm<PostFormData>({
        resolver: zodResolver(PostSchema) as any,
        defaultValues: {
            title: post?.title || "",
            slug: post?.slug || "",
            excerpt: post?.excerpt || "",
            content: post?.content || "",
            coverImage: post?.coverImage || "",
            imageAlt: post?.imageAlt || "",
            metaTitle: post?.metaTitle || "",
            metaDescription: post?.metaDescription || "",
            status: (post?.status as "draft" | "published" | "scheduled") || "draft",
            scheduledDate: post?.scheduledDate ? format(new Date(post.scheduledDate), "yyyy-MM-dd'T'HH:mm") : "",
            published: post?.published ?? false,
            categoryIds: post?.categories?.map(c => c.id) || [],
            tagNames: post?.tags?.map(t => t.name) || [],
            faqs: post?.faqs || [],
        },
    });

    const watchedStatus = form.watch("status");
    const watchedMetaTitle = form.watch("metaTitle");
    const watchedMetaDescription = form.watch("metaDescription");
    const watchedContent = form.watch("content");

    const [lastSaved, setLastSaved] = useState<Date | null>(null);
    const [isAutoSaving, setIsAutoSaving] = useState(false);

    // SEO Score Calculator
    const calculateSEOScore = () => {
        let score = 0;
        if (watchedMetaTitle && watchedMetaTitle.length >= 40 && watchedMetaTitle.length <= 60) score += 30;
        else if (watchedMetaTitle && watchedMetaTitle.length > 0) score += 15;
        
        if (watchedMetaDescription && watchedMetaDescription.length >= 120 && watchedMetaDescription.length <= 160) score += 30;
        else if (watchedMetaDescription && watchedMetaDescription.length > 0) score += 15;

        if (watchedContent && watchedContent.length > 300) score += 40;
        else if (watchedContent && watchedContent.length > 100) score += 20;

        return score;
    };
    const seoScore = calculateSEOScore();

    // Auto-save logic
    useEffect(() => {
        const subscription = form.watch((value, { name, type }) => {
            if (type === 'change') {
                const timer = setTimeout(() => {
                    setIsAutoSaving(true);
                    const dataToSave = form.getValues();
                    localStorage.setItem(`draft_post_${post?.id || 'new'}`, JSON.stringify(dataToSave));
                    setTimeout(() => {
                        setLastSaved(new Date());
                        setIsAutoSaving(false);
                    }, 500);
                }, 2000);
                return () => clearTimeout(timer);
            }
        });
        return () => subscription.unsubscribe();
    }, [form.watch, post]);

    useEffect(() => {
        if (!post) {
            const draft = localStorage.getItem('draft_post_new');
            if (draft) {
                try {
                    const parsed = JSON.parse(draft);
                    form.reset(parsed);
                } catch (e) {}
            }
        }
    }, [post, form]);

    const onSubmit = async (data: PostFormData) => {
        setLoading(true);
        setError(null);
        try {
            let result;
            if (post) {
                result = await updatePost(post.id, data);
            } else {
                result = await createPost(data);
            }

            if (result.success) {
                localStorage.removeItem(`draft_post_${post?.id || 'new'}`);
                router.push("/dashboard/posts");
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

    // Auto-generate slug from title if creating new post
    const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        form.setValue("title", e.target.value, { shouldDirty: true });
        if (!post) {
            const slug = e.target.value
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "")
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, "-")
                .replace(/(^-|-$)+/g, "");
            form.setValue("slug", slug, { shouldDirty: true });
        }
    };

    return (
        <div className="max-w-7xl mx-auto pb-24 text-slate-200">
            <div className="mb-6 flex items-center justify-between">
                <h1 className="text-3xl font-bold text-slate-100">{post ? "Edit Post" : "Create New Post"}</h1>
                <div className="flex items-center gap-2 text-sm text-slate-400">
                    {isAutoSaving ? (
                        <span className="flex items-center gap-1.5"><Loader2 className="w-4 h-4 animate-spin" /> Guardando...</span>
                    ) : lastSaved ? (
                        <span className="flex items-center gap-1.5"><Save className="w-4 h-4" /> Guardado local: {format(lastSaved, 'HH:mm:ss')}</span>
                    ) : null}
                </div>
            </div>

            {error && (
                <div className="bg-red-500/10 text-red-400 p-4 rounded-lg mb-6 border border-red-500/20 flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    {error}
                </div>
            )}

            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                    {/* Main Content Column - Left (2/3 width) */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Title & Slug */}
                        <div className="bg-slate-900/50 p-6 rounded-xl border border-slate-800/50 space-y-5">
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-300">Title</label>
                                <Input
                                    {...form.register("title")}
                                    onChange={handleTitleChange}
                                    placeholder="Enter your post title"
                                    className="text-lg bg-slate-950 border-slate-800 text-slate-100 focus-visible:ring-teal-500/50"
                                />
                                {form.formState.errors.title && (
                                    <p className="text-sm text-red-400">{form.formState.errors.title.message}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-300">URL Slug</label>
                                <Input 
                                    {...form.register("slug")} 
                                    placeholder="post-url-slug"
                                    className="bg-slate-950 border-slate-800 text-slate-300 focus-visible:ring-teal-500/50" 
                                />
                                {form.formState.errors.slug && (
                                    <p className="text-sm text-red-400">{form.formState.errors.slug.message}</p>
                                )}
                                <p className="text-xs text-slate-500">
                                    Will be available at: /blog/<span className="text-teal-400">{form.watch("slug") || "your-slug"}</span>
                                </p>
                            </div>
                        </div>

                        {/* Content Editor */}
                        <div className="bg-slate-900/50 p-6 rounded-xl border border-slate-800/50 space-y-4">
                            <label className="text-sm font-semibold text-slate-300">Content</label>
                            {/* Assumes RichTextEditor handles its own dark mode styling internally */}
                            <div className="prose-dark-editor-wrapper bg-slate-950 rounded-md border border-slate-800 overflow-hidden">
                                <RichTextEditor
                                    initialValue={post?.content || ""}
                                    onChange={(html) => form.setValue("content", html, { shouldDirty: true })}
                                    placeholder="Write your post content here..."
                                />
                            </div>
                            {form.formState.errors.content && (
                                <p className="text-sm text-red-400">{form.formState.errors.content.message}</p>
                            )}
                        </div>

                        {/* Excerpt */}
                        <div className="bg-slate-900/50 p-6 rounded-xl border border-slate-800/50 space-y-3">
                            <label className="text-sm font-semibold text-slate-300">Excerpt</label>
                            <textarea
                                {...form.register("excerpt")}
                                className="w-full min-h-[100px] p-4 rounded-md border border-slate-800 bg-slate-950 text-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500/50 resize-y"
                                placeholder="Brief summary of your post (optional)"
                            />
                            <p className="text-xs text-slate-500">
                                This will be shown in post listings and previews
                            </p>
                        </div>

                        {/* FAQs Section */}
                        <div className="bg-slate-900/50 p-6 rounded-xl border border-slate-800/50">
                            <FAQManager 
                                value={(form.watch("faqs") as any) || []}
                                onChange={(faqs) => form.setValue("faqs", faqs, { shouldDirty: true })}
                            />
                        </div>
                    </div>

                    {/* Sidebar - Right (1/3 width) - Sticky */}
                    <div className="space-y-6 lg:sticky lg:top-6">
                        {/* SEO Optimization & Score */}
                        <div className="bg-slate-900/50 p-6 rounded-xl border border-slate-800/50 space-y-5">
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="font-semibold text-lg text-slate-100">SEO Score</h3>
                                <div className="flex items-center gap-2">
                                    <div className="text-2xl font-bold tracking-tighter" style={{ color: seoScore > 70 ? '#2dd4bf' : seoScore > 40 ? '#fbbf24' : '#ef4444' }}>
                                        {seoScore}/100
                                    </div>
                                </div>
                            </div>
                            
                            <div className="w-full bg-slate-800 rounded-full h-2 mb-4">
                                <div 
                                    className="bg-teal-500 h-2 rounded-full transition-all duration-500" 
                                    style={{ width: `${Math.min(100, Math.max(0, seoScore))}%` }}
                                ></div>
                            </div>

                            <div className="space-y-2 pt-2 border-t border-slate-800/50">
                                <div className="flex items-center justify-between">
                                    <label className="text-sm font-medium text-slate-300">Meta Title</label>
                                    <CharacterCounter current={watchedMetaTitle?.length || 0} max={60} />
                                </div>
                                <Input
                                    {...form.register("metaTitle")}
                                    placeholder="SEO title for search engines"
                                    className="bg-slate-950 border-slate-800 text-slate-300 focus-visible:ring-teal-500/50"
                                />
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <label className="text-sm font-medium text-slate-300">Meta Description</label>
                                    <CharacterCounter current={watchedMetaDescription?.length || 0} max={160} />
                                </div>
                                <textarea
                                    {...form.register("metaDescription")}
                                    className="w-full min-h-[80px] p-3 rounded-md border border-slate-800 bg-slate-950 text-sm text-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500/50"
                                    placeholder="SEO description for search engines"
                                />
                            </div>

                            {/* Google Search Preview */}
                            {(watchedMetaTitle || watchedMetaDescription || form.watch("title")) && (
                                <div className="mt-4 p-4 bg-[#202124] rounded-md border border-slate-800">
                                    <p className="text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">Google Preview</p>
                                    <div className="space-y-1">
                                        <div className="text-[#8ab4f8] text-[18px] font-normal leading-tight line-clamp-1 hover:underline cursor-pointer">
                                            {watchedMetaTitle || form.watch("title") || "Your Post Title"}
                                        </div>
                                        <div className="text-[#bdc1c6] text-sm flex items-center gap-2">
                                            <span>yoursite.com</span>
                                            <span className="text-[#9aa0a6]"> › blog › {form.watch("slug") || "post-url"}</span>
                                        </div>
                                        <div className="text-[#bdc1c6] text-sm leading-snug line-clamp-2 mt-1">
                                            {watchedMetaDescription || form.watch("excerpt") || "Your post description will appear here in the search results..."}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Publishing Controls */}
                        <div className="bg-slate-900/50 p-6 rounded-xl border border-slate-800/50 space-y-5">
                            <h3 className="font-semibold text-lg text-slate-100">Publishing</h3>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-300">Status</label>
                                <select
                                    {...form.register("status")}
                                    className="w-full px-3 py-2 rounded-md border border-slate-800 bg-slate-950 text-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500/50"
                                >
                                    <option value="draft">Draft</option>
                                    <option value="published">Published</option>
                                    <option value="scheduled">Scheduled</option>
                                </select>
                            </div>

                            {watchedStatus === "scheduled" && (
                                <div className="space-y-2">
                                    <label className="text-sm font-medium flex items-center gap-2 text-slate-300">
                                        <Calendar className="h-4 w-4" />
                                        Scheduled Date & Time
                                    </label>
                                    <Input
                                        type="datetime-local"
                                        {...form.register("scheduledDate")}
                                        className="w-full bg-slate-950 border-slate-800 text-slate-300 [color-scheme:dark]"
                                    />
                                </div>
                            )}

                            <div className="flex items-center gap-3 pt-2">
                                <input
                                    type="checkbox"
                                    id="published"
                                    {...form.register("published")}
                                    className="h-4 w-4 rounded border-slate-800 bg-slate-950 text-teal-500 focus:ring-teal-500/50 focus:ring-offset-slate-900"
                                />
                                <label htmlFor="published" className="text-sm font-medium select-none cursor-pointer text-slate-300">
                                    Visible immediately
                                </label>
                            </div>
                        </div>

                        {/* Featured Image */}
                        <div className="bg-slate-900/50 p-6 rounded-xl border border-slate-800/50 space-y-4">
                            <h3 className="font-semibold text-lg text-slate-100">Featured Image</h3>
                            <ImageUploadPreview
                                imageUrl={form.watch("coverImage") || ""}
                                imageAlt={form.watch("imageAlt") || ""}
                                onImageUrlChange={(url) => form.setValue("coverImage", url, { shouldDirty: true })}
                                onImageAltChange={(alt) => form.setValue("imageAlt", alt, { shouldDirty: true })}
                            />
                        </div>

                        {/* Categories */}
                        <div className="bg-slate-900/50 p-6 rounded-xl border border-slate-800/50 space-y-4">
                            <h3 className="font-semibold text-lg text-slate-100">Categories</h3>
                            <CategorySelector
                                categories={availableCategories}
                                selectedIds={form.watch("categoryIds") || []}
                                onChange={(ids) => form.setValue("categoryIds", ids, { shouldDirty: true })}
                            />
                        </div>

                        {/* Tags */}
                        <div className="bg-slate-900/50 p-6 rounded-xl border border-slate-800/50 space-y-4">
                            <h3 className="font-semibold text-lg text-slate-100">Tags</h3>
                            <TagInput
                                value={form.watch("tagNames") || []}
                                onChange={(tags) => form.setValue("tagNames", tags, { shouldDirty: true })}
                                suggestions={availableTags}
                            />
                        </div>
                    </div>
                </div>

                {/* Sticky Action Buttons */}
                <div className="fixed bottom-0 left-0 lg:left-64 right-0 bg-slate-950/80 backdrop-blur-md border-t border-slate-800/50 p-4 z-50 transition-all">
                    <div className="max-w-7xl mx-auto flex items-center justify-between px-4 lg:px-0">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => router.back()}
                            disabled={loading}
                            className="text-slate-400 hover:text-slate-100 hover:bg-slate-800"
                        >
                            Cancel
                        </Button>

                        <div className="flex gap-4">
                            {watchedStatus === "draft" && (
                                <Button
                                    type="submit"
                                    variant="outline"
                                    disabled={loading}
                                    className="border-slate-700 hover:bg-slate-800 text-slate-300"
                                >
                                    {loading ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : null}
                                    Save Draft
                                </Button>
                            )}
                            <Button 
                                type="submit" 
                                disabled={loading} 
                                className="min-w-[140px] bg-teal-600 hover:bg-teal-500 text-white shadow-lg shadow-teal-500/20"
                            >
                                {loading ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                                {post ? "Update Post" : watchedStatus === "scheduled" ? "Schedule Post" : "Publish Post"}
                            </Button>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    );
}
