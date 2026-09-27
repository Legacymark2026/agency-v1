"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { 
  Building2, 
  Globe, 
  ArrowUpRight, 
  ShieldCheck, 
  Lock, 
  CheckCircle2, 
  Search, 
  Sparkles, 
  Layers, 
  ExternalLink,
  ChevronRight,
  Server,
  Zap,
  Info
} from "lucide-react";
import { platformAccessData, CorporateAccessItem } from "@/data/platformAccessData";

export default function PlatformAccessSection() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSector, setSelectedSector] = useState("all");

  const { mainPlatform, corporateAccessList } = platformAccessData;

  const sectors = [
    { id: "all", label: "Todas las Organizaciones" },
    { id: "Cooperativo", label: "Cooperativo & Transporte" },
    { id: "Transporte", label: "Transporte Masivo" },
    { id: "Gobierno", label: "Gobierno & Gestión del Riesgo" }
  ];

  const filteredCorporates = corporateAccessList.filter((item: CorporateAccessItem) => {
    const matchesSearch = item.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.displayUrl.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.sector.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSector = selectedSector === "all" || item.sector.includes(selectedSector);
    return matchesSearch && matchesSector;
  });

  return (
    <section id="acceso-plataformas" className="py-24 bg-gradient-to-b from-white via-slate-50/80 to-white relative overflow-hidden border-b border-slate-200">
      {/* Elementos decorativos de fondo con los tonos corporativos Azul #01426F y Dorado #B08A1A */}
      <div className="absolute top-0 right-0 w-[550px] h-[550px] bg-gradient-to-bl from-amber-500/8 via-[#01426F]/5 to-transparent rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[450px] h-[450px] bg-gradient-to-tr from-[#01426F]/5 via-amber-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Encabezado Principal de Sección */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-[#B08A1A]/30 text-[#B08A1A] text-xs font-bold uppercase tracking-[0.2em] mb-4 shadow-xs">
            <Server className="w-3.5 h-3.5 text-[#B08A1A]" />
            <span>Puntos de Entrada al Ecosistema</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight leading-[1.15]">
            Acceso a <span className="text-[#01426F]">Plataformas</span>
          </h2>

          <p className="mt-4 text-base sm:text-lg text-slate-600 leading-relaxed font-normal">
            Conecte con su entorno de trabajo de manera ágil y segura. Seleccione si su empresa opera bajo la 
            plataforma principal de producción o mediante una instancia corporativa independiente.
          </p>
        </div>

        {/* ========================================================================= */}
        {/* SUBSECCIÓN 1: PLATAFORMA PRINCIPAL (ACCESO UNIVERSAL DE PRODUCCIÓN) */}
        {/* ========================================================================= */}
        <div className="mb-20">
          <div className="flex items-center gap-3 mb-6">
            <span className="w-2.5 h-7 rounded-full bg-[#B08A1A]" />
            <div>
              <h3 className="text-xl sm:text-2xl font-black text-slate-900">
                1. Plataforma Principal
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 font-medium">
                Enlace de acceso universal para empresas bajo el mismo link de producción centralizado.
              </p>
            </div>
          </div>

          {/* Tarjeta Heroica de Acceso a Plataforma Principal */}
          <div className="relative rounded-3xl bg-[#01426F] text-white p-8 sm:p-12 border border-[#B08A1A]/40 shadow-2xl overflow-hidden group">
            {/* Efectos de luz e interactividad */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-amber-500/20 via-amber-500/5 to-transparent rounded-full blur-2xl pointer-events-none group-hover:scale-110 transition-transform duration-700" />
            <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:2rem_2rem] pointer-events-none" />

            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              
              {/* Información y Propuesta de Valor */}
              <div className="lg:col-span-7 space-y-6">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-xs font-bold uppercase tracking-wider">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    Producción Online
                  </span>
                  <span className="px-3.5 py-1 rounded-full bg-amber-500/15 border border-[#B08A1A]/50 text-[#D4AF37] text-xs font-bold uppercase tracking-wider">
                    {mainPlatform.badge}
                  </span>
                </div>

                <div>
                  <h4 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight">
                    {mainPlatform.title}
                  </h4>
                  <p className="mt-3 text-slate-300 text-sm sm:text-base leading-relaxed">
                    {mainPlatform.subtitle}
                  </p>
                </div>

                {/* Checklist de Capacidades */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  {mainPlatform.features.map((feat, i) => (
                    <div key={i} className="flex items-start gap-2.5 text-xs text-slate-200">
                      <CheckCircle2 className="w-4 h-4 text-[#D4AF37] shrink-0 mt-0.5" />
                      <span className="leading-snug">{feat}</span>
                    </div>
                  ))}
                </div>

                {/* Sellos de Confianza y Seguridad */}
                <div className="flex flex-wrap items-center gap-6 pt-4 border-t border-slate-700/70 text-xs text-slate-300">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-[#D4AF37]" />
                    <span>Disponibilidad: <strong>{mainPlatform.sla}</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>Seguridad y Aislamiento: <strong>{mainPlatform.securityTier}</strong></span>
                  </div>
                </div>
              </div>

              {/* Botón de Entrada y Acción Destacada */}
              <div className="lg:col-span-5 flex flex-col justify-center items-center lg:items-end">
                <div className="w-full max-w-sm p-6 sm:p-8 rounded-3xl bg-slate-900/80 backdrop-blur-xl border border-slate-700/80 shadow-2xl text-center space-y-5">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#01426F] to-[#0A2540] border border-[#B08A1A]/40 mx-auto flex items-center justify-center text-[#D4AF37] shadow-lg">
                    <Lock className="w-8 h-8" />
                  </div>

                  <div>
                    <h5 className="text-base font-bold text-white">Ingreso a Producción</h5>
                    <p className="text-xs text-slate-400 mt-1">
                      Acceso centralizado para empresas cliente y colaboradores activos.
                    </p>
                  </div>

                  <a
                    href={mainPlatform.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full inline-flex items-center justify-center gap-3 px-6 py-4 rounded-2xl bg-gradient-to-r from-[#B08A1A] to-[#D4AF37] text-slate-950 font-black text-sm hover:brightness-110 transition-all shadow-xl hover:scale-[1.02] active:scale-95 group/btn"
                  >
                    <span>Ingresar a Plataforma Principal</span>
                    <ArrowUpRight className="w-4 h-4 transition-transform group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5" />
                  </a>

                  <div className="text-[11px] text-slate-400 flex items-center justify-center gap-1.5 pt-1">
                    <Globe className="w-3.5 h-3.5 text-slate-500" />
                    <span className="font-mono text-[10.5px] text-slate-300">{mainPlatform.displayUrl}</span>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* SUBSECCIÓN 2: ACCESOS CORPORATIVOS ESPECIALES (ENLACES INDEPENDIENTES) */}
        {/* ========================================================================= */}
        <div>
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
            <div className="flex items-center gap-3">
              <span className="w-2.5 h-7 rounded-full bg-[#01426F]" />
              <div>
                <h3 className="text-xl sm:text-2xl font-black text-slate-900">
                  2. Accesos Corporativos Especiales
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 font-medium">
                  Catálogo de accesos directos para empresas y entidades con enlaces independientes.
                </p>
              </div>
            </div>

            {/* Barra de Búsqueda Dinámica */}
            <div className="relative w-full md:w-72">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar entidad o sector..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl bg-white border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#B08A1A] focus:ring-2 focus:ring-amber-500/20 shadow-xs transition-all"
              />
            </div>
          </div>

          {/* Filtros rápidos por sector */}
          <div className="flex items-center gap-2 overflow-x-auto pb-4 scrollbar-none mb-6">
            {sectors.map((sec) => (
              <button
                key={sec.id}
                onClick={() => setSelectedSector(sec.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  selectedSector === sec.id
                    ? "bg-[#01426F] text-[#D4AF37] border border-[#B08A1A]/40 shadow-xs"
                    : "bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200"
                }`}
              >
                {sec.label}
              </button>
            ))}
          </div>

          {/* Grid de Empresas con Enlaces Independientes */}
          {filteredCorporates.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCorporates.map((corp) => (
                <div
                  key={corp.id}
                  className="bg-white rounded-3xl p-6 border border-slate-200 hover:border-[#B08A1A]/50 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between group relative overflow-hidden"
                >
                  {/* Detalle de acento superior */}
                  <div 
                    className="absolute top-0 left-0 right-0 h-1.5 transition-all duration-300 group-hover:h-2"
                    style={{ backgroundColor: corp.accentColor || "#01426F" }}
                  />

                  <div>
                    {/* Header de la Tarjeta Corporativa */}
                    <div className="flex items-start justify-between gap-4 mb-4 pt-1">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-12 h-12 rounded-2xl flex items-center justify-center font-black text-white text-base shadow-xs shrink-0 group-hover:scale-105 transition-transform"
                          style={{ backgroundColor: corp.accentColor }}
                        >
                          {corp.initials}
                        </div>
                        <div>
                          <h4 className="text-base font-bold text-slate-900 group-hover:text-[#01426F] transition-colors leading-snug">
                            {corp.companyName}
                          </h4>
                          <span className="text-[11px] text-slate-500 font-medium block">
                            {corp.sector}
                          </span>
                        </div>
                      </div>

                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200 shrink-0">
                        {corp.badge}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed mb-5">
                      {corp.description}
                    </p>
                  </div>

                  {/* Footer de Tarjeta con Link y Botón */}
                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                    <div className="text-[11px] font-mono text-slate-500 truncate max-w-[170px]" title={corp.loginUrl}>
                      {corp.displayUrl}
                    </div>

                    <a
                      href={corp.loginUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-50 hover:bg-[#01426F] text-slate-800 hover:text-[#D4AF37] border border-slate-200 hover:border-[#B08A1A]/40 text-xs font-bold transition-all shadow-2xs group/btn cursor-pointer"
                    >
                      <span>Acceder</span>
                      <ArrowUpRight className="w-3.5 h-3.5 transition-transform group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 text-slate-500 space-y-2">
              <Building2 className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="text-sm font-semibold text-slate-800">No se encontraron accesos corporativos</p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                No hay entidades que coincidan con &ldquo;{searchTerm}&rdquo;. Intente con otro término o seleccione &ldquo;Todas las Organizaciones&rdquo;.
              </p>
            </div>
          )}

          {/* Banner de soporte institucional */}
          <div className="mt-12 p-6 rounded-3xl bg-slate-900 text-white border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3.5 text-center sm:text-left">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-[#B08A1A]/40 text-[#D4AF37] flex items-center justify-center shrink-0">
                <Info className="w-5 h-5" />
              </div>
              <div>
                <h5 className="text-sm font-bold text-white">¿Su organización cuenta con una instancia corporativa privada?</h5>
                <p className="text-xs text-slate-400 mt-0.5">
                  Si no encuentra el enlace directo a su portal o requiere asistencia con sus accesos, comuníquese con nuestra mesa de ayuda.
                </p>
              </div>
            </div>

            <Link
              href="/contacto"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-900 text-xs font-bold transition-colors shrink-0 shadow-sm"
            >
              <span>Mesa de Ayuda Directiva</span>
              <ChevronRight className="w-3.5 h-3.5 text-[#B08A1A]" />
            </Link>
          </div>
        </div>

      </div>
    </section>
  );
}
