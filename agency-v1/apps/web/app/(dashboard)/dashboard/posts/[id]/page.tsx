import { PostForm } from "@/components/cms/post-form";
import { getPost } from "@/actions/cms";
import { getCategoriesForForm, getTagsForForm } from "@/actions/blog";
import { notFound } from "next/navigation";

interface PageProps {
    params: Promise<{ id: string }>;
}

export default async function EditPostPage({ params }: PageProps) {
    const { id } = await params;

    // Fetch post and form options concurrently
    const [post, categories, tags] = await Promise.all([
        getPost(id),
        getCategoriesForForm(),
        getTagsForForm(),
    ]);

    if (!post) {
        notFound();
    }

    const availableTags = tags.map((t) => t.name);

    return (
        <PostForm
            post={post}
            availableCategories={categories}
            availableTags={availableTags}
        />
    );
}
