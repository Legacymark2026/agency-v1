"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  ShieldCheck, 
  FileText, 
  Users, 
  Layers, 
  ArrowRight, 
  CheckCircle2, 
  Sparkles,
  Award,
  Zap
} from "lucide-react";

export interface ModuleTab {
  id: string;
  badge: string;
  title: string;
  shortDesc: string;
  bullets: string[];
  metrics: { label: string; value: string }[];
  tag: string;
  slug: string;
}

const modules: ModuleTab[] = [
  {
    id: "iso-sistemas",
    badge: "Normas Internacionales",
    title: "Sistemas Integrados de Gestión (ISO 9001, 14001, 45001, HSEQ)",
    shortDesc: "Ecosistema integral para parametrizar la totalidad de los procesos de su compañía, asegurar la trazabilidad directiva y garantizar la aprobación fluida en auditorías de entes certificadores (ICONTEC, Bureau Veritas, SGS, etc.).",
    bullets: [
      "Mapa de procesos interactivo con entradas, salidas, recursos e indicadores.",
      "Gestión integral de No Conformidades, Acciones Correctivas y Preventivas (CAPA).",
      "Matriz de requisitos legales y evaluación de cumplimiento en línea.",
      "Tableros de control KPI en tiempo real para Comités de Gerencia.",
    ],
    metrics: [
      { label: "Aprobación de Auditorías", value: "99.4%" },
      { label: "Tiempo de Preparación", value: "-60%" },
    ],
    tag: "Calidad & Estrategia",
    slug: "sistemas-gestion-iso-hseq",
  },
  {
    id: "cero-papel",
    badge: "Eficiencia Administrativa",
    title: "Gestión Documental Cero Papel & Trazabilidad",
    shortDesc: "Elimine los archivadores físicos, reduzca radicalmente costos de impresión y asegure el control estricto del ciclo de vida de los documentos institucionales con firma digital y notificaciones automatizadas.",
    bullets: [
      "Ciclo completo de creación, revisión colaborativa, aprobación y distribución.",
      "Control de cambios y versiones automático: adiós a documentos obsoletos en circulación.",
      "Firma electrónica/digital con registro de fecha, hora y responsable.",
      "Buscador inteligente para recuperar actas, manuales y registros en segundos.",
    ],
    metrics: [
      { label: "Ahorro en Papelería y Bodegaje", value: "-80%" },
      { label: "Tiempo de Aprobación de Formatos", value: "1.2 Días" },
    ],
    tag: "Sostenibilidad & Ahorro",
    slug: "gestion-documental-cero-papel",
  },
  {
    id: "usuarios-ilimitados",
    badge: "Ventaja Competitiva Única",
    title: "Software Sin Costo de Licencia • Usuarios Ilimitados",
    shortDesc: "Olvídese de las tarifas por usuario o por puesto de trabajo que encarecen el software tradicional. En NeoGestión integramos a todos sus colaboradores, contratistas y sedes sin cobrar un peso adicional por cada usuario.",
    bullets: [
      "Acceso ilimitado para toda su nómina sin penalizaciones por crecimiento de personal.",
      "Infraestructura en la nube con hosting de alta disponibilidad y copias de respaldo.",
      "Perfiles de seguridad granulares: permisos por rol, proceso y sede.",
      "Soporte técnico preferencial y actualizaciones continuas sin costo oculto.",
    ],
    metrics: [
      { label: "Costo por Licencia Adicional", value: "$0" },
      { label: "Escalabilidad Empresarial", value: "100% Libre" },
    ],
    tag: "Cero Costos Ocultos",
    slug: "software-usuarios-ilimitados",
  },
  {
    id: "sg-sst",
    badge: "Cumplimiento Obligatorio",
    title: "Seguridad & Salud en el Trabajo (SG-SST Decreto 1072)",
    shortDesc: "Ecosistema especializado para cumplir al 100% con los Estándares Mínimos de la Resolución 0312 de 2019 y el Decreto 1072 de 2015 del Ministerio del Trabajo, previniendo multas y blindando a su directiva.",
    bullets: [
      "Matriz de identificación de peligros, evaluación y valoración de riesgos (GTC 45).",
      "Administración y registro de reuniones del COPASST y Comité de Convivencia Laboral.",
      "Control de ausentismo laboral, investigación de accidentes e incidentes con metodología Furat.",
      "Seguimiento al Plan Anual de Capacitación y evaluaciones médicas ocupacionales.",
    ],
    metrics: [
      { label: "Cumplimiento Res. 0312", value: "100%" },
      { label: "Reporte de Incidentes", value: "Inmediato" },
    ],
    tag: "Blindaje Legal",
    slug: "seguridad-salud-trabajo-sgsst",
  },
  {
    id: "riesgo-control",
    badge: "Seguridad & Continuidad",
    title: "Control de Riesgo & Proveedores (SARLAFT, BASC, RUC)",
    shortDesc: "Herramientas directivas para la prevención del riesgo de lavado de activos, financiamiento del terrorismo y blindaje de la cadena de suministro en operaciones de transporte, industria, petróleo y servicios.",
    bullets: [
      "Debida diligencia y verificación automatizada de contrapartes en listas vinculantes.",
      "Evaluación y reevaluación periódica de proveedores críticos y contratistas.",
      "Trazabilidad de operaciones para auditorías de seguridad en comercio exterior (BASC).",
      "Calificación de contratistas para el sector de hidrocarburos y energía (RUC).",
    ],
    metrics: [
      { label: "Debida Diligencia", value: "Automatizada" },
      { label: "Riesgo en Cadena Logística", value: "Minimizado" },
    ],
    tag: "Cadena de Valor Segura",
    slug: "riesgo-sarlaft-basc-ruc",
  },
];

