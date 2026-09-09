import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { 
  Target, 
  Eye, 
  ArrowRight,
  TrendingUp,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Layers,
  Cloud,
  FileCheck,
  Award,
  Users,
  Laptop,
  Network,
  Scale,
  Clock,
  KeyRound
} from "lucide-react";
import TeamModalGrid from "./TeamModalGrid";
import ClientsSection from "@/components/ClientsSection";
import { corporateValues, corporateHistory } from "@/data/teamData";

export const metadata: Metadata = {
  title: "Quiénes Somos & Filosofía | NEOGESTIÓN",
  description:
    "Conozca la historia, misión, valores y el respaldo de Consultoría de Colombia S.A.S. detrás de NeoGestión. Transformamos la complejidad corporativa en eficiencia.",
};

export default function QuienesSomosPage() {
  const metrics = [
    { value: "+15", label: "Años de Trayectoria", desc: "Consultoría y software empresarial" },
    { value: "+480", label: "Proyectos y Auditorías", desc: "En sectores industriales y públicos" },
    { value: "98.7%", label: "Tasa de Conformidad", desc: "Aprobación en certificaciones internacionales" },
    { value: "100%", label: "Filosofía Cero Papel", desc: "Gestión en tiempo real en la nube o local" },
  ];

  const standardsList = [
    {
      group: "Calidad & Sector Público",
      badge: "Gobernanza",
      items: ["ISO 9001:2015 (Calidad)", "NTCGP 1000 (Gestión Pública)", "MECI (Control Interno)"]
    },
    {
      group: "Seguridad & Salud en el Trabajo",
      badge: "Legal Obligatorio",
      items: ["SG-SST (Decreto 1443/2014)", "Decreto 1072/2015", "OHSAS 18001 / ISO 45001"]
    },
    {
      group: "Ambiente & Ciberseguridad",
      badge: "Sostenibilidad & Datos",
      items: ["ISO 14001 (Gestión Ambiental)", "ISO/IEC 27001 (Seguridad Información)"]
    },
    {
      group: "Comercio Seguro & Inocuidad",
      badge: "Cadena de Suministro",
      items: ["BASC (Comercio Seguro)", "ISO 28000 (Cadena Suministro)", "HACCP & ISO 22000 (Alimentos)"]
    }
  ];

  return (
    <div className="flex flex-col bg-slate-50 min-h-screen">
      {/* 1. Banner Principal */}
      <section className="bg-[#01426F] text-white py-20 lg:py-28 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_50%_0%,rgba(176,138,26,0.22),transparent)] pointer-events-none" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="inline-block px-4 py-1.5 rounded-full bg-amber-500/10 border border-[#B08A1A]/40 text-[#D4AF37] text-xs font-bold uppercase tracking-[0.2em] mb-6">
            Consultoría de Colombia S.A.S. • NeoGestión
          </span>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white max-w-4xl mx-auto leading-tight font-sans">
            La firma consultora donde el rigor analítico se une a la cercanía directiva.
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed">
            <strong className="text-white">NeoGestión</strong> es la plataforma tecnológica desarrollada por <strong className="text-[#D4AF37]">Consultoría de Colombia S.A.S.</strong>, creada para dotar a comités directivos, líderes de calidad y equipos operativos de una herramienta integral, en línea y en tiempo real.
          </p>
        </div>
      </section>

      {/* 2. Cita Destacada de Filosofía Corporativa */}
      <section className="py-20 bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="text-xs font-bold uppercase tracking-widest text-[#B08A1A] block mb-4">
            Filosofía Institucional
          </span>
          <blockquote className="text-2xl sm:text-3xl lg:text-4xl font-serif italic text-slate-900 leading-relaxed max-w-4xl mx-auto">
            “Nuestra convicción es simple: la complejidad nunca debe ser una justificación para la ineficiencia. Convertimos los nudos operativos en palancas de aceleración empresarial.”
          </blockquote>
          <div className="mt-8 flex items-center justify-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#01426F] text-[#D4AF37] flex items-center justify-center font-bold text-xs border border-[#B08A1A]/40">
              NG
            </div>
            <div className="text-left">
              <h4 className="text-sm font-bold text-slate-900">Consejo Directivo</h4>
              <p className="text-xs text-[#B08A1A] font-semibold">Consultoría de Colombia S.A.S.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Misión y Visión con Ilustraciones Corporativas */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-bold uppercase tracking-widest text-[#B08A1A] block mb-2">
              Propósito &amp; Futuro
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              Misión &amp; Visión Estratégica
            </h2>
            <p className="mt-3 text-base text-slate-600">
              Pilares fundacionales que guían el desarrollo de NeoGestión y el servicio consultivo de excelencia.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
            {/* Tarjeta Misión */}
            <div className="bg-white p-8 sm:p-10 rounded-3xl border border-slate-200 shadow-lg relative overflow-hidden group hover:border-[#01426F] transition-all flex flex-col justify-between">
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 items-center">
                <div className="sm:col-span-8">
                  <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-[#01426F] flex items-center justify-center mb-6 shadow-sm border border-blue-100">
                    <Target className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-bold uppercase tracking-wider text-[#01426F] block mb-1">
                    Razón de Ser
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mb-4">
                    Nuestra Misión
                  </h2>
                  <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
                    Fortalecer el crecimiento de las organizaciones mediante un ecosistema de tecnología, consultoría y formación, que transforme su gestión, optimice procesos e impulse su productividad, competitividad y generación de valor, a través del conocimiento especializado, la experiencia y NeoGestión como solución tecnológica.
                  </p>
                </div>

                <div className="sm:col-span-4 flex justify-center sm:justify-end">
                  <div className="relative w-36 h-48 sm:w-44 sm:h-56 transition-transform duration-300 group-hover:scale-105">
                    <Image
                      src="/images/mision.png"
                      alt="Misión NeoGestión - Consultoría de Colombia"
                      fill
                      className="object-contain drop-shadow-xl"
                      sizes="(max-width: 640px) 144px, 176px"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center gap-2 text-xs font-bold text-[#01426F]">
                <span className="w-2 h-2 rounded-full bg-[#01426F]" />
                <span>Transformación &amp; Optimización Continua</span>
              </div>
            </div>

            {/* Tarjeta Visión */}
            <div className="bg-white p-8 sm:p-10 rounded-3xl border border-slate-200 shadow-lg relative overflow-hidden group hover:border-[#B08A1A] transition-all flex flex-col justify-between">
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 items-center">
                <div className="sm:col-span-8">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-[#B08A1A] flex items-center justify-center mb-6 shadow-sm border border-amber-100">
                    <Eye className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-bold uppercase tracking-wider text-[#B08A1A] block mb-1">
                    Horizonte 2031
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mb-4">
                    Nuestra Visión
                  </h2>
                  <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
                    Para el 2031, ser aliados estratégicos de las organizaciones en Colombia, impulsando su crecimiento y transformación tecnológica por medio de NeoGestión, adaptándonos a los cambios del entorno y contribuyendo al desarrollo empresarial del país.
                  </p>
                </div>

                <div className="sm:col-span-4 flex justify-center sm:justify-end">
                  <div className="relative w-36 h-48 sm:w-44 sm:h-56 transition-transform duration-300 group-hover:scale-105">
                    <Image
                      src="/images/vision.png"
                      alt="Visión NeoGestión - Consultoría de Colombia"
                      fill
                      className="object-contain drop-shadow-xl"
                      sizes="(max-width: 640px) 144px, 176px"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center gap-2 text-xs font-bold text-[#B08A1A]">
                <span className="w-2 h-2 rounded-full bg-[#B08A1A]" />
                <span>Liderazgo Tecnológico Empresarial</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. SECCIÓN PRINCIPAL: HISTORIA DE NEOGESTIÓN */}
      <section id="historia" className="py-24 bg-white border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Encabezado */}
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-widest text-[#B08A1A] bg-amber-500/10 px-4 py-1.5 rounded-full border border-[#B08A1A]/30 inline-block mb-3">
              Trayectoria Institucional &amp; Evolución
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight">
              Historia de NeoGestión
            </h2>
            <p className="mt-4 text-base sm:text-lg text-slate-600 leading-relaxed">
              De la consultoría empresarial de alto nivel al desarrollo de una plataforma tecnológica que elimina la burocracia, integra múltiples sistemas de gestión y acelera la productividad.
            </p>
          </div>

          {/* Bloque 1: Respaldo Consultivo & Génesis Cero Papel */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-16 items-stretch">
            {/* Tarjeta de Respaldo Institucional */}
            <div className="lg:col-span-6 bg-gradient-to-br from-[#01426F] to-[#0A2540] text-white p-8 sm:p-10 rounded-3xl shadow-xl flex flex-col justify-between border border-[#B08A1A]/40 relative overflow-hidden">
              <div className="absolute right-0 top-0 w-80 h-80 bg-[radial-gradient(ellipse_at_top_right,rgba(212,175,55,0.15),transparent_70%)] pointer-events-none" />
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-white/10 text-[#D4AF37] border border-[#B08A1A]/50 flex items-center justify-center font-bold">
                    <Award className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#D4AF37] block">
                      Entidad Desarrolladora
                    </span>
                    <h3 className="text-lg font-bold text-white">Consultoría de Colombia S.A.S.</h3>
                  </div>
                </div>

                <p className="text-slate-200 text-sm sm:text-base leading-relaxed mb-6">
                  <strong>NeoGestión</strong> es una plataforma tecnológica desarrollada por <strong>Consultoría de Colombia S.A.S.</strong>, una organización con amplia experiencia en consultoría empresarial y un equipo humano multidisciplinario que ha trabajado activamente en diversos sectores industriales, de servicios y del sector público.
                </p>

                <div className="p-5 rounded-2xl bg-white/5 border border-white/10 text-xs text-slate-300 leading-relaxed space-y-2">
                  <div className="flex items-center gap-2 font-bold text-[#D4AF37]">
                    <Sparkles className="w-4 h-4" />
                    <span>Equipo Humano Multidisciplinario</span>
                  </div>
                  <p>
                    Ingenieros de sistemas, auditores líderes en normas ISO, abogados expertos en legislación laboral/SST y consultores de alta dirección aunados en el perfeccionamiento continuo del software.
                  </p>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
                <span>Experiencia multisectorial comprobada</span>
                <span className="text-[#D4AF37] font-semibold">100% Cobertura Nacional</span>
              </div>
            </div>

            {/* Tarjeta de Génesis: Cero Papel & Conectividad TIC */}
            <div className="lg:col-span-6 bg-slate-50 p-8 sm:p-10 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-[#B08A1A]/10 text-[#B08A1A] flex items-center justify-center font-bold">
                    <Laptop className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#B08A1A] block">
                      El Origen del Software
                    </span>
                    <h3 className="text-lg font-bold text-slate-900">Filosofía Cero Papel &amp; TIC&apos;s</h3>
                  </div>
                </div>

                <p className="text-slate-700 text-sm sm:text-base leading-relaxed mb-5">
                  El origen de NeoGestión surge de la necesidad de ofrecer a las empresas una herramienta que les permita <strong>cumplir con los requisitos de múltiples Sistemas de Gestión de manera integrada</strong>, eliminando trámites innecesarios y el exceso de papel.
                </p>

                <p className="text-slate-600 text-sm leading-relaxed mb-6">
                  La plataforma se basa en el uso de <strong>Tecnologías de Información y Comunicación (TIC&apos;s)</strong>, permitiendo a las organizaciones gestionar sus procesos de manera inmediata, en línea y en tiempo real. NeoGestión facilita la interacción entre empleados, clientes, proveedores y demás stakeholders, utilizando Internet como medio básico e integral.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3.5 rounded-2xl bg-white border border-slate-200 text-center">
                    <Clock className="w-5 h-5 text-[#01426F] mx-auto mb-1.5" />
                    <span className="text-xs font-bold text-slate-900 block">Tiempo Real</span>
                    <span className="text-[10px] text-slate-500">Gestión en línea</span>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-white border border-slate-200 text-center">
                    <FileCheck className="w-5 h-5 text-emerald-600 mx-auto mb-1.5" />
                    <span className="text-xs font-bold text-slate-900 block">Cero Papel</span>
                    <span className="text-[10px] text-slate-500">Sin trámites vanos</span>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-white border border-slate-200 text-center">
                    <Network className="w-5 h-5 text-[#B08A1A] mx-auto mb-1.5" />
                    <span className="text-xs font-bold text-slate-900 block">Stakeholders</span>
                    <span className="text-[10px] text-slate-500">Interacción total</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bloque 2: Evolución Modular & Normativas Soportadas */}
          <div className="bg-slate-50 p-8 sm:p-12 rounded-3xl border border-slate-200 shadow-sm mb-16">
            <div className="max-w-3xl mb-8">
              <span className="text-xs font-bold uppercase tracking-widest text-[#B08A1A] block mb-2">
                Capacidad de Adaptación &amp; Cobertura Normativa
              </span>
              <h3 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                Evolución Modular: Desde lo Documental hasta lo Comercial y Operativo
              </h3>
              <p className="mt-3 text-slate-600 text-sm sm:text-base leading-relaxed">
                La evolución de NeoGestión ha estado marcada por su capacidad de adaptarse a las necesidades del mercado, incorporando módulos de gestión que abarcan desde lo documental hasta lo comercial y operativo. Hoy en día, NeoGestión da cumplimiento a las normas más exigentes del ámbito nacional e internacional:
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {standardsList.map((std, idx) => (
                <div key={idx} className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col justify-between hover:border-[#B08A1A] transition-colors">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#B08A1A] bg-amber-500/10 px-2 py-0.5 rounded border border-[#B08A1A]/20 inline-block mb-3">
                      {std.badge}
                    </span>
                    <h4 className="text-sm font-bold text-slate-900 mb-3">{std.group}</h4>
                    <ul className="space-y-2">
                      {std.items.map((item, itemIdx) => (
                        <li key={itemIdx} className="flex items-start gap-2 text-xs text-slate-700">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-100 text-[10px] text-slate-400 font-semibold">
                    Parametrizado en el sistema
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bloque 3: Ecosistema Integral: Modelos de Negocio LUV & Cloud SAAS */}
          <div className="bg-[#01426F] text-white p-8 sm:p-12 rounded-3xl border border-[#B08A1A]/40 shadow-xl mb-16 relative overflow-hidden">
            <div className="absolute right-0 bottom-0 w-96 h-96 bg-[radial-gradient(ellipse_at_bottom_right,rgba(212,175,55,0.12),transparent_70%)] pointer-events-none" />
            
            <div className="max-w-3xl mb-10">
              <span className="text-xs font-bold uppercase tracking-widest text-[#D4AF37] block mb-2">
                Flexibilidad Comercial &amp; Acompañamiento
              </span>
              <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Más que Software: Servicios y Modelos de Negocio Flexibles
              </h3>
              <p className="mt-3 text-slate-300 text-sm sm:text-base leading-relaxed">
                Además del software, <strong>Consultoría de Colombia S.A.S.</strong> ofrece servicios de <strong>consultoría, capacitación y asistencia técnica</strong>, con modelos de negocio flexibles diseñados para la realidad de cada organización:
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Modelo LUV */}
              <div className="bg-white/10 backdrop-blur-md p-6 sm:p-8 rounded-2xl border border-white/15 flex flex-col justify-between hover:border-[#D4AF37] transition-all">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-[#B08A1A] text-slate-950 flex items-center justify-center font-bold mb-4">
                    <KeyRound className="w-5 h-5" />
                  </div>
                  <h4 className="text-lg font-bold text-white mb-2">Licencia de Uso Vitalicia (LUV)</h4>
                  <p className="text-xs sm:text-sm text-slate-200 leading-relaxed mb-4">
                    Adquisición definitiva con soberanía total. Ideal para organizaciones que prefieren incorporar el activo tecnológico en sus propios servidores o centros de datos con usuarios ilimitados.
                  </p>
                </div>
                <div className="pt-4 border-t border-white/10 text-[11px] text-[#D4AF37] font-semibold">
                  Activo Patrimonial Perpetuo
                </div>
              </div>

              {/* Modelo Cloud SAAS */}
              <div className="bg-white/10 backdrop-blur-md p-6 sm:p-8 rounded-2xl border border-white/15 flex flex-col justify-between hover:border-[#D4AF37] transition-all">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-[#D4AF37] text-slate-950 flex items-center justify-center font-bold mb-4">
                    <Cloud className="w-5 h-5" />
                  </div>
                  <h4 className="text-lg font-bold text-white mb-2">Servicio en la Nube (Cloud SAAS)</h4>
                  <p className="text-xs sm:text-sm text-slate-200 leading-relaxed mb-4">
                    Modalidad ágil de Software as a Service. Acceso seguro 24/7 vía Internet, respaldos automáticos diarios, cero requerimientos de infraestructura local y escalabilidad inmediata.
                  </p>
                </div>
                <div className="pt-4 border-t border-white/10 text-[11px] text-[#D4AF37] font-semibold">
                  Disponibilidad &amp; Backups 24/7
                </div>
              </div>

              {/* Consultoría & Asistencia */}
              <div className="bg-white/10 backdrop-blur-md p-6 sm:p-8 rounded-2xl border border-white/15 flex flex-col justify-between hover:border-[#D4AF37] transition-all">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-[#D4AF37] border border-[#B08A1A]/40 flex items-center justify-center font-bold mb-4">
                    <Users className="w-5 h-5" />
                  </div>
                  <h4 className="text-lg font-bold text-white mb-2">Consultoría &amp; Formación</h4>
                  <p className="text-xs sm:text-sm text-slate-200 leading-relaxed mb-4">
                    Acompañamiento especializado de nuestro equipo multidisciplinario para diagnosticar, capacitar a los colaboradores y brindar asistencia técnica continua durante auditorías.
                  </p>
                </div>
                <div className="pt-4 border-t border-white/10 text-[11px] text-[#D4AF37] font-semibold">
                  Transferencia de Conocimiento
                </div>
              </div>
            </div>

            {/* Declaración Final de Valor */}
            <div className="mt-10 p-6 rounded-2xl bg-white/5 border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-sm text-slate-200 font-medium leading-relaxed">
                “Hoy, <strong>NeoGestión</strong> es la solución integral para organizaciones que buscan <strong>eficiencia administrativa, cumplimiento normativo y un verdadero crecimiento competitivo</strong>.”
              </p>
              <Link
                href="/contacto"
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#B08A1A] to-[#D4AF37] text-slate-950 font-bold text-xs hover:brightness-110 transition-all shrink-0 shadow-md flex items-center gap-2"
              >
                <span>Solicitar Asesoría</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Línea de Tiempo de Hitos y Madurez */}
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-10">
              <span className="text-xs font-bold uppercase tracking-widest text-[#B08A1A] block mb-1">
                Eje Cronológico de Madurez
              </span>
              <h3 className="text-xl sm:text-2xl font-black text-slate-900">
                Hitos Clave en la Construcción de NeoGestión
              </h3>
            </div>

            <div className="relative border-l-2 border-[#B08A1A]/40 ml-4 sm:ml-28 space-y-8 py-2">
              {corporateHistory.map((item, idx) => (
                <div key={idx} className="relative pl-8 sm:pl-10 group">
                  <div className="absolute -left-[17px] top-1.5 w-8 h-8 rounded-full bg-[#01426F] border-2 border-[#B08A1A] flex items-center justify-center text-[#D4AF37] shadow-md group-hover:scale-125 group-hover:bg-[#B08A1A] group-hover:text-slate-950 transition-all duration-300">
                    <span className="w-2 h-2 rounded-full bg-current" />
                  </div>

                  <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 shadow-xs group-hover:bg-white group-hover:border-[#B08A1A] transition-all">
                    <div className="flex items-center gap-3 mb-1.5">
                      <span className="text-sm font-black text-[#B08A1A] uppercase tracking-wider">
                        {item.year}
                      </span>
                      <span className="text-slate-300">•</span>
                      <span className="text-xs font-semibold text-slate-500">
                        Hito Institucional
                      </span>
                    </div>
                    <h4 className="text-base font-bold text-slate-900 mb-1.5">
                      {item.title}
                    </h4>
                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 5. Valores Corporativos en Tarjetas Interactivas con Gradientes */}
      <section id="valores" className="py-24 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-widest text-[#B08A1A] block mb-2">
              Nuestros Pilares
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              Valores que Rigen Cada Proyecto
            </h2>
            <p className="mt-3 text-base text-slate-600">
              Principios innegociables presentes en cada diagnóstico, propuesta y despliegue operativo.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {corporateValues.map((val) => (
              <div
                key={val.id}
                className="group relative rounded-3xl p-8 bg-[#01426F] text-white border border-slate-800 hover:border-[#B08A1A] transition-all duration-300 shadow-md hover:-translate-y-2 flex flex-col justify-between"
              >
                <div>
                  <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-[#D4AF37] border border-[#B08A1A]/40 flex items-center justify-center mb-6">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-1 group-hover:text-[#D4AF37] transition-colors">
                    {val.title}
                  </h3>
                  <span className="text-xs font-semibold text-[#B08A1A] block mb-4">
                    {val.subtitle}
                  </span>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    {val.description}
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-slate-800 text-[11px] font-bold text-[#D4AF37] uppercase tracking-wider">
                  Compromiso NEOGESTIÓN
                </div>
              </div>
            ))}
          </div>

          {/* Contadores de Métricas de Experiencia */}
          <div className="mt-20 pt-16 border-t border-slate-100">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {metrics.map((m, i) => (
                <div key={i} className="p-8 rounded-3xl bg-slate-50 border border-slate-200/80 text-center">
                  <span className="text-4xl sm:text-5xl font-black text-[#01426F] block mb-2">
                    {m.value}
                  </span>
                  <span className="text-sm font-bold text-slate-900 block mb-1">
                    {m.label}
                  </span>
                  <p className="text-xs text-slate-500">
                    {m.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 6. CLIENTES CORPORATIVOS & INSTITUCIONALES */}
      <ClientsSection />

      {/* 7. Equipo Directivo con Efecto Hover y Modal de Biografía */}
      <section id="equipo" className="py-24 bg-[#01426F] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-widest text-[#D4AF37] block mb-2">
              Liderazgo &amp; Especialistas
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              Socios Directores de NEOGESTIÓN
            </h2>
            <p className="mt-3 text-base text-slate-300">
              Haga clic en cualquier director para acceder a su biografía ejecutiva, trayectoria y credenciales.
            </p>
          </div>

          <TeamModalGrid />

          {/* Banner de contacto directo con socios */}
          <div className="mt-16 bg-[#1E3E62]/60 border border-[#B08A1A]/40 rounded-3xl p-8 sm:p-10 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-[#B08A1A] text-slate-950 flex items-center justify-center font-bold shrink-0">
                <TrendingUp className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-lg font-bold text-white">
                  ¿Desea coordinar una entrevista de diagnóstico con un socio director?
                </h4>
                <p className="text-xs sm:text-sm text-slate-300">
                  Agendamos sesiones privadas bajo estricto acuerdo de confidencialidad (NDA).
                </p>
              </div>
            </div>
            <Link
              href="/contacto"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-[#B08A1A] to-[#D4AF37] text-slate-950 font-black text-sm transition-all shrink-0 hover:brightness-110"
            >
              <span>Agendar Reunión</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
