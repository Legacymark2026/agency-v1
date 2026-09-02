import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import LegalAccordion from "@/components/LegalAccordion";

export const metadata: Metadata = {
  title: "Términos y Condiciones de Uso | NEOGESTIÓN",
  description:
    "Términos y condiciones legales para el acceso y uso del sitio web corporativo de NEOGESTIÓN.",
};

export default function TerminosPage() {
  const sections = [
    {
      id: "aceptacion",
      title: "1. Aceptación y Alcance de los Términos",
      content: (
        <p>
          El acceso y navegación por el portal de <strong>NEOGESTIÓN</strong> implica la aceptación plena e incondicional de los presentes términos de uso. La firma se reserva el derecho de actualizar estas disposiciones en cualquier momento sin previo aviso.
        </p>
      ),
    },
    {
      id: "propiedad",
      title: "2. Propiedad Intelectual e Industrial",
      content: (
        <p>
          Todos los elementos gráficos, esquemas metodológicos, textos, logotipos y código fuente son propiedad exclusiva de NEOGESTIÓN International S.A., amparados por tratados internacionales de propiedad intelectual. Queda estrictamente prohibida su copia o distribución no autorizada.
        </p>
      ),
    },
    {
      id: "responsabilidad",
      title: "3. Naturaleza del Contenido e Información Estratégica",
      content: (
        <p>
          Los artículos publicados en el Magazine Corporativo poseen carácter informativo y analítico. No constituyen asesoramiento vinculante ni dictamen financiero/legal hasta la formalización de un contrato de prestación de servicios.
        </p>
      ),
    },
    {
      id: "jurisdiccion",
      title: "4. Ley Aplicable y Jurisdicción",
      content: (
        <p>
          Para cualquier discrepancia o litigio derivado de la interpretación de este sitio web, las partes se someten expresamente a la legislación y tribunales competentes de la sede central de la sociedad.
        </p>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 py-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-[#B08A1A] mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver al Inicio</span>
        </Link>

        <LegalAccordion
          title="Términos y Condiciones de Servicio"
          subtitle="Marco normativo para la interacción institucional"
          sections={sections}
          activeDoc="terminos"
        />
      </div>
    </div>
  );
}