export default function ModuleExplorer() {
  const [selectedId, setSelectedId] = useState(modules[0].id);
  const activeModule = modules.find((m) => m.id === selectedId) || modules[0];

  return (
    <section className="py-24 bg-slate-50 border-b border-slate-200 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-[#B08A1A]/30 text-[#B08A1A] text-xs font-bold uppercase tracking-[0.2em] mb-4">
            <Zap className="w-3.5 h-3.5" />
            <span>Arquitectura Modular Integral</span>
          </span>
          <h2 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight font-sans">
            La Plataforma que se Adapta al Tamaño y Complejidad de su Empresa
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-600 leading-relaxed">
            Descubra las capacidades operativas desarrolladas por <strong className="text-slate-900">Consultoría de Colombia S.A.S.</strong> para sistematizar la gestión corporativa de extremo a extremo.
          </p>
        </div>

        {/* Desktop & Mobile Tab Selectors */}
        <div className="flex items-center justify-start lg:justify-center gap-2 pb-4 overflow-x-auto scrollbar-none mb-10">
          {modules.map((m) => {
            const isSelected = m.id === selectedId;
            return (
              <button
                key={m.id}
                onClick={() => setSelectedId(m.id)}
                className={`px-5 py-3 rounded-2xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all flex items-center gap-2.5 ${
                  isSelected
                    ? "bg-[#01426F] text-[#D4AF37] shadow-lg border border-[#B08A1A]/50 scale-[1.02]"
                    : "bg-white text-slate-700 hover:text-slate-900 hover:bg-slate-100 border border-slate-200"
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${isSelected ? "bg-[#D4AF37]" : "bg-slate-300"}`} />
                <span>{m.tag}</span>
              </button>
            );
          })}
        </div>

        {/* Selected Module Detail Panel */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden p-6 sm:p-10 lg:p-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            {/* Left Column: Descriptions and Bullets */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 text-[#B08A1A] text-xs font-bold uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5" />
                <span>{activeModule.badge}</span>
              </div>

              <h3 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 leading-tight">
                {activeModule.title}
              </h3>

              <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
                {activeModule.shortDesc}
              </p>

              <div className="space-y-3 pt-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                  Entregables y Capacidades Incluidas:
                </span>
                {activeModule.bullets.map((b, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                    <span className="text-sm font-medium text-slate-700">{b}</span>
                  </div>
                ))}
              </div>

              <div className="pt-6 flex flex-col sm:flex-row gap-4">
                <Link
                  href="/contacto"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-[#B08A1A] to-[#D4AF37] text-slate-950 font-bold text-sm hover:brightness-110 transition-all shadow-md"
                >
                  <span>Solicitar Demostración de este Módulo</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href={`/servicios#${activeModule.slug}`}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-sm transition-all"
                >
                  <span>Ver Ficha Técnica Completa</span>
                </Link>
              </div>
            </div>

            {/* Right Column: Key Stats & Enterprise Card */}
            <div className="lg:col-span-5 bg-gradient-to-br from-[#01426F] to-[#07111E] text-white p-8 rounded-3xl border border-[#B08A1A]/30 shadow-xl flex flex-col justify-between space-y-8">
              <div>
                <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                  <span className="text-xs font-bold uppercase tracking-widest text-[#D4AF37]">
                    Impacto Operativo
                  </span>
                  <Award className="w-5 h-5 text-[#D4AF37]" />
                </div>

                <div className="grid grid-cols-2 gap-4 mt-6">
                  {activeModule.metrics.map((metric, i) => (
                    <div key={i} className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
                      <div className="text-2xl sm:text-3xl font-black text-white">
                        {metric.value}
                      </div>
                      <div className="text-xs text-slate-400 mt-1 font-medium">
                        {metric.label}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-amber-500/10 border border-[#B08A1A]/30 space-y-2">
                <div className="text-xs font-bold text-[#D4AF37] uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Respaldo Consultoría de Colombia S.A.S.</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Implementación acompañada por consultores especialistas certificados en auditoría líder con experiencia real en comités directivos.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
