import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import LegalAccordion from "@/components/LegalAccordion";

export const metadata: Metadata = {
  title: "Política de Cookies | NEOGESTIÓN",
  description:
    "Información sobre el uso de cookies técnicas y de rendimiento en el portal de NEOGESTIÓN.",
};

export default function CookiesPage() {
  const sections = [
    {
      id: "definicion",
      title: "1. ¿Qué son las Cookies y cuál es su Función?",
      content: (
        <p>
          Las cookies son archivos de datos mínimos que un sitio web almacena en el navegador del usuario al visitarlo. Se emplean para garantizar la operatividad de la plataforma, recordar preferencias de visualización y monitorear la velocidad de respuesta.
        </p>
      ),
    },
    {
      id: "clasificacion",
      title: "2. Tipos de Cookies Implementadas en NEOGESTIÓN",
      content: (
        <div>
          <p>Utilizamos únicamente cookies indispensables y métricas agregadas:</p>
          <ul className="list-disc pl-5 mt-2 space-y-1.5 text-slate-600 text-xs sm:text-sm">
            <li>
              <strong>Cookies Técnicas Esenciales:</strong> Necesarias para la navegación fluida, la seguridad de las sesiones y la renderización rápida de componentes.
            </li>
            <li>
              <strong>Cookies Analíticas Anónimas:</strong> Permiten recopilar estadísticas totalmente despersonalizadas sobre páginas visitadas y tiempos de carga.
            </li>
          </ul>
        </div>
      ),
    },
    {
      id: "configuracion",
      title: "3. Cómo Gestionar o Desactivar las Cookies",
      content: (
        <p>
          El usuario puede revocar en cualquier momento el almacenamiento de cookies configurando las opciones de privacidad de su navegador web (Chrome, Safari, Firefox, Edge).
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
          title="Política de Cookies"
          subtitle="Transparencia y privacidad en su navegación"
          sections={sections}
          activeDoc="cookies"
        />
      </div>
    </div>
  );
}
