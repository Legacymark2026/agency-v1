import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import ServicesTabs from "./ServicesTabs";
import { corporateProcess } from "@/data/servicesData";

export const metadata: Metadata = {
  title: "Servicios de Consultoría & Soluciones | NEOGESTIÓN",
  description:
    "Especialidades de consultoría corporativa: Estrategia, Transformación Cloud, Inteligencia de Negocio, Ciberseguridad y Automatización de Procesos.",
};

export default function ServiciosPage() {
  const comparisonMetrics = [
    { label: "Reducción de Costes Operativos", before: "Línea Base", after: "-35%", color: "bg-[#B08A1A]" },
    { label: "Velocidad de Toma de Decisiones", before: "Semanas", after: "Horas", color: "bg-blue-600" },
    { label: "Disponibilidad de Sistemas Críticos", before: "98.2%", after: "99.99%", color: "bg-emerald-600" },
    { label: "Cumplimiento Regulatorio y Compliance", before: "Vulnerable", after: "100% Blindado", color: "bg-amber-600" },
  ];

  return (
    <div className="flex flex-col bg-slate-50 min-h-screen">
      {/* Header Banner */}
      <section className="bg-[#0B192C] text-white py-20 lg:py-28 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_50%_0%,rgba(176,138,26,0.22),transparent)] pointer-events-none" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="inline-block px-4 py-1.5 rounded-full bg-amber-500/10 border border-[#B08A1A]/40 text-[#D4AF37] text-xs font-bold uppercase tracking-[0.2em] mb-6">
            Especialidades de Consultoría
          </span>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white max-w-4xl mx-auto leading-tight font-sans">
            Soluciones Estratégicas Explicadas con Claridad y Rigor
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Eliminamos la fricción entre la visión directiva y la ejecución operativa. Seleccione un área para descubrir metodología, entregables y retornos.
          </p>
        </div>
      </section>

      {/* Proceso: Diagrama de Flujo Horizontal con Paso Resaltado en Dorado */}
      <section className="py-20 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-widest text-[#B08A1A] block mb-2">
              Rigor Metodológico
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              Proceso Metodológico en 4 Pasos
            </h2>
            <p className="mt-3 text-base text-slate-600">
              Un flujo secuencial estructurado donde el avance se valida mediante comités conjuntos.
            </p>
          </div>

          {/* Diagrama horizontal */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
            {corporateProcess.map((item, idx) => {
              const isHighlighted = idx === 1; // Paso 2 resaltado con dorado como hito neurálgico
              return (
                <div
                  key={item.step}
                  className={`p-6 rounded-3xl border transition-all relative flex flex-col justify-between ${
                    isHighlighted
                      ? "bg-[#0B192C] text-white border-[#B08A1A] shadow-xl scale-105 z-10 gold-glow"
                      : "bg-slate-50 text-slate-900 border-slate-200"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <span
                        className={`text-3xl font-black ${
                          isHighlighted ? "text-[#D4AF37]" : "text-slate-300"
                        }`}
                      >
                        {item.step}
                      </span>
                      {isHighlighted && (
                        <span className="px-2 py-0.5 rounded-full bg-[#B08A1A]/30 text-[#D4AF37] text-[10px] font-bold uppercase">
                          Hito Clave
                        </span>
                      )}
                    </div>
                    <h3
                      className={`text-lg font-bold mb-2 ${
                        isHighlighted ? "text-white" : "text-slate-900"
                      }`}
                    >
                      {item.title}
                    </h3>
                    <p
                      className={`text-xs sm:text-sm leading-relaxed ${
                        isHighlighted ? "text-slate-300" : "text-slate-600"
                      }`}
                    >
                      {item.description}
                    </p>
                  </div>

                  <div
                    className={`mt-6 pt-3 border-t flex items-center gap-1.5 text-xs font-semibold ${
                      isHighlighted
                        ? "border-slate-800 text-[#D4AF37]"
                        : "border-slate-200 text-slate-500"
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#B08A1A]" />
                    <span>Entregable con firma</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Tabs Interactivos de Servicios: Pestañas + Detalle en 2 Columnas + Mockup */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-widest text-[#B08A1A] block mb-2">
              Exploración Dinámica
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              Catálogo de Especialidades NEOGESTIÓN
            </h2>
            <p className="mt-3 text-base text-slate-600">
              Navegue entre pestañas para examinar alcances, métricas y el panel operativo asociado.
            </p>
          </div>

          <ServicesTabs />
        </div>
      </section>

      {/* Beneficios Cuantitativos: Gráfico de Barras de Impacto */}
      <section className="py-24 bg-white border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <span className="text-xs font-bold uppercase tracking-widest text-[#B08A1A] block mb-2">
                Medición del Retorno
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                Impacto Cuantificable en Cifras Reales
              </h2>
              <p className="mt-3 text-base text-slate-600">
                Comparativa promedio registrada antes y después de la intervención de NEOGESTIÓN.
              </p>
            </div>

            <div className="bg-slate-50 p-8 sm:p-12 rounded-3xl border border-slate-200 shadow-sm space-y-8">
              {comparisonMetrics.map((metric, idx) => (
                <div key={idx} className="space-y-2">
                  <div className="flex justify-between items-center text-sm font-bold text-slate-900">
                    <span>{metric.label}</span>
                    <span className="text-[#B08A1A] font-black text-base">{metric.after}</span>
                  </div>
                  <div className="w-full h-3 rounded-full bg-slate-200 overflow-hidden">
                    <div
                      className={`h-full ${metric.color} rounded-full transition-all duration-1000`}
                      style={{ width: `${85 + idx * 4}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-400">
                    <span>Estado Inicial: {metric.before}</span>
                    <span className="text-slate-600 font-medium">Meta Lograda</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-20 bg-[#0B192C] text-white text-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-black text-white mb-4">
            ¿Requiere un diagnóstico preliminar para su organización?
          </h2>
          <p className="text-slate-300 text-base sm:text-lg mb-8 max-w-2xl mx-auto leading-relaxed">
            Coordinamos una sesión de análisis exploratorio para definir el alcance óptimo de servicio para su empresa.
          </p>
          <Link
            href="/contacto"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-gradient-to-r from-[#B08A1A] to-[#D4AF37] text-slate-950 font-black text-base hover:brightness-110 transition-all shadow-xl gold-glow"
          >
            <span>Conversar con un Socio Director</span>
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>
    </div>
  );
}
