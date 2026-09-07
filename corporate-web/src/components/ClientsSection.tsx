"use client";

import { useState } from "react";
import Image from "next/image";
import { 
  Building2, 
  ShieldCheck, 
  CheckCircle2, 
  Award, 
  Sparkles, 
  ArrowRight,
  Filter
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

  const filteredClients = activeFilter === "all" 
    ? clients 
    : clients.filter((c) => c.sectorKey === activeFilter);

  return (
    <section id="nuestros-clientes" className="py-24 bg-gradient-to-b from-[#01355a] via-[#01426F] to-[#012f50] text-white border-y border-amber-900/40 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_30%,rgba(176,138,26,0.16),transparent)] pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:3.5rem_3.5rem] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Header Corporativo de Prestigio */}
        <div className="text-center max-w-3xl mx-auto mb-14">
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

        {/* 1. Cinta / Ribbon Oficial de Logotipos */}
        <div className="mb-14 bg-white/95 rounded-3xl p-6 sm:p-8 shadow-2xl border border-amber-500/30 backdrop-blur-md">
          <div className="text-center mb-5">
            <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">
              Ecosistemas Empresariales Optimizados
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 items-center">
            {clients.map((client) => (
              <div 
                key={client.id}
                className="h-20 bg-white rounded-2xl border border-slate-200/90 p-3.5 flex items-center justify-center shadow-sm hover:shadow-md hover:border-[#B08A1A]/80 transition-all duration-300 group"
                title={client.name}
              >
                <div className="relative w-full h-full flex items-center justify-center">
                  <Image
                    src={client.logoSrc}
                    alt={client.name}
                    fill
                    className="object-contain filter grayscale group-hover:grayscale-0 transition-all duration-300 transform group-hover:scale-105"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 2. Filtro Interactivo por Sector */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-10">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 mr-2 hidden sm:flex">
            <Filter className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>Filtrar por sector:</span>
          </div>

          {sectors.map((sector) => {
            const isSelected = activeFilter === sector.key;
            return (
              <button
                key={sector.key}
                onClick={() => setActiveFilter(sector.key)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 flex items-center gap-2 ${
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

        {/* 3. Grid de Tarjetas Detalladas por Cliente (Arquitectura Ejecutiva Dual-Tone) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7 items-stretch">
          {filteredClients.map((client) => (
            <div
              key={client.id}
              className="rounded-3xl overflow-hidden shadow-xl hover:shadow-[0_24px_50px_rgba(0,0,0,0.55)] border border-slate-700/60 hover:border-[#D4AF37]/80 transition-all duration-300 flex flex-col group hover:-translate-y-2 bg-[#00172c]"
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
                  <h3 className="text-xl sm:text-2xl font-black text-white group-hover:text-[#D4AF37] transition-colors mb-1">
                    {client.name}
                  </h3>
                  
                  <span className="text-xs font-bold text-[#D4AF37] uppercase tracking-wider block mb-3.5">
                    {client.sectorLabel}
                  </span>

                  <p className="text-xs sm:text-[13px] text-slate-300 leading-relaxed mb-6 font-normal">
                    {client.scope}
                  </p>

                  {/* Entregables en Pastillas de Cristal */}
                  <div className="space-y-2 mb-6">
                    {client.highlights.map((item, idx) => (
                      <div 
                        key={idx} 
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

