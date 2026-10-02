import { getCategories } from "@/actions/cms";
import { CategoriesClient } from "./categories-client";

export default async function CategoriesPage() {
    const categories = await getCategories();

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Blog Categories</h1>
                    <p className="text-gray-500 text-sm">Manage blog categories and their metadata.</p>
                </div>
            </div>

            <CategoriesClient initialCategories={categories} />
        </div>
    );
}
