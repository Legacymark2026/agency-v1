import { FuturisticHero } from "@/components/sections/futuristic-hero";
import { OrganizationSchema, WebSiteSchema, FAQSchema } from "@/components/seo/structured-data";
import { siteConfig } from "@/lib/site-config";
import { getRecentProjects, getRecentPosts } from "@/lib/data";
import { getExperts } from "@/actions/experts";
import { Link } from "@/i18n/navigation";
import dynamic from "next/dynamic";

// ── OPTIMIZATION: Progressive Hydration ──────────────────
// Below-the-fold sections are loaded dynamically to prioritize 
// the FuturisticHero (LCP) and reduce the initial JS execution time.

const StrategicAlliances = dynamic(() => import("@/components/sections/strategic-alliances").then(mod => mod.StrategicAlliances));
const BentoServices = dynamic(() => import("@/components/sections/bento-services").then(mod => mod.BentoServices));
const OmnichannelShowcase = dynamic(() => import("@/components/sections/omnichannel-showcase").then(mod => mod.OmnichannelShowcase));
const ValueProposition = dynamic(() => import("@/components/sections/value-proposition").then(mod => mod.ValueProposition));
const CaseStudies = dynamic(() => import("@/components/sections/case-studies").then(mod => mod.CaseStudies));
const Methodology = dynamic(() => import("@/components/sections/methodology").then(mod => mod.Methodology));
const LatestPosts = dynamic(() => import("@/components/sections/latest-posts").then(mod => mod.LatestPosts));
const PortfolioPreview = dynamic(() => import("@/components/sections/portfolio-preview").then(mod => mod.PortfolioPreview));
const TestimonialSlider = dynamic(() => import("@/components/sections/testimonial-slider").then(mod => mod.TestimonialSlider));
const TeamGrid = dynamic(() => import("@/components/sections/team-grid").then(mod => mod.TeamGrid));
const FaqAccordion = dynamic(() => import("@/components/sections/faq-accordion").then(mod => mod.FaqAccordion));
const Stats = dynamic(() => import("@/components/sections/stats").then(mod => mod.Stats));
const CTA = dynamic(() => import("@/components/sections/cta").then(mod => mod.CTA));

export default async function HomePage() {
    const projects = await getRecentProjects(4);
    const posts = await getRecentPosts(3);
    const experts = await getExperts();

    return (
        <main className="relative bg-slate-950 text-white overflow-hidden scroll-smooth">
            <OrganizationSchema
                name={siteConfig.name}
                url={siteConfig.url}
                logo={`${siteConfig.url}/logo.png`}
                sameAs={[
                    siteConfig.links.linkedin,
                    siteConfig.links.facebook,
                    siteConfig.links.instagram,
                    siteConfig.links.whatsapp
                ]}
                description={siteConfig.description}
            />
            <WebSiteSchema
                name={siteConfig.name}
                url={siteConfig.url}
                searchUrl={`${siteConfig.url}/search?q={search_term_string}`}
            />
            <FAQSchema
                questions={[
                    { question: "¿Cómo garantizan que la IA realmente genere retorno y no sea solo una tendencia?", answer: "No implementamos IA de forma aislada; diseñamos Arquitecturas de Autonomía. Nuestro protocolo comienza con el mapeo de fricciones operativas y cuellos de botella en tu embudo de ventas. Desarrollamos agentes personalizados que se integran a tu stack tecnológico actual (CRM, APIs de pauta) para automatizar la captura y calificación de leads en tiempo real. La meta no es 'usar IA', es reducir tu costo de adquisición (CAC) y liberar el talento humano para tareas de cierre de alto impacto." },
                    { question: "¿Por qué utilizan Next.js y arquitecturas de microservicios para sus proyectos?", answer: "La autoridad digital se construye sobre la velocidad y la escalabilidad. Utilizamos Next.js porque ofrece el rendimiento más alto del mercado (Core Web Vitals), esencial para el SEO técnico y la retención de usuarios. Al trabajar con microservicios y bases de datos optimizadas (PostgreSQL/Redis), garantizamos que tu ecosistema digital sea capaz de soportar picos de tráfico masivos y expansión internacional sin degradación del servicio ni deuda técnica." },
                    { question: "¿Cómo solucionan la pérdida de datos de conversión por las restricciones de privacidad actuales?", answer: "Implementamos Protocolos de Medición de Lazo Cerrado. Ante las limitaciones de las cookies de terceros, integramos la API de Conversiones (CAPI) directamente desde tu servidor. Esto nos permite enviar señales de datos precisas a las plataformas de pauta (Meta, Google), recuperando la visibilidad del ROAS real y permitiendo que los algoritmos de aprendizaje automático optimicen tus campañas con datos de primera fuente, no con suposiciones." },
                    { question: "¿Qué estrategia siguen para posicionar una marca en mercados competitivos como EE.UU. o España?", answer: "La expansión no es solo traducción, es Localización de Autoridad. Aplicamos estrategias de SEO Internacional dinámico y arquitecturas de contenido específicas por región. Analizamos los motores de respuesta (AEO) de cada mercado para asegurar que tu marca sea la solución recomendada por la IA. Combinamos esto con una infraestructura técnica que detecta la ubicación del usuario para entregar una experiencia de carga ultrarrápida desde el nodo más cercano, eliminando cualquier fricción geográfica." },
                    { question: "¿Cómo es el seguimiento una vez lanzado el ecosistema digital?", answer: "LegacyMark no entrega proyectos, gestiona activos digitales. Cada cliente tiene acceso a su propio Client Terminal, donde monitoreamos en tiempo real el estado de los protocolos activos, métricas de rendimiento y actualizaciones de seguridad mTLS. Operamos bajo un modelo de iteración continua: utilizamos los datos del mercado para ajustar la estrategia mensualmente, asegurando que tu infraestructura evolucione al mismo ritmo que la tecnología." }
                ]}
            />

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
                        <Link 
                            href="/recursos/guia-pagina-web"
                            className="inline-block bg-teal-500 hover:bg-teal-600 text-white font-bold px-8 py-4 rounded-xl transition-all hover:scale-105 shadow-lg shadow-teal-500/20"
                        >
                            Obtener Guía Gratis →
                        </Link>
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
