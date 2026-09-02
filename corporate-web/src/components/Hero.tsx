import { ArrowRight, ShieldCheck, Award, CheckCircle2 } from "lucide-react";

export default function Hero() {
  return (
    <section id="hero" className="relative overflow-hidden bg-slate-950 text-white py-24 sm:py-32">
      {/* Background gradient effects */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(59,130,246,0.25),rgba(255,255,255,0))] pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-30 pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold uppercase tracking-wider mb-6">
            <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
            Liderazgo &amp; Transformación Empresarial
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight">
            Impulsamos la excelencia y el crecimiento de su <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">organización</span>.
          </h1>

          {/* Subtitle */}
          <p className="mt-6 text-lg sm:text-xl text-slate-300 leading-relaxed max-w-2xl">
            Soluciones corporativas de alto nivel en consultoría estratégica, innovación tecnológica y optimización de operaciones para empresas líderes en el mercado global.
          </p>

          {/* CTAs */}
          <div className="mt-10 flex flex-col sm:flex-row gap-4 sm:items-center">
            <a
              href="#contacto"
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-base transition-all shadow-lg shadow-blue-600/25"
            >
              <span>Agendar una Sesión Estratégica</span>
              <ArrowRight className="w-5 h-5" />
            </a>
            <a
              href="#servicios"
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-lg bg-slate-900 border border-slate-700 hover:bg-slate-800 text-slate-200 font-semibold text-base transition-all"
            >
              <span>Explorar Servicios</span>
            </a>
          </div>

          {/* Key trust bullets */}
          <div className="mt-12 pt-8 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-blue-400 shrink-0" />
              <span className="text-sm font-medium text-slate-300">Resultados cuantificables</span>
            </div>
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-5 h-5 text-blue-400 shrink-0" />
              <span className="text-sm font-medium text-slate-300">Máxima seguridad y compliance</span>
            </div>
            <div className="flex items-center gap-3">
              <Award className="w-5 h-5 text-blue-400 shrink-0" />
              <span className="text-sm font-medium text-slate-300">Equipo certificado global</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
