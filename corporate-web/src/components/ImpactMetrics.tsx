"use client";

import { useEffect, useRef, useState } from "react";
import { 
  Building2, 
  Users, 
  FileCheck2, 
  ShieldCheck, 
  TrendingDown, 
  Sparkles 
} from "lucide-react";

export interface MetricItem {
  numericValue: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  isSpecialZero?: boolean;
  label: string;
  detail: string;
  icon: React.ComponentType<{ className?: string }>;
  highlight?: boolean;
}

const metrics: MetricItem[] = [
  {
    numericValue: 15,
    prefix: "+",
    label: "Años de Trayectoria",
    detail: "Liderando consultoría directiva",
    icon: Building2,
  },
  {
    numericValue: 480,
    prefix: "+",
    label: "Organizaciones",
    detail: "Ecosistemas optimizados con éxito",
    icon: ShieldCheck,
  },
  {
    numericValue: 0,
    isSpecialZero: true,
    label: "Costo de Licencia",
    detail: "Usuarios ilimitados incluidos",
    icon: Users,
    highlight: true,
  },
  {
    numericValue: 80,
    prefix: "-",
    suffix: "%",
    label: "Gasto en Papel",
    detail: "Virtualización Cero Papel",
    icon: TrendingDown,
  },
  {
    numericValue: 99.4,
    suffix: "%",
    decimals: 1,
    label: "Aprobación Auditorías",
    detail: "Certificaciones ISO & HSEQ",
    icon: FileCheck2,
    highlight: true,
  },
];

function AnimatedCounter({ 
  target, 
  prefix = "", 
  suffix = "", 
  decimals = 0, 
  isSpecialZero = false,
  isVisible 
}: { 
  target: number; 
  prefix?: string; 
  suffix?: string; 
  decimals?: number; 
  isSpecialZero?: boolean;
  isVisible: boolean; 
}) {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (!isVisible) return;
    if (isSpecialZero) {
      setCurrent(0);
      return;
    }

    let startTime: number | null = null;
    const duration = 1800; // ms

    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      // Ease out expo
      const easeOut = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      const val = easeOut * target;
      setCurrent(val);

      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        setCurrent(target);
      }
    };

    const anim = requestAnimationFrame(step);
    return () => cancelAnimationFrame(anim);
  }, [isVisible, target, isSpecialZero]);

  if (isSpecialZero) {
    return <span>$0</span>;
  }

  const formatted = decimals > 0 
    ? current.toFixed(decimals) 
    : Math.round(current).toString();

  return (
    <span>
      {prefix}{formatted}{suffix}
    </span>
  );
}

export default function ImpactMetrics() {
  const sectionRef = useRef<HTMLElement>(null);
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          setHasAnimated(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section 
      ref={sectionRef} 
      className="relative z-20 -mt-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
    >
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
                className="flex flex-col justify-between p-4 rounded-2xl bg-slate-900/40 border border-slate-800/60 hover:border-[#B08A1A]/40 transition-all duration-300 group hover:-translate-y-1 hover:shadow-lg"
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
                  <div className="text-3xl sm:text-4xl font-black text-white tracking-tight group-hover:text-[#D4AF37] transition-colors tabular-nums">
                    <AnimatedCounter
                      target={item.numericValue}
                      prefix={item.prefix}
                      suffix={item.suffix}
                      decimals={item.decimals}
                      isSpecialZero={item.isSpecialZero}
                      isVisible={hasAnimated}
                    />
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
