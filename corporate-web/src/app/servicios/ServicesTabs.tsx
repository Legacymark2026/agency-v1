"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  BarChart3, 
  Cpu, 
  Network, 
  ShieldCheck, 
  Workflow, 
  Users2, 
  ArrowRight,
  Sparkles,
  Layers
} from "lucide-react";
import { servicesData, ServiceItem } from "@/data/servicesData";

const iconMap: Record<string, typeof BarChart3> = {
  BarChart3,
  Cpu,
  Network,
  ShieldCheck,
  Workflow,
  Users2,
};

export default function ServicesTabs() {
  const [activeServiceId, setActiveServiceId] = useState(servicesData[0].id);

  const activeService: ServiceItem =
    servicesData.find((s) => s.id === activeServiceId) || servicesData[0];

  const IconComponent = iconMap[activeService.iconName] || BarChart3;

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
      <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[640px]">
        {/* Pestañas Verticales a la Izquierda (Col 4) */}
        <div className="lg:col-span-4 bg-slate-50 p-6 sm:p-8 border-b lg:border-b-0 lg:border-r border-slate-200 flex flex-col justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-[#B08A1A] block mb-2">
              Líneas de Consultoría
            </span>
            <h3 className="text-lg font-bold text-slate-900 mb-6">
              Seleccione una Especialidad
            </h3>

            <div className="space-y-2">
              {servicesData.map((svc) => {
                const isSelected = svc.id === activeServiceId;
                const SvcIcon = iconMap[svc.iconName] || BarChart3;
                return (
                  <button
                    key={svc.id}
                    type="button"
                    onClick={() => setActiveServiceId(svc.id)}
                    className={`w-full text-left p-4 rounded-2xl transition-all duration-200 flex items-center justify-between group ${
                      isSelected
                        ? "bg-[#01426F] text-white shadow-lg border border-[#B08A1A]/40"
                        : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200/80"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
                          isSelected
                            ? "bg-amber-500/20 text-[#D4AF37]"
                            : "bg-slate-100 text-slate-600 group-hover:text-[#B08A1A]"
                        }`}
                      >
                        <SvcIcon className="w-5 h-5" />
                      </div>
                      <span className="text-xs sm:text-sm font-bold">
                        {svc.title.split("&")[0]}
                      </span>
                    </div>
                    <span
                      className={`w-2 h-2 rounded-full transition-all ${
                        isSelected ? "bg-[#B08A1A] scale-125" : "bg-transparent"
                      }`}
                    />
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-200 text-xs text-slate-500 flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#B08A1A]" />
            <span>Planes combinables y adaptados a su escala</span>
          </div>
        </div>

        {/* Panel de Detalle a la Derecha (Col 8): Layout de Dos Columnas */}
        <div className="lg:col-span-8 p-8 sm:p-12 flex flex-col justify-between animate-in fade-in duration-300">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <span className="px-3 py-1 rounded-full bg-amber-500/10 border border-[#B08A1A]/40 text-[#B08A1A] text-xs font-bold uppercase tracking-wider">
                Área Especializada
              </span>
              <span className="text-xs text-slate-400">
                Entrega Garantizada por Hitos
              </span>
            </div>

            <div className="flex items-start gap-4 mb-6">
              <div className="w-14 h-14 rounded-2xl bg-[#01426F] text-[#D4AF37] border border-[#B08A1A]/40 flex items-center justify-center shrink-0">
                <IconComponent className="w-7 h-7" />
              </div>
              <div>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 leading-tight">
                  {activeService.title}
                </h2>
                <p className="text-xs font-semibold text-[#B08A1A] mt-1">
                  Enfoque para: {activeService.targetAudience}
                </p>
              </div>
            </div>

            <p className="text-slate-600 text-base sm:text-lg leading-relaxed mb-8">
              {activeService.fullDescription}
            </p>

            {/* Dos Columnas Internas: Viñetas doradas + Mockup visual */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              {/* Columna Izquierda: Viñetas con Isotipo Dorado */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-[#B08A1A]" />
                  <span>Beneficios &amp; Retorno Medible</span>
                </h4>
                <div className="space-y-3">
                  {activeService.benefits.map((b, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      {/* Isotipo dorado como viñeta */}
                      <span className="mt-1 w-2.5 h-2.5 rounded-full bg-[#B08A1A] shrink-0" />
                      <span className="text-xs sm:text-sm text-slate-700 font-medium leading-snug">
                        {b}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Columna Derecha: Mockup Interactivo de la Plataforma */}
              <div className="bg-[#01426F] text-white p-6 rounded-2xl border border-amber-900/40 shadow-inner flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-[11px] text-slate-400">
                    <span className="font-mono text-[#D4AF37]">DASHBOARD EJECUTIVO</span>
                    <span className="flex items-center gap-1 text-emerald-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      En línea
                    </span>
                  </div>

                  <div className="py-4 space-y-3">
                    <div className="text-xs">
                      <div className="flex justify-between text-slate-400 mb-1">
                        <span>Eficiencia de Proceso</span>
                        <strong className="text-white">+38%</strong>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-[#B08A1A] to-[#D4AF37] w-[88%]" />
                      </div>
                    </div>

                    <div className="text-xs">
                      <div className="flex justify-between text-slate-400 mb-1">
                        <span>Alineación de KPIs</span>
                        <strong className="text-white">96/100</strong>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-blue-600 to-cyan-400 w-[96%]" />
                      </div>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-[11px] text-slate-300">
                      <span className="text-[#D4AF37] font-semibold">Entregable principal:</span>{" "}
                      {activeService.deliverables[0]}
                    </div>
                  </div>
                </div>

                <div className="pt-2 text-[10px] text-slate-500 text-center font-mono">
                  Plataforma Corporativa NEOGESTIÓN v2.4
                </div>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            <span className="text-xs text-slate-500">
              ¿Desea una propuesta formal para {activeService.title}?
            </span>
            <Link
              href={`/contacto?servicio=${encodeURIComponent(activeService.title)}`}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[#B08A1A] to-[#D4AF37] text-slate-950 font-bold text-xs hover:brightness-110 transition-all shadow-md"
            >
              <span>Solicitar Cotización de este Servicio</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
