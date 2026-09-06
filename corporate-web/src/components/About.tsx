import { CheckCircle, Trophy } from "lucide-react";

export default function About() {
  const metrics = [
    { label: "Años de Trayectoria", value: "+18", detail: "Liderando proyectos de alta complejidad" },
    { label: "Proyectos Corporativos", value: "+450", detail: "Entregados con éxito y puntualidad" },
    { label: "Tasa de Retención", value: "98.4%", detail: "Relaciones a largo plazo con clientes" },
    { label: "Mercados & Países", value: "14", detail: "Presencia activa a nivel internacional" },
  ];

  const pillars = [
    "Compromiso con el valor estratégico tangible",
    "Gobernanza corporativa transparente e íntegra",
    "Equipos multidisciplinarios con certificaciones globales",
    "Innovación orientada a la sostenibilidad operativa",
  ];

  return (
    <section id="nosotros" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-[#B08A1A] block mb-3">
              Sobre NEOGESTIÓN
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
              Construimos alianzas sólidas para liderar los desafíos del futuro empresarial
            </h2>
            <p className="mt-6 text-slate-600 text-base sm:text-lg leading-relaxed">
              <strong>NeoGestión</strong> es el ecosistema y software de gestión integral desarrollado por <strong>Consultoría de Colombia S.A.S.</strong>, consolidado como el aliado estratégico para empresas que buscan una transformación profunda, eficiente y medible en sus operaciones.
            </p>
            <p className="mt-4 text-slate-600 text-base leading-relaxed">
              Combinamos rigor metodológico con agilidad tecnológica para traducir visiones ambiciosas en resultados operativos de alto impacto, con atención 100% digital a nivel nacional.
            </p>

            <div className="mt-8 space-y-3">
              {pillars.map((pillar, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-[#B08A1A] shrink-0 mt-0.5" />
                  <span className="text-sm sm:text-base font-medium text-slate-700">{pillar}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="p-8 sm:p-10 rounded-3xl bg-[#0B192C] text-white shadow-2xl relative overflow-hidden border border-amber-900/30">
              <div className="absolute top-0 right-0 -mr-12 -mt-12 w-48 h-48 rounded-full bg-amber-500/10 blur-2xl" />
              <h3 className="text-xl font-bold mb-6 text-white flex items-center gap-2">
                <Trophy className="w-5 h-5 text-[#D4AF37]" />
                <span>Nuestra Promesa de Valor</span>
              </h3>
              <p className="text-slate-300 text-sm sm:text-base leading-relaxed mb-8">
                “No nos limitamos a asesorar; nos integramos activamente con los equipos directivos para asegurar que cada recomendación se convierta en una ventaja competitiva duradera.”
              </p>
              <div className="pt-6 border-t border-slate-800 flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-[#1E3E62] border border-[#B08A1A] flex items-center justify-center font-bold text-[#D4AF37]">
                  NG
                </div>
                <div>
                  <h4 className="font-semibold text-white text-sm">Consejo Directivo</h4>
                  <p className="text-xs text-[#D4AF37]">Consultoría de Colombia S.A.S.</p>
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* Metrics Grid */}
        <div id="metricas" className="mt-20 pt-16 border-t border-slate-100">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {metrics.map((metric, i) => (
              <div key={i} className="p-6 rounded-2xl bg-slate-50 border border-slate-200/60">
                <span className="text-3xl sm:text-4xl font-extrabold text-blue-900 block mb-1">
                  {metric.value}
                </span>
                <span className="text-base font-bold text-slate-900 block mb-1">
                  {metric.label}
                </span>
                <p className="text-xs text-slate-500">
                  {metric.detail}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
