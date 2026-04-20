import { PortfolioClient } from "@/components/portfolio/portfolio-client";
import { getPublicProjects, getProjectCategories } from "@/actions/projects";
import { getSocialProfiles } from "@/actions/social-profiles";

// Next.js 15 Server Component
export default async function PortfolioPage() {
    // Fetch live data directly from the DB
    const [projects, categories, socialProfiles] = await Promise.all([
        getPublicProjects(),
        getProjectCategories(),
        getSocialProfiles(),
    ]);

    return <PortfolioClient projects={projects} categories={categories} socialProfiles={socialProfiles} />;
}
