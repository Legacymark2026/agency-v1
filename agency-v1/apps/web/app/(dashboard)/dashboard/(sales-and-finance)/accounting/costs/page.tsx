"use client";

import React, { useState } from "react";
import { 
    AreaChart, Area, PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend, CartesianGrid, XAxis, YAxis 
} from "recharts";
import { 
    Plus, Download, TrendingUp, TrendingDown, DollarSign, Activity, Calendar, 
    Search, Filter, MoreHorizontal, FileText, CheckCircle2, Clock, Building2, UploadCloud, FileBox, X, AlertCircle
} from "lucide-react";

// Mock Data
const MOCK_COSTS = [
    { id: "1", date: "2026-10-01", concept: "Servidores AWS (Q4)", type: "FIXED", cc: "CC-PROD", amount: 4500000, status: "APPROVED", deductible: true },
    { id: "2", date: "2026-10-02", concept: "Comisiones Pasarela Pago", type: "VARIABLE", cc: "CC-FIN", amount: 1250000, status: "PENDING", deductible: true },
    { id: "3", date: "2026-10-05", concept: "Nómina Operativa", type: "MOD", cc: "CC-PROD", amount: 28000000, status: "APPROVED", deductible: true },
    { id: "4", date: "2026-10-08", concept: "Insumos Empaque", type: "MPD", cc: "CC-LOG", amount: 3400000, status: "PAID", deductible: true },
    { id: "5", date: "2026-10-12", concept: "Energía Eléctrica Planta", type: "CIF", cc: "CC-PROD", amount: 1800000, status: "APPROVED", deductible: true },
    { id: "6", date: "2026-10-15", concept: "Cena Negocios (Suscripción)", type: "VARIABLE", cc: "CC-VENT", amount: 450000, status: "REJECTED", deductible: false },
];

const MOCK_TREND = [
    { month: "May", fijos: 31000000, variables: 12000000, cif: 4000000 },
    { month: "Jun", fijos: 31000000, variables: 14000000, cif: 4200000 },
    { month: "Jul", fijos: 32000000, variables: 11000000, cif: 4100000 },
    { month: "Ago", fijos: 32000000, variables: 18000000, cif: 4800000 },
    { month: "Sep", fijos: 32000000, variables: 16000000, cif: 4500000 },
    { month: "Oct", fijos: 32500000, variables: 15000000, cif: 5000000 },
];

const COST_COLORS: Record<string, string> = {
    FIXED: "#14b8a6", // teal
    VARIABLE: "#f43f5e", // rose
    CIF: "#8b5cf6", // violet
    MOD: "#3b82f6", // blue
    MPD: "#f59e0b", // amber
};

export default function AdvancedCostAccounting() {
    const [activeTab, setActiveTab] = useState<"OVERVIEW" | "LEDGER" | "CENTERS">("OVERVIEW");
    const [isSlideoverOpen, setIsSlideoverOpen] = useState(false);
    const [search, setSearch] = useState("");

    return (
        <div className="h-full flex flex-col bg-slate-950 text-slate-200 font-sans animate-in fade-in duration-500">
            {/* Header */}
            <div className="px-8 py-6 border-b border-slate-800/60 bg-slate-900/40 sticky top-0 z-10 backdrop-blur-xl">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1">
                            <span>Finanzas</span> <span className="text-slate-700">/</span> <span className="text-emerald-500">Contabilidad Analítica</span>
                        </div>
                        <h1 className="text-3xl font-bold text-white flex items-center gap-3 tracking-tight">
                            Gestión de Costos
                            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-semibold uppercase border border-emerald-500/20">
                                NIIF / IFRS
                            </span>
                        </h1>
                    </div>
                    <div className="flex gap-3">
                        <button className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-xl transition-all text-sm font-medium flex items-center gap-2 shadow-sm">
                            <Calendar size={16} className="text-slate-400" />
                            Octubre 2026
                        </button>
                        <button className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-xl transition-all text-sm font-medium flex items-center gap-2 shadow-sm">
                            <Download size={16} className="text-slate-400" />
                            Exportar CSV
                        </button>
                        <button 
                            onClick={() => setIsSlideoverOpen(true)}
                            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl transition-all text-sm font-medium flex items-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_25px_rgba(16,185,129,0.5)]"
                        >
                            <Plus size={16} /> Causar Costo
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-6 mt-8 -mb-6">
                    <TabButton active={activeTab === "OVERVIEW"} onClick={() => setActiveTab("OVERVIEW")} icon={<Activity size={16}/>} label="Dashboard Ejecutivo" />
                    <TabButton active={activeTab === "LEDGER"} onClick={() => setActiveTab("LEDGER")} icon={<FileText size={16}/>} label="Libro Auxiliar (Ledger)" />
                    <TabButton active={activeTab === "CENTERS"} onClick={() => setActiveTab("CENTERS")} icon={<Building2 size={16}/>} label="Centros de Costo" />
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-auto p-8">
                {activeTab === "OVERVIEW" && <OverviewTab />}
                {activeTab === "LEDGER" && <LedgerTab search={search} setSearch={setSearch} />}
                {activeTab === "CENTERS" && <CentersTab />}
            </div>

            {/* Slideover for Registration */}
            {isSlideoverOpen && <RegistrationSlideover onClose={() => setIsSlideoverOpen(false)} />}
        </div>
    );
}

