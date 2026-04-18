import { PostForm } from "@/components/cms/post-form";
import { getCategoriesForForm, getTagsForForm } from "@/actions/blog";

export default async function CreatePostPage() {
    // Pre-carga en servidor optimizada — usando caché y datos ligeros
    const [categories, tags] = await Promise.all([
        getCategoriesForForm(),
        getTagsForForm(),
    ]);

    const availableTags = tags.map((t) => t.name);

    return (
        <PostForm
            availableCategories={categories}
            availableTags={availableTags}
        />
    );
}
