"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { 
  ArrowRight, 
  Sparkles, 
  CheckCircle2, 
  ShieldCheck, 
  Award, 
  Layers, 
  FileText, 
  AlertTriangle, 
  Users, 
  Activity, 
  ChevronDown, 
  Check, 
  Lock,
  ArrowUpRight,
  TrendingUp,
  FileCheck
} from "lucide-react";

export default function HeroInteractive() {
  const [activeTab, setActiveTab] = useState<"dashboard" | "ceropapel" | "sgsst" | "compliance">("dashboard");

  return (
    <section className="relative overflow-hidden bg-[#01426F] text-white pt-24 pb-20 lg:pt-32 lg:pb-32 hero-ambient-mesh">
      {/* Dynamic background network lines */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-15%,rgba(176,138,26,0.22),transparent_70%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(176,138,26,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(176,138,26,0.06)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_70%_60%_at_50%_35%,#000_70%,transparent_100%)] pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 z-10">
        {/* Header content */}
        <div className="text-center max-w-4xl mx-auto">
          {/* Strategic Institutional & Product Endorsement Badge */}
          <div className="inline-flex flex-wrap items-center justify-center gap-2.5 sm:gap-3.5 px-4 sm:px-6 py-2 rounded-2xl bg-slate-900/80 border border-[#B08A1A]/40 backdrop-blur-md text-xs font-semibold mb-6 shadow-xl hover:border-[#D4AF37]/60 transition-all">
            <div className="flex items-center gap-2">
              <Image 
                src="/brand/logo-conscolombia-white.svg" 
                alt="Consultoría de Colombia S.A.S." 
                width={22} 
                height={22} 
                className="object-contain" 
              />
              <span className="font-helvetica-thin tracking-[0.14em] text-slate-200 text-[11px] sm:text-xs uppercase font-bold">
                Consultoría de Colombia S.A.S.
              </span>
            </div>
            <span className="h-4 w-px bg-[#B08A1A]/40 hidden sm:inline-block" />
            <div className="flex items-center gap-2">
              <span className="text-slate-400 text-[11px] hidden md:inline">presenta el producto oficial:</span>
              <Image
                src="/brand/logo-neogestion-white-gold.svg"
                alt="NeoGESTIÓN software"
                width={135}
                height={51}
                className="h-6 w-auto object-contain"
              />
            </div>
          </div>

          {/* Main Headline */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-white leading-[1.1] font-sans">
            Transformamos la complejidad en{" "}
            <span className="text-gold-gradient">
              eficiencia
            </span>.
          </h1>

          {/* Subtitle */}
          <p className="mt-6 text-base sm:text-xl text-slate-300 leading-relaxed max-w-3xl mx-auto font-normal">
            Planee, gestione, controle y evalúe procesos, operaciones y personas. Ecosistema integral para normas <strong className="text-white">ISO, SG-SST, HSEQ, SARLAFT y BASC</strong> con filosofía <strong className="text-[#D4AF37]">Cero Papel</strong> y <strong className="text-white">usuarios ilimitados sin costo de licencia</strong>.
          </p>

          {/* CTAs */}
          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              href="/contacto"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-gradient-to-r from-[#B08A1A] to-[#D4AF37] text-slate-950 font-black text-base hover:brightness-110 transition-all shadow-xl gold-glow hover:scale-[1.02]"
            >
              <span>Solicitar Demostración en Vivo</span>
              <ArrowRight className="w-5 h-5" />
            </Link>

            <Link
              href="/servicios"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl enterprise-card text-slate-200 hover:text-white text-base font-semibold transition-all hover:bg-slate-900/90"
            >
              <span>Explorar Módulos &amp; Normas</span>
              <ArrowUpRight className="w-4 h-4 text-[#D4AF37]" />
            </Link>
          </div>

          {/* Quick Pillars */}
          <div className="mt-10 flex flex-wrap justify-center items-center gap-6 text-xs sm:text-sm text-slate-300">
            <span className="inline-flex items-center gap-1.5 font-medium">
              <CheckCircle2 className="w-4 h-4 text-[#D4AF37]" /> Usuarios ilimitados
            </span>
            <span className="inline-flex items-center gap-1.5 font-medium">
              <ShieldCheck className="w-4 h-4 text-[#D4AF37]" /> Hosting seguro &amp; Backup diario
            </span>
            <span className="inline-flex items-center gap-1.5 font-medium">
              <Award className="w-4 h-4 text-[#D4AF37]" /> Certificaciones ISO 9001 / 45001 / SG-SST
            </span>
          </div>
        </div>

        {/* INTERACTIVE SOFTWARE SHOWCASE (MOCKUP) */}
        <div className="mt-14 max-w-5xl mx-auto">
          <div className="enterprise-card rounded-3xl overflow-hidden shadow-2xl border border-[#B08A1A]/40 bg-[#07111E]/95">
            {/* Window Topbar with Official Product Logo & Endorsement */}
            <div className="bg-[#050C16] px-4 sm:px-6 py-3.5 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block" />
                  <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block" />
                  <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block" />
                </div>
                <div className="h-4 w-px bg-slate-800 mx-1 hidden sm:block" />
                {/* Prominent Strategic Product Logo */}
                <div className="flex items-center gap-2.5">
                  <Image
                    src="/brand/isotype-gold.svg"
                    alt="NeoGestión Isotipo"
                    width={22}
                    height={22}
                    className="object-contain"
                  />
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-xs sm:text-sm tracking-wide font-sans">
                      Neo<span className="text-[#D4AF37]">GESTIÓN</span>
                    </span>
                    <span className="text-[9px] font-bold text-[#B08A1A] font-mono uppercase bg-amber-500/10 px-2 py-0.5 rounded border border-[#B08A1A]/30">
                      Cloud Suite
                    </span>
                  </div>
                  <span className="text-slate-600 hidden md:inline">•</span>
                  <span className="text-[11px] text-slate-400 font-helvetica-thin tracking-[0.06em] hidden md:inline">
                    Un producto de <strong className="text-slate-200 font-medium">Consultoría de Colombia S.A.S.</strong>
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <div className="flex items-center gap-2 text-xs text-emerald-400 font-mono">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse inline-block" />
                  <span className="hidden sm:inline">ONLINE • USUARIOS ILIMITADOS</span>
                </div>
              </div>
            </div>

            {/* Interactive Module Navigation Bar */}
            <div className="bg-slate-900/80 px-4 sm:px-6 py-2.5 border-b border-slate-800 flex items-center gap-2 overflow-x-auto scrollbar-none">
              <button
                onClick={() => setActiveTab("dashboard")}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
                  activeTab === "dashboard"
                    ? "bg-[#B08A1A] text-slate-950 shadow-md"
                    : "text-slate-300 hover:text-white hover:bg-slate-800"
                }`}
              >
                <Activity className="w-3.5 h-3.5" />
                <span>Dashboard Directivo</span>
              </button>

              <button
                onClick={() => setActiveTab("ceropapel")}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
                  activeTab === "ceropapel"
                    ? "bg-[#B08A1A] text-slate-950 shadow-md"
                    : "text-slate-300 hover:text-white hover:bg-slate-800"
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Gestión Cero Papel</span>
              </button>

              <button
                onClick={() => setActiveTab("sgsst")}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
                  activeTab === "sgsst"
                    ? "bg-[#B08A1A] text-slate-950 shadow-md"
                    : "text-slate-300 hover:text-white hover:bg-slate-800"
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>SG-SST &amp; Riesgos</span>
              </button>

              <button
                onClick={() => setActiveTab("compliance")}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
                  activeTab === "compliance"
                    ? "bg-[#B08A1A] text-slate-950 shadow-md"
                    : "text-slate-300 hover:text-white hover:bg-slate-800"
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>SARLAFT / BASC / RUC</span>
              </button>
            </div>

            {/* Dynamic UI Content based on Active Tab */}
            <div className="p-5 sm:p-8">
              {activeTab === "dashboard" && (
                <div className="space-y-6 animate-fadeIn">
                  {/* KPI Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
                      <div className="text-xs text-slate-400 font-semibold mb-1">Índice Global de Cumplimiento</div>
                      <div className="text-3xl font-black text-white flex items-center gap-2">
                        <span>99.4%</span>
                        <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">+4.2% audit</span>
                      </div>
                      <div className="w-full bg-slate-800 h-1.5 rounded-full mt-3 overflow-hidden">
                        <div className="bg-gradient-to-r from-[#B08A1A] to-emerald-400 h-full w-[99.4%]" />
                      </div>
                    </div>

                    <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
                      <div className="text-xs text-slate-400 font-semibold mb-1">Usuarios Activos en la Organización</div>
                      <div className="text-3xl font-black text-[#D4AF37] flex items-center gap-2">
                        <span>Ilimitados</span>
                        <span className="text-[11px] font-bold text-emerald-300 bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-500/30">$0 adicional</span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-2">Acceso simultáneo para toda su nómina.</p>
                    </div>

                    <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
                      <div className="text-xs text-slate-400 font-semibold mb-1">Auditorías ISO &amp; HSEQ</div>
                      <div className="text-3xl font-black text-emerald-400 flex items-center gap-2">
                        <span>0 Fallas</span>
                        <span className="text-xs font-bold text-slate-300 bg-slate-800 px-2 py-0.5 rounded-full">100% trazable</span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-2">Expedientes listos para entes certificadores.</p>
                    </div>
                  </div>

                  {/* Operational Process Table */}
                  <div className="bg-slate-900/40 rounded-2xl border border-slate-800 p-4">
                    <div className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3 flex items-center justify-between">
                      <span>Procesos Clave en Ejecución Directiva</span>
                      <span className="text-[#D4AF37] text-[11px]">Actualización en tiempo real</span>
                    </div>
                    <div className="space-y-2 text-xs">
                      <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/40 border border-slate-800">
                        <div className="flex items-center gap-3">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          <span className="font-semibold text-slate-200">Revisión por la Dirección - ISO 9001:2015</span>
                        </div>
                        <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">Aprobado</span>
                      </div>
                      <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/40 border border-slate-800">
                        <div className="flex items-center gap-3">
                          <Activity className="w-4 h-4 text-[#D4AF37]" />
                          <span className="font-semibold text-slate-200">Plan de Trabajo Anual SG-SST (Res. 0312)</span>
                        </div>
                        <span className="text-[11px] font-bold text-[#D4AF37] bg-amber-500/10 px-2 py-0.5 rounded-full">En Progreso 92%</span>
                      </div>
                      <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/40 border border-slate-800">
                        <div className="flex items-center gap-3">
                          <Lock className="w-4 h-4 text-purple-400" />
                          <span className="font-semibold text-slate-200">Matriz de Debida Diligencia SARLAFT</span>
                        </div>
                        <span className="text-[11px] font-bold text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-full">Verificado</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "ceropapel" && (
                <div className="space-y-6 animate-fadeIn">
                  <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h4 className="text-base font-bold text-white flex items-center gap-2">
                        <FileCheck className="w-5 h-5 text-[#D4AF37]" />
                        <span>Módulo de Gestión Documental &amp; Cero Papel</span>
                      </h4>
                      <p className="text-xs text-slate-400 mt-1">
                        Control total de ciclo de vida documental: Creación, revisión, aprobación y firma digital sin imprimir una sola hoja.
                      </p>
                    </div>
                    <span className="px-3 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold text-center">
                      -80% Ahorro Operativo
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800">
                      <div className="font-bold text-slate-200 mb-2">Trazabilidad &amp; Versiones</div>
                      <p className="text-slate-400 leading-relaxed">
                        Control de versiones automático, histórico de cambios con autor y fecha, y bloqueo de documentos obsoletos según ISO 9001 Numeral 7.5.
                      </p>
                    </div>
                    <div className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800">
                      <div className="font-bold text-slate-200 mb-2">Firma Digital &amp; Distribución</div>
                      <p className="text-slate-400 leading-relaxed">
                        Notificaciones a responsables, firma digital integrada y consulta móvil desde cualquier lugar de Colombia.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "sgsst" && (
                <div className="space-y-6 animate-fadeIn">
                  <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h4 className="text-base font-bold text-white flex items-center gap-2">
                        <ShieldCheck className="w-5 h-5 text-emerald-400" />
                        <span>SG-SST Decreto 1072 &amp; Estándares Mínimos Res. 0312</span>
                      </h4>
                      <p className="text-xs text-slate-400 mt-1">
                        Matriz de peligros GTC-45 automatizada, comités COPASST / CCL y control de accidentalidad en tiempo real.
                      </p>
                    </div>
                    <span className="px-3 py-1 rounded-xl bg-[#B08A1A]/20 border border-[#B08A1A]/40 text-[#D4AF37] text-xs font-bold text-center">
                      100% Cumplimiento Legal
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div className="p-3.5 rounded-xl bg-slate-900/40 border border-slate-800">
                      <div className="font-bold text-slate-200 mb-1">Matriz de Peligros</div>
                      <div className="text-emerald-400 font-semibold">Valoración GTC-45 en línea</div>
                    </div>
                    <div className="p-3.5 rounded-xl bg-slate-900/40 border border-slate-800">
                      <div className="font-bold text-slate-200 mb-1">Actas COPASST / Convivencia</div>
                      <div className="text-[#D4AF37] font-semibold">Convocatorias y votaciones</div>
                    </div>
                    <div className="p-3.5 rounded-xl bg-slate-900/40 border border-slate-800">
                      <div className="font-bold text-slate-200 mb-1">Planes de Emergencia</div>
                      <div className="text-blue-400 font-semibold">Brigadas y simulacros listos</div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "compliance" && (
                <div className="space-y-6 animate-fadeIn">
                  <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h4 className="text-base font-bold text-white flex items-center gap-2">
                        <Layers className="w-5 h-5 text-purple-400" />
                        <span>Gestión de Riesgo &amp; Cumplimiento (SARLAFT, BASC, RUC)</span>
                      </h4>
                      <p className="text-xs text-slate-400 mt-1">
                        Prevención del riesgo de lavado de activos y financiación del terrorismo, seguridad en cadena de suministro y contratistas.
                      </p>
                    </div>
                    <span className="px-3 py-1 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400 text-xs font-bold text-center">
                      Debida Diligencia
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800">
                      <div className="font-bold text-slate-200 mb-2">Consulta de Listas Restrictivas</div>
                      <p className="text-slate-400 leading-relaxed">
                        Verificación ágil de contrapartes, clientes, proveedores y socios comerciales en listas vinculantes nacionales e internacionales.
                      </p>
                    </div>
                    <div className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800">
                      <div className="font-bold text-slate-200 mb-2">Cadena de Suministro Segura (BASC / RUC)</div>
                      <p className="text-slate-400 leading-relaxed">
                        Evaluación integral de proveedores críticos, transportistas e indicadores de desempeño contratista para operaciones petroleras e industriales.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom mockup bar */}
            <div className="bg-[#050C16] px-6 py-4 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <span className="text-slate-400">
                ¿Desea una demostración personalizada con los procesos específicos de su compañía?
              </span>
              <Link
                href="/contacto"
                className="inline-flex items-center gap-1.5 font-bold text-[#D4AF37] hover:text-white transition-colors"
              >
                <span>Agendar sesión con especialista</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="mt-12 flex flex-col items-center">
          <a
            href="#metricas-impacto"
            aria-label="Desplazarse hacia abajo"
            className="scroll-indicator-pulse inline-flex flex-col items-center text-slate-400 hover:text-[#D4AF37] transition-colors"
          >
            <span className="text-[10px] uppercase font-bold tracking-widest mb-1">Explorar Solución</span>
            <ChevronDown className="w-4 h-4" />
          </a>
        </div>
      </div>
    </section>
  );
}
