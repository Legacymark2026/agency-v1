import { ServiciosClient } from "./servicios-client";
import { Metadata } from "next";
import { FAQSchema, BreadcrumbSchema } from "@/components/seo/structured-data";

export const metadata: Metadata = {
    title: "Servicios de Marketing Digital y Growth | LegacyMark",
    description: "Servicios especializados en Paid Media, SEO avanzado y Estrategia CRM. Construimos ecosistemas de crecimiento para escalar tu ROI.",
    alternates: {
        canonical: "https://legacymarksas.com/es/servicios",
    },
};

export default function ServicesPage() {
    const faqs = [
        {
            question: "¿Qué incluye la auditoría SEO técnica?",
            answer: "Analizamos más de 100 puntos críticos, desde la velocidad de carga hasta la arquitectura de información y el perfil de enlaces, para identificar qué está frenando tu crecimiento orgánico."
        },
        {
            question: "¿Cómo gestionan las campañas de Paid Media?",
            answer: "Utilizamos algoritmos predictivos y experimentación rápida para optimizar tus anuncios en Meta y Google, enfocándonos 100% en el retorno de la inversión publicitaria (ROAS)."
        },
        {
            question: "¿Cuál es la diferencia entre un proyecto sprint y un retainer?",
            answer: "Un sprint es una intervención táctica con inicio y fin (ej. setup de CRM). Un retainer es una relación de largo plazo donde actuamos como tu departamento de growth externo."
        }
    ];

    const breadcrumbs = [
        { name: "Inicio", url: "https://legacymarksas.com/es" },
        { name: "Servicios", url: "https://legacymarksas.com/es/servicios" }
    ];

    return (
        <>
            <FAQSchema questions={faqs} />
            <BreadcrumbSchema items={breadcrumbs} />
            <ServiciosClient />
        </>
    );
}
