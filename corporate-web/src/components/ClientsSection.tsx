"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Image from "next/image";
import { 
  Building2, 
  ShieldCheck, 
  CheckCircle2, 
  Award, 
  Sparkles, 
  ArrowRight,
  Filter,
  ChevronLeft,
  ChevronRight,
  Play,
  Pause
} from "lucide-react";
import Link from "next/link";

export interface ClientItem {
  id: string;
  name: string;
  sectorKey: "seguros" | "publico" | "manufactura" | "servicios";
  sectorLabel: string;
  scope: string;
  highlights: string[];
  logoSrc: string;
  badge: string;
  accentColor: string;
}

const clients: ClientItem[] = [
  {
    id: "sura-arl",
    name: "SURA ARL",
    sectorKey: "seguros",
    sectorLabel: "Seguros & Riesgos Laborales",
    scope: "Gestión, evaluación y mitigación de riesgos laborales con trazabilidad legal bajo normativas del Ministerio del Trabajo.",
    highlights: ["Control de SG-SST", "Matriz de Peligros", "Trazabilidad de Afiliados"],
    logoSrc: "/images/clients/sura-arl.png",
    badge: "Líder Asegurador",
    accentColor: "#0033A0",
  },
  {
    id: "axa-colpatria",
    name: "AXA Colpatria",
    sectorKey: "seguros",
    sectorLabel: "Servicios Financieros & Seguros",
    scope: "Ecosistema operativo para control de procesos, gobierno corporativo y auditorías de cumplimiento normativo.",
    highlights: ["Procesos Críticos", "Cumplimiento Directivo", "Usuarios Ilimitados"],
    logoSrc: "/images/clients/axa-colpatria.png",
    badge: "Multinacional Financiera",
    accentColor: "#00008F",
  },
  {
    id: "contraloria-santander",
    name: "Contraloría General de Santander",
    sectorKey: "publico",
    sectorLabel: "Sector Público & Control Fiscal",
    scope: "Gestión Documental Cero Papel, radicación digital segura y custodia inmutable de expedientes para control fiscal.",
    highlights: ["Virtualización Cero Papel", "Radicación Electrónica", "Custodia Legal"],
    logoSrc: "/images/clients/contraloria-santander.png",
    badge: "Sector Público",
    accentColor: "#006837",
  },
  {
    id: "precocidos",
    name: "Precocidos del Oriente",
    sectorKey: "manufactura",
    sectorLabel: "Agroalimentario & Manufactura",
    scope: "Estructuración de Sistemas Integrados de Gestión, inocuidad alimentaria y preparación de estándares HACCP.",
    highlights: ["Inocuidad HACCP", "Control de Calidad", "Auditorías de Planta"],
    logoSrc: "/images/clients/precocidos.png",
    badge: "Industria & Alimentos",
    accentColor: "#D97706",
  },
  {
    id: "ayuda-profesional",
    name: "Ayuda Profesional Ltda.",
    sectorKey: "servicios",
    sectorLabel: "Consultoría & Servicios Empresariales",
    scope: "Planificación operativa, asignación de metas por colaborador y medición de productividad del talento humano.",
    highlights: ["Evaluación de Desempeño", "Optimización de Tareas", "Flujos Ágiles"],
    logoSrc: "/images/clients/ayuda-profesional.png",
    badge: "Servicios B2B",
    accentColor: "#0284C7",
  },
  {
    id: "comfenalco",
    name: "Colegio Cooperativo Comfenalco",
    sectorKey: "servicios",
    sectorLabel: "Sector Educativo & Cooperativo",
    scope: "Implementación integral de SG-SST institucional, comités paritarios y modernización de procesos académicos.",
    highlights: ["SG-SST Institucional", "Comités COPASST", "Protocolos de Emergencia"],
    logoSrc: "/images/clients/comfenalco.png",
    badge: "Educación & Cooperativo",
    accentColor: "#1B365D",
  },
];

const sectors = [
  { key: "all", label: "Todos los Sectores", count: 6 },
  { key: "seguros", label: "Seguros & Finanzas", count: 2 },
  { key: "publico", label: "Sector Público", count: 1 },
  { key: "manufactura", label: "Manufactura & Agro", count: 1 },
  { key: "servicios", label: "Servicios & Educación", count: 2 },
];

