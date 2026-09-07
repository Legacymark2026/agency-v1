"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  TrendingUp,
  ShieldAlert,
  Users,
  Layers,
  FileText,
  ClipboardCheck,
  Truck,
  Leaf,
  ShoppingBag,
  Gauge,
  CheckCircle2,
  ArrowRight,
  ChevronDown,
  Sparkles,
  Award,
  ShieldCheck,
  Filter,
  Check
} from "lucide-react";

export interface PlatformModule {
  id: string;
  number: string;
  name: string;
  category: "estrategia" | "hseq" | "operaciones";
  categoryLabel: string;
  badge: string;
  norma: string;
  description: string;
  highlights: string[];
  icon: any;
  accentColor: string;
  metrics: { label: string; value: string };
}

const platformModules: PlatformModule[] = [
  {
    id: "gerencia",
    number: "01",
    name: "GERENCIA",
    category: "estrategia",
    categoryLabel: "Estrategia & Dirección",
    badge: "Productividad Directiva",
    norma: "Liderazgo & Gobierno Corporativo",
    description: "Mejore la productividad y competitividad de su organización controlando los procesos, personas y sistemas, optimice la comunicación, los planes de trabajo, matrices de riesgos y presupuestos.",
    highlights: [
      "Control centralizado de procesos, personas y sistemas",
      "Optimización de la comunicación interna y planes de trabajo",
      "Matrices integradas de riesgos estratégicos y operativos",
      "Gestión y seguimiento de presupuestos en tiempo real",
    ],
    icon: TrendingUp,
    accentColor: "#B08A1A",
    metrics: { label: "Control de Planes Directivos", value: "100%" },
  },
  {
    id: "sg-sst",
    number: "02",
    name: "SG-SST",
    category: "hseq",
    categoryLabel: "HSEQ & Cumplimiento",
    badge: "Cumplimiento Legal Obligatorio",
    norma: "Decreto 1072 de 2015 & Res. 0312 de 2019",
    description: "Implemente su Sistema de Gestión de Seguridad y Salud en el Trabajo dando cumplimiento al decreto 1072 de 2015 y la resolución 0312 de 2019.",
    highlights: [
      "Cumplimiento integral del Decreto 1072 de 2015 y Res. 0312 de 2019",
      "Evaluación de Estándares Mínimos con cálculo de puntaje",
      "Matriz de identificación de peligros y valoración de riesgos (GTC 45)",
      "Gestión de COPASST, Comité de Convivencia y reporte de incidentes",
    ],
    icon: ShieldAlert,
    accentColor: "#DC2626",
    metrics: { label: "Cumplimiento Legal SG-SST", value: "100%" },
  },
  {
    id: "talento-humano",
    number: "03",
    name: "TALENTO HUMANO",
    category: "operaciones",
    categoryLabel: "Operaciones & Personas",
    badge: "Gestión por Competencias",
    norma: "Evaluación del Desempeño & Capacitación",
    description: "Identifique y mejore las competencias de cada empleado basado en los perfiles de cada cargo y de los resultados de las evaluaciones de desempeño, establezca el programa general de capacitación, planifique las capacitaciones para un determinado periodo, evalúe el entendimiento de la temática, controle a los resultados de las pruebas y establezca planes de mejoramiento.",
    highlights: [
      "Perfiles de cargo y competencias laborales por cada puesto",
      "Evaluaciones de desempeño periódicas y objetivas",
      "Plan general y cronograma de capacitaciones por período",
      "Evaluación de entendimiento y planes de mejoramiento individual",
    ],
    icon: Users,
    accentColor: "#2563EB",
    metrics: { label: "Eficacia en Capacitaciones", value: "97.4%" },
  },
  {
    id: "sig",
    number: "04",
    name: "SIG (SISTEMAS INTEGRADOS)",
    category: "estrategia",
    categoryLabel: "Estrategia & Dirección",
    badge: "Mejora Continua & CAPA",
    norma: "ISO 9001, 14001, 45001, HSEQ",
    description: "Integre sobre una acción correctiva, preventiva o de mejora, a un grupo multidisciplinario quienes desde cualquier lugar y en línea, podrán determinar causas, establecer un plan de acción, hacer seguimiento y evaluar la eficacia, eficiencia y efectividad de las acciones implementadas. Realice una verdadera gestión del conocimiento, alcance niveles de excelencia aplicando la autogestión, autorregulación y el autocontrol.",
    highlights: [
      "Acciones correctivas, preventivas y de mejora (CAPA) en línea",
      "Análisis multidisciplinario de causas raíz y planes de acción",
      "Evaluación de eficacia, eficiencia y efectividad de acciones",
      "Gestión del conocimiento, autogestión y autocontrol corporativo",
    ],
    icon: Layers,
    accentColor: "#059669",
    metrics: { label: "Eficacia en Acciones CAPA", value: "99.2%" },
  },
  {
    id: "documental",
    number: "05",
    name: "DOCUMENTAL",
    category: "operaciones",
    categoryLabel: "Operaciones & Personas",
    badge: "Filosofía Cero Papel",
    norma: "Control de Información Documentada",
    description: "Administre de manera fácil y dinámica la estructura documental, organícela por procesos, cargos, empleados; controle su distribución y estado de versiones. Identifique la normatividad legal y reglamentaria que aplica a su organización, súbala al sistema y mantenga a todo su personal actualizado.",
    highlights: [
      "Estructura documental organizada por procesos, cargos y empleados",
      "Control estricto de distribución y estado de versiones vigentes",
      "Matriz de normatividad legal y reglamentaria aplicable",
      "Virtualización Cero Papel y personal permanentemente actualizado",
    ],
    icon: FileText,
    accentColor: "#0891B2",
    metrics: { label: "Reducción Gasto Papel", value: "-80%" },
  },
  {
    id: "auditorias",
    number: "06",
    name: "AUDITORÍAS",
    category: "estrategia",
    categoryLabel: "Estrategia & Dirección",
    badge: "Ciclo Completo en Línea",
    norma: "Directrices para Auditorías ISO 19011",
    description: "Con NeoGestión puede realizar auditorías a cualquier sistema de gestión haciendo seguimiento en línea. Contiene aplicaciones como Programa de auditorías, Presupuesto de auditoría, Cronograma de auditoría, Plan de auditoría, Reporte de auditorías.",
    highlights: [
      "Programa y plan de auditorías a cualquier sistema de gestión",
      "Presupuesto de auditoría y control de recursos",
      "Cronograma de auditoría con seguimiento de avance en línea",
      "Generación de reportes de auditoría y gestión de hallazgos",
    ],
    icon: ClipboardCheck,
    accentColor: "#7C3AED",
    metrics: { label: "Aprobación Auditorías Externas", value: "99.4%" },
  },
  {
    id: "proveedores",
    number: "07",
    name: "PROVEEDORES (SCM)",
    category: "operaciones",
    categoryLabel: "Operaciones & Personas",
    badge: "Cadena de Suministro Segura",
    norma: "Compras & Homologación de Proveedores",
    description: "Planifique sus compras de acuerdo a las necesidades de cada área o proceso, clasifique y seleccione a sus mejores proveedores, manteniendo una estrecha relación a través de nuestra plataforma.",
    highlights: [
      "Planificación de compras coordinada por área y proceso",
      "Clasificación, homologación y selección de proveedores",
      "Evaluación y reevaluación periódica de desempeño de proveedores",
      "Estrecha relación operativa y trazabilidad en plataforma",
    ],
    icon: Truck,
    accentColor: "#D97706",
    metrics: { label: "Confiabilidad de Cadena SCM", value: "98.6%" },
  },
  {
    id: "ambiental",
    number: "08",
    name: "AMBIENTAL",
    category: "hseq",
    categoryLabel: "HSEQ & Cumplimiento",
    badge: "Sostenibilidad & Ecoeficiencia",
    norma: "ISO 14001:2015 & Legislación Ambiental",
    description: "Gestione integralmente los aspectos e impactos ambientales de su organización. Administre la matriz legal ambiental, controle vertimientos, residuos peligrosos (RESPEL) y consumo de recursos, garantizando el cumplimiento normativo y la sostenibilidad empresarial.",
    highlights: [
      "Matriz de identificación y evaluación de aspectos e impactos ambientales",
      "Control de residuos peligrosos (RESPEL) y convencionales",
      "Monitoreo de vertimientos, emisiones y programas de ahorro de agua/energía",
      "Seguimiento al cumplimiento de la normatividad ambiental aplicable",
    ],
    icon: Leaf,
    accentColor: "#16A34A",
    metrics: { label: "Cumplimiento Matriz Ambiental", value: "100%" },
  },
  {
    id: "comercial",
    number: "09",
    name: "COMERCIAL (CRM)",
    category: "operaciones",
    categoryLabel: "Operaciones & Personas",
    badge: "Fidelización & Clientes",
    norma: "Gestión de Relaciones & PQRS",
    description: "Potencialice los resultados comerciales de su organización, realice una verdadera gestión con sus clientes, mantenga al día toda su información, realice cotizaciones, tome pedidos, controle los despachos, gestione sus peticiones, quejas, reclamos, correcciones y sugerencias, evalúe su nivel de satisfacción, controle las ventas por asesor comercial, etc.",
    highlights: [
      "Directorio 360° de clientes con información actualizada",
      "Cotizaciones inmediatas, toma de pedidos y control de despachos",
      "Gestión de PQRS (Peticiones, Quejas, Reclamos, Correcciones y Sugerencias)",
      "Medición de satisfacción de clientes y control de ventas por asesor",
    ],
    icon: ShoppingBag,
    accentColor: "#EA580C",
    metrics: { label: "Tasa de Respuesta PQRS", value: "99.1%" },
  },
  {
    id: "metrologia",
    number: "10",
    name: "METROLOGÍA",
    category: "hseq",
    categoryLabel: "HSEQ & Cumplimiento",
    badge: "Aseguramiento Metrológico",
    norma: "Control de Equipos de Medición (EIMEs)",
    description: "A través del programa de Metrología se lleva el control de los equipos de inspección, medición y ensayo (eime´s), considerando los aspectos básicos de control y estableciendo fechas de próxima calibración.",
    highlights: [
      "Control y hoja de vida de equipos de inspección, medición y ensayo (EIMEs)",
      "Aspectos básicos de control y programación de calibración",
      "Alertas automáticas de fechas de próxima calibración preventiva",
      "Historial de calibraciones y certificados de laboratorios acreditados",
    ],
    icon: Gauge,
    accentColor: "#4F46E5",
    metrics: { label: "Equipos con Calibración Vigente", value: "100%" },
  },
];

