import Link from "next/link";
import { 
  ArrowRight, 
  BarChart3, 
  Cpu, 
  Network, 
  ArrowUpRight
} from "lucide-react";
import HeroInteractive from "@/components/HeroInteractive";
import ImpactMetrics from "@/components/ImpactMetrics";
import ModuleExplorer from "@/components/ModuleExplorer";
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

      {/* 3. EXPLORADOR INTERACTIVO DE MÓDULOS & NORMAS */}
      <ModuleExplorer />

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
