import { PortfolioClient } from "@/components/portfolio/portfolio-client";
import { getPublicProjects, getProjectCategories } from "@/actions/projects";

// Next.js 15 Server Component
export default async function PortfolioPage() {
    // Fetch live data directly from the DB to completely eliminate ghosting
    let projects = [];
    let categories = [];

    try {
        [projects, categories] = await Promise.all([
            getPublicProjects(),
            getProjectCategories()
        ]);
    } catch (error) {
        console.error("[PortfolioPage] Non-fatal: Failed to load portfolio data:", error);
    }

    return <PortfolioClient projects={projects} categories={categories} />;
}