const filterCategories = [
  { key: "all", label: "Todos los Módulos", count: 10 },
  { key: "estrategia", label: "Estrategia & Dirección", count: 3 },
  { key: "hseq", label: "HSEQ & Cumplimiento", count: 3 },
  { key: "operaciones", label: "Operaciones & Personas", count: 4 },
];

export default function ModuleExplorer() {
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [selectedModuleId, setSelectedModuleId] = useState<string>("gerencia");
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({
    "gerencia": true,
    "sg-sst": true,
  });

  const toggleCard = (id: string) => {
    setExpandedCards((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const expandAll = () => {
    const allExpanded: Record<string, boolean> = {};
    platformModules.forEach((m) => {
      allExpanded[m.id] = true;
    });
    setExpandedCards(allExpanded);
  };

  const collapseAll = () => {
    setExpandedCards({});
  };

  const filteredModules = activeCategory === "all"
    ? platformModules
    : platformModules.filter((m) => m.category === activeCategory);

  const activeModule = platformModules.find((m) => m.id === selectedModuleId) || platformModules[0];
  const ActiveIcon = activeModule.icon;

  return (
    <section id="modulos-plataforma" className="py-24 bg-slate-50 border-b border-slate-200 relative overflow-hidden">
      {/* Background Subtle Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#00000005_1px,transparent_1px),linear-gradient(to_bottom,#00000005_1px,transparent_1px)] bg-[size:3.5rem_3.5rem] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Header Directivo de la Sección */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-[#B08A1A]/30 text-[#B08A1A] text-xs font-bold uppercase tracking-[0.2em] mb-4">
            <Sparkles className="w-3.5 h-3.5 text-[#B08A1A]" />
            <span>Arquitectura Modular Integral • 10 Módulos Nativos</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight font-sans">
            MÓDULOS DE LA <span className="text-[#01426F]">PLATAFORMA</span>
          </h2>
          
          <p className="mt-4 text-base sm:text-lg text-slate-600 leading-relaxed">
            Ecosistema de software empresarial diseñado para controlar, sistematizar y auditar la totalidad de los procesos estratégicos, operativos y normativos de su empresa con <strong className="text-slate-900">usuarios ilimitados</strong>.
          </p>
        </div>

        {/* Barra de Filtros por Categoría & Controles */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-10 pb-6 border-b border-slate-200">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 mr-2">
              <Filter className="w-3.5 h-3.5 text-[#B08A1A]" />
              <span>Filtrar módulos:</span>
            </div>
            {filterCategories.map((cat) => {
              const isSelected = activeCategory === cat.key;
              return (
                <button
                  key={cat.key}
                  onClick={() => setActiveCategory(cat.key)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 flex items-center gap-2 ${
                    isSelected
                      ? "bg-[#01426F] text-[#D4AF37] shadow-md border border-[#B08A1A]/40 scale-105"
                      : "bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200"
                  }`}
                >
                  <span>{cat.label}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    isSelected ? "bg-[#002845] text-[#D4AF37]" : "bg-slate-100 text-slate-500"
                  }`}>
                    {cat.count}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2 text-xs">
            <button
              onClick={expandAll}
              className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 hover:text-slate-900 hover:bg-slate-100 font-semibold transition-colors"
            >
              Expandir todos
            </button>
            <button
              onClick={collapseAll}
              className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 hover:text-slate-900 hover:bg-slate-100 font-semibold transition-colors"
            >
              Colapsar
            </button>
          </div>
        </div>

        {/* Grid de 10 Módulos Organizados (Arquitectura Ejecutiva a 2 Columnas) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 items-start mb-16">
          {filteredModules.map((module) => {
            const isExpanded = !!expandedCards[module.id];
            const IconComp = module.icon;

            return (
              <div
                key={module.id}
                className="bg-white rounded-3xl border border-slate-200/90 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group hover:border-[#01426F]/40"
              >
                {/* Franja de Acento de Color Superior */}
                <div 
                  className="h-1.5 w-full"
                  style={{ backgroundColor: module.accentColor }} 
                />

                <div className="p-6 sm:p-7">
                  {/* Encabezado de Tarjeta */}
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex items-center gap-3.5">
                      <div 
                        className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm border"
                        style={{ 
                          backgroundColor: `${module.accentColor}12`,
                          borderColor: `${module.accentColor}30`,
                          color: module.accentColor
                        }}
                      >
                        <IconComp className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[11px] font-bold text-slate-400">
                            MÓDULO {module.number}
                          </span>
                          <span className="text-[10px] font-semibold text-slate-400">•</span>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-[#B08A1A]">
                            {module.categoryLabel}
                          </span>
                        </div>
                        <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-0.5 group-hover:text-[#01426F] transition-colors">
                          {module.name}
                        </h3>
                      </div>
                    </div>

                    <span className="hidden sm:inline-block text-[10px] font-bold uppercase tracking-wider text-slate-700 bg-slate-100 px-3 py-1 rounded-full border border-slate-200 shrink-0">
                      {module.badge}
                    </span>
                  </div>

                  {/* Barra de Norma & Control */}
                  <div className="mb-4 px-3.5 py-1.5 rounded-xl bg-slate-50 border border-slate-200/70 flex items-center justify-between text-xs text-slate-600">
                    <span className="font-semibold text-slate-700">Norma / Alcance:</span>
                    <span className="font-mono text-[11px] font-bold text-[#01426F]">
                      {module.norma}
                    </span>
                  </div>

                  {/* Botón DETALLES (Acordeón Ultraprofesional) */}
                  <div className="border-t border-slate-100 pt-3">
                    <button
                      onClick={() => toggleCard(module.id)}
                      className="w-full flex items-center justify-between py-2 text-xs font-bold uppercase tracking-wider text-slate-600 hover:text-[#01426F] transition-colors group/btn"
                    >
                      <span className="flex items-center gap-2 text-[#01426F]">
                        <span>DETALLES</span>
                        <span className="text-[11px] text-slate-400 font-normal lowercase">
                          ({isExpanded ? "ocultar especificación" : "ver capacidades del módulo"})
                        </span>
                      </span>
                      <div className={`p-1 rounded-lg bg-slate-100 group-hover/btn:bg-slate-200 transition-colors ${
                        isExpanded ? "rotate-180" : ""
                      }`}>
                        <ChevronDown className="w-4 h-4 text-[#01426F]" />
                      </div>
                    </button>

                    {/* Contenido Desplegable: Descripción Verbatim & Viñetas */}
                    {isExpanded && (
                      <div className="mt-3 pt-3 border-t border-slate-100/80 space-y-4 animate-in fade-in duration-200">
                        {/* Texto oficial de la plataforma */}
                        <p className="text-sm text-slate-700 leading-relaxed font-normal bg-amber-500/[0.04] p-4 rounded-2xl border border-amber-500/20">
                          {module.description}
                        </p>

                        {/* Entregables y capacidades del módulo */}
                        <div className="space-y-2 pt-1">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                            Alcance y Funcionalidades Incluidas:
                          </span>
                          {module.highlights.map((h, i) => (
                            <div key={i} className="flex items-start gap-2 text-xs text-slate-700">
                              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                              <span>{h}</span>
                            </div>
                          ))}
                        </div>

                        {/* Pie de tarjeta con métrica */}
                        <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                          <div className="flex items-center gap-1.5 text-slate-500">
                            <ShieldCheck className="w-4 h-4 text-emerald-600" />
                            <span className="font-semibold text-slate-800">{module.metrics.value}</span>
                            <span>{module.metrics.label}</span>
                          </div>

                          <button
                            onClick={() => {
                              setSelectedModuleId(module.id);
                              const el = document.getElementById("detalle-modulo-profundo");
                              el?.scrollIntoView({ behavior: "smooth" });
                            }}
                            className="text-[#B08A1A] hover:text-[#01426F] font-bold text-xs inline-flex items-center gap-1 transition-colors"
                          >
                            <span>Ficha Ejecutiva</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Panel Interactivo de Análisis Profundo & Demostración */}
        <div id="detalle-modulo-profundo" className="bg-[#001D38] rounded-3xl border border-amber-500/30 text-white p-8 sm:p-10 lg:p-12 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-[radial-gradient(circle_at_top_right,rgba(176,138,26,0.15),transparent)] pointer-events-none" />
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center relative z-10">
            {/* Columna Izquierda: Detalle del Módulo Seleccionado */}
            <div className="lg:col-span-8 space-y-6">
              <div className="flex flex-wrap items-center gap-3">
                <span className="px-3 py-1 rounded-full bg-amber-500/15 border border-[#B08A1A]/40 text-[#D4AF37] text-xs font-bold uppercase tracking-wider">
                  MÓDULO {activeModule.number} • {activeModule.badge}
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  {activeModule.norma}
                </span>
              </div>

              <div className="flex items-center gap-4">
                <div 
                  className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 border border-white/20 shadow-lg"
                  style={{ backgroundColor: `${activeModule.accentColor}25` }}
                >
                  <ActiveIcon className="w-7 h-7 text-[#D4AF37]" />
                </div>
                <h3 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                  MÓDULO {activeModule.name}
                </h3>
              </div>

              <p className="text-base sm:text-lg text-slate-200 leading-relaxed font-normal">
                {activeModule.description}
              </p>

              <div className="space-y-3 pt-2">
                <span className="text-xs font-bold uppercase tracking-widest text-[#D4AF37] block">
                  Capacidades Integradas en la Plataforma:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {activeModule.highlights.map((item, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 p-3 rounded-xl bg-white/[0.04] border border-white/10">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span className="text-xs font-medium text-slate-200">{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 flex flex-col sm:flex-row gap-4">
                <Link
                  href="/contacto"
                  className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-gradient-to-r from-[#B08A1A] to-[#D4AF37] text-slate-950 font-black text-sm hover:brightness-110 transition-all shadow-lg gold-glow"
                >
                  <span>Solicitar Demo de {activeModule.name}</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/servicios"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-sm border border-white/20 transition-colors"
                >
                  <span>Explorar Todos los Servicios</span>
                </Link>
              </div>
            </div>

            {/* Columna Derecha: Respaldo Institucional & Usuarios Ilimitados */}
            <div className="lg:col-span-4 bg-slate-900/90 rounded-3xl p-7 border border-slate-700/80 flex flex-col justify-between space-y-6 shadow-xl">
              <div>
                <span className="text-xs font-bold uppercase tracking-widest text-[#D4AF37] block mb-2">
                  Garantía del Modelo NeoGestión
                </span>
                <div className="text-3xl font-black text-white">
                  Usuarios Ilimitados
                </div>
                <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                  Todos los 10 módulos de la plataforma están disponibles para la totalidad de sus colaboradores, contratistas y líderes sin costo por usuario adicional.
                </p>
              </div>

              <div className="space-y-3 pt-4 border-t border-slate-800">
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-400" />
                  <span>Cumplimiento legal y normativo verificable</span>
                </div>
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200 flex items-center gap-2">
                  <Award className="w-4 h-4 shrink-0 text-[#D4AF37]" />
                  <span>Acompañamiento de Consultoría de Colombia S.A.S.</span>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
