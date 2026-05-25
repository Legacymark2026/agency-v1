import { FlyeringHero } from "@/components/sections/flyering-hero";
import { FlyeringServices } from "@/components/sections/flyering-services";
import { FlyeringBenefits } from "@/components/sections/flyering-benefits";
import { LeadMagnetForm } from "@/components/sections/lead-magnet-form";
import { CaseStudies } from "@/components/sections/case-studies";
import { TestimonialSlider } from "@/components/sections/testimonial-slider";
import { StrategicAlliances } from "@/components/sections/strategic-alliances";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Agencia de Marketing Digital y Automatización | LegacyMark",
    description: "Impulsa tu negocio con estrategias de marketing 360°, diseño web, SEO y automatización de procesos.",
};

export default function FlyeringPage() {
    return (
        <main className="relative bg-slate-950 text-white overflow-hidden scroll-smooth min-h-screen">
            {/* Dense Editorial Noise */}
            <div className="bg-noise fixed inset-0 z-50 pointer-events-none mix-blend-multiply opacity-[0.015]" />

            {/* Global Spotlight Glow */}
            <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[120%] h-[800px] bg-[radial-gradient(ellipse_at_top,rgba(20,184,166,0.08)_0%,transparent_60%)] pointer-events-none -z-10" />

            <FlyeringHero />
            <StrategicAlliances />
            <FlyeringServices />
            <FlyeringBenefits />
            <CaseStudies />
            <TestimonialSlider />
            <LeadMagnetForm />
        </main>
    );
}
