import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import LegalAccordion from "@/components/LegalAccordion";

export const metadata: Metadata = {
  title: "Política de Privacidad & Datos | NEOGESTIÓN",
  description:
    "Políticas de tratamiento de datos personales, derechos ARCO y confidencialidad ISO 27001 de NEOGESTIÓN.",
};

export default function PrivacidadPage() {
  const sections = [
    {
      id: "responsable",
      title: "1. Responsable del Tratamiento y Datos de Identidad",
      content: (
        <p>
          <strong>NEOGESTIÓN International S.A.</strong> (en adelante, “La Firma”), con sede central en Torre Empresarial NEOGESTIÓN, Nivel 28, es el responsable del tratamiento de los datos personales recopilados a través de este portal corporativo y sus canales de interacción directiva.
        </p>
      ),
    },
    {
      id: "recopilacion",
      title: "2. Información Personal Recopilada",
      content: (
        <div>
          <p>Tratamos exclusivamente información suministrada con fines profesionales:</p>
          <ul className="list-disc pl-5 mt-2 space-y-1 text-slate-600 text-xs sm:text-sm">
            <li>Datos identificativos: Nombre completo, cargo y empresa u organización.</li>
            <li>Datos de contacto directivo: Correo electrónico corporativo y teléfono laboral.</li>
            <li>Detalles del requerimiento operativo y acuerdos preliminares de confidencialidad.</li>
          </ul>
        </div>
      ),
    },
    {
      id: "finalidad",
      title: "3. Finalidad Legítima del Tratamiento",
      content: (
        <div>
          <p>Sus datos se utilizan para los siguientes fines:</p>
          <ul className="list-disc pl-5 mt-2 space-y-1 text-slate-600 text-xs sm:text-sm">
            <li>Coordinar diagnósticos estratégicos y reuniones privadas con los socios directores.</li>
            <li>Elaborar y remitir propuestas técnico-económicas de consultoría.</li>
            <li>Envío exclusivo de análisis del Magazine Corporativo previa suscripción.</li>
          </ul>
        </div>
      ),
    },
    {
      id: "seguridad",
      title: "4. Salvaguardas de Seguridad y Confidencialidad ISO 27001",
      content: (
        <p>
          Implementamos protocolos de cifrado robusto y controles de acceso estricto conformes a la norma ISO/IEC 27001 y SOC 2 Tipo II, asegurando que su información jamás sea compartida ni transferida sin autorización formal.
        </p>
      ),
    },
    {
      id: "derechos",
      title: "5. Ejercicio de Derechos ARCO y Contacto",
      content: (
        <p>
          El titular podrá ejercer en cualquier momento sus derechos de Acceso, Rectificación, Cancelación y Oposición remitiendo un correo a:{" "}
          <strong className="text-[#B08A1A]">privacidad@neogestion.com</strong>.
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
          title="Política de Privacidad y Protección de Datos"
          subtitle="Última actualización: Enero 2025 | Cumplimiento RGPD e ISO 27001"
          sections={sections}
          activeDoc="privacidad"
        />
      </div>
    </div>
  );
}
