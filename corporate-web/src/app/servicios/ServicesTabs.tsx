"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  BarChart3, 
  Cpu, 
  ShieldCheck, 
  Workflow, 
  Users2, 
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Server,
  Cloud,
  Layers,
  FileCheck,
  Award,
  Zap,
  Check,
  BookOpen,
  TrendingUp,
  Network,
  ShoppingBag,
  ShieldAlert,
  MessageSquare
} from "lucide-react";
import { 
  servicesData, 
  consultingServicesList,
  softwareStandardsList,
  softwareModulesList,
  softwareKeyFeaturesList,
  trainingServicesList,
  technicalAssistanceList,
  licensingModelsList,
  ServiceItem 
} from "@/data/servicesData";

const iconMap: Record<string, typeof BarChart3> = {
  ShieldCheck,
  Cpu,
  Users2,
  Workflow,
  BarChart3,
  TrendingUp,
  Network,
  ShoppingBag,
  ShieldAlert,
  Layers,
  MessageSquare,
};

export default function ServicesTabs() {
  const [activeTabId, setActiveTabId] = useState<string>("consultoria");
  const [selectedStandardCategory, setSelectedStandardCategory] = useState<string>("todos");

  const activeService: ServiceItem =
    servicesData.find((s) => s.id === activeTabId) || servicesData[0];

  const IconComponent = iconMap[activeService.iconName] || ShieldCheck;

  const filteredStandards = selectedStandardCategory === "todos"
    ? softwareStandardsList
    : softwareStandardsList.filter(s => s.category === selectedStandardCategory);

  return (
    <div className="space-y-12">
      {/* 1. SELECTOR SUPERIOR DE LOS 5 PILARES */}
      <div className="bg-white p-2.5 sm:p-3 rounded-2xl sm:rounded-3xl border border-slate-200 shadow-lg">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
          {servicesData.map((svc, idx) => {
            const isSelected = svc.id === activeTabId;
            const SvcIcon = iconMap[svc.iconName] || ShieldCheck;
            return (
              <button
                key={svc.id}
                type="button"
                onClick={() => setActiveTabId(svc.id)}
                className={`p-3.5 sm:p-4 rounded-xl sm:rounded-2xl transition-all duration-200 flex flex-col items-center sm:items-start text-center sm:text-left gap-2 relative ${
                  isSelected
                    ? "bg-[#01426F] text-white shadow-md border border-[#B08A1A]/40"
                    : "bg-slate-50/70 hover:bg-slate-100 text-slate-700 border border-slate-200/60"
                }`}
              >
                <div className="flex items-center gap-2 w-full justify-between">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                      isSelected
                        ? "bg-amber-500/20 text-[#D4AF37]"
                        : "bg-white text-slate-600 shadow-xs"
                    }`}
                  >
                    <SvcIcon className="w-4 h-4" />
                  </div>
                  <span
                    className={`text-[10px] font-black tracking-widest px-2 py-0.5 rounded-full ${
                      isSelected ? "bg-[#B08A1A] text-slate-950" : "bg-slate-200 text-slate-600"
                    }`}
                  >
                    0{idx + 1}
                  </span>
                </div>
                <div className="mt-1">
                  <h4 className="text-xs sm:text-sm font-bold leading-tight line-clamp-2">
                    {svc.title.replace(/^\d+\.\s*/, "")}
                  </h4>
                </div>
                {isSelected && (
                  <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-8 h-1 bg-[#D4AF37] rounded-full hidden sm:block" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. HERO PRINCIPAL DEL PILAR ACTIVO */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[460px]">
          {/* Info Principal (8 Cols) */}
          <div className="lg:col-span-8 p-6 sm:p-10 lg:p-12 flex flex-col justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-4">
                <span className="px-3 py-1 rounded-full bg-amber-500/10 border border-[#B08A1A]/40 text-[#B08A1A] text-xs font-bold uppercase tracking-wider">
                  Pilar Estratégico Corporativo
                </span>
                <span className="text-xs text-slate-400">
                  Consultoría de Colombia S.A.S.
                </span>
              </div>

              <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-[#01426F] text-[#D4AF37] border border-[#B08A1A]/40 flex items-center justify-center shrink-0 shadow-md">
                  <IconComponent className="w-6 h-6 sm:w-7 sm:h-7" />
                </div>
                <div>
                  <h2 className="text-2xl sm:text-3xl font-black text-slate-900 leading-tight">
                    {activeService.title}
                  </h2>
                  <p className="text-xs font-bold text-[#B08A1A] mt-1">
                    Enfocado a: {activeService.targetAudience}
                  </p>
                </div>
              </div>

              <p className="text-slate-600 text-sm sm:text-base leading-relaxed mb-6">
                {activeService.fullDescription}
              </p>

              {/* Viñetas de Beneficios */}
              <div className="space-y-3 mb-6">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-[#B08A1A]" />
                  <span>Beneficios Comprobables & Retorno de Inversión</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {activeService.benefits.map((b, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-50 border border-slate-200/70">
                      <CheckCircle2 className="w-4 h-4 text-[#B08A1A] shrink-0 mt-0.5" />
                      <span className="text-xs text-slate-700 font-medium leading-snug">
                        {b}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
              <span className="text-xs text-slate-500 font-medium text-center sm:text-left">
                Garantía técnica y metodológica con acompañamiento experto.
              </span>
              <Link
                href={`/contacto?servicio=${encodeURIComponent(activeService.title)}`}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[#B08A1A] to-[#D4AF37] text-slate-950 font-bold text-xs hover:brightness-110 transition-all shadow-md"
              >
                <span>Solicitar Cotización de este Servicio</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Panel Lateral Directivo (4 Cols) */}
          <div className="lg:col-span-4 bg-[#01426F] text-white p-6 sm:p-8 flex flex-col justify-between border-t lg:border-t-0 lg:border-l border-amber-900/40">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-700/80 text-[11px] text-slate-300">
                <span className="font-mono text-[#D4AF37] font-bold">ALCANCE DE ENTREGA</span>
                <span className="flex items-center gap-1 text-emerald-400 font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  100% Certificable
                </span>
              </div>

              <div className="py-5 space-y-4">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <FileCheck className="w-4 h-4 text-[#D4AF37]" />
                  <span>Entregables Formales</span>
                </h4>
                <div className="space-y-2.5">
                  {activeService.deliverables.map((deliv, idx) => (
                    <div key={idx} className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-200 flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] mt-1.5 shrink-0" />
                      <span>{deliv}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800/80 text-center">
              <div className="text-[11px] text-slate-400">
                Línea Directa de Consultoría
              </div>
              <div className="font-mono font-bold text-sm text-[#D4AF37] mt-0.5">
                +57 317 3720384
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. DETALLE ESPECÍFICO SEGÚN EL PILAR ACTIVO */}

      {/* DETALLE PILAR 1: CONSULTORÍA */}
      {activeTabId === "consultoria" && (
        <div className="space-y-6">
          <div className="text-center max-w-3xl mx-auto">
            <span className="text-xs font-bold uppercase tracking-widest text-[#B08A1A] block mb-2">
              Portafolio Técnico
            </span>
            <h3 className="text-2xl sm:text-3xl font-black text-slate-900">
              6 Líneas de Consultoría Empresarial Especializada
            </h3>
            <p className="mt-2 text-sm text-slate-600">
              Soluciones estructuradas orientadas a la competitividad, transferencia de conocimiento y mejoramiento continuo.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {consultingServicesList.map((item, idx) => (
              <div
                key={idx}
                className="bg-white p-6 rounded-2xl border border-slate-200 hover:border-[#B08A1A]/60 transition-all hover:shadow-lg flex flex-col justify-between group"
              >
                <div>
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-[#B08A1A]/30 text-[#B08A1A] flex items-center justify-center font-black text-sm mb-4 group-hover:bg-[#01426F] group-hover:text-[#D4AF37] transition-colors">
                    0{idx + 1}
                  </div>
                  <h4 className="text-base font-bold text-slate-900 group-hover:text-[#01426F] transition-colors mb-2.5 leading-snug">
                    {item.title}
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    {item.description}
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-[#B08A1A] font-bold">
                  <span>Asesoría Especializada</span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            ))}
          </div>

          {/* Banner de Impacto de Consultoría */}
          <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-[#01426F] to-[#022842] text-white border border-[#B08A1A]/40 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-2 text-center md:text-left">
              <span className="text-xs font-bold uppercase tracking-widest text-[#D4AF37]">
                Impacto Garantizado
              </span>
              <h4 className="text-xl sm:text-2xl font-black text-white">
                Mejoramiento Organizacional, Regional y Nacional Comprobable
              </h4>
              <p className="text-xs sm:text-sm text-slate-300 max-w-2xl">
                Nuestras intervenciones fortalecen la rentabilidad de las empresas y dinamizan las cadenas de valor productivas regionales y sectoriales.
              </p>
            </div>
            <Link
              href="/contacto?servicio=Consultoria"
              className="px-6 py-3 rounded-xl bg-[#D4AF37] text-slate-950 font-bold text-xs hover:bg-amber-300 transition-colors shrink-0 shadow-lg"
            >
              Agendar Diagnóstico
            </Link>
          </div>
        </div>
      )}

      {/* DETALLE PILAR 2: SOFTWARE NEOGESTIÓN */}
      {activeTabId === "software" && (
        <div className="space-y-12">
          {/* 15 Normativas */}
          <div>
            <div className="text-center max-w-3xl mx-auto mb-8">
              <span className="text-xs font-bold uppercase tracking-widest text-[#B08A1A] block mb-2">
                Cumplimiento Normativo
              </span>
              <h3 className="text-2xl sm:text-3xl font-black text-slate-900">
                15 Normativas y Estándares Integrados en una Sola Herramienta
              </h3>
              <p className="mt-2 text-sm text-slate-600">
                NeoGestión centraliza la evidencia, matrices, indicadores y flujos requeridos por cada marco normativo.
              </p>

              {/* Filtros de Categoría */}
              <div className="flex flex-wrap items-center justify-center gap-2 mt-6">
                {[
                  { id: "todos", label: "Todas las Normativas (15)" },
                  { id: "sst", label: "Seguridad & SST" },
                  { id: "calidad", label: "Calidad ISO" },
                  { id: "ambiental", label: "Gestión Ambiental" },
                  { id: "seguridad", label: "Riesgos & BASC" },
                  { id: "sector_publico", label: "Sector Público" },
                ].map((filter) => (
                  <button
                    key={filter.id}
                    type="button"
                    onClick={() => setSelectedStandardCategory(filter.id)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
                      selectedStandardCategory === filter.id
                        ? "bg-[#01426F] text-white shadow-sm"
                        : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredStandards.map((std, idx) => (
                <div
                  key={idx}
                  className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-[#B08A1A] transition-all hover:shadow-md flex items-start gap-3.5"
                >
                  <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-[#B08A1A] border border-[#B08A1A]/30 flex items-center justify-center shrink-0 mt-0.5">
                    <Award className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">{std.norm}</h4>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">{std.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 9 Módulos Operativos */}
          <div className="pt-8 border-t border-slate-200">
            <div className="text-center max-w-3xl mx-auto mb-8">
              <span className="text-xs font-bold uppercase tracking-widest text-[#B08A1A] block mb-2">
                Arquitectura Modular
              </span>
              <h3 className="text-2xl sm:text-3xl font-black text-slate-900">
                9 Módulos de Gestión de Alta Disponibilidad
              </h3>
              <p className="mt-2 text-sm text-slate-600">
                Cada módulo automatiza tareas críticas eliminando el uso de papel y carpetas físicas.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {softwareModulesList.map((mod, idx) => {
                const ModIcon = iconMap[mod.iconName] || Cpu;
                return (
                  <div
                    key={idx}
                    className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between hover:border-[#B08A1A] transition-all"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold">
                          MÓDULO 0{idx + 1}
                        </span>
                        <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-[#B08A1A] flex items-center justify-center">
                          <ModIcon className="w-4 h-4" />
                        </div>
                      </div>
                      <h4 className="text-base font-bold text-slate-900 mb-2">{mod.name}</h4>
                      <p className="text-xs text-slate-600 leading-relaxed mb-4">{mod.function}</p>
                    </div>
                    <div className="pt-3 border-t border-slate-100 flex items-center gap-1.5 text-xs text-[#B08A1A] font-semibold">
                      <Zap className="w-3.5 h-3.5" />
                      <span>Flujo Cero Papel</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 11 Funcionalidades Clave */}
          <div className="bg-slate-900 text-white p-8 sm:p-10 rounded-3xl border border-slate-800">
            <div className="text-center max-w-2xl mx-auto mb-8">
              <span className="text-xs font-bold uppercase tracking-widest text-[#D4AF37] block mb-2">
                Potencia Operativa
              </span>
              <h3 className="text-2xl sm:text-3xl font-black text-white">
                11 Funcionalidades Clave de NeoGestión
              </h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {softwareKeyFeaturesList.map((feat, idx) => (
                <div key={idx} className="p-4 rounded-xl bg-slate-800/80 border border-slate-700/80 flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#B08A1A]/30 text-[#D4AF37] flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    {idx + 1}
                  </div>
                  <span className="text-xs sm:text-sm text-slate-200 font-medium leading-snug">
                    {feat}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* DETALLE PILAR 3: CAPACITACIÓN Y FORMACIÓN */}
      {activeTabId === "capacitacion" && (
        <div className="space-y-6">
          <div className="text-center max-w-3xl mx-auto">
            <span className="text-xs font-bold uppercase tracking-widest text-[#B08A1A] block mb-2">
              Desarrollo del Talento
            </span>
            <h3 className="text-2xl sm:text-3xl font-black text-slate-900">
              6 Programas de Capacitación y Formación Especializada
            </h3>
            <p className="mt-2 text-sm text-slate-600">
              Formación técnica orientada a la apropiación de nuevas tecnologías, investigación aplicada y gestión de calidad integral.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {trainingServicesList.map((prog, idx) => (
              <div
                key={idx}
                className="bg-white p-6 rounded-2xl border border-slate-200 hover:border-[#B08A1A] transition-all hover:shadow-lg flex flex-col justify-between"
              >
                <div>
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 text-[#01426F] flex items-center justify-center font-black text-sm mb-4">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <h4 className="text-base font-bold text-slate-900 mb-2 leading-snug">
                    {prog.title}
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-4">
                    {prog.description}
                  </p>
                </div>
                <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-semibold">
                  <span>Modalidad: In-House / Virtual</span>
                  <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-mono text-[10px]">
                    Certificado
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-slate-50 p-6 sm:p-8 rounded-3xl border border-slate-200 text-center max-w-3xl mx-auto">
            <h4 className="text-lg font-bold text-slate-900 mb-2">
              ¿Desea estructurar un plan de formación a la medida de su empresa?
            </h4>
            <p className="text-xs sm:text-sm text-slate-600 mb-6">
              Diseñamos talleres prácticos, seminarios in-house y programas de entrenamiento aplicados directamente a sus procesos operativos.
            </p>
            <Link
              href="/contacto?servicio=Capacitacion"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#01426F] text-white font-bold text-xs hover:bg-[#022842] transition-colors shadow-md"
            >
              <span>Solicitar Propuesta de Capacitación</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}

      {/* DETALLE PILAR 4: ASISTENCIA TÉCNICA */}
      {activeTabId === "asistencia-tecnica" && (
        <div className="space-y-6">
          <div className="text-center max-w-3xl mx-auto">
            <span className="text-xs font-bold uppercase tracking-widest text-[#B08A1A] block mb-2">
              Acompañamiento en Planta & Gestión
            </span>
            <h3 className="text-2xl sm:text-3xl font-black text-slate-900">
              11 Líneas de Asistencia Técnica & Mejoramiento Continuo
            </h3>
            <p className="mt-2 text-sm text-slate-600">
              Metodologías probadas internacionalmente (BSC, 5S, Kaizen, JIT, Calidad Total) para transformar la productividad.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {technicalAssistanceList.map((asist, idx) => (
              <div
                key={idx}
                className="bg-white p-6 rounded-2xl border border-slate-200 hover:border-[#B08A1A] transition-all hover:shadow-md flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="w-8 h-8 rounded-lg bg-amber-500/10 text-[#B08A1A] font-bold text-xs flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Asistencia Técnica
                    </span>
                  </div>
                  <h4 className="text-sm sm:text-base font-bold text-slate-900 mb-2 leading-snug">
                    {asist.title}
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {asist.description}
                  </p>
                </div>
                <div className="mt-6 pt-3 border-t border-slate-100 flex items-center gap-1.5 text-xs text-emerald-600 font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Implementación guiada</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* DETALLE PILAR 5: MODELOS DE NEGOCIO / LICENCIAMIENTO */}
      {activeTabId === "modelos-negocio" && (
        <div className="space-y-8">
          <div className="text-center max-w-3xl mx-auto">
            <span className="text-xs font-bold uppercase tracking-widest text-[#B08A1A] block mb-2">
              Flexibilidad & Rentabilidad
            </span>
            <h3 className="text-2xl sm:text-3xl font-black text-slate-900">
              Modelos de Negocio Transparentes y Sin Costos Ocultos
            </h3>
            <p className="mt-2 text-sm text-slate-600">
              Elija entre propiedad perpetua o servicio en la nube, con usuarios ilimitados y soporte integral incluido.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {licensingModelsList.map((model, idx) => {
              const isPopular = model.code === "SAAS";
              return (
                <div
                  key={idx}
                  className={`p-8 rounded-3xl border transition-all flex flex-col justify-between relative ${
                    isPopular
                      ? "bg-[#01426F] text-white border-[#B08A1A] shadow-2xl scale-105 z-10"
                      : "bg-white text-slate-900 border-slate-200 shadow-md"
                  }`}
                >
                  {isPopular && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-[#B08A1A] to-[#D4AF37] text-slate-950 text-[10px] font-black uppercase tracking-widest shadow-md">
                      Recomendado para PYMES
                    </div>
                  )}

                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <span
                        className={`text-xs font-black uppercase tracking-widest px-2.5 py-1 rounded-lg ${
                          isPopular ? "bg-white/10 text-[#D4AF37]" : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {model.code}
                      </span>
                      {isPopular ? (
                        <Cloud className="w-6 h-6 text-[#D4AF37]" />
                      ) : (
                        <Server className="w-6 h-6 text-[#B08A1A]" />
                      )}
                    </div>

                    <h4 className="text-xl font-black mb-2">{model.name}</h4>
                    <p
                      className={`text-xs leading-relaxed mb-6 ${
                        isPopular ? "text-slate-300" : "text-slate-600"
                      }`}
                    >
                      {model.description}
                    </p>

                    <div className="space-y-3 pt-6 border-t border-slate-200/40">
                      <div className="text-[11px] font-bold uppercase tracking-wider text-[#B08A1A]">
                        Beneficios Clave:
                      </div>
                      {model.highlights.map((feat, fIdx) => (
                        <div key={fIdx} className="flex items-start gap-2.5 text-xs">
                          <Check
                            className={`w-4 h-4 shrink-0 mt-0.5 ${
                              isPopular ? "text-[#D4AF37]" : "text-[#B08A1A]"
                            }`}
                          />
                          <span className={isPopular ? "text-slate-200" : "text-slate-700 font-medium"}>
                            {feat}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-8 pt-6 border-t border-slate-200/40">
                    <div className="text-[11px] text-slate-400 mb-3">
                      <strong className={isPopular ? "text-white" : "text-slate-800"}>Perfil:</strong>{" "}
                      {model.badge}
                    </div>
                    <Link
                      href={`/contacto?servicio=${encodeURIComponent(model.name)}`}
                      className={`w-full py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md ${
                        isPopular
                          ? "bg-gradient-to-r from-[#B08A1A] to-[#D4AF37] text-slate-950 hover:brightness-110"
                          : "bg-slate-900 text-white hover:bg-[#01426F]"
                      }`}
                    >
                      <span>Cotizar este Modelo</span>
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
