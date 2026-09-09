import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Mail, Phone, MapPin, ShieldCheck, FileText } from "lucide-react";
import LegalAccordion, { LegalSection } from "@/components/LegalAccordion";

export const metadata: Metadata = {
  title: "Política de Privacidad y Protección de Datos | NEOGESTIÓN",
  description:
    "Política de Tratamiento de Datos Personales de Consultoría de Colombia y NeoGestión en cumplimiento de la Ley 1581 de 2012 y el Decreto 1377 de 2013.",
};

export default function PrivacidadPage() {
  const sections: LegalSection[] = [
    {
      id: "introduccion",
      title: "Identificación del Responsable y Marco Legal",
      content: (
        <div className="space-y-4 text-slate-700 text-sm leading-relaxed">
          <p>
            En <strong>Consultoría de Colombia S.A.S.</strong>, sociedad identificada con <strong>NIT 804.017.909</strong> y con domicilio principal en la <strong>Carrera 1A # 55A - 30, Int. Edificio Centaurio, Barrio Ciudadela Real de Minas, Bucaramanga - Santander, Colombia</strong> (en adelante, &ldquo;la Compañía&rdquo; o &ldquo;Consultoría de Colombia&rdquo;), nos comprometemos a proteger su privacidad y a garantizar la seguridad de sus datos personales.
          </p>
          <p>
            Esta Política describe cómo recopilamos, usamos, almacenamos y protegemos su información personal cuando interactúa con nosotros y con nuestra plataforma <strong>NeoGestión</strong>, en estricto cumplimiento de la <strong>Ley Estatutaria 1581 de 2012</strong>, el <strong>Decreto 1377 de 2013</strong> y demás normativa concordante de la República de Colombia.
          </p>
        </div>
      ),
    },
    {
      id: "responsable",
      title: "1. Responsable del Tratamiento y Canales de Atención",
      content: (
        <div className="space-y-4 text-slate-700 text-sm leading-relaxed">
          <p>
            <strong>Consultoría de Colombia S.A.S.</strong> es el Responsable del Tratamiento de sus datos personales. Para cualquier consulta, solicitud o ejercicio de sus derechos, puede contactar a nuestro Oficial de Protección de Datos a través de los siguientes canales oficiales:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col items-start gap-2">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-[#B08A1A] flex items-center justify-center">
                <Mail className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-slate-900">Correo Electrónico:</span>
              <a href="mailto:sistemas@neoinf.com" className="text-xs text-[#01426F] font-semibold hover:underline">
                sistemas@neoinf.com
              </a>
              <span className="text-[11px] text-slate-500">asist.gerencia@neogestion.co</span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col items-start gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-[#01426F] flex items-center justify-center">
                <Phone className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-slate-900">Teléfonos de Contacto:</span>
              <span className="text-xs text-slate-700 font-semibold">+57 (7) 659 4043</span>
              <span className="text-xs text-slate-700 font-semibold">+57 317 3720384</span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col items-start gap-2">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-[#B08A1A] flex items-center justify-center">
                <MapPin className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-slate-900">Dirección Física &amp; Domicilio:</span>
              <span className="text-xs text-slate-700">Carrera 1A # 55A - 30, Int. Edificio Centaurio, Barrio Ciudadela Real de Minas, Bucaramanga - Santander, Colombia.</span>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "recopilacion-finalidad",
      title: "2. Datos Personales que Recopilamos y su Finalidad",
      content: (
        <div className="space-y-4 text-slate-700 text-sm leading-relaxed">
          <p>
            Recopilamos diferentes categorías de datos personales según su interacción con nosotros y el ecosistema NeoGestión:
          </p>
          <div className="space-y-3">
            <div className="p-4 rounded-2xl bg-white border border-slate-200">
              <h4 className="font-bold text-slate-900 text-sm mb-1 text-[#01426F]">
                a) Datos de Contacto y de Identificación:
              </h4>
              <p className="text-xs sm:text-sm text-slate-600">
                Como nombre, apellidos, número de identificación, correo electrónico, número de teléfono y dirección. Los utilizamos para gestionar su registro como usuario de NeoGestión, atender sus consultas, solicitudes de servicio, facturación y enviar comunicaciones relacionadas con su contrato y el soporte técnico.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200">
              <h4 className="font-bold text-slate-900 text-sm mb-1 text-[#01426F]">
                b) Datos de Navegación y Analíticos:
              </h4>
              <p className="text-xs sm:text-sm text-slate-600">
                Como su dirección IP, tipo de navegador, páginas visitadas, tiempo de permanencia y comportamiento general en nuestro sitio web. Los utilizamos con fines de mejora de la experiencia del usuario y análisis estadístico, siempre de forma anonimizada.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200">
              <h4 className="font-bold text-slate-900 text-sm mb-1 text-[#01426F]">
                c) Datos de Marketing y Preferencias:
              </h4>
              <p className="text-xs sm:text-sm text-slate-600">
                Recopilamos esta información cuando usted acepta recibir nuestras comunicaciones comerciales sobre novedades de NeoGestión, eventos, capacitaciones y otros servicios. Bajo ninguna circunstancia cederemos sus datos a terceros para fines de mercadeo sin su consentimiento previo, expreso e informado.
              </p>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "terceros-encargados",
      title: "3. Terceros y Encargados del Tratamiento",
      content: (
        <div className="space-y-4 text-slate-700 text-sm leading-relaxed">
          <p>
            Para la prestación de nuestros servicios, podemos compartir sus datos con terceros que actúan como Encargados del Tratamiento bajo nuestra instrucción. Estos incluyen:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm text-slate-600">
            <li>Proveedores de servicios de alojamiento web y almacenamiento en la nube (Cloud Computing / SAAS).</li>
            <li>Proveedores de herramientas de analítica web (ej. Google Analytics).</li>
            <li>Proveedores de servicios de mensajería y correo electrónico para comunicaciones institucionales.</li>
          </ul>
          <div className="p-3.5 rounded-xl bg-amber-500/10 border border-[#B08A1A]/30 text-xs text-slate-800 font-medium">
            Todos nuestros Encargados del Tratamiento se encuentran vinculados mediante acuerdos contractuales que garantizan el cumplimiento de los principios de protección de datos y la normativa colombiana vigente.
          </div>
        </div>
      ),
    },
    {
      id: "transferencias-internacionales",
      title: "4. Transferencias Internacionales de Datos",
      content: (
        <div className="space-y-3 text-slate-700 text-sm leading-relaxed">
          <p>
            Consultoría de Colombia se compromete a realizar transferencias internacionales de datos únicamente a países que la <strong>Superintendencia de Industria y Comercio (SIC)</strong> haya determinado que ofrecen un nivel adecuado de protección de datos personales.
          </p>
          <p>
            En caso contrario, dichas transferencias se realizarán bajo los mecanismos de garantía establecidos en la ley, tales como cláusulas contractuales tipo o autorizaciones expresas del titular.
          </p>
        </div>
      ),
    },
    {
      id: "derechos-arco",
      title: "5. Derechos del Titular de los Datos (Derechos ARCO)",
      content: (
        <div className="space-y-4 text-slate-700 text-sm leading-relaxed">
          <p>
            Como Titular de sus datos personales, usted tiene los siguientes derechos consagrados en el <strong>artículo 8 de la Ley 1581 de 2012</strong>:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <strong className="text-slate-900 block text-xs font-bold text-[#B08A1A]">1. Acceder:</strong>
              <span className="text-xs text-slate-600">Conocer los datos personales que tenemos sobre usted.</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <strong className="text-slate-900 block text-xs font-bold text-[#B08A1A]">2. Rectificar:</strong>
              <span className="text-xs text-slate-600">Solicitar la corrección de sus datos si son inexactos o incompletos.</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <strong className="text-slate-900 block text-xs font-bold text-[#B08A1A]">3. Actualizar:</strong>
              <span className="text-xs text-slate-600">Mantener su información debidamente actualizada.</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <strong className="text-slate-900 block text-xs font-bold text-[#B08A1A]">4. Suprimir:</strong>
              <span className="text-xs text-slate-600">Solicitar la eliminación de sus datos cuando el tratamiento no sea legítimo o ya no sea necesario.</span>
            </div>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <strong className="text-slate-900 block text-xs font-bold text-[#B08A1A]">5. Revocar la autorización:</strong>
            <span className="text-xs text-slate-600">Retirar su consentimiento para el tratamiento de sus datos en cualquier momento.</span>
          </div>
          <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200 text-xs sm:text-sm text-slate-800">
            <p className="font-semibold text-[#01426F] mb-1">Procedimiento de Atención:</p>
            <p>
              Para ejercer estos derechos, envíe su solicitud al correo electrónico{" "}
              <a href="mailto:sistemas@neoinf.com" className="font-bold text-[#01426F] underline">
                sistemas@neoinf.com
              </a>{" "}
              indicando en el asunto <strong>&ldquo;Derechos ARCO&rdquo;</strong>. Atenderemos su petición en los plazos legales establecidos por la normatividad (15 días hábiles para consultas y 15 días hábiles para reclamos, prorrogables por 8 días en casos especiales debidamente motivados).
            </p>
          </div>
        </div>
      ),
    },
    {
      id: "vigencia",
      title: "6. Vigencia y Cambios a la Política",
      content: (
        <div className="space-y-3 text-slate-700 text-sm leading-relaxed">
          <p>
            Esta Política rige a partir de la fecha de su publicación. La Compañía se reserva el derecho de actualizar o modificar esta Política en cualquier momento para reflejar cambios en la legislación, la jurisprudencia o nuestras prácticas institucionales.
          </p>
          <p>
            La versión vigente será siempre la publicada en nuestro sitio web oficial, indicando la fecha de su última actualización.
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

        <LegalAccordion
          title="Política de Privacidad y Tratamiento de Datos Personales"
          subtitle="Última actualización: Septiembre 2026 | Cumplimiento Ley 1581 de 2012 y Decreto 1377 de 2013"
          sections={sections}
          activeDoc="privacidad"
        />
      </div>
    </div>
  );
}
