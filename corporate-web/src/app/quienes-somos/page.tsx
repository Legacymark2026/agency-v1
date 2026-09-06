import type { Metadata } from "next";
import Link from "next/link";
import { 
  Target, 
  Eye, 
  ArrowRight,
  TrendingUp,
  Sparkles
} from "lucide-react";
import TeamModalGrid from "./TeamModalGrid";
import ClientsSection from "@/components/ClientsSection";
import { corporateValues, corporateHistory } from "@/data/teamData";

export const metadata: Metadata = {
  title: "Quiénes Somos & Filosofía | NEOGESTIÓN",
  description:
    "Conozca la historia, misión, valores y el equipo directivo detrás de NEOGESTIÓN. Transformamos la complejidad corporativa en eficiencia.",
};

export default function QuienesSomosPage() {
  const metrics = [
    { value: "+15", label: "Años de Liderazgo", desc: "Trayectoria ininterrumpida" },
    { value: "+480", label: "Proyectos Ejecutados", desc: "En corporaciones globales" },
    { value: "98.7%", label: "Tasa de Retención", desc: "Relaciones directivas duraderas" },
    { value: "$120M+", label: "Valor Generado", desc: "Eficiencia y reducción de costos" },
  ];

  return (
    <div className="flex flex-col bg-slate-50 min-h-screen">
      {/* Banner Principal */}
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
            <strong className="text-white">NeoGestión</strong> es la solución y plataforma tecnológica de gestión desarrollada por <strong className="text-[#D4AF37]">Consultoría de Colombia S.A.S.</strong> Brindamos atención y cobertura 100% digital a nivel nacional para transformar procesos, optimizar operaciones y acelerar la rentabilidad corporativa.
          </p>
        </div>
      </section>

      {/* Cita Destacada de Filosofía Corporativa */}
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

      {/* Misión y Visión */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white p-8 sm:p-10 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden group hover:border-[#B08A1A] transition-colors">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-[#B08A1A] flex items-center justify-center mb-6">
                <Target className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-black text-slate-900 mb-3">Nuestra Misión</h2>
              <p className="text-slate-600 text-base leading-relaxed">
                Fortalecer el crecimiento de las organizaciones mediante un ecosistema de tecnología, consultoría y formación, que transforme su gestión, optimice procesos e impulse su productividad, competitividad y generación de valor, a través del conocimiento especializado, la experiencia y NeoGestión como solución tecnológica.
              </p>
            </div>

            <div className="bg-white p-8 sm:p-10 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden group hover:border-[#B08A1A] transition-colors">
              <div className="w-12 h-12 rounded-2xl bg-slate-900 text-[#D4AF37] flex items-center justify-center mb-6">
                <Eye className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-black text-slate-900 mb-3">Nuestra Visión</h2>
              <p className="text-slate-600 text-base leading-relaxed">
                Para el 2031, ser aliados estratégicos de las organizaciones en Colombia, impulsando su crecimiento y transformación tecnológica por medio de NeoGestión, adaptándonos a los cambios del entorno y contribuyendo al desarrollo empresarial del país.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Valores Corporativos en Tarjetas Interactivas con Gradientes */}
      <section id="valores" className="py-24 bg-white border-y border-slate-200">
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

      {/* Historia & Línea de Tiempo Interactiva */}
      <section className="py-24 bg-slate-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-widest text-[#B08A1A] block mb-2">
              Evolución Institucional
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              Eje de Hitos y Madurez Corporativa
            </h2>
            <p className="mt-3 text-base text-slate-600">
              Una trayectoria forjada resolviendo los desafíos directivos más exigentes.
            </p>
          </div>

          {/* Línea de tiempo vertical con nodos dorados */}
          <div className="relative border-l-2 border-[#B08A1A]/40 ml-4 sm:ml-32 space-y-12 py-6">
            {corporateHistory.map((item, idx) => (
              <div key={idx} className="relative pl-8 sm:pl-12 group">
                {/* Nodo Circular con el Isotipo Dorado */}
                <div className="absolute -left-[17px] top-1.5 w-8 h-8 rounded-full bg-[#01426F] border-2 border-[#B08A1A] flex items-center justify-center text-[#D4AF37] shadow-md group-hover:scale-125 group-hover:bg-[#B08A1A] group-hover:text-slate-950 transition-all duration-300">
                  <span className="w-2 h-2 rounded-full bg-current" />
                </div>

                <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm group-hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl font-black text-[#B08A1A]">
                      {item.year}
                    </span>
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      • Hito Estratégico
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">
                    {item.title}
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CLIENTES CORPORATIVOS & INSTITUCIONALES */}
      <ClientsSection />

      {/* Equipo Directivo con Efecto Hover y Modal de Biografía */}
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
