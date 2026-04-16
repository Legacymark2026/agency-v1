import { PortfolioClient } from "@/components/portfolio/portfolio-client";
import { getPublicProjects, getProjectCategories } from "@/actions/projects";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Portfolio de Proyectos | LegacyMark",
    description: "Explora nuestros casos de éxito y proyectos destacados en marketing digital, desarrollo web y automatización.",
    alternates: {
        canonical: "https://legacymarksas.com/es/portfolio",
    },
};

// Next.js 15 Server Component
export default async function PortfolioPage() {
    // Fetch live data directly from the DB to completely eliminate ghosting
    const [projects, categories] = await Promise.all([
        getPublicProjects(),
        getProjectCategories()
    ]);

    return <PortfolioClient projects={projects} categories={categories} />;
}
