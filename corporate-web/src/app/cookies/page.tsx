import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ExternalLink, Shield, Settings2, BarChart3, Megaphone } from "lucide-react";
import LegalAccordion, { LegalSection } from "@/components/LegalAccordion";

export const metadata: Metadata = {
  title: "Política de Cookies | NEOGESTIÓN",
  description:
    "Política de Cookies de Consultoría de Colombia S.A.S. y NeoGestión conforme a la Ley 1581 de 2012 y directrices de la SIC.",
};

export default function CookiesPage() {
  const cookieCategories = [
    {
      name: "Cookies Técnicas o Estrictamente Necesarias",
      finalidad: "Navegación y Seguridad",
      badgeColor: "bg-amber-50 text-[#B08A1A] border-amber-200",
      icon: Shield,
      descripcion:
        "Son esenciales para el correcto funcionamiento del sitio web. Permiten la navegación fluida, el acceso a áreas seguras y el uso de las funcionalidades básicas de la plataforma. Estas cookies no requieren su consentimiento para su instalación.",
      obligatoria: true,
    },
    {
      name: "Cookies de Preferencias",
      finalidad: "Personalización",
      badgeColor: "bg-blue-50 text-[#01426F] border-blue-200",
      icon: Settings2,
      descripcion:
        "Permiten recordar sus elecciones y preferencias (ej. el idioma o la región de consulta) para ofrecerle una experiencia adaptada y más personalizada.",
      obligatoria: false,
    },
    {
      name: "Cookies de Análisis o Medición",
      finalidad: "Estadísticas y Mejora",
      badgeColor: "bg-emerald-50 text-emerald-800 border-emerald-200",
      icon: BarChart3,
      descripcion:
        "Nos permiten cuantificar el número de visitantes y analizar estadísticamente el uso que los usuarios hacen del sitio web. Esto nos ayuda a optimizar los contenidos y la navegación. Utilizamos herramientas como Google Analytics, que procesa la información de forma anonimizada.",
      obligatoria: false,
    },
    {
      name: "Cookies de Marketing y Publicitarias",
      finalidad: "Publicidad Relevante",
      badgeColor: "bg-purple-50 text-purple-800 border-purple-200",
      icon: Megaphone,
      descripcion:
        "Almacenan información del comportamiento de navegación para mostrar comunicaciones y contenidos relevantes en función de sus intereses profesionales. Estas cookies requieren su consentimiento previo para su instalación.",
      obligatoria: false,
    },
  ];

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
        <div className="space-y-5 text-slate-700 text-sm leading-relaxed">
          <p>
            A continuación, detallamos las categorías de cookies implementadas en nuestro portal:
          </p>

          {/* Tarjetas responsivas para móviles y pantallas pequeñas */}
          <div className="grid grid-cols-1 gap-4 md:hidden">
            {cookieCategories.map((c) => {
              const Icon = c.icon;
              return (
                <div
                  key={c.name}
                  className="p-4 rounded-2xl border border-slate-200 bg-slate-50/60 space-y-2.5 shadow-sm"
                >
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-white border border-slate-200 text-[#01426F]">
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className={"px-2.5 py-0.5 rounded-full text-xs font-bold border " + c.badgeColor}>
                        {c.finalidad}
                      </span>
                    </div>
                    {c.obligatoria && (
                      <span className="text-[10px] uppercase font-bold text-slate-500 bg-slate-200/80 px-2 py-0.5 rounded">
                        Requerida
                      </span>
                    )}
                  </div>
                  <h4 className="font-bold text-slate-900 text-sm">{c.name}</h4>
                  <p className="text-xs text-slate-600 leading-relaxed">{c.descripcion}</p>
                </div>
              );
            })}
          </div>

          {/* Tabla estilizada y scrollable con overflow horizontal controlado para desktop */}
          <div className="hidden md:block overflow-hidden rounded-2xl border border-slate-200 shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-[#01426F] text-white">
                  <tr>
                    <th className="p-4 font-bold uppercase tracking-wider text-xs w-[30%]">
                      Tipo de Cookie
                    </th>
                    <th className="p-4 font-bold uppercase tracking-wider text-xs w-[25%]">
                      Finalidad
                    </th>
                    <th className="p-4 font-bold uppercase tracking-wider text-xs w-[45%]">
                      Descripción
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {cookieCategories.map((c) => (
                    <tr key={c.name} className="hover:bg-slate-50 transition-colors">
                      <td className="p-4 align-top font-bold text-slate-900">
                        <div className="flex items-start gap-2.5">
                          <span className="mt-0.5 inline-block w-2 h-2 rounded-full bg-[#B08A1A] shrink-0" />
                          <span>{c.name}</span>
                        </div>
                      </td>
                      <td className="p-4 align-top">
                        <span className={"inline-block px-2.5 py-1 rounded-full text-xs font-bold border " + c.badgeColor}>
                          {c.finalidad}
                        </span>
                      </td>
                      <td className="p-4 align-top text-slate-600 leading-relaxed text-xs sm:text-sm">
                        {c.descripcion}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
          <div className="p-3.5 rounded-xl bg-slate-100 border border-slate-200 text-xs text-slate-700 font-medium">
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
              { name: "Microsoft Edge", url: "https://support.microsoft.com/es-es/microsoft-edge/eliminar-las-cookies-en-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09" },
              { name: "Apple Safari", url: "https://support.apple.com/es-es/HT201265" },
            ].map((browser) => (
              <a
                key={browser.name}
                href={browser.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 hover:border-[#B08A1A] hover:bg-amber-50/30 transition-all text-xs font-semibold text-slate-800 group"
              >
                <span>{browser.name}</span>
                <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#B08A1A] transition-colors" />
              </a>
            ))}
          </div>
        </div>
      ),
    },
    {
      id: "actualizaciones",
      title: "5. Actualizaciones de la Política de Cookies",
      content: (
        <div className="space-y-3 text-slate-700 text-sm leading-relaxed">
          <p>
            <strong>Consultoría de Colombia S.A.S.</strong> se reserva el derecho de modificar la presente Política de Cookies en función de nuevas exigencias legislativas, reglamentarias o con el fin de adaptarla a las instrucciones impartidas por la Superintendencia de Industria y Comercio (SIC).
          </p>
          <p>
            Recomendamos a los usuarios consultar periódicamente esta sección para mantenerse informados sobre cómo y para qué utilizamos las cookies.
          </p>
        </div>
      ),
    },
    {
      id: "contacto",
      title: "6. Canales de Contacto",
      content: (
        <div className="space-y-3 text-slate-700 text-sm leading-relaxed">
          <p>
            Si tiene alguna duda, inquietud o consulta acerca de nuestra Política de Cookies o el tratamiento de sus datos de navegación, puede ponerse en contacto con nuestro equipo a través de:
          </p>
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs sm:text-sm space-y-1">
            <p>
              <strong>Responsable:</strong> Consultoría de Colombia S.A.S.
            </p>
            <p>
              <strong>NIT:</strong> 804.017.909-0
            </p>
            <p>
              <strong>Correo Oficial:</strong>{" "}
              <a href="mailto:asist.gerencia@neogestion.co" className="text-[#01426F] font-bold hover:underline">
                asist.gerencia@neogestion.co
              </a>{" "}
              ·{" "}
              <a href="mailto:seguridad.informatica@neogestion.co" className="text-[#01426F] font-bold hover:underline">
                seguridad.informatica@neogestion.co
              </a>
            </p>
            <p>
              <strong>Dirección:</strong> Calle 18 No. 22C – 40, Girón, Santander, Colombia
            </p>
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
          subtitle="Última actualización: Septiembre 2026 | Lineamientos conforme a la Ley 1581 de 2012 y directrices de la SIC"
          sections={sections}
          activeDoc="cookies"
        />
      </div>
    </div>
  );
}
