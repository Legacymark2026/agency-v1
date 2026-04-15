'use client';

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import { useState } from "react";
import dynamic from "next/dynamic";
import { createPost, updatePost } from "@/actions/cms";
import { PostSchema, type PostFormData } from "@/lib/schemas";
import { Loader2, Calendar } from "lucide-react";
import { CharacterCounter } from "./character-counter";
import { ImageUploadPreview } from "./image-upload-preview";
import { CategorySelector } from "./category-selector";
import { TagInput } from "./tag-input";
import { format } from "date-fns";

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
        },
    });

    const watchedStatus = form.watch("status");
    const watchedMetaTitle = form.watch("metaTitle");
    const watchedMetaDescription = form.watch("metaDescription");

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
        form.setValue("title", e.target.value);
        if (!post) {
            const slug = e.target.value
                .normalize("NFD") // Decomposes accented characters into their base character and accent mark
                .replace(/[\u0300-\u036f]/g, "") // Removes the accent marks
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, "-") // Replaces spaces and non-alphanumeric with dashes
                .replace(/(^-|-$)+/g, ""); // Trims dashes from start and end
            form.setValue("slug", slug);
        }
    };

    return (
        <div className="max-w-7xl mx-auto">
            <div className="mb-6 flex items-center justify-between">
                <h1 className="text-3xl font-bold">{post ? "Edit Post" : "Create New Post"}</h1>
            </div>

            {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6 border border-red-200">
                    {error}
                </div>
            )}

            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Two-Column Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Content Column - Left (2/3 width) */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Title & Slug */}
                        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-semibold">Title</label>
                                <Input
                                    {...form.register("title")}
                                    onChange={handleTitleChange}
                                    placeholder="Enter your post title"
                                    className="text-lg"
                                />
                                {form.formState.errors.title && (
                                    <p className="text-sm text-red-500">{form.formState.errors.title.message}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-semibold">URL Slug</label>
                                <Input {...form.register("slug")} placeholder="post-url-slug" />
                                {form.formState.errors.slug && (
                                    <p className="text-sm text-red-500">{form.formState.errors.slug.message}</p>
                                )}
                                <p className="text-xs text-gray-500">
                                    Will be available at: /blog/{form.watch("slug") || "your-slug"}
                                </p>
                            </div>
                        </div>

                        {/* Content Editor */}
                        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 space-y-2">
                            <label className="text-sm font-semibold">Content</label>
                            <RichTextEditor
                                initialValue={post?.content || ""}
                                onChange={(html) => form.setValue("content", html)}
                                placeholder="Write your post content here..."
                            />
                            {form.formState.errors.content && (
                                <p className="text-sm text-red-500">{form.formState.errors.content.message}</p>
                            )}
                        </div>

                        {/* Excerpt */}
                        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 space-y-2">
                            <label className="text-sm font-semibold">Excerpt</label>
                            <textarea
                                {...form.register("excerpt")}
                                className="w-full min-h-[80px] p-3 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-black"
                                placeholder="Brief summary of your post (optional)"
                            />
                            <p className="text-xs text-gray-500">
                                This will be shown in post listings and previews
                            </p>
                        </div>
                    </div>

                    {/* Sidebar - Right (1/3 width) */}
                    <div className="space-y-6">
                        {/* Publishing Controls */}
                        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 space-y-4">
                            <h3 className="font-semibold text-lg">Publishing</h3>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Status</label>
                                <select
                                    {...form.register("status")}
                                    className="w-full px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-black"
                                >
                                    <option value="draft">Draft</option>
                                    <option value="published">Published</option>
                                    <option value="scheduled">Scheduled</option>
                                </select>
                            </div>

                            {watchedStatus === "scheduled" && (
                                <div className="space-y-2">
                                    <label className="text-sm font-medium flex items-center gap-2">
                                        <Calendar className="h-4 w-4" />
                                        Scheduled Date & Time
                                    </label>
                                    <Input
                                        type="datetime-local"
                                        {...form.register("scheduledDate")}
                                        className="w-full"
                                    />
                                </div>
                            )}

                            <div className="flex items-center gap-2 pt-2">
                                <input
                                    type="checkbox"
                                    id="published"
                                    {...form.register("published")}
                                    className="h-4 w-4 rounded border-gray-300 text-black focus:ring-black"
                                />
                                <label htmlFor="published" className="text-sm font-medium select-none cursor-pointer">
                                    Visible immediately
                                </label>
                            </div>
                        </div>

                        {/* SEO Optimization */}
                        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 space-y-4">
                            <h3 className="font-semibold text-lg">SEO Optimization</h3>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <label className="text-sm font-medium">Meta Title</label>
                                    <CharacterCounter current={watchedMetaTitle?.length || 0} max={60} />
                                </div>
                                <Input
                                    {...form.register("metaTitle")}
                                    placeholder="SEO title for search engines"
                                />
                                <p className="text-xs text-gray-500">
                                    Defaults to post title if empty
                                </p>
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <label className="text-sm font-medium">Meta Description</label>
                                    <CharacterCounter current={watchedMetaDescription?.length || 0} max={160} />
                                </div>
                                <textarea
                                    {...form.register("metaDescription")}
                                    className="w-full min-h-[80px] p-3 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-black text-sm text-gray-900 bg-white"
                                    placeholder="SEO description for search engines"
                                />
                                <p className="text-xs text-gray-500">
                                    How your post appears in Google search results
                                </p>
                            </div>

                            {/* Google Search Preview */}
                            {(watchedMetaTitle || watchedMetaDescription || form.watch("title")) && (
                                <div className="mt-4 p-3 bg-gray-50 rounded-md border border-gray-200">
                                    <p className="text-xs font-medium text-gray-500 mb-2">Google Preview:</p>
                                    <div className="space-y-1">
                                        <div className="text-blue-600 text-sm font-medium line-clamp-1">
                                            {watchedMetaTitle || form.watch("title") || "Your Post Title"}
                                        </div>
                                        <div className="text-xs text-green-700">
                                            yoursite.com/blog/{form.watch("slug") || "post-url"}
                                        </div>
                                        <div className="text-xs text-gray-600 line-clamp-2">
                                            {watchedMetaDescription || form.watch("excerpt") || "Your post description will appear here..."}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Featured Image */}
                        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 space-y-4">
                            <h3 className="font-semibold text-lg">Featured Image</h3>
                            <ImageUploadPreview
                                imageUrl={form.watch("coverImage") || ""}
                                imageAlt={form.watch("imageAlt") || ""}
                                onImageUrlChange={(url) => form.setValue("coverImage", url)}
                                onImageAltChange={(alt) => form.setValue("imageAlt", alt)}
                            />
                        </div>

                        {/* Categories */}
                        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 space-y-4">
                            <h3 className="font-semibold text-lg">Categories</h3>
                            <CategorySelector
                                categories={availableCategories}
                                selectedIds={form.watch("categoryIds") || []}
                                onChange={(ids) => form.setValue("categoryIds", ids)}
                            />
                        </div>

                        {/* Tags */}
                        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 space-y-4">
                            <h3 className="font-semibold text-lg">Tags</h3>
                            <TagInput
                                value={form.watch("tagNames") || []}
                                onChange={(tags) => form.setValue("tagNames", tags)}
                                suggestions={availableTags}
                            />
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 flex items-center justify-between">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => router.back()}
                        disabled={loading}
                    >
                        Cancel
                    </Button>

                    <div className="flex gap-3">
                        {watchedStatus === "draft" && (
                            <Button
                                type="submit"
                                variant="outline"
                                disabled={loading}
                            >
                                {loading ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : null}
                                Save Draft
                            </Button>
                        )}
                        <Button type="submit" disabled={loading} className="min-w-[140px]">
                            {loading ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : null}
                            {post ? "Update Post" : watchedStatus === "scheduled" ? "Schedule Post" : "Publish Post"}
                        </Button>
                    </div>
                </div>
            </form>
        </div>
    );
}
