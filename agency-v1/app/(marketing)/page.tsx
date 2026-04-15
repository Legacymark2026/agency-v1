import { FuturisticHero } from "@/components/sections/futuristic-hero";
import { StrategicAlliances } from "@/components/sections/strategic-alliances";
import { BentoServices } from "@/components/sections/bento-services";
import { OmnichannelShowcase } from "@/components/sections/omnichannel-showcase";
import { ValueProposition } from "@/components/sections/value-proposition";
import { CaseStudies } from "@/components/sections/case-studies";
import { Methodology } from "@/components/sections/methodology";
import { LatestPosts } from "@/components/sections/latest-posts";
import { PortfolioPreview } from "@/components/sections/portfolio-preview";
import { getRecentProjects, getRecentPosts } from "@/lib/data";
import { getExperts } from "@/actions/experts";
import { TestimonialSlider } from "@/components/sections/testimonial-slider";
import { TeamGrid } from "@/components/sections/team-grid";
import { FaqAccordion } from "@/components/sections/faq-accordion";
import { Stats } from "@/components/sections/stats";
import { CTA } from "@/components/sections/cta";

export default async function HomePage() {
    const projects = await getRecentProjects(4);
    const posts = await getRecentPosts(3);
    const experts = await getExperts();

    return (
        <main className="relative bg-slate-950 text-white overflow-hidden scroll-smooth">
            {/* 12. Dense Editorial Noise */}
            <div className="bg-noise fixed inset-0 z-50 pointer-events-none mix-blend-multiply opacity-[0.015]" />

            {/* Global Spotlight Glow for "Wow Factor" */}
            <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[120%] h-[800px] bg-[radial-gradient(ellipse_at_top,rgba(20,184,166,0.08)_0%,transparent_60%)] pointer-events-none -z-10" />

            <div data-ga-section="hero"><FuturisticHero /></div>

            <div data-ga-section="lead-magnet">
                <section className="py-16 bg-gradient-to-r from-teal-900/20 to-sky-900/20 border-y border-teal-500/20">
                    <div className="max-w-4xl mx-auto text-center px-6">
                        <span className="inline-block px-3 py-1 rounded-full bg-teal-500/10 text-teal-400 text-xs font-bold mb-4 border border-teal-500/20">
                            📥 RECURSO NUEVO
                        </span>
                        <h2 className="text-3xl md:text-4xl font-black text-white mb-4">
                            Guía Gratis: Cómo Crear una Página Web que Vende
                        </h2>
                        <p className="text-slate-400 mb-8 max-w-xl mx-auto">
                            Descarga nuestra guía de 10 páginas y aprende las estrategias que usan las agencies top para convertir visitantes en clientes.
                        </p>
                        <a 
                            href="/recursos/guia-pagina-web"
                            className="inline-block bg-teal-500 hover:bg-teal-600 text-white font-bold px-8 py-4 rounded-xl transition-all hover:scale-105 shadow-lg shadow-teal-500/20"
                        >
                            Obtener Guía Gratis →
                        </a>
                    </div>
                </section>
            </div>

            <div className="relative z-10 space-y-0 pb-32">
                <div data-ga-section="alianzas"><StrategicAlliances /></div>
                <div data-ga-section="servicios"><BentoServices /></div>
                <div data-ga-section="omnichannel"><OmnichannelShowcase /></div>
                <div data-ga-section="estadisticas"><Stats /></div>
                <div data-ga-section="propuesta-valor"><ValueProposition /></div>
                <div data-ga-section="casos-de-exito"><CaseStudies /></div>
                <div data-ga-section="testimonios"><TestimonialSlider /></div>

                {/* Grid Background for Tech Section - Dark Mode */}
                <div className="relative">
                    <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.05] pointer-events-none mix-blend-screen -z-10" />
                    <div data-ga-section="metodologia"><Methodology /></div>
                </div>

                <div data-ga-section="equipo"><TeamGrid experts={experts} /></div>
                <div data-ga-section="faq"><FaqAccordion /></div>
                <div data-ga-section="cta-principal"><CTA /></div>
                <div data-ga-section="portfolio-preview"><PortfolioPreview projects={projects} /></div>
                <div data-ga-section="blog-preview"><LatestPosts posts={posts} /></div>
            </div>
        </main>
    );
}
