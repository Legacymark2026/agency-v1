import Link from "next/link";
import Image from "next/image";
import { 
  ArrowRight, 
  BarChart3, 
  Cpu, 
  Network, 
  ArrowUpRight,
  CheckCircle2,
  Sparkles,
  ShieldCheck
} from "lucide-react";
import HeroInteractive from "@/components/HeroInteractive";
import ImpactMetrics from "@/components/ImpactMetrics";
import ProductEndorsementSection from "@/components/ProductEndorsementSection";
import ModuleExplorer from "@/components/ModuleExplorer";
import RoiCalculator from "@/components/RoiCalculator";
import TestimonialCarousel from "@/components/TestimonialCarousel";
import ClientsSection from "@/components/ClientsSection";
import { servicesData } from "@/data/servicesData";

export default function Home() {
  const mainService = servicesData[0]; // Sistemas Integrados de Gestión (ISO, SG-SST, HSEQ)
  const secondaryService1 = servicesData[2]; // Gestión Documental & Cero Papel
  const secondaryService2 = servicesData[3]; // Software Sin Costo de Licencia • Usuarios Ilimitados

  return (
    <div className="flex flex-col">
      {/* 1. HERO DE ÉLITE CON MAQUETA INTERACTIVA DE SOFTWARE */}
      <HeroInteractive />

      {/* 2. BARRA FLOTANTE DE MÉTRICAS DE IMPACTO DIRECTIVO */}
      <div id="metricas-impacto">
        <ImpactMetrics />
      </div>

      {/* 3. SECCIÓN ESTRATÉGICA: SINERGIA CONSULTORÍA DE COLOMBIA & PRODUCTO NEOGESTIÓN */}
      <ProductEndorsementSection />

      {/* 4. EXPLORADOR INTERACTIVO DE MÓDULOS & NORMAS */}
      <ModuleExplorer />

      {/* 5. CALCULADORA INTERACTIVA DE RETORNO DE INVERSIÓN (ROI) & CERO PAPEL */}
      <RoiCalculator />

      {/* 2. RESUMEN DE SERVICIOS: Grid Asimétrico / Mosaico */}
      <section id="servicios-destacados" className="py-24 bg-slate-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
            <div className="max-w-2xl">
              <span className="text-xs font-bold uppercase tracking-widest text-[#B08A1A] block mb-2">
                Arquitectura de Soluciones
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                Capacidades Diseñadas para Romper la Complejidad
              </h2>
              <p className="mt-3 text-base text-slate-600 leading-relaxed">
                Reconfiguramos la dinámica de su organización con herramientas directivas y metodologías de alta precisión.
              </p>
            </div>
            <Link
              href="/servicios"
              className="inline-flex items-center gap-2 text-sm font-bold text-[#B08A1A] hover:text-[#8C6B12] group"
            >
              <span>Ver catálogo completo</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>

          {/* Grid Asimétrico: Tarjeta grande destacada + 2 secundarias */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
            {/* Tarjeta Principal Destacada (Col 7) */}
            <div className="lg:col-span-7 bg-[#01426F] text-white p-8 sm:p-12 rounded-3xl border border-amber-900/40 shadow-xl gold-border-slide flex flex-col justify-between group">
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div className="w-14 h-14 rounded-2xl bg-amber-500/15 border border-[#B08A1A]/40 text-[#D4AF37] flex items-center justify-center group-hover:bg-[#B08A1A] group-hover:text-slate-950 transition-colors duration-300">
                    <BarChart3 className="w-7 h-7" />
                  </div>
                  <span className="px-3 py-1 rounded-full bg-[#B08A1A]/20 border border-[#B08A1A]/40 text-[#D4AF37] text-xs font-bold uppercase tracking-wider">
                    Servicio Principal
                  </span>
                </div>

                <h3 className="text-2xl sm:text-3xl font-black text-white mb-4 group-hover:text-[#D4AF37] transition-colors">
                  {mainService.title}
                </h3>

                <p className="text-slate-300 text-base leading-relaxed mb-8">
                  {mainService.fullDescription}
                </p>

                <div className="space-y-3 mb-8">
                  {mainService.benefits.slice(0, 3).map((b, i) => (
                    <div key={i} className="flex items-center gap-3 text-sm text-slate-200">
                      <div className="w-2 h-2 rounded-full bg-[#B08A1A]" />
                      <span>{b}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-6 border-t border-slate-800 flex items-center justify-between">
                <span className="text-xs text-slate-400 font-medium">
                  Enfoque para Comités y Alta Dirección
                </span>
                <Link
                  href={`/servicios#${mainService.slug}`}
                  className="inline-flex items-center gap-2 text-sm font-bold text-[#D4AF37] hover:text-white transition-colors"
                >
                  <span>Explorar Metodología</span>
                  <ArrowUpRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            {/* Dos Tarjetas Secundarias (Col 5) */}
            <div className="lg:col-span-5 flex flex-col gap-8 justify-between">
              {/* Tarjeta Secundaria 1 */}
              <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl gold-border-slide flex flex-col justify-between group flex-1">
                <div>
                  <div className="w-12 h-12 rounded-xl bg-slate-100 text-[#01426F] flex items-center justify-center mb-5 group-hover:bg-[#01426F] group-hover:text-[#D4AF37] transition-colors">
                    <Cpu className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-[#B08A1A] transition-colors">
                    {secondaryService1.title}
                  </h3>
                  <p className="text-slate-600 text-xs sm:text-sm leading-relaxed mb-4">
                    {secondaryService1.shortDescription}
                  </p>
                </div>
                <Link
                  href={`/servicios#${secondaryService1.slug}`}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[#B08A1A] group-hover:text-slate-900 transition-colors pt-3 border-t border-slate-100"
                >
                  <span>Ver entregables y beneficios</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {/* Tarjeta Secundaria 2 */}
              <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl gold-border-slide flex flex-col justify-between group flex-1">
                <div>
                  <div className="w-12 h-12 rounded-xl bg-slate-100 text-[#01426F] flex items-center justify-center mb-5 group-hover:bg-[#01426F] group-hover:text-[#D4AF37] transition-colors">
                    <Network className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-[#B08A1A] transition-colors">
                    {secondaryService2.title}
                  </h3>
                  <p className="text-slate-600 text-xs sm:text-sm leading-relaxed mb-4">
                    {secondaryService2.shortDescription}
                  </p>
                </div>
                <Link
                  href={`/servicios#${secondaryService2.slug}`}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[#B08A1A] group-hover:text-slate-900 transition-colors pt-3 border-t border-slate-100"
                >
                  <span>Ver entregables y beneficios</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CLIENTES CORPORATIVOS & INSTITUCIONALES */}
      <ClientsSection />

      {/* 3. TESTIMONIOS: Carrusel 3D / Coverflow */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-widest text-[#B08A1A] block mb-2">
              Validación Directiva
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              Testimonios de Quienes Han Transformado su Gestión
            </h2>
            <p className="mt-3 text-base sm:text-lg text-slate-600">
              Resultados respaldados por comités de administración y líderes de corporaciones multinacionales.
            </p>
          </div>

          <TestimonialCarousel />
        </div>
      </section>

      {/* 4. BANNER DIRECTIVO FINAL: Llamado a la Acción con Asesora Corporativa */}
      <section className="py-20 lg:py-24 bg-[#01426F] text-white relative overflow-hidden border-t border-amber-900/40">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_75%_50%,rgba(176,138,26,0.18),transparent)] pointer-events-none" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:3rem_3rem] pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            
            {/* Left Column: Value Proposition & CTAs */}
            <div className="lg:col-span-7 text-left">
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/15 border border-[#B08A1A]/40 text-[#D4AF37] text-xs font-bold uppercase tracking-[0.2em] mb-6">
                <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
                <span>Asesoría Directiva &amp; Transformación Digital</span>
              </span>

              <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.15]">
                <span>¿Listo para transformar la gestión de su organización?</span>
                <span className="block h-1.5 w-48 bg-gradient-to-r from-[#B08A1A] to-transparent mt-4 rounded-full" />
              </h2>

              <p className="mt-6 text-base sm:text-lg text-slate-300 leading-relaxed max-w-2xl">
                Coordinemos una sesión de trabajo directivo confidencial y evaluemos el potencial de rentabilidad, digitalización Cero Papel y cumplimiento normativo de su empresa.
              </p>

              {/* Trust Checkmarks */}
              <div className="mt-8 space-y-3 max-w-xl">
                <div className="flex items-center gap-3 text-sm text-slate-200">
                  <CheckCircle2 className="w-5 h-5 text-[#D4AF37] shrink-0" />
                  <span>Diagnóstico inicial de madurez en normas ISO, SG-SST y HSEQ <strong>sin costo</strong>.</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-slate-200">
                  <CheckCircle2 className="w-5 h-5 text-[#D4AF37] shrink-0" />
                  <span>Ecosistema en la nube con <strong>usuarios ilimitados</strong> y sin cobro por colaborador.</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-slate-200">
                  <CheckCircle2 className="w-5 h-5 text-[#D4AF37] shrink-0" />
                  <span>Respaldo y metodología de <strong>Consultoría de Colombia S.A.S.</strong> (+15 años de trayectoria).</span>
                </div>
              </div>

              {/* CTA Buttons */}
              <div className="mt-10 flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
                <Link
                  href="/contacto"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-gradient-to-r from-[#B08A1A] to-[#D4AF37] text-slate-950 font-black text-base hover:brightness-110 transition-all shadow-xl gold-glow hover:scale-[1.02]"
                >
                  <span>Solicitar Diagnóstico Sin Costo</span>
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <Link
                  href="/quienes-somos"
                  className="inline-flex items-center justify-center gap-2 px-7 py-4 rounded-2xl glassmorphism text-slate-200 hover:text-white text-base font-semibold transition-all hover:border-[#B08A1A]"
                >
                  <span>Conoce a Nuestro Equipo</span>
                </Link>
              </div>
            </div>

            {/* Right Column: Executive Businesswoman Image */}
            <div className="lg:col-span-5 relative flex justify-center items-end">
              {/* Subtle gold glow halo behind the executive */}
              <div className="absolute bottom-0 w-72 sm:w-96 h-72 sm:h-96 bg-gradient-to-t from-amber-500/25 via-amber-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />
              
              <div className="relative z-10 w-full max-w-[340px] sm:max-w-[420px] lg:max-w-[440px]">
                <Image
                  src="/images/asesora-corporativa.webp"
                  alt="Asesora de Consultoría y Gestión Directiva NeoGestión"
                  width={768}
                  height={1458}
                  priority
                  className="w-full h-auto object-contain drop-shadow-[0_20px_35px_rgba(0,0,0,0.6)] select-none pointer-events-none"
                />

                {/* Floating Executive Trust Badge */}
                <div className="absolute -bottom-2 -left-2 sm:bottom-6 sm:-left-6 bg-slate-900/90 backdrop-blur-xl border border-[#B08A1A]/50 rounded-2xl p-3.5 sm:p-4 shadow-2xl flex items-center gap-3 text-left animate-fadeIn">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-[#D4AF37] flex items-center justify-center shrink-0 border border-[#B08A1A]/40">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs sm:text-sm font-bold text-white">
                      99.4% Aprobación
                    </div>
                    <div className="text-[10px] sm:text-xs text-slate-300 font-medium">
                      Auditorías de Certificación ISO &amp; HSEQ
                    </div>
                  </div>
                </div>

                {/* Second Floating Pill */}
                <div className="absolute top-12 -right-2 sm:top-16 sm:-right-4 bg-[#01426F]/90 backdrop-blur-xl border border-amber-500/30 rounded-2xl px-3.5 py-2 shadow-xl flex items-center gap-2 text-left hidden sm:flex">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-xs font-bold text-slate-100">
                    Consultoría Senior
                  </span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>
    </div>
  );
}