export default function ClientsSection() {
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [isAutoplay, setIsAutoplay] = useState<boolean>(true);
  const [canScrollLeft, setCanScrollLeft] = useState<boolean>(false);
  const [canScrollRight, setCanScrollRight] = useState<boolean>(true);
  const [currentIndex, setCurrentIndex] = useState<number>(0);

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const filteredClients = activeFilter === "all" 
    ? clients 
    : clients.filter((c) => c.sectorKey === activeFilter);

  const checkScrollState = useCallback(() => {
    if (!scrollContainerRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
    setCanScrollLeft(scrollLeft > 15);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 15);

    const cardWidth = 390;
    const idx = Math.round(scrollLeft / cardWidth);
    setCurrentIndex(Math.min(Math.max(idx, 0), filteredClients.length - 1));
  }, [filteredClients.length]);

  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    el.addEventListener("scroll", checkScrollState, { passive: true });
    checkScrollState();
    return () => el.removeEventListener("scroll", checkScrollState);
  }, [checkScrollState]);

  // Autoplay continuo con pausa en hover
  useEffect(() => {
    if (!isAutoplay || filteredClients.length <= 1) return;

    const interval = setInterval(() => {
      if (scrollContainerRef.current) {
        const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
        if (scrollLeft + clientWidth >= scrollWidth - 25) {
          scrollContainerRef.current.scrollTo({ left: 0, behavior: "smooth" });
        } else {
          scrollContainerRef.current.scrollBy({ left: 390, behavior: "smooth" });
        }
      }
    }, 5500);

    return () => clearInterval(interval);
  }, [isAutoplay, filteredClients.length]);

  const handleScroll = (direction: "left" | "right") => {
    if (scrollContainerRef.current) {
      const scrollAmount = direction === "left" ? -390 : 390;
      scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };

  const handleScrollToIndex = (index: number) => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ left: index * 390, behavior: "smooth" });
      setCurrentIndex(index);
    }
  };

  const handleFilterChange = (key: string) => {
    setActiveFilter(key);
    setCurrentIndex(0);
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ left: 0, behavior: "smooth" });
    }
  };

  return (
    <section id="nuestros-clientes" className="py-24 relative overflow-hidden text-white border-y border-amber-900/40">
      {/* 1. Fondo de Infraestructura & Respaldo Institucional en Alta Definición */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/images/clients-bg.webp"
          alt="Respaldo e Infraestructura NeoGestión"
          fill
          className="object-cover object-center"
          sizes="100vw"
          quality={90}
        />
        {/* Capas de Contraste Cinematográfico & Atmósfera Directiva */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#00172e]/92 via-[#012b4d]/88 to-[#001426]/95 backdrop-blur-[1px]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_20%,rgba(176,138,26,0.18),transparent)]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:4rem_4rem]" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Header Corporativo de Prestigio */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/15 border border-[#B08A1A]/40 text-[#D4AF37] text-xs font-bold uppercase tracking-[0.2em] mb-4">
              <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>Validación &amp; Respaldo Institucional</span>
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight">
              Organizaciones que Confían en <span className="text-gold-gradient">NeoGestión</span>
            </h2>
            
            <p className="mt-4 text-base sm:text-lg text-slate-300 leading-relaxed">
              Empresas del sector asegurador, gubernamental, agroalimentario y educativo que optimizan sus auditorías, sistemas de gestión y procesos diarios con nuestra plataforma.
            </p>
          </div>

          {/* Controles de Navegación del Carrusel en el Header */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => setIsAutoplay((prev) => !prev)}
              className={`p-3 rounded-2xl border transition-all ${
                isAutoplay 
                  ? "bg-slate-900/80 border-amber-500/30 text-[#D4AF37] hover:bg-slate-800" 
                  : "bg-slate-900/40 border-slate-700 text-slate-400 hover:text-white"
              }`}
              title={isAutoplay ? "Pausar avance automático" : "Reanudar avance automático"}
              aria-label="Toggle autoplay"
            >
              {isAutoplay ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleScroll("left")}
                disabled={!canScrollLeft}
                className={`p-3.5 rounded-2xl border transition-all duration-200 flex items-center justify-center ${
                  canScrollLeft
                    ? "bg-[#01426F] text-[#D4AF37] border-[#B08A1A]/60 shadow-lg hover:bg-[#023152] hover:scale-105 active:scale-95"
                    : "bg-slate-900/40 text-slate-600 border-slate-800 cursor-not-allowed"
                }`}
                aria-label="Desplazar a la izquierda"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={() => handleScroll("right")}
                disabled={!canScrollRight}
                className={`p-3.5 rounded-2xl border transition-all duration-200 flex items-center justify-center ${
                  canScrollRight
                    ? "bg-gradient-to-r from-[#B08A1A] to-[#D4AF37] text-slate-950 border-amber-400/80 shadow-lg hover:brightness-110 hover:scale-105 active:scale-95 font-bold"
                    : "bg-slate-900/40 text-slate-600 border-slate-800 cursor-not-allowed"
                }`}
                aria-label="Desplazar a la derecha"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* 1. Cinta / Ribbon Oficial de Logotipos */}
        <div className="mb-10 bg-white/95 rounded-3xl p-6 sm:p-7 shadow-2xl border border-amber-500/30 backdrop-blur-md">
          <div className="text-center mb-4">
            <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">
              Ecosistemas Empresariales Optimizados
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 items-center">
            {clients.map((client, idx) => (
              <button 
                key={client.id}
                type="button"
                onClick={() => {
                  handleFilterChange("all");
                  handleScrollToIndex(idx);
                }}
                className="h-16 sm:h-20 bg-white rounded-2xl border border-slate-200/90 p-3.5 flex items-center justify-center shadow-sm hover:shadow-md hover:border-[#B08A1A]/80 transition-all duration-300 group cursor-pointer text-left"
                title={`Ver detalles de ${client.name}`}
              >
                <div className="relative w-full h-full flex items-center justify-center">
                  <Image
                    src={client.logoSrc}
                    alt={client.name}
                    fill
                    className="object-contain filter grayscale group-hover:grayscale-0 transition-all duration-300 transform group-hover:scale-105"
                  />
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* 2. Filtro Interactivo por Sector y Contador */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
            <div className="flex items-center gap-1.5 text-xs text-slate-400 mr-2 hidden md:flex">
              <Filter className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>Filtrar:</span>
            </div>

            {sectors.map((sector) => {
              const isSelected = activeFilter === sector.key;
              return (
                <button
                  key={sector.key}
                  onClick={() => handleFilterChange(sector.key)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 flex items-center gap-2 ${
                    isSelected
                      ? "bg-[#B08A1A] text-slate-950 shadow-lg scale-105"
                      : "bg-slate-900/70 text-slate-300 hover:text-white hover:bg-slate-900 border border-slate-800"
                  }`}
                >
                  <span>{sector.label}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    isSelected ? "bg-slate-950/30 text-slate-950" : "bg-slate-800 text-slate-400"
                  }`}>
                    {sector.count}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="text-xs text-slate-400 flex items-center gap-2 font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Mostrando {filteredClients.length} casos verificados</span>
          </div>
        </div>

        {/* 3. CARRUSEL HORIZONTAL ULTRAPROFESIONAL */}
        <div 
          className="relative"
          onMouseEnter={() => setIsAutoplay(false)}
          onMouseLeave={() => setIsAutoplay(true)}
        >
          {/* Sombras de Desvanecimiento Lateral en Desktop */}
          {canScrollLeft && (
            <div className="absolute left-0 top-0 bottom-6 w-16 bg-gradient-to-r from-[#00172e] to-transparent z-20 pointer-events-none hidden md:block" />
          )}
          {canScrollRight && (
            <div className="absolute right-0 top-0 bottom-6 w-16 bg-gradient-to-l from-[#00172e] to-transparent z-20 pointer-events-none hidden md:block" />
          )}

          {/* Riel de Desplazamiento Horizontal */}
          <div
            ref={scrollContainerRef}
            className="flex gap-6 overflow-x-auto pb-8 pt-2 scroll-smooth snap-x snap-mandatory scrollbar-none select-none"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {filteredClients.map((client, idx) => (
              <div
                key={client.id}
                className="w-[320px] sm:w-[380px] md:w-[400px] flex-shrink-0 snap-start flex flex-col rounded-3xl overflow-hidden shadow-2xl transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_24px_50px_rgba(0,0,0,0.65)] border border-slate-700/60 hover:border-[#D4AF37] bg-[#00172c] group"
              >
                {/* Nivel Superior: Escaparate de Marca Blanco Porcelana con Logo Oficial */}
                <div className="relative bg-gradient-to-b from-white via-white to-slate-50 px-6 py-5 flex items-center justify-between border-b border-slate-200/80 min-h-[108px]">
                  {/* Franja superior con el color corporativo del cliente */}
                  <div 
                    className="absolute top-0 left-0 right-0 h-1.5"
                    style={{ backgroundColor: client.accentColor }} 
                  />

                  {/* Logotipo Oficial en Alta Definición */}
                  <div className="relative w-44 sm:w-48 h-12 flex items-center justify-start">
                    <Image
                      src={client.logoSrc}
                      alt={client.name}
                      fill
                      className="object-contain object-left group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>

                  {/* Distintivo de Categoría Ejecutiva */}
                  <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-950 bg-gradient-to-r from-amber-300 to-[#D4AF37] px-3 py-1 rounded-full shadow-sm shrink-0 border border-amber-400/50">
                    {client.badge}
                  </span>
                </div>

                {/* Nivel Inferior: Resumen Ejecutivo & Entregables en Deep Navy */}
                <div className="p-6 sm:p-7 flex-1 flex flex-col justify-between bg-gradient-to-b from-[#001D38] to-[#001222]">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="text-xl sm:text-2xl font-black text-white group-hover:text-[#D4AF37] transition-colors">
                        {client.name}
                      </h3>
                      <span className="text-[10px] font-mono text-slate-500 font-bold">
                        0{idx + 1}
                      </span>
                    </div>
                    
                    <span className="text-xs font-bold text-[#D4AF37] uppercase tracking-wider block mb-3.5">
                      {client.sectorLabel}
                    </span>

                    <p className="text-xs sm:text-[13px] text-slate-300 leading-relaxed mb-6 font-normal min-h-[56px]">
                      {client.scope}
                    </p>

                    {/* Entregables en Pastillas de Cristal */}
                    <div className="space-y-2 mb-6">
                      {client.highlights.map((item, hIdx) => (
                        <div 
                          key={hIdx} 
                          className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08] group-hover:border-amber-400/20 transition-colors"
                        >
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                          <span className="text-xs text-slate-200 font-medium">{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Pie de Tarjeta: Sello de Auditoría Verificada */}
                  <div className="pt-4 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
                    <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
                      <ShieldCheck className="w-4 h-4" />
                      <span>Auditoría Exitosa</span>
                    </span>
                    <span className="inline-flex items-center gap-1 text-[11px] text-amber-300 font-semibold">
                      <Award className="w-3.5 h-3.5 text-[#D4AF37]" />
                      <span>Caso Verificado</span>
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Indicadores de Posición / Paginación Punteada */}
          <div className="flex items-center justify-center gap-2 mt-2">
            {filteredClients.map((_, dotIdx) => {
              const isActive = dotIdx === currentIndex;
              return (
                <button
                  key={dotIdx}
                  type="button"
                  onClick={() => handleScrollToIndex(dotIdx)}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    isActive 
                      ? "w-8 bg-gradient-to-r from-[#B08A1A] to-[#D4AF37]" 
                      : "w-2 bg-slate-700 hover:bg-slate-500"
                  }`}
                  aria-label={`Ir a tarjeta ${dotIdx + 1}`}
                />
              );
            })}
          </div>
        </div>

        {/* 4. Banner de Garantía & Cifras Directivas */}
        <div className="mt-14 bg-gradient-to-r from-slate-900/90 via-[#012540]/90 to-slate-900/90 border border-amber-500/30 rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/15 border border-[#B08A1A]/40 text-[#D4AF37] flex items-center justify-center shrink-0">
              <Award className="w-7 h-7" />
            </div>
            <div>
              <h4 className="text-base sm:text-lg font-bold text-white">
                ¿Su empresa se prepara para una auditoría o certificación?
              </h4>
              <p className="text-xs sm:text-sm text-slate-300 mt-0.5">
                Nuestros clientes han alcanzado el <strong className="text-[#D4AF37]">99.4% de efectividad</strong> ante ICONTEC, SGS, Bureau Veritas y entes de control fiscal.
              </p>
            </div>
          </div>

          <Link
            href="/contacto"
            className="shrink-0 inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-[#B08A1A] to-[#D4AF37] text-slate-950 font-black text-xs sm:text-sm hover:brightness-110 transition-all shadow-lg gold-glow"
          >
            <span>Agendar Consulta Sin Costo</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

      </div>
    </section>
  );
}