// ============================================================================
// TABS COMPONENTS
// ============================================================================

function OverviewTab() {
    return (
        <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <KPICard title="Total Costos Fijos" amount="$32,500,000" trend="+1.2%" trendUp={false} color="teal" />
                <KPICard title="Total Costos Variables" amount="$15,000,000" trend="-6.4%" trendUp={true} color="rose" />
                <KPICard title="Total CIF" amount="$5,000,000" trend="+4.0%" trendUp={false} color="violet" />
                <KPICard title="Punto de Equilibrio (COP)" amount="$94,200,000" trend="Alcanzado" trendUp={true} color="blue" isNeutral />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Advanced Area Chart */}
                <div className="lg:col-span-2 bg-slate-900/50 border border-slate-800/60 rounded-2xl p-6 shadow-xl backdrop-blur-sm">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h3 className="text-lg font-bold text-white">Evolución de Estructura de Costos</h3>
                            <p className="text-sm text-slate-400">Análisis histórico de los últimos 6 meses</p>
                        </div>
                        <div className="flex items-center gap-4 text-xs font-medium">
                            <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-teal-500"></div>Fijos</div>
                            <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-rose-500"></div>Variables</div>
                            <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-violet-500"></div>CIF</div>
                        </div>
                    </div>
                    <div className="h-72 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={MOCK_TREND.map(d => ({ ...d, fijos: parseFloat(d.fijos), variables: parseFloat(d.variables), cif: parseFloat(d.cif) }))} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorFijos" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="#14b8a6" stopOpacity={0}/>
                                    </linearGradient>
                                    <linearGradient id="colorVar" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                                    </linearGradient>
                                    <linearGradient id="colorCif" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                                <XAxis dataKey="month" stroke="#64748b" tick={{fill: '#64748b', fontSize: 12}} tickLine={false} axisLine={false} />
                                <YAxis stroke="#64748b" tick={{fill: '#64748b', fontSize: 12}} tickLine={false} axisLine={false} tickFormatter={(val) => `$${val}M`} />
                                <RechartsTooltip 
                                    contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', borderColor: '#334155', borderRadius: '8px', color: '#f8fafc', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)' }}
                                    itemStyle={{ fontSize: '13px', fontWeight: 500 }}
                                />
                                <Area type="monotone" dataKey="fijos" stroke="#14b8a6" strokeWidth={2} fillOpacity={1} fill="url(#colorFijos)" stackId="1" />
                                <Area type="monotone" dataKey="variables" stroke="#f43f5e" strokeWidth={2} fillOpacity={1} fill="url(#colorVar)" stackId="1" />
                                <Area type="monotone" dataKey="cif" stroke="#8b5cf6" strokeWidth={2} fillOpacity={1} fill="url(#colorCif)" stackId="1" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Donut Chart */}
                <div className="bg-slate-900/50 border border-slate-800/60 rounded-2xl p-6 shadow-xl backdrop-blur-sm flex flex-col">
                    <h3 className="text-lg font-bold text-white mb-2">Distribución Actual</h3>
                    <p className="text-sm text-slate-400 mb-6">Octubre 2026 vs Mes Anterior</p>
                    
                    <div className="flex-1 relative min-h-[200px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={[
                                        { name: "Fijos", value: 32500000, color: "#14b8a6" },
                                        { name: "Variables", value: 15000000, color: "#f43f5e" },
                                        { name: "CIF", value: 5000000, color: "#8b5cf6" },
                                    ]}
                                    cx="50%" cy="50%" innerRadius={70} outerRadius={90} paddingAngle={4} dataKey="value" stroke="none"
                                >
                                    {[
                                        { color: "#14b8a6" }, { color: "#f43f5e" }, { color: "#8b5cf6" }
                                    ].map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <RechartsTooltip 
                                    formatter={(value: number) => `$${(value/1000000).toFixed(1)}M`}
                                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px' }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                        {/* Center Text */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                            <span className="text-2xl font-bold text-white">$52.5M</span>
                            <span className="text-xs text-slate-500 uppercase tracking-widest">Total</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function LedgerTab({ search, setSearch }: { search: string, setSearch: (val: string) => void }) {
    return (
        <div className="bg-slate-900/50 border border-slate-800/60 rounded-2xl shadow-xl backdrop-blur-sm overflow-hidden animate-in slide-in-from-bottom-4 duration-500">
            {/* Toolbar */}
            <div className="p-4 border-b border-slate-800/60 flex items-center justify-between bg-slate-900/80">
                <div className="relative w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                    <input 
                        type="text" 
                        placeholder="Buscar por concepto o ID..." 
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full bg-slate-950/50 border border-slate-700 text-sm text-white rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50 transition-all placeholder:text-slate-600"
                    />
                </div>
                <div className="flex gap-2">
                    <button className="px-3 py-2 bg-slate-800 border border-slate-700 text-slate-300 rounded-lg hover:bg-slate-700 transition-all text-sm font-medium flex items-center gap-2">
                        <Filter size={14} /> Filtros
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-950/30 text-xs uppercase tracking-wider text-slate-500 font-semibold border-b border-slate-800/60">
                            <th className="px-6 py-4">Fecha</th>
                            <th className="px-6 py-4">Concepto</th>
                            <th className="px-6 py-4">Centro C.</th>
                            <th className="px-6 py-4">Tipo</th>
                            <th className="px-6 py-4 text-right">Monto</th>
                            <th className="px-6 py-4 text-center">Estado</th>
                            <th className="px-6 py-4 text-center">Docs</th>
                            <th className="px-6 py-4 text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="text-sm divide-y divide-slate-800/40">
                        {MOCK_COSTS.map((cost) => (
                            <tr key={cost.id} className="hover:bg-slate-800/30 transition-colors group">
                                <td className="px-6 py-4 whitespace-nowrap text-slate-400">{cost.date}</td>
                                <td className="px-6 py-4 font-medium text-slate-200">
                                    {cost.concept}
                                    {!cost.deductible && <span className="ml-2 text-[10px] bg-amber-500/10 text-amber-500 px-1.5 py-0.5 rounded border border-amber-500/20">No Deducible</span>}
                                </td>
                                <td className="px-6 py-4 text-slate-400 font-mono text-xs">{cost.cc}</td>
                                <td className="px-6 py-4">
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border" 
                                          style={{ backgroundColor: `${COST_COLORS[cost.type]}15`, color: COST_COLORS[cost.type], borderColor: `${COST_COLORS[cost.type]}30` }}>
                                        <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: COST_COLORS[cost.type] }}></div>
                                        {cost.type}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right font-mono text-slate-300">
                                    ${cost.amount.toLocaleString("es-CO")}
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <StatusBadge status={cost.status} />
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <button className="text-slate-500 hover:text-emerald-400 transition-colors">
                                        <FileBox size={16} className="mx-auto" />
                                    </button>
                                </td>
                                <td className="px-6 py-4 text-right opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-md transition-colors">
                                        <MoreHorizontal size={16} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            
            {/* Pagination */}
            <div className="p-4 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-500 bg-slate-900/30">
                <span>Mostrando 1 a 6 de 142 registros</span>
                <div className="flex gap-1">
                    <button className="px-3 py-1.5 border border-slate-700 rounded-md hover:bg-slate-800 disabled:opacity-50">Anterior</button>
                    <button className="px-3 py-1.5 border border-slate-700 rounded-md bg-slate-800 text-white">1</button>
                    <button className="px-3 py-1.5 border border-slate-700 rounded-md hover:bg-slate-800">2</button>
                    <button className="px-3 py-1.5 border border-slate-700 rounded-md hover:bg-slate-800">Siguiente</button>
                </div>
            </div>
        </div>
    );
}

function CentersTab() {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in slide-in-from-bottom-4 duration-500">
            <CostCenterCard name="Producción & Tech" code="CC-PROD" budget={50} spent={39} active={true} />
            <CostCenterCard name="Fuerza Comercial" code="CC-VENT" budget={20} spent={14} active={true} />
            <CostCenterCard name="Logística & Empaque" code="CC-LOG" budget={15} spent={16} active={true} overBudget />
            <CostCenterCard name="Administración & RRHH" code="CC-ADM" budget={12} spent={8} active={true} />
            <CostCenterCard name="Marketing & Ads" code="CC-MKT" budget={10} spent={9} active={true} warning />
            
            {/* New CC Button */}
            <button className="bg-slate-900/30 border border-slate-800/60 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center text-slate-500 hover:text-emerald-400 hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-all group min-h-[200px]">
                <div className="w-12 h-12 rounded-full bg-slate-800 group-hover:bg-emerald-500/20 flex items-center justify-center mb-4 transition-colors">
                    <Plus size={24} />
                </div>
                <span className="font-semibold text-sm">Crear Centro de Costo</span>
            </button>
        </div>
    );
}

// ============================================================================
// UI COMPONENTS
// ============================================================================

function RegistrationSlideover({ onClose }: { onClose: () => void }) {
    return (
        <div className="fixed inset-0 z-50 flex justify-end">
            <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={onClose} />
            
            <div className="relative w-full max-w-md bg-slate-900 border-l border-slate-800 shadow-2xl h-full flex flex-col animate-in slide-in-from-right duration-300">
                <div className="px-6 py-5 border-b border-slate-800/60 flex items-center justify-between bg-slate-900/80">
                    <div>
                        <h2 className="text-lg font-bold text-white">Causar Costo / Gasto</h2>
                        <p className="text-xs text-slate-400">Ingresa los detalles financieros para el ledger.</p>
                    </div>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition-colors">
                        <X size={20} />
                    </button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* File Upload Zone */}
                    <div className="border-2 border-dashed border-slate-700 rounded-xl p-8 flex flex-col items-center justify-center text-center hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-all cursor-pointer group">
                        <div className="w-12 h-12 bg-slate-800 group-hover:bg-emerald-500/20 rounded-full flex items-center justify-center mb-3 text-slate-400 group-hover:text-emerald-400 transition-colors">
                            <UploadCloud size={24} />
                        </div>
                        <p className="text-sm font-semibold text-slate-200">Sube la Factura Electrónica (PDF/XML)</p>
                        <p className="text-xs text-slate-500 mt-1">La IA pre-llenará los datos automáticamente</p>
                    </div>

                    <div className="space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Concepto de Gasto</label>
                            <input type="text" placeholder="Ej: Pago arriendo Abril" className="w-full bg-slate-950/50 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50" />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Monto (COP)</label>
                                <div className="relative">
                                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
                                    <input type="text" placeholder="0.00" className="w-full bg-slate-950/50 border border-slate-700 rounded-lg pl-8 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50" />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Fecha</label>
                                <input type="date" className="w-full bg-slate-950/50 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50 [color-scheme:dark]" />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex justify-between">
                                Tipo de Costo <span className="text-emerald-500 text-[10px] normal-case bg-emerald-500/10 px-1.5 rounded">Requerido NIIF</span>
                            </label>
                            <select className="w-full bg-slate-950/50 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50 appearance-none">
                                <option value="FIXED">Costo Fijo (Gastos operativos estáticos)</option>
                                <option value="VARIABLE">Costo Variable (Asociado a volumen)</option>
                                <option value="CIF">Costos Indirectos (CIF)</option>
                                <option value="MOD">Mano de Obra Directa (Nómina Prod)</option>
                                <option value="MPD">Materia Prima Directa (Insumos)</option>
                            </select>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Centro de Costo</label>
                            <select className="w-full bg-slate-950/50 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50 appearance-none">
                                <option value="CC-PROD">CC-PROD - Producción & Tech</option>
                                <option value="CC-VENT">CC-VENT - Fuerza Comercial</option>
                                <option value="CC-LOG">CC-LOG - Logística & Empaque</option>
                            </select>
                        </div>

                        <div className="pt-4 border-t border-slate-800/60">
                            <label className="flex items-start gap-3 cursor-pointer group">
                                <div className="mt-0.5">
                                    <input type="checkbox" defaultChecked className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-emerald-500 focus:ring-emerald-500/20 focus:ring-offset-slate-900" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-slate-200 group-hover:text-white transition-colors">Costo Deducible (Art. 107 ET)</p>
                                    <p className="text-xs text-slate-500">Marca si este costo tiene relación de causalidad y comprobante DIAN válido.</p>
                                </div>
                            </label>
                        </div>
                    </div>
                </div>

                <div className="p-6 border-t border-slate-800/60 bg-slate-900 flex gap-3">
                    <button onClick={onClose} className="flex-1 px-4 py-2.5 bg-slate-800 text-slate-300 rounded-xl hover:bg-slate-700 transition-colors text-sm font-semibold">
                        Cancelar
                    </button>
                    <button onClick={onClose} className="flex-1 px-4 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-500 transition-colors text-sm font-semibold shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                        Asentar Costo
                    </button>
                </div>
            </div>
        </div>
    );
}

function TabButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
    return (
        <button 
            onClick={onClick}
            className={`pb-4 px-1 flex items-center gap-2 text-sm font-semibold transition-all border-b-2 ${
                active ? "border-emerald-500 text-emerald-400" : "border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700"
            }`}
        >
            {icon}
            {label}
        </button>
    );
}

function KPICard({ title, amount, trend, trendUp, color, isNeutral }: any) {
    const colorClasses: Record<string, string> = {
        teal: "bg-teal-500/10 text-teal-400 border-teal-500/20",
        rose: "bg-rose-500/10 text-rose-400 border-rose-500/20",
        violet: "bg-violet-500/10 text-violet-400 border-violet-500/20",
        blue: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    };
    
    return (
        <div className="bg-slate-900/50 border border-slate-800/60 rounded-2xl p-5 shadow-sm backdrop-blur-sm relative overflow-hidden group hover:border-slate-700 transition-colors">
            <div className={`absolute top-0 right-0 w-32 h-32 blur-3xl opacity-20 -mr-10 -mt-10 rounded-full bg-${color}-500`} />
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">{title}</p>
            <h3 className="text-2xl font-bold text-white mb-4">{amount}</h3>
            
            <div className="flex items-center justify-between">
                <div className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-md border ${isNeutral ? "bg-slate-800 text-slate-300 border-slate-700" : (trendUp ? "bg-rose-500/10 text-rose-400 border-rose-500/20" : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20")}`}>
                    {!isNeutral && (trendUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />)}
                    {trend}
                </div>
                <div className={`p-2 rounded-xl ${colorClasses[color]}`}>
                    <DollarSign size={18} />
                </div>
            </div>
        </div>
    );
}

function StatusBadge({ status }: { status: string }) {
    if (status === "APPROVED") {
        return (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <CheckCircle2 size={10} /> APROBADO
            </span>
        );
    }
    if (status === "PENDING") {
        return (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <Clock size={10} /> PENDIENTE
            </span>
        );
    }
    if (status === "PAID") {
        return (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                <DollarSign size={10} /> PAGADO
            </span>
        );
    }
    return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <AlertCircle size={10} /> RECHAZADO
        </span>
    );
}

function CostCenterCard({ name, code, budget, spent, active, overBudget, warning }: any) {
    const percent = Math.min((spent / budget) * 100, 100);
    
    return (
        <div className={`bg-slate-900/50 border ${overBudget ? 'border-rose-500/50 shadow-[0_0_15px_rgba(244,63,94,0.1)]' : warning ? 'border-amber-500/50' : 'border-slate-800/60'} rounded-2xl p-6 relative overflow-hidden backdrop-blur-sm`}>
            {overBudget && <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/10 blur-2xl rounded-full -mr-10 -mt-10" />}
            
            <div className="flex justify-between items-start mb-6">
                <div>
                    <h3 className="text-lg font-bold text-white">{name}</h3>
                    <p className="text-xs font-mono text-slate-500 mt-1">{code}</p>
                </div>
                <div className="p-2 bg-slate-800 rounded-xl text-slate-400">
                    <Building2 size={20} />
                </div>
            </div>

            <div className="space-y-4">
                <div>
                    <div className="flex justify-between text-sm mb-2">
                        <span className="text-slate-400">Ejecutado</span>
                        <span className="font-bold text-white">${spent}M <span className="text-slate-500 font-normal">/ ${budget}M</span></span>
                    </div>
                    <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                        <div 
                            className={`h-full rounded-full ${overBudget ? 'bg-rose-500' : warning ? 'bg-amber-500' : 'bg-emerald-500'}`} 
                            style={{ width: `${percent}%` }}
                        />
                    </div>
                </div>
                
                <div className="flex justify-between items-center text-xs">
                    <span className={`${overBudget ? 'text-rose-400' : warning ? 'text-amber-400' : 'text-emerald-400'} font-semibold`}>
                        {percent.toFixed(1)}% Consumido
                    </span>
                    <span className="text-slate-500">
                        {active ? "Activo" : "Inactivo"}
                    </span>
                </div>
            </div>
        </div>
    );
}
