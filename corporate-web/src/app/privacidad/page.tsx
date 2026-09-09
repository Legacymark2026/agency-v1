import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Mail, Phone, MapPin, ShieldCheck, Smartphone, Lock, FileText, CheckCircle2, AlertCircle } from "lucide-react";
import LegalAccordion, { LegalSection } from "@/components/LegalAccordion";

export const metadata: Metadata = {
  title: "Política de Privacidad y Protección de Datos | NEOGESTIÓN",
  description:
    "Política de Privacidad de NeoGestión y Consultoría de Colombia S.A.S. para web y aplicación móvil en cumplimiento de Google Play y la Ley 1581 de 2012.",
};

export default function PrivacidadPage() {
  const sections: LegalSection[] = [
    {
      id: "alcance",
      title: "1. Alcance y Políticas de Google Play",
      content: (
        <div className="space-y-4 text-slate-700 text-sm leading-relaxed">
          <p>
            Esta Política de Privacidad describe cómo <strong>Consultoría de Colombia S.A.S.</strong>, sociedad identificada con <strong>NIT 804.017.909</strong> y con domicilio principal en la <strong>Carrera 1A # 55A - 30, Int. Edificio Centaurio, Barrio Ciudadela Real de Minas, Bucaramanga, Santander, Colombia</strong> (Sede administrativa y técnica: <strong>Calle 18 No. 22C – 40, Girón, Santander</strong>) (&ldquo;nosotros&rdquo;, &ldquo;NeoGestión&rdquo;), recopila, usa, almacena, comparte y protege la información personal asociada al uso del sitio <a href="https://neogestion.software/" className="text-[#01426F] font-bold underline">neogestion.software</a>, la plataforma web NeoGestión y la aplicación móvil NeoGestión disponible en Google Play.
          </p>
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-[#B08A1A]/30 text-xs sm:text-sm text-slate-800">
            <p className="font-bold text-[#B08A1A] mb-1 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4" />
              <span>Transparencia y Cumplimiento Google Play:</span>
            </p>
            <p>
              El texto de esta política está publicado de forma directa en esta URL para cumplimiento estricto de las políticas de Datos de Usuario de Google Play. No se requiere iniciar sesión ni navegar a páginas adicionales para leerla en su totalidad.
            </p>
          </div>
        </div>
      ),
    },
    {
      id: "datos-recopilados",
      title: "2. Datos que podemos recopilar",
      content: (
        <div className="space-y-4 text-slate-700 text-sm leading-relaxed">
          <p>
            Según el módulo y la configuración de cada empresa cliente, la aplicación y los servicios pueden tratar:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3.5 rounded-xl bg-white border border-slate-200">
              <strong className="text-slate-900 block text-xs font-bold text-[#01426F] mb-1">
                • Datos de cuenta y acceso:
              </strong>
              <span className="text-xs text-slate-600">
                Usuario, contraseña (almacenada de forma controlada y cifrada criptográficamente por el sistema), empresa, cargo y rol operativo.
              </span>
            </div>
            <div className="p-3.5 rounded-xl bg-white border border-slate-200">
              <strong className="text-slate-900 block text-xs font-bold text-[#01426F] mb-1">
                • Datos de identificación laboral:
              </strong>
              <span className="text-xs text-slate-600">
                Nombres, apellidos, documento de identidad, correo electrónico corporativo o registrado, área organizacional y cargo.
              </span>
            </div>
            <div className="p-3.5 rounded-xl bg-white border border-slate-200">
              <strong className="text-slate-900 block text-xs font-bold text-[#01426F] mb-1">
                • Operación de sistemas de gestión:
              </strong>
              <span className="text-xs text-slate-600">
                Tareas, comunicados, correspondencia, listas de inspección, evidencias documentales y registros SG-SST / ISO asociados a su actividad en la empresa.
              </span>
            </div>
            <div className="p-3.5 rounded-xl bg-white border border-slate-200">
              <strong className="text-slate-900 block text-xs font-bold text-[#01426F] mb-1">
                • Archivos y medios multimedia:
              </strong>
              <span className="text-xs text-slate-600">
                Documentos, fotografías u otros archivos que el usuario adjunte voluntariamente (por ejemplo, evidencias de inspección en campo), cuando el módulo lo permita.
              </span>
            </div>
            <div className="p-3.5 rounded-xl bg-white border border-slate-200">
              <strong className="text-slate-900 block text-xs font-bold text-[#01426F] mb-1">
                • Datos técnicos del dispositivo:
              </strong>
              <span className="text-xs text-slate-600">
                Información básica de conectividad, sistema operativo, identificadores técnicos necesarios para el funcionamiento, registros de error y uso de red (Internet).
              </span>
            </div>
            <div className="p-3.5 rounded-xl bg-white border border-slate-200">
              <strong className="text-slate-900 block text-xs font-bold text-[#01426F] mb-1">
                • Almacenamiento local offline:
              </strong>
              <span className="text-xs text-slate-600">
                La app puede conservar temporalmente información en el dispositivo (incluido almacenamiento offline / base local) para permitir trabajar sin conexión y sincronizar después.
              </span>
            </div>
          </div>
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>No solicitamos datos de pago dentro de la aplicación móvil NeoGestión. No vendemos datos personales a terceros bajo ninguna circunstancia.</span>
          </div>
        </div>
      ),
    },
    {
      id: "finalidades",
      title: "3. Finalidades del tratamiento",
      content: (
        <div className="space-y-3 text-slate-700 text-sm leading-relaxed">
          <ul className="list-disc pl-5 space-y-2 text-xs sm:text-sm text-slate-600">
            <li>Autenticar usuarios y prestar el servicio SaaS de gestión empresarial / SG-SST / ISO.</li>
            <li>Permitir el registro, consulta y seguimiento de tareas, documentos y evidencias del cliente.</li>
            <li>Sincronizar información entre la app, la API y las bases de datos de la empresa contratante.</li>
            <li>Brindar soporte técnico, seguridad, auditoría y mejora continua del servicio.</li>
            <li>Cumplir obligaciones legales y contractuales aplicables en la República de Colombia.</li>
          </ul>
        </div>
      ),
    },
    {
      id: "base-legal",
      title: "4. Base legal y relación con la empresa cliente",
      content: (
        <div className="space-y-3 text-slate-700 text-sm leading-relaxed">
          <p>
            NeoGestión es una plataforma multiempresa. En la mayoría de los casos, la empresa que contrata NeoGestión actúa como <strong>Responsable del Tratamiento</strong> de los datos de sus trabajadores y usuarios autorizados. <strong>Consultoría de Colombia S.A.S.</strong> trata esos datos en calidad de <strong>Proveedor Tecnológico / Encargado del Tratamiento</strong> para ejecutar el servicio contratado, conforme a la <strong>Ley 1581 de 2012</strong>, normas complementarias y los acuerdos contractuales suscritos con cada cliente.
          </p>
        </div>
      ),
    },
    {
      id: "permisos-android",
      title: "5. Uso de permisos en Android (App Móvil)",
      content: (
        <div className="space-y-4 text-slate-700 text-sm leading-relaxed">
          <p>
            La aplicación puede solicitar permisos del sistema operativo Android únicamente para funciones esenciales del servicio:
          </p>
          <ul className="list-disc pl-5 space-y-2 text-xs sm:text-sm text-slate-600">
            <li><strong>Internet / estado de red:</strong> para iniciar sesión de manera segura, sincronizar registros y consultar información en tiempo real.</li>
            <li><strong>Almacenamiento / archivos:</strong> para adjuntar o guardar evidencias y documentos cuando el usuario lo indique.</li>
            <li><strong>Cámara u otros sensores (si están habilitados en la versión instalada):</strong> solo para capturar evidencias fotográficas o archivos requeridos por el flujo de trabajo de inspección, siempre bajo autorización previa y explícita del usuario.</li>
          </ul>
          <p className="text-xs text-slate-500 italic">
            Nota: El rechazo de un permiso puede limitar la función asociada, sin impedir necesariamente el uso general de la app.
          </p>
        </div>
      ),
    },
    {
      id: "comparticion-datos",
      title: "6. Con quién compartimos información",
      content: (
        <div className="space-y-3 text-slate-700 text-sm leading-relaxed">
          <p>La información es tratada bajo estricta confidencialidad corporativa y únicamente compartida con:</p>
          <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm text-slate-600">
            <li>La empresa cliente a la que pertenece el usuario (administradores y roles autorizados dentro de la parametrización de NeoGestión).</li>
            <li>Proveedores de infraestructura (centros de datos en la nube, hosting, correo transaccional, respaldos) estrictamente necesarios para operar el servicio, amparados bajo acuerdos de confidencialidad y estándares de seguridad.</li>
            <li>Autoridades judiciales o administrativas cuando exista obligación legal o requerimiento formal válido.</li>
          </ul>
          <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-900 font-semibold">
            No compartimos datos personales con redes publicitarias ni los utilizamos para publicidad de terceros basada en el perfil del usuario de la app.
          </div>
        </div>
      ),
    },
    {
      id: "transferencias",
      title: "7. Transferencias y ubicación de los datos",
      content: (
        <div className="space-y-3 text-slate-700 text-sm leading-relaxed">
          <p>
            Los datos se procesan en servidores seguros y servicios en la nube utilizados para la operación de NeoGestión. Cuando intervengan proveedores de infraestructura tecnológica fuera de Colombia, se aplican medidas contractuales y de ciberseguridad adecuadas conforme a la normativa aplicable (Ley 1581 de 2012) y a los contratos con cada cliente.
          </p>
        </div>
      ),
    },
    {
      id: "conservacion",
      title: "8. Conservación y Retención de la Información",
      content: (
        <div className="space-y-3 text-slate-700 text-sm leading-relaxed">
          <p>
            Conservamos la información mientras exista la relación contractual con la empresa cliente, mientras la cuenta del usuario permanezca activa, o durante el tiempo adicional exigido por ley, auditorías de entes certificadores (ISO / RUC) o defensa de reclamaciones. Al terminar la relación contractual, se aplican los procedimientos de devolución, bloqueo o eliminación acordados con el cliente y/o la ley.
          </p>
        </div>
      ),
    },
    {
      id: "seguridad",
      title: "9. Medidas de Seguridad y Ciberseguridad",
      content: (
        <div className="space-y-3 text-slate-700 text-sm leading-relaxed">
          <p>
            Aplicamos medidas administrativas, técnicas y organizativas rigurosas (control de acceso granular, transmisión cifrada mediante HTTPS/TLS, segregación de bases de datos por empresa cliente, respaldos periódicos y monitoreo continuo perimetral) para proteger la integridad y disponibilidad de la información.
          </p>
          <p className="text-xs text-slate-500">
            Ningún sistema informático es 100% invulnerable; solicitamos a los usuarios custodiar responsablemente sus credenciales de acceso y no compartirlas con terceros.
          </p>
        </div>
      ),
    },
    {
      id: "derechos-titulares",
      title: "10. Derechos de los titulares (ARCO)",
      content: (
        <div className="space-y-4 text-slate-700 text-sm leading-relaxed">
          <p>
            De acuerdo con la legislación colombiana de protección de datos personales (Ley 1581 de 2012), usted puede solicitar acceso, actualización, rectificación, supresión, revocatoria de autorización u oposición al tratamiento, cuando proceda, escribiendo a los canales oficiales:
          </p>
          <div className="flex flex-wrap gap-2 text-xs">
            <a href="mailto:seguridad.informatica@neogestion.co" className="px-3 py-2 rounded-xl bg-slate-100 border border-slate-200 text-[#01426F] font-bold hover:bg-slate-200">
              seguridad.informatica@neogestion.co
            </a>
            <a href="mailto:asist.gerencia@neogestion.co" className="px-3 py-2 rounded-xl bg-slate-100 border border-slate-200 text-[#01426F] font-bold hover:bg-slate-200">
              asist.gerencia@neogestion.co
            </a>
          </div>
          <p className="text-xs text-slate-500">
            Si sus datos fueron cargados por su empleador u organización cliente, también puede dirigir la solicitud a esa organización, que es quien define el alta y el alcance de su usuario.
          </p>
        </div>
      ),
    },
    {
      id: "menores",
      title: "11. Menores de edad",
      content: (
        <div className="space-y-3 text-slate-700 text-sm leading-relaxed">
          <p>
            Los servicios y soluciones de software de NeoGestión están dirigidos exclusivamente al uso empresarial y laboral de personas adultas autorizadas por la empresa cliente. No están dirigidos a menores de 18 años.
          </p>
        </div>
      ),
    },
    {
      id: "cambios",
      title: "12. Cambios a esta política",
      content: (
        <div className="space-y-3 text-slate-700 text-sm leading-relaxed">
          <p>
            Podemos actualizar esta Política de Privacidad de manera periódica. La versión vigente se publicará de manera permanente en este portal y en <a href="https://neogestion.software/politica-de-privacidad.html" className="font-bold text-[#01426F] underline">https://neogestion.software/politica-de-privacidad.html</a> con la fecha de última actualización. El uso continuado de la app o del servicio después de un cambio implica el conocimiento de la versión publicada.
          </p>
        </div>
      ),
    },
    {
      id: "contacto",
      title: "13. Canales Oficiales de Contacto",
      content: (
        <div className="space-y-4 text-slate-700 text-sm leading-relaxed">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs sm:text-sm">
            <p><strong>Consultoría de Colombia S.A.S. — NeoGestión Software</strong></p>
            <p><strong>NIT:</strong> 804.017.909</p>
            <p><strong>Domicilio Principal:</strong> Carrera 1A # 55A - 30, Int. Edificio Centaurio, Barrio Ciudadela Real de Minas, Bucaramanga, Santander, Colombia.</p>
            <p><strong>Sede de Operaciones:</strong> Calle 18 No. 22C – 40, Girón, Santander, Colombia.</p>
            <p><strong>Correo Electrónico Oficial:</strong> <a href="mailto:seguridad.informatica@neogestion.co" className="font-bold text-[#01426F]">seguridad.informatica@neogestion.co</a> / <a href="mailto:asist.gerencia@neogestion.co" className="font-bold text-[#01426F]">asist.gerencia@neogestion.co</a></p>
            <p><strong>Sitio Web Oficial:</strong> <a href="https://neogestion.software/" className="font-bold text-[#01426F]">https://neogestion.software/</a></p>
            <p><strong>Documentos relacionados:</strong> <Link href="/terminos" className="font-bold text-[#B08A1A] underline">Términos y Condiciones</Link></p>
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
          title="Política de Privacidad y Tratamiento de Datos Personales"
          subtitle="Última actualización: Septiembre 2026 | Cumplimiento Ley 1581 de 2012 y Políticas de Google Play"
          sections={sections}
          activeDoc="privacidad"
        />
      </div>
    </div>
  );
}
