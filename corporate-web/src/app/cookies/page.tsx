import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ExternalLink } from "lucide-react";
import LegalAccordion, { LegalSection } from "@/components/LegalAccordion";

export const metadata: Metadata = {
  title: "Política de Cookies | NEOGESTIÓN",
  description:
    "Política de Cookies de Consultoría de Colombia S.A.S. y NeoGestión conforme a la Ley 1581 de 2012 y directrices de la SIC.",
};

export default function CookiesPage() {
  const sections: LegalSection[] = [
    {
      id: "introduccion",
      title: "Introducción y Alcance",
      content: (
        <div className="space-y-3 text-slate-700 text-sm leading-relaxed">
          <p>
            En <strong>Consultoría de Colombia S.A.S.</strong>, utilizamos cookies propias y de terceros para mejorar su experiencia de navegación y ofrecerle nuestros servicios y herramientas de gestión de manera más eficiente.
          </p>
          <p>
            Esta Política de Cookies le explica detalladamente qué son las cookies, qué tipos utilizamos, con qué finalidad y cómo puede gestionarlas o deshabilitarlas, en cumplimiento de la <strong>Ley 1581 de 2012</strong> y las directrices emitidas por la <strong>Superintendencia de Industria y Comercio (SIC)</strong>.
          </p>
        </div>
      ),
    },
    {
      id: "que-son-cookies",
      title: "1. ¿Qué son las Cookies?",
      content: (
        <div className="space-y-3 text-slate-700 text-sm leading-relaxed">
          <p>
            Las cookies son pequeños archivos de texto que se descargan e instalan en su dispositivo (computadora, teléfono inteligente o tableta) al visitar un sitio web.
          </p>
          <p>
            Permiten que el sitio recuerde información sobre su visita y sus preferencias, como su idioma preferido, el tiempo de permanencia o las secciones visitadas, para facilitar su siguiente visita y hacer que la plataforma resulte más útil, ágil y personalizada.
          </p>
        </div>
      ),
    },
    {
      id: "tipos-cookies",
      title: "2. Tipos de Cookies que Utilizamos y sus Finalidades",
      content: (
        <div className="space-y-4 text-slate-700 text-sm leading-relaxed">
          <p>
            A continuación, detallamos las categorías de cookies implementadas en nuestro portal:
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border border-slate-200 rounded-2xl overflow-hidden">
              <thead className="bg-[#01426F] text-white">
                <tr>
                  <th className="p-3.5 font-bold uppercase tracking-wider">Tipo de Cookie</th>
                  <th className="p-3.5 font-bold uppercase tracking-wider">Finalidad</th>
                  <th className="p-3.5 font-bold uppercase tracking-wider">Descripción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                <tr className="hover:bg-slate-50 transition-colors">
                  <td className="p-3.5 font-bold text-slate-900 whitespace-nowrap">
                    Cookies Técnicas o Estrictamente Necesarias
                  </td>
                  <td className="p-3.5 text-[#B08A1A] font-semibold whitespace-nowrap">
                    Navegación y Seguridad
                  </td>
                  <td className="p-3.5 text-slate-600">
                    Son esenciales para el correcto funcionamiento del sitio web. Permiten la navegación fluida, el acceso a áreas seguras y el uso de las funcionalidades básicas de la plataforma. Estas cookies no requieren su consentimiento para su instalación.
                  </td>
                </tr>
                <tr className="hover:bg-slate-50 transition-colors">
                  <td className="p-3.5 font-bold text-slate-900 whitespace-nowrap">
                    Cookies de Preferencias
                  </td>
                  <td className="p-3.5 text-[#01426F] font-semibold whitespace-nowrap">
                    Personalización
                  </td>
                  <td className="p-3.5 text-slate-600">
                    Permiten recordar sus elecciones y preferencias (ej. el idioma o la región de consulta) para ofrecerle una experiencia adaptada y más personalizada.
                  </td>
                </tr>
                <tr className="hover:bg-slate-50 transition-colors">
                  <td className="p-3.5 font-bold text-slate-900 whitespace-nowrap">
                    Cookies de Análisis o Medición
                  </td>
                  <td className="p-3.5 text-emerald-700 font-semibold whitespace-nowrap">
                    Estadísticas y Mejora
                  </td>
                  <td className="p-3.5 text-slate-600">
                    Nos permiten cuantificar el número de visitantes y analizar estadísticamente el uso que los usuarios hacen del sitio web. Esto nos ayuda a optimizar los contenidos y la navegación. Utilizamos herramientas como Google Analytics, que procesa la información de forma anonimizada.
                  </td>
                </tr>
                <tr className="hover:bg-slate-50 transition-colors">
                  <td className="p-3.5 font-bold text-slate-900 whitespace-nowrap">
                    Cookies de Marketing y Publicitarias
                  </td>
                  <td className="p-3.5 text-purple-700 font-semibold whitespace-nowrap">
                    Publicidad Relevante
                  </td>
                  <td className="p-3.5 text-slate-600">
                    Almacenan información del comportamiento de navegación para mostrar comunicaciones y contenidos relevantes en función de sus intereses profesionales. Estas cookies requieren su consentimiento previo para su instalación.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      ),
    },
    {
      id: "consentimiento",
      title: "3. Su Consentimiento y Configuración",
      content: (
        <div className="space-y-3 text-slate-700 text-sm leading-relaxed">
          <p>
            Al acceder a nuestro sitio web, se le presentará un banner informativo que le permitirá:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm text-slate-600">
            <li>
              <strong>Aceptar todas las cookies:</strong> Otorga su consentimiento informado para el uso de todas las cookies descritas en esta política.
            </li>
            <li>
              <strong>Rechazar cookies no esenciales:</strong> En este caso, únicamente se instalarán las cookies técnicas necesarias para la operatividad y seguridad de la navegación. Su decisión será respetada cabalmente y puede ser modificada en cualquier momento.
            </li>
          </ul>
          <p className="pt-2">
            Usted puede revocar o ajustar su consentimiento en cualquier momento a través del panel de configuración de cookies disponible en el pie de página de nuestro sitio web o mediante las opciones de configuración de su navegador web.
          </p>
          <div className="p-3 rounded-xl bg-slate-100 border border-slate-200 text-xs text-slate-700 font-medium">
            Le recordamos que rechazar las cookies no esenciales no afecta en modo alguno su capacidad para explorar y utilizar los contenidos del sitio.
          </div>
        </div>
      ),
    },
    {
      id: "gestion-navegador",
      title: "4. Gestión de Cookies en su Navegador",
      content: (
        <div className="space-y-4 text-slate-700 text-sm leading-relaxed">
          <p>
            Usted puede configurar su navegador de Internet para que le avise antes de que se almacenen cookies o para bloquearlas por completo. A continuación, encontrará los enlaces a las guías oficiales de soporte de los principales navegadores:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { name: "Google Chrome", url: "https://support.google.com/chrome/answer/95647" },
              { name: "Mozilla Firefox", url: "https://support.mozilla.org/es/kb/habilitar-y-deshabilitar-cookies-sitios-web-rastrear-preferencias" },
              { name: "Apple Safari", url: "https://support.apple.com/es-es/guide/safari/sfri11471/mac" },
              { name: "Microsoft Edge", url: "https://support.microsoft.com/es-es/microsoft-edge/eliminar-las-cookies-en-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09" },
            ].map((browser) => (
              <a
                key={browser.name}
                href={browser.url}
                target="_blank"
                rel="noopener noreferrer"
                className="p-3.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 flex items-center justify-between group transition-colors"
              >
                <span className="text-xs font-bold text-slate-800">{browser.name}</span>
                <ExternalLink className="w-4 h-4 text-[#B08A1A] group-hover:translate-x-0.5 transition-transform" />
              </a>
            ))}
          </div>
          <div className="pt-3 border-t border-slate-200 text-xs text-slate-600">
            Para mayor información sobre el tratamiento de sus datos personales y el ejercicio de sus derechos, le invitamos a consultar nuestra{" "}
            <Link href="/privacidad" className="font-bold text-[#01426F] underline">
              Política de Privacidad y Tratamiento de Datos Personales
            </Link>.
          </div>
        </div>
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
          subtitle="Última actualización: Septiembre 2026 | Transparencia y cumplimiento de directrices SIC"
          sections={sections}
          activeDoc="cookies"
        />
      </div>
    </div>
  );
}
