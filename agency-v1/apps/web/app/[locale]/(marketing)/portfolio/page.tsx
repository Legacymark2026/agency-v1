import { PortfolioClient } from "@/components/portfolio/portfolio-client";
import { getPublicProjects, getProjectCategories } from "@/actions/projects";
import { getSocialProfiles } from "@/actions/social-profiles";

// ISR: Revalida el portfolio cada hora.
// getPublicProjects + getCategories + getSocialProfiles dejan de ejecutarse en cada request.
export const revalidate = 3600;

// Next.js 15 Server Component
export default async function PortfolioPage() {
    // Fetch live data directly from the DB
    let projects = [];
    let categories = [];
    let socialProfiles = [];

    try {
        [projects, categories, socialProfiles] = await Promise.all([
            getPublicProjects(),
            getProjectCategories(),
            getSocialProfiles(),
        ]);
    } catch (error) {
        console.error("[PortfolioPage] Non-fatal: Failed to load portfolio data:", error);
    }

    return <PortfolioClient projects={projects} categories={categories} socialProfiles={socialProfiles} />;
}
