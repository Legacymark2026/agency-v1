import Link from "next/link";
import { 
  ArrowRight, 
  CheckCircle2, 
  ShieldCheck, 
  Award, 
  BarChart3, 
  Cpu, 
  Network, 
  ChevronDown,
  Sparkles,
  ArrowUpRight
} from "lucide-react";
import TestimonialCarousel from "@/components/TestimonialCarousel";
import { servicesData } from "@/data/servicesData";

export default function Home() {
  const mainService = servicesData[0]; // Sistemas Integrados de Gestión (ISO, SG-SST, HSEQ)
  const secondaryService1 = servicesData[2]; // Gestión Documental & Cero Papel
  const secondaryService2 = servicesData[3]; // Software Sin Costo de Licencia • Usuarios Ilimitados

  return (
    <div className="flex flex-col">
      {/* 1. HERO PANTALLA COMPLETA: El Impacto en 5 Segundos */}
      <section className="relative min-h-[92vh] flex items-center justify-center overflow-hidden bg-[#0B192C] text-white py-20">
        {/* Fondo dinámico: Conexiones de red y retícula geométrica con degradados Azul Profundo y Dorado */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-15%,rgba(176,138,26,0.22),transparent_70%)] pointer-events-none" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(176,138,26,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(176,138,26,0.06)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_70%_60%_at_50%_40%,#000_70%,transparent_100%)] pointer-events-none" />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center z-10">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-[#B08A1A]/40 text-[#D4AF37] text-xs font-bold uppercase tracking-[0.2em] mb-8">
            <Sparkles className="w-3.5 h-3.5 text-[#B08A1A]" />
            <span>NEOGESTIÓN • Software de Gestión • Usuarios Ilimitados</span>
          </div>

          {/* Titular con Reveal Animado */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-white leading-[1.1] max-w-5xl mx-auto font-sans">
            Transformamos la complejidad en{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#B08A1A] via-[#D4AF37] to-[#F3E5AB]">
              eficiencia
            </span>.
          </h1>

          {/* Subtítulo de alto valor */}
          <p className="mt-8 text-lg sm:text-xl text-slate-300 leading-relaxed max-w-3xl mx-auto font-normal">
            Planee, gestione, controle y evalúe procesos, operaciones y personas. Implemente Sistemas Integrados de Gestión (<strong className="text-white">ISO, SG-SST, HSEQ, SARLAFT, BASC, RUC, CRM, SCM</strong>) con filosofía <strong className="text-[#D4AF37]">Cero Papel</strong> y sin costo de licenciamiento.
          </p>

          {/* CTAs con Glassmorphism y Glow Dorado */}
          <div className="mt-12 flex flex-col sm:flex-row gap-5 justify-center items-center">
            <Link
              href="/contacto"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-gradient-to-r from-[#B08A1A] to-[#D4AF37] text-slate-950 font-black text-base hover:brightness-110 transition-all shadow-xl gold-glow hover:scale-[1.02]"
            >
              <span>Solicitar Demostración</span>
              <ArrowRight className="w-5 h-5" />
            </Link>

            <Link
              href="/servicios"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl glassmorphism text-slate-200 hover:text-white hover:border-[#B08A1A] text-base font-semibold transition-all hover:bg-slate-900/80"
            >
              <span>Explorar Módulos &amp; Normas</span>
            </Link>
          </div>

          {/* Sellos de Confianza y Rigor */}
          <div className="mt-16 pt-10 border-t border-slate-800/80 max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-6 text-left">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-[#D4AF37] shrink-0" />
              <span className="text-xs sm:text-sm font-medium text-slate-300">
                Usuarios ilimitados sin costo de licencia
              </span>
            </div>
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-5 h-5 text-[#D4AF37] shrink-0" />
              <span className="text-xs sm:text-sm font-medium text-slate-300">
                Hosting seguro + Servidor de backup
              </span>
            </div>
            <div className="flex items-center gap-3">
              <Award className="w-5 h-5 text-[#D4AF37] shrink-0" />
              <span className="text-xs sm:text-sm font-medium text-slate-300">
                ISO, SG-SST, HSEQ, SARLAFT, BASC
              </span>
            </div>
          </div>

          {/* Microinteracción: Scroll Indicator con Pulso Suave */}
          <div className="mt-14 flex flex-col items-center">
            <a
              href="#servicios-destacados"
              aria-label="Desplazarse hacia abajo"
              className="scroll-indicator-pulse inline-flex flex-col items-center text-slate-400 hover:text-[#D4AF37] transition-colors"
            >
              <span className="text-[10px] uppercase font-bold tracking-widest mb-1">Descubrir</span>
              <ChevronDown className="w-5 h-5" />
            </a>
          </div>
        </div>
      </section>

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
            <div className="lg:col-span-7 bg-[#0B192C] text-white p-8 sm:p-12 rounded-3xl border border-amber-900/40 shadow-xl gold-border-slide flex flex-col justify-between group">
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
                  <div className="w-12 h-12 rounded-xl bg-slate-100 text-[#0B192C] flex items-center justify-center mb-5 group-hover:bg-[#0B192C] group-hover:text-[#D4AF37] transition-colors">
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
                  <div className="w-12 h-12 rounded-xl bg-slate-100 text-[#0B192C] flex items-center justify-center mb-5 group-hover:bg-[#0B192C] group-hover:text-[#D4AF37] transition-colors">
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

      {/* 4. BANNER CINÉTICO FINAL: Llamado a la Acción con Subrayado Animado */}
      <section className="py-24 bg-[#0B192C] text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_50%,rgba(176,138,26,0.2),transparent)] pointer-events-none" />

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="inline-block px-4 py-1.5 rounded-full bg-amber-500/15 border border-[#B08A1A]/40 text-[#D4AF37] text-xs font-bold uppercase tracking-[0.2em] mb-6">
            Paso Siguiente
          </span>

          <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight relative inline-block">
            <span>¿Listo para transformar tu gestión?</span>
            <span className="block h-1.5 w-full bg-gradient-to-r from-transparent via-[#B08A1A] to-transparent mt-3 rounded-full" />
          </h2>

          <p className="mt-8 text-base sm:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Coordinemos una sesión de trabajo directivo confidencial y evaluemos el potencial de rentabilidad de su modelo operativo.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row gap-5 justify-center items-center">
            <Link
              href="/contacto"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-9 py-4 rounded-2xl bg-gradient-to-r from-[#B08A1A] to-[#D4AF37] text-slate-950 font-black text-base hover:brightness-110 transition-all shadow-xl gold-glow"
            >
              <span>Solicitar Diagnóstico Sin Costo</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/quienes-somos"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl glassmorphism text-slate-200 hover:text-white text-base font-semibold transition-all hover:border-[#B08A1A]"
            >
              <span>Conoce a Nuestro Equipo</span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
