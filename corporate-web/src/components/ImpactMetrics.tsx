import { 
  Building2, 
  Users, 
  FileCheck2, 
  ShieldCheck, 
  TrendingDown, 
  Sparkles 
} from "lucide-react";

export interface MetricItem {
  value: string;
  label: string;
  detail: string;
  icon: React.ComponentType<{ className?: string }>;
  highlight?: boolean;
}

const metrics: MetricItem[] = [
  {
    value: "+15",
    label: "Años de Trayectoria",
    detail: "Liderando consultoría directiva",
    icon: Building2,
  },
  {
    value: "+480",
    label: "Organizaciones",
    detail: "Ecosistemas optimizados con éxito",
    icon: ShieldCheck,
  },
  {
    value: "$0",
    label: "Costo de Licencia",
    detail: "Usuarios ilimitados incluidos",
    icon: Users,
    highlight: true,
  },
  {
    value: "-80%",
    label: "Gasto en Papel",
    detail: "Virtualización Cero Papel",
    icon: TrendingDown,
  },
  {
    value: "99.4%",
    label: "Aprobación Auditorías",
    detail: "Certificaciones ISO & HSEQ",
    icon: FileCheck2,
    highlight: true,
  },
];

export default function ImpactMetrics() {
  return (
    <section className="relative z-20 -mt-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="enterprise-card rounded-3xl p-6 sm:p-8 lg:p-10 shadow-2xl bg-gradient-to-b from-[#01426F]/95 to-[#060D17]/95 border border-[#B08A1A]/30">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800/80 mb-8">
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-[#D4AF37] animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#D4AF37]">
              Indicadores de Alto Desempeño
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400">
            Cifras auditadas y comprobadas en empresas del sector real, financiero e institucional.
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-5 gap-6 sm:gap-8">
          {metrics.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div 
                key={idx} 
                className="flex flex-col justify-between p-4 rounded-2xl bg-slate-900/40 border border-slate-800/60 hover:border-[#B08A1A]/40 transition-colors group"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-[#D4AF37] flex items-center justify-center group-hover:bg-[#B08A1A] group-hover:text-slate-950 transition-colors">
                    <Icon className="w-5 h-5" />
                  </div>
                  {item.highlight && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-[#D4AF37] bg-amber-500/10 px-2 py-0.5 rounded-full border border-[#B08A1A]/30">
                      <Sparkles className="w-2.5 h-2.5 text-[#D4AF37]" />
                      Clave
                    </span>
                  )}
                </div>
                <div>
                  <div className="text-3xl sm:text-4xl font-black text-white tracking-tight group-hover:text-[#D4AF37] transition-colors">
                    {item.value}
                  </div>
                  <div className="text-xs sm:text-sm font-bold text-slate-200 mt-1">
                    {item.label}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                    {item.detail}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
