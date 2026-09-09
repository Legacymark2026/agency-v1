import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import LegalAccordion, { LegalSection } from "@/components/LegalAccordion";

export const metadata: Metadata = {
  title: "Términos y Condiciones de Uso | NEOGESTIÓN",
  description:
    "Términos y condiciones legales para el acceso y uso del sitio web, plataforma SaaS y aplicación móvil de NeoGestión y Consultoría de Colombia S.A.S.",
};

export default function TerminosPage() {
  const sections: LegalSection[] = [
    {
      id: "aceptacion",
      title: "1. Aceptación",
      content: (
        <div className="space-y-3 text-slate-700 text-sm leading-relaxed">
          <p>
            Al acceder o utilizar el sitio{" "}
            <a
              href="https://neogestion.software/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#01426F] font-semibold underline"
            >
              neogestion.software
            </a>
            , la plataforma web NeoGestión o la aplicación móvil NeoGestión (paquete Android{" "}
            <code className="bg-slate-100 text-slate-800 px-1.5 py-0.5 rounded font-mono text-xs">
              app.neogestion.io
            </code>
            ), usted acepta estos Términos y Condiciones y la{" "}
            <a
              href="https://neogestion.software/politica-de-privacidad.html"
              className="text-[#01426F] font-semibold underline"
            >
              Política de Privacidad
            </a>
            . Si no está de acuerdo, no debe usar el servicio.
          </p>
        </div>
      ),
    },
    {
      id: "descripcion-servicio",
      title: "2. Descripción del servicio",
      content: (
        <div className="space-y-3 text-slate-700 text-sm leading-relaxed">
          <p>
            <strong>NeoGestión</strong> es una solución de software (SaaS / aplicación móvil) orientada a apoyar sistemas de gestión empresarial (calidad, ambiental, seguridad y salud en el trabajo y módulos relacionados), permitiendo a empresas autorizadas gestionar usuarios, tareas, documentos, evidencias y flujos de trabajo según su configuración contratada.
          </p>
        </div>
      ),
    },
    {
      id: "usuarios-autorizados",
      title: "3. Usuarios autorizados",
      content: (
        <div className="space-y-3 text-slate-700 text-sm leading-relaxed">
          <ul className="list-disc pl-5 space-y-2 text-xs sm:text-sm text-slate-600">
            <li>El acceso se otorga a personas naturales autorizadas por la empresa cliente contratante.</li>
            <li>Cada usuario es responsable de la confidencialidad de su usuario y contraseña.</li>
            <li>Está prohibido compartir credenciales, intentar acceder a cuentas ajenas o vulnerar la seguridad del sistema.</li>
          </ul>
        </div>
      ),
    },
    {
      id: "uso-permitido",
      title: "4. Uso permitido",
      content: (
        <div className="space-y-3 text-slate-700 text-sm leading-relaxed">
          <p>El usuario se compromete a:</p>
          <ul className="list-disc pl-5 space-y-2 text-xs sm:text-sm text-slate-600">
            <li>Usar el servicio solo para fines lícitos y relacionados con la actividad de su organización.</li>
            <li>No cargar contenidos ilícitos, difamatorios, que infrinjan derechos de terceros o malware.</li>
            <li>No realizar ingeniería inversa, scrapers abusivos ni ataques contra la infraestructura.</li>
            <li>Respetar la propiedad intelectual de NeoGestión y de terceros.</li>
          </ul>
        </div>
      ),
    },
    {
      id: "contenido-datos-cliente",
      title: "5. Contenido y datos de la empresa cliente",
      content: (
        <div className="space-y-3 text-slate-700 text-sm leading-relaxed">
          <p>
            La información operativa cargada por cada empresa (documentos, evidencias, registros de personal autorizado, etc.) pertenece a esa empresa o a sus titulares conforme a la ley y a los contratos aplicables. <strong>NeoGestión</strong> actúa como proveedor tecnológico para hospedar y procesar dicha información en el marco del servicio.
          </p>
        </div>
      ),
    },
    {
      id: "disponibilidad-soporte",
      title: "6. Disponibilidad y soporte",
      content: (
        <div className="space-y-3 text-slate-700 text-sm leading-relaxed">
          <p>
            Procuramos mantener el servicio disponible y seguro, pero no garantizamos disponibilidad ininterrumpida. Pueden existir ventanas de mantenimiento, fallas de red de terceros o eventos de fuerza mayor. El soporte se brinda según los canales y niveles acordados con cada cliente.
          </p>
        </div>
      ),
    },
    {
      id: "propiedad-intelectual",
      title: "7. Propiedad intelectual",
      content: (
        <div className="space-y-3 text-slate-700 text-sm leading-relaxed">
          <p>
            El software, marcas, diseños, documentación y demás elementos de NeoGestión son propiedad de <strong>Consultoría de Colombia S.A.S.</strong> o de sus licenciantes. La contratación del servicio otorga una licencia de uso limitada, no exclusiva e intransferible, conforme al plan contratado, sin cesión de derechos de propiedad.
          </p>
        </div>
      ),
    },
    {
      id: "limitacion-responsabilidad",
      title: "8. Limitación de responsabilidad",
      content: (
        <div className="space-y-3 text-slate-700 text-sm leading-relaxed">
          <p>
            En la máxima medida permitida por la ley colombiana, <strong>Consultoría de Colombia S.A.S.</strong> no será responsable por daños indirectos, lucro cesante, pérdida de datos atribuible a mal uso del usuario, configuración incorrecta por parte de la empresa cliente, o fallas de terceros (conectividad, dispositivos, proveedores externos), más allá de lo pactado contractualmente con cada cliente.
          </p>
        </div>
      ),
    },
    {
      id: "suspension-terminacion",
      title: "9. Suspensión y terminación",
      content: (
        <div className="space-y-3 text-slate-700 text-sm leading-relaxed">
          <p>
            Podemos suspender o restringir el acceso ante incumplimiento de estos términos, riesgo de seguridad, falta de pago según contrato, o requerimiento legal. La terminación del contrato con la empresa cliente implica la pérdida de acceso de sus usuarios según lo acordado.
          </p>
        </div>
      ),
    },
    {
      id: "proteccion-datos",
      title: "10. Protección de datos personales",
      content: (
        <div className="space-y-3 text-slate-700 text-sm leading-relaxed">
          <p>
            El tratamiento de datos personales se rige por la{" "}
            <a
              href="https://neogestion.software/politica-de-privacidad.html"
              className="text-[#01426F] font-semibold underline"
            >
              Política de Privacidad
            </a>{" "}
            publicada en{" "}
            <a
              href="https://neogestion.software/politica-de-privacidad.html"
              className="text-[#01426F] font-semibold underline"
            >
              https://neogestion.software/politica-de-privacidad.html
            </a>{" "}
            y por la <strong>Ley 1581 de 2012</strong> y normas complementarias de la República de Colombia.
          </p>
        </div>
      ),
    },
    {
      id: "ley-aplicable",
      title: "11. Ley aplicable",
      content: (
        <div className="space-y-3 text-slate-700 text-sm leading-relaxed">
          <p>
            Estos términos se interpretan conforme a las leyes de la <strong>República de Colombia</strong>. Cualquier controversia se tramitará ante los jueces competentes de Colombia, sin perjuicio de mecanismos alternativos pactados en contratos particulares con clientes.
          </p>
        </div>
      ),
    },
    {
      id: "contacto",
      title: "12. Contacto",
      content: (
        <div className="space-y-3 text-slate-700 text-sm leading-relaxed">
          <p>
            <strong>Consultoría de Colombia S.A.S. — NeoGestión Software</strong>
          </p>
          <p>Calle 18 No. 22C – 40, Girón, Santander, Colombia</p>
          <p>
            Correos de atención:{" "}
            <a href="mailto:asist.gerencia@neogestion.co" className="text-[#01426F] font-semibold underline">
              asist.gerencia@neogestion.co
            </a>{" "}
            ·{" "}
            <a href="mailto:dir.comercial@neogestion.co" className="text-[#01426F] font-semibold underline">
              dir.comercial@neogestion.co
            </a>
          </p>
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

        {/* Encabezado y Datos de la Empresa */}
        <div className="mb-8 p-6 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <span className="inline-block px-3 py-1 bg-amber-50 border border-[#B08A1A]/30 text-[#B08A1A] text-xs font-bold rounded-full uppercase tracking-wider mb-2">
                Documento Legal Oficial
              </span>
              <h2 className="text-xl font-bold text-slate-900">
                Identificación del Prestador del Servicio
              </h2>
            </div>
            <span className="text-xs text-slate-500 font-medium bg-slate-100 px-3 py-1.5 rounded-lg">
              Última actualización: 9 de septiembre de 2026
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
            <div>
              <strong className="block text-slate-500 text-xs uppercase tracking-wider">Prestador del servicio</strong>
              <span className="text-slate-800 font-semibold">Consultoría de Colombia S.A.S.</span>
            </div>
            <div>
              <strong className="block text-slate-500 text-xs uppercase tracking-wider">NIT</strong>
              <span className="text-slate-800 font-semibold">804.017.909-0</span>
            </div>
            <div>
              <strong className="block text-slate-500 text-xs uppercase tracking-wider">Domicilio</strong>
              <span className="text-slate-800 font-semibold">Calle 18 No. 22C – 40, Girón, Santander, Colombia</span>
            </div>
            <div className="md:col-span-2 lg:col-span-3">
              <strong className="block text-slate-500 text-xs uppercase tracking-wider">Contacto oficial</strong>
              <span className="text-slate-800">
                <a href="mailto:asist.gerencia@neogestion.co" className="text-[#01426F] font-semibold underline">
                  asist.gerencia@neogestion.co
                </a>{" "}
                ·{" "}
                <a href="mailto:dir.comercial@neogestion.co" className="text-[#01426F] font-semibold underline">
                  dir.comercial@neogestion.co
                </a>
              </span>
            </div>
          </div>

          <div className="mt-2 p-3.5 bg-blue-50/80 border border-blue-200 rounded-xl text-xs text-blue-900 leading-relaxed">
            <strong>Política de Privacidad (Google Play):</strong> El texto completo y directo de la política de privacidad está en{" "}
            <a
              href="https://neogestion.software/politica-de-privacidad.html"
              className="font-bold underline text-[#01426F]"
            >
              https://neogestion.software/politica-de-privacidad.html
            </a>
            . Use esa URL en Play Console &rarr; Política de privacidad.
          </div>
        </div>

        <LegalAccordion
          title="Términos y Condiciones de Uso"
          subtitle="Sitio web neogestion.software, plataforma web y app móvil Android (app.neogestion.io)"
          sections={sections}
          activeDoc="terminos"
        />
      </div>
    </div>
  );
}
