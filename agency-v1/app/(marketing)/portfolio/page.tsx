import { PortfolioClient } from "@/components/portfolio/portfolio-client";
import { getPublicProjects, getProjectCategories } from "@/actions/projects";

// Next.js 15 Server Component
export default async function PortfolioPage() {
    // Fetch live data directly from the DB to completely eliminate ghosting
    const [projects, categories] = await Promise.all([
        getPublicProjects(),
        getProjectCategories()
    ]);

    return <PortfolioClient projects={projects} categories={categories} />;
}

