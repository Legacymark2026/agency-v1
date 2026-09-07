"use client";

import Image from "next/image";
import Link from "next/link";
import { 
  ShieldCheck, 
  Sparkles, 
  Layers, 
  ArrowRight, 
  Cpu, 
  Award, 
  Users, 
  CheckCircle2,
  Lock,
  Compass
} from "lucide-react";

export default function ProductEndorsementSection() {
  return (
    <section className="py-20 bg-gradient-to-b from-[#01426F] via-[#022845] to-[#01426F] text-white relative overflow-hidden border-y border-amber-900/30">
      {/* Dynamic ambient glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(176,138,26,0.18),transparent_50%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_70%,rgba(1,66,111,0.4),transparent_50%)] pointer-events-none" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Strategic Header */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-[#B08A1A]/40 text-[#D4AF37] text-xs font-bold uppercase tracking-[0.2em] mb-4">
            <Sparkles className="w-3.5 h-3.5 text-[#B08A1A]" />
            <span>Arquitectura Corporativa &amp; Ecosistema Tecnológico</span>
          </div>
          
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight font-sans">
            La Sinergia Perfecta entre{" "}
            <span className="text-gold-gradient">Consultoría Estratégica</span> y{" "}
            <span className="text-white">Software Propietario</span>
          </h2>
          
          <p className="mt-4 text-base sm:text-lg text-slate-300 leading-relaxed">
            <strong className="text-white">NeoGestión</strong> no es un software genérico de terceros: es la solución tecnológica integral desarrollada, perfeccionada y respaldada directamente por la firma <strong className="text-[#D4AF37]">Consultoría de Colombia S.A.S.</strong>
          </p>
        </div>

        {/* Dual Brand Interactive Card */}
        <div className="enterprise-card rounded-3xl p-6 sm:p-10 lg:p-12 border border-[#B08A1A]/40 bg-[#071526]/90 shadow-2xl relative overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            
            {/* Left Entity: Parent Company (Consultoría de Colombia) */}
            <div className="lg:col-span-5 bg-[#0A1F36] p-7 sm:p-8 rounded-2xl border border-slate-700/60 flex flex-col justify-between h-full relative group hover:border-[#B08A1A]/50 transition-all">
              <div>
                <div className="flex items-center justify-between mb-6">
                  <span className="px-3 py-1 rounded-full bg-[#B08A1A]/15 border border-[#B08A1A]/40 text-[#D4AF37] text-[10px] font-bold uppercase tracking-wider">
                    Firma Consultora Creadora
                  </span>
                  <span className="text-xs font-mono text-slate-400">+15 Años de Liderazgo</span>
                </div>

                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 rounded-2xl bg-[#01426F] border border-[#B08A1A]/40 p-2 flex items-center justify-center shrink-0 shadow-lg">
                    <Image
                      src="/brand/logo-conscolombia-white.svg"
                      alt="Consultoría de Colombia SAS"
                      width={48}
                      height={48}
                      className="object-contain"
                    />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">Consultoría de Colombia S.A.S.</h3>
                    <p className="text-xs text-[#D4AF37] font-medium tracking-wide">Firma Matriz &amp; Respaldo Directivo</p>
                  </div>
                </div>

                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-6">
                  Firma líder en consultoría de alta dirección, diseño organizacional y sistemas de gestión integrados. Aporta la metodología, el rigor técnico-jurídico y la experiencia en auditorías de entes certificadores internacionales.
                </p>

                <div className="space-y-2.5 text-xs text-slate-300">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#D4AF37] shrink-0" />
                    <span>Acompañamiento por consultores directivos sénior</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#D4AF37] shrink-0" />
                    <span>Metodología probada en +480 organizaciones</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#D4AF37] shrink-0" />
                    <span>Garantía de aprobación en ICONTEC, SGS y Bureau Veritas</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-700/50 flex items-center justify-between">
                <span className="text-[11px] text-slate-400 font-mono">PERSONERÍA JURÍDICA S.A.S.</span>
                <Link
                  href="/quienes-somos"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[#D4AF37] hover:text-white transition-colors"
                >
                  <span>Conocer la firma</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* Central Connector Link (Desktop only) */}
            <div className="lg:col-span-2 flex flex-col items-center justify-center text-center py-2">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#B08A1A] to-[#D4AF37] text-slate-950 flex items-center justify-center font-bold text-sm shadow-xl gold-glow mb-3">
                <Sparkles className="w-5 h-5 text-slate-950" />
              </div>
              <span className="text-[11px] font-bold text-[#D4AF37] uppercase tracking-widest block mb-1">
                Desarrolla &amp; Respalda
              </span>
              <p className="text-[10px] text-slate-400 max-w-[140px] leading-tight">
                El software oficial para la gestión corporativa moderna
              </p>
              <div className="hidden lg:flex items-center justify-center gap-1 mt-3">
                <span className="w-2 h-0.5 bg-[#B08A1A]" />
                <span className="w-8 h-0.5 bg-gradient-to-r from-[#B08A1A] to-white" />
                <span className="w-2 h-0.5 bg-white" />
              </div>
            </div>

            {/* Right Entity: Flagship Product (NeoGestión Software) */}
            <div className="lg:col-span-5 bg-gradient-to-br from-[#0B2544] to-[#081B30] p-7 sm:p-8 rounded-2xl border border-[#B08A1A]/50 flex flex-col justify-between h-full relative group shadow-xl">
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

              <div>
                <div className="flex items-center justify-between mb-6">
                  <span className="px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[10px] font-bold uppercase tracking-wider">
                    Producto Tecnológico Insignia
                  </span>
                  <span className="text-xs font-mono text-emerald-400 font-semibold">100% Cloud Digital</span>
                </div>

                <div className="mb-6">
                  {/* Official Product Logo Display */}
                  <div className="relative inline-block drop-shadow-[0_4px_16px_rgba(0,0,0,0.4)]">
                    <Image
                      src="/brand/logo-neogestion-white-gold.svg"
                      alt="NeoGESTIÓN software - Producto Oficial"
                      width={260}
                      height={99}
                      className="w-auto h-12 sm:h-14 object-contain"
                    />
                  </div>
                  <p className="text-xs text-slate-300 font-medium tracking-wide mt-2">
                    Ecosistema Integral de Gestión, Procesos &amp; Personas
                  </p>
                </div>

                <p className="text-xs sm:text-sm text-slate-200 leading-relaxed mb-6">
                  Plataforma en la nube que automatiza los sistemas de gestión corporativos (ISO, SG-SST, HSEQ, SARLAFT, BASC) bajo la filosofía <strong className="text-[#D4AF37]">Cero Papel</strong> y con modelo de <strong className="text-white">usuarios ilimitados sin costo de licencia</strong>.
                </p>

                <div className="space-y-2.5 text-xs text-slate-200">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span><strong>Usuarios Ilimitados:</strong> Toda su compañía conectada sin sobrecostos</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span><strong>Cero Papel:</strong> Gestión documental y firma digital integrada</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span><strong>Cobertura Nacional:</strong> Atención y despliegue 100% digital</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-700/60 flex items-center justify-between">
                <span className="text-[11px] text-[#D4AF37] font-semibold">SOFTWARE EMPRESARIAL PROPIETARIO</span>
                <Link
                  href="/servicios"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-white hover:text-[#D4AF37] transition-colors"
                >
                  <span>Explorar Capacidades</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

          </div>
        </div>

      </div>
    </section>
  );
}
