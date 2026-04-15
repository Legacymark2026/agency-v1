import { GuiaWebHero } from "@/components/sections/guia-web-hero";
import { GuiaWebAnatomy } from "@/components/sections/guia-web-anatomy";
import { GuiaWebRoadmap } from "@/components/sections/guia-web-roadmap";
import { LeadMagnetForm } from "@/components/sections/lead-magnet-form";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Guía Definitiva de Páginas Web 2026 | LegacyMark",
    description: "Descubre la arquitectura exacta detrás de páginas web rentables. Más que presencia, necesitas un embudo 360° integrado con tu CRM y automatizaciones.",
    openGraph: {
        title: "La Arquitectura de una Página Web Rentable | LegacyMark",
        description: "Transforma tu web estática en un motor de captación de leads 24/7.",
    }
};

export default function GuiaWebPage() {
    return (
        <main className="relative bg-slate-950 text-white overflow-hidden scroll-smooth min-h-screen">
            {/* Global background effects to tie the page together */}
            <div className="bg-noise fixed inset-0 z-50 pointer-events-none mix-blend-multiply opacity-[0.015]" />
            <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[120%] h-[800px] bg-[radial-gradient(ellipse_at_top,rgba(20,184,166,0.08)_0%,transparent_60%)] pointer-events-none -z-10" />

            {/* Sections */}
            <GuiaWebHero />
            <GuiaWebAnatomy />
            <GuiaWebRoadmap />
            
            {/* CTA/Lead Magnet */}
            <div id="contact" className="py-12 border-t border-slate-900 bg-slate-950 relative">
                 <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,rgba(15,23,42,1)_0%,transparent_100%)] pointer-events-none" />
                 <LeadMagnetForm />
            </div>
            
            {/* Bottom Fade */}
            <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent z-20 pointer-events-none" />
        </main>
    );
}
