import { getTranslations } from "next-intl/server";
import { AuditClient } from "./audit-client";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    let title = "Auditoría Web Gratuita | LegacyMark";
    let description = "Analiza tu dominio en tiempo real para evaluar velocidad de carga, SEO, usabilidad móvil y presencia en Google Maps. Obtén recomendaciones instantáneas.";

    try {
        const t = await getTranslations({ locale, namespace: "nav" });
        const auditNav = t("audit");
        title = `${auditNav} Gratis | LegacyMark`;
    } catch (e) {
        // ignore and fallback to defaults
    }

    return {
        title,
        description,
        openGraph: {
            title,
            description,
            type: "website"
        }
    };
}

export default async function AuditoriaPage() {
    return (
        <main className="relative min-h-screen bg-slate-950 text-white overflow-hidden pt-24 pb-16">
            {/* Background spotlight glows */}
            <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[120%] h-[600px] bg-[radial-gradient(ellipse_at_top,rgba(20,184,166,0.06)_0%,transparent_60%)] pointer-events-none -z-10" />
            <div className="absolute bottom-[10%] right-[-10%] w-[500px] h-[500px] bg-[radial-gradient(ellipse,rgba(124,58,237,0.04)_0%,transparent_70%)] pointer-events-none -z-10" />
            <div className="bg-noise fixed inset-0 z-50 pointer-events-none mix-blend-multiply opacity-[0.015]" />

            {/* Content */}
            <div className="container mx-auto px-4 relative z-10">
                <AuditClient />
            </div>
        </main>
    );
}
