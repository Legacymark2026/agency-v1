import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import LegalAccordion, { LegalSection } from "@/components/LegalAccordion";

export const metadata: Metadata = {
  title: "Términos y Condiciones de Uso | NEOGESTIÓN",
  description:
    "Términos y condiciones legales para el acceso y uso de los servicios de Consultoría de Colombia S.A.S. y la plataforma NeoGestión.",
};

export default function TerminosPage() {
  const sections: LegalSection[] = [
    {
      id: "introduccion",
      title: "Aceptación de los Términos",
      content: (
        <div className="space-y-3 text-slate-700 text-sm leading-relaxed">
          <p>
            Por favor, lea detenidamente los siguientes Términos y Condiciones antes de utilizar el sitio web y los servicios de <strong>Consultoría de Colombia S.A.S.</strong> y su plataforma <strong>NeoGestión</strong>.
          </p>
          <p>
            Al acceder a nuestro sitio, navegar en él o utilizar nuestros servicios, usted (en adelante, &ldquo;el Usuario&rdquo;) acepta plenamente y queda vinculado por estos términos. Si no está de acuerdo con algún punto, le rogamos abstenerse de utilizar nuestros servicios y soluciones tecnológicas.
          </p>
        </div>
      ),
    },
    {
      id: "descripcion-servicios",
      title: "1. Descripción de los Servicios",
      content: (
        <div className="space-y-3 text-slate-700 text-sm leading-relaxed">
          <p>
            <strong>Consultoría de Colombia S.A.S.</strong> es una empresa de consultoría y desarrollo de software que ofrece, a través de <strong>NeoGestión</strong>, un sistema interactivo y colaborativo basado en Tecnologías de la Información y Comunicación (TIC&rsquo;s) para la gestión administrativa, el control de procesos y el cumplimiento de normativas nacionales e internacionales (sistemas ISO, SG-SST, HSEQ, etc.).
          </p>
          <p>
            Adicionalmente, ofrecemos servicios profesionales especializados de consultoría empresarial, programas de capacitación y formación tecnológica, así como asistencia técnica y mejoramiento continuo.
          </p>
        </div>
      ),
    },
    {
      id: "licencia-uso",
      title: "2. Licencia de Uso",
      content: (
        <div className="space-y-3 text-slate-700 text-sm leading-relaxed">
          <p>
            La plataforma NeoGestión se ofrece bajo las condiciones de la modalidad de Licencia que el Usuario o su representada haya adquirido (Licencia de Uso Vitalicia - LUV, Servicio Cloud Computing / SAAS, Licencia Multiempresas - LUVI, etc.).
          </p>
          <p>
            Esta licencia es personal, intransferible y no exclusiva, otorgando al Usuario el derecho a acceder y utilizar el software en los términos formalmente pactados en el contrato correspondiente.
          </p>
          <div className="p-3.5 rounded-xl bg-amber-500/10 border border-[#B08A1A]/30 text-xs text-slate-800 font-semibold">
            Cualquier uso no autorizado, incluyendo la reproducción, copia, ingeniería inversa, descompilación o distribución del software, se encuentra estrictamente prohibido y sujeto a las acciones legales pertinentes.
          </div>
        </div>
      ),
    },
    {
      id: "responsabilidad-usuario",
      title: "3. Responsabilidad del Usuario",
      content: (
        <div className="space-y-3 text-slate-700 text-sm leading-relaxed">
          <p>Es responsabilidad exclusiva del Usuario:</p>
          <ul className="list-disc pl-5 space-y-2 text-xs sm:text-sm text-slate-600">
            <li>
              <strong>Veracidad de los datos:</strong> Proporcionar información veraz, completa y debidamente actualizada durante el proceso de registro, parametrización y uso operativo de NeoGestión.
            </li>
            <li>
              <strong>Custodia de credenciales:</strong> Mantener la estricta confidencialidad de sus credenciales de acceso (usuario y contraseña) y notificar de inmediato a la Compañía ante cualquier sospecha o detección de uso no autorizado.
            </li>
            <li>
              <strong>Uso legítimo y ético:</strong> Utilizar los servicios de acuerdo con la ley, la moral y las buenas costumbres. El Usuario es el único responsable de los contenidos, documentos y archivos que ingrese a la plataforma, por lo que se exime a Consultoría de Colombia de cualquier responsabilidad derivada de su uso indebido.
            </li>
          </ul>
        </div>
      ),
    },
    {
      id: "propiedad-intelectual",
      title: "4. Propiedad Intelectual e Industrial",
      content: (
        <div className="space-y-3 text-slate-700 text-sm leading-relaxed">
          <p>
            Todos los derechos de propiedad intelectual e industrial sobre <strong>NeoGestión</strong>, su código fuente, arquitectura técnica, bases de datos, diseños, diagramas metodológicos, interfaces de usuario y contenidos del sitio web (excepto aquellos aportados directamente por los Usuarios en sus respectivas cuentas) pertenecen de manera exclusiva a <strong>Consultoría de Colombia S.A.S.</strong> o a sus legítimos licenciantes.
          </p>
          <p>
            Ningún contenido del sitio ni elemento del software puede ser copiado, modificado, reproducido, publicado, cedido o distribuido sin la previa y expresa autorización escrita de la Compañía.
          </p>
        </div>
      ),
    },
    {
      id: "limitacion-responsabilidad",
      title: "5. Limitación de Responsabilidad",
      content: (
        <div className="space-y-3 text-slate-700 text-sm leading-relaxed">
          <p>
            <strong>Consultoría de Colombia S.A.S.</strong> actúa como asesor, facilitador y proveedor tecnológico de herramientas de gestión. No nos hacemos responsables por las decisiones de negocio, financieras o laborales que el Usuario adopte basándose en la información o métricas proporcionadas por NeoGestión.
          </p>
          <p>
            La Compañía tampoco será responsable por daños indirectos, incidentales, especiales o consecuentes derivados del uso o imposibilidad de uso del servicio, incluyendo la pérdida de datos o beneficios esperados, siempre que estos hechos no sean atribuibles de forma directa a una negligencia grave o dolo comprobado de nuestra parte.
          </p>
        </div>
      ),
    },
    {
      id: "modificaciones-jurisdiccion",
      title: "6. Modificaciones y Ley Aplicable",
      content: (
        <div className="space-y-3 text-slate-700 text-sm leading-relaxed">
          <p>
            Consultoría de Colombia se reserva el derecho de modificar estos Términos y Condiciones en cualquier momento. Las modificaciones serán plenamente efectivas a partir de su publicación en el sitio web.
          </p>
          <div className="p-4 rounded-2xl bg-slate-100 border border-slate-200 text-xs sm:text-sm text-slate-800">
            <strong className="block text-slate-900 mb-1 text-[#01426F]">Jurisdicción y Ley Aplicable:</strong>
            Estos Términos se rigen e interpretan bajo las leyes vigentes de la <strong>República de Colombia</strong>. Cualquier controversia, litigio o reclamación derivada de su interpretación, validez o ejecución estará sujeta a la jurisdicción exclusiva de los tribunales de la ciudad de <strong>Girón, Santander, Colombia</strong>.
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
          title="Términos y Condiciones de Uso"
          subtitle="Última actualización: Septiembre 2026 | Marco contractual y operativo de NeoGestión"
          sections={sections}
          activeDoc="terminos"
        />
      </div>
    </div>
  );
}
